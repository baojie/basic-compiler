/**
 * Tests for the city game (city_game.bas).
 * Tests each game subroutine individually and integrated game flows.
 *
 * NOTE: The game avoids multi-statement IF/THEN lines (e.g.
 * `IF cond THEN X: Y`) because the parser only captures one statement
 * after THEN. Error branches use GOTO to jump to the error message
 * and RETURN. Riot/famine penalties use separate IF lines.
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

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helper: game subroutines embedded for isolated testing
// ---------------------------------------------------------------------------

/** Build a test that initializes state, calls a subroutine, and prints results. */
function makeGameTest(
  setup: string,
  gosubLine: number,
  printVars: string[],
  subroutines: string,
): string {
  const prints = printVars
    .map((v) => `PRINT "${v}=", ${v}`)
    .join('\n');
  return `${setup}\nGOSUB ${gosubLine}\n${prints}\nEND\n${subroutines}`;
}

const INIT_STATE = `LET M = 500
LET P = 50
LET F = 100
LET H = 60
LET Y = 1
LET D = 0`;

const SUB_INIT = `
1100 LET M = 500
1105 LET P = 50
1110 LET F = 100
1115 LET H = 60
1120 LET Y = 1
1125 LET D = 0
1130 RETURN
`;

const SUB_STATUS = `
1000 PRINT "--- City Status ---"
1005 PRINT "Gold: ", M, " Pop: ", P, " Food: ", F, " Happy: ", H
1010 RETURN
`;

const SUB_TAX = `
200 PRINT "Collecting tax..."
205 LET T = P * 2
210 LET M = M + T
215 PRINT "You got ", T, " gold."
220 RETURN
`;

const SUB_BUY_FOOD = `
300 PRINT "Buy food: 1 gold = 5 food. How much gold?"
305 INPUT T
310 IF T > M THEN GOTO 332
315 IF T < 0 THEN RETURN
320 LET M = M - T
325 LET F = F + T * 5
330 PRINT "Bought ", T * 5, " food."
331 RETURN
332 PRINT "Not enough gold!"
335 RETURN
`;

const SUB_HOUSING = `
350 PRINT "Build housing: 50 gold -> +20 people. Build? 1=Yes 0=No"
355 INPUT T
360 IF T <> 1 THEN RETURN
365 IF M < 50 THEN GOTO 387
370 LET M = M - 50
375 LET P = P + 20
380 LET H = H - 5
385 PRINT "Housing built. Pop +20, Happiness -5."
386 RETURN
387 PRINT "Need 50 gold!"
390 RETURN
`;

const SUB_FARM = `
400 PRINT "Build farm: 80 gold -> +50 food/turn. Build? 1=Yes 0=No"
405 INPUT T
410 IF T <> 1 THEN RETURN
415 IF M < 80 THEN GOTO 432
420 LET M = M - 80
425 LET D = D + 50
430 PRINT "Farm built. +50 food each year."
431 RETURN
432 PRINT "Need 80 gold!"
435 RETURN
`;

const SUB_NEXT_YEAR = `
600 LET Y = Y + 1
605 LET F = F - P
610 IF F < 0 THEN LET F = 0
615 LET F = F + D
620 LET H = H + 2
625 IF H > 100 THEN LET H = 100
630 LET R = RND(10)
635 IF R < 2 THEN LET P = P + RND(15)
640 IF R >= 8 THEN LET P = P - 5
642 LET Q = RND(20)
643 IF Q = 0 THEN GOSUB 700
645 IF P < 0 THEN LET P = 0
650 IF H < 20 THEN PRINT "Riots! Pop -10."
652 IF H < 20 THEN LET P = P - 10
655 IF P < 0 THEN LET P = 0
660 IF F < P THEN PRINT "Famine! Pop -5."
662 IF F < P THEN LET P = P - 5
665 IF P < 0 THEN LET P = 0
670 RETURN
`;

const SUB_EARTHQUAKE_ALL = `
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
784 PRINT "Pop -15, Happy -15, Farms -20, Repair cost 80 gold."
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
808 PRINT "Pop -30, Happy -30, Farms -40, Food -50, Repair cost 150 gold."
810 RETURN
`;

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

