"""
BASIC compiler: compile and run BASIC source.
"""
import sys
from io import StringIO

from src.lexer import tokenize, LexerError
from src.parser import parse, ParseError
from src.codegen import transpile


def compile_source(source: str) -> str:
    """Compile BASIC source to Python code. Raises LexerError or ParseError on failure."""
    program = parse(source)
    return transpile(program)


def run_source(source: str, stdin: StringIO = None, stdout: StringIO = None) -> None:
    """Compile and execute BASIC source. Uses provided stdin/stdout or sys.stdin/stdout."""
    python_code = compile_source(source)
    globs = {"__name__": "__main__"}

    if stdin is not None:
        def _input(prompt=""):
            return stdin.readline().rstrip("\n")
        globs["input"] = _input
    else:
        globs["input"] = input

    if stdout is not None:
        def _print(*args, sep=" ", end="\n", file=None, **kwargs):
            if file is not None:
                print(*args, sep=sep, end=end, file=file, **kwargs)
            else:
                print(*args, sep=sep, end=end, file=stdout, **kwargs)
        globs["print"] = _print
    else:
        globs["print"] = print

    exec(python_code, globs)


def repl() -> None:
    """Interactive BASIC command line (REPL)."""
    lines = []
    print("BASIC (Python) - type RUN to execute, LIST to show, NEW to clear, BYE to quit")
    while True:
        try:
            prompt = str(len(lines) + 1) + " " if lines else "> "
            line = input(prompt).strip()
        except EOFError:
            print()
            break
        if not line:
            continue
        upper = line.upper()
        if upper in ("BYE", "QUIT", "EXIT"):
            break
        if upper == "NEW":
            lines.clear()
            print("Program cleared.")
            continue
        if upper == "LIST":
            for i, L in enumerate(lines, 1):
                print(i, L)
            if not lines:
                print("(no lines)")
            continue
        if upper == "RUN":
            if not lines:
                print("(no program)")
                continue
            source = "\n".join(lines)
            try:
                run_source(source)
            except LexerError as e:
                print(f"Lexer error: {e}", file=sys.stderr)
            except ParseError as e:
                print(f"Parse error: {e}", file=sys.stderr)
            continue
        lines.append(line)


def main() -> int:
    if len(sys.argv) < 2:
        repl()
        return 0
    path = sys.argv[1]
    try:
        with open(path, "r", encoding="utf-8") as f:
            source = f.read()
    except FileNotFoundError:
        print(f"File not found: {path}", file=sys.stderr)
        return 1
    try:
        run_source(source)
    except LexerError as e:
        print(f"Lexer error: {e}", file=sys.stderr)
        return 1
    except ParseError as e:
        print(f"Parse error: {e}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
