"""Error handling tests: lexer and parser report clear errors."""
import pytest
from src.lexer import tokenize, LexerError
from src.parser import parse, ParseError
from compiler import compile_source


def test_lexer_unterminated_string():
    with pytest.raises(LexerError) as exc_info:
        tokenize('PRINT "hello')
    assert exc_info.value.line >= 1
    assert exc_info.value.column >= 1


def test_lexer_illegal_character():
    with pytest.raises(LexerError):
        tokenize("PRINT # 1")


def test_parser_missing_then():
    with pytest.raises(ParseError):
        parse("IF X > 0 PRINT 1\nEND")


def test_parser_missing_expression_after_let():
    with pytest.raises(ParseError):
        parse("LET A =\nEND")


def test_parser_for_without_next():
    with pytest.raises(ParseError):
        parse("FOR I = 1 TO 10\nPRINT I\nEND")


def test_compile_valid_does_not_raise():
    compile_source("PRINT 1\nEND")
    compile_source("LET X = 1\nPRINT X\nEND")
