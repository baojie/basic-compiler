"""End-to-end tests: compile BASIC and run, compare output."""
import pytest
from io import StringIO

from compiler import compile_source, run_source


def run_basic(source: str, stdin: str = "") -> str:
    out = StringIO()
    run_source(source, stdin=StringIO(stdin), stdout=out)
    return out.getvalue()


def test_hello():
    src = 'PRINT "Hello, World!"\nEND'
    out = run_basic(src)
    assert "Hello, World!" in out


def test_add():
    src = """
LET A = 1
LET B = 2
PRINT A + B
END
"""
    out = run_basic(src)
    assert "3" in out


def test_input_echo():
    src = "INPUT X\nPRINT X\nEND"
    out = run_basic(src, "42\n")
    assert "42" in out


def test_condition_positive():
    src = 'INPUT X\nIF X > 0 THEN PRINT "pos"\nEND'
    out = run_basic(src, "1\n")
    assert "pos" in out


def test_condition_negative():
    src = 'INPUT X\nIF X < 0 THEN PRINT "neg"\nEND'
    out = run_basic(src, "-1\n")
    assert "neg" in out


def test_for_sum():
    src = """
LET S = 0
FOR I = 1 TO 5
  LET S = S + I
NEXT I
PRINT S
END
"""
    out = run_basic(src)
    assert "15" in out


def test_fibonacci():
    src = """
PRINT "How many?"
INPUT N
LET A = 0
LET B = 1
FOR I = 1 TO N
  PRINT A
  LET C = A + B
  LET A = B
  LET B = C
NEXT I
END
"""
    out = run_basic(src, "5\n")
    assert "0" in out
    assert "1" in out
    assert "2" in out
    assert "3" in out


def test_gosub_return():
    src = """
10 PRINT "main"
20 GOSUB 100
30 PRINT "back"
40 END
100 PRINT "sub"
110 RETURN
"""
    out = run_basic(src)
    assert "main" in out
    assert "sub" in out
    assert "back" in out


def test_compile_returns_python():
    src = "PRINT 1\nEND"
    code = compile_source(src)
    assert "def _v(" in code
    assert "while _pc" in code
    assert "print(" in code
