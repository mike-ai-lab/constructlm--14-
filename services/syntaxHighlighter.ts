// Lightweight syntax highlighter for code editor
export const highlightCode = (code: string): string => {
  // Escape HTML
  let html = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Keywords
  html = html.replace(
    /\b(const|let|var|function|return|if|else|for|while|import|export|default|from|as|class|extends|interface|type|async|await|try|catch|finally|throw|new|this|super|static|public|private|protected|React|useState|useEffect|useRef|useCallback|useMemo|useContext|useReducer)\b/g,
    '<span class="syntax-keyword">$1</span>'
  );

  // Strings (single, double, backtick) - must come before comments
  html = html.replace(/(['"`])((?:\\.|(?!\1).)*?)\1/g, '<span class="syntax-string">$&</span>');

  // Comments
  html = html.replace(/(&lt;\/\/.*)/g, '<span class="syntax-comment">$1</span>');

  // Numbers
  html = html.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="syntax-number">$1</span>');

  // JSX/HTML tags
  html = html.replace(/(&lt;\/?[A-Z][\w-]*)/g, '<span class="syntax-tag">$1</span>');
  html = html.replace(/(&lt;\/?[a-z][\w-]*)/g, '<span class="syntax-tag">$1</span>');

  // Attributes
  html = html.replace(/(\w+)(?==)/g, '<span class="syntax-attribute">$1</span>');

  return html;
};
