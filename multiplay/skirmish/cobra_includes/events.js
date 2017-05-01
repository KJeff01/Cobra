//This file contains generic events. Chat and research events are split into
//their own seperate files.

//Initialize groups
function eventGameInit() {
	attackGroup = newGroup();
	vtolGroup = newGroup();
	cyborgGroup = newGroup();
	sensorGroup = newGroup();
	repairGroup = newGroup();
	//commanderGroup = newGroup();
	lastMsg = "eventGameInit";

	var tanks = enumDroid(me, DROID_WEAPON);
	var cyborgs = enumDroid(me, DROID_CYBORG);
	var vtols = enumDroid(me).filter(function(obj) { return isVTOL(obj) });
	var sensors = enumDroid(me, DROID_SENSOR);
	var repairs = enumDroid(me, DROID_REPAIR);
	//var coms = enumDroid(me, DROID_COMMAND);

	for(var i = 0; i < tanks.length; ++i) {
		groupAdd(attackGroup, tanks[i]);
	}
	for(var i = 0; i < cyborgs.length; ++i) {
		groupAdd(cyborgGroup, cyborgs[i]);
	}
	for(var i = 0; i < vtols.length; ++i) {
		groupAdd(vtolGroup, vtols[i]);
	}
	for(var i = 0; i < sensors.length; ++i) {
		groupAdd(sensorGroup, sensors[i]);
	}
	for(var i = 0; i < repairs.length; ++i) {
		groupAdd(repairGroup, repairs[i]);
	}
	/*
	for(var i = 0; i < coms.length; ++i) {
		groupAdd(commanderGroup, coms[i]);
	}
	*/
}

//Initialze global variables and setup timers.
function eventStartLevel() {
	initiaizeRequiredGlobals();
	buildOrder(); //Start building right away.

	const THINK_LONGER = (difficulty === EASY) ? 4000 + ((1 + random(4)) * random(1200)) : 0;

	setTimer("buildOrder", THINK_LONGER + 320 + 3 * random(60));
	setTimer("repairDamagedDroids", THINK_LONGER + 500 + 4 * random(60));
	setTimer("produce", THINK_LONGER + 750 + 3 * random(70));
	setTimer("battleTactics", THINK_LONGER + 2000 + 5 * random(60));
	//setTimer("commandTactics", THINK_LONGER + 2800 + 3 * random(60));
	setTimer("switchOffMG", THINK_LONGER + 3000 + 5 * random(60)); //May remove itself.
	setTimer("spyRoutine", THINK_LONGER + 8000 + 4 * random(60));
	setTimer("nexusWave", THINK_LONGER + 10000 + 3 * random(70)); //May remove itself.
	setTimer("checkMood", THINK_LONGER + 20000 + 4 * random(70));
}

//This is meant to check for nearby oil resources next to the construct. also
//defend our derrick if possible.
function eventStructureBuilt(structure, droid) {
	if(isDefined(droid) && (structure.stattype === RESOURCE_EXTRACTOR)) {
		var nearbyOils = enumRange(droid.x, droid.y, 6, ALL_PLAYERS, false);
		nearbyOils = nearbyOils.filter(function(obj) {
			return obj.type === FEATURE && obj.stattype === OIL_RESOURCE
		});
		nearbyOils.sort(distanceToBase);
		if(nearbyOils.length && isDefined(nearbyOils[0])) {
			orderDroidBuild(droid, DORDER_BUILD, structures.derricks, nearbyOils[0].x, nearbyOils[0].y);
		}
		else if(getRealPower() > -150) {
			var undef;
			buildStuff(getDefenseStructure(), undef, structure);
		}
	}
	else {
		if(checkUnfinishedStructures()) { return; }
		if(((!turnOffMG && (gameTime > 80000)) || turnOffMG) && maintenance()) { return; }
	}
}

