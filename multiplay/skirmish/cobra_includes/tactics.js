
//Droids that are attacking should not be pulled away until
//they destroy whatever thay are attacking or need repair.
function droidReady(droid)
{
	return (!repairDroid(droid, false)
		&& (droid.order !== DORDER_ATTACK)
		&& (droid.order !== DORDER_RTR)
		&& (droid.order !== DORDER_RECYCLE)
		&& vtolReady(droid) //True for non-VTOL units
	);
}

//Check if a passed in weapon name is a plasma cannon.
function isPlasmaCannon(weaponName)
{
	if (!isDefined(weaponName))
	{
		return false;
	}

	return (weaponName.name === "Laser4-PlasmaCannon");
}

//Modified from Nullbot.
//Returns true if the VTOL has ammo. False if empty.
function vtolArmed(obj, percent)
{
	for (var i = 0, p = obj.weapons.length; i < p; ++i)
	{
		if (obj.weapons[i].armed >= percent)
		{
			return true;
		}
	}

	return false;
}

//Count how many Enemy VTOL units are on the map.
function countEnemyVTOL()
{
	function uncached()
	{
		const ENEMY_PLAYERS = findLivingEnemies();
		var enemyVtolCount = 0;
		for (var x = 0, e = ENEMY_PLAYERS.length; x < e; ++x)
		{
			enemyVtolCount += enumDroid(ENEMY_PLAYERS[x]).filter(function(obj) {
				return isVTOL(obj);
			}).length;
		}

		return enemyVtolCount;
	}

	return cacheThis(uncached, []);
}

//Return the closest factory for an enemy. Undefined if none.
function returnClosestEnemyFactory(enemyNumber)
{
	if (!isDefined(enemyNumber))
	{
		enemyNumber = getMostHarmfulPlayer();
	}

	var facs = enumStruct(enemyNumber, FACTORY);
	facs = appendListElements(facs, enumStruct(enemyNumber, CYBORG_FACTORY));
	facs = appendListElements(facs, enumStruct(enemyNumber, VTOL_FACTORY));

	if (isDefined(facs[0]))
	{
		facs = facs.sort(distanceToBase);
		return facs[0];
	}

	return undefined;
}

//Return the closest enemy truck for an enemy. Undefined if none.
function getClosestEnemyTruck(enemyNumber)
{
	if (!isDefined(enemyNumber))
	{
		enemyNumber = getMostHarmfulPlayer();
	}

	var trucks = enumDroid(enemyNumber, DROID_CONSTRUCT);
	if (isDefined(trucks[0]))
	{
		trucks.sort(distanceToBase);
		return trucks[0];
	}

	return undefined;
}

//Should the vtol attack when ammo is high enough?
function vtolReady(droid)
{
	const ARMED_PERCENT = 1;
	if (!isVTOL(droid))
	{
		return true; //See droidReady(droid).
	}

	if ((droid.order === DORDER_ATTACK) || (droid.order === DORDER_REARM))
	{
		return false;
	}
	if (vtolArmed(droid, ARMED_PERCENT))
	{
		return true;
	}
	if (droid.order !== DORDER_REARM)
	{
		orderDroid(droid, DORDER_REARM);
	}

	return false;
}

//Repair a droid with the option of forcing it to.
function repairDroid(droid, force)
{
	const FORCE_REPAIR_PERCENT = 40;
	const EXPERIENCE_DIVISOR = 22;
	const HEALTH_TO_REPAIR = 58 + Math.floor(droid.experience / EXPERIENCE_DIVISOR);

	if (!isDefined(force))
	{
		force = false;
	}

	if (Math.floor(droid.health) <= FORCE_REPAIR_PERCENT)
	{
		force = true;
	}

	if ((droid.order === DORDER_RTR) && ((Math.floor(droid.health) < 100) || force))
	{
		return true;
	}

	if (countStruct(structures.extras[0]) && (force || (Math.floor(droid.health) <= HEALTH_TO_REPAIR)))
	{
		orderDroid(droid, DORDER_RTR);
		return true;
	}

	return false;
}

//choose either cyborgs or tanks.
function chooseGroup()
{
	var grp = random(2) ? enumGroup(attackGroup) : enumGroup(cyborgGroup);
	grp = grp.filter(function(dr) { return droidReady(dr); });

	return !isDefined(grp[MIN_ATTACK_DROIDS]) ? enumGroup(attackGroup) : grp;
}

