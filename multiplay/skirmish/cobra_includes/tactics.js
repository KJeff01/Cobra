
//See who has been attacking Cobra the most and attack them.
function checkMood() {
	//Tell allies (ideally non-bots) who is attacking Cobra the most
	var mostHarmful = 0;
	for(var x = 0; x < maxPlayers; ++x) {
		if((grudgeCount[x] > 0) && (grudgeCount[x] > grudgeCount[mostHarmful]))
			mostHarmful = x;
	}
	if((grudgeCount[mostHarmful] > 5) && (lastMsg != ("Most harmful player: " + mostHarmful))) {
		lastMsg = "Most harmful player: " + mostHarmful;
		chat(ALLIES, lastMsg);
	}
	
	if(grudgeCount[mostHarmful] >= 60) {
		attackStuff(mostHarmful);
		grudgeCount[mostHarmful] /= 2;
	}
	else if((grudgeCount[mostHarmful] > 10) && (grudgeCount[mostHarmful] < 60)) {
		var derr = enumStruct(mostHarmful, structures.derricks);
		var struc = enumStruct(mostHarmful);
			
		var cyborgs = enumGroup(cyborgGroup);
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
			
		for (var i = 0; i < cyborgs.length; i++) {
			if(!repairDroid(cyborgs[i]) && isDefined(target) && droidCanReach(cyborgs[i], target.x, target.y))
				orderDroidLoc(cyborgs[i], DORDER_SCOUT, target.x, target.y)
		}
		
		var vtols = enumGroup(vtolGroup);
		var vtTarget;
		if(vtols.length > 0)
			vtTarget = rangeStep(vtols[0], false);
			
		for (var i = 0; i < vtols.length; ++i) {
			if(vtolReady(vtols[i]) && isDefined(vtTarget[0])) {
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
		
	if(str != "attack") {
		lastMsg = "attack" + selectedEnemy;
		chat(ALLIES, lastMsg);
	}
	
	if(tanks.length > 4) {
		for (var j = 0; j < tanks.length; j++) {
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

	if(isDefined(turnOffCyborgs) && (turnOffCyborgs === false) && (cyborgs.length > 4)) {
		for (var j = 0; j < cyborgs.length; j++) {
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
	if(vtols.length > 4) {
		for (var j = 0; j < vtols.length; j++) {
			if (vtolReady(vtols[j])) {
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
	var sensors = enumGroup(sensorGroup);
	if(!sensors.length) { return false; }
	sensors.sort(distanceToBase);
	sensors.reverse();

	if(sensors[0].health < 60)
		repairDroid(sensors[0], true);


	//Observe closest enemy object with a hover unit
	var object = rangeStep(sensors[0], false);
	if(isDefined(object) && droidCanReach(sensors[0], object.x, object.y)) {
		orderDroidObj(sensors[0], DORDER_OBSERVE, object);

		var tanks = enumGroup(attackGroup).filter(function(obj) { return obj.propulsion === "hover01" });
		if(tanks.length === 0) { tanks = enumGroup(attackGroup); }
		if(tanks.length === 0) { return false; }
		
		tanks.sort(distanceToBase);
		tanks.reverse();
		
		if(isDefined(tanks[0]) && tanks[0] && !repairDroid(tanks[0])) {
			//grudgeCount[object.player] += 2;
			var xPos = (sensors[0].x + object.x) / 2;
			var yPos = (sensors[0].y + object.y) / 2;
			if(droidCanReach(tanks[0], xPos, yPos))
				orderDroidLoc(tanks[0], DORDER_SCOUT, xPos, yPos);
		}
	}
}

//Attack enemy oil when tank group is large enough.
//Prefer cyborgs over tanks.
function attackEnemyOil() {
	var tanks = enumGroup(attackGroup);
	var borgs = enumGroup(cyborgGroup);
	var who;
		
	var enemy = playerAlliance(false);
	var derr = [];
	
	for(var i = 0; i < enemy.length; ++i) {
		derr.concat(enumStruct(enemy[i], structures.derricks));
	}
	
	//Check for scavs
	if(isDefined(scavengerNumber) && !allianceExistsBetween(scavengerNumber, me)) {
		derr.concat(enumStruct(scavengerNumber, structures.derricks));
	}
	if(!derr.length) { return false; }
	
	derr.sort(distanceToBase);
	if(borgs.length > 2) { who = borgs; }
	else { who = tanks; }
	
	if(who.length < 3) { return false; }

	for(var i = 0; i < who.length; ++i) {
		if(isDefined(derr[0]) && !repairDroid(who[i], false) && droidCanReach(who[i], derr[0].x, derr[0].y))
			orderDroidLoc(who[i], DORDER_SCOUT, derr[0].x, derr[0].y);
		else
			break;
	}
}



//Recycle units when certain conditions are met.
function recycleObsoleteDroids() {
	var tanks = enumGroup(attackGroup);
	//var vtols = enumGroup(vtolGroup);
	var systems = enumGroup(sensorGroup).concat(enumDroid(me, DROID_CONSTRUCT));
	var temp = false;
 
	for(var i = 0; i < systems.length; ++i) {
		if((unfinishedStructures().length === 0) && (systems[i].propulsion != "hover01") && componentAvailable("hover01")) {
				
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
	
	return temp;
}

