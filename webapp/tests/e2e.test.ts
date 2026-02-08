/**
 * End-to-end tests: compile BASIC source and run, compare output.
 * Mirrors the Python tests in tests/e2e/test_e2e.py.
 */
import { describe, it, expect } from 'vitest';
import { compile, run } from '../src/compiler/index';

/** Run a BASIC program and return its collected output. */
async function runBasic(
  source: string,
  inputValues: string[] = [],
): Promise<string> {
  const output: string[] = [];
  let inputIndex = 0;
  await run(
    source,
    (s: string) => output.push(s),
    async () => {
      if (inputIndex >= inputValues.length)
        throw new Error('No more input values');
      return inputValues[inputIndex++];
    },
  );
  return output.join('');
}

describe('E2E: PRINT', () => {
  it('should print Hello, World!', async () => {
    const out = await runBasic('PRINT "Hello, World!"\nEND');
    expect(out).toContain('Hello, World!');
  });

  it('should print multiple items', async () => {
    const out = await runBasic('PRINT "A", "B", "C"\nEND');
    expect(out).toContain('A');
    expect(out).toContain('B');
    expect(out).toContain('C');
  });
});

describe('E2E: LET and arithmetic', () => {
  it('should compute addition', async () => {
    const src = `
LET A = 1
LET B = 2
PRINT A + B
END
`;
    const out = await runBasic(src);
    expect(out).toContain('3');
  });

  it('should compute subtraction', async () => {
    const src = `
LET A = 10
LET B = 3
PRINT A - B
END
`;
    const out = await runBasic(src);
    expect(out).toContain('7');
  });

  it('should compute multiplication', async () => {
    const src = `
LET A = 4
LET B = 5
PRINT A * B
END
`;
    const out = await runBasic(src);
    expect(out).toContain('20');
  });

  it('should compute division', async () => {
    const src = `
LET A = 15
LET B = 3
PRINT A / B
END
`;
    const out = await runBasic(src);
    expect(out).toContain('5');
  });

  it('should handle complex expression', async () => {
    const src = `
LET X = (2 + 3) * 4
PRINT X
END
`;
    const out = await runBasic(src);
    expect(out).toContain('20');
  });

  it('should handle unary minus', async () => {
    const src = `
LET X = -5
PRINT X
END
`;
    const out = await runBasic(src);
    expect(out).toContain('-5');
  });
});

describe('E2E: INPUT', () => {
  it('should echo input value', async () => {
    const out = await runBasic('INPUT X\nPRINT X\nEND', ['42']);
    expect(out).toContain('42');
  });

  it('should handle multiple inputs', async () => {
    const src = `
INPUT A
INPUT B
PRINT A + B
END
`;
    const out = await runBasic(src, ['10', '20']);
    expect(out).toContain('30');
  });
});

describe('E2E: IF/THEN', () => {
  it('should handle positive condition', async () => {
    const src = 'INPUT X\nIF X > 0 THEN PRINT "pos"\nEND';
    const out = await runBasic(src, ['1']);
    expect(out).toContain('pos');
  });

  it('should handle negative condition', async () => {
    const src = 'INPUT X\nIF X < 0 THEN PRINT "neg"\nEND';
    const out = await runBasic(src, ['-1']);
    expect(out).toContain('neg');
  });

  it('should not print when condition is false', async () => {
    const src = 'INPUT X\nIF X > 0 THEN PRINT "pos"\nEND';
    const out = await runBasic(src, ['-1']);
    expect(out).not.toContain('pos');
  });

  it('should handle equality check', async () => {
    const src = 'LET X = 5\nIF X = 5 THEN PRINT "equal"\nEND';
    const out = await runBasic(src);
    expect(out).toContain('equal');
  });

  it('should handle inequality', async () => {
    const src = 'LET X = 3\nIF X <> 5 THEN PRINT "notequal"\nEND';
    const out = await runBasic(src);
    expect(out).toContain('notequal');
  });

  it('should handle IF/THEN/ELSE', async () => {
    const src = 'LET X = 0\nIF X > 0 THEN PRINT "yes" ELSE PRINT "no"\nEND';
    const out = await runBasic(src);
    expect(out).not.toContain('yes');
    expect(out).toContain('no');
  });
});

