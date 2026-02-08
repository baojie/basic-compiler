export type Expr =
  | { kind: 'number'; value: number }
  | { kind: 'string'; value: string }
  | { kind: 'var'; name: string }
  | { kind: 'binary'; op: string; left: Expr; right: Expr }
  | { kind: 'unary'; op: string; operand: Expr }
  | { kind: 'builtin'; name: string; args: Expr[] };

export type Stmt =
  | { kind: 'print'; items: Expr[] }
  | { kind: 'let'; name: string; value: Expr }
  | { kind: 'input'; variables: string[] }
  | { kind: 'if'; left: Expr; relop: string; right: Expr; then_stmt: Stmt; else_stmt?: Stmt }
  | { kind: 'goto'; target: Expr }
  | { kind: 'gosub'; target: Expr }
  | { kind: 'return' }
  | { kind: 'for'; var: string; start: Expr; end: Expr; step?: Expr; body: Stmt[] }
  | { kind: 'next'; var?: string }
  | { kind: 'end' }
  | { kind: 'rem'; text: string };

export interface Line {
  number: number | null;
  statements: Stmt[];
}

export interface Program {
  lines: Line[];
}