describe('City Game: initialization (GOSUB 1100)', () => {
  it('should set all initial values correctly', async () => {
    const src = makeGameTest(
      '',
      1100,
      ['M', 'P', 'F', 'H', 'Y', 'D'],
      SUB_INIT,
    );
    const out = await runBasic(src);
    expect(out).toContain('M=500');
    expect(out).toContain('P=50');
    expect(out).toContain('F=100');
    expect(out).toContain('H=60');
    expect(out).toContain('Y=1');
    expect(out).toContain('D=0');
  });
});

// ---------------------------------------------------------------------------
// Status display
// ---------------------------------------------------------------------------

describe('City Game: status display (GOSUB 1000)', () => {
  it('should print city status header', async () => {
    const src = makeGameTest(INIT_STATE, 1000, [], SUB_STATUS);
    const out = await runBasic(src);
    expect(out).toContain('--- City Status ---');
  });

  it('should print gold, pop, food, happy values', async () => {
    const src = makeGameTest(INIT_STATE, 1000, [], SUB_STATUS);
    const out = await runBasic(src);
    expect(out).toContain('Gold: ');
    expect(out).toContain('500');
    expect(out).toContain('Pop: ');
    expect(out).toContain('50');
    expect(out).toContain('Food: ');
    expect(out).toContain('100');
    expect(out).toContain('Happy: ');
    expect(out).toContain('60');
  });
});

// ---------------------------------------------------------------------------
// Tax collection
// ---------------------------------------------------------------------------

describe('City Game: tax collection (GOSUB 200)', () => {
  it('should collect 2 gold per citizen', async () => {
    const src = makeGameTest(INIT_STATE, 200, ['M', 'T'], SUB_TAX);
    const out = await runBasic(src);
    // T = P * 2 = 50 * 2 = 100
    expect(out).toContain('T=100');
    // M = 500 + 100 = 600
    expect(out).toContain('M=600');
  });

  it('should print collecting message', async () => {
    const src = makeGameTest(INIT_STATE, 200, [], SUB_TAX);
    const out = await runBasic(src);
    expect(out).toContain('Collecting tax...');
    expect(out).toContain('You got ');
    expect(out).toContain('100');
    expect(out).toContain(' gold.');
  });

  it('should scale with population', async () => {
    const setup = `LET M = 100\nLET P = 200\nLET F = 100\nLET H = 60\nLET Y = 1\nLET D = 0`;
    const src = makeGameTest(setup, 200, ['M', 'T'], SUB_TAX);
    const out = await runBasic(src);
    // T = 200 * 2 = 400, M = 100 + 400 = 500
    expect(out).toContain('T=400');
    expect(out).toContain('M=500');
  });

  it('should work with zero population', async () => {
    const setup = `LET M = 500\nLET P = 0\nLET F = 100\nLET H = 60\nLET Y = 1\nLET D = 0`;
    const src = makeGameTest(setup, 200, ['M', 'T'], SUB_TAX);
    const out = await runBasic(src);
    expect(out).toContain('T=0');
    expect(out).toContain('M=500');
  });
});

// ---------------------------------------------------------------------------
// Buy food
// ---------------------------------------------------------------------------

describe('City Game: buy food (GOSUB 300)', () => {
  it('should deduct gold and add food when valid', async () => {
    const src = makeGameTest(INIT_STATE, 300, ['M', 'F'], SUB_BUY_FOOD);
    const out = await runBasic(src, ['10']);
    // M = 500 - 10 = 490, F = 100 + 50 = 150
    expect(out).toContain('M=490');
    expect(out).toContain('F=150');
    expect(out).toContain('Bought ');
  });

  it('should show not enough gold message when over budget', async () => {
    const setup = `LET M = 5\nLET P = 50\nLET F = 100\nLET H = 60\nLET Y = 1\nLET D = 0`;
    const src = makeGameTest(setup, 300, ['M', 'F'], SUB_BUY_FOOD);
    const out = await runBasic(src, ['10']);
    expect(out).toContain('Not enough gold!');
    expect(out).toContain('M=5');
    expect(out).toContain('F=100');
  });

  it('should show prompt and accept input', async () => {
    const src = makeGameTest(INIT_STATE, 300, [], SUB_BUY_FOOD);
    const out = await runBasic(src, ['10']);
    expect(out).toContain('Buy food: 1 gold = 5 food. How much gold?');
  });

  it('should handle negative input by returning early at line 315', async () => {
    const src = makeGameTest(INIT_STATE, 300, ['M', 'F'], SUB_BUY_FOOD);
    const out = await runBasic(src, ['-5']);
    expect(out).toContain('M=500');
    expect(out).toContain('F=100');
  });
});

