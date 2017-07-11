
//Returns unfinished structures that are not defenses or derricks.
function unfinishedStructures() {
	const SAFE_DIST = 20;
	return enumStruct(me).filter(function(struct) {
		return (struct.status !== BUILT
			&& (struct.stattype !== RESOURCE_EXTRACTOR
			||(struct.stattype === DEFENSE &&
			   distBetweenTwoPoints(startPositions[me].x, startPositions[me].y, struct.x, struct.y) < SAFE_DIST))
		);
	});
}


//Can a construction droid do something right now.
function conCanHelp(mydroid, bx, by) {
	return (mydroid.order !== DORDER_BUILD
		&& mydroid.order !== DORDER_LINEBUILD
		&& mydroid.order !== DORDER_RECYCLE
		&& mydroid.busy !== true
		&& !repairDroid(mydroid)
		&& droidCanReach(mydroid, bx, by)
	);
}

//Return all idle trucks. Specify a param to return only the numberof free trucks.
function findIdleTrucks(number) {
	var builders = enumDroid(me, DROID_CONSTRUCT);
	var droidlist = [];

	for (var i = 0, s = builders.length; i < s; i++)
	{
		if (conCanHelp(builders[i], startPositions[me].x, startPositions[me].y))
		{
			droidlist.push(builders[i]);
		}
	}

	return isDefined(number) ? droidlist.length : droidlist;
}

