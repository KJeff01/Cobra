//Contains functions that are either used everywhere or do not have
//a better file to be placed in yet.

// Random number between 0 and max-1.
function random(max) {
	return (max <= 0) ? 0 : Math.floor(Math.random() * max);
}

// Returns true if something is defined
function isDefined(data) {
	return typeof(data) !== "undefined";
}

//Sort an array from smallest to largest in value.
function sortArrayNumeric(a, b) {
	return a - b;
}

//Sort an array from smallest to largest in terms of droid health.
function sortDroidsByHealth(a, b) {
	return a.health - b.health;
}

//Used for deciding if a truck will capture oil.
function isUnsafeEnemyObject(obj) {
	return ((obj.type === DROID) || ((obj.type === STRUCTURE) && (obj.stattype === DEFENSE)));
}

//Sort by distance to base and reverse.
function sortAndReverseDistance(arr) {
	return (arr.sort(distanceToBase)).reverse();
}

//Return the alias of the primary weapon.
function returnPrimaryAlias() {
	return subpersonalities[personality].primaryWeapon.alias;
}

//Return the alias of the secondary weapon.
function returnSecondaryAlias() {
	return subpersonalities[personality].secondaryWeapon.alias;
}

//Return the alias of the anti-air weaponry.
function returnAntiAirAlias() {
	return subpersonalities[personality].antiAir.alias;
}

//Return the alias of the artillery weapon.
function returnArtilleryAlias() {
	return subpersonalities[personality].artillery.alias;
}

//Push list elements into another.
function appendListElements(list, items) {
	if(!isDefined(list)) {
		list = [];
	}

	var temp = list;
	var cacheItems = items.length;
	for(var i = 0; i < cacheItems; ++i) {
		temp.push(items[i]);
	}
	return temp;
}

function addDroidsToGroup(group, droids) {
	for(var i = 0, d = droids.length; i < d; ++i) {
		groupAdd(group, droids[i]);
	}
}

//Returns closest enemy object.
function rangeStep(player) {
	var target;
	var targets = [];
	var closestStructure = enumStruct(player).sort(distanceToBase);
	var closestDroid = enumDroid(player).sort(distanceToBase);

	if (closestStructure.length > 0) {
		targets.push(closestStructure[0]);
	}
	if(closestDroid.length > 0) {
		targets.push(closestDroid[0]);
	}

	if(targets.length > 0) {
		targets = targets.sort(distanceToBase);
		target = targets[0];
	}

	return target;
}

//Ally is false for checking for enemy players
//Ally is true for allies.
function playerAlliance(ally) {
	if(!isDefined(ally)) { ally = false; }
	var players = [];

	for(var i = 0; i < maxPlayers; ++i) {
		if(!ally) {
			if(!allianceExistsBetween(i, me) && (i !== me)) {
				players.push(i);
			}
		}
		else {
			if(allianceExistsBetween(i, me) && (i !== me)) {
				players.push(i);
			}
		}
	}
	return players;
}

//Change stuff depending on difficulty.
function diffPerks() {
	switch(difficulty) {
		case EASY:
			//This is handled in eventStartLevel().
			break;
		case MEDIUM:
			//Do nothing
			break;
		case INSANE: //Fall through
			nexusWaveOn = true;
		case HARD:
			if(!isStructureAvailable("A0PowMod1"))
				completeRequiredResearch("R-Sys-Engineering01");
			makeComponentAvailable("PlasmaHeavy", me);
			makeComponentAvailable("MortarEMP", me);
			break;
	}
}

//Dump some text.
function log(message) {
	dump(gameTime + " : " + message);
}

//Dump information about an object and some text.
function logObj(obj, message) {
	dump(gameTime + " : [" + obj.name + " id=" + obj.id + "] > " + message);
}

//Distance between an object and the Cobra base.
function distanceToBase(obj1, obj2) {
	var dist1 = distBetweenTwoPoints(startPositions[me].x, startPositions[me].y, obj1.x, obj1.y);
	var dist2 = distBetweenTwoPoints(startPositions[me].x, startPositions[me].y, obj2.x, obj2.y);
	return (dist1 - dist2);
}

//See if we can design this droid. Mostly used for checking for new weapons with the NIP.
function isDesignable(item, body, prop) {
	if(!isDefined(item)) {
		return false;
	}

	if(!isDefined(body)) {
		body = "Body1REC";
	}

	if(!isDefined(prop)) {
		prop = "wheeled01";
	}

	var virDroid = makeTemplate(me, "Virtual Droid", body, prop, "", "", item, item);
	return (virDroid !== null) ? true : false;
}

//See if power levels are low. This takes account of only the power obtained from the generators.
function checkLowPower(pow) {
	if(!isDefined(pow)) {
		pow = 25;
	}

	if(playerPower(me) < pow) {
		if(playerAlliance(true).length > 0) {
			sendChatMessage("need Power", ALLIES);
		}
		return true;
	}

	return false;
}

//return real power levels.
function getRealPower() {
	var pow = playerPower(me) - queuedPower(me);

	if((playerAlliance(true).length > 0) && (pow < 50)) {
		sendChatMessage("need Power", ALLIES);
	}
	return playerPower(me) - queuedPower(me);
}

