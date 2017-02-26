
//Droids that are attacking should not be pulled away until 
//they destroy whatever thay are attacking or need repair.
function droidReady(droid) {
	return droid.order != DORDER_ATTACK;
}

//See who has been attacking Cobra the most and attack them.
function checkMood() {
	var mostHarmful = getMostHarmfulPlayer();
	
	if(grudgeCount[mostHarmful] >= 60) {
		attackStuff(mostHarmful);
		grudgeCount[mostHarmful] = 10;
	}
	else if((grudgeCount[mostHarmful] > 10) && (grudgeCount[mostHarmful] < 60)) {
		var derr = enumStruct(mostHarmful, structures.derricks);
		var struc = enumStruct(mostHarmful);
			
		var cyb = enumGroup(cyborgGroup);
		var target;
		if(derr.length > 0)
			target = derr[random(derr.length)];
		else {
			if(struc.length > 0)
				target = struc[random(struc.length)];
			else {
				if(((grudgeCount[mostHarmful] - 1) > -1))
					grudgeCount[mostHarmful] -= 1;
				return;
			}
		}
			
		for (var i = 0; i < cyb.length; i++) {
			if(isDefined(cyb[i]) && droidReady(cyb[i])) {
				if(!repairDroid(cyb[i]) && isDefined(target) && droidCanReach(cyb[i], target.x, target.y))
					orderDroidLoc(cyb[i], DORDER_SCOUT, target.x, target.y);
			}
		}
		
		var vtols = enumGroup(vtolGroup);
		var vtTarget;
		if(vtols.length > 0)
			vtTarget = rangeStep(vtols[0], false);
			
		for (var i = 0; i < vtols.length; ++i) {
			if(isDefined(vtols[i]) && vtolReady(vtols[i]) && isDefined(vtTarget[0])) {
				orderDroidLoc(vtols[i], DORDER_SCOUT, vtTarget[0].x, vtTarget[0].y);
			}
		}
			
		grudgeCount[mostHarmful] /= 2;
	}
}

