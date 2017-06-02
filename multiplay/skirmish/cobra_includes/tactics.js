
if(DEVELOPMENT) {
	//Droids that are attacking should not be pulled away until
	//they destroy whatever thay are attacking or need repair.
	function droidReady(droid) {
		return (!repairDroid(droid, false)
			&& (droid.order !== DORDER_ATTACK)
			&& (droid.order !== DORDER_RTR)
			&& vtolReady(droid) //True for non-VTOL units
		);
	}

	function isPlasmaCannon(droid) {
		return droid.weapons[0].name === "Laser4-PlasmaCannon";
	}

	//Returns true if the VTOL has ammo. False if empty.
	function vtolArmed(obj, percent) {
		if (obj.type !== DROID) {
			return;
		}

		if (!isVTOL(obj)) {
			return false;
		}

		var cacheWeapons = obj.weapons.length;
		for (var i = 0; i < cacheWeapons; ++i) {
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
		const MIN_DROID_COUNT = 6;
		var tanks  = enumGroup(attackGroup);
		var borgs = enumGroup(cyborgGroup);
		var vtols = enumGroup(vtolGroup);

		var cacheVtols = vtols.length

		//return our vtols to the pads if needed.
		for(var i = 0; i < cacheVtols; ++i) {
			vtolReady(vtols[i]);
		}

		if((borgs.length > MIN_DROID_COUNT) && random(2)) {
			return borgs;
		}
		else if(tanks.length > MIN_DROID_COUNT && random(2)) {
			return tanks;
		}
		else if(cacheVtols > MIN_DROID_COUNT && random(2)) {
			return vtols;
		}

		return tanks; //Fallback.
	}

	//Find the derricks of all enemy players, or just a specific one.
	function findEnemyDerricks(playerNumber) {
		var derr = [];

		if(!isDefined(playerNumber)) {
			var enemies = findLivingEnemies();
			var cacheEnemies = enemies.length;

			for(var i = 0; i < cacheEnemies; ++i) {
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

		if((grudgeCount[mostHarmful] >= GRUDGE_LEVEL) || (random(101) <= 1)) {
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

		const MIN_DROID_COUNT = 6;
		var cacheDroids = droids.length;

		if(cacheDroids < MIN_DROID_COUNT) {
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
		var cacheArti = artillery.length;
		var cacheSensors = sensors.length;

		if(!(cacheSensors * cacheArti)) {
			return false;
		}

		sensors = sortAndReverseDistance(sensors);
		var enemies = findLivingEnemies();
		var cacheEnemies = enemies.length;
		var target;
		var objects = [];

		for(var i = 0; i < cacheEnemies; ++i) {
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

		if(isDefined(target)) {
			orderDroidObj(sensors[0], DORDER_OBSERVE, target);
		}

		//Redundant stability here.
		for(var i = 0; i < cacheArti; ++i) {
			if(isDefined(sensors[0]) && isDefined(target) && isDefined(artillery[i]) && droidReady(artillery[i]) && droidCanReach(artillery[i], target.x, target.y)) {
				orderDroidLoc(artillery[i], DORDER_SCOUT, target.x, target.y);
			}
		}
	}

	//Attack enemy oil when tank group is large enough.
	function attackEnemyOil() {
		const MIN_ATTACK_DROIDS = 6;
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

		var cacheWho = who.length;
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

	// Defend base if a droid is close by.
	function defendBase() {
		const MIN_ATTACK_DROIDS = 4;
		var enemies = findLivingEnemies();
		var cacheEnemies = enemies.length;

		for(var i = 0; i < cacheEnemies ; ++i) {
			var droid = enumDroid(enemies[i]).sort(distanceToBase);

			if(droid.length > 0) {
				droid = droid[0];
			}
			else {
				continue;
			}

			//Go defend the base.
			if(distBetweenTwoPoints(startPositions[me].x, startPositions[me].y, droid.x, droid.y) < 8) {
				var myDroids = enumGroup(attackGroup);
				myDroids = appendListElements(myDroids, enumGroup(cyborgGroup));
				var cacheMyDroids = myDroids.length;

				if(cacheMyDroids < MIN_ATTACK_DROIDS) {
					return true; //wait.
				}

				//They are being aggressive, so lets increase grudge.
				if(grudgeCount[enemies[i]] < MAX_GRUDGE) {
					grudgeCount[enemies[i]] = grudgeCount[enemies[i]] + 25;
				}

				for(var j = 0; j < cacheMyDroids; ++j) {
					if(isDefined(myDroids[j]) && droidReady(myDroids[j]) && isDefined(droid)) {
						if(!isPlasmaCannon(myDroids[j])) {
							orderDroidLoc(myDroids[j], DORDER_SCOUT, droid.x, droid.y);
						}
						else {
							orderDroidObj(myDroids[j], DORDER_ATTACK, droid);
						}
					}
				}

				return true;
			}
		}

		return false;
	}

	//Defend or attack.
	function battleTactics() {
		if(defendBase()) {
			return;
		}

		const MIN_DERRICKS = 8;
		const MIN_ATTACK_DROIDS = 5;
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
	function recycleObsoleteDroids() {
		const MIN_FACTORY_COUNT = 1;
		var tanks = enumGroup(attackGroup);
		var systems = enumGroup(sensorGroup);
		systems = appendListElements(systems, enumGroup(repairGroup));
		systems = appendListElements(systems, enumDroid(me, DROID_CONSTRUCT));
		var temp = false;

		var cacheSystems = systems.length;
		var cacheTanks = tanks.length;

		if((countStruct(structures.factories) > MIN_FACTORY_COUNT) && componentAvailable("hover01")) {
			if(!unfinishedStructures().length) {
				for(var i = 0; i < cacheSystems; ++i) {
					if(systems[i].propulsion !== "hover01") {
						temp = true;
						orderDroid(systems[i], DORDER_RECYCLE);
					}
				}
			}

			if(forceHover) {
				for(var i = 0; i < cacheTanks; ++i) {
					if((tanks[i].propulsion !== "hover01")) {
						orderDroid(tanks[i], DORDER_RECYCLE);
					}
				}
			}
		}
		return temp;
	}

	//Attack oil specifically if a player requests it.
	function chatAttackOil(playerNumber) {
		const MIN_DROID_COUNT = 5;
		var derr = findEnemyDerricks(playerNumber);
		var who = chooseGroup();
		var cacheWho = who.length;

		if(!derr.length || (cacheWho < MIN_DROID_COUNT)) {
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
}
else {
	function droidReady(e) {
		return !repairDroid(e, !1) && e.order !== DORDER_ATTACK && e.order !== DORDER_RTR && vtolReady(e)
	}

	function isPlasmaCannon(e) {
		return "Laser4-PlasmaCannon" === e.weapons[0].name
	}

	function vtolArmed(e, r) {
		if (e.type === DROID) {
			if (!isVTOL(e)) return !1;
			for (var t = e.weapons.length, n = 0; t > n; ++n)
			if (e.weapons[n].armed >= r) return !0;
			return !1
		}
	}

	function returnEnemyFactories(e) {
		isDefined(e) || (e = getMostHarmfulPlayer());
		var r = enumStruct(e, structures.factories);
		return r = appendListElements(r, enumStruct(e, structures.templateFactories)), r = appendListElements(r, enumStruct(e, structures.vtolFactories)), r.sort(distanceToBase), r
	}

	function vtolReady(e) {
		if (!isVTOL(e)) return !0;
		const r = 1;
		return e.order === DORDER_ATTACK ? !1 : vtolArmed(e, r) ? !0 : (e.order !== DORDER_REARM && orderDroid(e, DORDER_REARM), !1)
	}

	function repairDroid(e, r) {
		const t = 33,
		n = 22,
		o = 58 + Math.floor(e.experience / n);
		return isDefined(r) || (r = !1), Math.floor(e.health) <= t && (r = !0), e.order === DORDER_RTR && (Math.floor(e.health) < 100 || r) ? !0 : countStruct(structures.extras[0]) && (r || Math.floor(e.health) <= o) ? (orderDroid(e, DORDER_RTR), !0) : !1
	}

	function chooseGroup() {
		const e = 6;
		for (var r = enumGroup(attackGroup), t = enumGroup(cyborgGroup), n = enumGroup(vtolGroup), o = n.length, i = 0; o > i; ++i) vtolReady(n[i]);
		return t.length > e && random(2) ? t : r.length > e && random(2) ? r : o > e && random(2) ? n : r
	}

	function findEnemyDerricks(e) {
		var r = [];
		if (isDefined(e)) r = enumStruct(e, structures.derricks);
		else {
			for (var t = findLivingEnemies(), n = t.length, o = 0; n > o; ++o) r = appendListElements(r, enumStruct(t[o], structures.derricks));
			isDefined(getScavengerNumber()) && !allianceExistsBetween(getScavengerNumber(), me) && (r = appendListElements(r, enumStruct(getScavengerNumber(), structures.derricks)))
		}
		return r
	}

	function checkMood() {
		const e = 300;
		var r = getMostHarmfulPlayer();
		(grudgeCount[r] >= e || random(101) <= 1) && attackStuff(r)
	}

	function findNearestEnemyDroid(e, r) {
		isDefined(r) || (r = getMostHarmfulPlayer());
		var t = enumDroid(r);
		t.length && (t.sort(distanceToBase), droidReady(e) && isDefined(t[0]) && droidCanReach(e, t[0].x, t[0].y) && (isPlasmaCannon(e) ? orderDroidObj(e, DORDER_ATTACK, t[0]) : orderDroidLoc(e, DORDER_SCOUT, t[0].x, t[0].y)))
	}

	function findNearestEnemyStructure(e, r, t) {
		isDefined(r) || (r = getMostHarmfulPlayer());
		var n = isDefined(t) ? t : enumStruct(r).filter(function(e) {
			return e.stattype !== WALL
		});
		if (0 === n.length && (n = enumStruct(r)), n.length > 0) {
			n.sort(distanceToBase);
			var o = n[0];
			droidReady(e) && isDefined(o) && droidCanReach(e, o.x, o.y) && orderDroidObj(e, DORDER_ATTACK, o)
		} else findNearestEnemyDroid(e, r)
	}

	function attackWithGroup(e, r, t) {
		if (isDefined(e)) {
			isDefined(r) || (r = getMostHarmfulPlayer());
			const n = 6;
			var o = e.length;
			if (n > o) return !1;
			var i;
			isDefined(t) && t.length && (t.sort(distanceToBase), i = t[0]);
			for (var a = 0; o > a; a++) isDefined(e[a]) && droidReady(e[a]) && (isDefined(i) && droidCanReach(e[a], i.x, i.y) ? isPlasmaCannon(e[a]) || i.type === STRUCTURE ? orderDroidObj(e[a], DORDER_ATTACK, i) : orderDroidLoc(e[a], DORDER_SCOUT, i.x, i.y) : findNearestEnemyStructure(e[a], r))
		}
	}

	function chatTactic(e) {
		const r = 6,
		t = 12;
		var n, o = lastMsg.slice(0, -1);
		return "attack" !== o && "oil" !== o && (countStruct(structures.derricks) > r && enumDroid(me) > t ? sendChatMessage("attack" + e, ALLIES) : (sendChatMessage("oil" + e, ALLIES), chatAttackOil(e), n = !0)), n
	}

	function attackStuff(e) {
		var r = getMostHarmfulPlayer();
		isDefined(e) && !allianceExistsBetween(e, me) && e !== me && (r = e), isDefined(chatTactic(r)) || (attackWithGroup(enumGroup(attackGroup), r), turnOffCyborgs || attackWithGroup(enumGroup(cyborgGroup), r), attackWithGroup(enumGroup(vtolGroup), r))
	}

	function spyRoutine() {
		var e = enumGroup(sensorGroup),
		r = enumGroup(artilleryGroup),
		t = r.length,
		n = e.length;
		if (!(n * t)) return !1;
		e = sortAndReverseDistance(e);
		for (var o, i = findLivingEnemies(), a = i.length, s = [], u = 0; a > u; ++u) {
			var d = rangeStep(i[u]);
			isDefined(d) && s.push(d)
		}
		if (s.length) {
			s.sort(distanceToBase), o = s[0], isDefined(o) && orderDroidObj(e[0], DORDER_OBSERVE, o);
			for (var u = 0; t > u; ++u) isDefined(e[0]) && isDefined(o) && isDefined(r[u]) && droidReady(r[u]) && droidCanReach(r[u], o.x, o.y) && orderDroidLoc(r[u], DORDER_SCOUT, o.x, o.y)
		}
	}

	function attackEnemyOil() {
		const e = 6;
		var r = chooseGroup(),
		t = 0;
		if (!(r.length < e)) {
			var n = findEnemyDerricks();
			if (n.length) {
				n.sort(distanceToBase);
				for (var o = r.length, i = 0; o > i; ++i) isDefined(r[i]) && droidReady(r[i]) && (isDefined(n[t]) || (t += 1), isDefined(n[t]) && droidCanReach(r[i], n[t].x, n[t].y) && (isPlasmaCannon(r[i]) ? orderDroidObj(r[i], DORDER_ATTACK, n[t]) : orderDroidLoc(r[i], DORDER_SCOUT, n[t].x, n[t].y)))
			}
		}
	}

	function defendBase() {
		const e = 4;
		for (var r = findLivingEnemies(), t = r.length, n = 0; t > n; ++n) {
			var o = enumDroid(r[n]).sort(distanceToBase);
			if (o.length > 0 && (o = o[0], distBetweenTwoPoints(startPositions[me].x, startPositions[me].y, o.x, o.y) < 8)) {
				var i = enumGroup(attackGroup);
				i = appendListElements(i, enumGroup(cyborgGroup));
				var a = i.length;
				if (e > a) return !0;
				grudgeCount[r[n]] < MAX_GRUDGE && (grudgeCount[r[n]] = grudgeCount[r[n]] + 25);
				for (var s = 0; a > s; ++s) isDefined(i[s]) && droidReady(i[s]) && isDefined(o) && (isPlasmaCannon(i[s]) ? orderDroidObj(i[s], DORDER_ATTACK, o) : orderDroidLoc(i[s], DORDER_SCOUT, o.x, o.y));
				return !0
			}
		}
		return !1
	}

	function battleTactics() {
		if (!defendBase()) {
			const e = 8,
			r = 5,
			t = getMostHarmfulPlayer(),
			n = 300,
			o = returnEnemyFactories();
			if (grudgeCount[t] > n && o) attackWithGroup(chooseGroup(), t, o);
			else if (countStruct(structures.derricks) < e || getRealPower() < -200) attackEnemyOil();
			else {
				var i = chooseGroup(),
				a = i.length;
				if (r > a) return;
				for (var s = 0; a > s; ++s) isDefined(i[s]) && droidReady(i[s]) && findNearestEnemyStructure(i[s], t)
			}
		}
	}

	function recycleObsoleteDroids() {
		const e = 1;
		var r = enumGroup(attackGroup),
		t = enumGroup(sensorGroup);
		t = appendListElements(t, enumGroup(repairGroup)), t = appendListElements(t, enumDroid(me, DROID_CONSTRUCT));
		var n = !1,
		o = t.length,
		i = r.length;
		if (countStruct(structures.factories) > e && componentAvailable("hover01")) {
			if (!unfinishedStructures().length)
			for (var a = 0; o > a; ++a) "hover01" !== t[a].propulsion && (n = !0, orderDroid(t[a], DORDER_RECYCLE));
			if (forceHover)
			for (var a = 0; i > a; ++a) "hover01" !== r[a].propulsion && orderDroid(r[a], DORDER_RECYCLE)
		}
		return n
	}

	function chatAttackOil(e) {
		const r = 5;
		var t = findEnemyDerricks(e),
		n = chooseGroup(),
		o = n.length;
		if (!t.length || r > o) return !1;
		t.sort(distanceToBase);
		for (var i = 0; o > i; ++i) isDefined(n[i]) && droidReady(n[i]) && isDefined(t[0]) && orderDroidObj(n[i], DORDER_ATTACK, t[0])
	}

	function repairDamagedDroids() {
		var e = enumGroup(repairGroup),
		r = e.length;
		if (r) {
			var t = appendListElements(t, enumGroup(attackGroup));
			t = appendListElements(t, enumGroup(cyborgGroup));
			var n = t.length;
			if (n) {
				t.sort(sortDroidsByHealth);
				for (var o = 0; r > o; ++o)
				for (var i = 0; n > i; ++i)
				if (isDefined(e[o]) && !repairDroid(e[o], !1) && isDefined(t[i]) && Math.ceil(t[i].health) < 100 && (orderDroidLoc(e[o], DORDER_SCOUT, t[i].x, t[i].y), distBetweenTwoPoints(e[o].x, e[o].y, t[i].x, t[i].y) > 6)) {
					orderDroidLoc(e[o], DORDER_MOVE, t[i].x, t[i].y);
					break
				}
			}
		}
	}
}
