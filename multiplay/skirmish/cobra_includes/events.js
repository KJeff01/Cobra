//This file contains generic events. Chat and research events are split into
//their own seperate files.

//Initialze global variables and setup timers.
function eventStartLevel()
{
	attackGroup = newGroup();
	vtolGroup = newGroup();
	sensorGroup = newGroup();
	repairGroup = newGroup();
	artilleryGroup = newGroup();
	constructGroup = newGroup();
	oilGrabberGroup = newGroup();
	lastMsg = "eventGameInit";

	addDroidsToGroup(attackGroup, enumDroid(me, DROID_WEAPON).filter(function(obj) { return !obj.isCB; }));
	addDroidsToGroup(attackGroup, enumDroid(me, DROID_CYBORG));
	addDroidsToGroup(vtolGroup, enumDroid(me).filter(function(obj) { return isVTOL(obj); }));
	addDroidsToGroup(sensorGroup, enumDroid(me, DROID_SENSOR));
	addDroidsToGroup(repairGroup, enumDroid(me, DROID_REPAIR));
	addDroidsToGroup(artilleryGroup, enumDroid(me, DROID_WEAPON).filter(function(obj) { return obj.isCB; }));

	var cons = enumDroid(me, DROID_CONSTRUCT);
	for (var i = 0, l = cons.length; i < l; ++i)
	{
		if (l < MIN_TRUCKS)
		{
			!countStruct(FACTORY) ? groupAdd(constructGroup, cons[i]) : groupAdd(oilGrabberGroup, cons[i]);
		}
		else
		{
			if (i < Math.floor(l / 2))
			{
				groupAdd(constructGroup, cons[i]);
			}
			else
			{
				groupAdd(oilGrabberGroup, cons[i]);
			}
		}
	}

	researchComplete = false;
	initializeGrudgeCounter();
	diffPerks();
	forceHover = checkIfSeaMap();
	turnOffCyborgs = forceHover;
	choosePersonality();
	turnOffMG = CheckStartingBases();
	startedWithTech = CheckStartingBases();
	useArti = true;
	useVtol = true;
	lastAttackedByScavs = 0;
	resHistory = [];

	recycleForHover();
	buildOrders(); //Start building right away.

	const THINK_LONGER = (difficulty === EASY) ? 4000 + ((1 + random(4)) * random(1200)) : 0;
	setTimer("produce", THINK_LONGER + 700 + 3 * random(70));
	setTimer("checkAllForRepair", THINK_LONGER + 900 + 3 * random(60));
	setTimer("buildOrders", THINK_LONGER + 1100 + 3 * random(60));
	setTimer("research", THINK_LONGER + 1200 + 3 * random(70));
	setTimer("lookForOil", THINK_LONGER + 1600 + 3 * random(60))
	setTimer("repairDroidTactics", THINK_LONGER + 2500 + 4 * random(60));
	setTimer("artilleryTactics", THINK_LONGER + 4500 + 4 * random(60));
	setTimer("vtolTactics", THINK_LONGER + 5600 + 3 * random(70));
	setTimer("groundTactics", THINK_LONGER + 7000 + 5 * random(60));
	setTimer("switchOffMG", THINK_LONGER + 10000 + 3 * random(70));
	setTimer("recycleForHover", THINK_LONGER + 15000 + 2 * random(60));
	setTimer("stopTimers", THINK_LONGER + 100000 + 5 * random(70));
	if (DEBUG_LOG_ON)
	{
		setTimer("debugLogAtEnd", 150000 + 5 * random(70));
	}
}

//This is meant to check for nearby oil resources next to the construct. also
//defend our derrick if possible.
function eventStructureBuilt(structure, droid)
{
	if (structure.stattype === RESOURCE_EXTRACTOR) {
		var nearbyOils = enumRange(droid.x, droid.y, 8, ALL_PLAYERS, false);
		nearbyOils = nearbyOils.filter(function(obj) {
			return (obj.type === FEATURE) && (obj.stattype === OIL_RESOURCE);
		});
		nearbyOils = nearbyOils.sort(distanceToBase);
		droid.busy = false;

		if (isDefined(nearbyOils[0]))
		{
			orderDroidBuild(droid, DORDER_BUILD, structures.derricks, nearbyOils[0].x, nearbyOils[0].y);
		}
		else
		{
			var numDefenses = enumRange(droid.x, droid.y, 10, me, false);
			numDefenses = numDefenses.filter(function(obj) {
				return ((obj.type === STRUCTURE) && (obj.stattype === DEFENSE));
			});

			if ((gameTime > 120000) && (random(101) < subPersonalities[personality].defensePriority))
			{
				protectUnguardedDerricks(droid);
			}
		}
	}
}

//Make droids attack hidden close by enemy object.
function eventDroidIdle(droid)
{
	if (shouldCobraAttack() && (droid.droidType === DROID_WEAPON) || (droid.droidType === DROID_CYBORG) || isVTOL(droid))
	{
		var enemyObjects = enumRange(droid.x, droid.y, 6, ENEMIES, false);
		if (isDefined(enemyObjects[0]))
		{
			enemyObjects = enemyObjects.sort(distanceToBase);
			attackThisObject(droid.id, objectInformation(enemyObjects[0]));
		}
	}
	else if (droid.droidType === DROID_CONSTRUCT)
	{
		checkUnfinishedStructures(droid.id);
	}
}

