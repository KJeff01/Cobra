//This file contains generic events. Chat and research events are split into
//their own seperate files.

//Initialize groups
function eventGameInit() {
	attackGroup = newGroup();
	vtolGroup = newGroup();
	cyborgGroup = newGroup();
	sensorGroup = newGroup();
	//commanderGroup = newGroup();
	lastMsg = "eventGameInit";

	var tanks = enumDroid(me, DROID_WEAPON);
	var cyborgs = enumDroid(me, DROID_CYBORG);
	var vtols = enumDroid(me).filter(function(obj){ return isVTOL(obj) });
	var sensors = enumDroid(me, DROID_SENSOR);
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
	/*
	for(var i = 0; i < coms.length; ++i) {
		groupAdd(commanderGroup, coms[i]);
	}
	*/
}

function eventGameLoaded() {
	eventGameInit();
}

//Initialze global variables and setup timers.
function eventStartLevel() {
	initiaizeRequiredGlobals();
	buildOrder(); //Start building right away.

	setTimer("repairAll", thinkLonger + 290 + 3 * random(80));
	setTimer("buildOrder", thinkLonger + 320 + 3 * random(60));
	setTimer("produce", thinkLonger + 700 + 3 * random(70));
	//setTimer("commandTactics", thinkLonger + 2000 + 3 * random(60));
	setTimer("spyRoutine", thinkLonger + 8000 + 4 * random(60));
	setTimer("nexusWave", thinkLonger + 10000 + 3 * random(70));
	setTimer("checkMood", thinkLonger + 20000 + 4 * random(90));
	setTimer("attackEnemyOil", thinkLonger + 35000 + 5 * random(60));
}

//This is meant to check for nearby oil resources next to the construct.
function eventStructureBuilt(structure, droid) {
	if(isDefined(droid) && (structure.stattype === RESOURCE_EXTRACTOR)) {
		var nearbyOils = enumRange(droid.x, droid.y, 6, ALL_PLAYERS, false);
		nearbyOils = nearbyOils.filter(function(obj) {
			return obj.type === FEATURE && obj.stattype == OIL_RESOURCE
		});
		nearbyOils.sort(distanceToBase);
		if(nearbyOils.length && isDefined(nearbyOils[0]))
			orderDroidBuild(droid, DORDER_BUILD, structures.derricks, nearbyOils[0].x, nearbyOils[0].y);
	}
}

