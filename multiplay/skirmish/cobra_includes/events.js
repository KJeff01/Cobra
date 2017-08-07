//This file contains generic events. Chat and research events are split into
//their own seperate files.

//Initialize groups
function eventGameInit() {
	attackGroup = newGroup();
	vtolGroup = newGroup();
	cyborgGroup = newGroup();
	sensorGroup = newGroup();
	repairGroup = newGroup();
	artilleryGroup = newGroup();
	constructGroup = newGroup();
	oilGrabberGroup = newGroup();
	lastMsg = "eventGameInit";

	addDroidsToGroup(attackGroup, enumDroid(me, DROID_WEAPON).filter(function(obj) { return !obj.isCB; }));
	addDroidsToGroup(cyborgGroup, enumDroid(me, DROID_CYBORG));
	addDroidsToGroup(vtolGroup, enumDroid(me).filter(function(obj) { return isVTOL(obj); }));
	addDroidsToGroup(sensorGroup, enumDroid(me, DROID_SENSOR));
	addDroidsToGroup(repairGroup, enumDroid(me, DROID_REPAIR));
	addDroidsToGroup(artilleryGroup, enumDroid(me, DROID_WEAPON).filter(function(obj) { return obj.isCB; }));
	addDroidsToGroup(constructGroup, enumDroid(me, DROID_CONSTRUCT));
}

//Initialze global variables and setup timers.
function eventStartLevel() {
	initiaizeRequiredGlobals();
	recycleDroidsForHover();
	buildOrder(); //Start building right away.

	const THINK_LONGER = (difficulty === EASY) ? 4000 + ((1 + random(4)) * random(1200)) : 0;

	setTimer("buildOrder", THINK_LONGER + 1100 + 3 * random(60));
	setTimer("produce", THINK_LONGER + 1800 + 3 * random(70));
	setTimer("repairDamagedDroids", THINK_LONGER + 2500 + 4 * random(60));
	setTimer("switchOffMG", THINK_LONGER + 3000 + 5 * random(60)); //May remove itself.
	setTimer("spyRoutine", THINK_LONGER + 4500 + 4 * random(60));
	setTimer("vtolTactics", THINK_LONGER + 5600 + 3 * random(70));
	setTimer("eventResearched", THINK_LONGER + 6500 + 3 * random(70));
	setTimer("battleTactics", THINK_LONGER + 7000 + 5 * random(60));
	setTimer("nexusWave", THINK_LONGER + 13000 + 3 * random(70)); //May remove itself.
	setTimer("recycleDroidsForHover", THINK_LONGER + 15000 + 2 * random(60)); // May remove itself.
	setTimer("StopTimersIfDead", THINK_LONGER + 100000 + 5 * random(70));
}

//This is meant to check for nearby oil resources next to the construct. also
//defend our derrick if possible.
function eventStructureBuilt(structure, droid) {
	if(structure.stattype === RESOURCE_EXTRACTOR) {
		var nearbyOils = enumRange(droid.x, droid.y, 8, ALL_PLAYERS, false);
		nearbyOils = nearbyOils.filter(function(obj) {
			return (obj.type === FEATURE) && (obj.stattype === OIL_RESOURCE);
		});
		nearbyOils = nearbyOils.sort(distanceToBase);
		droid.busy = false;

		if(isDefined(nearbyOils[0])) {
			orderDroidBuild(droid, DORDER_BUILD, structures.derricks, nearbyOils[0].x, nearbyOils[0].y);
		}
		else {
			var numDefenses = enumRange(droid.x, droid.y, 10, me, false);
			numDefenses = numDefenses.filter(function(obj) {
				return ((obj.type === STRUCTURE) && (obj.stattype === DEFENSE));
			});

			if(!isDefined(numDefenses[0])) {
				protectUnguardedDerricks(droid);
			}
		}
	}
}

//Make droids attack hidden close by enemy object.
function eventDroidIdle(droid) {
	if(isDefined(droid) && ((droid.droidType === DROID_WEAPON) || (droid.droidType === DROID_CYBORG) || isVTOL(droid))) {
		var enemyObjects = enumRange(droid.x, droid.y, 14, ENEMIES, false);
		if(isDefined(enemyObjects[0])) {
			enemyObjects = enemyObjects.sort(distanceToBase);
			attackThisObject(droid, enemyObjects[0]);
		}
	}
}

//Groups droid types.
function eventDroidBuilt(droid, struct) {
	if (droid) {
		if(isConstruct(droid)) {
			if(!isDefined(enumGroup(constructGroup)[3])) {
				groupAdd(constructGroup, droid);
				queue("checkUnfinishedStructures", 2500);
			}
			else {
				groupAdd(oilGrabberGroup, droid);
			}
		}
		else if(droid.droidType === DROID_SENSOR) {
			groupAdd(sensorGroup, droid);
		}
		else if(droid.droidType === DROID_REPAIR) {
			groupAdd(repairGroup, droid);
		}
		else if(isVTOL(droid)) {
			groupAdd(vtolGroup, droid);
		}
		else if(droid.droidType === DROID_CYBORG) {
			groupAdd(cyborgGroup, droid);
		}
		else if(droid.droidType === DROID_WEAPON) {
			//Anything with splash damage or CB abiliities go here.
			if(droid.isCB || droid.hasIndirect) {
				groupAdd(artilleryGroup, droid);
			}
			else {
				groupAdd(attackGroup, droid);
			}
		}
	}
}