//attacker is a player number. Attack a specific player.
function attackStuff(attacker) {
	var tanks = enumGroup(attackGroup);
	var cyborgs = enumGroup(cyborgGroup);
	var vtols = enumGroup(vtolGroup);
	var enemy = playerAlliance(false);
	var str = lastMsg.slice(0, -1);
	var selectedEnemy = enemy[random(enemy.length)];
	
	if(isDefined(attacker) && !allianceExistsBetween(attacker, me) && (attacker !== me)) {
		selectedEnemy = attacker;
		if(!isDefined(scavengerNumber) || (isDefined(scavengerNumber) && (attacker.player !== scavengerNumber)))
			grudgeCount[attacker] = 100;
	}
		
	var derr = enumStruct(selectedEnemy, structures.derricks);
	var fac = enumStruct(selectedEnemy, structures.factories);
	fac.concat(enumStruct(selectedEnemy, structures.templateFactories));
	
	var target = derr[random(derr.length)];
	var targetFac = fac[random(fac.length)];
		
	if((str != "attack") && (str != "oil")) {
		if(random(4)) {
			sendChatMessage("attack" + selectedEnemy, ALLIES);
		}
		else  {
			sendChatMessage("oil" + selectedEnemy, ALLIES);
		}
	}
	
	if(tanks.length > 4) {
		for (var j = 0; j < tanks.length; j++) {
			if(isDefined(tanks[j]) && droidReady(tanks[j])) {
				if(isDefined(targetFac) && !repairDroid(tanks[j]) && droidCanReach(tanks[j], targetFac.x, targetFac.y))
					orderDroidLoc(tanks[j], DORDER_SCOUT, targetFac.x, targetFac.y);
				else {
					var s = enumStruct(selectedEnemy);
					if(s.length > 0) {
						s.sort(distanceToBase);
						if(!repairDroid(tanks[j]) && droidCanReach(tanks[j], s[0].x, s[0].y))
							orderDroidLoc(tanks[j], DORDER_SCOUT, s[0].x, s[0].y);
					}
				}
			}
		}
	}

	if(isDefined(turnOffCyborgs) && (turnOffCyborgs === false) && (cyborgs.length > 4)) {
		for (var j = 0; j < cyborgs.length; j++) {
			if(isDefined(cyborgs[j]) && droidReady(cyborgs[j])) {
				if(isDefined(target) && !repairDroid(cyborgs[j]) && droidCanReach(cyborgs[j], target.x, target.y))
					orderDroidLoc(cyborgs[j], DORDER_SCOUT, target.x, target.y);
				else {
					var s = enumStruct(selectedEnemy);
					if(s.length > 0) {
						s.sort(distanceToBase);
						if(!repairDroid(cyborgs[j]) && droidCanReach(cyborgs[j], s[0].x, s[0].y))
							orderDroidLoc(cyborgs[j], DORDER_SCOUT, s[0].x, s[0].y);
					}
				}
			}
		}
	}
	if(vtols.length > 4) {
		for (var j = 0; j < vtols.length; j++) {
			if (isDefined(vtols[j]) && vtolReady(vtols[j])) {
				var s = enumStruct(selectedEnemy);
				if(s.length > 0) {
					s.sort(distanceToBase);
					orderDroidLoc(vtols[j], DORDER_SCOUT, s[0].x, s[0].y);
				}
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
	var tanks = enumGroup(attackGroup);
	var cyborgs = enumGroup(cyborgGroup);
	
	for(var x = 0; x < tanks.length; ++x) {
		if(tanks[x].health < 30)
			repairDroid(tanks[x], true);
	}
	
	for(var x = 0; x < cyborgs.length; ++x) {
		if(cyborgs[x].health < 30)
			repairDroid(cyborgs[x], true);
	}
}

//Sensors know all your secrets. They will observe what is close to them.
function spyRoutine() {
	var sensor;
	var sensors = enumGroup(sensorGroup);
	if(!sensors.length) { return false; }
	sensors = sortAndReverseDistance(sensors);
	
	for(var i = 0; i < sensors.length; ++i) {
		if(!repairDroid(sensors[i], false)) {
			if(!isDefined(sensor))
				sensor = sensors[i];
		}
	}
	
	if(!isDefined(sensor)) { return; }

	//Observe closest enemy object with a hover unit
	var object = rangeStep(sensor, false);
	if(isDefined(object) && droidCanReach(sensor, object.x, object.y)) {
		orderDroidObj(sensor, DORDER_OBSERVE, object);

		var tanks = enumGroup(attackGroup).filter(function(obj) { return obj.propulsion === "hover01" });
		if(tanks.length === 0) { tanks = enumGroup(attackGroup); }
		if(tanks.length === 0) { return false; }
		
		tanks = sortAndReverseDistance(tanks);
		
		if(isDefined(tanks[0]) && !repairDroid(tanks[0])) {
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
	if(who.length < 3) { return false; }
		
	var derr = findEnemyDerricks();
	if(!derr.length) { return false; }
	derr.sort(distanceToBase);

	for(var i = 0; i < who.length; ++i) {
		if(isDefined(who[i]) && droidReady(who[i])) {
			if(isDefined(derr[tmp]) && !repairDroid(who[i], false) && droidCanReach(who[i], derr[tmp].x, derr[tmp].y)) {
				orderDroidObj(who[i], DORDER_ATTACK, derr[tmp]);
				if(!((i + 1) % 3))
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
		if(isDefined(who[i]) && !repairDroid(who[i]) && droidReady(who[i])) {
			if(isDefined(derr[tmp])) {
				orderDroidObj(who[i], DORDER_ATTACK, derr[tmp]);
				if(!((i + 1) % 5))
					tmp += 1;
			}
		}
	}
}

