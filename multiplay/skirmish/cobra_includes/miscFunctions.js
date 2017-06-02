//Contains functions that are either used everywhere or do not have
//a better file to be placed in yet.

if(DEVELOPMENT) {
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
		return (obj.type === DROID) || ((obj.type === STRUCTURE) && (obj.stattype === DEFENSE));
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
	function returnArtilleryAlias() {
		return subpersonalities[personality].antiAir.alias;
	}

	//Return the alias of the artillery weapon.
	function returnAntiAirAlias() {
		return subpersonalities[personality].artillery.alias;
	}

	//Push list elements into another.
	function appendListElements(list, items) {
		if(!isDefined(list))
		list = [];

		var temp = list;
		var cacheItems = items.length;
		for(var i = 0; i < cacheItems; ++i) {
			temp.push(items[i]);
		}
		return temp;
	}

	function addDroidsToGroup(group, droids) {
		var cacheDroids = droids.length;

		for(var i = 0; i < cacheDroids; ++i) {
			groupAdd(group, droids[i]);
		}
	}

	//Returns closest enemy object.
	function rangeStep(player) {
		const STEP = 2000;
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
			targets.sort(distanceToBase);
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
				if(!isStructureAvailable("A0PowMod1")) {
					completeRequiredResearch("R-Sys-Engineering01");
				}
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
		var cacheEnemies = enemies.length;

		for(var x = 0; x < cacheEnemies; ++x) {
			if((grudgeCount[enemies[x]] >= 0) && (grudgeCount[enemies[x]] > grudgeCount[mostHarmful])) {
				mostHarmful = enemies[x];
			}
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
		turnOffCyborgs = (forceHover || random(2)) ? true : false;
		personality = choosePersonality();
		turnOffMG = CheckStartingBases();
		randomizeFirstEnemy();
		initializeResearchLists();
	}

	//Count how many Enemy VTOL units are on the map.
	function countEnemyVTOL() {
		var enemies = findLivingEnemies();
		var cacheEnemies = enemies.length;
		var enemyVtolCount = 0;

		for (var x = 0; x < cacheEnemies; ++x) {
			enemyVtolCount += enumDroid(enemies[x]).filter(function(obj) { return isVTOL(obj); }).length;
		}

		return enemyVtolCount;
	}

	//Donate a droid from one of Cobra's groups.
	function donateFromGroup(group, from) {
		const MIN_DROID_COUNT = 9;
		var droids = enumGroup(group);
		var cacheDroids = droids.length;

		if(cacheDroids < MIN_DROID_COUNT) {
			return;
		}

		donateObject(droids[random(cacheDroids)], from);
	}

	//Remove a single timer. May pass a string or an array of strings.
	function removeThisTimer(timer) {
		var cacheTimers = timer.length;

		if(timer instanceof Array) {
			for(var i = 0; i < cacheTimers; ++i) {
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
				"spyRoutine", "checkMood", "StopTimersIfDead", "eventResearched"
			];

			removeThisTimer(timers);
		}
	}
}
else {
	function random(e) {
		return 0 >= e ? 0 : Math.floor(Math.random() * e)
	}

	function isDefined(e) {
		return "undefined" != typeof e
	}

	function sortArrayNumeric(e, n) {
		return e - n
	}

	function sortDroidsByHealth(e, n) {
		return e.health - n.health
	}

	function isUnsafeEnemyObject(e) {
		return e.type === DROID || e.type === STRUCTURE && e.stattype === DEFENSE
	}

	function sortAndReverseDistance(e) {
		return e.sort(distanceToBase).reverse()
	}

	function returnPrimaryAlias() {
		return subpersonalities[personality].primaryWeapon.alias
	}

	function returnSecondaryAlias() {
		return subpersonalities[personality].secondaryWeapon.alias
	}

	function returnArtilleryAlias() {
		return subpersonalities[personality].antiAir.alias
	}

	function returnAntiAirAlias() {
		return subpersonalities[personality].artillery.alias
	}

	function appendListElements(e, n) {
		isDefined(e) || (e = []);
		for (var r = e, t = n.length, i = 0; t > i; ++i) r.push(n[i]);
		return r
	}

	function addDroidsToGroup(e, n) {
		for (var r = n.length, t = 0; r > t; ++t) groupAdd(e, n[t])
	}

	function rangeStep(e) {
		var n, r = [],
		t = enumStruct(e).sort(distanceToBase),
		i = enumDroid(e).sort(distanceToBase);
		return t.length > 0 && r.push(t[0]), i.length > 0 && r.push(i[0]), r.length > 0 && (r.sort(distanceToBase), n = r[0]), n
	}

	function playerAlliance(e) {
		isDefined(e) || (e = !1);
		for (var n = [], r = 0; r < maxPlayers; ++r) e ? allianceExistsBetween(r, me) && r !== me && n.push(r) : allianceExistsBetween(r, me) || r === me || n.push(r);
		return n
	}

	function diffPerks() {
		switch (difficulty) {
			case EASY:
			break;
			case MEDIUM:
			break;
			case INSANE:
			nexusWaveOn = !0;
			case HARD:
			isStructureAvailable("A0PowMod1") || completeRequiredResearch("R-Sys-Engineering01"), makeComponentAvailable("PlasmaHeavy", me), makeComponentAvailable("MortarEMP", me)
		}
	}

	function log(e) {
		dump(gameTime + " : " + e)
	}

	function logObj(e, n) {
		dump(gameTime + " : [" + e.name + " id=" + e.id + "] > " + n)
	}

	function distanceToBase(e, n) {
		var r = distBetweenTwoPoints(startPositions[me].x, startPositions[me].y, e.x, e.y),
		t = distBetweenTwoPoints(startPositions[me].x, startPositions[me].y, n.x, n.y);
		return r - t
	}

	function isDesignable(e, n, r) {
		if (!isDefined(e)) return !1;
		isDefined(n) || (n = "Body1REC"), isDefined(r) || (r = "wheeled01");
		var t = makeTemplate(me, "Virtual Droid", n, r, "", "", e, e);
		return null !== t ? !0 : !1
	}

	function checkLowPower(e) {
		return isDefined(e) || (e = 25), playerPower(me) < e ? (playerAlliance(!0).length > 0 && sendChatMessage("need Power", ALLIES), !0) : !1
	}

	function getRealPower() {
		var e = playerPower(me) - queuedPower(me);
		return playerAlliance(!0).length > 0 && 50 > e && sendChatMessage("need Power", ALLIES), playerPower(me) - queuedPower(me)
	}

	function stopExecution(e, n) {
		return isDefined(e) || (e = 0), isDefined(n) || (n = 1e3), gameTime > throttleTime[e] + n ? (throttleTime[e] = gameTime + 4 * random(500), !1) : !0
	}

	function findLivingEnemies() {
		for (var e = [], n = 0; n < maxPlayers; ++n) n === me || allianceExistsBetween(n, me) || !enumDroid(n).length && !enumStruct(n).length ? allianceExistsBetween(n, me) || n === me ? grudgeCount[n] = -2 : grudgeCount[n] = -1 : e.push(n);
		return e
	}

	function getMostHarmfulPlayer(e) {
		for (var n = 0, r = findLivingEnemies(), t = r.length, i = 0; t > i; ++i) grudgeCount[r[i]] >= 0 && grudgeCount[r[i]] > grudgeCount[n] && (n = r[i]);
		isDefined(e) && n !== me && sendChatMessage("Most harmful player: " + n, ALLIES);
		var a = playerAlliance(!1);
		return n !== me ? n : a[0]
	}

	function removeDuplicateItems(e) {
		var n = {
			"boolean": {},
			number: {},
			string: {}
		},
		r = [];
		return e.filter(function(e) {
			var t = typeof e;
			return t in n ? n[t].hasOwnProperty(e) ? !1 : n[t][e] = !0 : r.indexOf(e) >= 0 ? !1 : r.push(e)
		})
	}

	function randomizeFirstEnemy() {
		for (var e = 0; e < maxPlayers; ++e) allianceExistsBetween(e, me) || e === me ? grudgeCount[e] = -2 : grudgeCount[e] = random(30)
	}

	function initiaizeRequiredGlobals() {
		nexusWaveOn = !1, researchComplete = !1, grudgeCount = [], throttleTime = [];
		for (var e = 0; e < maxPlayers; ++e) grudgeCount.push(0);
		for (var e = 0; 4 > e; ++e) throttleTime.push(0);
		diffPerks(), forceHover = checkIfSeaMap(), turnOffCyborgs = forceHover || random(2) ? !0 : !1, personality = choosePersonality(), turnOffMG = CheckStartingBases(), randomizeFirstEnemy(), initializeResearchLists()
	}

	function countEnemyVTOL() {
		for (var e = findLivingEnemies(), n = e.length, r = 0, t = 0; n > t; ++t) r += enumDroid(e[t]).filter(function(e) {
			return isVTOL(e)
		}).length;
		return r
	}

	function donateFromGroup(e, n) {
		const r = 9;
		var t = enumGroup(e),
		i = t.length;
		r > i || donateObject(t[random(i)], n)
	}

	function removeThisTimer(e) {
		var n = e.length;
		if (e instanceof Array)
		for (var r = 0; n > r; ++r) removeTimer(e[r]);
		else removeTimer(e)
	}

	function StopTimersIfDead() {
		if (!enumDroid(me) && !enumStruct(me)) {
			var e = ["buildOrder", "repairDamagedDroids", "produce", "battleTactics", "spyRoutine", "checkMood", "StopTimersIfDead", "eventResearched"];
			removeThisTimer(e)
		}
	}
}