function eventAttacked(victim, attacker) {
	if((attacker === null) || (victim.player !== me) || allianceExistsBetween(attacker.player, victim.player)) {
		return;
	}

	if(isDefined(getScavengerNumber()) && (attacker.player === getScavengerNumber())) {
		if(isDefined(victim) && isDefined(attacker) && (victim.type === DROID) && !repairDroid(victim, false)) {
			if((victim.droidType === DROID_WEAPON) || (victim.droidType === DROID_CYBORG)) {
				orderDroidObj(victim, DORDER_ATTACK, attacker);
			}
		}

		if(stopExecution(0, 12000) === false) {
			attackStuff(getScavengerNumber());
		}

		return;
	}

	if (attacker && victim && (attacker.player !== me) && !allianceExistsBetween(attacker.player, victim.player)) {
		peacefulTime = false;

		if(grudgeCount[attacker.player] < MAX_GRUDGE) {
			grudgeCount[attacker.player] += (victim.type === STRUCTURE) ? 20 : 5;
		}

		//Check if a droid needs repair.
		if((victim.type === DROID) && countStruct(structures.extras[0])) {
			//System units are timid.
			if ((victim.droidType === DROID_SENSOR) || isConstruct(victim) || (victim.droidType === DROID_REPAIR)) {
				orderDroid(victim, DORDER_RTR);
			}
			else {
				//Try to repair.
				if(Math.floor(victim.health) < 40) {
					repairDroid(victim, true);
				}
				else {
					repairDroid(victim, false);
				}
			}
		}

		if(stopExecution(0, 150) === true) {
			return;
		}

		var units;
		if(victim.type === STRUCTURE) {
			units = chooseGroup();
		}
		else {
			units = enumRange(victim.x, victim.y, 18, me, false).filter(function(d) {
				return (d.type === DROID) && ((d.droidType === DROID_WEAPON) || (d.droidType === DROID_CYBORG) || isVTOL(d));
			});

			if(!isDefined(units[3])) {
				units = chooseGroup();
			}
		}

		units = units.filter(function(dr) { return ((isVTOL(dr) && droidReady(dr)) || (!repairDroid(dr)) && droidCanReach(dr, attacker.x, attacker.y)); });
		var cacheUnits = units.length;

		if(cacheUnits >= MIN_ATTACK_DROIDS) {
			var defend = (distBetweenTwoPoints(startPositions[me].x, startPositions[me].y, attacker.x, attacker.y) < 18);
			for (var i = 0; i < cacheUnits; i++) {
				if((random(3) || defend) && isDefined(units[i]) && isDefined(attacker)) {
					if(defend) {
						orderDroidObj(units[i], DORDER_ATTACK, attacker);
					}
					else {
						orderDroidLoc(units[i], DORDER_SCOUT, attacker.x, attacker.y);
					}
				}
			}
		}
	}
}

//Add a beacon.
function eventGroupLoss(droid, group, size) {
	if(droid.order !== DORDER_RECYCLE) {
		if(stopExecution(3, 3000) === false) {
			addBeacon(droid.x, droid.y, ALLIES);
		}
	}
}

//Better check what is going on over there.
function eventBeacon(x, y, from, to, message) {
	if(stopExecution(2, 2000) === true) {
		return;
	}


	if(allianceExistsBetween(from, to) || (to === from)) {
		var cyborgs = enumGroup(cyborgGroup);
		var tanks = enumGroup(attackGroup);
		var vtols = enumGroup(vtolGroup);

		for (var i = 0, c = cyborgs.length; i < c; i++) {
			if(!repairDroid(cyborgs[i]) && droidCanReach(cyborgs[i], x, y)) {
				orderDroidLoc(cyborgs[i], DORDER_SCOUT, x, y);
			}
		}
		for (var i = 0, t = tanks.length; i < t; i++) {
			if(!repairDroid(tanks[i]) && droidCanReach(tanks[i], x, y)) {
				orderDroidLoc(tanks[i], DORDER_SCOUT, x, y);
			}
		}
		for (var i = 0, v = vtols.length; i < v; i++) {
			if(vtolReady(vtols[i])) {
				orderDroidLoc(vtols[i], DORDER_SCOUT, x, y);
			}
		}
	}
}

function eventObjectTransfer(obj, from) {
	if(from !== me) {
		if(allianceExistsBetween(from, me) || ((from === obj.player) && !allianceExistsBetween(obj.player, me))) {
			if(obj.type === DROID) {
				eventDroidBuilt(obj, null);
			}
		}
	}
}

//Increase grudge counter for closest enemy.
function eventDestroyed(object) {
	if(!(isDefined(getScavengerNumber()) && (object.player === getScavengerNumber()))) {
		if(object.player === me) {
			var enemies = enumRange(object.x, object.y, 8, ENEMIES, false);
			enemies = enemies.sort(distanceToBase);
			if(isDefined(enemies[0]) && grudgeCount[enemies[0].player] < MAX_GRUDGE) {
				grudgeCount[enemies[0].player] = grudgeCount[enemies[0].player] + 5;
			}
		}
	}
}

//Basic Laser Satellite support.
function eventStructureReady(structure) {
	if(!isDefined(structure)) {
		var las = enumStruct(me, structures.extras[2]);
		if(isDefined(las[0])) {
			structure = las[0];
		}
		else {
			queue("eventStructureReady", 10000);
			return;
		}
	}

	const ENEMY_FACTORY = returnClosestEnemyFactory();
	if(isDefined(ENEMY_FACTORY)) {
		activateStructure(structure, ENEMY_FACTORY);
	}
	else {
		queue("eventStructureReady", 10000, structure);
	}
}
