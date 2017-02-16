# Cobra-AI
A Skirmish AI for warzone2100

This is an experimental AI specifically designed for team skirmish battles. Meaning that will be more helpful to a human player as it can relay important information to its allies about the enemy. Teamed Cobra AIs are quite formidable and often can beat any other AI when teamed. It does perform well without an ally also (but defeats the purpose of this AI).
Originally based off of the semperfi-js AI that comes with the game (A somewhat completed clone of its WZScript version).

There are three personalities so far:

1. AC: Focus on Cannon/Mortar technology.

2. AR: Focus on Flamer.Mortar technology.

3. AB: Focus on Machine-gun/Rocket technology.

All personalities will use machine-guns and lasers.

This AI will try to emulate the the core functionality of the NEXUS Intruder Program (Insane difficulty only). As long as Cobra's HQ is intact it will scan enemy droids for technologies that Cobra does not have (Weapons/Propulsion/Body). If an enemy unit has superior technology, then Cobra can assimilate the new core components of the droid. Even better is that Cobra will be granted all the required research that leads to the new component. Also it can force enemy droids to malfunction and attack friendly units/its own structures/or even stop the action of the target droid. This is all experimental, but shows great results.


chat commands include: 

need power/truck/tank/cyborg/vtol, attackX (X being a player number). Unstable commands included are friend(forced ally) and help me!/help me!! for calling for Cobra units to go to your hq. It does respond mostly through beacon calls dropped with alt+h.

This AI uses the NullBot3 standard file for research related information: https://github.com/haoNoQ/nullbot

warzone2100 links:

website https://wz2100.net/

github https://github.com/Warzone2100/warzone2100
