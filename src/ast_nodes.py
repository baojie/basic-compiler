"""
Abstract Syntax Tree nodes for BASIC.
"""
from abc import ABC
from dataclasses import dataclass, field
from typing import List, Optional, Union


# --- Expression nodes ---

class Expr(ABC):
    pass


@dataclass
class NumberExpr(Expr):
    value: Union[int, float]


@dataclass
class StringExpr(Expr):
    value: str


@dataclass
class VarExpr(Expr):
    name: str


@dataclass
class BinaryOpExpr(Expr):
    op: str  # '+', '-', '*', '/', '<', '<=', '>', '>=', '=', '<>'
    left: Expr
    right: Expr


@dataclass
class UnaryOpExpr(Expr):
    op: str  # '-', '+'
    operand: Expr


@dataclass
class BuiltinCallExpr(Expr):
    name: str
    args: List[Expr]


# --- Statement nodes ---

class Stmt(ABC):
    pass


@dataclass
class PrintStmt(Stmt):
    items: List[Expr]  # string or expression for each PRINT item


@dataclass
class LetStmt(Stmt):
    name: str
    value: Expr


@dataclass
class InputStmt(Stmt):
    variables: List[str]


@dataclass
class IfStmt(Stmt):
    left: Expr
    relop: str
    right: Expr
    then_stmt: Stmt
    else_stmt: Optional[Stmt] = None


@dataclass
class GotoStmt(Stmt):
    target: Expr  # line number expression


@dataclass
class GosubStmt(Stmt):
    target: Expr


@dataclass
class ReturnStmt(Stmt):
    pass


@dataclass
class ForStmt(Stmt):
    var: str
    start: Expr
    end: Expr
    step: Optional[Expr] = None
    body: List[Stmt] = field(default_factory=list)


@dataclass
class NextStmt(Stmt):
    var: Optional[str] = None


@dataclass
class EndStmt(Stmt):
    pass


@dataclass
class RemStmt(Stmt):
    text: str


# --- Program ---

@dataclass
class Line:
    number: Optional[int]
    statements: List[Stmt]


@dataclass
class Program:
    lines: List[Line]
