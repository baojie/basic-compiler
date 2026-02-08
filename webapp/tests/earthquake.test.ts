/**
 * Tests for the earthquake feature in the city game.
 * Each test constructs a minimal BASIC program that sets up initial state,
 * calls the earthquake subroutine directly, then prints final values.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { run } from '../src/compiler/index';

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

/** Build a BASIC program that sets initial state, calls a subroutine, prints results. */
function makeQuakeTest(gosubLine: number): string {
  return `
LET M = 500
LET P = 50
LET F = 100
LET H = 60
LET D = 50
GOSUB ${gosubLine}
PRINT "M=", M
PRINT "P=", P
PRINT "F=", F
PRINT "H=", H
PRINT "D=", D
END
REM -- Minor quake --
750 PRINT "A minor earthquake shakes the city."
752 LET P = P - 5
754 LET H = H - 5
756 LET M = M - 30
758 IF M < 0 THEN LET M = 0
760 PRINT "Pop -5, Happy -5, Repair cost 30 gold."
762 RETURN
REM -- Major quake --
770 PRINT "A major earthquake hits! Buildings collapse!"
772 LET P = P - 15
774 LET H = H - 15
776 LET D = D - 20
778 IF D < 0 THEN LET D = 0
780 LET M = M - 80
782 IF M < 0 THEN LET M = 0
784 PRINT "Pop -15, Happy -15, Farms -20, Repair cost 80 gold."
786 RETURN
REM -- Devastating quake --
790 PRINT "DEVASTATING earthquake! The city is in ruins!"
792 LET P = P - 30
794 LET H = H - 30
796 LET D = D - 40
798 IF D < 0 THEN LET D = 0
800 LET F = F - 50
802 IF F < 0 THEN LET F = 0
804 LET M = M - 150
806 IF M < 0 THEN LET M = 0
808 PRINT "Pop -30, Happy -30, Farms -40, Food -50, Repair cost 150 gold."
810 RETURN
`;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Earthquake: minor quake (GOSUB 750)', () => {
  it('should print minor earthquake message', async () => {
    const out = await runBasic(makeQuakeTest(750));
    expect(out).toContain('A minor earthquake shakes the city.');
  });

  it('should reduce pop by 5', async () => {
    const out = await runBasic(makeQuakeTest(750));
    // P starts at 50, minus 5 = 45
    expect(out).toContain('P=45');
  });

  it('should reduce happiness by 5', async () => {
    const out = await runBasic(makeQuakeTest(750));
    // H starts at 60, minus 5 = 55
    expect(out).toContain('H=55');
  });

  it('should cost 30 gold', async () => {
    const out = await runBasic(makeQuakeTest(750));
    // M starts at 500, minus 30 = 470
    expect(out).toContain('M=470');
  });

  it('should not change food or farms', async () => {
    const out = await runBasic(makeQuakeTest(750));
    expect(out).toContain('F=100');
    expect(out).toContain('D=50');
  });
});

describe('Earthquake: major quake (GOSUB 770)', () => {
  it('should print major earthquake message', async () => {
    const out = await runBasic(makeQuakeTest(770));
    expect(out).toContain('A major earthquake hits! Buildings collapse!');
  });

  it('should reduce pop by 15', async () => {
    const out = await runBasic(makeQuakeTest(770));
    // P: 50 - 15 = 35
    expect(out).toContain('P=35');
  });

  it('should reduce happiness by 15', async () => {
    const out = await runBasic(makeQuakeTest(770));
    // H: 60 - 15 = 45
    expect(out).toContain('H=45');
  });

  it('should destroy 20 farm capacity', async () => {
    const out = await runBasic(makeQuakeTest(770));
    // D: 50 - 20 = 30
    expect(out).toContain('D=30');
  });

  it('should cost 80 gold', async () => {
    const out = await runBasic(makeQuakeTest(770));
    // M: 500 - 80 = 420
    expect(out).toContain('M=420');
  });

  it('should not change food', async () => {
    const out = await runBasic(makeQuakeTest(770));
    expect(out).toContain('F=100');
  });
});

