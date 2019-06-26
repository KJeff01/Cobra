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

	setTimer("buildOrders", 300);
	setTimer("produce", 400);
	setTimer("checkAllForRepair", 600);
	setTimer("research", 800);
	setTimer("lookForOil", 1000);
	setTimer("repairDroidTactics", 1200);
	setTimer("artilleryTactics", 1400);
	setTimer("vtolTactics", 1600);
	setTimer("groundTactics", 2000);
	setTimer("switchOffMG", 5000);
	setTimer("recycleForHover", 8000);
	setTimer("stopTimers", 9000);
	if (DEBUG_LOG_ON)
	{
		setTimer("debugLogAtEnd", 100000);
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

		if (nearbyOils.length > 0)
		{
			orderDroidBuild(droid, DORDER_BUILD, structures.derricks, nearbyOils[0].x, nearbyOils[0].y);
		}
		else
		{
			var numDefenses = enumRange(droid.x, droid.y, 10, me, false);
			numDefenses = numDefenses.filter(function(obj) {
				return ((obj.type === STRUCTURE) && (obj.stattype === DEFENSE));
			});

			if ((gameTime > 120000) && (random(100) < subPersonalities[personality].defensePriority))
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
		if (enemyObjects.length > 0)
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
		if (droid.body === "CyborgLightBody" || enumGroup(constructGroup).length < Math.floor(MIN_TRUCKS  / 2))
		{
			groupAdd(constructGroup, droid);
		}
		else
		{
			groupAdd(oilGrabberGroup, droid);
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
			return (dr.id !== victim.id &&
				((isVTOL(dr) && droidReady(dr.id)) ||
				(!repairDroid(dr.id)) && droidCanReach(dr, attacker.x, attacker.y))
			);
		});
		const CACHE_UNITS = units.length;

		if (CACHE_UNITS >= 20)
		{
			var defend = (distBetweenTwoPoints(MY_BASE.x, MY_BASE.y, attacker.x, attacker.y) < 18);
			for (var i = 0; i < CACHE_UNITS; i++)
			{
				if (random(3) || defend)
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
	if (!structure)
	{
		const LASER = enumStruct(me, structures.extras[2]);
		if (LASER.length > 0)
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
	if (fac)
	{
		activateStructure(structure, getObject(fac.typeInfo, fac.playerInfo, fac.idInfo));
	}
	else
	{
		queue("eventStructureReady", 10000, structure);
	}
}
