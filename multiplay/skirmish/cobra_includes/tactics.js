
//Droids that are attacking should not be pulled away until
//they destroy whatever thay are attacking or need repair.
function droidReady(droid)
{
	return (!repairDroid(droid, false)
		&& droid.order !== DORDER_ATTACK
		&& droid.order !== DORDER_RTR
		&& droid.order !== DORDER_RECYCLE
		&& vtolReady(droid) //True for non-VTOL units
	);
}

//Check if a passed in weapon name is a plasma cannon.
function isPlasmaCannon(weaponName)
{
	return isDefined(weaponName) && (weaponName.name === "Laser4-PlasmaCannon");
}

//Modified from Nullbot.
//Returns true if the VTOL has ammo. False if empty.
function vtolArmed(obj, percent)
{
	return obj.weapons[0].armed >= percent;
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

//Return information about the closest factory for an enemy. Undefined if none.
function returnClosestEnemyFactory(enemyNumber)
{
	function uncached(enemyNumber)
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
			return objectInformation(facs[0]);
		}

		return undefined;
	}

	return cacheThis(uncached, [enemyNumber]);
}

//Return information about the closest enemy truck for an enemy. Undefined if none.
function getClosestEnemyTruck(enemyNumber)
{
	function uncached(enemyNumber)
	{
		if (!isDefined(enemyNumber))
		{
			enemyNumber = getMostHarmfulPlayer();
		}

		var trucks = enumDroid(enemyNumber, DROID_CONSTRUCT);
		if (isDefined(trucks[0]))
		{
			trucks.sort(distanceToBase);
			return objectInformation(trucks[0]);
		}

		return undefined;
	}

	return cacheThis(uncached, [enemyNumber]);
}

//Should the vtol attack when ammo is high enough?
function vtolReady(droid)
{
	if (!isVTOL(droid))
	{
		return true; //See droidReady(droid).
	}

	const ARMED_PERCENT = 1;
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
	const FORCE_REPAIR_PERCENT = 48;
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

//Continuously check a random ground group for repair
function checkAllForRepair()
{
	if (!countStruct(structures.extras[0]))
	{
		return;
	}

	var droids = enumGroup(attackGroup);
	for (var i = 0, l = droids.length; i < l; ++i)
	{
		var droid = droids[i];
		repairDroid(droid, Math.floor(droid.health) < 48);
	}
}

//choose land attackers.
function chooseGroup()
{
	return enumGroup(attackGroup).filter(function(dr) { return droidReady(dr); });
}

//Find the closest enemy derrick information. If no player is defined, then all of them are checked.
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

		derrs = derrs.sort(distanceToBase);
		if (isDefined(derrs[0]))
		{
			return objectInformation(derrs[0]);
		}

		return undefined;
	}

	return cacheThis(uncached, [playerNumber]);
}

//Find information about the closest enemy droid. Returns undefined otherwise. Do not target VTOLs
//unless they are the only remaining droids.
function findNearestEnemyDroid(enemy)
{
	function uncached(enemy)
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
			return objectInformation(temp[0]);
		}

		return undefined;
	}

	return cacheThis(uncached, [enemy], enemy, 16000);
}

//Return information about the closest structure of an enemy. Returns undefined otherwise.
function findNearestEnemyStructure(enemy)
{
	function uncached(enemy)
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
			return objectInformation(s[0]);
		}

		return undefined;
	}

	return cacheThis(uncached, [enemy], enemy, 16000);
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
			target = rangeStep();
			if (isDefined(target))
			{
				target = getObject(target.typeInfo, target.playerInfo, target.idInfo);
			}
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
	if (!shouldCobraAttack() || stopExecution("attackStuff", 5000))
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
	if (!shouldCobraAttack())
	{
		return;
	}
	var sensors = enumGroup(sensorGroup).filter(function(dr) {
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
			obj = getObject(obj.typeInfo, obj.playerInfo, obj.idInfo);
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
		derr = getObject(derr.typeInfo, derr.playerInfo, derr.idInfo);
		if (isDefined(derr))
		{
			for (var i = 0; i < LEN; ++i)
			{
				attackThisObject(WHO[i], derr);
			}
		}
	}
}

//Defend or attack.
function battleTacticsCobra()
{
	const ENEMY = getMostHarmfulPlayer();
	donateSomePower();
	enemyUnitsInBase()

	if (shouldCobraAttack())
	{
		var target = rangeStep();
		if (isDefined(target))
		{
			target = getObject(target.typeInfo, target.playerInfo, target.idInfo);
			const WHO = chooseGroup();
			for (var i = 0, l = WHO.length; i < l; ++i)
			{
				attackThisObject(WHO[i], target);
			}
		}
	}
}

