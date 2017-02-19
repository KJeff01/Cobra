# Cobra-AI
A Skirmish AI for warzone2100 (Supports hover maps like Sk-Manhattan). It is most difficult to defeat in a T1 no bases skirmish. I likely have different standards of the definition 'hard' and 'insane' than most, so those two difficulties are reserved for serious skirmish play. Other wise play on normal.

This is an experimental AI specifically designed for team skirmish battles. Meaning that it will be more helpful to a human player as it can relay important information to its allies about the enemy. Teamed Cobra AIs are quite formidable and often can beat any other AI teams. It does perform well without an ally also (but defeats the purpose of this AI).
Originally based off of the semperfi-js AI that comes with the game (A somewhat completed clone of its WZScript version).

There are three personalities so far:

AC: Focus on Cannon/Mortar technology. AR: Focus on Flamer/Mortar technology. AB: Focus on Machine-gun/Rocket technology.

All personalities will use machine-guns and lasers. Hard/insane difficulty enable the Heavy Plasma Laucher for Cobra (~1/40 chance of being built at any given time after it obtains tracked propulsion).

Cobra is highly aggressive once attacked. The more you attack it, the more it will come after you. It will follow fleeing units until they are destroyed, or the Cobra unit group is destroyed. Prepare to guard your oil at this point since Cobra will attack your base and your oil derricks closest to its base.


This AI will try to emulate the the core functionality of the NEXUS Intruder Program (Insane difficulty only). As long as Cobra's HQ is intact it will scan enemy droids for technologies that Cobra does not have (Weapons/Propulsion/Body). If an enemy unit has superior technology, then Cobra can assimilate the new core components of the droid. Even better is that Cobra will be granted all the required research that leads to the new component. Also it can force enemy droids to malfunction and attack friendly units/its own structures/or even stop the action of the target droid. This is all experimental, but shows great results (it can therefore counter a 'research all' cheater).


chat commands include: 
need power/truck/tank/cyborg/vtol, attackX (X being a player number). Unstable commands included are friend(forced ally) and help me!/help me!! for calling for Cobra units to go to your hq (for compatibility with Nexus AI). It does respond mostly through beacon calls dropped with alt+h.

warzone2100 links:

This AI uses the NullBot3 standard file for research related information: https://github.com/haoNoQ/nullbot

website https://wz2100.net/ github https://github.com/Warzone2100/warzone2100

Official discussion forum thread: http://forums.wz2100.net/viewtopic.php?f=49&t=12676
