/**
 * Transpiler unit tests: verify generated JavaScript code structure.
 */
import { describe, it, expect } from 'vitest';
import { compile } from '../src/compiler/index';

describe('Transpiler: code structure', () => {
  it('should start with return of async IIFE', () => {
    const code = compile('PRINT 1\nEND');
    expect(code).toContain('return (async function()');
  });

  it('should contain async function', () => {
    const code = compile('PRINT 1\nEND');
    expect(code).toContain('async function');
  });

  it('should contain variable helpers', () => {
    const code = compile('LET X = 1\nEND');
    expect(code).toContain('_v');
    expect(code).toContain('_set');
    expect(code).toContain('_num');
  });

  it('should contain program counter loop', () => {
    const code = compile('PRINT 1\nEND');
    expect(code).toContain('while');
    expect(code).toContain('_pc');
  });

  it('should contain line index mapping', () => {
    const code = compile('10 PRINT 1\n20 END');
    expect(code).toContain('_line_index');
  });

  it('should contain gosub stack', () => {
    const code = compile('GOSUB 100\n100 RETURN');
    expect(code).toContain('_gosub_stack');
  });
});

describe('Transpiler: PRINT generation', () => {
  it('should generate __print calls for string', () => {
    const code = compile('PRINT "hello"\nEND');
    expect(code).toContain('__print("hello")');
    expect(code).toContain('__print("\\n")');
  });

  it('should generate String() conversion for expressions', () => {
    const code = compile('PRINT X\nEND');
    expect(code).toContain('String(');
    expect(code).toContain('_v("X")');
  });
});

describe('Transpiler: LET generation', () => {
  it('should generate _set call', () => {
    const code = compile('LET X = 5\nEND');
    expect(code).toContain('_set("X", 5)');
  });

  it('should generate expression in assignment', () => {
    const code = compile('LET X = 1 + 2\nEND');
    expect(code).toContain('_set("X", (1 + 2))');
  });
});

describe('Transpiler: INPUT generation', () => {
  it('should generate await __input()', () => {
    const code = compile('INPUT X\nEND');
    expect(code).toContain('await __input()');
    expect(code).toContain('_set("X"');
  });
});

describe('Transpiler: IF generation', () => {
  it('should translate = to ===', () => {
    const code = compile('IF X = 1 THEN PRINT "y"\nEND');
    expect(code).toContain('===');
  });

  it('should translate <> to !==', () => {
    const code = compile('IF X <> 0 THEN PRINT "y"\nEND');
    expect(code).toContain('!==');
  });

  it('should preserve < > <= >= operators', () => {
    expect(compile('IF X > 0 THEN PRINT "y"\nEND')).toMatch(/> 0/);
    expect(compile('IF X < 0 THEN PRINT "y"\nEND')).toMatch(/< 0/);
  });
});

describe('Transpiler: GOTO generation', () => {
  it('should set _pc via _line_index', () => {
    const code = compile('10 GOTO 20\n20 END');
    expect(code).toContain('_line_index');
    expect(code).toContain('continue');
  });
});

describe('Transpiler: GOSUB/RETURN generation', () => {
  it('should push to _gosub_stack on GOSUB', () => {
    const code = compile('10 GOSUB 100\n20 END\n100 RETURN');
    expect(code).toContain('_gosub_stack.push');
  });

  it('should pop from _gosub_stack on RETURN', () => {
    const code = compile('10 GOSUB 100\n20 END\n100 RETURN');
    expect(code).toContain('_gosub_stack.pop');
  });
});

describe('Transpiler: FOR generation', () => {
  it('should generate native for loop', () => {
    const code = compile('FOR I = 1 TO 5\nNEXT I\nEND');
    expect(code).toContain('for (');
    expect(code).toContain('__start');
    expect(code).toContain('__end');
    expect(code).toContain('__step');
  });
});

describe('Transpiler: END generation', () => {
  it('should set _pc beyond blocks to stop', () => {
    const code = compile('END');
    expect(code).toContain('_pc = _blocks');
    expect(code).toContain('continue');
  });
});

describe('Transpiler: REM generation', () => {
  it('should generate JS comment', () => {
    const code = compile('REM test comment\nEND');
    expect(code).toContain('/* REM');
  });
});

describe('Transpiler: built-in functions', () => {
  it('should translate ABS to Math.abs', () => {
    const code = compile('PRINT ABS(5)\nEND');
    expect(code).toContain('Math.abs');
  });

  it('should translate RND to Math.random', () => {
    const code = compile('PRINT RND(10)\nEND');
    expect(code).toContain('Math.random');
    expect(code).toContain('Math.floor');
  });
});

describe('Transpiler: generated code is executable', () => {
  it('should produce code that can be evaluated', async () => {
    const code = compile('PRINT "test"\nEND');
    const output: string[] = [];
    const fn = new Function('__print', '__input', code);
    await fn(
      (s: string) => output.push(s),
      async () => '0',
    );
    expect(output.join('')).toContain('test');
  });

  it('should handle arithmetic in generated code', async () => {
    const code = compile('LET X = 2 + 3\nPRINT X\nEND');
    const output: string[] = [];
    const fn = new Function('__print', '__input', code);
    await fn(
      (s: string) => output.push(s),
      async () => '0',
    );
    expect(output.join('')).toContain('5');
  });
});