describe('Earthquake: devastating quake (GOSUB 790)', () => {
  it('should print devastating earthquake message', async () => {
    const out = await runBasic(makeQuakeTest(790));
    expect(out).toContain('DEVASTATING earthquake! The city is in ruins!');
  });

  it('should reduce pop by 30', async () => {
    const out = await runBasic(makeQuakeTest(790));
    // P: 50 - 30 = 20
    expect(out).toContain('P=20');
  });

  it('should reduce happiness by 30', async () => {
    const out = await runBasic(makeQuakeTest(790));
    // H: 60 - 30 = 30
    expect(out).toContain('H=30');
  });

  it('should destroy 40 farm capacity', async () => {
    const out = await runBasic(makeQuakeTest(790));
    // D: 50 - 40 = 10
    expect(out).toContain('D=10');
  });

  it('should destroy 50 food', async () => {
    const out = await runBasic(makeQuakeTest(790));
    // F: 100 - 50 = 50
    expect(out).toContain('F=50');
  });

  it('should cost 150 gold', async () => {
    const out = await runBasic(makeQuakeTest(790));
    // M: 500 - 150 = 350
    expect(out).toContain('M=350');
  });
});

describe('Earthquake: bounds checking', () => {
  it('should clamp gold to 0 on minor quake', async () => {
    const src = `
LET M = 10
LET P = 50
LET H = 60
LET D = 50
LET F = 100
GOSUB 750
PRINT "M=", M
END
750 PRINT "minor"
752 LET P = P - 5
754 LET H = H - 5
756 LET M = M - 30
758 IF M < 0 THEN LET M = 0
760 RETURN
`;
    const out = await runBasic(src);
    expect(out).toContain('M=0');
  });

  it('should clamp farms to 0 on major quake', async () => {
    const src = `
LET M = 500
LET P = 50
LET H = 60
LET D = 10
LET F = 100
GOSUB 770
PRINT "D=", D
END
770 PRINT "major"
772 LET P = P - 15
774 LET H = H - 15
776 LET D = D - 20
778 IF D < 0 THEN LET D = 0
780 LET M = M - 80
782 IF M < 0 THEN LET M = 0
784 RETURN
`;
    const out = await runBasic(src);
    expect(out).toContain('D=0');
  });

  it('should clamp food to 0 on devastating quake', async () => {
    const src = `
LET M = 500
LET P = 50
LET H = 60
LET D = 50
LET F = 20
GOSUB 790
PRINT "F=", F
END
790 PRINT "devastating"
792 LET P = P - 30
794 LET H = H - 30
796 LET D = D - 40
798 IF D < 0 THEN LET D = 0
800 LET F = F - 50
802 IF F < 0 THEN LET F = 0
804 LET M = M - 150
806 IF M < 0 THEN LET M = 0
808 RETURN
`;
    const out = await runBasic(src);
    expect(out).toContain('F=0');
  });
});

