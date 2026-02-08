import type { Token } from './tokens';
import { TokenType, KEYWORDS } from './tokens';

export class LexerError extends Error {
  line: number;
  column: number;
  constructor(message: string, line: number, column: number) {
    super(`${message} at line ${line}, column ${column}`);
    this.name = 'LexerError';
    this.line = line;
    this.column = column;
  }
}

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0, line = 1, column = 1;

  function current(): string {
    return pos >= source.length ? '\0' : source[pos];
  }
  function peek(off = 1): string {
    const p = pos + off;
    return p >= source.length ? '\0' : source[p];
  }
  function advance(): string {
    if (pos >= source.length) return '\0';
    const c = source[pos++];
    if (c === '\n') { line++; column = 1; } else { column++; }
    return c;
  }
  function skipWhitespace(): void {
    while (current() === ' ' || current() === '\t' || current() === '\r') advance();
  }
  function readNumber(): Token {
    const startLine = line, startCol = column;
    const buf: string[] = [];
    while (/\d/.test(current())) buf.push(advance());
    if (current() === '.' && /\d/.test(peek())) {
      buf.push(advance());
      while (/\d/.test(current())) buf.push(advance());
      return { type: TokenType.NUMBER, value: parseFloat(buf.join('')), line: startLine, column: startCol };
    }
    return { type: TokenType.NUMBER, value: parseInt(buf.join(''), 10), line: startLine, column: startCol };
  }
  function readString(): Token {
    const startLine = line, startCol = column;
    const quote = current();
    if (quote !== '"' && quote !== "'") throw new LexerError('Expected string quote', line, column);
    advance();
    const buf: string[] = [];
    while (current() !== quote && current() !== '\0') {
      if (current() === '\n') throw new LexerError('Unterminated string', line, column);
      if (current() === '\\') {
        advance();
        const c = current();
        if (c === 'n') buf.push('\n');
        else if (c === 't') buf.push('\t');
        else if (c === quote) buf.push(quote);
        else buf.push(c);
        advance();
      } else buf.push(advance());
    }
    if (current() !== quote) throw new LexerError('Unterminated string', line, column);
    advance();
    return { type: TokenType.STRING, value: buf.join(''), line: startLine, column: startCol };
  }
  function readIdentOrKeyword(): Token {
    const startLine = line, startCol = column;
    const buf: string[] = [];
    if (!/[a-zA-Z_]/.test(current())) throw new LexerError('Expected identifier', line, column);
    while (/[a-zA-Z0-9_]/.test(current())) buf.push(advance());
    const name = buf.join('').toUpperCase();
    if (name === 'REM') {
      const rest: string[] = [];
      while (current() !== '\n' && current() !== '\0') rest.push(advance());
      return { type: TokenType.REM, value: rest.join('').trim(), line: startLine, column: startCol };
    }
    const tokenType = KEYWORDS[name] ?? TokenType.IDENT;
    const value = tokenType === TokenType.IDENT ? buf.join('') : name;
    return { type: tokenType, value, line: startLine, column: startCol };
  }
  function nextToken(): Token {
    skipWhitespace();
    const startLine = line, startCol = column;
    const c = current();
    if (c === '\0') return { type: TokenType.EOF, value: null, line: startLine, column: startCol };
    if (c === '\n') { advance(); return { type: TokenType.NEWLINE, value: null, line: startLine, column: startCol }; }
    if (c === ':') { advance(); return { type: TokenType.COLON, value: ':', line: startLine, column: startCol }; }
    if (c === '"' || c === "'") return readString();
    if (/\d/.test(c)) return readNumber();
    if (/[a-zA-Z_]/.test(c)) return readIdentOrKeyword();
    if (c === '<') {
      advance();
      if (current() === '>') { advance(); return { type: TokenType.NE, value: '<>', line: startLine, column: startCol }; }
      if (current() === '=') { advance(); return { type: TokenType.LE, value: '<=', line: startLine, column: startCol }; }
      return { type: TokenType.LT, value: '<', line: startLine, column: startCol };
    }
    if (c === '>') {
      advance();
      if (current() === '=') { advance(); return { type: TokenType.GE, value: '>=', line: startLine, column: startCol }; }
      return { type: TokenType.GT, value: '>', line: startLine, column: startCol };
    }
    const single: [string, (typeof TokenType)[keyof typeof TokenType]][] = [
      ['+', TokenType.PLUS], ['-', TokenType.MINUS], ['*', TokenType.STAR], ['/', TokenType.SLASH],
      ['=', TokenType.EQ], ['(', TokenType.LPAREN], [')', TokenType.RPAREN], [',', TokenType.COMMA]
    ];
    for (const [ch, tt] of single) {
      if (c === ch) { advance(); return { type: tt, value: ch, line: startLine, column: startCol }; }
    }
    throw new LexerError(`Unexpected character: ${c}`, line, column);
  }

  for (;;) {
    const t = nextToken();
    tokens.push(t);
    if (t.type === TokenType.EOF) break;
  }
  return tokens;
}
