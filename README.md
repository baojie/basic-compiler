# BASIC Compiler (Python)

A Tiny BASIC–style compiler implemented in Python. It compiles a BASIC subset to Python and runs it.

## Features

- **Lexer**: Tokens for numbers, strings, identifiers, keywords, operators.
- **Parser**: Recursive descent; optional line numbers; PRINT, LET, INPUT, IF/THEN/ELSE, GOTO, GOSUB/RETURN, FOR/NEXT, END, REM.
- **Backend**: Transpiles AST to Python and executes it.

## Usage

Run a BASIC file:

```bash
python compiler.py samples/hello.bas
```

From Python:

```python
from compiler import compile_source, run_source

# Compile to Python code
code = compile_source('PRINT "Hi"\nEND')

# Compile and run
run_source('PRINT 1 + 2\nEND')
```

## Project layout

- `src/` – Lexer, parser, AST, transpiler
- `samples/` – Sample `.bas` programs
- `tests/` – Lexer, parser, e2e, and error tests
- `docs/grammar.md` – BNF grammar

## Tests

```bash
python -m venv .venv
.venv/bin/pip install pytest
.venv/bin/python -m pytest tests/ -v
```

## Sample programs

| File | Description |
|------|-------------|
| `samples/hello.bas` | Hello World (PRINT, END) |
| `samples/add.bas` | LET and arithmetic |
| `samples/input_echo.bas` | INPUT and PRINT |
| `samples/condition.bas` | IF-THEN |
| `samples/fornext.bas` | FOR-NEXT sum 1 to 5 |
| `samples/fibonacci.bas` | Fibonacci with FOR |
| `samples/gosub.bas` | GOSUB / RETURN |
