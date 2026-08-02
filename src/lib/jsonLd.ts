/**
 * Serialize an object for safe embedding inside a
 * <script type="application/ld+json"> tag.
 *
 * Inside an HTML <script> element the content is raw text — HTML entities
 * are NOT decoded, and the only thing that can terminate the element early
 * is the character sequence `</script` (or `<!--`). If any user-derived
 * value in the structured data contained `</script>`, a naive
 * `JSON.stringify(obj)` would let it break out of the script tag and inject
 * arbitrary markup (stored XSS).
 *
 * We escape `<`, `>`, and `&` to their JSON `\uXXXX` unicode escapes. This
 * is the correct, JSON-valid technique: the escaped output still parses to
 * the identical object (so Google / LLM crawlers read the intended data),
 * while `</script>` can no longer appear literally in the page source.
 * (HTML entities like `&lt;` are deliberately NOT used — they would be read
 * verbatim inside a script element and corrupt the structured data.)
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}
