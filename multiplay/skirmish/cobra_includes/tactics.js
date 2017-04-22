
//Droids that are attacking should not be pulled away until
//they destroy whatever thay are attacking or need repair.
function droidReady(droid) {
	return (!repairDroid(droid, false)
		&& (droid.order !== DORDER_ATTACK)
		&& (droid.order !== DORDER_RTR)
	);
}

//Taken from nullbot v3.06
//Does the vtol weapons have ammo?
function vtolArmed(obj, percent) {
	if (obj.type !== DROID)
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
	const ARMED_PERCENT = 1;

	if (droid.order === DORDER_ATTACK)
		return false;

	if (vtolArmed(droid, ARMED_PERCENT))
		return true;

	if (droid.order !== DORDER_REARM) {
		orderDroid(droid, DORDER_REARM);
	}

	return false;
}

//Repair a droid with the option of forcing it to.
function repairDroid(droid, force) {
	const FORCE_REPAIR_PERCENT = 33;
	const EXPERIENCE_DIVISOR = 20;
	const HEALTH_TO_REPAIR = 50 + Math.floor(droid.experience / EXPERIENCE_DIVISOR);

	if(!isDefined(force)) { force = false; }
	if(Math.floor(droid.health) <= FORCE_REPAIR_PERCENT) { force = true; }
	if((droid.order === DORDER_RTR) && ((Math.floor(droid.health) < 100) || force))
		return true;

	if(countStruct(structures.extras[0]) && (force || (Math.floor(droid.health) <= HEALTH_TO_REPAIR))) {
		orderDroid(droid, DORDER_RTR);
		return true;
	}

	return false;
}

//choose either cyborgs or tanks. prefer cyborgs if any.
function chooseGroup() {
	const MIN_DROID_COUNT = 5;
	var tanks  = enumGroup(attackGroup);
	var borgs = enumGroup(cyborgGroup);

	if((borgs.length > MIN_DROID_COUNT) && (borgs.length > tanks.length)) {
		return borgs;
	}
	else {
		if(tanks.length > MIN_DROID_COUNT)
			return tanks;
	}

	return tanks;
}

