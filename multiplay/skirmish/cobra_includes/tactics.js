
//Droids that are attacking should not be pulled away until
//they destroy whatever thay are attacking or need repair.
function droidReady(droid) {
	return (!repairDroid(droid, false)
		&& (droid.order !== DORDER_ATTACK)
		&& (droid.order !== DORDER_RTR)
		&& vtolReady(droid) //True for non-VTOL units
	);
}

//Taken from nullbot v3.06
//Does the vtol weapons have ammo?
function vtolArmed(obj, percent) {
	if (obj.type !== DROID) {
		return;
	}

	if (!isVTOL(obj)) {
		return false;
	}

	for (var i = 0; i < obj.weapons.length; ++i) {
		if (obj.weapons[i].armed >= percent) {
			return true;
		}
	}

	return false;
}

function returnEnemyFactories(enemyNumber) {
	if(!isDefined(enemyNumber)) {
		enemyNumber = getMostHarmfulPlayer();
	}

	var facs = enumStruct(enemyNumber, structures.factories);
	facs = appendListElements(facs, enumStruct(enemyNumber, structures.templateFactories));
	facs = appendListElements(facs, enumStruct(enemyNumber, structures.vtolFactories));

	facs.sort(distanceToBase);

	return facs;
}

//Should the vtol attack when ammo is high enough?
function vtolReady(droid) {
	if(!isVTOL(droid)) {
		return true; //See droidReady(droid).
	}

	const ARMED_PERCENT = 1;

	if (droid.order === DORDER_ATTACK) {
		return false;
	}

	if (vtolArmed(droid, ARMED_PERCENT)) {
		return true;
	}

	if (droid.order !== DORDER_REARM) {
		orderDroid(droid, DORDER_REARM);
	}

	return false;
}

//Repair a droid with the option of forcing it to.
function repairDroid(droid, force) {
	const FORCE_REPAIR_PERCENT = 33;
	const EXPERIENCE_DIVISOR = 22;
	const HEALTH_TO_REPAIR = 58 + Math.floor(droid.experience / EXPERIENCE_DIVISOR);

	if(!isDefined(force)) {
		force = false;
	}

	if(Math.floor(droid.health) <= FORCE_REPAIR_PERCENT) {
		force = true;
	}

	if((droid.order === DORDER_RTR) && ((Math.floor(droid.health) < 100) || force)) {
		return true;
	}

	if(countStruct(structures.extras[0]) && (force || (Math.floor(droid.health) <= HEALTH_TO_REPAIR))) {
		orderDroid(droid, DORDER_RTR);
		return true;
	}

	return false;
}

//choose either cyborgs/tanks/vtols.
function chooseGroup() {
	const MIN_DROID_COUNT = 5;
	var tanks  = enumGroup(attackGroup);
	var borgs = enumGroup(cyborgGroup);
	var vtols = enumGroup(vtolGroup);

	//return our vtols to the pads if needed.
	for(var i = 0; i < vtols.length; ++i) {
		vtolReady(vtols[i]);
	}

	if((borgs.length > MIN_DROID_COUNT) && random(2)) {
		return borgs;
	}
	else if(tanks.length > MIN_DROID_COUNT && random(2)) {
		return tanks;
	}
	else if(vtols.length > MIN_DROID_COUNT && random(2)) {
		return vtols;
	}

	return tanks; //Fallback.
}