// Demolish an object.
function demolishThis(object)
{
	var success = false;
	var droidList = findIdleTrucks();

	for (var i = 0, t = droidList.length; i < t; i++) {
		if(orderDroidObj(droidList[i], DORDER_DEMOLISH, object)) {
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

	for(var i = templates.length - 1; i > 0; --i) {
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

			for(var c = 0, u = objects.length; c < u; ++c) {
				if((objects[c].type === STRUCTURE) && (objects[c].stattype === DEFENSE)) {
					found = true;
					break;
				}
			}

			if(!found) {
				undefended.push(derrs[i]);
			}
		}

		if(isDefined(undefended[0])) {
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
	if(isStructureAvailable(stat, me)) {
		var loc;
		if(isDefined(droid)) {
			if(isDefined(defendThis)) {
				loc = pickStructLocation(droid, stat, defendThis.x, defendThis.y, 1);
			}
			else {
				loc = pickStructLocation(droid, stat, startPositions[me].x, startPositions[me].y, 0);
			}

			if(isDefined(loc)) {
				if(isDefined(droid) && (droid.order !== DORDER_RTB) && !safeDest(me, loc.x, loc.y)) {
					orderDroid(droid, DORDER_RTB);
					return false;
				}
				if(isDefined(droid) && orderDroidBuild(droid, DORDER_BUILD, stat, loc.x, loc.y)) {
					return true;
				}
			}
		}
	}

	return false;
}

//Build some object. Builds modules on structures also.
function buildStuff(struc, module, defendThis) {
	var freeTrucks = findIdleTrucks();
	var cacheTrucks = freeTrucks.length;

	if(cacheTrucks) {
		freeTrucks = freeTrucks.sort(distanceToBase);
		var truck = freeTrucks[0];

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

	return false;
}

//Check for unfinshed structures and help complete them.
function checkUnfinishedStructures() {
	var struct = unfinishedStructures();

	if(isDefined(struct[0])) {
		struct = struct.sort(distanceToBase);
		var trucks = findIdleTrucks();

		if(isDefined(trucks[0])) {
			trucks = trucks.sort(distanceToBase);
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

	if ((cacheDroids > 1) && cacheOils) {
		oils = oils.sort(distanceToBase); // grab closer oils first
		droids = droids.sort(distanceToBase);

		for (var i = 0; i < cacheOils; i++) {
			for (var j = 0; j < cacheDroids; j++) {
				if(i + s >= cacheOils) {
					break;
				}

				var safe = enumRange(oils[i + s].x, oils[i + s].y, SAFE_RANGE, ENEMIES, false);
				safe = safe.filter(isUnsafeEnemyObject);
				if (!isDefined(safe[0]) && conCanHelp(droids[j], oils[i + s].x, oils[i + s].y)) {
					orderDroidBuild(droids[j], DORDER_BUILD, structures.derricks, oils[i + s].x, oils[i + s].y);
					droids[j].busy = true;
					s += 1;
				}
			}
		}
	}
}

// Build CB, Wide-Spectrum, radar detector, or ECM.
// TODO: Find a way to space these out.
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

	if (countAndBuild(RADAR_DETECTOR, 1)) {
		return true;
	}

	if (countAndBuild(ECM, 3)) {
		return true;
	}
}

//Builds an AA site for the personality. It will always use strombringer AA
//once available.
function buildAAForPersonality() {
	var vtolCount = countEnemyVTOL();

	//Use stormbringer if we have it.
	if(isStructureAvailable("P0-AASite-Laser")) {
		if(countAndBuild("P0-AASite-Laser", Math.floor(vtolCount / 2))) {
			return true;
		}
	}
	else {
		var aaType = subpersonalities[personality].antiAir.defenses;

		for(var i = aaType.length - 1; i >= 0; --i) {
			if(isStructureAvailable(aaType[i].stat)) {
				if(countAndBuild(aaType[i].stat, Math.floor(vtolCount / 2))) {
					return true;
				}
			}
		}
	}

	return false;
}

//Build defense systems.
function buildDefenses() {
	const MIN_GAME_TIME = 600000;

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

	if(needPowerGenerator() && countAndBuild(structures.gens, countStruct(structures.gens) + 1)) {
		return true;
	}

	return false;
}

//Build five research labs and three tank factories.
function buildPhase2() {
	const MIN_POWER = -100;
	if(!countStruct(structures.gens) || (getRealPower() < MIN_POWER)) {
		return true;
	}

	var facNum = ((gameTime > 1800000) && (getRealPower() > MIN_POWER)) ? 3 : 2;
	if(!researchComplete && countAndBuild(structures.labs, 3)) {
		return true;
	}

	if(countAndBuild(structures.factories, facNum)) {
		return true;
	}

	if(gameTime < 210000) {
		return true;
	}

	if(!researchComplete && (getRealPower() > -175) && countAndBuild(structures.labs, 5)) {
		return true;
	}

	if (!turnOffCyborgs && isStructureAvailable(structures.templateFactories)) {
		if (componentAvailable("Body11ABT") && countAndBuild(structures.templateFactories, 2)) {
			return true;
		}
	}

	if ((gameTime > 210000) && isStructureAvailable(structures.vtolFactories)) {
		if (countAndBuild(structures.vtolFactories, 2)) {
			return true;
		}
	}

	return false;
}

//Finish building everything
function buildPhase3() {
	const MIN_POWER = -50;

	if (getRealPower() > MIN_POWER) {
		if(isStructureAvailable(structures.extras[0])) {
			if(countAndBuild(structures.extras[0], 5)) {
				return true;
			}
		}

		if (isStructureAvailable(structures.vtolFactories) && countAndBuild(structures.vtolFactories, 5)) {
			return true;
		}

		if(countAndBuild(structures.factories, 5)) {
			return true;
		}

		if (!turnOffCyborgs && isStructureAvailable(structures.templateFactories)) {
			if (countAndBuild(structures.templateFactories, 5)) {
				return true;
			}
		}
	}

	return false;
}

//Laser satellite/uplink center
function buildSpecialStructures() {
	const MIN_POWER = 80;

	for(var i = 1, l = structures.extras.length; i < l; ++i) {
		if((playerPower(me) > MIN_POWER) && isStructureAvailable(structures.extras[i])) {
			if(countAndBuild(structures.extras[i], 1)) {
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
	if(checkUnfinishedStructures()) { return; }
	if(buildPhase1()) { return; }
	if(((!turnOffMG && (gameTime > 80000)) || turnOffMG) && maintenance()) { return; }
	if(enemyUnitsInBase()) { return; }
	if(buildExtras()) { return; }
	if(buildSpecialStructures()) { return; }
	lookForOil();
	if(buildPhase2()) { return; }
	if(buildAAForPersonality()) { return; }
	if((getRealPower() < -300) || (countStruct(structures.derricks) < averageOilPerPlayer())) { return; }
	if(buildPhase3()) { return; }
	if(buildDefenses()) { return; }
}

//Check if a building has modules to be built
function maintenance() {
	const list = ["A0PowMod1", "A0ResearchModule1", "A0FacMod1", "A0FacMod1"];
	const mods = [1, 1, 2, 2]; //Number of modules paired with list above
	var cacheList = list.length;
	var struct = null, module = "", structList = [];

	if(countStruct(structures.derricks) < 5) {
		return false;
	}

	for (var i = 0; i < cacheList; ++i) {
		if (isStructureAvailable(list[i])) {
			if(struct !== null) {
				break;
			}
			switch(i) {
				case 0: { structList = enumStruct(me, structures.gens).sort(distanceToBase);  break; }
				case 1: { structList = enumStruct(me, structures.labs).sort(distanceToBase);  break; }
				case 2: { structList = enumStruct(me, structures.factories).sort(distanceToBase);  break; }
				case 3: { structList = enumStruct(me, structures.vtolFactories).sort(distanceToBase);  break; }
				default: { break; }
			}

			for (var c = 0, s = structList.length; c < s; ++c) {
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
	}

	if (struct && !checkLowPower(50)) {
		if(buildStuff(struct, module)) {
			return true;
		}
	}

	return false;
}