//Find the derricks of all enemy players, or just a specific one.
function findEnemyDerricks(playerNumber) {
	var derr = [];

	if(!isDefined(playerNumber)) {
		var enemies = findLivingEnemies();
		for(var i = 0; i < enemies.length; ++i) {
			derr = appendListElements(derr, enumStruct(enemies[i], structures.derricks));
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
	const GRUDGE_LEVEL = 300;
	var mostHarmful = getMostHarmfulPlayer();

	if(grudgeCount[mostHarmful] >= GRUDGE_LEVEL) {
		attackStuff(mostHarmful);
		grudgeCount[mostHarmful] = Math.floor(grudgeCount[mostHarmful] / 1.75);
	}
	else if((grudgeCount[mostHarmful] >= 0) && (grudgeCount[mostHarmful] < GRUDGE_LEVEL)) {
		if(isDefined(turnOffCyborgs) && !turnOffCyborgs) {
			attackWithGroup(enumGroup(cyborgGroup), mostHarmful);
		}

		var vtols = enumGroup(vtolGroup);
		for (var j = 0; j < vtols.length; j++) {
			if (isDefined(vtols[j]) && vtolReady(vtols[j])) {
				findNearestEnemyStructure(vtols[j], mostHarmful);
			}
		}
		grudgeCount[mostHarmful] = Math.floor(grudgeCount[mostHarmful] / 2.0);
	}
}

function findNearestEnemyDroid(droid, enemy) {
	if(!isDefined(enemy)) {
		enemy = getMostHarmfulPlayer();
	}

	var badDroids = enumDroid(enemy);
	if(badDroids.length) {
		badDroids.sort(distanceToBase);
		if(droidReady(droid) && isDefined(badDroids[0]) && droidCanReach(droid, badDroids[0].x, badDroids[0].y)) {
			if(!isVTOL(droid)) {
				orderDroidObj(droid, DORDER_ATTACK, badDroids[0]);
			}
			else {
				orderDroidLoc(droid, DORDER_SCOUT, badDroids[0].x, badDroids[0].y);
			}
		}
	}
}

//Tell a droid to find the nearest enemy structure.
function findNearestEnemyStructure(droid, enemy, targets) {
	if(!isDefined(enemy)) {
		enemy = getMostHarmfulPlayer();
	}

	var s = (isDefined(targets)) ? targets : enumStruct(enemy).filter(function(obj) { return obj.stattype !== WALL });
	if(s.length === 0) {
		s = enumStruct(enemy);
	}

	if(s.length > 0) {
		s.sort(distanceToBase);
		if(droidReady(droid) && isDefined(s[0]) && droidCanReach(droid, s[0].x, s[0].y)) {
			if(!isVTOL(droid)) {
				orderDroidObj(droid, DORDER_ATTACK, s[0]);
			}
			else {
				if(s[0].stattype !== WALL) {
					orderDroidLoc(droid, DORDER_SCOUT, s[0].x, s[0].y);
				}
				else {
					orderDroidObj(droid, DORDER_ATTACK, s[0]);
				}
			}
		}
	}
	else {
		findNearestEnemyDroid(droid, enemy);
	}
}

//Attack something.
function attackWithGroup(droids, enemy, targets) {
	if(!isDefined(enemy)) {
		enemy = getMostHarmfulPlayer();
	}

	const MIN_DROID_COUNT = 6;
	if(droids.length < MIN_DROID_COUNT)
		return false;

	var target;
	if(isDefined(targets) && targets.length) {
		targets.sort(distanceToBase);
		target = targets[0];
	}

	for (var j = 0; j < droids.length; j++) {
		if(isDefined(droids[j]) && droidReady(droids[j])) {
			if(isDefined(target) && droidCanReach(droids[j], target.x, target.y)) {
				orderDroidObj(droids[j], DORDER_ATTACK, target);
			}
			else {
				findNearestEnemyStructure(droids[j], enemy);
			}
		}
	}
}

//returns undefined for tactics that allow 'me' to attack something other than derricks.
function chatTactic(enemy) {
	const MIN_DERRICKS = 6;
	const MIN_DROID_COUNT = 15;
	var str = lastMsg.slice(0, -1);
	var code;

	if((str !== "attack") && (str !== "oil")) {
		if((countStruct(structures.derricks) > MIN_DERRICKS) && (enumDroid(me) > MIN_DROID_COUNT)) {
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
	var selectedEnemy = getMostHarmfulPlayer();

	if(isDefined(attacker) && !allianceExistsBetween(attacker, me) && (attacker !== me)) {
		selectedEnemy = attacker;
	}

	if(isDefined(chatTactic(selectedEnemy)))
		return;

	attackWithGroup(enumGroup(attackGroup), selectedEnemy, enumStruct(selectedEnemy, structures.factories));
	if(isDefined(turnOffCyborgs) && !turnOffCyborgs) {
		attackWithGroup(enumGroup(cyborgGroup), selectedEnemy, enumStruct(selectedEnemy, structures.templateFactories));
	}

	var vtols = enumGroup(vtolGroup);
	for (var j = 0; j < vtols.length; j++) {
		if (isDefined(vtols[j]) && vtolReady(vtols[j])) {
			findNearestEnemyStructure(vtols[j], selectedEnemy);
		}
	}
}

//Sensors know all your secrets. They will observe what is close to them.
function spyRoutine() {
	var sensors = enumGroup(sensorGroup);
	if(!sensors.length) { return false; }
	sensors = sortAndReverseDistance(sensors);
	var sensor = sensors[0];

	if(!isDefined(sensor)) { return; }

	var object = rangeStep(sensor, false);
	if(isDefined(object)) {
		orderDroidObj(sensor, DORDER_OBSERVE, object);
	}
}

//Attack enemy oil when tank group is large enough.
function attackEnemyOil() {
	var enemy = getMostHarmfulPlayer();
	var derr = findEnemyDerricks(enemy);
	if(derr.length) {
		derr.sort(distanceToBase);
		if(isDefined(derr[0])) {
			attackWithGroup(chooseGroup(), enemy, derr);
		}
	}
	else {
		checkMood();
	}
}

//Defend or attack.
function battleTactics() {
	var droids = enumRange(startPositions[me].x, startPositions[me].y, 3000, ENEMIES, true);
	droids.filter(function(obj) { return (obj.type === DROID) && !isVTOL(obj) });

	//Go defend the base.
	if(droids.length) {
		droids.sort(distanceToBase);
		var myTanks = enumGroup(attackGroup);
		for(var i = 0; i < myTanks.length; ++i) {
			if(!repairDroid(myTanks[i]) && isDefined(droids[0])) {
				orderDroidLoc(myTanks[i], DORDER_SCOUT, droids[0].x, droids[0].y);
			}
		}
	}
	else {
		attackEnemyOil();
	}
}

//Recycle units when certain conditions are met.
function recycleObsoleteDroids() {
	var tanks = enumGroup(attackGroup);
	//var vtols = enumGroup(vtolGroup);
	var systems = enumGroup(sensorGroup).concat(enumDroid(me, DROID_CONSTRUCT));
	var temp = false;

	if(countStruct(structures.factories) > 1) {
		if(!unfinishedStructures().length && componentAvailable("hover01")) {
			for(var i = 0; i < systems.length; ++i) {
				if(systems[i].propulsion !== "hover01") {
					temp = true;
					orderDroid(systems[i], DORDER_RECYCLE);
				}
			}
		}

		if(forceHover && componentAvailable("hover01")) {
			for(var i = 0; i < tanks.length; ++i) {
				if((tanks[i].propulsion !== "hover01"))
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
	const MIN_DROID_COUNT = 8;
	var derr = findEnemyDerricks(playerNumber);
	var who = chooseGroup();

	if(!derr.length || (who.length < MIN_DROID_COUNT)) { return false; }
	derr.sort(distanceToBase);

	for(var i = 0; i < who.length; ++i) {
		if(isDefined(who[i]) && droidReady(who[i]) && isDefined(derr[0])) {
			orderDroidObj(who[i], DORDER_ATTACK, derr[0]);
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
