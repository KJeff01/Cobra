
//Droids that are attacking should not be pulled away until
//they destroy whatever thay are attacking or need repair.
function droidReady(droid) {
	return (!repairDroid(droid, false)
		&& (droid.order !== DORDER_ATTACK)
		&& (droid.order !== DORDER_RTR)
		&& (droid.order !== DORDER_RECYCLE)
		&& vtolReady(droid) //True for non-VTOL units
	);
}

function isPlasmaCannon(droid) {
	return droid.weapons[0].name === "Laser4-PlasmaCannon";
}

//Modified from Nullbot.
//Returns true if the VTOL has ammo. False if empty.
function vtolArmed(obj, percent) {
	if (obj.type !== DROID) {
		return;
	}

	if (!isVTOL(obj)) {
		return false;
	}

	for (var i = 0, p = obj.weapons.length; i < p; ++i) {
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
	var tanks  = enumGroup(attackGroup);
	var borgs = enumGroup(cyborgGroup);
	var vtols = enumGroup(vtolGroup);
	var cacheVtols = vtols.length;

	//return our vtols to the pads if needed.
	for(var i = 0; i < cacheVtols; ++i) {
		vtolReady(vtols[i]);
	}

	if((borgs.length > MIN_ATTACK_DROIDS) && random(2)) {
		return borgs;
	}
	else if(tanks.length > MIN_ATTACK_DROIDS && random(2)) {
		return tanks;
	}
	else if(cacheVtols > MIN_ATTACK_DROIDS && random(2)) {
		return vtols;
	}

	return tanks; //Fallback.
}

//Find the derricks of all enemy players, or just a specific one.
function findEnemyDerricks(playerNumber) {
	var derr = [];

	if(!isDefined(playerNumber)) {
		var enemies = findLivingEnemies();

		for(var i = 0, e = enemies.length; i < e; ++i) {
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

function findNearestEnemyDroid(droid, enemy) {
	if(!isDefined(enemy)) {
		enemy = getMostHarmfulPlayer();
	}

	var badDroids = enumDroid(enemy);
	if(badDroids.length) {
		badDroids.sort(distanceToBase);
		if(droidReady(droid) && isDefined(badDroids[0]) && droidCanReach(droid, badDroids[0].x, badDroids[0].y)) {
			if(!isPlasmaCannon(droid)) {
				orderDroidLoc(droid, DORDER_SCOUT, badDroids[0].x, badDroids[0].y);
			}
			else {
				orderDroidObj(droid, DORDER_ATTACK, badDroids[0]);
			}
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
		var target = s[0];

		if(droidReady(droid) && isDefined(target) && droidCanReach(droid, target.x, target.y)) {
			orderDroidObj(droid, DORDER_ATTACK, target);
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

	var cacheDroids = droids.length;
	if(cacheDroids < MIN_ATTACK_DROIDS) {
		return false;
	}

	var target;
	if(isDefined(targets) && targets.length) {
		targets.sort(distanceToBase);
		target = targets[0];
	}

	for (var j = 0; j < cacheDroids; j++) {
		if(isDefined(droids[j]) && droidReady(droids[j])) {
			if(isDefined(target) && droidCanReach(droids[j], target.x, target.y)) {
				if(!isPlasmaCannon(droids[j]) && (target.type !== STRUCTURE)) {
					orderDroidLoc(droids[j], DORDER_SCOUT, target.x, target.y);
				}
				else {
					orderDroidObj(droids[j], DORDER_ATTACK, target);
				}
			}
			else {
				findNearestEnemyStructure(droids[j], enemy);
			}
		}
	}
}

//returns undefined for tactics that allow 'me' to attack something other than derricks.
function chatTactic(enemy) {
	const MIN_DERRICKS = averageOilPerPlayer();
	var str = lastMsg.slice(0, -1);
	var code;

	if((str !== "attack") && (str !== "oil")) {
		if((countStruct(structures.derricks) > MIN_DERRICKS) && (enumDroid(me) > MIN_ATTACK_DROIDS)) {
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
	var cacheArti = artillery.length;
	var cacheSensors = sensors.length;

	if(!(cacheSensors * cacheArti)) {
		return false;
	}

	sensors = sortAndReverseDistance(sensors);
	var enemies = findLivingEnemies();
	var target;
	var objects = [];

	for(var i = 0, e = enemies.length; i < e; ++i) {
		var obj = rangeStep(enemies[i]);
		if(isDefined(obj)) {
			objects.push(obj);
		}
	}

	if(!objects.length) {
		return;
	}
	else {
		objects.sort(distanceToBase);
		target = objects[0];
	}

	if(!isDefined(target)) {
		return;
	}

	orderDroidObj(sensors[0], DORDER_OBSERVE, target);

	//Redundant stability here.
	for(var i = 0; i < cacheArti; ++i) {
		if(isDefined(target) && isDefined(artillery[i]) && droidReady(artillery[i]) && droidCanReach(artillery[i], target.x, target.y)) {
			orderDroidObj(artillery[i], DORDER_ATTACK, target);
		}
	}
}

//Attack enemy oil when tank group is large enough.
function attackEnemyOil() {
	var who = chooseGroup();
	var cacheWho = who.length;
	var tmp = 0;

	if(cacheWho < MIN_ATTACK_DROIDS) {
		return;
	}

	var derr = findEnemyDerricks();
	if(!derr.length) {
		return;
	}
	derr.sort(distanceToBase);

	for(var i = 0; i < cacheWho; ++i) {
		if(isDefined(who[i]) && droidReady(who[i])) {
			if(!isDefined(derr[tmp])) {
				tmp += 1;
			}
			if(isDefined(derr[tmp]) && droidCanReach(who[i], derr[tmp].x, derr[tmp].y)) {
				if(!isPlasmaCannon(who[i])) {
					orderDroidLoc(who[i], DORDER_SCOUT, derr[tmp].x, derr[tmp].y);
				}
				else {
					orderDroidObj(who[i], DORDER_ATTACK, derr[tmp]);
				}
			}
		}
	}
}

//Defend or attack.
function battleTactics() {
	const MIN_DERRICKS = averageOilPerPlayer();
	const ENEMY = getMostHarmfulPlayer();
	const MIN_GRUDGE = 300;

	if((countStruct(structures.derricks) < MIN_DERRICKS) || (getRealPower() < -200)) {
		attackEnemyOil();
	}
	else if(grudgeCount[ENEMY] > MIN_GRUDGE) {
		const ENEMY_FACTORIES = returnEnemyFactories();
		if(ENEMY_FACTORIES.length) {
			attackWithGroup(chooseGroup(), ENEMY, ENEMY_FACTORIES);
		}
		else {
			grudgeCount[ENEMY] = 0; //they dead.
		}
	}
	else {
		var who = chooseGroup();
		var cacheWho = who.length;

		if(cacheWho < MIN_ATTACK_DROIDS) {
			return;
		}

		for(var i = 0; i < cacheWho; ++i) {
			if(isDefined(who[i]) && droidReady(who[i])) {
				findNearestEnemyStructure(who[i], ENEMY);
			}
		}
	}
}

//Recycle units when certain conditions are met.
function recycleDroidsForHover() {
	const MIN_FACTORY = 1;
	var systems = enumDroid(me, DROID_CONSTRUCT);
	systems = appendListElements(systems, enumDroid(me, DROID_SENSOR));
	systems = appendListElements(systems, enumDroid(me, DROID_REPAIR));
	systems.filter(function(dr) { return (dr.propulsion !== "hover01"); });
	var unfinished = unfinishedStructures();
	const NON_HOVER_SYSTEMS = systems.length;

	if((countStruct(structures.factories) > MIN_FACTORY) && componentAvailable("hover01")) {
		if(!unfinished.length && NON_HOVER_SYSTEMS) {
			for(var i = 0; i < NON_HOVER_SYSTEMS; ++i) {
				orderDroid(systems[i], DORDER_RECYCLE);
			}
		}

		if(!forceHover && !NON_HOVER_SYSTEMS) {
			removeThisTimer("recycleDroidsForHover");
		}

		if(forceHover) {
			var tanks = enumGroup(attackGroup).filter(function(dr) { return (dr.droidType === DROID_WEAPON && dr.propulsion !== "hover01"); });
			const NON_HOVER_TANKS = tanks.length;

			for(var j = 0; j < NON_HOVER_TANKS; ++j) {
				orderDroid(tanks[j], DORDER_RECYCLE);
			}

			if(!(NON_HOVER_TANKS + NON_HOVER_SYSTEMS)) {
				removeThisTimer("recycleDroidsForHover");
			}
		}
	}
}

//Attack oil specifically if a player requests it.
function chatAttackOil(playerNumber) {
	var derr = findEnemyDerricks(playerNumber);
	var who = chooseGroup();
	var cacheWho = who.length;

	if(!derr.length || (cacheWho < MIN_ATTACK_DROIDS)) {
		return false;
	}

	derr.sort(distanceToBase);

	for(var i = 0; i < cacheWho; ++i) {
		if(isDefined(who[i]) && droidReady(who[i]) && isDefined(derr[0])) {
			orderDroidObj(who[i], DORDER_ATTACK, derr[0]);
		}
	}
}

//Tell the repair group to go repair other droids.
function repairDamagedDroids() {
	var reps = enumGroup(repairGroup);
	var cacheRepair = reps.length;

	if(!cacheRepair) {
		return;
	}

	var myDroids = appendListElements(myDroids, enumGroup(attackGroup));
	myDroids = appendListElements(myDroids, enumGroup(cyborgGroup));
	var cacheMyDroids = myDroids.length;

	if(!cacheMyDroids) {
		return;
	}

	myDroids.sort(sortDroidsByHealth);

	for(var i = 0; i < cacheRepair; ++i) {
		for(var j = 0; j < cacheMyDroids; ++j) {
			if(isDefined(reps[i]) && !repairDroid(reps[i], false) && isDefined(myDroids[j]) && (Math.ceil(myDroids[j].health) < 100)) {
				orderDroidLoc(reps[i], DORDER_SCOUT, myDroids[j].x, myDroids[j].y);
				if(distBetweenTwoPoints(reps[i].x, reps[i].y, myDroids[j].x, myDroids[j].y) > 6) {
					orderDroidLoc(reps[i], DORDER_MOVE, myDroids[j].x, myDroids[j].y);
					break; //Go to next repair
				}
			}
		}
	}
}

// Make Cobra focus on this player if asked. Chat command only.
function targetPlayer(playerNumber) {
	const INC = 50;
	var prev = getMostHarmfulPlayer();

	if(playerNumber === prev) {
		return;
	}

	if((grudgeCount[playerNumber] + INC) < MIN_GRUDGE) {
		grudgeCount[playerNumber] = grudgeCount[prev] + INC;
	}
}