//Determine if something (namely events) should be skipped momentarily.
//0 - eventAttacked().
//1 - eventChat().
//2 - eventBeacon().
//3 - eventGroupLoss(). (the addBeacon call).
//ms is a delay value.
//Defaults to checking eventAttacked timer.
function stopExecution(throttleNumber, ms) {
	if(!isDefined(throttleNumber)) {
		throttleNumber = 0;
	}

	if(!isDefined(ms)) {
		ms = 1000;
	}

	if(gameTime > (throttleTime[throttleNumber] + ms)) {
		throttleTime[throttleNumber] = gameTime + (4 * random(500));
		return false;
	}
	else {
		return true;
	}
}

//Find enemies that are still alive.
function findLivingEnemies() {
	var alive = [];

	for(var x = 0; x < maxPlayers; ++x) {
 		if((x !== me) && !allianceExistsBetween(x, me) && (enumDroid(x).length || enumStruct(x).length)) {
			alive.push(x);
		}
		else {
			if(allianceExistsBetween(x, me) || (x === me)) {
				grudgeCount[x] = -2; //Friendly player.
			}
			else {
				grudgeCount[x] = -1; //Dead enemy.
			}
		}
 	}

	return alive;
}

//Tell allies who is attacking Cobra the most.
//When called from chat using "stats" it will also tell you who is the most aggressive towards Cobra.
function getMostHarmfulPlayer(chatEvent) {
	var mostHarmful = 0;
	var enemies = findLivingEnemies();

 	for(var x = 0, c = enemies.length; x < c; ++x) {
 		if((grudgeCount[enemies[x]] >= 0) && (grudgeCount[enemies[x]] > grudgeCount[mostHarmful]))
 			mostHarmful = enemies[x];
 	}
 	if(isDefined(chatEvent) && (mostHarmful !== me)) {
		sendChatMessage("Most harmful player: " + mostHarmful, ALLIES);
	}

	//In case Cobra is player zero (jsload or automation), return an enemy
	//so that it does not attack itself if it wins.
	var enemy_dummy = playerAlliance(false);
	return (mostHarmful !== me) ? mostHarmful : enemy_dummy[0];
}

//Removes duplicate items from something.
function removeDuplicateItems(temp) {
	var prims = {"boolean":{}, "number":{}, "string":{}}, objs = [];
	return temp.filter(function(item) {
		var type = typeof item;
		if(type in prims) {
			return prims[type].hasOwnProperty(item) ? false : (prims[type][item] = true);
		}
		else {
			return objs.indexOf(item) >= 0 ? false : objs.push(item);
		}
	});
}

//Target a random enemy at the start of the match. This is done by placing
//random values into the grudge counter.
function randomizeFirstEnemy() {
	for(var i = 0; i < maxPlayers; ++i) {
		if((!allianceExistsBetween(i, me)) && (i !== me)) {
			grudgeCount[i] = random(30);
		}
		else {
			grudgeCount[i] = -2; //Otherwise bad stuff (attacking itself and allies) happens.
		}
	}
}

//Called from eventStartLevel, this initializes the globals.
function initiaizeRequiredGlobals() {
	nexusWaveOn = false;
	researchComplete = false;
	grudgeCount = [];
	throttleTime = [];

	for(var i = 0; i < maxPlayers; ++i) {
		grudgeCount.push(0);
	}

	for(var i = 0; i < 4; ++i) {
		throttleTime.push(0);
	}

	diffPerks();

	forceHover = checkIfSeaMap();
	turnOffCyborgs = (forceHover) ? true : false;
	personality = choosePersonality();
	turnOffMG = CheckStartingBases();
	randomizeFirstEnemy();
	initializeResearchLists();
}

//Count how many Enemy VTOL units are on the map.
function countEnemyVTOL() {
	var enemies = findLivingEnemies();
	var enemyVtolCount = 0;

	for (var x = 0, e = enemies.length; x < e; ++x) {
		enemyVtolCount += enumDroid(enemies[x]).filter(function(obj) { return isVTOL(obj); }).length;
	}

	return enemyVtolCount;
}

//Donate a droid from one of Cobra's groups.
function donateFromGroup(group, from) {
	const MIN_HEALTH = 70;
	var droids = enumGroup(group);
	var cacheDroids = droids.length;

	if(cacheDroids < MIN_ATTACK_DROIDS) {
		return;
	}

	var droid = droids[random(cacheDroids)];
	if(isDefined(droid) && (droid.health >= MIN_HEALTH)) {
		donateObject(droid, from);
	}
}

//Remove a single timer. May pass a string or an array of strings.
function removeThisTimer(timer) {
	if(timer instanceof Array) {
		for(var i = 0, l = timer.length; i < l; ++i) {
			removeTimer(timer[i]);
		}
	}
	else {
		removeTimer(timer);
	}
}

//Stop the non auto-remove timers if Cobra died.
function StopTimersIfDead() {
	if(!enumDroid(me) && !enumStruct(me)) {
		var timers = [
			"buildOrder", "repairDamagedDroids", "produce", "battleTactics",
			"spyRoutine", "StopTimersIfDead", "eventResearched"
		];

		removeThisTimer(timers);
	}
}
