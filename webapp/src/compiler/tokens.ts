export const TokenType = {
  NUMBER: 0, STRING: 1, IDENT: 2, LINENUM: 3,
  PRINT: 4, LET: 5, INPUT: 6, IF: 7, THEN: 8, ELSE: 9, END: 10, GOTO: 11, GOSUB: 12, RETURN: 13,
  FOR: 14, TO: 15, STEP: 16, NEXT: 17, REM: 18,
  PLUS: 19, MINUS: 20, STAR: 21, SLASH: 22, EQ: 23, LT: 24, LE: 25, GT: 26, GE: 27, NE: 28,
  LPAREN: 29, RPAREN: 30, COMMA: 31, COLON: 32, NEWLINE: 33, EOF: 34,
} as const;

export type TokenTypeId = (typeof TokenType)[keyof typeof TokenType];

export interface Token {
  type: TokenTypeId;
  value: string | number | null;
  line: number;
  column: number;
}

export const KEYWORDS: Record<string, TokenTypeId> = {
  PRINT: TokenType.PRINT, LET: TokenType.LET, INPUT: TokenType.INPUT,
  IF: TokenType.IF, THEN: TokenType.THEN, ELSE: TokenType.ELSE, END: TokenType.END,
  GOTO: TokenType.GOTO, GOSUB: TokenType.GOSUB, RETURN: TokenType.RETURN,
  FOR: TokenType.FOR, TO: TokenType.TO, STEP: TokenType.STEP, NEXT: TokenType.NEXT,
  REM: TokenType.REM,
};
