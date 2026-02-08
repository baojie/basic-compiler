"""Parser tests: valid programs produce AST, invalid raise ParseError."""
import pytest
from src.parser import parse, ParseError
from src.ast_nodes import (
    Program, Line, PrintStmt, LetStmt, InputStmt, IfStmt, GotoStmt,
    EndStmt, ForStmt, NumberExpr, StringExpr, VarExpr, BinaryOpExpr,
)


def test_parse_print_only():
    program = parse('PRINT "Hello"\nEND')
    assert isinstance(program, Program)
    assert len(program.lines) >= 1
    stmts = [s for line in program.lines for s in line.statements]
    assert any(isinstance(s, PrintStmt) for s in stmts)
    assert any(isinstance(s, EndStmt) for s in stmts)


def test_parse_let():
    program = parse("LET A = 1\nLET B = A + 2\nPRINT B\nEND")
    stmts = [s for line in program.lines for s in line.statements]
    lets = [s for s in stmts if isinstance(s, LetStmt)]
    assert len(lets) >= 2
    assert lets[0].name == "A"
    assert isinstance(lets[0].value, NumberExpr)
    assert lets[0].value.value == 1


def test_parse_input():
    program = parse("INPUT X\nPRINT X\nEND")
    stmts = [s for line in program.lines for s in line.statements]
    inputs = [s for s in stmts if isinstance(s, InputStmt)]
    assert len(inputs) == 1
    assert inputs[0].variables == ["X"]


def test_parse_if_then():
    program = parse('IF X > 0 THEN PRINT "pos"\nEND')
    stmts = [s for line in program.lines for s in line.statements]
    ifs = [s for s in stmts if isinstance(s, IfStmt)]
    assert len(ifs) == 1
    assert ifs[0].relop == ">"
    assert isinstance(ifs[0].then_stmt, PrintStmt)


def test_parse_goto():
    program = parse("10 GOTO 20\n20 PRINT 1\nEND")
    stmts = [s for line in program.lines for s in line.statements]
    gotos = [s for s in stmts if isinstance(s, GotoStmt)]
    assert len(gotos) == 1
    assert isinstance(gotos[0].target, NumberExpr)
    assert gotos[0].target.value == 20


def test_parse_for_next():
    program = parse("FOR I = 1 TO 5\nPRINT I\nNEXT I\nEND")
    stmts = [s for line in program.lines for s in line.statements]
    fors = [s for s in stmts if isinstance(s, ForStmt)]
    assert len(fors) == 1
    assert fors[0].var == "I"
    assert isinstance(fors[0].start, NumberExpr)
    assert fors[0].start.value == 1
    assert fors[0].end.value == 5
    assert len(fors[0].body) >= 1


def test_parse_line_numbers():
    program = parse("100 PRINT 1\n200 LET A = 2\nEND")
    assert any(line.number == 100 for line in program.lines)
    assert any(line.number == 200 for line in program.lines)


def test_parse_error_missing_then():
    with pytest.raises(ParseError):
        parse("IF X > 0 PRINT 1")


def test_parse_error_missing_equals_let():
    with pytest.raises(ParseError):
        parse("LET A 1")