//Find the derricks of all enemy players, or just a specific one.
function findEnemyDerricks(playerNumber)
{
	function uncached(playerNumber)
	{
		var derr = [];
		if (!isDefined(playerNumber))
		{
			const ENEMY_PLAYERS = findLivingEnemies();
			for (var i = 0, e = ENEMY_PLAYERS.length; i < e; ++i)
			{
				derr = appendListElements(derr, enumStruct(ENEMY_PLAYERS[i], structures.derricks));
			}

			//Include scavenger owned derricks if they exist
			if (isDefined(getScavengerNumber()) && !allianceExistsBetween(getScavengerNumber(), me))
			{
				derr = appendListElements(derr, enumStruct(getScavengerNumber(), structures.derricks));
			}
		}
		else
		{
			derr = enumStruct(playerNumber, structures.derricks);
		}

		return derr;
	}

	return cacheThis(uncached, [playerNumber], undefined, 3000);
}

//Find closest enemy droid. Returns undefined otherwise. Do not target VTOLs
//unless they are the only remaining droids.
function findNearestEnemyDroid(enemy)
{
	if (!isDefined(enemy))
	{
		enemy = getMostHarmfulPlayer();
	}

	var badDroids = enumDroid(enemy);
	if (isDefined(badDroids[0]))
	{
		var temp = badDroids.filter(function(dr) { return !isVTOL(dr); });
		if (!isDefined(temp[0]))
		{
			temp = badDroids;
		}

		temp = temp.sort(distanceToBase);
		return temp[0];
	}

	return undefined;
}

//Return the closest structure of an enemy. Returns undefined otherwise.
function findNearestEnemyStructure(enemy)
{
	if (!isDefined(enemy))
	{
		enemy = getMostHarmfulPlayer();
	}

	var s = enumStruct(enemy).filter(function(obj) { return (obj.stattype !== WALL); });
	if (!isDefined(s[0]))
	{
		s = enumStruct(enemy);
	}

	if (isDefined(s[0]))
	{
		s = s.sort(distanceToBase);
		return s[0];
	}

	return undefined;
}

//Attack something.
function attackWithGroup(enemy, targets)
{
	const DROIDS = chooseGroup();
	const LEN = DROIDS.length;

	if (!isDefined(enemy))
	{
		enemy = getMostHarmfulPlayer();
	}

	if (LEN >= MIN_ATTACK_DROIDS)
	{
		var target;
		if (isDefined(targets) && isDefined(targets[0]))
		{
			targets = targets.sort(distanceToBase);
			target = targets[0];
		}
		else
		{
			target = getCloseEnemyObject();
		}

		for (var j = 0; j < LEN; j++)
		{
			attackThisObject(DROIDS[j], target);
		}
	}
}

//Mark a target for death.
function chatTactic(enemy)
{
	if (!isDefined(enemy))
	{
		enemy = getMostHarmfulPlayer();
	}

	const MSG = lastMsg.slice(0, -1);
	if ((MSG !== "target") && (playerAlliance(true).length))
	{
		sendChatMessage("target" + enemy, ALLIES);
	}
}

//attacker is a player number. Attack a specific player.
function attackStuff(attacker)
{
	if (restraint())
	{
		return;
	}

	var selectedEnemy = getMostHarmfulPlayer();
	if (isDefined(attacker) && !allianceExistsBetween(attacker, me) && (attacker !== me))
	{
		selectedEnemy = attacker;
	}

	chatTactic(selectedEnemy);
	attackWithGroup(selectedEnemy);
}

//Sensors know all your secrets. They will observe what is closest to Cobra base.
function artilleryTacticsCobra()
{
	if (restraint())
	{
		return;
	}

	var sensors = enumGroup(sensorGroup).filter(function(dr)
	{
		return droidReady(dr);
	});
	const ARTILLERY_UNITS = enumGroup(artilleryGroup);
	const ARTI_LEN = ARTILLERY_UNITS.length;
	const SENS_LEN = sensors.length;

	if (SENS_LEN * ARTI_LEN)
	{
		sensors = sortAndReverseDistance(sensors);
		var obj = rangeStep();

		if (isDefined(obj))
		{
			orderDroidObj(sensors[0], DORDER_OBSERVE, obj);
			for (var i = 0; i < ARTI_LEN; ++i)
			{
				attackThisObject(ARTILLERY_UNITS[i], obj);
			}
		}
	}
}

