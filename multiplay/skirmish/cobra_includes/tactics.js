
//Droids that are attacking should not be pulled away until
//they destroy whatever thay are attacking or need repair.
function droidReady(droid) {
	return (!repairDroid(droid, false) && (droid.order != DORDER_ATTACK));
}

//Taken from nullbot v3.06
//Does the vtol weapons have ammo?
function vtolArmed(obj, percent) {
	if (obj.type != DROID)
		return;

	if (!isVTOL(obj))
		return false;

	for (var i = 0; i < obj.weapons.length; ++i)
		if (obj.weapons[i].armed >= percent)
			return true;

	return false;
}

//Should the vtol attack when ammo is high enough?
function vtolReady(droid) {
	if (droid.order == DORDER_ATTACK)
		return false;

	if (vtolArmed(droid, 1))
		return true;

	if (droid.order != DORDER_REARM) {
		orderDroid(droid, DORDER_REARM);
	}

	return false;
}

//choose either cyborgs or tanks. prefer cyborgs if any.
function chooseGroup() {
	var tanks  = enumGroup(attackGroup);
	var borgs = enumGroup(cyborgGroup);

	if((borgs.length > 4) && (borgs.length > tanks.length) && !random(10)) {
		return borgs;
	}
	else {
		if(tanks.length > 4)
			return tanks;
	}

	return tanks;
}

//Find the derricks of all enemy players, or just a specific one.
function findEnemyDerricks(playerNumber) {
	var derr = [];

	if(!isDefined(playerNumber)) {
		var enemy = playerAlliance(false);
		for(var i = 0; i < enemy.length; ++i) {
			derr = appendListElements(derr, enumStruct(enemy[i], structures.derricks));
		}

		//Check for scavs
		if(isDefined(scavengerNumber) && !allianceExistsBetween(scavengerNumber, me)) {
			derr = appendListElements(derr, enumStruct(scavengerNumber, structures.derricks));
		}
	}
	else {
		derr = enumStruct(playerNumber, structures.derricks);
	}

	return derr;
}

//See who has been attacking Cobra the most and attack them.
function checkMood() {
	var mostHarmful = getMostHarmfulPlayer();

	if(grudgeCount[mostHarmful] >= 325) {
		attackStuff(mostHarmful);
		grudgeCount[mostHarmful] = 100;
	}
	else if((grudgeCount[mostHarmful] > 10) && (grudgeCount[mostHarmful] < 325)) {
		if(isDefined(turnOffCyborgs) && !turnOffCyborgs) {
			attackWithGroup(enumGroup(cyborgGroup), enumStruct(mostHarmful, structures.derricks), mostHarmful);
		}

		attackWithGroup(enumGroup(vtolGroup), enumStruct(mostHarmful), mostHarmful);
		grudgeCount[mostHarmful] = Math.floor(grudgeCount[mostHarmful] / 2);
	}
}

//Tell a droid to find the nearest enemy structure.
function findNearestEnemyStructure(droid, enemy, targets) {
	var s = (isDefined(targets)) ? targets : enumStruct(enemy).filter(function(obj) { return obj.stattype !== WALL });
	if(s.length === 0)
		s = enumStruct(enemy);

	if(s.length > 0) {
		s.sort(distanceToBase);
		if(!repairDroid(droid) && isDefined(s[0]) && droidCanReach(droid, s[0].x, s[0].y))
			orderDroidObj(droid, DORDER_ATTACK, s[0]);
	}
}

//Attack something.
function attackWithGroup(droids, targets, enemy) {
	if(droids.length < 6)
		return false;

	var target;

	if(targets.length) {
		targets.sort(distanceToBase);
		var target = targets[0];
	}

	for (var j = 0; j < droids.length; j++) {
		if(isDefined(droids[j]) && droidReady(droids[j])) {
			if(isDefined(target) && droidCanReach(droids[j], target.x, target.y))
				orderDroidObj(droids[j], DORDER_ATTACK, target);
			else {
				findNearestEnemyStructure(droids[j], enemy);
			}
		}
	}
}

//returns undefined for tactics that allow 'me' to attack something other than derricks.
function chatTactic(enemy) {
	var str = lastMsg.slice(0, -1);
	var code;

	if((str != "attack") && (str != "oil")) {
		if((countStruct(structures.derricks) > 7) && (enumDroid(me) > 20)) {
			sendChatMessage("attack" + enemy, ALLIES);
		}
		else  {
			sendChatMessage("oil" + enemy, ALLIES);
			chatAttackOil(enemy);
			code = true;
		}
	}

	return code;
}

//attacker is a player number. Attack a specific player.
function attackStuff(attacker) {
	var enemies = playerAlliance(false);
	var selectedEnemy = enemies[random(enemies.length)];

	if(isDefined(attacker) && !allianceExistsBetween(attacker, me) && (attacker !== me)) {
		selectedEnemy = attacker;
		if(!isDefined(scavengerNumber) || (isDefined(scavengerNumber) && (attacker.player !== scavengerNumber)))
			grudgeCount[attacker] = 100;
	}

	if(isDefined(chatTactic(selectedEnemy)))
		return;

	attackWithGroup(enumGroup(attackGroup), enumStruct(selectedEnemy, structures.factories), selectedEnemy);
	if(isDefined(turnOffCyborgs) && !turnOffCyborgs) {
		attackWithGroup(enumGroup(cyborgGroup), enumStruct(selectedEnemy, structures.templateFactories), selectedEnemy);
	}

	//VTOL units favor targeting derricks before anything else.
	var vtols = enumGroup(vtolGroup);
	if(vtols.length > 4) {
		var derr = findEnemyDerricks(selectedEnemy);

		for (var j = 0; j < vtols.length; j++) {
			if (isDefined(vtols[j]) && vtolReady(vtols[j])) {
				findNearestEnemyStructure(vtols[j], selectedEnemy, derr);
			}
		}
	}

}


