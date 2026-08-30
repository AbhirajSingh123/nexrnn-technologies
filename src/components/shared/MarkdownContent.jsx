/**
 * Simple Markdown renderer — Case Study "Full Story" content ke liye.
 *
 * Supported (simple syntax):
 *   ## Heading 2
 *   ### Heading 3
 *   **bold text**
 *   - bullet point
 *   > quote
 *   (blank line = naya paragraph)
 */
function renderInline(text, keyPrefix) {
  // **bold** ko <strong> me badlo
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-bold text-secondary">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={`${keyPrefix}-${i}`}>{part}</span>;
  });
}

export default function MarkdownContent({ content, className = '' }) {
  const lines = (content || '').split('\n');

  // Line-by-line blocks banao (bullets ek saath group hote hain)
  const blocks = [];
  let listItems = null;

  const flushList = () => {
    if (listItems && listItems.length) {
      blocks.push({ type: 'ul', items: listItems });
    }
    listItems = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushList();
      continue;
    }
    if (line.startsWith('### ')) {
      flushList();
      blocks.push({ type: 'h3', text: line.slice(4) });
    } else if (line.startsWith('## ')) {
      flushList();
      blocks.push({ type: 'h2', text: line.slice(3) });
    } else if (line.startsWith('> ')) {
      flushList();
      blocks.push({ type: 'quote', text: line.slice(2) });
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!listItems) listItems = [];
      listItems.push(line.slice(2));
    } else {
      flushList();
      blocks.push({ type: 'p', text: line });
    }
  }
  flushList();

  return (
    <div className={className}>
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'h2':
            return (
              <h2
                key={i}
                className="text-xl sm:text-2xl font-bold text-secondary normal-case pt-5 mt-3 pb-2 border-b-2 border-secondary/10"
              >
                {renderInline(b.text, `h2-${i}`)}
              </h2>
            );
          case 'h3':
            return (
              <h3
                key={i}
                className="text-lg font-bold text-secondary normal-case pt-4 mt-2"
              >
                {renderInline(b.text, `h3-${i}`)}
              </h3>
            );
          case 'quote':
            return (
              <blockquote
                key={i}
                className="border-l-4 border-primary bg-accent px-5 py-3.5 my-4 text-secondary/90 text-base leading-relaxed normal-case"
              >
                {renderInline(b.text, `q-${i}`)}
              </blockquote>
            );
          case 'ul':
            return (
              <ul key={i} className="list-disc pl-6 space-y-1.5 my-3 text-secondary/85 text-base leading-relaxed normal-case">
                {b.items.map((item, j) => (
                  <li key={j}>{renderInline(item, `li-${i}-${j}`)}</li>
                ))}
              </ul>
            );
          default:
            return (
              <p key={i} className="text-secondary/85 text-base leading-relaxed normal-case">
                {renderInline(b.text, `p-${i}`)}
              </p>
            );
        }
      })}
    </div>
  );
}
