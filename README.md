# Cobra-AI
A Skirmish AI for warzone2100 with a dynamic build and research order for all Technology levels and bases (Supports hover maps like Sk-Manhattan). This AI is meant to be played (and tested the most) on normal difficulty. Hard and insane difficulty are for serious play only (early research bonus and access to hidden weapons). Originally based off of the semperfi-js AI that comes with the game (https://github.com/Warzone2100/warzone2100/blob/master/data/mp/multiplay/skirmish/semperfi.js).

This is an experimental AI specifically designed for team skirmish battles and aims to be more helpful for a human player than other AI. Some work has been done so that Teamed Cobra AIs can easily communicate and execute strategies based on enemy actions (needs more work) and often can beat any other AI teams. It does perform well without an ally also (but defeats the purpose of this AI).

There are four personalities so far (all use lasers and plasma cannon when it can):

AC: Focus on Cannon/Gauss/Incendiary howitzers technology. AR: Focus on Flamer/Rockets/howitzers technology. AB: Focus on Rocket/Missle/Gauss technology. AM: (incendiary)howitzers/lasers/machine-guns.

Machine-gun and cyborg usage depends heavily on the starting conditions of the skirmish and mostly are only used when starting on T1. Hard/insane difficulty enables some hidden weapons (Heavy Plasma Laucher/EMP Mortar) for Cobra (very small chance of being built at any given time after it obtains tracked propulsion). It does respond mostly through beacon calls dropped with alt+h.


This AI will try to emulate the the core functionality of the NEXUS Intruder Program (Insane difficulty only). As long as Cobra's HQ is intact it will scan enemy droids for technologies that Cobra does not have (Weapons/Propulsion/Body) and even defense upgrades. If an enemy unit has superior technology, then Cobra can assimilate the new core components of the droid. Even better is that Cobra will be granted all the required research that leads to the new component. Also it can force enemy droids to malfunction and attack friendly units/its own structures/or even stop the action of the target droid. This is mostly a toy feature.


chat commands include: 
need power/truck/tank/cyborg/vtol.
attackX -- (X being a player number). 
oilX -- to specifically attack nearby enemy oil. help me!/help me!! for calling for Cobra units to go to your hq (for compatibility with Nexus AI). 
AC/AR/AB/AM -- make it switch personalities.
FFA -- after a team skirmish is won, break alliance and fight it.
toggle mg -- disable/enable machinegun use.
toggle cyborg -- disable/enable cyborg use.
toggle hover -- disable/enable force Cobra to use hover propulsion.

warzone2100 links:

This AI uses a slimmed version of the NullBot3 standard file for research related information: https://github.com/haoNoQ/nullbot

website https://wz2100.net/ github https://github.com/Warzone2100/warzone2100

Official discussion forum thread: http://forums.wz2100.net/viewtopic.php?f=49&t=12676
