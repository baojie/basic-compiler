/**
 * Parser unit tests: verify AST structure from BASIC source.
 */
import { describe, it, expect } from 'vitest';
import { parse, ParseError } from '../src/compiler/parser';
import type { Stmt, Expr } from '../src/compiler/ast';

function stmts(source: string): Stmt[] {
  const program = parse(source);
  return program.lines.flatMap((l) => l.statements);
}

function firstStmt(source: string): Stmt {
  return stmts(source)[0];
}

describe('Parser: PRINT', () => {
  it('should parse PRINT with string', () => {
    const s = firstStmt('PRINT "hello"');
    expect(s.kind).toBe('print');
    if (s.kind === 'print') {
      expect(s.items).toHaveLength(1);
      expect(s.items[0]).toEqual({ kind: 'string', value: 'hello' });
    }
  });

  it('should parse PRINT with number expression', () => {
    const s = firstStmt('PRINT 42');
    expect(s.kind).toBe('print');
    if (s.kind === 'print') {
      expect(s.items[0]).toEqual({ kind: 'number', value: 42 });
    }
  });

  it('should parse PRINT with multiple items', () => {
    const s = firstStmt('PRINT "a", "b", "c"');
    expect(s.kind).toBe('print');
    if (s.kind === 'print') {
      expect(s.items).toHaveLength(3);
    }
  });

  it('should parse PRINT with expression', () => {
    const s = firstStmt('PRINT 1 + 2');
    expect(s.kind).toBe('print');
    if (s.kind === 'print') {
      expect(s.items[0].kind).toBe('binary');
    }
  });
});

describe('Parser: LET', () => {
  it('should parse simple assignment', () => {
    const s = firstStmt('LET X = 5');
    expect(s.kind).toBe('let');
    if (s.kind === 'let') {
      expect(s.name).toBe('X');
      expect(s.value).toEqual({ kind: 'number', value: 5 });
    }
  });

  it('should parse assignment with expression', () => {
    const s = firstStmt('LET X = 1 + 2 * 3');
    expect(s.kind).toBe('let');
    if (s.kind === 'let') {
      // 1 + (2 * 3) due to precedence
      const val = s.value;
      expect(val.kind).toBe('binary');
      if (val.kind === 'binary') {
        expect(val.op).toBe('+');
        expect(val.left).toEqual({ kind: 'number', value: 1 });
        expect(val.right.kind).toBe('binary');
      }
    }
  });

  it('should uppercase variable name', () => {
    const s = firstStmt('LET myVar = 1');
    if (s.kind === 'let') {
      expect(s.name).toBe('MYVAR');
    }
  });
});

describe('Parser: INPUT', () => {
  it('should parse single variable', () => {
    const s = firstStmt('INPUT X');
    expect(s.kind).toBe('input');
    if (s.kind === 'input') {
      expect(s.variables).toEqual(['X']);
    }
  });

  it('should parse multiple variables', () => {
    const s = firstStmt('INPUT A, B, C');
    expect(s.kind).toBe('input');
    if (s.kind === 'input') {
      expect(s.variables).toEqual(['A', 'B', 'C']);
    }
  });
});

describe('Parser: IF/THEN', () => {
  it('should parse IF with > operator', () => {
    const s = firstStmt('IF X > 0 THEN PRINT "pos"');
    expect(s.kind).toBe('if');
    if (s.kind === 'if') {
      expect(s.relop).toBe('>');
      expect(s.then_stmt.kind).toBe('print');
    }
  });

  it('should parse IF with = operator', () => {
    const s = firstStmt('IF X = 1 THEN PRINT "one"');
    if (s.kind === 'if') {
      expect(s.relop).toBe('=');
    }
  });

  it('should parse IF with <> operator', () => {
    const s = firstStmt('IF X <> 0 THEN PRINT "nz"');
    if (s.kind === 'if') {
      expect(s.relop).toBe('<>');
    }
  });

  it('should parse IF/THEN/ELSE', () => {
    const s = firstStmt('IF X > 0 THEN PRINT "a" ELSE PRINT "b"');
    if (s.kind === 'if') {
      expect(s.then_stmt.kind).toBe('print');
      expect(s.else_stmt).toBeDefined();
      expect(s.else_stmt!.kind).toBe('print');
    }
  });

  it('should parse all relational operators', () => {
    const ops = ['<', '<=', '>', '>=', '=', '<>'];
    for (const op of ops) {
      const s = firstStmt(`IF X ${op} 1 THEN PRINT "ok"`);
      if (s.kind === 'if') {
        expect(s.relop).toBe(op);
      }
    }
  });
});

describe('Parser: GOTO', () => {
  it('should parse GOTO with line number', () => {
    const s = firstStmt('GOTO 100');
    expect(s.kind).toBe('goto');
    if (s.kind === 'goto') {
      expect(s.target).toEqual({ kind: 'number', value: 100 });
    }
  });
});

