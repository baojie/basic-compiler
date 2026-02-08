"""
Lexer for BASIC source code.
"""
from typing import List

from .tokens import Token, TokenType, KEYWORDS


class LexerError(Exception):
    def __init__(self, message: str, line: int, column: int):
        self.message = message
        self.line = line
        self.column = column
        super().__init__(f"{message} at line {line}, column {column}")


class Lexer:
    def __init__(self, source: str):
        self.source = source
        self.pos = 0
        self.line = 1
        self.column = 1
        self.line_start = 0

    def _current(self) -> str:
        if self.pos >= len(self.source):
            return "\0"
        return self.source[self.pos]

    def _peek(self, offset: int = 1) -> str:
        p = self.pos + offset
        if p >= len(self.source):
            return "\0"
        return self.source[p]

    def _advance(self) -> str:
        if self.pos >= len(self.source):
            return "\0"
        c = self.source[self.pos]
        self.pos += 1
        if c == "\n":
            self.line += 1
            self.column = 1
            self.line_start = self.pos
        else:
            self.column += 1
        return c

    def _skip_whitespace(self) -> None:
        while self._current() in " \t\r":
            self._advance()

    def _read_number(self) -> Token:
        start_line, start_col = self.line, self.column
        buf = []
        while self._current().isdigit():
            buf.append(self._advance())
        if self._current() == "." and self._peek().isdigit():
            buf.append(self._advance())
            while self._current().isdigit():
                buf.append(self._advance())
            value = float("".join(buf))
        else:
            value = int("".join(buf))
        return Token(TokenType.NUMBER, value, start_line, start_col)

    def _read_string(self) -> Token:
        start_line, start_col = self.line, self.column
        quote = self._current()
        if quote not in '"\'':
            raise LexerError("Expected string quote", self.line, self.column)
        self._advance()
        buf = []
        while self._current() != quote and self._current() != "\0":
            if self._current() == "\n":
                raise LexerError("Unterminated string", self.line, self.column)
            if self._current() == "\\":
                self._advance()
                c = self._current()
                if c == "n":
                    buf.append("\n")
                elif c == "t":
                    buf.append("\t")
                elif c == quote:
                    buf.append(quote)
                else:
                    buf.append(c)
                self._advance()
            else:
                buf.append(self._advance())
        if self._current() != quote:
            raise LexerError("Unterminated string", self.line, self.column)
        self._advance()
        return Token(TokenType.STRING, "".join(buf), start_line, start_col)

    def _read_ident_or_keyword(self) -> Token:
        start_line, start_col = self.line, self.column
        buf = []
        c = self._current()
        if not (c.isalpha() or c == "_"):
            raise LexerError("Expected identifier", self.line, self.column)
        while c.isalnum() or c == "_":
            buf.append(self._advance())
            c = self._current()
        name = "".join(buf).upper()
        token_type = KEYWORDS.get(name, TokenType.IDENT)
        value = name if token_type == TokenType.IDENT else None
        if token_type == TokenType.IDENT:
            value = "".join(buf)  # preserve original case for variable names in some BASICs; we use upper
        return Token(token_type, value or name, start_line, start_col)

    def _read_rem(self) -> Token:
        start_line, start_col = self.line, self.column
        # REM has been consumed; rest of line is comment text
        buf = []
        while self._current() != "\n" and self._current() != "\0":
            buf.append(self._advance())
        return Token(TokenType.REM, "".join(buf).strip(), start_line, start_col)

    def _next_token(self) -> Token:
        self._skip_whitespace()
        start_line, start_col = self.line, self.column
        c = self._current()

        if c == "\0":
            return Token(TokenType.EOF, None, start_line, start_col)

        if c == "\n":
            self._advance()
            return Token(TokenType.NEWLINE, None, start_line, start_col)

        if c == ":":
            self._advance()
            return Token(TokenType.COLON, ":", start_line, start_col)

        if c == '"' or c == "'":
            return self._read_string()

        if c.isdigit():
            return self._read_number()

        if c.isalpha() or c == "_":
            # Check for REM to consume rest of line
            start = self.pos
            buf = []
            while self._current().isalnum() or self._current() == "_":
                buf.append(self._advance())
            name = "".join(buf).upper()
            if name == "REM":
                return self._read_rem()
            # Put back and use normal ident/keyword
            self.pos = start
            self.line, self.column = start_line, start_col
            return self._read_ident_or_keyword()

        # Two-char operators
        if c == "<":
            self._advance()
            if self._current() == ">":
                self._advance()
                return Token(TokenType.NE, "<>", start_line, start_col)
            if self._current() == "=":
                self._advance()
                return Token(TokenType.LE, "<=", start_line, start_col)
            return Token(TokenType.LT, "<", start_line, start_col)
        if c == ">":
            self._advance()
            if self._current() == "=":
                self._advance()
                return Token(TokenType.GE, ">=", start_line, start_col)
            return Token(TokenType.GT, ">", start_line, start_col)

        # Single-char
        if c == "+":
            self._advance()
            return Token(TokenType.PLUS, "+", start_line, start_col)
        if c == "-":
            self._advance()
            return Token(TokenType.MINUS, "-", start_line, start_col)
        if c == "*":
            self._advance()
            return Token(TokenType.STAR, "*", start_line, start_col)
        if c == "/":
            self._advance()
            return Token(TokenType.SLASH, "/", start_line, start_col)
        if c == "=":
            self._advance()
            return Token(TokenType.EQ, "=", start_line, start_col)
        if c == "(":
            self._advance()
            return Token(TokenType.LPAREN, "(", start_line, start_col)
        if c == ")":
            self._advance()
            return Token(TokenType.RPAREN, ")", start_line, start_col)
        if c == ",":
            self._advance()
            return Token(TokenType.COMMA, ",", start_line, start_col)

        raise LexerError(f"Unexpected character: {c!r}", self.line, self.column)

    def tokenize(self) -> List[Token]:
        tokens = []
        while True:
            t = self._next_token()
            tokens.append(t)
            if t.type == TokenType.EOF:
                break
        return tokens


def tokenize(source: str) -> List[Token]:
    return Lexer(source).tokenize()
