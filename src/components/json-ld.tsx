/** Renders a JSON-LD <script> tag safely — escapes "<" so a value
 * containing "</script>" (or any other tag) can't break out of the script
 * context, since this goes in via dangerouslySetInnerHTML. */
export function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
  );
}
