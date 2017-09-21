# Cobra-AI
A Skirmish AI for warzone2100 with a dynamic build and research order for all Technology levels and bases (Supports hover maps like Sk-Manhattan). This AI is meant to be played (and tested the most) on normal difficulty. Hard and insane difficulty are for serious play only (early research bonus and access to hidden weapons). Easy will force Cobra to do everything at a much slower pace. Originally based off of the pre-rewrite SemperFi-js AI that comes with the game (https://github.com/Warzone2100/warzone2100/blob/master/data/mp/multiplay/skirmish/semperfi.js).

Cobra uses a "grudge counter" to determine who it attacks. It contains a number for each player that increments with each aggressive act an enemy player makes towards it. The enemy with the highest number assigned to it is the one it attacks. The specific number for each enemy can easily be influenced by allied Cobra AI and, under the right circumstance, allows allied Cobra to take action against a specific player. This feature is very helpful in determining who is the biggest threat on the map and more or less balances the skirmish by keeping pressure on the most aggressive player (that it has encountered) until one of them is defeated.

There are five personalities so far (all use lasers and plasma cannon when it can):

1. AC: Cannon/Gauss/Howitzer.
2. AR: Flamer/Gauss/Howitzer.
3. AB: Rockets & missiles/Gauss/rocket & missile artillery.
4. AM: Machine-guns/Lasers/Howitzer.
5. AL: Lasers/Gauss/Fire mortar.

Do note that AL is exclusive to T3 (with at least bases) and AM is exclusive to T1 (or if starting without a base). This only affects the initial personality and you can change the personality with a chat command later.

Hard/insane difficulty enables Heavy Plasma Launcher for Cobra (very small chance of being built at any given time after it obtains tracked propulsion).

chat commands include:
1. need power/truck/tank/cyborg/vtol.
2. AC/AR/AB/AM/AL -- make it switch personalities.
3. FFA -- after a team skirmish is won, break alliance and fight it (does not count as win/loss either way).
4. toggle cyborg -- disable/enable cyborg use.
5. toggle hover -- force Cobra to use hover propulsion for all tanks.
6. oil level -- Ask what the oil count of the whole map is with a response of low, medium, or high.
7. targetX -- Ask Cobra to focus on enemy player X.
8. stats -- Which player Cobra is currently targeting.
9. toggle arti -- Enable or disable artillery production/research.
10. toggle vtol -- Enable or disable VTOL production/research.

Press alt + h to drop a beacon and Cobra units will try making their way over to it if possible.

Warzone2100 links:
1. This AI uses a slimmed version of the NullBot3 standard ruleset file for research related information: https://github.com/haoNoQ/nullbot
2. Website https://wz2100.net/
3. Github https://github.com/Warzone2100/warzone2100
4. Official discussion forum thread: http://forums.wz2100.net/viewtopic.php?f=49&t=12676
