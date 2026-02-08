"""
Token definitions for the BASIC lexer.
"""
from enum import Enum, auto
from dataclasses import dataclass
from typing import Any, Optional


class TokenType(Enum):
    # Literals and identifiers
    NUMBER = auto()
    STRING = auto()
    IDENT = auto()
    # Line number (leading number at start of line)
    LINENUM = auto()
    # Keywords
    PRINT = auto()
    LET = auto()
    INPUT = auto()
    IF = auto()
    THEN = auto()
    ELSE = auto()
    END = auto()
    GOTO = auto()
    GOSUB = auto()
    RETURN = auto()
    FOR = auto()
    TO = auto()
    STEP = auto()
    NEXT = auto()
    REM = auto()
    # Operators
    PLUS = auto()
    MINUS = auto()
    STAR = auto()
    SLASH = auto()
    EQ = auto()       # = (assignment or equality)
    LT = auto()
    LE = auto()
    GT = auto()
    GE = auto()
    NE = auto()       # <>
    LPAREN = auto()
    RPAREN = auto()
    COMMA = auto()
    COLON = auto()
    # Special
    NEWLINE = auto()
    EOF = auto()


KEYWORDS = {
    "PRINT": TokenType.PRINT,
    "LET": TokenType.LET,
    "INPUT": TokenType.INPUT,
    "IF": TokenType.IF,
    "THEN": TokenType.THEN,
    "ELSE": TokenType.ELSE,
    "END": TokenType.END,
    "GOTO": TokenType.GOTO,
    "GOSUB": TokenType.GOSUB,
    "RETURN": TokenType.RETURN,
    "FOR": TokenType.FOR,
    "TO": TokenType.TO,
    "STEP": TokenType.STEP,
    "NEXT": TokenType.NEXT,
    "REM": TokenType.REM,
}


@dataclass
class Token:
    type: TokenType
    value: Any
    line: int
    column: int

    def __repr__(self) -> str:
        return f"Token({self.type.name}, {self.value!r}, {self.line}:{self.column})"
