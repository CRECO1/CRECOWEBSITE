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
      style={{
        position: 'absolute',
        left: '-9999px',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        opacity: 0,
        pointerEvents: 'none',
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
