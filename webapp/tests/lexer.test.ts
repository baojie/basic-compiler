/**
 * Lexer unit tests: verify tokenization of BASIC source.
 */
import { describe, it, expect } from 'vitest';
import { tokenize, LexerError } from '../src/compiler/lexer';
import { TokenType } from '../src/compiler/tokens';

function types(source: string) {
  return tokenize(source).map((t) => t.type);
}

function values(source: string) {
  return tokenize(source)
    .filter((t) => t.type !== TokenType.EOF)
    .map((t) => t.value);
}

describe('Lexer: numbers', () => {
  it('should tokenize integer', () => {
    const tokens = tokenize('42');
    expect(tokens[0].type).toBe(TokenType.NUMBER);
    expect(tokens[0].value).toBe(42);
  });

  it('should tokenize float', () => {
    const tokens = tokenize('3.14');
    expect(tokens[0].type).toBe(TokenType.NUMBER);
    expect(tokens[0].value).toBeCloseTo(3.14);
  });

  it('should tokenize zero', () => {
    const tokens = tokenize('0');
    expect(tokens[0].type).toBe(TokenType.NUMBER);
    expect(tokens[0].value).toBe(0);
  });
});

describe('Lexer: strings', () => {
  it('should tokenize double-quoted string', () => {
    const tokens = tokenize('"hello"');
    expect(tokens[0].type).toBe(TokenType.STRING);
    expect(tokens[0].value).toBe('hello');
  });

  it('should tokenize single-quoted string', () => {
    const tokens = tokenize("'world'");
    expect(tokens[0].type).toBe(TokenType.STRING);
    expect(tokens[0].value).toBe('world');
  });

  it('should handle escape sequences', () => {
    const tokens = tokenize('"a\\nb"');
    expect(tokens[0].value).toBe('a\nb');
  });

  it('should handle tab escape', () => {
    const tokens = tokenize('"a\\tb"');
    expect(tokens[0].value).toBe('a\tb');
  });

  it('should throw on unterminated string', () => {
    expect(() => tokenize('"hello')).toThrow(LexerError);
  });

  it('should throw on newline inside string', () => {
    expect(() => tokenize('"hello\nworld"')).toThrow(LexerError);
  });
});

describe('Lexer: keywords', () => {
  it('should recognize all keywords', () => {
    const keywords = [
      ['PRINT', TokenType.PRINT],
      ['LET', TokenType.LET],
      ['INPUT', TokenType.INPUT],
      ['IF', TokenType.IF],
      ['THEN', TokenType.THEN],
      ['ELSE', TokenType.ELSE],
      ['END', TokenType.END],
      ['GOTO', TokenType.GOTO],
      ['GOSUB', TokenType.GOSUB],
      ['RETURN', TokenType.RETURN],
      ['FOR', TokenType.FOR],
      ['TO', TokenType.TO],
      ['STEP', TokenType.STEP],
      ['NEXT', TokenType.NEXT],
    ] as const;

    for (const [word, expected] of keywords) {
      const tokens = tokenize(word);
      expect(tokens[0].type).toBe(expected);
    }
  });

  it('should be case insensitive for keywords', () => {
    const tokens = tokenize('print');
    expect(tokens[0].type).toBe(TokenType.PRINT);
  });

  it('should tokenize REM as comment', () => {
    const tokens = tokenize('REM this is a comment');
    expect(tokens[0].type).toBe(TokenType.REM);
    expect(tokens[0].value).toBe('this is a comment');
  });
});

describe('Lexer: identifiers', () => {
  it('should tokenize simple identifier', () => {
    const tokens = tokenize('X');
    expect(tokens[0].type).toBe(TokenType.IDENT);
  });

  it('should tokenize multi-char identifier', () => {
    const tokens = tokenize('myVar');
    expect(tokens[0].type).toBe(TokenType.IDENT);
    expect(tokens[0].value).toBe('myVar');
  });

  it('should tokenize identifier with underscore', () => {
    const tokens = tokenize('my_var');
    expect(tokens[0].type).toBe(TokenType.IDENT);
  });

  it('should tokenize identifier with digits', () => {
    const tokens = tokenize('X1');
    expect(tokens[0].type).toBe(TokenType.IDENT);
  });
});

