REM ============================================
REM   CITY MANAGER - BASIC City Management Game
REM   Money(M) Pop(P) Food(F) Happy(H) Year(Y) Farms(D)
REM ============================================

10 GOSUB 1100
15 GOSUB 1000

REM ----- Main turn loop -----

20 GOSUB 500
25 IF C = 6 THEN GOTO 900
30 IF C = 1 THEN GOSUB 200
40 IF C = 2 THEN GOSUB 300
50 IF C = 3 THEN GOSUB 350
60 IF C = 4 THEN GOSUB 400
70 IF C = 5 THEN GOSUB 600
85 GOTO 20

REM ----- Collect tax -----

200 PRINT "Collecting tax..."
205   LET T = P * 2
210   LET M = M + T
215   PRINT "You got ", T, " gold."
220 RETURN

REM ----- Buy food -----

300 PRINT "Buy food: 1 gold = 5 food. How much gold?"
305   INPUT T
310   IF T > M THEN PRINT "Not enough gold!": RETURN
315   IF T < 0 THEN RETURN
320   LET M = M - T
325   LET F = F + T * 5
330   PRINT "Bought ", T * 5, " food."
335 RETURN

REM ----- Build housing -----

350 PRINT "Build housing: 50 gold -> +20 people. Build? 1=Yes 0=No"
355   INPUT T
360   IF T <> 1 THEN RETURN
365   IF M < 50 THEN PRINT "Need 50 gold!": RETURN
370   LET M = M - 50
375   LET P = P + 20
380   LET H = H - 5
385   PRINT "Housing built. Pop +20, Happiness -5."
390 RETURN

REM ----- Build farm -----

400 PRINT "Build farm: 80 gold -> +50 food/turn. Build? 1=Yes 0=No"
405   INPUT T
410   IF T <> 1 THEN RETURN
415   IF M < 80 THEN PRINT "Need 80 gold!": RETURN
420   LET M = M - 80
425   LET D = D + 50
430   PRINT "Farm built. +50 food each year."
435 RETURN

REM ----- Show menu -----

500 PRINT ""
505   PRINT "=== Year ", Y, " ==="
510   GOSUB 1000
515   PRINT "1=Tax 2=Buy food 3=Housing 4=Farm 5=Next year 6=Quit"
520   INPUT C
525 RETURN

REM ----- Next year -----

600 LET Y = Y + 1
605   LET F = F - P
610   IF F < 0 THEN LET F = 0
615   LET F = F + D
620   LET H = H + 2
625   IF H > 100 THEN LET H = 100

630   LET R = RND(10)
635   IF R < 2 THEN LET P = P + RND(15)
640   IF R >= 8 THEN LET P = P - 5

642   LET Q = RND(20)
643   IF Q = 0 THEN GOSUB 700

645   IF P < 0 THEN LET P = 0
650   IF H < 20 THEN PRINT "Riots! Pop -10.": LET P = P - 10
655   IF P < 0 THEN LET P = 0
660   IF F < P THEN PRINT "Famine! Pop -5.": LET P = P - 5
665   IF P < 0 THEN LET P = 0
670 RETURN

REM ----- Earthquake -----

700 PRINT ""
705   PRINT "*** EARTHQUAKE! ***"
710   LET E = RND(3) + 1
715   IF E = 1 THEN GOSUB 750
720   IF E = 2 THEN GOSUB 770
725   IF E = 3 THEN GOSUB 790
730 RETURN

REM -- Minor quake --

750 PRINT "A minor earthquake shakes the city."
752   LET P = P - 5
754   LET H = H - 5
756   LET M = M - 30
758   IF M < 0 THEN LET M = 0
760   PRINT "Pop -5, Happy -5, Repair cost 30 gold."
762 RETURN

REM -- Major quake --

770 PRINT "A major earthquake hits! Buildings collapse!"
772   LET P = P - 15
774   LET H = H - 15
776   LET D = D - 20
778   IF D < 0 THEN LET D = 0
780   LET M = M - 80
782   IF M < 0 THEN LET M = 0
784   PRINT "Pop -15, Happy -15, Farms -20, Repair cost 80 gold."
786 RETURN

REM -- Devastating quake --

790 PRINT "DEVASTATING earthquake! The city is in ruins!"
792   LET P = P - 30
794   LET H = H - 30
796   LET D = D - 40
798   IF D < 0 THEN LET D = 0
800   LET F = F - 50
802   IF F < 0 THEN LET F = 0
804   LET M = M - 150
806   IF M < 0 THEN LET M = 0
808   PRINT "Pop -30, Happy -30, Farms -40, Food -50, Repair cost 150 gold."
810 RETURN

REM ----- Show status -----

1000 PRINT "--- City Status ---"
1005   PRINT "Gold: ", M, " Pop: ", P, " Food: ", F, " Happy: ", H
1010 RETURN

REM ----- Init -----

1100 LET M = 500
1105   LET P = 50
1110   LET F = 100
1115   LET H = 60
1120   LET Y = 1
1125   LET D = 0
1130 RETURN

REM ----- End game -----

900 PRINT "Goodbye, Mayor!"
905 END
