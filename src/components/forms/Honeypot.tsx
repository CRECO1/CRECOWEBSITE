/**
 * Honeypot field — invisible to humans, irresistible to dumb bots.
 *
 * Many spam-bot frameworks blindly fill every text input on a form. By adding
 * a hidden field that no real user can see or tab to, we get a 95%+ accurate
 * spam signal at zero UX cost. Pairs with reCAPTCHA: reCAPTCHA catches
 * sophisticated bots via behavioral scoring; honeypot catches the dumber 80%
 * cheaply, and works even when reCAPTCHA isn't configured.
 *
 * Usage:
 *   <Honeypot name="website" />        // in your form JSX
 *   const honeypot = formData.get('website');
 *   if (honeypot) reject as spam;      // server-side check
 */

interface Props {
  /** Field name. Use something innocuous-sounding that bots will fill. */
  name?: string;
}

export function Honeypot({ name = 'website' }: Props) {
  return (
    <div
      aria-hidden="true"
      // sr-only clip pattern — zero layout footprint, no off-screen positioning.
      // left:-9999px isn't reliably clipped by body{overflow-x:hidden} on iOS
      // Safari, which makes pages pannable / "not scaling" on iPhones. This stays
      // in the DOM so bots still fill it.
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      <label htmlFor={`hp-${name}`}>
        {/* Real screen-reader users would never tab here because of aria-hidden */}
        Don&apos;t fill this in if you&apos;re human:
      </label>
      <input
        type="text"
        id={`hp-${name}`}
        name={name}
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}
