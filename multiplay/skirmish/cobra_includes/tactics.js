
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

//Check if this droid has a plasma cannon primary.
function isPlasmaCannon(droid) {
	if(!isDefined(droid.weapons[0])) {
		return false;
	}

	return droid.weapons[0].name === "Laser4-PlasmaCannon";
}

//Modified from Nullbot.
//Returns true if the VTOL has ammo. False if empty.
function vtolArmed(obj, percent) {
	for (var i = 0, p = obj.weapons.length; i < p; ++i) {
		if (obj.weapons[i].armed >= percent) {
			return true;
		}
	}

	return false;
}

//Return the closest factory for an enemy. Undefined if none.
function returnClosestEnemyFactory(enemyNumber) {
	if(!isDefined(enemyNumber)) {
		enemyNumber = getMostHarmfulPlayer();
	}

	var target;
	var facs = enumStruct(enemyNumber, FACTORY);
	facs = appendListElements(facs, enumStruct(enemyNumber, CYBORG_FACTORY));
	facs = appendListElements(facs, enumStruct(enemyNumber, VTOL_FACTORY));

	if(isDefined(facs[0])) {
		facs = facs.sort(distanceToBase);
		target = facs[0];
	}

	return target;
}

//Return the closest enemy truck for an enemy. Undefined if none.
function getClosestEnemyTruck(enemyNumber) {
	if(!isDefined(enemyNumber)) {
		enemyNumber = getMostHarmfulPlayer();
	}

	var target;
	var trucks = enumDroid(enemyNumber, DROID_CONSTRUCT);

	if(isDefined(trucks[0])) {
		trucks.sort(distanceToBase);
		target = trucks[0];
	}

	return target;
}