//Repair a droid with the option of forcing it to.
function repairDroid(droid, force) {
	if(!isDefined(force))
		force = false;

	var percent = 40;

	if((droid.order === DORDER_RTR) && ((droid.health < 100) || force))
		return true;

	var repairs = countStruct(structures.extras[0]);
	if((repairs > 0) && (force || (droid.health <= percent))) {
		orderDroid(droid, DORDER_RTR);
		return true;
	}

	return false;
}

//Check all units for repair needs.
function repairAll() {
	var droids = enumDroid(me).filter(function(dr) {return !isVTOL(dr)});

	for(var x = 0; x < droids.length; ++x) {
		if(droids[x].health < (52 + Math.floor(droids[x].experience / 28)))
			repairDroid(droids[x], true);
	}
}

//Sensors know all your secrets. They will observe what is close to them.
function spyRoutine() {
	var sensors = enumGroup(sensorGroup);
	if(!sensors.length) { return false; }
	sensors = sortAndReverseDistance(sensors);
	var sensor = sensors[0];

	if(!isDefined(sensor)) { return; }

	//Observe closest enemy object with a hover unit
	var object = rangeStep(sensor, false);
	if(isDefined(object)) {
		var tanks = enumGroup(attackGroup).filter(function(obj) { return obj.propulsion === "hover01" });
		if(tanks.length === 0) { tanks = enumGroup(attackGroup); }
		tanks.filter(function(dr) { return dr.hasIndirect || dr.isCB });
		if(tanks.length === 0) { return false; }

		tanks = sortAndReverseDistance(tanks);

		if(isDefined(tanks[0]) && droidReady(tanks[0])) {
			orderDroidObj(sensor, DORDER_OBSERVE, object);
			//grudgeCount[object.player] += 2;
			var xPos = (sensor.x + object.x) / 2;
			var yPos = (sensor.y + object.y) / 2;
			if(droidCanReach(tanks[0], xPos, yPos))
				orderDroidLoc(tanks[0], DORDER_SCOUT, xPos, yPos);
		}
	}
}

//Attack enemy oil when tank group is large enough.
//Prefer cyborgs over tanks.
function attackEnemyOil() {
	var who = chooseGroup();
	var tmp = 0;
	if(who.length < 5) { return false; }

	var derr = findEnemyDerricks();
	if(!derr.length) { return false; }
	derr.sort(distanceToBase);

	for(var i = 0; i < who.length; ++i) {
		if(isDefined(who[i]) && droidReady(who[i])) {
			if(isDefined(derr[tmp]) && droidCanReach(who[i], derr[tmp].x, derr[tmp].y)) {
				orderDroidObj(who[i], DORDER_ATTACK, derr[tmp]);
				if(!((i + 1) % Math.floor(who.length / 3)))
					tmp += 1;
			}
		}
	}
}

//Recycle units when certain conditions are met.
function recycleObsoleteDroids() {
	var tanks = enumGroup(attackGroup);
	//var vtols = enumGroup(vtolGroup);
	var systems = enumGroup(sensorGroup).concat(enumDroid(me, DROID_CONSTRUCT));
	var temp = false;

	if(countStruct(structures.factories) > 1) {
		for(var i = 0; i < systems.length; ++i) {
			if((unfinishedStructures().length === 0) && (systems[i].propulsion !== "hover01") && componentAvailable("hover01")) {
				temp = true;
				orderDroid(systems[i], DORDER_RECYCLE);
			}
		}

		if(forceHover === true) {
			for(var i = 0; i < tanks.length; ++i) {
				if((tanks[i].propulsion != "hover01") && componentAvailable("hover01"))
					orderDroid(tanks[i], DORDER_RECYCLE);
			}
		}
		/*
		for(var i = 0; i < tanks.length; ++i) {
			orderDroid(tanks[i], DORDER_RECYCLE);
		}

		for(var i = 0; i < vtols.length; ++i) {
			orderDroid(vtols[i], DORDER_RECYCLE);
		}
		*/
	}
	return temp;
}

//Attack oil specifically if a player requests it.
function chatAttackOil(playerNumber) {
	var derr = findEnemyDerricks(playerNumber);
	var who = chooseGroup();
	var tmp = 0;

	if(!derr.length || (who.length < 4)) { return false; }
	derr.sort(distanceToBase);

	for(var i = 0; i < who.length; ++i) {
		if(isDefined(who[i]) && droidReady(who[i])) {
			if(isDefined(derr[tmp])) {
				orderDroidObj(who[i], DORDER_ATTACK, derr[tmp]);
				if(!((i + 1) % Math.floor(who.length / 3)))
					tmp += 1;
			}
		}
	}
}

//Commanders target whatever is nearby.
/*
function commandTactics() {
	var coms = enumGroup(commanderGroup);

	for(var i = 0; i < coms.length; ++i) {
		if(isDefined(coms[i]) && droidReady(coms[i])) {
			var target = rangeStep(coms[i], false);
			if(isDefined(target)) {
				orderDroidObj(coms[i], DORDER_ATTACK, target);
			}
		}
	}
}
*/