//Make droids attack hidden close by enemy object.
function eventDroidIdle(droid) {
	if(droid.player === me) {
		if(isDefined(droid) && ((droid.droidType === DROID_WEAPON) || (droid.droidType === DROID_CYBORG) || isVTOL(droid))) {
				var enemyObjects = enumRange(droid.x, droid.y, 20, ENEMIES, false);
				if(enemyObjects.length > 0) {
					enemyObjects.sort(distanceToBase);
					orderDroidObj(droid, DORDER_ATTACK, enemyObjects[0]);
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
		/*
		else if(droid.droidType === DROID_COMMAND) {
			groupAdd(commanderGroup, droid);
		}
		*/
		else if((droid.droidType === DROID_WEAPON)) {
			/*
			var coms = enumGroup(commanderGroup);
			for(var i = 0; i < coms.length; ++i) {
				if(orderDroidObj(droid, DORDER_COMMANDERSUPPORT, coms[i]))
					return;
			}
			*/
			groupAdd(attackGroup, droid);
		}
	}
}

function eventAttacked(victim, attacker) {
	if((victim.player !== me) || (attacker == null) || allianceExistsBetween(attacker.player, victim.player)) {
		return;
	}

	if(isDefined(getScavengerNumber()) && (attacker.player === getScavengerNumber())) {
		if(isDefined(victim) && isDefined(attacker) && (victim.type === DROID) && !repairDroid(victim, false)) {
			if((victim.droidType === DROID_WEAPON) || (victim.droidType === DROID_CYBORG))
				orderDroidObj(victim, DORDER_ATTACK, attacker);
		}
		if(stopExecution(0, 2000) === false) {
			attackStuff(getScavengerNumber());
		}
		return;
	}

	if (attacker && victim && (attacker.player !== me) && !allianceExistsBetween(attacker.player, victim.player)) {
		if(grudgeCount[attacker.player] < 50000)
			grudgeCount[attacker.player] += (victim.type === STRUCTURE) ? 20 : 8;

		//Check if a droid needs repair.
		if((victim.type === DROID) && countStruct(structures.extras[0])) {
			//System units are timid.
			if ((victim.droidType === DROID_SENSOR) || (victim.droidType === DROID_CONSTRUCT)) {
				orderDroid(victim, DORDER_RTR);
			}
			else {
				//Try to repair.
				if(Math.floor(victim.health) < 34) {
					repairDroid(victim, true);
				}
				else {
					repairDroid(victim, false);
				}
			}
		}

		if(stopExecution(0, 110) === true) { return; }

		var units;
		if(victim.type === STRUCTURE) {
			units = chooseGroup();
		}
		else {
			units = enumRange(victim.x, victim.y, 18, me, false).filter(function(d) {
				return (d.type === DROID) && ((d.droidType === DROID_WEAPON) || (d.droidType === DROID_CYBORG))
			});

			if(units.length < 5) {
				units = chooseGroup();
			}
		}

		units.filter(function(dr) { return (dr !== victim) && droidCanReach(dr, attacker.x, attacker.y)});

		for (var i = 0; i < units.length; i++) {
			if(isDefined(units[i]) && droidReady(units[i]) && isDefined(attacker))
				orderDroidObj(units[i], DORDER_ATTACK, attacker);
		}
	}
}

//Add a beacon and potentially request a unit.
function eventGroupLoss(droid, group, size) {
	if(droid.order === DORDER_RECYCLE) { return; }

	if(stopExecution(3, 8000) === false){
		addBeacon(droid.x, droid.y, ALLIES);
	}

	//Release the commander's droids to the attack group.
	/*
	if((droid.droidType === DROID_COMMAND) && (droid.player === me)) {
		var comDroids = enumDroid(me).filter(function(dr) { return dr.group === null });
		for(var i = 0; i < comDroids.length; ++i) {
			groupAdd(attackGroup, comDroids[i]);
		}
	}
	*/

	if(playerAlliance(true).length > 0) {
		if (enumGroup(attackGroup).length < 5) {
			sendChatMessage("need tank", ALLIES);
		}
		if (countStruct(structures.templateFactories) && enumGroup(cyborgGroup).length < 5) {
			sendChatMessage("need cyborg", ALLIES);
		}
		if (countStruct(structures.vtolFactories) && enumGroup(vtolGroup).length < 5) {
			sendChatMessage("need vtol", ALLIES);
		}
	}
}

//Better check what is going on over there.
function eventBeacon(x, y, from, to, message) {
	if(stopExecution(2, 3000) === true) { return; }

	if(allianceExistsBetween(from, to) || (to === from)) {
		var cyborgs = enumGroup(cyborgGroup);
		var tanks = enumGroup(attackGroup);
		var vtols = enumGroup(vtolGroup);
		for (var i = 0; i < cyborgs.length; i++) {
			if(!repairDroid(cyborgs[i]) && droidCanReach(cyborgs[i], x, y))
				orderDroidLoc(cyborgs[i], DORDER_SCOUT, x, y);
		}
		for (var i = 0; i < tanks.length; i++) {
			if(!repairDroid(tanks[i]) && droidCanReach(tanks[i], x, y))
				orderDroidLoc(tanks[i], DORDER_SCOUT, x, y);
		}
		for (var i = 0; i < vtols.length; i++) {
			if(vtolReady(vtols[i]))
				orderDroidLoc(vtols[i], DORDER_SCOUT, x, y);
		}
	}
}

function eventObjectTransfer(obj, from) {
	logObj(obj, "eventObjectTransfer event. from: " + from + ". health: " + obj.health);

	if((from !== me) && allianceExistsBetween(from, me)) {
		if(obj.type === DROID) { eventDroidBuilt(obj, null); }
	}

	if((from !== me) && (from === obj.player) && !allianceExistsBetween(obj.player, me)) {
		if(obj.type === DROID) { eventDroidBuilt(obj, null); }
	}
}

//Mostly meant to reduce stress about enemies or tell if a structures is destroyed.
function eventDestroyed(object) {
	if(isDefined(getScavengerNumber()) && (object.player === getScavengerNumber()))
		return;

	if(!allianceExistsBetween(object.player, me)) {
		if(grudgeCount[object.player] > 0)
			grudgeCount[object.player] = Math.floor(grudgeCount[object.player] / 1.05);
	}
}

//Basic Laser Satellite support.
function eventStructureReady(structure) {
	if(!isDefined(structure)) {
		var las = enumStruct(me, structures.extras[2]);
		if(las.length > 0)
			structure = las[0];
		else {
			queue("eventStructureReady", 20000);
			return;
		}
	}

	var enemy = getMostHarmfulPlayer();
	var facs = enumStruct(enemy, structures.factories);
	var tempFacs = enumStruct(enemy, structures.templateFactories);

	if(facs.length > 0)
		activateStructure(structure, facs[random(facs.length)]);
	else if(tempFacs.length > 0)
		activateStructure(structure, tempFacs[random(tempFacs.length)]);
	else
		queue("eventStructureReady", 20000);
}
