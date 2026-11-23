import type { ReactNode } from 'react';

/** Shared building blocks for the Market Brief editions. */

export function A({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="text-gold-dark underline underline-offset-2 hover:text-gold">{children}</a>;
}

export function Table({ head, rows, note }: { head: string[]; rows: ReactNode[][]; note?: ReactNode }) {
  return (
    <div className="my-5">
      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[560px] text-left text-body-sm">
          <thead className="bg-background-cream text-caption uppercase tracking-wide text-foreground-muted">
            <tr>{head.map((h, i) => <th key={i} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-border/70">
                {r.map((c, j) => <td key={j} className={`px-4 py-3 ${j === 0 ? 'font-semibold text-primary' : 'text-foreground-muted'}`}>{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && <p className="mt-2 text-caption text-foreground-muted">{note}</p>}
    </div>
  );
}

export const H2 = ({ id, children }: { id: string; children: ReactNode }) => (
  <h2 id={id} className="mt-12 scroll-mt-28 font-heading text-display-sm font-bold text-primary">{children}</h2>
);
export const H3 = ({ children }: { children: ReactNode }) => (
  <h3 className="mt-8 font-heading text-heading-lg font-semibold text-primary">{children}</h3>
);
export const UL = ({ children }: { children: ReactNode }) => (
  <ul className="mt-3 list-disc space-y-2 pl-5 text-body text-foreground-muted leading-relaxed marker:text-gold">{children}</ul>
);