// ---------------------------------------------------------------------------
// Build housing
// ---------------------------------------------------------------------------

describe('City Game: build housing (GOSUB 350)', () => {
  it('should build housing when enough gold', async () => {
    const src = makeGameTest(INIT_STATE, 350, ['M', 'P', 'H'], SUB_HOUSING);
    const out = await runBasic(src, ['1']);
    // M = 500 - 50 = 450, P = 50 + 20 = 70, H = 60 - 5 = 55
    expect(out).toContain('M=450');
    expect(out).toContain('P=70');
    expect(out).toContain('H=55');
    expect(out).toContain('Housing built.');
  });

  it('should cancel when user says no', async () => {
    const src = makeGameTest(INIT_STATE, 350, ['M', 'P', 'H'], SUB_HOUSING);
    const out = await runBasic(src, ['0']);
    expect(out).toContain('M=500');
    expect(out).toContain('P=50');
    expect(out).toContain('H=60');
    expect(out).not.toContain('Housing built.');
  });

  it('should show not enough gold message when low on gold', async () => {
    const setup = `LET M = 30\nLET P = 50\nLET F = 100\nLET H = 60\nLET Y = 1\nLET D = 0`;
    const src = makeGameTest(setup, 350, ['M', 'P'], SUB_HOUSING);
    const out = await runBasic(src, ['1']);
    expect(out).toContain('Need 50 gold!');
    expect(out).toContain('M=30');
    expect(out).toContain('P=50');
  });

  it('should show prompt message', async () => {
    const src = makeGameTest(INIT_STATE, 350, [], SUB_HOUSING);
    const out = await runBasic(src, ['1']);
    expect(out).toContain('Build housing: 50 gold -> +20 people. Build? 1=Yes 0=No');
  });
});

// ---------------------------------------------------------------------------
// Build farm
// ---------------------------------------------------------------------------

describe('City Game: build farm (GOSUB 400)', () => {
  it('should build farm when enough gold', async () => {
    const src = makeGameTest(INIT_STATE, 400, ['M', 'D'], SUB_FARM);
    const out = await runBasic(src, ['1']);
    // M = 500 - 80 = 420, D = 0 + 50 = 50
    expect(out).toContain('M=420');
    expect(out).toContain('D=50');
    expect(out).toContain('Farm built.');
  });

  it('should cancel when user says no', async () => {
    const src = makeGameTest(INIT_STATE, 400, ['M', 'D'], SUB_FARM);
    const out = await runBasic(src, ['0']);
    expect(out).toContain('M=500');
    expect(out).toContain('D=0');
    expect(out).not.toContain('Farm built.');
  });

  it('should show not enough gold message when low on gold', async () => {
    const setup = `LET M = 50\nLET P = 50\nLET F = 100\nLET H = 60\nLET Y = 1\nLET D = 0`;
    const src = makeGameTest(setup, 400, ['M', 'D'], SUB_FARM);
    const out = await runBasic(src, ['1']);
    expect(out).toContain('Need 80 gold!');
    expect(out).toContain('M=50');
    expect(out).toContain('D=0');
  });

  it('should show prompt message', async () => {
    const src = makeGameTest(INIT_STATE, 400, [], SUB_FARM);
    const out = await runBasic(src, ['1']);
    expect(out).toContain('Build farm: 80 gold -> +50 food/turn. Build? 1=Yes 0=No');
  });
});

// ---------------------------------------------------------------------------
// Next year processing
// ---------------------------------------------------------------------------

