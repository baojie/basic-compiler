"""Lexer tests: token sequences and error cases."""
import pytest
from src.lexer import tokenize, LexerError
from src.tokens import Token, TokenType


def test_empty():
    tokens = tokenize("")
    assert len(tokens) == 1
    assert tokens[0].type == TokenType.EOF


def test_numbers():
    tokens = tokenize("42 3.14 0")
    types = [t.type for t in tokens]
    assert TokenType.NUMBER in types
    assert tokens[0].value == 42
    assert tokens[1].value == 3.14
    assert tokens[2].value == 0


def test_keywords():
    tokens = tokenize("PRINT LET INPUT IF THEN END GOTO GOSUB RETURN FOR TO STEP NEXT")
    types = [t.type for t in tokens]
    assert TokenType.PRINT in types
    assert TokenType.LET in types
    assert TokenType.INPUT in types
    assert TokenType.IF in types
    assert TokenType.THEN in types
    assert TokenType.END in types
    assert TokenType.GOTO in types
    assert TokenType.FOR in types
    assert TokenType.NEXT in types


def test_identifiers():
    tokens = tokenize("A X1 foo BAR")
    assert tokens[0].type == TokenType.IDENT
    assert tokens[0].value == "A"
    assert tokens[1].type == TokenType.IDENT
    assert tokens[2].type == TokenType.IDENT
    assert tokens[3].type == TokenType.IDENT  # BAR might be ident (case preserved for non-keyword)


def test_strings():
    tokens = tokenize('"hello" \'world\'')
    assert tokens[0].type == TokenType.STRING
    assert tokens[0].value == "hello"
    assert tokens[1].type == TokenType.STRING
    assert tokens[1].value == "world"


def test_operators():
    tokens = tokenize("+ - * / = < <= > >= <> ( ) , :")
    types = [t.type for t in tokens]
    assert TokenType.PLUS in types
    assert TokenType.MINUS in types
    assert TokenType.STAR in types
    assert TokenType.SLASH in types
    assert TokenType.EQ in types
    assert TokenType.LT in types
    assert TokenType.LE in types
    assert TokenType.GT in types
    assert TokenType.GE in types
    assert TokenType.NE in types
    assert TokenType.LPAREN in types
    assert TokenType.RPAREN in types
    assert TokenType.COMMA in types
    assert TokenType.COLON in types


def test_newlines():
    tokens = tokenize("PRINT\nPRINT")
    assert any(t.type == TokenType.NEWLINE for t in tokens)
    assert sum(1 for t in tokens if t.type == TokenType.PRINT) == 2


def test_rem_consumes_rest_of_line():
    tokens = tokenize("REM this is a comment\nPRINT 1")
    assert tokens[0].type == TokenType.REM
    assert "comment" in (tokens[0].value or "")
    assert any(t.type == TokenType.PRINT for t in tokens)


def test_lexer_error_unterminated_string():
    with pytest.raises(LexerError) as exc_info:
        tokenize('"unclosed')
    assert "Unterminated" in str(exc_info.value) or "string" in str(exc_info.value).lower()


def test_lexer_error_unexpected_char():
    with pytest.raises(LexerError):
        tokenize("PRINT @ 1")
