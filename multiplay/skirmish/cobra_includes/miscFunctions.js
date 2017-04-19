//Contains functions that are either used everywhere or do not have
//a better file to be placed in yet.

// Random number between 0 and max-1.
function random(max) {
	return (max <= 0) ? 0 : Math.floor(Math.random() * max)
}

// Returns true if something is defined
function isDefined(data) {
	return typeof(data) !== "undefined";
}

//Sort an array from smallest to largest in value.
function sortArrayNumeric(a, b) {
	return a - b;
}

//Sort by distance to base and reverse.
function sortAndReverseDistance(arr) {
	return (arr.sort(distanceToBase)).reverse();
}

//Push list elements into another.
function appendListElements(list, items) {
	if(!isDefined(list))
		list = [];

	var temp = list;
	for(var i = 0; i < items.length; ++i) {
		temp.push(items[i]);
	}
	return temp;
}

//Control the amount of objects being put in memory so we do not create a large array of objects.
//Returns the closest enemy object from Cobra base.
function rangeStep(obj, visibility) {
	const step = 2000;
	var target;

	for(var i = 0; i <= 30000; i += step) {
		var temp = enumRange(obj.x, obj.y, i, ENEMIES, visibility);
		if(temp.length > 0) {
			temp.filter(function(targ) { return droidCanReach(obj, targ.x, targ.y) });
			temp.sort(distanceToBase);
			return temp[0];
		}
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
	if(!isDefined(item))
		return false;
	if(!isDefined(body))
		body = "Body1REC";
	if(!isDefined(prop))
		prop = "wheeled01";

	var virDroid = makeTemplate(me, "Virtual Droid", body, prop, null, null, item, item);
	return (virDroid != null) ? true : false;
}

//See if power levels are low. This takes account of only the power obtained from the generators.
function checkLowPower(pow) {
	if(!isDefined(pow)) { pow = 25; }

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
	if(!isDefined(throttleNumber))
		throttleNumber = 0;
	if(!isDefined(ms))
		ms = 1000;

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
 		if((x !== me) && !allianceExistsBetween(me, x) && (enumDroid(x).length || enumStruct(x).length)) {
			alive.push(x);
		}
		else {
			grudgeCount[x] = -1; // Dead/me.
		}
 	}

	return alive;
}

//Tell allies who is attacking Cobra the most.
//When called from chat using "stats" it will also tell you who is the most aggressive towards Cobra.
function getMostHarmfulPlayer(chatEvent) {
	var mostHarmful = 0;
	var enemies = findLivingEnemies();

 	for(var x = 0; x < enemies.length; ++x) {
 		if((grudgeCount[enemies[x]] >= 0) && (grudgeCount[enemies[x]] > grudgeCount[mostHarmful]))
 			mostHarmful = x;
 	}
 	if(isDefined(chatEvent)) {
		sendChatMessage("Most harmful player: " + mostHarmful, ALLIES);
	}

	return mostHarmful;
}

//Removes duplicate items from something.
function removeDuplicateItems(temp) {
	var prims = {"boolean":{}, "number":{}, "string":{}}, objs = [];
	return temp.filter(function(item) {
	 var type = typeof item;
	  if(type in prims)
	   return prims[type].hasOwnProperty(item) ? false : (prims[type][item] = true);
	  else
	   return objs.indexOf(item) >= 0 ? false : objs.push(item);
	});
}

//Find droids that are obseleted by superior technology.
/*
function findOldDroids(group) {
	return group.filter(function(dr) {
		((dr.born + 800000) < gameTime) && (dr.cost <
	}
}
*/

//Target a random enemy at the start of the match. This is done by placing
//random values into the grudge counter.
function randomizeFirstEnemy() {
	for(var i = 0; i < maxPlayers; ++i) {
		grudgeCount[i] = random(30);
	}
}

//Called from eventStartLevel, this initializes the globals.
function initiaizeRequiredGlobals() {
	nexusWaveOn = false;
	researchComplete = false;
	grudgeCount = [];
	throttleTime = [];
	thinkLonger = 0;

	for(var i = 0; i < maxPlayers; ++i) { grudgeCount.push(0); }
	for(var i = 0; i < 4; ++i) { throttleTime.push(0); }

	checkForScavs();
	diffPerks();

	forceHover = checkIfSeaMap();
	turnOffCyborgs = (forceHover === true) ? true : false;
	personality = choosePersonality();
	turnOffMG = CheckStartingBases();
	randomizeFirstEnemy();
	initializeResearchLists();
}

//Count how many Enemy VTOL units are on the map.
function countEnemyVTOL() {
	var enemies = findLivingEnemies();
	var enemyVtolCount = 0;

	for (var x = 0; x < enemies.length; ++x) {
		enemyVtolCount += enumDroid(enemies[x]).filter(function(obj) { return isVTOL(obj) }).length;
	}

	return enemyVtolCount;
}

//Donate a droid from one of Cobra's groups.
function donateFromGroup(group, from) {
	const MIN_DROID_COUNT = 9;
	var droids = enumGroup(group);
	if(droids.length < MIN_DROID_COUNT) { return; }
	donateObject(droids[random(droids.length)], from);
}
