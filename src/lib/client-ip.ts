/**
 * Real visitor IP behind Cloudflare.
 *
 * crecotx.com is proxied by Cloudflare, so the address Vercel reports as the
 * connecting peer (x-real-ip) is a Cloudflare edge node that changes from one
 * request to the next. Keying a rate limit on it spreads one visitor across
 * many buckets (the limit never binds) and lumps unrelated visitors together.
 * Cloudflare passes the visitor's address in cf-connecting-ip.
 *
 * That header is only trustworthy when the request really came through
 * Cloudflare — anyone can send it straight to the Vercel hostname. So it is
 * honored only when the connecting peer is inside Cloudflare's published
 * ranges (https://www.cloudflare.com/ips). Otherwise it is ignored and the
 * platform-set peer address is used, exactly as before.
 */

const CLOUDFLARE_V4 = [
  '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22',
  '141.101.64.0/18', '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20',
  '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13',
  '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22',
];
const CLOUDFLARE_V6 = [
  '2400:cb00::/32', '2606:4700::/32', '2803:f800::/32', '2405:b500::/32',
  '2405:8100::/32', '2a06:98c0::/29', '2c0f:f248::/32',
];

/** Parse an IPv4 or IPv6 literal to a bigint plus its bit width, or null. */
function parseIp(ip: string): { n: bigint; bits: 32 | 128 } | null {
  const s = ip.trim();
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(s)) {
    const parts = s.split('.').map(Number);
    if (parts.some(p => p > 255)) return null;
    return { n: parts.reduce((acc, p) => (acc << BigInt(8)) | BigInt(p), BigInt(0)), bits: 32 };
  }
  if (!s.includes(':') || !/^[0-9a-fA-F:.]+$/.test(s)) return null;
  let head = s;
  let tail4: string | null = null;
  const lastColon = s.lastIndexOf(':');
  if (s.slice(lastColon + 1).includes('.')) {          // ::ffff:1.2.3.4 style
    tail4 = s.slice(lastColon + 1);
    head = s.slice(0, lastColon + 1) + '0:0';
  }
  const halves = head.split('::');
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(':') : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || missing < 0) return null;
  const groups = [...left, ...Array(halves.length === 2 ? missing : 0).fill('0'), ...right];
  if (groups.length !== 8 || groups.some(g => !/^[0-9a-fA-F]{1,4}$/.test(g))) return null;
  let n = groups.reduce((acc, g) => (acc << BigInt(16)) | BigInt(parseInt(g, 16)), BigInt(0));
  if (tail4) {
    const v4 = parseIp(tail4);
    if (!v4) return null;
    const low32 = BigInt(0xffffffff);
    n = (n & ~low32) | v4.n;
  }
  return { n, bits: 128 };
}

function inRange(ip: { n: bigint; bits: 32 | 128 }, cidr: string): boolean {
  const [base, lenStr] = cidr.split('/');
  const b = parseIp(base);
  if (!b || b.bits !== ip.bits) return false;
  const shift = BigInt(ip.bits - Number(lenStr));
  return (ip.n >> shift) === (b.n >> shift);
}

export function isCloudflareIp(ip: string | null | undefined): boolean {
  if (!ip) return false;
  const p = parseIp(ip);
  if (!p) return false;
  return (p.bits === 32 ? CLOUDFLARE_V4 : CLOUDFLARE_V6).some(c => inRange(p, c));
}

export function isValidIp(ip: string | null | undefined): boolean {
  return !!ip && parseIp(ip) !== null;
}

interface HeaderGetter { get(name: string): string | null }

/** The visitor's IP, or 'unknown'. See the file header for the trust model. */
export function resolveClientIp(headers: HeaderGetter): string {
  // The connecting peer, as set by the platform (Vercel) — not client-controlled.
  let peer = headers.get('x-real-ip')?.trim() || '';
  if (!peer) {
    const xff = headers.get('x-forwarded-for');
    if (xff) {
      const parts = xff.split(',').map(s => s.trim()).filter(Boolean);
      if (parts.length) peer = parts[parts.length - 1];
    }
  }
  const cf = headers.get('cf-connecting-ip')?.trim();
  if (cf && isValidIp(cf) && isCloudflareIp(peer)) return cf;
  return peer || 'unknown';
}