describe('City Game: next year (GOSUB 600)', () => {
  it('should increment year', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const src = makeGameTest(INIT_STATE, 600, ['Y'], SUB_NEXT_YEAR + SUB_EARTHQUAKE_ALL);
    const out = await runBasic(src);
    expect(out).toContain('Y=2');
  });

  it('should consume food equal to population', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const src = makeGameTest(INIT_STATE, 600, ['F'], SUB_NEXT_YEAR + SUB_EARTHQUAKE_ALL);
    const out = await runBasic(src);
    // F = 100 - 50 (pop) + 0 (farms) = 50
    expect(out).toContain('F=50');
  });

  it('should add farm production to food', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const setup = `LET M = 500\nLET P = 50\nLET F = 100\nLET H = 60\nLET Y = 1\nLET D = 80`;
    const src = makeGameTest(setup, 600, ['F'], SUB_NEXT_YEAR + SUB_EARTHQUAKE_ALL);
    const out = await runBasic(src);
    // F = 100 - 50 + 80 = 130
    expect(out).toContain('F=130');
  });

  it('should clamp food to 0 before adding farm production', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const setup = `LET M = 500\nLET P = 200\nLET F = 50\nLET H = 60\nLET Y = 1\nLET D = 30`;
    const src = makeGameTest(setup, 600, ['F'], SUB_NEXT_YEAR + SUB_EARTHQUAKE_ALL);
    const out = await runBasic(src);
    // F = 50 - 200 → clamped to 0, then +30 = 30
    expect(out).toContain('F=30');
  });

  it('should increase happiness by 2 each year', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const src = makeGameTest(INIT_STATE, 600, ['H'], SUB_NEXT_YEAR + SUB_EARTHQUAKE_ALL);
    const out = await runBasic(src);
    // H = 60 + 2 = 62
    expect(out).toContain('H=62');
  });

  it('should cap happiness at 100', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const setup = `LET M = 500\nLET P = 50\nLET F = 100\nLET H = 99\nLET Y = 1\nLET D = 0`;
    const src = makeGameTest(setup, 600, ['H'], SUB_NEXT_YEAR + SUB_EARTHQUAKE_ALL);
    const out = await runBasic(src);
    // H = 99 + 2 = 101 → capped to 100
    expect(out).toContain('H=100');
  });

  it('should not reduce pop when no riots or famine', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const setup = `LET M = 500\nLET P = 50\nLET F = 200\nLET H = 60\nLET Y = 1\nLET D = 100`;
    const src = makeGameTest(setup, 600, ['P'], SUB_NEXT_YEAR + SUB_EARTHQUAKE_ALL);
    const out = await runBasic(src);
    // F = 200 - 50 + 100 = 250. H = 62. R=5, no random pop change. Q=10, no quake.
    // H(62) >= 20, no riots. F(250) >= P(50), no famine. Pop unchanged.
    expect(out).toContain('P=50');
    expect(out).not.toContain('Riots!');
    expect(out).not.toContain('Famine!');
  });

  it('should print riots message and reduce pop when happiness below 20', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const setup = `LET M = 500\nLET P = 50\nLET F = 200\nLET H = 10\nLET Y = 1\nLET D = 0`;
    const src = makeGameTest(setup, 600, ['P'], SUB_NEXT_YEAR + SUB_EARTHQUAKE_ALL);
    const out = await runBasic(src);
    // H = 10 + 2 = 12 < 20 → riots: P = 50 - 10 = 40
    // F = 200 - 50 = 150. F(150) >= P(40), no famine.
    expect(out).toContain('Riots! Pop -10.');
    expect(out).toContain('P=40');
  });

  it('should print famine message and reduce pop when food less than population', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const setup = `LET M = 500\nLET P = 80\nLET F = 50\nLET H = 60\nLET Y = 1\nLET D = 0`;
    const src = makeGameTest(setup, 600, ['P', 'F'], SUB_NEXT_YEAR + SUB_EARTHQUAKE_ALL);
    const out = await runBasic(src);
    // F = 50 - 80 → clamped to 0, + 0 = 0. H = 62. No riots.
    // F(0) < P(80) → famine: P = 80 - 5 = 75
    expect(out).toContain('Famine! Pop -5.');
    expect(out).toContain('P=75');
    expect(out).toContain('F=0');
  });

  it('should add random population when R < 2', async () => {
    // mock 0.1 → R = floor(0.1*10) = 1 < 2 → pop gain, RND(15) = floor(0.1*15) = 1
    // Q = floor(0.1*20) = 2 ≠ 0 → no quake
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const src = makeGameTest(INIT_STATE, 600, ['P'], SUB_NEXT_YEAR + SUB_EARTHQUAKE_ALL);
    const out = await runBasic(src);
    // P = 50 + 1 = 51. F = 100 - 50 = 50. H = 62, no riots.
    // F(50) < P(51) → famine: P = 51 - 5 = 46
    expect(out).toContain('P=46');
  });

  it('should lose population when R >= 8', async () => {
    // R = floor(0.85 * 10) = 8 >= 8 → pop loss -5
    // Q = floor(0.85 * 20) = 17 ≠ 0 → no quake
    vi.spyOn(Math, 'random').mockReturnValue(0.85);
    const setup = `LET M = 500\nLET P = 50\nLET F = 200\nLET H = 60\nLET Y = 1\nLET D = 100`;
    const src = makeGameTest(setup, 600, ['P'], SUB_NEXT_YEAR + SUB_EARTHQUAKE_ALL);
    const out = await runBasic(src);
    // P = 50 - 5 = 45 (R >= 8). F = 200 - 50 + 100 = 250. H = 62.
    // No riots. F(250) >= P(45), no famine.
    expect(out).toContain('P=45');
  });

  it('should clamp population to 0 on massive loss', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const setup = `LET M = 500\nLET P = 3\nLET F = 0\nLET H = 5\nLET Y = 1\nLET D = 0`;
    const src = makeGameTest(setup, 600, ['P'], SUB_NEXT_YEAR + SUB_EARTHQUAKE_ALL);
    const out = await runBasic(src);
    // H = 7 < 20 → riots: P = 3 - 10 = -7 → clamped to 0.
    // F(0) < P(0)? No. Pop stays 0.
    expect(out).toContain('P=0');
  });
});

