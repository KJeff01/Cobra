// --- game events

//The research decisions. On T2/T3 it is more artillery/laser/vtol focused
//Needs to have bloat reduction here.
function eventResearched() {
	if(!isDefined(techlist) || !isDefined(artillExtra)) { return; }
	if(checkLowPower() === true) { return; }

	var lablist = enumStruct(me, structures.labs);
	for (var i = 0; i < lablist.length; ++i) {
		var lab = lablist[i];
		var found = false;
		if (lab.status == BUILT && structureIdle(lab)) {
			//This list is only for T1
			if(turnOffMG === false)
				found = pursueResearch(lab, techlist);
			else {
				if(!found)
					found = pursueResearch(lab, "R-Vehicle-Prop-Tracks");
				if(!found)
					found = pursueResearch(lab, "R-Struc-RprFac-Upgrade06");
			}
			
			if(!found)
				found = pursueResearch(lab, "R-Vehicle-Prop-Halftracks");
			if((isDefined(forceHover) && (forceHover === true)) || (turnOffMG === true)) {
				if(!found)
					found = pursueResearch(lab, "R-Vehicle-Prop-Hover");
			}
			if(!found)
				found = pursueResearch(lab, "R-Struc-Power-Upgrade03a");
			if(!found)
				found = pursueResearch(lab, fastestResearch);
			
			
			if(isDefined(turnOffCyborgs)) {
				if(turnOffCyborgs === false) {
					if(!found)
						found = pursueResearch(lab, kineticResearch);
				}
				else {
					if(!found)
						found = pursueResearch(lab, "R-Vehicle-Metals09");
				}
			}
			
			if(!found)
				pursueResearch(lab, "R-Vehicle-Body05"); // Cobra body
		
			//If T1 - Go for machine-guns. else focus on lasers and the primary weapon.
			if(isDefined(turnOffMG) && (turnOffMG === false)) {
				if(!found)
					found = pursueResearch(lab, mgWeaponTech);
				if(!found)
					found = pursueResearch(lab, "R-Wpn-MG-Damage08");
			}
			else {
				if(!found)
					found = pursueResearch(lab, extraTech);
				if(!found)
					found = pursueResearch(lab, laserExtra);
			}
			
			if((gameTime < 280000) && isDefined(turnOffMG) && (turnOffMG === false))
				continue;
			
			if(!random(2) && componentAvailable("Body11ABT")) {
				if(!found)
					found = pursueResearch(lab, weaponTech);
				if(!found)
					found = pursueResearch(lab, extraTech);
				if(!found)
					found = pursueResearch(lab, artillExtra);
				if(!found)
					found = pursueResearch(lab, artilleryTech);
				if(!found)
					found = pursueResearch(lab, "R-Wpn-PlasmaCannon");
				if(!found)
					found = pursueResearch(lab, extremeLaserTech);
			}
			else if(!random(2) && componentAvailable("Body11ABT")) {
				if(!found)
					found = pursueResearch(lab, vtolExtras);
				if(!found)
					found = pursueResearch(lab, vtolWeapons);
			}
			else {
				if(!found)
					found = pursueResearch(lab, laserExtra);
				if(!found)
					found = pursueResearch(lab, laserTech);
			}
			
			if(!found)
				found = pursueResearch(lab, "R-Sys-Autorepair-General");
			if(!found)
				found = pursueResearch(lab, "R-Struc-Factory-Upgrade09");
			
			if(!found && componentAvailable("Body11ABT"))
				found = pursueResearch(lab, antiAirTech);
			if(isDefined(turnOffCyborgs) && (turnOffCyborgs === false) && !found)
				found = pursueResearch(lab, cyborgWeaps);
			if(!found && componentAvailable("Body11ABT"))
				found = pursueResearch(lab, antiAirExtras);
			if(!found)
				found = pursueResearch(lab, bodyResearch);
			
			
			if(isDefined(turnOffCyborgs)) {
				if(turnOffCyborgs === false) {
					if(!found)
						found = pursueResearch(lab, thermalResearch);
				}
				else {
					if(!found)
						found = pursueResearch(lab, "R-Vehicle-Armor-Heat09");
				}
			}
	
			if(!found)
				found = pursueResearch(lab, fundamentalResearch);
			if(!found && componentAvailable("Body11ABT"))
				found = pursueResearch(lab, "R-Struc-Materials09");
		}
	}
}

