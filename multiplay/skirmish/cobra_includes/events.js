
//This file contains generic events. Chat and research events are split into
//their own seperate files.

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

//Initialize groups
function eventGameInit() {
	attackGroup = newGroup();
	vtolGroup = newGroup();
	cyborgGroup = newGroup();
	sensorGroup = newGroup();
	//commanderGroup = newGroup();
	lastMsg = "eventGameInit";
	buildStop = 0;

	//-- START Group initialization
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

function eventStartLevel() {
	nexusWaveOn = false;
	grudgeCount = [];
	turnOffCyborgs = false;
	throttleTime = [];
	personality = choosePersonality();

	for(var i = 0; i < maxPlayers; ++i) { grudgeCount.push(0); }
	for(var i = 0; i < 4; ++i) { throttleTime.push(0); }

	checkForScavs();
	diffPerks();
	initializeResearchLists();

	forceHover = checkIfSeaMap(); //TurnOffCyborgs can be assigned true here
	turnOffMG = CheckStartingBases();

	buildOrder();
	setTimer("buildOrder", 350 + 3 * random(60));
	setTimer("produce", 700 + 3 * random(60));
	setTimer("repairAll", 1000 + 5 * random(60));
	//setTimer("commandTactics", 2000 + 3 * random(60));
	setTimer("spyRoutine", 8000 + 4 * random(60));
	setTimer("nexusWave", 10000 + 3 * random(70));
	setTimer("checkMood", 20000 + 4 * random(60));
	setTimer("attackEnemyOil", 60000 + 5 * random(60));
	//setTimer("adaptToPowerLevels", 600000 + 7 * random(60));
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

		if(stopExecution(0, 20000) === true) { return; }

		//find nearby units.
		var units = enumRange(victim.x, victim.y, 15, me, false).filter(function(d) {
			return (d.type == DROID) && ((d.droidType == DROID_WEAPON) || (d.droidType == DROID_CYBORG))
		});

		//Be a bit aggressive when a structure is attacked.
		if(victim.type == STRUCTURE) {
			units = chooseGroup();
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

//Increase grudge counter
function eventGroupLoss(droid, group, size) {
	if(droid.order == DORDER_RECYCLE) { return; }

	if(stopExecution(3, 15000) === false){
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
		if (enumGroup(attackGroup).length < 2) {
			sendChatMessage("need tank", ALLIES);
		}
		if (countStruct(structures.templateFactories) && enumGroup(cyborgGroup).length < 2) {
			sendChatMessage("need cyborg", ALLIES);
		}
		if (countStruct(structures.vtolFactories) && enumGroup(vtolGroup).length < 2) {
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
					orderDroid(droid, DORDER_RTB);
				}
			}
		}
}

//Better check what is going on over there.
function eventBeacon(x, y, from, to, message) {
	if(stopExecution(2, 40000) === true) { return; }

	if(allianceExistsBetween(from, to) || (to == from)) {
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

	//REMOVE: when check_droid no longer spams the log file.
	//This WILL destroy droids from other player as well.
	if(obj.health > 100) {
		log("eventObjectTranfer: Destroying droid with health over 100%");
		removeObject(obj, true);
	}

	if((from !== me) && allianceExistsBetween(from, me)) {
		if(obj.type == DROID) { eventDroidBuilt(obj, null); }
	}

	//NexusWave transer
	if((from !== me) && (from === obj.player) && !allianceExistsBetween(obj.player, me)) {
		if(obj.type == DROID) { eventDroidBuilt(obj, null); }
	}
}

//Mostly meant to reduce stress about enemies or tell if a structures are being destroyed.
function eventDestroyed(object) {
	if(isDefined(scavengerNumber) && (object.player === scavengerNumber))
		return;

	if(!allianceExistsBetween(object.player, me)) {
		if(grudgeCount[object.player] > 0)
			grudgeCount[object.player] -= 1;
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

	var enemy = playerAlliance(false);
	enemy = enemy[random(enemy.length)];
	var facs = enumStruct(enemy, structures.factories);
	var tempFacs = enumStruct(enemy, structures.templateFactories);

	if(facs.length > 0)
		activateStructure(structure, facs[random(facs.length)]);
	else if(tempFacs.length > 0)
		activateStructure(structure, tempFacs[random(tempFacs.length)]);
	else
		queue("eventStructureReady", 20000);
}
