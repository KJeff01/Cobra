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
	lastMsg = "eventGameInit";

	addDroidsToGroup(attackGroup, enumDroid(me, DROID_WEAPON).filter(function(obj) { return !obj.isCB; }));
	addDroidsToGroup(cyborgGroup, enumDroid(me, DROID_CYBORG));
	addDroidsToGroup(vtolGroup, enumDroid(me).filter(function(obj) { return isVTOL(obj); }));
	addDroidsToGroup(sensorGroup, enumDroid(me, DROID_SENSOR));
	addDroidsToGroup(repairGroup, enumDroid(me, DROID_REPAIR));
	addDroidsToGroup(artilleryGroup, enumDroid(me, DROID_WEAPON).filter(function(obj) { return obj.isCB; }));
}

//Initialze global variables and setup timers.
function eventStartLevel() {
	initiaizeRequiredGlobals();
	recycleDroidsForHover();
	buildOrder(); //Start building right away.

	const THINK_LONGER = (difficulty === EASY) ? 4000 + ((1 + random(4)) * random(1200)) : 0;

	setTimer("buildOrder", THINK_LONGER + 425 + 3 * random(60));
	setTimer("produce", THINK_LONGER + 1500 + 3 * random(70));
	setTimer("repairDamagedDroids", THINK_LONGER + 2200 + 4 * random(60));
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
	if(isDefined(droid) && (structure.stattype === RESOURCE_EXTRACTOR)) {
		var nearbyOils = enumRange(droid.x, droid.y, 8, ALL_PLAYERS, false);
		nearbyOils = nearbyOils.filter(function(obj) {
			return (obj.type === FEATURE) && (obj.stattype === OIL_RESOURCE);
		});
		nearbyOils = nearbyOils.sort(distanceToBase);
		if(nearbyOils.length && isDefined(nearbyOils[0])) {
			droid.busy = false;
			orderDroidBuild(droid, DORDER_BUILD, structures.derricks, nearbyOils[0].x, nearbyOils[0].y);
		}
		else if(getRealPower() > -120 && (countStruct(structures.derricks) > averageOilPerPlayer())) {
			var undef;
			buildStuff(getDefenseStructure(), undef, structure);
		}
	}
	else {
		if(((!turnOffMG && (gameTime > 80000)) || turnOffMG) && maintenance()) { return; }
	}
}

//Make droids attack hidden close by enemy object.
function eventDroidIdle(droid) {
	if(droid.player === me) {
		if(isDefined(droid) && ((droid.droidType === DROID_WEAPON) || (droid.droidType === DROID_CYBORG) || isVTOL(droid))) {
			var enemyObjects = enumRange(droid.x, droid.y, 10, ENEMIES, false);
			if(enemyObjects.length > 0) {
				enemyObjects = enemyObjects.sort(distanceToBase);
				orderDroidLoc(droid, DORDER_SCOUT, enemyObjects[0].x, enemyObjects[0].y);
			}
		}
	}
}