//Attack enemy oil when if attacking group is large enough.
function attackEnemyOil()
{
	const WHO = chooseGroup();
	const LEN = WHO.length;

	if (LEN >= MIN_ATTACK_DROIDS)
	{
		var derr = findEnemyDerricks();
		if (isDefined(derr[0]))
		{
			derr = derr.sort(distanceToBase);
			for (var i = 0; i < LEN; ++i)
			{
				attackThisObject(WHO[i], derr[0]);
			}
		}
	}
}

//Defend or attack.
function battleTacticsCobra()
{
	if (restraint())
	{
		return;
	}

	const MIN_DERRICKS = averageOilPerPlayer();
	const ENEMY = getMostHarmfulPlayer();
	const MIN_GRUDGE = 300;
	donateSomePower();

	if ((countStruct(structures.derricks) < MIN_DERRICKS) || (getRealPower() < -50))
	{
		attackEnemyOil();
	}
	else if (grudgeCount[ENEMY] > MIN_GRUDGE)
	{
		const ENEMY_FACTORY = returnClosestEnemyFactory();
		if (random(101) < 5)
		{
			chatTactic(ENEMY); //Tell players to attack this enemy.
		}

		if (isDefined(ENEMY_FACTORY))
		{
			attackWithGroup(ENEMY, ENEMY_FACTORY);
		}
		else
		{
			const ENEMY_TRUCK = getClosestEnemyTruck();
			if (isDefined(ENEMY_TRUCK))
			{
				attackWithGroup(ENEMY, ENEMY_TRUCK);
			}
			else
			{
				grudgeCount[ENEMY] = 0; //they dead.
			}
		}
	}
	else
	{
		const WHO = chooseGroup();
		const LEN = WHO.length;
		if (LEN >= MIN_ATTACK_DROIDS)
		{
			var nearestTarget = getCloseEnemyObject();
			for (var i = 0; i < LEN; ++i)
			{
				attackThisObject(WHO[i], nearestTarget);
			}
		}
	}
}

//Recycle units when certain conditions are met.
function recycleForHoverCobra()
{
	const MIN_FACTORY = 1;
	var systems = enumDroid(me).filter(function(dr) { return isConstruct(dr); });
	systems = appendListElements(systems, enumDroid(me, DROID_SENSOR));
	systems = appendListElements(systems, enumDroid(me, DROID_REPAIR));
	systems = systems.filter(function(dr) { return (dr.propulsion !== "hover01"); });
	var unfinished = unfinishedStructures();
	const NON_HOVER_SYSTEMS = systems.length;

	if ((countStruct(FACTORY) > MIN_FACTORY) && componentAvailable("hover01"))
	{
		if (!isDefined(unfinished[0]) && NON_HOVER_SYSTEMS)
		{
			for (var i = 0; i < NON_HOVER_SYSTEMS; ++i)
			{
				orderDroid(systems[i], DORDER_RECYCLE);
			}
		}

		if (!forceHover && !NON_HOVER_SYSTEMS)
		{
			removeThisTimer("recycleForHoverCobra");
		}

		if (forceHover)
		{
			var tanks = enumGroup(attackGroup).filter(function(dr) { return (dr.droidType === DROID_WEAPON && dr.propulsion !== "hover01"); });
			const NON_HOVER_TANKS = tanks.length;
			for (var j = 0; j < NON_HOVER_TANKS; ++j)
			{
				orderDroid(tanks[j], DORDER_RECYCLE);
			}

			if (!(NON_HOVER_TANKS + NON_HOVER_SYSTEMS))
			{
				removeThisTimer("recycleForHoverCobra");
			}
		}
	}
}

//Tell the repair group to go repair other droids.
function repairDroidTacticsCobra()
{
	var reps = enumGroup(repairGroup);
	const LEN = reps.length;

	if (LEN)
	{
		var myDroids = random(2) ? enumGroup(attackGroup) : enumGroup(cyborgGroup);

		if (isDefined(myDroids[0]))
		{
			myDroids = myDroids.sort(sortDroidsByHealth);
			var weakest = myDroids[0];
			var dorder_droidrepair = 26; //FIXME: when DORDER_DROIDREPAIR can be called, remove this.

			for (var i = 0; i < LEN; ++i)
			{
				const REPAIR_UNIT = reps[i];
				if (isDefined(REPAIR_UNIT) && (REPAIR_UNIT.order !== dorder_droidrepair) && isDefined(weakest) && (Math.ceil(weakest.health) < 100))
				{
					orderDroidLoc(weakest, DORDER_MOVE, REPAIR_UNIT.x, REPAIR_UNIT.y);
					orderDroidObj(REPAIR_UNIT, dorder_droidrepair, weakest);
				}
			}
		}
	}
}

