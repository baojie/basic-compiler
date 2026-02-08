"""
Transpiles BASIC AST to Python source code for execution.
"""
from typing import List, Dict, Any

from ..ast_nodes import (
    Program, Line, Stmt, Expr,
    PrintStmt, LetStmt, InputStmt, IfStmt, GotoStmt, GosubStmt, ReturnStmt,
    ForStmt, NextStmt, EndStmt, RemStmt,
    NumberExpr, StringExpr, VarExpr, BinaryOpExpr, UnaryOpExpr, BuiltinCallExpr,
)


class Transpiler:
    def __init__(self) -> None:
        self._indent = 0
        self._lines: List[str] = []
        self._line_index: Dict[int, int] = {}  # line number -> block index
        self._blocks: List[tuple] = []  # (line_no, statements)

    def _emit(self, s: str = "") -> None:
        if s:
            self._lines.append("  " * self._indent + s)
        else:
            self._lines.append("")

    def _expr(self, e: Expr) -> str:
        if isinstance(e, NumberExpr):
            return repr(e.value)
        if isinstance(e, StringExpr):
            return repr(e.value)
        if isinstance(e, VarExpr):
            return f'_v("{e.name}")'
        if isinstance(e, UnaryOpExpr):
            return f"({e.op}{self._expr(e.operand)})"
        if isinstance(e, BinaryOpExpr):
            if e.op in ("<", "<=", ">", ">=", "=", "<>", "+", "-", "*", "/"):
                right = self._expr(e.right)
                if e.op == "=":
                    op = "=="
                elif e.op == "<>":
                    op = "!="
                else:
                    op = e.op
                return f"({self._expr(e.left)} {op} {right})"
            return f"({self._expr(e.left)} {e.op} {self._expr(e.right)})"
        if isinstance(e, BuiltinCallExpr):
            if e.name == "RND" and len(e.args) == 1:
                return f"(int({self._expr(e.args[0])}) and __import__('random').randrange(0, {self._expr(e.args[0])}) or 0)"
            if e.name == "ABS" and len(e.args) == 1:
                return f"abs({self._expr(e.args[0])})"
            return f'_builtin("{e.name}", [{", ".join(self._expr(a) for a in e.args)}])'
        raise ValueError(f"Unknown expr: {type(e)}")

    def _stmt(self, s: Stmt, need_break: bool = True) -> None:
        """Emit code for one statement. If need_break, we're in a block and may break out after."""
        if isinstance(s, PrintStmt):
            parts = []
            for item in s.items:
                if isinstance(item, StringExpr):
                    parts.append(f"print({repr(item.value)}, end='')")
                else:
                    parts.append(f"print({self._expr(item)}, end='')")
            self._emit("; ".join(parts) + "; print()")
            return
        if isinstance(s, LetStmt):
            self._emit(f'_set("{s.name}", {self._expr(s.value)})')
            return
        if isinstance(s, InputStmt):
            for v in s.variables:
                self._emit(f'_set("{v}", _num_input())')
            return
        if isinstance(s, IfStmt):
            op = "==" if s.relop == "=" else "!=" if s.relop == "<>" else s.relop
            cond = f"({self._expr(s.left)} {op} {self._expr(s.right)})"
            self._emit(f"if {cond}:")
            self._indent += 1
            self._stmt(s.then_stmt, need_break=False)
            self._indent -= 1
            if s.else_stmt:
                self._emit("else:")
                self._indent += 1
                self._stmt(s.else_stmt, need_break=False)
                self._indent -= 1
            return
        if isinstance(s, GotoStmt):
            self._emit("_pc = _line_index.get(_num(" + self._expr(s.target) + "), _pc + 1)")
            self._emit("continue")
            return
        if isinstance(s, GosubStmt):
            self._emit("_gosub_stack.append(_pc + 1)")
            self._emit("_pc = _line_index.get(_num(" + self._expr(s.target) + "), _pc + 1)")
            self._emit("continue")
            return
        if isinstance(s, ReturnStmt):
            self._emit("_pc = _gosub_stack.pop()")
            self._emit("continue")
            return
        if isinstance(s, ForStmt):
            step_val = self._expr(s.step) if s.step else "1"
            self._emit(f"__start = _num({self._expr(s.start)})")
            self._emit(f"__end = _num({self._expr(s.end)})")
            self._emit(f"__step = _num({step_val})")
            self._emit(f"__i = __start")
            self._emit("while (__step > 0 and __i <= __end) or (__step < 0 and __i >= __end):")
            self._indent += 1
            self._emit(f'_set("{s.var}", __i)')
            for b in s.body:
                self._stmt(b, need_break=False)
            self._emit("__i = __i + __step")
            self._indent -= 1
            return
        if isinstance(s, NextStmt):
            self._emit("pass  # NEXT")
            return
        if isinstance(s, EndStmt):
            self._emit("_pc = _blocks")
            self._emit("continue")
            return
        if isinstance(s, RemStmt):
            self._emit(f"# REM {s.text}")
            return
        raise ValueError(f"Unknown stmt: {type(s)}")

    def _flatten_and_index(self, program: Program) -> None:
        """Build _blocks and _line_index from program."""
        for line in program.lines:
            line_no = line.number
            idx = len(self._blocks)
            if line_no is not None:
                self._line_index[line_no] = idx
            else:
                self._line_index[idx] = idx  # implicit line number = block index
            self._blocks.append((line_no, line.statements))

    def transpile(self, program: Program) -> str:
        self._lines = []
        self._line_index = {}
        self._blocks = []
        self._flatten_and_index(program)

        # Emit Python preamble: variables, line index, blocks as list of (line_no, list of stmt executors)
        self._lines.append("def _v(name):")
        self._lines.append("  return _vars.get(name, 0)")
        self._lines.append("")
        self._lines.append("def _set(name, value):")
        self._lines.append("  _vars[name] = value")
        self._lines.append("")
        self._lines.append("def _num(x):")
        self._lines.append("  return int(x) if isinstance(x, float) and x == int(x) else x")
        self._lines.append("")
        self._lines.append("def _num_input():")
        self._lines.append("  s = input().strip()")
        self._lines.append("  return int(s) if '.' not in s else float(s)")
        self._lines.append("")
        self._lines.append("_vars = {}")
        self._lines.append("_line_index = " + repr(self._line_index))
        self._lines.append("_gosub_stack = []")
        self._lines.append("_pc = 0")
        self._lines.append("")
        blocks = self._blocks
        self._lines.append("_blocks = " + str(len(blocks)))
        self._lines.append("")
        self._lines.append("while _pc < _blocks:")

        self._indent = 1
        for i, (line_no, stmts) in enumerate(blocks):
            self._emit(f"if _pc == {i}:")
            self._indent += 1
            for s in stmts:
                self._stmt(s)
            self._emit("_pc = " + str(i + 1))
            self._emit("continue")
            self._indent -= 1
        self._indent = 0

        return "\n".join(self._lines)


def transpile(program: Program) -> str:
    """Convert a BASIC Program AST to Python source code."""
    return Transpiler().transpile(program)
