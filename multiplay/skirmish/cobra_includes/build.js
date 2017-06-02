
if(DEVELOPMENT) {
	//Returns unfinished structures that are not defenses or derricks.
	function unfinishedStructures() {
		return enumStruct(me).filter(function(struct) {
			return (struct.status !== BUILT
				&& struct.stattype !== RESOURCE_EXTRACTOR
				&& struct.stattype !== DEFENSE
			);
		});
	}


	//Can a construction droid do something right now.
	function conCanHelp(mydroid, bx, by) {
		return (mydroid.order !== DORDER_BUILD
			&& mydroid.order !== DORDER_LINEBUILD
			&& mydroid.busy !== true
			&& !repairDroid(mydroid)
			&& droidCanReach(mydroid, bx, by)
		);
	}

	//Return all idle trucks.
	function findIdleTrucks() {
		var builders = enumDroid(me, DROID_CONSTRUCT);
		var cacheBuilders = builders.length;
		var droidlist = [];

		for (var i = 0; i < cacheBuilders; i++)
		{
			if (conCanHelp(builders[i], startPositions[me].x, startPositions[me].y))
			{
				droidlist.push(builders[i]);
			}
		}

		return droidlist;
	}

	// Demolish an object.
	function demolishThis(object)
	{
		var success = false;
		var droidList = findIdleTrucks();
		var cacheDroids = droidList.length;

		for (var i = 0; i < cacheDroids; i++)
		{
			if(orderDroidObj(droidList[i], DORDER_DEMOLISH, object))
			{
				success = true;
			}
		}

		return success;
	}

	//Build a certain number of something
	function countAndBuild(stat, count) {
		if (countStruct(stat) < count) {
			if (buildStuff(stat)) {
				return true;
			}
		}

		return false;
	}

	//Return the best available weapon defense structure.
	function getDefenseStructure() {
		var stats = [];
		var templates = subpersonalities[personality].primaryWeapon.defenses;
		var cacheTemplates = templates.length - 1;

		for(var i = cacheTemplates; i > 0; --i) {
			if(isStructureAvailable(templates[i].stat)) {
				return templates[i].stat;
			}
		}

		//Fallback onto the hmg tower.
		return "GuardTower1";
	}

	//Find the closest derrick that is not guarded by a structure.
	function protectUnguardedDerricks() {
		if(gameTime < 25000) {
			return false;
		}

		var derrs = enumStruct(me, structures.derricks);
		var cacheDerrs = derrs.length;

		if(cacheDerrs) {
			var undefended = [];
			derrs = sortAndReverseDistance(derrs);

			for(var i = 0; i < cacheDerrs; ++i) {
				var found = false;
				var objects = enumRange(derrs[i].x, derrs[i].y, 8, me, false);
				var cacheObjects = objects.length;

				for(var c = 0; c < cacheObjects; ++c) {
					if((objects[c].type === STRUCTURE) && (objects[c].stattype === DEFENSE)) {
						found = true;
						break;
					}
				}

				if(!found) {
					undefended.push(derrs[i]);
				}
			}

			//TODO: Maybe build at multiple undefended derricks...
			if(undefended.length) {
				var undef;
				if(buildStuff(getDefenseStructure(), undef, undefended[0])) {
					return true;
				}
			}
		}

		return false;
	}

	//Find a location to build something within a safe area.
	//the parameter defendThis is used to build something (idealy a defensive strcuture)
	//around what is passed to it.
	function buildStructure(droid, stat, defendThis) {
		if (!isStructureAvailable(stat, me)) {
			return false;
		}

		var loc;

		if(isDefined(droid)) {
			if(isDefined(defendThis)) {
				loc = pickStructLocation(droid, stat, defendThis.x, defendThis.y, 1);
			}
			else {
				loc = pickStructLocation(droid, stat, startPositions[me].x, startPositions[me].y, 0);
			}
		}

		if(!isDefined(loc)) {
			return false;
		}

		if (isDefined(droid) && (droid.order !== DORDER_RTB) && !safeDest(me, loc.x, loc.y)) {
			orderDroid(droid, DORDER_RTB);
			return false;
		}

		if(isDefined(droid) && orderDroidBuild(droid, DORDER_BUILD, stat, loc.x, loc.y)) {
			return true;
		}
		return false;
	}

	//Build some object. Builds modules on structures also.
	function buildStuff(struc, module, defendThis) {
		var construct = enumDroid(me, DROID_CONSTRUCT);

		if (construct.length > 0) {
			var freeTrucks = findIdleTrucks();
			var cacheTrucks = freeTrucks.length;

			if(cacheTrucks) {
				freeTrucks.sort(distanceToBase);
				var truck = freeTrucks[random(cacheTrucks)];

				if(isDefined(struc) && isDefined(module) && isDefined(truck)) {
					if(orderDroidBuild(truck, DORDER_BUILD, module, struc.x, struc.y)) {
						return true;
					}
				}
				if(isDefined(truck) && isDefined(struc)) {
					if(isDefined(defendThis)) {
						if(buildStructure(truck, struc, defendThis)) {
							return true;
						}
					}
					else {
						if(buildStructure(truck, struc)) {
							return true;
						}
					}
				}
			}
		}
		return false;
	}

	//Check for unfinshed structures and help complete them. countDefense merely
	//needs to be defined to check on defense structure status.
	function checkUnfinishedStructures() {
		var struct = unfinishedStructures();

		if(struct.length > 0) {
			struct.sort(distanceToBase);
			var trucks = findIdleTrucks();

			if(trucks.length > 0) {
				trucks.sort(distanceToBase);
				if (orderDroidObj(trucks[0], DORDER_HELPBUILD, struct[0])) {
					return true;
				}
			}
		}

		return false;
	}

	//Look for oil.
	function lookForOil() {
		var droids = enumDroid(me, DROID_CONSTRUCT);
		var oils = enumFeature(-1, oilResources);
		var cacheDroids = droids.length;
		var cacheOils = oils.length;
		var s = 0;
		const SAFE_RANGE = (gameTime < 210000) ? 10 : 5;

		if ((cacheDroids <= 1) || !cacheOils) {
			return;
		}

		oils.sort(distanceToBase); // grab closer oils first
		droids.sort(distanceToBase);

		for (var i = 0; i < cacheOils; i++) {
			for (var j = 0; j < cacheDroids - (1 * (gameTime > 110000)); j++) {
				if(i + s >= cacheOils) {
					break;
				}

				var safe = enumRange(oils[i + s].x, oils[i + s].y, SAFE_RANGE, ENEMIES, false);
				safe.filter(isUnsafeEnemyObject);
				if (!safe.length && conCanHelp(droids[j], oils[i + s].x, oils[i + s].y)) {
					orderDroidBuild(droids[j], DORDER_BUILD, structures.derricks, oils[i + s].x, oils[i + s].y);
					droids[j].busy = true;
					s += 1;
				}
			}
		}
	}

	// Build CB, Wide-Spectrum, radar detector, or ECM
	function buildSensors() {
		const CB_TOWER = "Sys-CB-Tower01";
		const WS_TOWER = "Sys-SensoTowerWS";
		const RADAR_DETECTOR = "Sys-RadarDetector01";
		const ECM = "ECM1PylonMk1";

		if (isStructureAvailable(CB_TOWER)) {
			// Or try building wide spectrum towers.
			if (isStructureAvailable(WS_TOWER)) {
				if (countAndBuild(WS_TOWER, 2)) {
					return true;
				}
			}
			else {
				if (countAndBuild(CB_TOWER, 2)) {
					return true;
				}
			}
		}

		if (countAndBuild(RADAR_DETECTOR, 2)) {
			return true;
		}

		if (countAndBuild(ECM, 3)) {
			return true;
		}
	}

	//TODO: maybe call eventResearched with the res for the stat if it does not have it.
	function buildAAForPersonality() {
		var aaType = subpersonalities[personality].antiAir.defenses;
		var cacheAA = aaType.length - 1;
		var vtolCount = countEnemyVTOL();

		for(var i = cacheAA; i >= 0; --i) {
			if(isStructureAvailable(aaType[i].stat)) {
				if(countAndBuild(aaType[i].stat, Math.floor(vtolCount / 2))) {
					return true;
				}
			}
		}

		//Laser AA needs this.
		if((returnAntiAirAlias() === "las") && !isStructureAvailable("P0-AASite-Laser")) {
			if(isStructureAvailable("QuadRotAAGun") && countAndBuild("QuadRotAAGun", Math.floor(vtolCount / 2))) {
				return true;
			}
		}

		return false;
	}

	//Build defense systems.
	function buildDefenses() {
		const MIN_GAME_TIME = 600000;

		if(buildAAForPersonality()) {
			return true;
		}

		if(protectUnguardedDerricks()) {
			return true;
		}

		if((gameTime > MIN_GAME_TIME) && buildSensors()) {
			return true;
		}

		return false;
	}

	//Determine if we need a generator.
	function needPowerGenerator() {
		return ((countStruct(structures.derricks) - (countStruct(structures.gens) * 4)) > 0);
	}

	//Build the basics when available.
	function buildPhase1() {

		//if a hover map without land enemies, then build research labs first to get to hover propulsion even faster
		if(!forceHover || seaMapWithLandEnemy) {
			if(countAndBuild(structures.factories, 1)) {
				return true;
			}

			var res = (baseType !== CAMP_CLEAN) ? 2 : 1;
			if(!researchComplete && countAndBuild(structures.labs, res)) {
				return true;
			}

			if(countAndBuild(structures.hqs, 1)) {
				return true;
			}
		}
		else {
			if(!researchComplete && countAndBuild(structures.labs, 2)) {
				return true;
			}

			if(countAndBuild(structures.hqs, 1)) {
				return true;
			}
		}

		if (needPowerGenerator() && isStructureAvailable(structures.gens)) {
			if(countAndBuild(structures.gens, countStruct(structures.gens) + 1)) {
				return true;
			}
		}

		return false;
	}

	//Build five research labs and three tank factories.
	function buildPhase2() {
		const MIN_POWER = -200;
		if(!countStruct(structures.gens) || (getRealPower() < MIN_POWER)) {
			return true;
		}

		if(!researchComplete && countAndBuild(structures.labs, 3)) {
			return true;
		}

		var facNum = (getRealPower() > MIN_POWER) ? 3 : 2;

		if(countAndBuild(structures.factories, facNum)) {
			return true;
		}

		if(gameTime < 210000) {
			return true;
		}

		if(!researchComplete && (getRealPower() > -450) && countAndBuild(structures.labs, 5)) {
			return true;
		}

		if (!turnOffCyborgs && isStructureAvailable(structures.templateFactories)) {
			if (componentAvailable("Body11ABT") && countAndBuild(structures.templateFactories, 2)) {
				return true;
			}
		}

		return false;
	}

	//Build the minimum vtol factories and maximum ground/cyborg factories.
	function buildPhase3() {
		const MIN_POWER = -180;

		if(!componentAvailable("Body11ABT") || (getRealPower() < MIN_POWER) || (gameTime < 210000)) {
			return true;
		}

		if (isStructureAvailable(structures.vtolFactories)) {
			if (countAndBuild(structures.vtolFactories, 2)) {
				return true;
			}
		}

		if(countAndBuild(structures.factories, 5)) {
			return true;
		}

		if (!turnOffCyborgs && isStructureAvailable(structures.templateFactories)) {
			if (countAndBuild(structures.templateFactories, 5)) {
				return true;
			}
		}

		return false;
	}

	//Finish building all vtol factories and repairs.
	function buildPhase4() {
		const MIN_POWER = -50;
		if ((getRealPower() > MIN_POWER) && isStructureAvailable(structures.vtolFactories))
		{
			if(isStructureAvailable(structures.extras[0])) {
				if(countAndBuild(structures.extras[0], 5)) {
					return true;
				}
			}
			if (countAndBuild(structures.vtolFactories, 5)) {
				return true;
			}
		}

		return false;
	}

	//Laser satellite/uplink center
	function buildSpecialStructures() {
		const MIN_POWER = 150;
		var cacheStructs = structures.extras.length;

		for(var i = 1; i < cacheStructs; ++i) {
			if((playerPower(me) > MIN_POWER) && isStructureAvailable(structures.extras[i])) {
				if(!countStruct(structures.extras[i]) && countAndBuild(structures.extras[i], 1)) {
					return true;
				}
			}
		}

		return false;
	}

	//Build the minimum repairs and any vtol pads.
	function buildExtras() {
		if(!isStructureAvailable("A0PowMod1") || (gameTime < 80000)) {
			return false;
		}

		//Build repair facilities based upon generator count.
		if(isStructureAvailable(structures.extras[0])) {
			var limit = (getRealPower() > -50) ? countStruct(structures.gens) : 1;
			if(limit > 2) {
				limit = 2;
			}
			if(countAndBuild(structures.extras[0], limit)) {
				return true;
			}
		}

		var needVtolPads = ((2 * countStruct(structures.vtolPads)) < enumGroup(vtolGroup).length);
		if(isStructureAvailable(structures.vtolPads) && (needVtolPads && buildStuff(structures.vtolPads))) {
			return true;
		}
	}

	//Cobra's unique build decisions
	function buildOrder() {
		if(recycleObsoleteDroids()) { return; }
		if(checkUnfinishedStructures()) { return; }
		if(buildPhase1()) { return; }
		if(((!turnOffMG && (gameTime > 80000)) || turnOffMG) && maintenance()) { return; }
		if(buildExtras()) { return; }
		lookForOil();
		if(buildPhase2()) { return; }
		if(getRealPower() < -300) { return; }
		if(buildDefenses()) { return; }
		if(buildSpecialStructures()) { return; }
		if(buildPhase3()) { return; }
		if(buildPhase4()) { return; }
	}

	//Check if a building has modules to be built
	function maintenance() {
		const list = ["A0PowMod1", "A0ResearchModule1", "A0FacMod1", "A0FacMod1"];
		const mods = [1, 1, 2, 2]; //Number of modules paired with list above
		var cacheList = list.length;
		var struct = null, module = "", structList = [];

		if(countStruct(structures.derricks) < 4) {
			return false;
		}

		for (var i = 0; i < cacheList; ++i) {
			if (isStructureAvailable(list[i]) && (struct === null)) {
				switch(i) {
					case 0: { structList = enumStruct(me, structures.gens).sort(distanceToBase);  break; }
					case 1: { structList = enumStruct(me, structures.labs).sort(distanceToBase);  break; }
					case 2: { structList = enumStruct(me, structures.factories).sort(distanceToBase);  break; }
					case 3: { structList = enumStruct(me, structures.vtolFactories).sort(distanceToBase);  break; }
					default: { break; }
				}

				var cacheStructs = structList.length;
				for (var c = 0; c < cacheStructs; ++c) {
					if (structList[c].modules < mods[i]) {
						//Only build the last factory module if we have a heavy body
						if(structList[c].modules === 1) {
							if((i === 2) && (getRealPower() < -50) && !componentAvailable("Body11ABT")) {
								continue;
							}
							//Build last vtol factory module once Cobra gets retribution (or has good power levels)
							if((i === 3) && (getRealPower() < -200) && !componentAvailable("Body7ABT")) {
								continue;
							}
						}
						struct = structList[c];
						module = list[i];
						break;
					}
				}
			}
			else {
				break;
			}
		}

		if (struct && !checkLowPower(35) ) {
			if(buildStuff(struct, module)) {
				return true;
			}
		}

		return false;
	}
}
else {
	function unfinishedStructures() {
		return enumStruct(me).filter(function(e) {
			return e.status !== BUILT && e.stattype !== RESOURCE_EXTRACTOR && e.stattype !== DEFENSE
		})
	}

	function conCanHelp(e, t, r) {
		return e.order !== DORDER_BUILD && e.order !== DORDER_LINEBUILD && e.busy !== !0 && !repairDroid(e) && droidCanReach(e, t, r)
	}

	function findIdleTrucks() {
		for (var e = enumDroid(me, DROID_CONSTRUCT), t = e.length, r = [], u = 0; t > u; u++) conCanHelp(e[u], startPositions[me].x, startPositions[me].y) && r.push(e[u]);
		return r
	}

	function demolishThis(e) {
		for (var t = !1, r = findIdleTrucks(), u = r.length, n = 0; u > n; n++) orderDroidObj(r[n], DORDER_DEMOLISH, e) && (t = !0);
		return t
	}

	function countAndBuild(e, t) {
		return countStruct(e) < t && buildStuff(e) ? !0 : !1
	}

	function getDefenseStructure() {
		for (var e = subpersonalities[personality].primaryWeapon.defenses, t = e.length - 1, r = t; r > 0; --r)
		if (isStructureAvailable(e[r].stat)) return e[r].stat;
		return "GuardTower1"
	}

	function protectUnguardedDerricks() {
		if (gameTime < 25e3) return !1;
		var e = enumStruct(me, structures.derricks),
		t = e.length;
		if (t) {
			var r = [];
			e = sortAndReverseDistance(e);
			for (var u = 0; t > u; ++u) {
				for (var n = !1, s = enumRange(e[u].x, e[u].y, 8, me, !1), i = s.length, o = 0; i > o; ++o)
				if (s[o].type === STRUCTURE && s[o].stattype === DEFENSE) {
					n = !0;
					break
				}
				n || r.push(e[u])
			}
			if (r.length) {
				var c;
				if (buildStuff(getDefenseStructure(), c, r[0])) return !0
			}
		}
		return !1
	}

	function buildStructure(e, t, r) {
		if (!isStructureAvailable(t, me)) return !1;
		var u;
		return isDefined(e) && (u = isDefined(r) ? pickStructLocation(e, t, r.x, r.y, 1) : pickStructLocation(e, t, startPositions[me].x, startPositions[me].y, 0)), isDefined(u) ? isDefined(e) && e.order !== DORDER_RTB && !safeDest(me, u.x, u.y) ? (orderDroid(e, DORDER_RTB), !1) : isDefined(e) && orderDroidBuild(e, DORDER_BUILD, t, u.x, u.y) ? !0 : !1 : !1
	}

	function buildStuff(e, t, r) {
		var u = enumDroid(me, DROID_CONSTRUCT);
		if (u.length > 0) {
			var n = findIdleTrucks(),
			s = n.length;
			if (s) {
				n.sort(distanceToBase);
				var i = n[random(s)];
				if (isDefined(e) && isDefined(t) && isDefined(i) && orderDroidBuild(i, DORDER_BUILD, t, e.x, e.y)) return !0;
				if (isDefined(i) && isDefined(e))
				if (isDefined(r)) {
					if (buildStructure(i, e, r)) return !0
				} else if (buildStructure(i, e)) return !0
			}
		}
		return !1
	}

	function checkUnfinishedStructures() {
		var e = unfinishedStructures();
		if (e.length > 0) {
			e.sort(distanceToBase);
			var t = findIdleTrucks();
			if (t.length > 0 && (t.sort(distanceToBase), orderDroidObj(t[0], DORDER_HELPBUILD, e[0]))) return !0
		}
		return !1
	}

	function lookForOil() {
		var e = enumDroid(me, DROID_CONSTRUCT),
		t = enumFeature(-1, oilResources),
		r = e.length,
		u = t.length,
		n = 0;
		const s = gameTime < 21e4 ? 10 : 5;
		if (!(1 >= r) && u) {
			t.sort(distanceToBase), e.sort(distanceToBase);
			for (var i = 0; u > i; i++)
			for (var o = 0; o < r - 1 * (gameTime > 11e4) && !(i + n >= u); o++) {
				var c = enumRange(t[i + n].x, t[i + n].y, s, ENEMIES, !1);
				c.filter(isUnsafeEnemyObject), !c.length && conCanHelp(e[o], t[i + n].x, t[i + n].y) && (orderDroidBuild(e[o], DORDER_BUILD, structures.derricks, t[i + n].x, t[i + n].y), e[o].busy = !0, n += 1)
			}
		}
	}

	function buildSensors() {
		const e = "Sys-CB-Tower01",
		t = "Sys-SensoTowerWS",
		r = "Sys-RadarDetector01",
		u = "ECM1PylonMk1";
		if (isStructureAvailable(e))
		if (isStructureAvailable(t)) {
			if (countAndBuild(t, 2)) return !0
		} else if (countAndBuild(e, 2)) return !0;
		return countAndBuild(r, 2) ? !0 : countAndBuild(u, 3) ? !0 : void 0
	}

	function buildAAForPersonality() {
		for (var e = subpersonalities[personality].antiAir.defenses, t = e.length - 1, r = countEnemyVTOL(), u = t; u >= 0; --u)
		if (isStructureAvailable(e[u].stat) && countAndBuild(e[u].stat, Math.floor(r / 2))) return !0;
		return "las" === returnAntiAirAlias() && !isStructureAvailable("P0-AASite-Laser") && isStructureAvailable("QuadRotAAGun") && countAndBuild("QuadRotAAGun", Math.floor(r / 2)) ? !0 : !1
	}

	function buildDefenses() {
		const e = 6e5;
		return buildAAForPersonality() ? !0 : protectUnguardedDerricks() ? !0 : gameTime > e && buildSensors() ? !0 : !1
	}

	function needPowerGenerator() {
		return countStruct(structures.derricks) - 4 * countStruct(structures.gens) > 0
	}

	function buildPhase1() {
		if (!forceHover || seaMapWithLandEnemy) {
			if (countAndBuild(structures.factories, 1)) return !0;
			var e = baseType !== CAMP_CLEAN ? 2 : 1;
			if (!researchComplete && countAndBuild(structures.labs, e)) return !0;
			if (countAndBuild(structures.hqs, 1)) return !0
		} else {
			if (!researchComplete && countAndBuild(structures.labs, 2)) return !0;
			if (countAndBuild(structures.hqs, 1)) return !0
		}
		return needPowerGenerator() && isStructureAvailable(structures.gens) && countAndBuild(structures.gens, countStruct(structures.gens) + 1) ? !0 : !1
	}

	function buildPhase2() {
		const e = -200;
		if (!countStruct(structures.gens) || getRealPower() < e) return !0;
		if (!researchComplete && countAndBuild(structures.labs, 3)) return !0;
		var t = getRealPower() > e ? 3 : 2;
		return countAndBuild(structures.factories, t) ? !0 : gameTime < 21e4 ? !0 : !researchComplete && getRealPower() > -450 && countAndBuild(structures.labs, 5) ? !0 : !turnOffCyborgs && isStructureAvailable(structures.templateFactories) && componentAvailable("Body11ABT") && countAndBuild(structures.templateFactories, 2) ? !0 : !1
	}

	function buildPhase3() {
		const e = -180;
		return !componentAvailable("Body11ABT") || getRealPower() < e || gameTime < 21e4 ? !0 : isStructureAvailable(structures.vtolFactories) && countAndBuild(structures.vtolFactories, 2) ? !0 : countAndBuild(structures.factories, 5) ? !0 : !turnOffCyborgs && isStructureAvailable(structures.templateFactories) && countAndBuild(structures.templateFactories, 5) ? !0 : !1
	}

	function buildPhase4() {
		const e = -50;
		if (getRealPower() > e && isStructureAvailable(structures.vtolFactories)) {
			if (isStructureAvailable(structures.extras[0]) && countAndBuild(structures.extras[0], 5)) return !0;
			if (countAndBuild(structures.vtolFactories, 5)) return !0
		}
		return !1
	}

	function buildSpecialStructures() {
		const e = 150;
		for (var t = structures.extras.length, r = 1; t > r; ++r)
		if (playerPower(me) > e && isStructureAvailable(structures.extras[r]) && !countStruct(structures.extras[r]) && countAndBuild(structures.extras[r], 1)) return !0;
		return !1
	}

	function buildExtras() {
		if (!isStructureAvailable("A0PowMod1") || gameTime < 8e4) return !1;
		if (isStructureAvailable(structures.extras[0])) {
			var e = getRealPower() > -50 ? countStruct(structures.gens) : 1;
			if (e > 2 && (e = 2), countAndBuild(structures.extras[0], e)) return !0
		}
		var t = 2 * countStruct(structures.vtolPads) < enumGroup(vtolGroup).length;
		return isStructureAvailable(structures.vtolPads) && t && buildStuff(structures.vtolPads) ? !0 : void 0
	}

	function buildOrder() {
		recycleObsoleteDroids() || checkUnfinishedStructures() || buildPhase1() || (!turnOffMG && gameTime > 8e4 || turnOffMG) && maintenance() || buildExtras() || (lookForOil(), buildPhase2() || getRealPower() < -300 || buildDefenses() || buildSpecialStructures() || buildPhase3() || buildPhase4())
	}

	function maintenance() {
		const e = ["A0PowMod1", "A0ResearchModule1", "A0FacMod1", "A0FacMod1"],
		t = [1, 1, 2, 2];
		var r = e.length,
		u = null,
		n = "",
		s = [];
		if (countStruct(structures.derricks) < 4) return !1;
		for (var i = 0; r > i && (isStructureAvailable(e[i]) && null === u); ++i) {
			switch (i) {
				case 0:
				s = enumStruct(me, structures.gens).sort(distanceToBase);
				break;
				case 1:
				s = enumStruct(me, structures.labs).sort(distanceToBase);
				break;
				case 2:
				s = enumStruct(me, structures.factories).sort(distanceToBase);
				break;
				case 3:
				s = enumStruct(me, structures.vtolFactories).sort(distanceToBase)
			}
			for (var o = s.length, c = 0; o > c; ++c)
			if (s[c].modules < t[i]) {
				if (1 === s[c].modules) {
					if (2 === i && getRealPower() < -50 && !componentAvailable("Body11ABT")) continue;
					if (3 === i && getRealPower() < -200 && !componentAvailable("Body7ABT")) continue
				}
				u = s[c], n = e[i];
				break
			}
		}
		return u && !checkLowPower(35) && buildStuff(u, n) ? !0 : !1
	}
}
