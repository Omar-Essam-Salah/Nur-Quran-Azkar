// Minimal HTML sanitizer for third-party content we render with
// dangerouslySetInnerHTML (tafsir text fetched from the quran.com API). The
// source is trusted and served over HTTPS, but rendering remote HTML inside a
// WebView is a place we don't want to take chances — so we strip anything that
// could execute: <script>/<style>/<iframe>/<object>/<embed>/<link>/<meta>,
// every on* event-handler attribute, and javascript: URLs. Tafsir only needs
// basic formatting (p, span, sup, b/i, br), which all survive.
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('script, style, iframe, object, embed, link, meta, base, form').forEach((el) => el.remove());
    doc.querySelectorAll('*').forEach((el) => {
      for (const attr of Array.from(el.attributes)) {
        const name = attr.name.toLowerCase();
        const value = attr.value;
        if (name.startsWith('on') || name === 'style'
          || (['href', 'src', 'xlink:href'].includes(name) && /^\s*(javascript|data|vbscript):/i.test(value))) {
          el.removeAttribute(attr.name);
        }
      }
    });
    return doc.body.innerHTML;
  } catch {
    return '';
  }
}
