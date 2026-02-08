"""
Recursive descent parser for BASIC. Produces AST (Program with Lines and Stmts).
"""
from typing import List, Optional

from .tokens import Token, TokenType
from .ast_nodes import (
    Program, Line, Stmt, Expr,
    PrintStmt, LetStmt, InputStmt, IfStmt, GotoStmt, GosubStmt, ReturnStmt,
    ForStmt, NextStmt, EndStmt, RemStmt,
    NumberExpr, StringExpr, VarExpr, BinaryOpExpr, UnaryOpExpr, BuiltinCallExpr,
)


class ParseError(Exception):
    def __init__(self, message: str, token: Optional[Token] = None):
        self.message = message
        self.token = token
        if token:
            super().__init__(f"{message} at line {token.line}, column {token.column}")
        else:
            super().__init__(message)


class Parser:
    def __init__(self, tokens: List[Token]):
        self.tokens = tokens
        self.pos = 0

    def _current(self) -> Token:
        if self.pos >= len(self.tokens):
            return self.tokens[-1]
        return self.tokens[self.pos]

    def _is_type(self, tt: TokenType) -> bool:
        return self._current().type == tt

    def _consume(self, tt: TokenType, msg: str = "") -> Token:
        if self._current().type != tt:
            raise ParseError(msg or f"Expected {tt.name}", self._current())
        t = self._current()
        self.pos += 1
        return t

    def _consume_if(self, tt: TokenType) -> bool:
        if self._current().type == tt:
            self.pos += 1
            return True
        return False

    def _skip_newlines(self) -> None:
        while self._consume_if(TokenType.NEWLINE):
            pass

    def parse(self) -> Program:
        lines: List[Line] = []
        self._skip_newlines()
        while self._current().type != TokenType.EOF:
            line = self._parse_line()
            if line is not None:
                lines.append(line)
            self._skip_newlines()
        return Program(lines=lines)

    def _parse_line(self) -> Optional[Line]:
        # Optional line number (number at start of line)
        line_num: Optional[int] = None
        if self._is_type(TokenType.NUMBER):
            line_num = int(self._current().value)
            self.pos += 1
        statements: List[Stmt] = []
        # First statement
        stmt = self._parse_statement()
        if stmt is not None:
            statements.append(stmt)
        # More statements after COLON
        while self._consume_if(TokenType.COLON):
            stmt = self._parse_statement()
            if stmt is not None:
                statements.append(stmt)
        # If we had only line number and no statements (or only REM), still add the line
        if line_num is not None or statements:
            return Line(number=line_num, statements=statements)
        return None

    def _parse_statement(self) -> Optional[Stmt]:
        t = self._current()
        if t.type == TokenType.PRINT:
            return self._parse_print()
        if t.type == TokenType.LET:
            return self._parse_let()
        if t.type == TokenType.INPUT:
            return self._parse_input()
        if t.type == TokenType.IF:
            return self._parse_if()
        if t.type == TokenType.GOTO:
            return self._parse_goto()
        if t.type == TokenType.GOSUB:
            return self._parse_gosub()
        if t.type == TokenType.RETURN:
            return self._parse_return()
        if t.type == TokenType.FOR:
            return self._parse_for()
        if t.type == TokenType.NEXT:
            return self._parse_next()
        if t.type == TokenType.END:
            return self._parse_end()
        if t.type == TokenType.REM:
            return self._parse_rem()
        if t.type in (TokenType.NEWLINE, TokenType.COLON, TokenType.EOF):
            return None
        raise ParseError(f"Unexpected token: {t.type.name}", t)

    def _parse_print(self) -> PrintStmt:
        self._consume(TokenType.PRINT)
        items: List[Expr] = []
        while True:
            if self._is_type(TokenType.STRING):
                items.append(StringExpr(value=self._current().value))
                self.pos += 1
            else:
                items.append(self._parse_expression())
            if not self._consume_if(TokenType.COMMA):
                break
        return PrintStmt(items=items)

    def _parse_let(self) -> LetStmt:
        self._consume(TokenType.LET)
        if not self._is_type(TokenType.IDENT):
            raise ParseError("Expected variable name", self._current())
        name = self._current().value.upper()
        self.pos += 1
        self._consume(TokenType.EQ, "Expected =")
        value = self._parse_expression()
        return LetStmt(name=name, value=value)

    def _parse_input(self) -> InputStmt:
        self._consume(TokenType.INPUT)
        variables: List[str] = []
        while True:
            if not self._is_type(TokenType.IDENT):
                raise ParseError("Expected variable name", self._current())
            variables.append(self._current().value.upper())
            self.pos += 1
            if not self._consume_if(TokenType.COMMA):
                break
        return InputStmt(variables=variables)

    def _parse_if(self) -> IfStmt:
        self._consume(TokenType.IF)
        left = self._parse_expression()
        relop = self._parse_relop()
        right = self._parse_expression()
        self._consume(TokenType.THEN, "Expected THEN")
        then_stmt = self._parse_statement()
        if then_stmt is None:
            raise ParseError("Expected statement after THEN", self._current())
        else_stmt = None
        if self._consume_if(TokenType.ELSE):
            else_stmt = self._parse_statement()
        return IfStmt(left=left, relop=relop, right=right, then_stmt=then_stmt, else_stmt=else_stmt)

    def _parse_relop(self) -> str:
        t = self._current()
        if t.type == TokenType.LT:
            self.pos += 1
            return "<"
        if t.type == TokenType.LE:
            self.pos += 1
            return "<="
        if t.type == TokenType.GT:
            self.pos += 1
            return ">"
        if t.type == TokenType.GE:
            self.pos += 1
            return ">="
        if t.type == TokenType.EQ:
            self.pos += 1
            return "="
        if t.type == TokenType.NE:
            self.pos += 1
            return "<>"
        raise ParseError("Expected comparison operator", t)

    def _parse_goto(self) -> GotoStmt:
        self._consume(TokenType.GOTO)
        target = self._parse_expression()
        return GotoStmt(target=target)

    def _parse_gosub(self) -> GosubStmt:
        self._consume(TokenType.GOSUB)
        target = self._parse_expression()
        return GosubStmt(target=target)

    def _parse_return(self) -> ReturnStmt:
        self._consume(TokenType.RETURN)
        return ReturnStmt()

    def _parse_for(self) -> ForStmt:
        self._consume(TokenType.FOR)
        if not self._is_type(TokenType.IDENT):
            raise ParseError("Expected variable in FOR", self._current())
        var = self._current().value.upper()
        self.pos += 1
        self._consume(TokenType.EQ, "Expected = in FOR")
        start = self._parse_expression()
        self._consume(TokenType.TO, "Expected TO in FOR")
        end = self._parse_expression()
        step = None
        if self._consume_if(TokenType.STEP):
            step = self._parse_expression()
        # FOR body: collect statements until NEXT (same line or following lines)
        body: List[Stmt] = []
        while True:
            if self._is_type(TokenType.NEXT):
                self.pos += 1
                if self._is_type(TokenType.IDENT):
                    self.pos += 1  # optional variable after NEXT
                break
            if self._is_type(TokenType.EOF):
                raise ParseError("FOR without NEXT", self._current())
            if self._is_type(TokenType.NEWLINE):
                self._skip_newlines()
                continue
            if self._is_type(TokenType.COLON):
                self.pos += 1
                continue
            if self._is_type(TokenType.NUMBER):
                self.pos += 1  # line number on new line
                continue
            stmt = self._parse_statement()
            if stmt is not None:
                body.append(stmt)
        return ForStmt(var=var, start=start, end=end, step=step, body=body)

    def _parse_next(self) -> NextStmt:
        self._consume(TokenType.NEXT)
        var = None
        if self._is_type(TokenType.IDENT):
            var = self._current().value.upper()
            self.pos += 1
        return NextStmt(var=var)

    def _parse_end(self) -> EndStmt:
        self._consume(TokenType.END)
        return EndStmt()

    def _parse_rem(self) -> RemStmt:
        t = self._consume(TokenType.REM)
        return RemStmt(text=t.value or "")

    def _parse_expression(self) -> Expr:
        # Unary +/-
        if self._consume_if(TokenType.PLUS):
            return self._parse_term()
        if self._consume_if(TokenType.MINUS):
            return UnaryOpExpr(op="-", operand=self._parse_term())
        expr = self._parse_term()
        while True:
            if self._consume_if(TokenType.PLUS):
                expr = BinaryOpExpr(op="+", left=expr, right=self._parse_term())
            elif self._consume_if(TokenType.MINUS):
                expr = BinaryOpExpr(op="-", left=expr, right=self._parse_term())
            else:
                break
        return expr

    def _parse_term(self) -> Expr:
        expr = self._parse_factor()
        while True:
            if self._consume_if(TokenType.STAR):
                expr = BinaryOpExpr(op="*", left=expr, right=self._parse_factor())
            elif self._consume_if(TokenType.SLASH):
                expr = BinaryOpExpr(op="/", left=expr, right=self._parse_factor())
            else:
                break
        return expr

    def _parse_factor(self) -> Expr:
        t = self._current()
        if t.type == TokenType.NUMBER:
            self.pos += 1
            return NumberExpr(value=t.value)
        if t.type == TokenType.STRING:
            self.pos += 1
            return StringExpr(value=t.value)
        if t.type == TokenType.IDENT:
            name = t.value.upper()
            self.pos += 1
            if self._is_type(TokenType.LPAREN):
                self.pos += 1
                args: List[Expr] = []
                if not self._is_type(TokenType.RPAREN):
                    args.append(self._parse_expression())
                    while self._consume_if(TokenType.COMMA):
                        args.append(self._parse_expression())
                self._consume(TokenType.RPAREN, "Expected )")
                return BuiltinCallExpr(name=name, args=args)
            return VarExpr(name=name)
        if self._consume_if(TokenType.LPAREN):
            expr = self._parse_expression()
            self._consume(TokenType.RPAREN, "Expected )")
            return expr
        raise ParseError("Expected expression", t)


def parse(source: str) -> Program:
    from .lexer import tokenize
    tokens = tokenize(source)
    return Parser(tokens).parse()