function eventStructureBuilt(struct, droid) {
	if (struct.stattype == RESEARCH_LAB) {
		eventResearched();
	}
	else if ((struct.stattype == FACTORY) || (struct.stattype == CYBORG_FACTORY) || (struct.stattype == VTOL_FACTORY)) {
		produce();
	}
}

function eventDroidBuilt(droid, struct) {
	if (droid) {
		if (isVTOL(droid)) {
			groupAdd(vtolGroup, droid);
		}
		else if(droid.droidType == DROID_SENSOR){
			groupAdd(sensorGroup, droid);
		}
		else if(droid.droidType == DROID_CYBORG) {
			groupAdd(cyborgGroup, droid);
		}
		else if (droid.droidType == DROID_WEAPON) {
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
	lastMsg = "eventGameInit";
	buildStop = 0;
	
	//-- START Group initialization
	var tanks = enumDroid(me, DROID_WEAPON);
	var cyborgs = enumDroid(me, DROID_CYBORG);
	var vtols = enumDroid(me).filter(function(obj){ return isVTOL(obj) });
	var sensors = enumDroid(me, DROID_SENSOR);
	
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
}

function eventStartLevel() {
	// Pretend like all buildings were just produced, to initiate productions
	var structlist = enumStruct(me);
	nexusWaveOn = false;
	grudgeCount = [];
	turnOffCyborgs = false;
	throttleTime = 0;
	personality = choosePersonality();
	
	for(var i = 0; i < structlist.length; i++) { eventStructureBuilt(structlist[i]); }
	for(var i = 0; i < maxPlayers; ++i)        { grudgeCount.push(0); }
	
	checkForScavs();
	diffPerks();
	initializeResearchLists();
	
	forceHover = checkIfSeaMap(); //TurnOffCyborgs can be assigned true here
	turnOffMG = CheckStartingBases();
	if(turnOffMG === true)
		turnOffCyborgs = true;
	
	buildOrder();
	setTimer("buildOrder", 300 + 3 * random(60));
	setTimer("produce", 700 + 3 * random(60));
	setTimer("repairAll", 1000 + 3 * random(60));
	setTimer("attackEnemyOil", 4000 + 3 * random(60));
	setTimer("spyRoutine", 8000 + 3 * random(60));
	setTimer("nexusWave", 10000 + 3 * random(70));
	setTimer("checkMood", 20000 + 3 * random(60));
	setTimer("freeForAll", 40000 + 3 * random(60));
}

function eventAttacked(victim, attacker) {
	if(isDefined(scavengerNumber) && (attacker.player === scavengerNumber)) {
		if(isDefined(victim) && isDefined(attacker) && (victim.type == DROID) && !repairDroid(victim, false)) {
			if((victim.droidType == DROID_WEAPON) || (victim.droidType == DROID_CYBORG))
			orderDroidObj(victim, DORDER_ATTACK, attacker);
		}
		if(gameTime < (throttleTime + 3000)) {
			throttleTime = gameTime;
			attackStuff(scavengerNumber);
		}
		return;
	}
		
	if (attacker && victim && (attacker.player !== me) && !allianceExistsBetween(attacker.player, victim.player)) {
		grudgeCount[attacker.player] += 1;
		
		//Skip code when being attacked at a phenominal rate
		if(gameTime < (throttleTime + 2500)) {
			throttleTime = gameTime;
			return;
		}
		
		//find nearby units
		var units = enumRange(victim.x, victim.y, 4, me, false).filter(function(d) {
			return (d.type == DROID) && ((d.droidType == DROID_WEAPON) || (d.droidType == DROID_CYBORG))
		});
		if(units.length < 3)
			units = enumRange(victim.x, victim.y, 6, me, false).filter(function(d) {
						return (d.type == DROID) && ((d.droidType == DROID_WEAPON) || (d.droidType == DROID_CYBORG))
					});
		
		//Be a bit aggressive when a structure(namely oil derricks) are attacked.
		if(victim.type == STRUCTURE)
			grudgeCount[attacker.player] = 50;
		
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
		if(grudgeCount[attacker.player] > 10)
			attackStuff(attacker.player);
	}
}

//Increase grudge counter
function eventGroupLoss(droid, group, size) {
	if(droid.order == DORDER_RECYCLE) { return; }
	
	addBeacon(droid.x, droid.y, ALLIES);
	
	var who = enumRange(droid.x, droid.y, 15, ENEMIES, true).filter(function(dr) { return dr.type == DROID });
	if(isDefined(scavengerNumber)) { who.filter(function(obj) { obj.player !== scavengerNumber }); }
	if(who.length > 0) { grudgeCount[who[0].player] += 10; }
	
	if((playerAlliance(true).lrngth > 0) && (lastMsg != "need tank") && (lastMsg != "need cyborg") && (lastMsg != "need vtol")) {
		if (enumGroup(attackGroup).length < 2) {
			lastMsg = "need tank";
			chat(ALLIES, lastMsg);
		}
		if (countStruct(structures.templateFactories) && enumGroup(cyborgGroup).length < 2) {
			lastMsg = "need cyborg";
			chat(ALLIES, lastMsg);
		}
		if (countStruct(structures.vtolFactories) && enumGroup(vtolGroup).length < 2) {
			lastMsg = "need vtol";
			chat(ALLIES, lastMsg);
		}
	}
}

function eventDroidIdle(droid) {
	if(droid.player === me) {
		if(isDefined(droid) && ((droid.droidType == DROID_WEAPON) || (droid.droidType == DROID_CYBORG) || isVTOL(droid))) {
			orderDroid(droid, DORDER_RTB);
		}
	}
}

function eventChat(from, to, message) {
	if((to != me) || (to == from)) { return; }
	
	if((message === "need truck") && allianceExistsBetween(from, to)) {
		var droids = enumDroid(me, DROID_CONSTRUCT);
		if(droids.length <= 3) { return; }
		
		donateObject(droids[random(droids.length)], from);
	}
	else if((message === "need power") && allianceExistsBetween(from, to)) {
		if(playerPower(me) - queuedPower(me) > 0) { donatePower(playerPower(me) / 2, from); }
	}
	else if((message === "need tank") && allianceExistsBetween(from, to)) {
		var droids = enumDroid(me, DROID_WEAPON);
		if(droids.length < 6) { return; }
		
		donateObject(droids[random(droids.length)], from);
	}
	else if((message === "need cyborg") && allianceExistsBetween(from, to)) {
		var droids = enumDroid(me, DROID_CYBORG);
		if(droids.length < 6) { return; }
		
		donateObject(droids[random(droids.length)], from);
	}
	else if((message === "need vtol") && allianceExistsBetween(from, to)) {
		var droids = enumDroid(me).filter(function(obj){ return isVTOL(obj); });
		if(droids.length < 6) { return; }
		
		donateObject(droids[random(droids.length)], from);
	}
	else if(((message === "help me!") || (message == "help me!!")) && allianceExistsBetween(from, to)) {
		var hq = enumStruct(from, structures.hqs);
		if(hq.length === 1) {
			lastMsg = "Sending units to your command center!";
			chat(from, lastMsg);
			eventBeacon(hq.x, hq.y, from, me, "");
		}
		else {
			lastMsg = "Sorry, no can do";
			chat(from, lastMsg);
		}
	}
	
	var tmp = message.slice(0, -1);
	if(tmp === "attack") {
		var num = message.slice(-1);
		if(!allianceExistsBetween(num, me) && (num != me)) {
			attackStuff(num);
		}
	}

}

//Better check what is going on over there.
function eventBeacon(x, y, from, to, message) {
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
	if((obj.health > 100) && !allianceExistsBetween(from, me)) {
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

//Basic Laser Satellite support
function eventStructureReady(structure) {
	var enemy = playerAlliance(false);
	var facs = [];
	
	enemy = enemy[random(enemy.length)];
	facs = enumStruct(enemy, FACTORY).concat(enumStruct(enemy, CYBORG_FACTORY));
	
	if(facs.length > 0)
		activateStructure(structure, facs[random(facs.length)]);
}