//Recycle units when certain conditions are met.
function recycleForHoverCobra()
{
	const MIN_FACTORY = 1;
	var systems = enumDroid(me).filter(function(dr) {
		return isConstruct(dr);
	});
	systems = appendListElements(systems, enumDroid(me, DROID_SENSOR));
	systems = appendListElements(systems, enumDroid(me, DROID_REPAIR));
	systems = systems.filter(function(dr) {
		return (dr.body !== "CyborgLightBody" && dr.propulsion !== "hover01");
	});
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
		/*
		if (!forceHover && !NON_HOVER_SYSTEMS)
		{
			removeThisTimer("recycleForHoverCobra");
		}
		*/
		if (forceHover)
		{
			var tanks = enumGroup(attackGroup).filter(function(dr) { return (dr.propulsion !== "hover01"); });
			const NON_HOVER_TANKS = tanks.length;
			for (var j = 0; j < NON_HOVER_TANKS; ++j)
			{
				orderDroid(tanks[j], DORDER_RECYCLE);
			}
			/*
			if (!(NON_HOVER_TANKS + NON_HOVER_SYSTEMS))
			{
				removeThisTimer("recycleForHoverCobra");
			}
			*/
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
		var myDroids = enumGroup(attackGroup).filter(function(dr) {
			return dr.order !== DORDER_RTR;
		});

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
	const MIN_VTOLS = 5;
	var vtols = enumGroup(vtolGroup).filter(function(dr) {
		return droidReady(dr);
	});
	const LEN = vtols.length;

	if (LEN >= MIN_VTOLS)
	{
		var target = rangeStep();
		if (isDefined(target))
		{
			target = getObject(target.typeInfo, target.playerInfo, target.idInfo);
			for (var i = 0; i < LEN; ++i)
			{
				attackThisObject(vtols[i], target);
			}
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
		target = rangeStep();
		if (isDefined(target))
		{
			target = getObject(target.typeInfo, target.playerInfo, target.idInfo);
		}
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

//Check if enemy units are in or around Cobra base.
function enemyUnitsInBase()
{
	var area = initialTerritory();
	var enemyUnits = enumArea(area.x1, area.y1, area.x2, area.y2, ENEMIES, false).filter(function(obj) {
		return (obj.type === DROID
			&& (obj.droidType === DROID_WEAPON
			|| obj.droidType === DROID_CYBORG)
		);
	});

	var enemyNearBase = enemyUnits.sort(distanceToBase);

	//The attack code automatically chooses the closest object of the
	//most harmful player anyway so this should suffice for defense.
	if (enemyNearBase.length)
	{
		targetPlayer(enemyUnits[0].player); //play rough.
	}

	return isDefined(enemyNearBase);
}

//Donate my power to allies if I have too much.
function donateSomePower()
{
	const ALLY_PLAYERS = playerAlliance(true);
	const LEN = ALLY_PLAYERS.length;
	const ALIVE_ENEMIES = findLivingEnemies().length;

	if (LEN && ALIVE_ENEMIES)
	{
		var ally = ALLY_PLAYERS[random(LEN)]
		if (getRealPower() > 100 && (playerPower(me) > 2 * playerPower(ally)))
		{
			donatePower(playerPower(me) / 2, ally);
		}
	}
}

//Flee! Flee for your lives!
function runAway()
{
	var droids = enumDroid(me).filter(function(dr) {
		return ((dr.droidType === DROID_WEAPON
			|| dr.droidType === DROID_CYBORG)
			&& !isVTOL(dr));
	});

	for (var i = 0, l = droids.length; i < l; ++i)
	{
		var droid = droids[i];
		if (droid.order !== DORDER_RTR)
		{
			orderDroidLoc(droid, DORDER_MOVE, MY_BASE.x, MY_BASE.y);
		}
	}
}

//Does Cobra believe it is winning or could win?
function confidenceThreshold()
{
	const DERR_COUNT = countStruct(structures.derricks);
	var points = 0;
	var derrRatio = Math.floor(DERR_COUNT / countAllResources()) * 100;

	//Owning ~half the oils or more is a good signal of winning
	if (derrRatio >= 40)
	{
		return true;
	}

	points = (DERR_COUNT >= countStruct(structures.derricks, getMostHarmfulPlayer())) ? (points + 12) : (points - 12);
	points = (countDroid(DROID_ANY) >= countDroid(DROID_ANY, getMostHarmfulPlayer()) - 4) ? (points + 21) : (points - 7);
	//team stuff
	if (playerAlliance(true).length)
	{
		points = (findLivingEnemies().length <= playerAlliance(true).length + 1) ? (points + 15) : (points - 15);
	}
	//more
	points = random(2) ? (points + random(8)) : (points - random(4));
	points += Math.floor(DERR_COUNT / 2.5);
	if (enumGroup(attackGroup).length < MIN_ATTACK_DROIDS)
	{
		points -= 6;
	}

	return (points > -1);
}

//Check if our forces are large enough to take on the most harmful player.
function shouldCobraAttack()
{
	if (confidenceThreshold() && countDroid(DROID_ANY) > 15)
	{
		return true;
	}
	else {
		runAway();
		return false;
	}
}