describe('Lexer: operators', () => {
  it('should tokenize arithmetic operators', () => {
    const toks = tokenize('+ - * /');
    const ops = toks.filter((t) => t.type !== TokenType.EOF);
    expect(ops.map((t) => t.type)).toEqual([
      TokenType.PLUS, TokenType.MINUS, TokenType.STAR, TokenType.SLASH,
    ]);
  });

  it('should tokenize comparison operators', () => {
    expect(tokenize('<')[0].type).toBe(TokenType.LT);
    expect(tokenize('<=')[0].type).toBe(TokenType.LE);
    expect(tokenize('>')[0].type).toBe(TokenType.GT);
    expect(tokenize('>=')[0].type).toBe(TokenType.GE);
    expect(tokenize('=')[0].type).toBe(TokenType.EQ);
    expect(tokenize('<>')[0].type).toBe(TokenType.NE);
  });

  it('should tokenize delimiters', () => {
    expect(tokenize('(')[0].type).toBe(TokenType.LPAREN);
    expect(tokenize(')')[0].type).toBe(TokenType.RPAREN);
    expect(tokenize(',')[0].type).toBe(TokenType.COMMA);
    expect(tokenize(':')[0].type).toBe(TokenType.COLON);
  });
});

describe('Lexer: newlines and whitespace', () => {
  it('should produce NEWLINE tokens', () => {
    const toks = tokenize('A\nB');
    expect(toks.map((t) => t.type)).toEqual([
      TokenType.IDENT, TokenType.NEWLINE, TokenType.IDENT, TokenType.EOF,
    ]);
  });

  it('should skip spaces and tabs', () => {
    const toks = tokenize('  A  ');
    expect(toks[0].type).toBe(TokenType.IDENT);
  });

  it('should end with EOF', () => {
    const toks = tokenize('');
    expect(toks[toks.length - 1].type).toBe(TokenType.EOF);
  });
});

describe('Lexer: line/column tracking', () => {
  it('should track column positions', () => {
    const toks = tokenize('LET X = 5');
    expect(toks[0].column).toBe(1);  // LET
    expect(toks[0].line).toBe(1);
  });

  it('should track line numbers across newlines', () => {
    const toks = tokenize('A\nB\nC');
    const idents = toks.filter((t) => t.type === TokenType.IDENT);
    expect(idents[0].line).toBe(1);
    expect(idents[1].line).toBe(2);
    expect(idents[2].line).toBe(3);
  });
});

describe('Lexer: full statement tokenization', () => {
  it('should tokenize LET assignment', () => {
    const toks = tokenize('LET X = 5');
    const nonEof = toks.filter((t) => t.type !== TokenType.EOF);
    expect(nonEof.map((t) => t.type)).toEqual([
      TokenType.LET, TokenType.IDENT, TokenType.EQ, TokenType.NUMBER,
    ]);
  });

  it('should tokenize PRINT with string', () => {
    const toks = tokenize('PRINT "hello"');
    const nonEof = toks.filter((t) => t.type !== TokenType.EOF);
    expect(nonEof.map((t) => t.type)).toEqual([TokenType.PRINT, TokenType.STRING]);
  });

  it('should tokenize FOR statement', () => {
    const toks = tokenize('FOR I = 1 TO 10 STEP 2');
    const nonEof = toks.filter((t) => t.type !== TokenType.EOF);
    expect(nonEof.map((t) => t.type)).toEqual([
      TokenType.FOR, TokenType.IDENT, TokenType.EQ,
      TokenType.NUMBER, TokenType.TO, TokenType.NUMBER,
      TokenType.STEP, TokenType.NUMBER,
    ]);
  });
});

describe('Lexer: error handling', () => {
  it('should throw on unexpected character', () => {
    expect(() => tokenize('@')).toThrow(LexerError);
  });

  it('should include position in error', () => {
    try {
      tokenize('@');
    } catch (e) {
      expect(e).toBeInstanceOf(LexerError);
      expect((e as LexerError).line).toBe(1);
      expect((e as LexerError).column).toBe(1);
    }
  });
});
