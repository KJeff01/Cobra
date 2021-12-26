# Cobra-AI
A Skirmish AI for warzone2100 with a dynamic build and research order for all Technology levels and bases (Supports hover maps like Sk-Manhattan). This AI is meant to be played (and tested the most) on normal difficulty. Hard and insane difficulty are for serious play only. Easy will force Cobra to do everything at a much slower pace and capture oil relative to the amount another player has.

Originally based off of the pre-rewrite SemperFi-js AI that comes with the game (https://github.com/Warzone2100/warzone2100/blob/master/data/mp/multiplay/skirmish/semperfi.js).

Cobra uses a "grudge counter" to determine who it attacks. It contains a number for each player that increments with each aggressive act an enemy player makes towards it. The enemy with the highest number assigned to it is the one it attacks. The specific number for each enemy can easily be influenced by allied Cobra AI and, under the right circumstance, allows allied Cobra to take action against a specific player. This feature is very helpful in determining who is the biggest threat on the map and more or less balances the skirmish by keeping pressure on the most aggressive player (that it has encountered) until one of them is defeated.

There are five personalities so far (all use lasers and plasma cannon when it can or is enabled to):

1. AC: Cannon/Gauss/Howitzer.
2. AR: Flamer/Gauss/Howitzer.
3. AB: Rockets & missiles/Gauss/rocket & missile artillery.
4. AM: Machine-guns/Lasers/Howitzer.
5. AA: Mortars/Gauss/Fire mortars

chat commands include:
1. need power/truck/tank/cyborg/vtol.
2. AC/AR/AB/AM/AA -- make it switch personalities.
3. toggle cyborg -- disable/enable cyborg use.
4. toggle hover -- force Cobra to use hover propulsion for all tanks.
5. oil level -- Ask what the oil count of the whole map is with a response of low, medium, or high.
6. targetX -- Ask Cobra to focus on enemy player X.
7. stats -- Which player Cobra is currently targeting.
8. toggle arti -- Enable or disable artillery production/research.
9. toggle vtol -- Enable or disable VTOL production/research.
10. resG/resO/resD/resA -- Switch research paths to generic, offensive, defensive, and air.
11. toggle beacon -- Enable or disable Cobra beacon protection functionality.

Press alt + h to drop a beacon and Cobra units will try making their way over to it if possible. Beacon functionality is disabled by default on low/medium oil maps.

Warzone2100 links:
1. This AI uses a slimmed version of the NullBot3 standard ruleset file for research related information: https://github.com/haoNoQ/nullbot
2. Website https://wz2100.net/
3. Github https://github.com/Warzone2100/warzone2100
4. Official discussion forum thread: http://forums.wz2100.net/viewtopic.php?f=49&t=12676