// ---------------------------------------------------------------------------
// End game
// ---------------------------------------------------------------------------

describe('City Game: end game (line 900)', () => {
  it('should print goodbye message', async () => {
    const src = `GOTO 900\n900 PRINT "Goodbye, Mayor!"\n905 END`;
    const out = await runBasic(src);
    expect(out).toContain('Goodbye, Mayor!');
  });
});

// ---------------------------------------------------------------------------
// Full game flow integration tests
// ---------------------------------------------------------------------------

const FULL_GAME = `
10 GOSUB 1100
15 GOSUB 1000

20 GOSUB 500
25 IF C = 6 THEN GOTO 900
30 IF C = 1 THEN GOSUB 200
40 IF C = 2 THEN GOSUB 300
50 IF C = 3 THEN GOSUB 350
60 IF C = 4 THEN GOSUB 400
70 IF C = 5 THEN GOSUB 600
85 GOTO 20

200 PRINT "Collecting tax..."
205 LET T = P * 2
210 LET M = M + T
215 PRINT "You got ", T, " gold."
220 RETURN

300 PRINT "Buy food: 1 gold = 5 food. How much gold?"
305 INPUT T
310 IF T > M THEN GOTO 332
315 IF T < 0 THEN RETURN
320 LET M = M - T
325 LET F = F + T * 5
330 PRINT "Bought ", T * 5, " food."
331 RETURN
332 PRINT "Not enough gold!"
335 RETURN

350 PRINT "Build housing: 50 gold -> +20 people. Build? 1=Yes 0=No"
355 INPUT T
360 IF T <> 1 THEN RETURN
365 IF M < 50 THEN GOTO 387
370 LET M = M - 50
375 LET P = P + 20
380 LET H = H - 5
385 PRINT "Housing built. Pop +20, Happiness -5."
386 RETURN
387 PRINT "Need 50 gold!"
390 RETURN

400 PRINT "Build farm: 80 gold -> +50 food/turn. Build? 1=Yes 0=No"
405 INPUT T
410 IF T <> 1 THEN RETURN
415 IF M < 80 THEN GOTO 432
420 LET M = M - 80
425 LET D = D + 50
430 PRINT "Farm built. +50 food each year."
431 RETURN
432 PRINT "Need 80 gold!"
435 RETURN

500 PRINT ""
505 PRINT "=== Year ", Y, " ==="
510 GOSUB 1000
515 PRINT "1=Tax 2=Buy food 3=Housing 4=Farm 5=Next year 6=Quit"
520 INPUT C
525 RETURN

600 LET Y = Y + 1
605 LET F = F - P
610 IF F < 0 THEN LET F = 0
615 LET F = F + D
620 LET H = H + 2
625 IF H > 100 THEN LET H = 100
630 LET R = RND(10)
635 IF R < 2 THEN LET P = P + RND(15)
640 IF R >= 8 THEN LET P = P - 5
642 LET Q = RND(20)
643 IF Q = 0 THEN GOSUB 700
645 IF P < 0 THEN LET P = 0
650 IF H < 20 THEN PRINT "Riots! Pop -10."
652 IF H < 20 THEN LET P = P - 10
655 IF P < 0 THEN LET P = 0
660 IF F < P THEN PRINT "Famine! Pop -5."
662 IF F < P THEN LET P = P - 5
665 IF P < 0 THEN LET P = 0
670 RETURN

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
784 PRINT "Pop -15, Happy -15, Farms -20, Repair cost 80 gold."
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
808 PRINT "Pop -30, Happy -30, Farms -40, Food -50, Repair cost 150 gold."
810 RETURN

900 PRINT "Goodbye, Mayor!"
905 END

1000 PRINT "--- City Status ---"
1005 PRINT "Gold: ", M, " Pop: ", P, " Food: ", F, " Happy: ", H
1010 RETURN

1100 LET M = 500
1105 LET P = 50
1110 LET F = 100
1115 LET H = 60
1120 LET Y = 1
1125 LET D = 0
1130 RETURN
`;

