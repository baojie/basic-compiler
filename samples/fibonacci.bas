REM Fibonacci - from Teeny Tiny Compiler style, using FOR
REM https://github.com/AZHenley/teenytinycompiler
PRINT "How many fibonacci numbers?"
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
