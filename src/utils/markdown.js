import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,
  gfm: true
});

export function renderMarkdown(text) {
  if (!text) return '';
  const rawHtml = marked(text);
  return DOMPurify.sanitize(rawHtml);
}

export function applyHighlights(htmlContent, highlights = []) {
  if (!highlights || highlights.length === 0) {
    return htmlContent;
  }

  // Sort highlights by offset (descending) to avoid position shifts
  const sortedHighlights = [...highlights].sort((a, b) => b.offset_start - a.offset_start);

  // Create a temporary div to work with DOM
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;

  // Get text content for offset calculations
  const textContent = tempDiv.textContent || tempDiv.innerText || '';

  sortedHighlights.forEach((highlight, index) => {
    const { offset_start, offset_end, text } = highlight;

    // Find and wrap the text
    const walker = document.createTreeWalker(
      tempDiv,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let charCount = 0;
    let node;

    while (node = walker.nextNode()) {
      const nodeLength = node.textContent.length;
      const nodeStart = charCount;
      const nodeEnd = charCount + nodeLength;

      // Check if highlight overlaps with this text node
      if (offset_start < nodeEnd && offset_end > nodeStart) {
        const relativeStart = Math.max(0, offset_start - nodeStart);
        const relativeEnd = Math.min(nodeLength, offset_end - nodeStart);

        if (relativeStart < relativeEnd) {
          const before = node.textContent.substring(0, relativeStart);
          const highlighted = node.textContent.substring(relativeStart, relativeEnd);
          const after = node.textContent.substring(relativeEnd);

          const span = document.createElement('span');
          span.className = 'text-highlight';
          span.setAttribute('data-highlight-id', index);
          span.textContent = highlighted;

          const fragment = document.createDocumentFragment();
          if (before) fragment.appendChild(document.createTextNode(before));
          fragment.appendChild(span);
          if (after) fragment.appendChild(document.createTextNode(after));

          node.parentNode.replaceChild(fragment, node);
        }
      }

      charCount = nodeEnd;
    }
  });

  return tempDiv.innerHTML;
}