describe('City Game: full game flow', () => {
  it('should start and immediately quit', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const out = await runBasic(FULL_GAME, ['6']);
    expect(out).toContain('--- City Status ---');
    expect(out).toContain('=== Year ');
    expect(out).toContain('Goodbye, Mayor!');
  });

  it('should collect tax then quit', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const out = await runBasic(FULL_GAME, ['1', '6']);
    expect(out).toContain('Collecting tax...');
    expect(out).toContain('You got ');
    expect(out).toContain('Goodbye, Mayor!');
  });

  it('should buy food then quit', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    // 2 = buy food, 20 = gold amount, 6 = quit
    const out = await runBasic(FULL_GAME, ['2', '20', '6']);
    expect(out).toContain('Buy food: 1 gold = 5 food. How much gold?');
    expect(out).toContain('Bought ');
    expect(out).toContain('Goodbye, Mayor!');
  });

  it('should build housing then quit', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const out = await runBasic(FULL_GAME, ['3', '1', '6']);
    expect(out).toContain('Build housing:');
    expect(out).toContain('Housing built.');
    expect(out).toContain('Goodbye, Mayor!');
  });

  it('should build farm then quit', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const out = await runBasic(FULL_GAME, ['4', '1', '6']);
    expect(out).toContain('Build farm:');
    expect(out).toContain('Farm built.');
    expect(out).toContain('Goodbye, Mayor!');
  });

  it('should advance year then quit', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const out = await runBasic(FULL_GAME, ['5', '6']);
    expect(out).toContain('=== Year ');
    expect(out).toContain('Goodbye, Mayor!');
  });

  it('should play tax then next year then quit', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    // Tax → Next year → Quit
    const out = await runBasic(FULL_GAME, ['1', '5', '6']);
    expect(out).toContain('Collecting tax...');
    expect(out).toContain('Goodbye, Mayor!');
  });

  it('should show updated gold after tax', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const out = await runBasic(FULL_GAME, ['1', '6']);
    // After tax with P=50: Gold goes from 500 to 600
    expect(out).toContain('600');
  });

  it('should handle declined housing and farm', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const out = await runBasic(FULL_GAME, ['3', '0', '4', '0', '6']);
    expect(out).not.toContain('Housing built.');
    expect(out).not.toContain('Farm built.');
    expect(out).toContain('Goodbye, Mayor!');
  });
});

// ---------------------------------------------------------------------------
// Menu display
// ---------------------------------------------------------------------------

describe('City Game: menu (GOSUB 500)', () => {
  it('should display year and options', async () => {
    const src = `${INIT_STATE}
GOSUB 500
END
${SUB_STATUS}
500 PRINT ""
505 PRINT "=== Year ", Y, " ==="
510 GOSUB 1000
515 PRINT "1=Tax 2=Buy food 3=Housing 4=Farm 5=Next year 6=Quit"
520 INPUT C
525 RETURN
`;
    const out = await runBasic(src, ['6']);
    expect(out).toContain('=== Year ');
    expect(out).toContain('1');
    expect(out).toContain('--- City Status ---');
    expect(out).toContain('1=Tax 2=Buy food 3=Housing 4=Farm 5=Next year 6=Quit');
  });
});