describe('Earthquake: dispatch logic (GOSUB 700)', () => {
  it('should dispatch to minor quake when RND(3)=0', async () => {
    // RND(3)+1: mock Math.random to return 0 → RND(3)=0 → E=1 → minor
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const src = `
LET M = 500
LET P = 50
LET F = 100
LET H = 60
LET D = 50
GOSUB 700
END
700 PRINT ""
705 PRINT "*** EARTHQUAKE! ***"
710 LET E = RND(3) + 1
715 IF E = 1 THEN GOSUB 750
720 IF E = 2 THEN GOSUB 770
725 IF E = 3 THEN GOSUB 790
730 RETURN
750 PRINT "A minor earthquake shakes the city."
752 LET P = P - 5
754 LET H = H - 5
756 LET M = M - 30
758 IF M < 0 THEN LET M = 0
760 PRINT "Pop -5, Happy -5, Repair cost 30 gold."
762 RETURN
770 PRINT "A major earthquake hits! Buildings collapse!"
772 LET P = P - 15
774 LET H = H - 15
776 LET D = D - 20
778 IF D < 0 THEN LET D = 0
780 LET M = M - 80
782 IF M < 0 THEN LET M = 0
784 RETURN
790 PRINT "DEVASTATING earthquake! The city is in ruins!"
792 LET P = P - 30
794 LET H = H - 30
796 LET D = D - 40
798 IF D < 0 THEN LET D = 0
800 LET F = F - 50
802 IF F < 0 THEN LET F = 0
804 LET M = M - 150
806 IF M < 0 THEN LET M = 0
808 RETURN
`;
    const out = await runBasic(src);
    expect(out).toContain('*** EARTHQUAKE! ***');
    expect(out).toContain('A minor earthquake shakes the city.');
  });

  it('should dispatch to major quake when RND(3)=1', async () => {
    // RND(3)+1: mock Math.random to return 0.4 → floor(0.4*3)=1 → E=2 → major
    vi.spyOn(Math, 'random').mockReturnValue(0.4);
    const src = `
LET M = 500
LET P = 50
LET F = 100
LET H = 60
LET D = 50
GOSUB 700
END
700 PRINT "*** EARTHQUAKE! ***"
710 LET E = RND(3) + 1
715 IF E = 1 THEN GOSUB 750
720 IF E = 2 THEN GOSUB 770
725 IF E = 3 THEN GOSUB 790
730 RETURN
750 PRINT "minor"
752 LET P = P - 5
754 LET H = H - 5
756 LET M = M - 30
758 IF M < 0 THEN LET M = 0
762 RETURN
770 PRINT "A major earthquake hits! Buildings collapse!"
772 LET P = P - 15
774 LET H = H - 15
776 LET D = D - 20
778 IF D < 0 THEN LET D = 0
780 LET M = M - 80
782 IF M < 0 THEN LET M = 0
786 RETURN
790 PRINT "devastating"
792 LET P = P - 30
794 LET H = H - 30
796 LET D = D - 40
798 IF D < 0 THEN LET D = 0
800 LET F = F - 50
802 IF F < 0 THEN LET F = 0
804 LET M = M - 150
806 IF M < 0 THEN LET M = 0
810 RETURN
`;
    const out = await runBasic(src);
    expect(out).toContain('A major earthquake hits! Buildings collapse!');
  });

  it('should dispatch to devastating quake when RND(3)=2', async () => {
    // RND(3)+1: mock Math.random to return 0.7 → floor(0.7*3)=2 → E=3 → devastating
    vi.spyOn(Math, 'random').mockReturnValue(0.7);
    const src = `
LET M = 500
LET P = 50
LET F = 100
LET H = 60
LET D = 50
GOSUB 700
END
700 PRINT "*** EARTHQUAKE! ***"
710 LET E = RND(3) + 1
715 IF E = 1 THEN GOSUB 750
720 IF E = 2 THEN GOSUB 770
725 IF E = 3 THEN GOSUB 790
730 RETURN
750 PRINT "minor"
752 LET P = P - 5
754 LET H = H - 5
756 LET M = M - 30
758 IF M < 0 THEN LET M = 0
762 RETURN
770 PRINT "major"
772 LET P = P - 15
774 LET H = H - 15
776 LET D = D - 20
778 IF D < 0 THEN LET D = 0
780 LET M = M - 80
782 IF M < 0 THEN LET M = 0
786 RETURN
790 PRINT "DEVASTATING earthquake! The city is in ruins!"
792 LET P = P - 30
794 LET H = H - 30
796 LET D = D - 40
798 IF D < 0 THEN LET D = 0
800 LET F = F - 50
802 IF F < 0 THEN LET F = 0
804 LET M = M - 150
806 IF M < 0 THEN LET M = 0
810 RETURN
`;
    const out = await runBasic(src);
    expect(out).toContain('DEVASTATING earthquake! The city is in ruins!');
  });
});

describe('Earthquake: trigger probability', () => {
  it('should trigger earthquake when Q=0 (RND(20)=0)', async () => {
    // Mock: all RND calls return 0
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const src = `
LET M = 500
LET P = 50
LET F = 100
LET H = 60
LET D = 50
LET Q = RND(20)
IF Q = 0 THEN PRINT "quake triggered"
END
`;
    const out = await runBasic(src);
    expect(out).toContain('quake triggered');
  });

  it('should NOT trigger earthquake when Q>0', async () => {
    // Mock: RND(20) returns non-zero → 0.5*20=10
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const src = `
LET M = 500
LET P = 50
LET F = 100
LET H = 60
LET D = 50
LET Q = RND(20)
IF Q = 0 THEN PRINT "quake triggered"
PRINT "safe"
END
`;
    const out = await runBasic(src);
    expect(out).not.toContain('quake triggered');
    expect(out).toContain('safe');
  });
});
