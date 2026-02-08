REM ============================================
REM   城市管理者 - BASIC 城市经营游戏
REM   金币(M) 人口(P) 粮食(F) 幸福(H) 年份(Y) 农场产量(D)
REM ============================================

10 GOSUB 1100
12 GOSUB 1200
15 GOSUB 1000

REM ----- 主循环 -----

20 GOSUB 500
25 IF C = 7 THEN GOTO 900
30 IF C = 1 THEN GOSUB 200
40 IF C = 2 THEN GOSUB 300
50 IF C = 3 THEN GOSUB 350
60 IF C = 4 THEN GOSUB 400
70 IF C = 5 THEN GOSUB 600
75 IF C = 6 THEN GOSUB 1200
85 GOTO 20

REM ----- 征税 -----

200 PRINT "正在征税..."
205   LET T = P * 2
210   LET M = M + T
215   PRINT "获得 ", T, " 金币。"
220 RETURN

REM ----- 购买粮食 -----

300 PRINT "购买粮食: 1金币 = 5粮食。花多少金币?"
305   INPUT T
310   IF T > M THEN GOTO 332
315   IF T < 0 THEN RETURN
320   LET M = M - T
325   LET F = F + T * 5
330   PRINT "购入 ", T * 5, " 粮食。"
331   RETURN
332   PRINT "金币不足!"
335 RETURN

REM ----- 建造房屋 -----

350 PRINT "建造房屋: 50金币 -> +20人口。建造? 1=是 0=否"
355   INPUT T
360   IF T <> 1 THEN RETURN
365   IF M < 50 THEN GOTO 387
370   LET M = M - 50
375   LET P = P + 20
380   LET H = H - 5
385   PRINT "房屋建成。人口+20, 幸福-5。"
386   RETURN
387   PRINT "需要50金币!"
390 RETURN

REM ----- 建造农场 -----

400 PRINT "建造农场: 80金币 -> 每年+50粮食。建造? 1=是 0=否"
405   INPUT T
410   IF T <> 1 THEN RETURN
415   IF M < 80 THEN GOTO 432
420   LET M = M - 80
425   LET D = D + 50
430   PRINT "农场建成。每年+50粮食。"
431   RETURN
432   PRINT "需要80金币!"
435 RETURN

REM ----- 显示菜单 -----

500 PRINT ""
505   PRINT "=== 第 ", Y, " 年 ==="
510   GOSUB 1000
515   PRINT "1=征税 2=买粮 3=房屋 4=农场 5=下一年 6=帮助 7=退出"
520   INPUT C
525 RETURN

REM ----- 进入下一年 -----

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
650   IF H < 20 THEN PRINT "暴动! 人口-10。"
652   IF H < 20 THEN LET P = P - 10
655   IF P < 0 THEN LET P = 0
660   IF F < P THEN PRINT "饥荒! 人口-5。"
662   IF F < P THEN LET P = P - 5
665   IF P < 0 THEN LET P = 0
670 RETURN

REM ----- 地震 -----

700 PRINT ""
705   PRINT "*** 地震! ***"
710   LET E = RND(3) + 1
715   IF E = 1 THEN GOSUB 750
720   IF E = 2 THEN GOSUB 770
725   IF E = 3 THEN GOSUB 790
730 RETURN

REM -- 轻微地震 --

750 PRINT "一场轻微地震撼动了城市。"
752   LET P = P - 5
754   LET H = H - 5
756   LET M = M - 30
758   IF M < 0 THEN LET M = 0
760   PRINT "人口-5, 幸福-5, 维修费30金币。"
762 RETURN

REM -- 强烈地震 --

770 PRINT "强烈地震来袭! 建筑倒塌!"
772   LET P = P - 15
774   LET H = H - 15
776   LET D = D - 20
778   IF D < 0 THEN LET D = 0
780   LET M = M - 80
782   IF M < 0 THEN LET M = 0
784   PRINT "人口-15, 幸福-15, 农场-20, 维修费80金币。"
786 RETURN

REM -- 毁灭性地震 --

790 PRINT "毁灭性大地震! 城市化为废墟!"
792   LET P = P - 30
794   LET H = H - 30
796   LET D = D - 40
798   IF D < 0 THEN LET D = 0
800   LET F = F - 50
802   IF F < 0 THEN LET F = 0
804   LET M = M - 150
806   IF M < 0 THEN LET M = 0
808   PRINT "人口-30, 幸福-30, 农场-40, 粮食-50, 维修费150金币。"
810 RETURN

REM ----- 显示状态 -----

1000 PRINT "--- 城市状态 ---"
1005   PRINT "金币: ", M, " 人口: ", P, " 粮食: ", F, " 幸福: ", H
1010 RETURN

REM ----- 初始化 -----

1100 LET M = 500
1105   LET P = 50
1110   LET F = 100
1115   LET H = 60
1120   LET Y = 1
1125   LET D = 0
1130 RETURN

REM ----- 欢迎 / 帮助 -----

1200 PRINT ""
1205   PRINT "========================================="
1210   PRINT "  欢迎, 市长! 你管理着一座小城市。"
1215   PRINT "========================================="
1220   PRINT ""
1225   PRINT "目标: 让市民活下去, 并保持幸福。"
1230   PRINT ""
1235   PRINT "每回合选择一个操作:"
1240   PRINT "  1 征税   - 每位市民收取2金币"
1245   PRINT "  2 买粮   - 花金币购买粮食 (1金币=5粮食)"
1250   PRINT "  3 房屋   - 50金币 -> +20人口, -5幸福"
1255   PRINT "  4 农场   - 80金币 -> 每年产出+50粮食"
1260   PRINT "  5 下一年 - 进入下一年"
1265   PRINT "  6 帮助   - 再次显示本指南"
1270   PRINT "  7 退出   - 结束游戏"
1275   PRINT ""
1280   PRINT "提示:"
1285   PRINT "  - 每年每位市民消耗1粮食"
1290   PRINT "  - 建造农场可自动产粮"
1295   PRINT "  - 幸福低于20会爆发暴动!"
1300   PRINT "  - 粮食不足会引发饥荒"
1305   PRINT "  - 每年可能随机发生地震"
1310   PRINT ""
1315 RETURN

REM ----- 结束游戏 -----

900 PRINT "再见, 市长!"
905 END
