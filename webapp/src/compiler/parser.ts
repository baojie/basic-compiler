import { TokenType } from './tokens';
import type { TokenTypeId } from './tokens';
import type { Token } from './tokens';
import { tokenize } from './lexer';
import type { Program, Line, Stmt, Expr } from './ast';

export class ParseError extends Error {
  token: Token | null;
  constructor(message: string, token: Token | null = null) {
    super(token ? `${message} at line ${token.line}, column ${token.column}` : message);
    this.name = 'ParseError';
    this.token = token;
  }
}

export function parse(source: string): Program {
  const tokens = tokenize(source);
  const p = new Parser(tokens);
  return p.parse();
}

class Parser {
  pos = 0;
  tokens: Token[];
  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  current(): Token {
    return this.pos >= this.tokens.length ? this.tokens[this.tokens.length - 1] : this.tokens[this.pos];
  }
  isType(tt: TokenTypeId): boolean {
    return this.current().type === tt;
  }
  consume(tt: TokenTypeId, msg = ''): Token {
    if (this.current().type !== tt) throw new ParseError(msg || `Expected ${tt}`, this.current());
    const t = this.current();
    this.pos++;
    return t;
  }
  consumeIf(tt: TokenTypeId): boolean {
    if (this.current().type === tt) { this.pos++; return true; }
    return false;
  }
  skipNewlines(): void {
    while (this.consumeIf(TokenType.NEWLINE)) {}
  }

  parse(): Program {
    const lines: Line[] = [];
    this.skipNewlines();
    while (this.current().type !== TokenType.EOF) {
      const line = this.parseLine();
      if (line) lines.push(line);
      this.skipNewlines();
    }
    return { lines };
  }

  parseLine(): Line | null {
    let lineNum: number | null = null;
    if (this.isType(TokenType.NUMBER)) {
      lineNum = Number(this.current().value);
      this.pos++;
    }
    const statements: Stmt[] = [];
    let stmt = this.parseStatement();
    if (stmt) statements.push(stmt);
    while (this.consumeIf(TokenType.COLON)) {
      stmt = this.parseStatement();
      if (stmt) statements.push(stmt);
    }
    if (lineNum !== null || statements.length > 0) return { number: lineNum, statements };
    return null;
  }

  parseStatement(): Stmt | null {
    const t = this.current();
    if (t.type === TokenType.PRINT) return this.parsePrint();
    if (t.type === TokenType.LET) return this.parseLet();
    if (t.type === TokenType.INPUT) return this.parseInput();
    if (t.type === TokenType.IF) return this.parseIf();
    if (t.type === TokenType.GOTO) return this.parseGoto();
    if (t.type === TokenType.GOSUB) return this.parseGosub();
    if (t.type === TokenType.RETURN) return this.parseReturn();
    if (t.type === TokenType.FOR) return this.parseFor();
    if (t.type === TokenType.NEXT) return this.parseNext();
    if (t.type === TokenType.END) return this.parseEnd();
    if (t.type === TokenType.REM) return this.parseRem();
    if (t.type === TokenType.NEWLINE || t.type === TokenType.COLON || t.type === TokenType.EOF) return null;
    throw new ParseError(`Unexpected token: ${t.type}`, t);
  }