//Should the vtol attack when ammo is high enough?
function vtolReady(droid) {
	if(!isVTOL(droid)) {
		return true; //See droidReady(droid).
	}

	const ARMED_PERCENT = 1;

	if ((droid.order === DORDER_ATTACK) || (droid.order === DORDER_REARM)) {
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

//choose either cyborgs or tanks.
function chooseGroup() {
	var tanks = enumGroup(attackGroup);
	var borgs = enumGroup(cyborgGroup);

	if(isDefined(borgs[MIN_ATTACK_DROIDS]) && random(2)) {
		return borgs;
	}
	else if(isDefined(tanks[MIN_ATTACK_DROIDS]) && random(2)) {
		return tanks;
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

//Find closest enemy droid. Returns undefined otherwise. Do not target VTOLs
//unless they are the only remaining droids.
function findNearestEnemyDroid(enemy) {
	if(!isDefined(enemy)) {
		enemy = getMostHarmfulPlayer();
	}

	var badDroids = enumDroid(enemy);
	var undef;

	if(isDefined(badDroids[0])) {
		var temp = badDroids.filter(function(dr) { return !isVTOL(dr); });

		if(!isDefined(temp[0])) {
			temp = badDroids;
		}

		temp = temp.sort(distanceToBase);
		return temp[0];
	}

	return undef;
}

//Return the closest structure of an enemy. Returns undefined otherwise.
function findNearestEnemyStructure(enemy) {
	if(!isDefined(enemy)) {
		enemy = getMostHarmfulPlayer();
	}

	var undef;
	var s = enumStruct(enemy).filter(function(obj) { return (obj.stattype !== WALL); });
	if(!isDefined(s[0])) {
		s = enumStruct(enemy);
	}

	if(isDefined(s[0])) {
		s = s.sort(distanceToBase);
		return s[0];
	}

	return undef;
}

//Attack something.
function attackWithGroup(enemy, targets) {
	var droids = chooseGroup();
	var cacheDroids = droids.length;

	if(!isDefined(enemy)) {
		enemy = getMostHarmfulPlayer();
	}

	if(cacheDroids >= MIN_ATTACK_DROIDS) {
		var target;

		if(isDefined(targets) && isDefined(targets[0])) {
			targets = targets.sort(distanceToBase);
			target = targets[0];
		}
		else {
			target = getCloseEnemyObject();
		}

		for (var j = 0; j < cacheDroids; j++) {
			attackThisObject(droids[j], target);
		}
	}
}

//returns false for tactics that allow 'me' to attack something other than derricks.
function chatTactic(enemy) {
	if(!isDefined(enemy)) {
		enemy = getMostHarmfulPlayer();
	}

	const MIN_DERRICKS = averageOilPerPlayer();
	var str = lastMsg.slice(0, -1);
	var code = false;

	if((str !== "attack") && (str !== "oil")) {
		if(countStruct(structures.derricks) > MIN_DERRICKS) {
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
	if(peacefulTime) {
		return;
	}

	var selectedEnemy = getMostHarmfulPlayer();

	if(isDefined(attacker) && !allianceExistsBetween(attacker, me) && (attacker !== me)) {
		selectedEnemy = attacker;
	}

	if(!chatTactic(selectedEnemy)) {
		attackWithGroup(selectedEnemy);
	}
}

//Sensors know all your secrets. They will observe what is closest to Cobra base.
function spyRoutine() {
	if(peacefulTime) {
		return;
	}

	var sensors = enumGroup(sensorGroup);
	var artillery = enumGroup(artilleryGroup);
	var cacheArti = artillery.length;
	var cacheSensors = sensors.length;

	if(cacheSensors * cacheArti) {
		sensors = sortAndReverseDistance(sensors);
		var enemies = findLivingEnemies();
		var obj = rangeStep();

		if(isDefined(obj)) {
			orderDroidObj(sensors[0], DORDER_OBSERVE, obj);
			for(var i = 0; i < cacheArti; ++i) {
				attackThisObject(artillery[i], obj);
			}
		}
	}
}

//Attack enemy oil when if attacking group is large enough.
function attackEnemyOil() {
	var who = chooseGroup();
	var cacheWho = who.length;
	var tmp = 0;

	if(cacheWho >= MIN_ATTACK_DROIDS) {
		var derr = findEnemyDerricks();

		if(isDefined(derr[0])) {
			derr = derr.sort(distanceToBase);

			for(var i = 0; i < cacheWho; ++i) {
				attackThisObject(who[i], derr[0]);
			}
		}
	}
}

//Defend or attack.
function battleTactics() {
	if(peacefulTime) {
		return;
	}

	const MIN_DERRICKS = averageOilPerPlayer();
	const ENEMY = getMostHarmfulPlayer();
	const MIN_GRUDGE = 300;

	if((countStruct(structures.derricks) < MIN_DERRICKS) || (getRealPower() < -200)) {
		attackEnemyOil();
	}
	else if(grudgeCount[ENEMY] > MIN_GRUDGE) {
		const ENEMY_FACTORY = returnClosestEnemyFactory();

		if(random(101) < 5) {
			chatTactic(ENEMY); //Tell players to attack this enemy.
		}

		if(isDefined(ENEMY_FACTORY)) {
			attackWithGroup(ENEMY, ENEMY_FACTORY);
		}
		else {
			const ENEMY_TRUCK = getClosestEnemyTruck(ENEMY);
			if(isDefined(ENEMY_TRUCK)) {
				attackWithGroup(ENEMY, ENEMY_TRUCK);
			}
			else {
				grudgeCount[ENEMY] = 0; //they dead.
			}
		}
	}
	else {
		var who = chooseGroup();
		var cacheWho = who.length;

		if(cacheWho >= MIN_ATTACK_DROIDS) {
			var nearestTarget = getCloseEnemyObject(ENEMY);
			for(var i = 0; i < cacheWho; ++i) {
				attackThisObject(who[i], nearestTarget);
			}
		}
	}
}

//Recycle units when certain conditions are met.
function recycleDroidsForHover() {
	const MIN_FACTORY = 1;
	var systems = enumDroid(me).filter(function(dr) { return isConstruct(dr); });
	systems = appendListElements(systems, enumDroid(me, DROID_SENSOR));
	systems = appendListElements(systems, enumDroid(me, DROID_REPAIR));
	systems = systems.filter(function(dr) { return (dr.propulsion !== "hover01"); });
	var unfinished = unfinishedStructures();
	const NON_HOVER_SYSTEMS = systems.length;

	if((countStruct(FACTORY) > MIN_FACTORY) && componentAvailable("hover01")) {
		if(!isDefined(unfinished[0]) && NON_HOVER_SYSTEMS) {
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

	if(isDefined(derr[0]) && (cacheWho >= MIN_ATTACK_DROIDS)) {
		derr = derr.sort(distanceToBase);
		for(var i = 0; i < cacheWho; ++i) {
			attackThisObject(who[i], derr[0]);
		}
	}
}

//Tell the repair group to go repair other droids.
function repairDamagedDroids() {
	var reps = enumGroup(repairGroup);
	var cacheRepair = reps.length;

	if(cacheRepair) {
		var myDroids = appendListElements(myDroids, enumGroup(attackGroup));
		myDroids = appendListElements(myDroids, enumGroup(cyborgGroup));

		if(isDefined(myDroids[0])) {
			myDroids = myDroids.sort(sortDroidsByHealth);
			var weakest = myDroids[0];
			var dorder_droidrepair = 26; //FIXME: when DORDER_DROIDREPAIR can be called, remove this.

			for(var i = 0; i < cacheRepair; ++i) {
				if(isDefined(reps[i]) && (reps[i].order !== dorder_droidrepair) && isDefined(weakest) && (Math.ceil(weakest.health) < 100)) {
					orderDroidLoc(weakest, DORDER_MOVE, reps[i].x, reps[i].y);
					orderDroidObj(reps[i], dorder_droidrepair, weakest);
				}
			}
		}
	}
}

// Make Cobra focus on this player if asked. Chat command only.
function targetPlayer(playerNumber) {
	const INC = 100;
	var prev = getMostHarmfulPlayer();

	if(playerNumber !== prev) {
		if((grudgeCount[playerNumber] + INC) < MAX_GRUDGE) {
			grudgeCount[playerNumber] = grudgeCount[prev] + INC;
		}
	}
}

//VTOL units do there own form of tactics.
//DORDER_CIRCLE = 36.
function vtolTactics() {
	if(peacefulTime) {
		return;
	}

	const MIN_VTOLS = 5;
	var vtols = enumGroup(vtolGroup);
	var cacheVtols = vtols.length;

	if(cacheVtols >= MIN_VTOLS) {
		var target = getCloseEnemyObject(getMostHarmfulPlayer());
		for(var i = 0; i < cacheVtols; ++i) {
			attackThisObject(vtols[i], target);
		}
	}
}

//Decide how to attack this target.
function attackThisObject(droid, target) {
	if(!isDefined(droid.weapons[0])) {
		return;
	}

	if(!isDefined(target)) {
		target = getCloseEnemyObject();
	}

	if(isDefined(droid) && isDefined(target) && droidReady(droid) && droidCanReach(droid, target.x, target.y)) {
		if(!((target.type === DROID) && isVTOL(target) && (isVTOL(droid) && !droid.weapons[0].canHitAir))) {
			if(!isPlasmaCannon(droid) && (target.type === DROID)) {
				orderDroidLoc(droid, DORDER_SCOUT, target.x, target.y);
			}
			else {
				orderDroidObj(droid, DORDER_ATTACK, target);
			}
		}
	}
}

//Return the closest enemy player structure or droid. Undefined if none.
function getCloseEnemyObject(enemy) {
	if(!isDefined(enemy)) {
		enemy = getMostHarmfulPlayer();
	}
	var target = findNearestEnemyStructure(enemy);
	var undef;

	if(!isDefined(target)) {
		target = findNearestEnemyDroid(enemy);

		if(!isDefined(target)) {
			return undef;
		}
	}

	return target;
}

//Check if enemy units are in or around Cobra base.
function enemyUnitsInBase() {
	var enemyUnits = enumRange(startPositions[me].x, startPositions[me].y, 16, ENEMIES, true).filter(function(dr) {
		return (dr.type === DROID && dr.droidType === DROID_WEAPON);
	});

	return isDefined(enemyUnits[0]);
}