//Find the derricks of all enemy players, or just a specific one.
function findEnemyDerricks(playerNumber) {
	var derr = [];

	if(!isDefined(playerNumber)) {
		var enemies = findLivingEnemies();
		for(var i = 0; i < enemies.length; ++i) {
			derr = appendListElements(derr, enumStruct(enemies[i], structures.derricks));
		}

		//Include scavenger owned derricks if they exist
		if(isDefined(getScavengerNumber()) && !allianceExistsBetween(getScavengerNumber(), me)) {
			derr = appendListElements(derr, enumStruct(getScavengerNumber(), structures.derricks));
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

	if((grudgeCount[mostHarmful] >= GRUDGE_LEVEL) || (random(101) <= 2)) {
		attackStuff(mostHarmful);
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
			orderDroidLoc(droid, DORDER_SCOUT, badDroids[0].x, badDroids[0].y);
		}
	}
}

//Tell a droid to find the nearest enemy structure.
function findNearestEnemyStructure(droid, enemy, targets) {
	if(!isDefined(enemy)) {
		enemy = getMostHarmfulPlayer();
	}

	var s = (isDefined(targets)) ? targets : enumStruct(enemy).filter(function(obj) { return obj.stattype !== WALL; });
	if(s.length === 0) {
		s = enumStruct(enemy);
	}

	if(s.length > 0) {
		s.sort(distanceToBase);
		if(droidReady(droid) && isDefined(s[0]) && droidCanReach(droid, s[0].x, s[0].y)) {
			if(s[0].type !== STRUCTURE) {
				orderDroidLoc(droid, DORDER_SCOUT, s[0].x, s[0].y);
			}
			else {
				orderDroidObj(droid, DORDER_ATTACK, s[0]);
			}
		}
	}
	else {
		findNearestEnemyDroid(droid, enemy);
	}
}

//Attack something.
function attackWithGroup(droids, enemy, targets) {
	if(!isDefined(droids)) {
		return;
	}

	if(!isDefined(enemy)) {
		enemy = getMostHarmfulPlayer();
	}

	const MIN_DROID_COUNT = 6;
	if(droids.length < MIN_DROID_COUNT) {
		return false;
	}

	var target;
	if(isDefined(targets) && targets.length) {
		targets.sort(distanceToBase);
		target = targets[0];
	}

	for (var j = 0; j < droids.length; j++) {
		if(isDefined(droids[j]) && isDefined(target) && droidReady(droids[j])) {
			if((target.type !== STRUCTURE) || ((target.type === STRUCTURE) && (target.stattype !== WALL)) && droidCanReach(droids[j], target.x, target.y)) {
				orderDroidLoc(droids[j], DORDER_SCOUT, target.x, target.y);
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
	const MIN_DROID_COUNT = 12;
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

	if(isDefined(chatTactic(selectedEnemy))) {
		return;
	}

	attackWithGroup(enumGroup(attackGroup), selectedEnemy);
	if(!turnOffCyborgs) {
		attackWithGroup(enumGroup(cyborgGroup), selectedEnemy);
	}

	attackWithGroup(enumGroup(vtolGroup), selectedEnemy);
}

//Sensors know all your secrets. They will observe what is close to them.
function spyRoutine() {
	var sensors = enumGroup(sensorGroup);
	var artillery = enumGroup(artilleryGroup);

	if(!(sensors.length * artillery.length)) {
		return false;
	}

	for(var j = 0; j < sensors.length; ++j) {
		var object = rangeStep(startPositions[me], false);

		//Redundant stability here.
		for(var i = 0; i < artillery.length; ++i) {
			if(isDefined(sensors[j]) && isDefined(object) && isDefined(artillery[i]) && droidReady(artillery[i]) && droidCanReach(artillery[i], object.x, object.y)) {
				orderDroidObj(sensors[j], DORDER_OBSERVE, object);
				orderDroidLoc(artillery[i], DORDER_SCOUT, object.x, object.y);
			}
		}
	}
}

//Attack enemy oil when tank group is large enough.
function attackEnemyOil() {
	const MIN_ATTACK_DROIDS = 5;
	var who = chooseGroup();
	var tmp = 0;

	if(who.length < MIN_ATTACK_DROIDS) {
		return;
	}

	var derr = findEnemyDerricks();
	if(!derr.length) {
		return;
	}
	derr.sort(distanceToBase);

	for(var i = 0; i < who.length; ++i) {
		if(isDefined(who[i]) && droidReady(who[i])) {
			if(!isDefined(derr[tmp])) {
				tmp += 1;
			}
			if(isDefined(derr[tmp]) && droidCanReach(who[i], derr[tmp].x, derr[tmp].y)) {
				orderDroidLoc(who[i], DORDER_SCOUT, derr[tmp].x, derr[tmp].y);
			}
		}
	}
}

//Defend or attack.
function battleTactics() {
	const MIN_ENEMY_DROIDS = 3;
	const MIN_DERRICKS = 8;
	const MIN_ATTACK_DROIDS = 5;
	var droids = enumRange(startPositions[me].x, startPositions[me].y, 15, ENEMIES, true);
	droids.filter(function(obj) { return (obj.type === DROID) && !isVTOL(obj); });

	//Go defend the base.
	if(droids.length > MIN_ENEMY_DROIDS) {
		droids.sort(distanceToBase);
		var myDroids = enumGroup(attackGroup);
		myDroids = appendListElements(myDroids, enumGroup(cyborgGroup));
		if(myDroids.length < MIN_ATTACK_DROIDS) {
			return;
		}

		var player = droids[0].player;

		if((player < maxPlayers) && grudgeCount[player] < 50000) {
			grudgeCount[player] = grudgeCount[player] + 15;
		}

		for(var i = 0; i < myDroids.length; ++i) {
			findNearestEnemyDroid(myDroids[i], player);
		}
	}
	else {
		const ENEMY = getMostHarmfulPlayer();
		const MIN_GRUDGE = 300;
		const ENEMY_FACTORIES = returnEnemyFactories();

		if((grudgeCount[ENEMY] > MIN_GRUDGE) && ENEMY_FACTORIES) {
			attackWithGroup(chooseGroup(), ENEMY, ENEMY_FACTORIES);
		}
		else if((countStruct(structures.derricks) < MIN_DERRICKS) || (getRealPower() < -200)) {
			attackEnemyOil();
		}
		else {
			var who = chooseGroup();
			if(who.length < MIN_ATTACK_DROIDS) {
				return;
			}

			for(var i = 0; i < who.length; ++i) {
				if(isDefined(who[i]) && droidReady(who[i])) {
					findNearestEnemyStructure(who[i]);
				}
			}
		}
	}
}

//Recycle units when certain conditions are met.
function recycleObsoleteDroids() {
	var tanks = enumGroup(attackGroup);
	//var vtols = enumGroup(vtolGroup);
	var systems = enumGroup(sensorGroup);
	systems = appendListElements(systems, enumGroup(repairGroup));
	systems = appendListElements(systems, enumDroid(me, DROID_CONSTRUCT));
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
				if((tanks[i].propulsion !== "hover01")) {
					orderDroid(tanks[i], DORDER_RECYCLE);
				}
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
	const MIN_DROID_COUNT = 5;
	var derr = findEnemyDerricks(playerNumber);
	var who = chooseGroup();

	if(!derr.length || (who.length < MIN_DROID_COUNT)) {
		return false;
	}

	derr.sort(distanceToBase);

	for(var i = 0; i < who.length; ++i) {
		if(isDefined(who[i]) && droidReady(who[i]) && isDefined(derr[0])) {
			orderDroidObj(who[i], DORDER_ATTACK, derr[0]);
		}
	}
}

//Tell the repair group to go repair other droids.
function repairDamagedDroids() {
	var reps = enumGroup(repairGroup);
	if(!reps.length) {
		return;
	}

	var myDroids = appendListElements(myDroids, enumGroup(attackGroup));
	myDroids = appendListElements(myDroids, enumGroup(cyborgGroup));
	if(!myDroids.length) {
		return;
	}

	myDroids.sort(sortDroidsByHealth);

	for(var i = 0; i < reps.length; ++i) {
		for(var j = 0; j < myDroids.length; ++j) {
			if(isDefined(reps[i]) && !repairDroid(reps[i], false) && isDefined(myDroids[j]) && (Math.ceil(myDroids[j].health) < 100)) {
				orderDroidLoc(reps[i], DORDER_SCOUT, myDroids[j].x, myDroids[j].y);
				if(distBetweenTwoPoints(reps[i].x, reps[i].y, myDroids[j].x, myDroids[j].y) > 6) {
					orderDroidLoc(reps[i], DORDER_MOVE, myDroids[j].x, myDroids[j].y);
					myDroids.shift(); //remove this one from the array.
					break; //Go to next repair
				}
			}
		}
	}
}