  parsePrint(): Stmt {
    this.consume(TokenType.PRINT);
    const items: Expr[] = [];
    for (;;) {
      if (this.isType(TokenType.STRING)) {
        items.push({ kind: 'string', value: String(this.current().value) });
        this.pos++;
      } else {
        items.push(this.parseExpression());
      }
      if (!this.consumeIf(TokenType.COMMA)) break;
    }
    return { kind: 'print', items };
  }
  parseLet(): Stmt {
    this.consume(TokenType.LET);
    if (!this.isType(TokenType.IDENT)) throw new ParseError('Expected variable name', this.current());
    const name = String(this.current().value).toUpperCase();
    this.pos++;
    this.consume(TokenType.EQ, 'Expected =');
    const value = this.parseExpression();
    return { kind: 'let', name, value };
  }
  parseInput(): Stmt {
    this.consume(TokenType.INPUT);
    const variables: string[] = [];
    for (;;) {
      if (!this.isType(TokenType.IDENT)) throw new ParseError('Expected variable name', this.current());
      variables.push(String(this.current().value).toUpperCase());
      this.pos++;
      if (!this.consumeIf(TokenType.COMMA)) break;
    }
    return { kind: 'input', variables };
  }
  parseRelop(): string {
    const t = this.current();
    if (t.type === TokenType.LT) { this.pos++; return '<'; }
    if (t.type === TokenType.LE) { this.pos++; return '<='; }
    if (t.type === TokenType.GT) { this.pos++; return '>'; }
    if (t.type === TokenType.GE) { this.pos++; return '>='; }
    if (t.type === TokenType.EQ) { this.pos++; return '='; }
    if (t.type === TokenType.NE) { this.pos++; return '<>'; }
    throw new ParseError('Expected comparison operator', t);
  }
  parseIf(): Stmt {
    this.consume(TokenType.IF);
    const left = this.parseExpression();
    const relop = this.parseRelop();
    const right = this.parseExpression();
    this.consume(TokenType.THEN, 'Expected THEN');
    const then_stmt = this.parseStatement();
    if (!then_stmt) throw new ParseError('Expected statement after THEN', this.current());
    let else_stmt: Stmt | undefined;
    if (this.consumeIf(TokenType.ELSE)) else_stmt = this.parseStatement() ?? undefined;
    return { kind: 'if', left, relop, right, then_stmt, else_stmt };
  }
  parseGoto(): Stmt {
    this.consume(TokenType.GOTO);
    return { kind: 'goto', target: this.parseExpression() };
  }
  parseGosub(): Stmt {
    this.consume(TokenType.GOSUB);
    return { kind: 'gosub', target: this.parseExpression() };
  }
  parseReturn(): Stmt {
    this.consume(TokenType.RETURN);
    return { kind: 'return' };
  }
  parseFor(): Stmt {
    this.consume(TokenType.FOR);
    if (!this.isType(TokenType.IDENT)) throw new ParseError('Expected variable in FOR', this.current());
    const varName = String(this.current().value).toUpperCase();
    this.pos++;
    this.consume(TokenType.EQ, 'Expected = in FOR');
    const start = this.parseExpression();
    this.consume(TokenType.TO, 'Expected TO in FOR');
    const end = this.parseExpression();
    let step: Expr | undefined;
    if (this.consumeIf(TokenType.STEP)) step = this.parseExpression();
    const body: Stmt[] = [];
    for (;;) {
      if (this.isType(TokenType.NEXT)) {
        this.pos++;
        if (this.isType(TokenType.IDENT)) this.pos++;
        break;
      }
      if (this.isType(TokenType.EOF)) throw new ParseError('FOR without NEXT', this.current());
      if (this.isType(TokenType.NEWLINE)) { this.skipNewlines(); continue; }
      if (this.isType(TokenType.COLON)) { this.pos++; continue; }
      if (this.isType(TokenType.NUMBER)) { this.pos++; continue; }
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
    }
    return { kind: 'for', var: varName, start, end, step, body };
  }
  parseNext(): Stmt {
    this.consume(TokenType.NEXT);
    let varName: string | undefined;
    if (this.isType(TokenType.IDENT)) { varName = String(this.current().value).toUpperCase(); this.pos++; }
    return { kind: 'next', var: varName };
  }
  parseEnd(): Stmt {
    this.consume(TokenType.END);
    return { kind: 'end' };
  }
  parseRem(): Stmt {
    const t = this.consume(TokenType.REM);
    return { kind: 'rem', text: String(t.value ?? '') };
  }
  parseExpression(): Expr {
    if (this.consumeIf(TokenType.PLUS)) return this.parseTerm();
    if (this.consumeIf(TokenType.MINUS)) return { kind: 'unary', op: '-', operand: this.parseTerm() };
    let expr = this.parseTerm();
    for (;;) {
      if (this.consumeIf(TokenType.PLUS)) expr = { kind: 'binary', op: '+', left: expr, right: this.parseTerm() };
      else if (this.consumeIf(TokenType.MINUS)) expr = { kind: 'binary', op: '-', left: expr, right: this.parseTerm() };
      else break;
    }
    return expr;
  }
  parseTerm(): Expr {
    let expr = this.parseFactor();
    for (;;) {
      if (this.consumeIf(TokenType.STAR)) expr = { kind: 'binary', op: '*', left: expr, right: this.parseFactor() };
      else if (this.consumeIf(TokenType.SLASH)) expr = { kind: 'binary', op: '/', left: expr, right: this.parseFactor() };
      else break;
    }
    return expr;
  }
  parseFactor(): Expr {
    const t = this.current();
    if (t.type === TokenType.NUMBER) { this.pos++; return { kind: 'number', value: Number(t.value) }; }
    if (t.type === TokenType.STRING) { this.pos++; return { kind: 'string', value: String(t.value) }; }
    if (t.type === TokenType.IDENT) {
      const name = String(t.value).toUpperCase();
      this.pos++;
      if (this.isType(TokenType.LPAREN)) {
        this.pos++;
        const args: Expr[] = [];
        if (!this.isType(TokenType.RPAREN)) {
          args.push(this.parseExpression());
          while (this.consumeIf(TokenType.COMMA)) args.push(this.parseExpression());
        }
        this.consume(TokenType.RPAREN, 'Expected )');
        return { kind: 'builtin', name, args };
      }
      return { kind: 'var', name };
    }
    if (this.consumeIf(TokenType.LPAREN)) {
      const expr = this.parseExpression();
      this.consume(TokenType.RPAREN, 'Expected )');
      return expr;
    }
    throw new ParseError('Expected expression', t);
  }
}