describe('Parser: GOSUB/RETURN', () => {
  it('should parse GOSUB', () => {
    const s = firstStmt('GOSUB 200');
    expect(s.kind).toBe('gosub');
    if (s.kind === 'gosub') {
      expect(s.target).toEqual({ kind: 'number', value: 200 });
    }
  });

  it('should parse RETURN', () => {
    const s = firstStmt('RETURN');
    expect(s.kind).toBe('return');
  });
});

describe('Parser: FOR/NEXT', () => {
  it('should parse FOR loop with body', () => {
    const src = `FOR I = 1 TO 10\nPRINT I\nNEXT I`;
    const s = firstStmt(src);
    expect(s.kind).toBe('for');
    if (s.kind === 'for') {
      expect(s.var).toBe('I');
      expect(s.start).toEqual({ kind: 'number', value: 1 });
      expect(s.end).toEqual({ kind: 'number', value: 10 });
      expect(s.step).toBeUndefined();
      expect(s.body).toHaveLength(1);
      expect(s.body[0].kind).toBe('print');
    }
  });

  it('should parse FOR loop with STEP', () => {
    const src = `FOR I = 0 TO 20 STEP 5\nNEXT I`;
    const s = firstStmt(src);
    if (s.kind === 'for') {
      expect(s.step).toEqual({ kind: 'number', value: 5 });
    }
  });
});

describe('Parser: END', () => {
  it('should parse END statement', () => {
    const s = firstStmt('END');
    expect(s.kind).toBe('end');
  });
});

describe('Parser: REM', () => {
  it('should parse comment', () => {
    const s = firstStmt('REM this is a comment');
    expect(s.kind).toBe('rem');
    if (s.kind === 'rem') {
      expect(s.text).toBe('this is a comment');
    }
  });
});

describe('Parser: line numbers', () => {
  it('should parse lines with numbers', () => {
    const program = parse('10 PRINT "hello"\n20 END');
    expect(program.lines).toHaveLength(2);
    expect(program.lines[0].number).toBe(10);
    expect(program.lines[1].number).toBe(20);
  });

  it('should parse lines without numbers', () => {
    const program = parse('PRINT "hello"\nEND');
    expect(program.lines).toHaveLength(2);
    expect(program.lines[0].number).toBeNull();
  });
});

describe('Parser: multiple statements per line', () => {
  it('should parse colon-separated statements', () => {
    const program = parse('LET A = 1 : LET B = 2 : PRINT A');
    expect(program.lines).toHaveLength(1);
    expect(program.lines[0].statements).toHaveLength(3);
  });
});

describe('Parser: expression precedence', () => {
  it('should parse * before +', () => {
    const s = firstStmt('PRINT 2 + 3 * 4');
    if (s.kind === 'print') {
      const e = s.items[0];
      // Should be (2 + (3 * 4))
      expect(e.kind).toBe('binary');
      if (e.kind === 'binary') {
        expect(e.op).toBe('+');
        expect(e.left).toEqual({ kind: 'number', value: 2 });
        expect(e.right.kind).toBe('binary');
        if (e.right.kind === 'binary') {
          expect(e.right.op).toBe('*');
        }
      }
    }
  });

  it('should handle parenthesized expression', () => {
    const s = firstStmt('PRINT (2 + 3) * 4');
    if (s.kind === 'print') {
      const e = s.items[0];
      expect(e.kind).toBe('binary');
      if (e.kind === 'binary') {
        expect(e.op).toBe('*');
        expect(e.left.kind).toBe('binary');
        expect(e.right).toEqual({ kind: 'number', value: 4 });
      }
    }
  });

  it('should handle unary minus', () => {
    const s = firstStmt('PRINT -5');
    if (s.kind === 'print') {
      const e = s.items[0];
      expect(e.kind).toBe('unary');
      if (e.kind === 'unary') {
        expect(e.op).toBe('-');
        expect(e.operand).toEqual({ kind: 'number', value: 5 });
      }
    }
  });
});

describe('Parser: built-in function calls', () => {
  it('should parse ABS(x)', () => {
    const s = firstStmt('PRINT ABS(5)');
    if (s.kind === 'print') {
      const e = s.items[0];
      expect(e.kind).toBe('builtin');
      if (e.kind === 'builtin') {
        expect(e.name).toBe('ABS');
        expect(e.args).toHaveLength(1);
      }
    }
  });

  it('should parse RND(n)', () => {
    const s = firstStmt('PRINT RND(100)');
    if (s.kind === 'print') {
      const e = s.items[0];
      expect(e.kind).toBe('builtin');
      if (e.kind === 'builtin') {
        expect(e.name).toBe('RND');
      }
    }
  });
});

describe('Parser: error handling', () => {
  it('should throw on missing THEN', () => {
    expect(() => parse('IF X > 0 PRINT "x"')).toThrow(ParseError);
  });

  it('should throw on missing = in LET', () => {
    expect(() => parse('LET X 5')).toThrow(ParseError);
  });

  it('should throw on unexpected token', () => {
    expect(() => parse('+')).toThrow(ParseError);
  });

  it('should throw on FOR without NEXT', () => {
    expect(() => parse('FOR I = 1 TO 10')).toThrow(ParseError);
  });
});