//Groups droid types.
function eventDroidBuilt(droid, struct)
{
	if (isConstruct(droid.id))
	{
		//Combat engineesr are always base builders.
		if (droid.body !== "CyborgLightBody" && enumGroup(oilGrabberGroup).length < MIN_TRUCKS - 3)
		{
			groupAdd(oilGrabberGroup, droid);
		}
		else
		{
			groupAdd(constructGroup, droid);
		}
	}
	else if (droid.droidType === DROID_SENSOR)
	{
		groupAdd(sensorGroup, droid);
	}
	else if (droid.droidType === DROID_REPAIR)
	{
		groupAdd(repairGroup, droid);
	}
	else if (isVTOL(droid))
	{
		groupAdd(vtolGroup, droid);
	}
	else if (droid.droidType === DROID_WEAPON || droid.droidType === DROID_CYBORG)
	{
		//Anything with splash damage or CB abiliities go here.
		if (droid.isCB || droid.hasIndirect)
		{
			groupAdd(artilleryGroup, droid);
		}
		else
		{
			groupAdd(attackGroup, droid);
		}
	}
}

function eventAttacked(victim, attacker)
{
	if ((attacker === null) || (victim.player !== me) || allianceExistsBetween(attacker.player, victim.player))
	{
		return;
	}

	if (isDefined(scavengerPlayer) && (attacker.player === scavengerPlayer))
	{
		lastAttackedByScavs = gameTime;
		return;
	}

	if (attacker && victim && (attacker.player !== me) && !allianceExistsBetween(attacker.player, victim.player))
	{
		if (grudgeCount[attacker.player] < MAX_GRUDGE)
		{
			grudgeCount[attacker.player] += (victim.type === STRUCTURE) ? 20 : 5;
		}

		//Check if a droid needs repair.
		if ((victim.type === DROID) && countStruct(structures.extras[0]))
		{
			//System units are timid.
			if ((victim.droidType === DROID_SENSOR) || isConstruct(victim.id) || (victim.droidType === DROID_REPAIR))
			{
				orderDroid(victim, DORDER_RTR);
			}
			else
			{
				if (Math.floor(victim.health) < 42)
				{
					//Try to repair by force.
					orderDroid(victim, DORDER_RTR);
				}
				else
				{
					//Fuzzy repair algorithm.
					repairDroid(victim.id);
				}
			}
		}

		if (stopExecution("throttleEventAttacked2", 750) || !shouldCobraAttack())
		{
			return;
		}

		var units;
		if (victim.type === STRUCTURE)
		{
			units = chooseGroup();
		}
		else
		{
			units = enumRange(victim.x, victim.y, 18, me, false).filter(function(d) {
				return (d.type === DROID) && ((d.droidType === DROID_WEAPON) || (d.droidType === DROID_CYBORG) || isVTOL(d));
			});

			if (units.length < 2)
			{
				units = chooseGroup();
			}
		}

		units = units.filter(function(dr) {
			return (dr.id !== victim.id
				&& ((isVTOL(dr) && droidReady(dr.id))
				|| (!repairDroid(dr.id)) && droidCanReach(dr, attacker.x, attacker.y))
			);
		});
		const CACHE_UNITS = units.length;

		if (CACHE_UNITS >= 20)
		{
			var defend = (distBetweenTwoPoints(MY_BASE.x, MY_BASE.y, attacker.x, attacker.y) < 18);
			for (var i = 0; i < CACHE_UNITS; i++)
			{
				if ((random(3) || defend) && isDefined(units[i]) && isDefined(attacker))
				{
					if (defend)
					{
						orderDroidObj(units[i], DORDER_ATTACK, attacker);
					}
					else
					{
						orderDroidLoc(units[i], DORDER_SCOUT, attacker.x, attacker.y);
					}
				}
			}
		}
	}
}

function eventObjectTransfer(obj, from)
{
	if (from !== me)
	{
		if (allianceExistsBetween(from, me) || ((from === obj.player) && !allianceExistsBetween(obj.player, me)))
		{
			if (obj.type === DROID)
			{
				eventDroidBuilt(obj, null);
			}
		}
	}
}

//Basic Laser Satellite support.
function eventStructureReady(structure)
{
	if (!isDefined(structure))
	{
		const LASER = enumStruct(me, structures.extras[2]);
		if (isDefined(LASER[0]))
		{
			structure = LASER[0];
		}
		else
		{
			queue("eventStructureReady", 10000);
			return;
		}
	}

	var fac = returnClosestEnemyFactory();
	if (isDefined(fac))
	{
		activateStructure(structure, getObject(fac.typeInfo, fac.playerInfo, fac.idInfo));
	}
	else
	{
		queue("eventStructureReady", 10000, structure);
	}
}