// Make Cobra focus on this player if asked. Chat command only.
function targetPlayer(playerNumber)
{
	const INC = 100;
	const PREVIOUS_TARGET = getMostHarmfulPlayer();

	if (playerNumber !== PREVIOUS_TARGET)
	{
		if ((grudgeCount[playerNumber] + INC) < MAX_GRUDGE)
		{
			grudgeCount[playerNumber] = grudgeCount[PREVIOUS_TARGET] + INC;
		}
	}
}

//VTOL units do there own form of tactics.
function vtolTacticsCobra()
{
	if (restraint())
	{
		return;
	}

	const MIN_VTOLS = 5;
	var vtols = enumGroup(vtolGroup).filter(function(dr) { return droidReady(dr); });
	const LEN = vtols.length;

	if (LEN >= MIN_VTOLS)
	{
		var target = getCloseEnemyObject();
		for (var i = 0; i < LEN; ++i)
		{
			attackThisObject(vtols[i], target);
		}
	}
}

//Decide how to attack this target.
function attackThisObject(droid, target)
{
	if (!isDefined(droid.weapons[0]))
	{
		return;
	}

	if (!isDefined(target))
	{
		target = getCloseEnemyObject();
	}

	if (isDefined(droid) && droidReady(droid) && isDefined(target) && droidCanReach(droid, target.x, target.y))
	{
		if (!((target.type === DROID) && isVTOL(target) && (isVTOL(droid) && !droid.weapons[0].canHitAir)))
		{
			if (!isPlasmaCannon(droid.weapons[0].name) && (target.type === DROID))
			{
				orderDroidLoc(droid, DORDER_SCOUT, target.x, target.y);
			}
			else
			{
				orderDroidObj(droid, DORDER_ATTACK, target);
			}
		}
	}
}

//Return the closest enemy player structure or droid. Undefined if none.
function getCloseEnemyObject(enemy)
{
	if (!isDefined(enemy))
	{
		enemy = getMostHarmfulPlayer();
	}

	var target = findNearestEnemyStructure(enemy);
	if (!isDefined(target))
	{
		target = findNearestEnemyDroid(enemy);
		if (!isDefined(target))
		{
			return undefined;
		}
	}

	return target;
}

//Check if enemy units are in or around Cobra base.
function enemyUnitsInBase()
{
	var enemyUnits = enumRange(MY_BASE.x, MY_BASE.y, 16, ENEMIES, true).filter(function(dr) {
		return (dr.type === DROID && dr.droidType === DROID_WEAPON);
	});

	var enemyNearBase = isDefined(enemyUnits[0]);

	//The attack code automatically chooses the closest object of the
	//most harmful player anyway so this should suffice for defense.
	if (enemyNearBase)
	{
		targetPlayer(enemyUnits[0].player); //play rough.
	}

	return enemyNearBase;
}

//Stop all attacker droids from attacking. Repairs are initiated in addition to that.
function haltAttackDroids()
{
	const DROIDS = enumDroid(me).filter(function(dr) {
		return ((dr.droidType !== DROID_CONSTRUCT) && (dr.droidType !== DROID_REPAIR));
	});

	for (var i = 0, l = DROIDS.length; i < l; ++i)
	{
		const DROID = DROIDS[i];
		orderDroid(DROID, DORDER_STOP);
		repairDroid(DROID, false);
	}
}

//Donate my power to allies if I have too much.
function donateSomePower()
{
	const ALLY_PLAYERS = playerAlliance(true);
	const LEN = ALLY_PLAYERS.length;
	const ALIVE_ENEMIES = findLivingEnemies().length;

	if (LEN && ALIVE_ENEMIES && (getRealPower() > 3000))
	{
		donatePower(playerPower(me) / 2, ALLY_PLAYERS[random(LEN)]);
	}
}