//Groups droid types.
function eventDroidBuilt(droid, struct) {
	if (droid && (droid.droidType != DROID_CONSTRUCT)) {
		if(isVTOL(droid)) {
			groupAdd(vtolGroup, droid);
		}
		else if(droid.droidType == DROID_SENSOR) {
			groupAdd(sensorGroup, droid);
		}
		else if(droid.droidType == DROID_CYBORG) {
			groupAdd(cyborgGroup, droid);
		}
		/*
		else if(isDefined(droid.weapons[0]) && (droid.weapons[0].name === "CommandTurret1")) {
			groupAdd(commanderGroup, droid);
		}
		*/
		else if((droid.droidType == DROID_WEAPON)) {
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
	if(isDefined(scavengerNumber) && (attacker.player === scavengerNumber)) {
		if(isDefined(victim) && isDefined(attacker) && (victim.type == DROID) && !repairDroid(victim, false)) {
			if((victim.droidType == DROID_WEAPON) || (victim.droidType == DROID_CYBORG))
				orderDroidObj(victim, DORDER_ATTACK, attacker);
		}
		if(stopExecution(0, 5000) === false) {
			attackStuff(scavengerNumber);
		}
		return;
	}

	if (attacker && victim && (attacker.player !== me) && !allianceExistsBetween(attacker.player, victim.player)) {
		if(grudgeCount[attacker.player] < 500)
			grudgeCount[attacker.player] += (victim.type == STRUCTURE) ? 15 : 5;

		//Constructs are timid.
		if((victim.type === DROID) && ((victim.droidType === DROID_SENSOR) || (victim.droidType === DROID_CONSTRUCT)) && countStruct(structures.extras[0]))
			orderDroid(victim, DORDER_RTR);

		if(stopExecution(0, 20000) === true) { return; }

		var units;
		if(victim.type == STRUCTURE) {
			units = chooseGroup();
		}
		else {
			units = enumRange(victim.x, victim.y, 20, me, false).filter(function(d) {
				return (d.type == DROID) && ((d.droidType == DROID_WEAPON) || (d.droidType == DROID_CYBORG))
			});
		}

		for (var i = 0; i < units.length; i++) {
			if(isDefined(units[i]) && isDefined(attacker) && droidCanReach(units[i], attacker.x, attacker.y) && !repairDroid(units[i]))
				orderDroidObj(units[i], DORDER_ATTACK, attacker);
			else
				break;
		}

		//swarm behavior exhibited here. Might be better to do multiple attack points.
		var vtols = enumGroup(vtolGroup);
		if(vtols.length > 2) {
			var targets = enumStruct(attacker.player, structures.derricks);
			targets.concat(enumStruct(attacker.player, structures.factories));
			targets.concat(enumStruct(attacker.player, structures.templateFactories));
			targets.concat(enumStruct(attacker.player, structures.vtolFactories));

			var target = targets[random(targets.length)];

			for (var i = 0; i < vtols.length; i++) {
				if(vtolReady(vtols[i])) {
					if(isDefined(target))
						orderDroidLoc(vtols[i], DORDER_SCOUT, target.x, target.y);
				}
			}
		}

		//if(grudgeCount[attacker.player] > 30)
			//attackStuff(attacker.player);
	}
}

//Add a beacon and potentially request a unit.
function eventGroupLoss(droid, group, size) {
	if(droid.order == DORDER_RECYCLE) { return; }

	if(stopExecution(3, 10000) === false){
		addBeacon(droid.x, droid.y, ALLIES);
	}

	//Release the commander's droids to the attack group.
	/*
	var isCommand = (droid.droidType != DROID_CONSTRUCT) &&
									(droid.droidType != DROID_WEAPON) && (droid.droidType != DROID_CYBORG) &&
									(droid.droidType != DROID_SENSOR) && !isVTOL(droid);
	if((isCommand === true) && (droid.player === me)) {
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

//Make droids patrol around random oil derricks, else return to base if none.
function eventDroidIdle(droid) {
	if(droid.player === me) {
		if(isDefined(droid) && ((droid.droidType == DROID_WEAPON) || (droid.droidType == DROID_CYBORG) || isVTOL(droid))) {
				var derr = enumStruct(me, structures.derricks);
				if(derr.length > 0) {
					var newDerrs = [];
					for(var t = 0; t < derr.length; ++t)
						if(distBetweenTwoPoints(startPositions[me].x, startPositions[me].y, derr[t].x, derr[t].y) > 12)
							newDerrs.push(derr[t]);

					if(newDerrs.length > 0) {
						derr = newDerrs[random(newDerrs.length)];
						orderDroidLoc(droid, DORDER_SCOUT, derr.x, derr.y);
					}
				}
				else {
					orderDroid(droid, DORDER_RTB); //wait for death.
				}
			}
		}
}

//Better check what is going on over there.
function eventBeacon(x, y, from, to, message) {
	if(stopExecution(2, 12000) === true) { return; }

	if(allianceExistsBetween(from, to) || (to == from)) {
		var cyborgs = enumGroup(cyborgGroup);
		var tanks = enumGroup(attackGroup);
		var vtols = enumGroup(vtolGroup);
		for (var i = 0; i < cyborgs.length; i++) {
			if(droidReady(cyborgs[i]) && droidCanReach(cyborgs[i], x, y))
				orderDroidLoc(cyborgs[i], DORDER_SCOUT, x, y);
		}
		for (var i = 0; i < tanks.length; i++) {
			if(droidReady(tanks[i]) && droidCanReach(tanks[i], x, y))
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
		if(obj.type == DROID) { eventDroidBuilt(obj, null); }
	}

	if((from !== me) && (from === obj.player) && !allianceExistsBetween(obj.player, me)) {
		if(obj.type == DROID) { eventDroidBuilt(obj, null); }
	}
}

//Mostly meant to reduce stress about enemies or tell if a structures is destroyed.
function eventDestroyed(object) {
	if(isDefined(scavengerNumber) && (object.player === scavengerNumber))
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
		else
			return;
	}

	var enemies = playerAlliance(false);
	var enemy = enemies[random(enemies.length)];
	var facs = enumStruct(enemy, structures.factories);
	var tempFacs = enumStruct(enemy, structures.templateFactories);

	if(facs.length > 0)
		activateStructure(structure, facs[random(facs.length)]);
	else if(tempFacs.length > 0)
		activateStructure(structure, tempFacs[random(tempFacs.length)]);
	else
		queue("eventStructureReady", 20000);
}
