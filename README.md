# Cobra-AI
A Skirmish AI for warzone2100 with a dynamic build and research order for all Technology levels and bases (Supports hover maps like Sk-Manhattan). This AI is meant to be played (and tested the most) on normal difficulty. Hard and insane difficulty are for serious play only (early research bonus and access to hidden weapons). Originally based off of the semperfi-js AI that comes with the game (https://github.com/Warzone2100/warzone2100/blob/master/data/mp/multiplay/skirmish/semperfi.js).

There are five personalities so far (all use lasers and plasma cannon when it can):

1. AC: Focus on Cannon/Gauss/Howitzers technology.
2. AR: Focus on Flamer/Rockets/Howitzers technology.
3. AB: Focus on Rocket/Missile/Gauss technology.
4. AM: Machine-guns/Howitzers/lasers.
5. AL: Lasers/Fire mortars.

Do note that AL is exclusive to T3 (with at least bases) and AM is exclusive to T1 (or if starting without a base).

Hard/insane difficulty enables some hidden weapons (Heavy Plasma Laucher/EMP Mortar) for Cobra (very small chance of being built at any given time after it obtains tracked propulsion).

This AI will try to emulate the the core functionality of the NEXUS Intruder Program (Insane difficulty only). As long as the Cobra HQ is intact it will scan enemy droids for technologies that Cobra does not have (Weapons/Propulsion/Body) and even defense upgrades. If an enemy unit has superior technology, then Cobra can assimilate the new core components of the droid. Even better is that Cobra will be granted all the required research that leads to the new component. Also it can force enemy droids to malfunction and attack friendly units/its own structures/or even stop the action of the target droid. This is mostly a toy feature.


chat commands include: 
1. need power/truck/tank/cyborg/vtol.
2. attackX -- (X being a player number). 
3. oilX -- to specifically attack nearby enemy oil. help me!/help me!! for calling for Cobra units to go to your hq (for compatibility with Nexus AI). 
4. AC/AR/AB/AM/AL -- make it switch personalities.
5. FFA -- after a team skirmish is won, break alliance and fight it (does not count as win/loss either way).
6. toggle mg -- disable/enable machinegun use.
7. toggle cyborg -- disable/enable cyborg use.
8. toggle hover -- disable/enable force Cobra to use hover propulsion.
9. oil level -- Ask what the oil count is with a response of low, medium, or high.

warzone2100 links:
1. This AI uses a slimmed version of the NullBot3 standard file for research related information: https://github.com/haoNoQ/nullbot
2. website https://wz2100.net/ github https://github.com/Warzone2100/warzone2100
3. Official discussion forum thread: http://forums.wz2100.net/viewtopic.php?f=49&t=12676
