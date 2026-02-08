const KEYWORDS = new Set([
  'PRINT', 'LET', 'INPUT', 'IF', 'THEN', 'ELSE', 'END',
  'GOTO', 'GOSUB', 'RETURN', 'FOR', 'TO', 'STEP', 'NEXT',
]);

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightLine(line: string): string {
  const result: string[] = [];
  let i = 0;

  // Leading line number
  while (i < line.length && line[i] === ' ') { result.push(' '); i++; }
  const numStart = i;
  while (i < line.length && /\d/.test(line[i])) i++;
  if (i > numStart && (i >= line.length || line[i] === ' ')) {
    result.push(`<span class="hl-linenum">${line.slice(numStart, i)}</span>`);
  } else {
    i = numStart;
  }

  while (i < line.length) {
    const ch = line[i];

    // Whitespace
    if (ch === ' ' || ch === '\t') {
      result.push(ch);
      i++;
      continue;
    }

    // String
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      while (j < line.length && line[j] !== quote) {
        if (line[j] === '\\') j++;
        j++;
      }
      if (j < line.length) j++;
      result.push(`<span class="hl-string">${escapeHtml(line.slice(i, j))}</span>`);
      i = j;
      continue;
    }

    // Number
    if (/\d/.test(ch)) {
      let j = i;
      while (j < line.length && /[\d.]/.test(line[j])) j++;
      result.push(`<span class="hl-number">${line.slice(i, j)}</span>`);
      i = j;
      continue;
    }

    // Word (keyword or identifier)
    if (/[A-Za-z_]/.test(ch)) {
      let j = i;
      while (j < line.length && /[A-Za-z0-9_]/.test(line[j])) j++;
      const word = line.slice(i, j);
      const upper = word.toUpperCase();

      if (upper === 'REM') {
        // Rest of line is comment
        result.push(`<span class="hl-comment">${escapeHtml(line.slice(i))}</span>`);
        return result.join('');
      }

      if (KEYWORDS.has(upper)) {
        result.push(`<span class="hl-keyword">${escapeHtml(word)}</span>`);
      } else {
        result.push(escapeHtml(word));
      }
      i = j;
      continue;
    }

    // Operators
    if ('+-*/=<>:,()'.includes(ch)) {
      let op = ch;
      if ((ch === '<' || ch === '>') && i + 1 < line.length && (line[i + 1] === '=' || line[i + 1] === '>')) {
        op = line.slice(i, i + 2);
      }
      result.push(`<span class="hl-operator">${escapeHtml(op)}</span>`);
      i += op.length;
      continue;
    }

    result.push(escapeHtml(ch));
    i++;
  }

  return result.join('');
}

export function highlightBasic(source: string): string {
  return source.split('\n').map(highlightLine).join('\n');
}