//Groups droid types.
function eventDroidBuilt(droid, struct) {
	if (droid && (droid.droidType !== DROID_CONSTRUCT)) {
		if(isVTOL(droid)) {
			groupAdd(vtolGroup, droid);
		}
		else if(droid.droidType === DROID_SENSOR) {
			groupAdd(sensorGroup, droid);
		}
		else if(droid.droidType === DROID_REPAIR) {
			groupAdd(repairGroup, droid);
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
	if((victim.player !== me) || (attacker === null) || allianceExistsBetween(attacker.player, victim.player)) {
		return;
	}

	if(isDefined(getScavengerNumber()) && (attacker.player === getScavengerNumber())) {
		if(isDefined(victim) && isDefined(attacker) && (victim.type === DROID) && !repairDroid(victim, false)) {
			if((victim.droidType === DROID_WEAPON) || (victim.droidType === DROID_CYBORG)) {
				orderDroidObj(victim, DORDER_ATTACK, attacker);
			}
		}
		if(stopExecution(0, 2000) === false) {
			attackStuff(getScavengerNumber());
		}
		return;
	}

	if (attacker && victim && (attacker.player !== me) && !allianceExistsBetween(attacker.player, victim.player)) {
		if(grudgeCount[attacker.player] < MAX_GRUDGE) {
			grudgeCount[attacker.player] += (victim.type === STRUCTURE) ? 20 : 5;
		}

		//Check if a droid needs repair.
		if((victim.type === DROID) && countStruct(structures.extras[0])) {
			//System units are timid.
			if ((victim.droidType === DROID_SENSOR) || (victim.droidType === DROID_CONSTRUCT)) {
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

			if(units.length < 4) {
				units = chooseGroup();
			}
		}

		units = units.filter(function(dr) { return droidCanReach(dr, attacker.x, attacker.y); });
		var cacheUnits = units.length;

		if(cacheUnits < MIN_ATTACK_DROIDS) {
			return;
		}

		var defend = (distBetweenTwoPoints(startPositions[me].x, startPositions[me].y, attacker.x, attacker.y) < 18) ? true : false;

		for (var i = 0; i < cacheUnits; i++) {
			if((random(3) || defend) && isDefined(units[i]) && isDefined(attacker)) {
				if(defend && !repairDroid(units[i])) {
					orderDroidObj(units[i], DORDER_ATTACK, attacker);
				}
				else if (droidReady(units[i])) {
					orderDroidLoc(units[i], DORDER_SCOUT, attacker.x, attacker.y);
				}
			}
		}
	}
}

//Add a beacon and potentially request a unit.
function eventGroupLoss(droid, group, size) {
	if(droid.order === DORDER_RECYCLE) {
		return;
	}

	if(stopExecution(3, 3000) === false) {
		addBeacon(droid.x, droid.y, ALLIES);
	}

	if(playerAlliance(true).length > 0) {
		if (enumGroup(attackGroup).length < MIN_ATTACK_DROIDS) {
			sendChatMessage("need tank", ALLIES);
		}
		if (!turnOffCyborgs && countStruct(structures.templateFactories) && enumGroup(cyborgGroup).length < MIN_ATTACK_DROIDS) {
			sendChatMessage("need cyborg", ALLIES);
		}
		if (countStruct(structures.vtolFactories) && enumGroup(vtolGroup).length < MIN_ATTACK_DROIDS) {
			sendChatMessage("need vtol", ALLIES);
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
	logObj(obj, "eventObjectTransfer event. from: " + from + ". health: " + obj.health);

	if((from !== me) && allianceExistsBetween(from, me)) {
		if(obj.type === DROID) {
			eventDroidBuilt(obj, null);
		}
	}

	if((from !== me) && (from === obj.player) && !allianceExistsBetween(obj.player, me)) {
		if(obj.type === DROID) {
			eventDroidBuilt(obj, null);
		}
	}
}

//Increase grudge counter for closest enemy.
function eventDestroyed(object) {
	if(isDefined(getScavengerNumber()) && (object.player === getScavengerNumber())) {
		return;
	}

	if(object.player === me) {
		var enemies = enumRange(object.x, object.y, 8, ENEMIES, false);
		enemies = enemies.sort(distanceToBase);
		if(enemies.length && grudgeCount[enemies[0].player] < MAX_GRUDGE) {
			grudgeCount[enemies[0].player] = grudgeCount[enemies[0].player] + 5;
		}
	}
}

//Basic Laser Satellite support.
function eventStructureReady(structure) {
	if(!isDefined(structure)) {
		var las = enumStruct(me, structures.extras[2]);
		if(las.length) {
			structure = las[0];
		}
		else {
			queue("eventStructureReady", 10000);
			return;
		}
	}

	const ENEMY_FACTORIES = returnEnemyFactories();
	var cacheFacs = ENEMY_FACTORIES.length;

	if(cacheFacs) {
		activateStructure(structure, ENEMY_FACTORIES[random(cacheFacs)]);
	}
	else {
		queue("eventStructureReady", 10000, structure);
	}
}