describe('E2E: FOR/NEXT', () => {
  it('should sum 1 to 5', async () => {
    const src = `
LET S = 0
FOR I = 1 TO 5
  LET S = S + I
NEXT I
PRINT S
END
`;
    const out = await runBasic(src);
    expect(out).toContain('15');
  });

  it('should iterate with step', async () => {
    const src = `
LET S = 0
FOR I = 0 TO 10 STEP 2
  LET S = S + I
NEXT I
PRINT S
END
`;
    const out = await runBasic(src);
    // 0+2+4+6+8+10 = 30
    expect(out).toContain('30');
  });

  it('should handle nested output', async () => {
    const src = `
FOR I = 1 TO 3
  PRINT I
NEXT I
END
`;
    const out = await runBasic(src);
    expect(out).toContain('1');
    expect(out).toContain('2');
    expect(out).toContain('3');
  });
});

describe('E2E: Fibonacci', () => {
  it('should compute first 5 fibonacci numbers', async () => {
    const src = `
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
`;
    const out = await runBasic(src, ['5']);
    expect(out).toContain('0');
    expect(out).toContain('1');
    expect(out).toContain('2');
    expect(out).toContain('3');
  });
});

describe('E2E: GOSUB/RETURN', () => {
  it('should call subroutine and return', async () => {
    const src = `
10 PRINT "main"
20 GOSUB 100
30 PRINT "back"
40 END
100 PRINT "sub"
110 RETURN
`;
    const out = await runBasic(src);
    expect(out).toContain('main');
    expect(out).toContain('sub');
    expect(out).toContain('back');
  });

  it('should handle nested GOSUB', async () => {
    const src = `
10 GOSUB 100
20 PRINT "done"
30 END
100 PRINT "sub1"
110 GOSUB 200
120 PRINT "back1"
130 RETURN
200 PRINT "sub2"
210 RETURN
`;
    const out = await runBasic(src);
    expect(out).toContain('sub1');
    expect(out).toContain('sub2');
    expect(out).toContain('back1');
    expect(out).toContain('done');
  });
});

describe('E2E: GOTO', () => {
  it('should jump to target line', async () => {
    const src = `
10 PRINT "start"
20 GOTO 40
30 PRINT "skipped"
40 PRINT "end"
50 END
`;
    const out = await runBasic(src);
    expect(out).toContain('start');
    expect(out).not.toContain('skipped');
    expect(out).toContain('end');
  });
});

describe('E2E: REM', () => {
  it('should ignore comments', async () => {
    const src = `
REM This is a comment
PRINT "visible"
REM Another comment
END
`;
    const out = await runBasic(src);
    expect(out).toContain('visible');
    expect(out).not.toContain('comment');
  });
});

describe('E2E: compile() output', () => {
  it('should return JavaScript code string', () => {
    const code = compile('PRINT 1\nEND');
    expect(code).toContain('__print');
    expect(code).toContain('while');
    expect(code).toContain('_v');
  });

  it('should produce valid async IIFE', () => {
    const code = compile('PRINT "hello"\nEND');
    expect(code).toContain('return (async function()');
  });
});

describe('E2E: built-in functions', () => {
  it('should compute ABS', async () => {
    const src = `
LET X = -7
PRINT ABS(X)
END
`;
    const out = await runBasic(src);
    expect(out).toContain('7');
  });

  it('should compute RND within range', async () => {
    const src = `
LET X = RND(10)
IF X >= 0 THEN PRINT "ok"
END
`;
    const out = await runBasic(src);
    expect(out).toContain('ok');
  });
});

describe('E2E: multiple statements per line', () => {
  it('should handle colon-separated statements', async () => {
    const src = 'LET A = 1 : LET B = 2 : PRINT A + B\nEND';
    const out = await runBasic(src);
    expect(out).toContain('3');
  });
});

describe('E2E: string output', () => {
  it('should handle escape sequences', async () => {
    const src = 'PRINT "line1\\nline2"\nEND';
    const out = await runBasic(src);
    expect(out).toContain('line1\nline2');
  });
});

describe('E2E: variable default value', () => {
  it('should default unset variables to 0', async () => {
    const src = 'PRINT X\nEND';
    const out = await runBasic(src);
    expect(out).toContain('0');
  });
});
