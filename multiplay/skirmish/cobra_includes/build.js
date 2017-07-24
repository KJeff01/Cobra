
//Determine if this is a constructor droid. Specify and optional second paramter
//to find combat engineers.
function isConstruct(obj, countCybEng) {
	if((obj.droidType === DROID_SENSOR) || (obj.droidType === DROID_REPAIR) || (obj.droidType === DROID_COMMAND)) {
		return false;
	}

	if(!isDefined(countCybEng)) {
		countCybEng = false;
	}

	return ((obj.droidType === DROID_CONSTRUCT) || (countCybEng && !isDefined(obj.weapons[0])));
}

//Returns unfinished structures that are not defenses or derricks.
function unfinishedStructures() {
	const SAFE_DIST = 20;
	const BASE = startPositions[me];
	return enumStruct(me).filter(function(str) {
		return (str.status !== BUILT
			&& (str.stattype !== RESOURCE_EXTRACTOR
			|| (str.stattype === DEFENSE
			&& distBetweenTwoPoints(BASE.x, BASE.y, str.x, str.y) < SAFE_DIST))
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

//Return all idle construts. Specify the second param to return only the numberof free trucks.
function findIdleTrucks(number) {
	var builders = enumGroup(constructGroup);
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
//TODO: Probably a good idea to use artillery emplacements later.
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

//Check for unfinished structures and help complete them.
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
	var droids = enumGroup(constructGroup);
	var oils = enumFeature(-1, oilResources).sort(distanceToBase); // grab closer oils first
	var s = 0;
	var success = false;
	const SAFE_RANGE = 6;

	if(!componentAvailable("hover01")) {
		oils = oils.slice(0, Math.ceil(oils.length / 2)); // first half
	}

	var cacheOils = oils.length;
	var cacheDroids = droids.length;

	if ((cacheDroids > 1) && cacheOils) {
		droids = droids.sort(distanceToBase);

		for (var i = 0; i < cacheOils; i++) {
			for (var j = 0; j < cacheDroids - (gameTime < 10000); j++) {
				if(i + s >= cacheOils) {
					break;
				}

				var safe = enumRange(oils[i + s].x, oils[i + s].y, SAFE_RANGE, ENEMIES, false);
				safe = safe.filter(isUnsafeEnemyObject);
				if (!isDefined(safe[0]) && conCanHelp(droids[j], oils[i + s].x, oils[i + s].y)) {
					orderDroidBuild(droids[j], DORDER_BUILD, structures.derricks, oils[i + s].x, oils[i + s].y);
					droids[j].busy = true;
					s += 1;
					success = true;
				}
			}
		}
	}

	return success;
}

// Build CB, Wide-Spectrum, radar detector, or ECM.
// TODO: Find a way to space these out.
function buildSensors() {
	const CB_TOWER = "Sys-CB-Tower01";
	const WS_TOWER = "Sys-SensoTowerWS";
	const RADAR_DETECTOR = "Sys-RadarDetector01";
	const ECM = "ECM1PylonMk1";

	if(isStructureAvailable(CB_TOWER)) {
		//Or try building wide spectrum towers.
		if(isStructureAvailable(WS_TOWER)) {
			if(countAndBuild(WS_TOWER, 2)) {
				return true;
			}
		}
		else {
			if(countAndBuild(CB_TOWER, 2)) {
				return true;
			}
		}
	}

	if(countAndBuild(RADAR_DETECTOR, 1)) {
		return true;
	}

	if(countAndBuild(ECM, 3)) {
		return true;
	}
}

//Builds an AA site for the personality. It will always use stormbringer AA
//once available.
function buildAAForPersonality() {
	var vtolCount = countEnemyVTOL();

	//Use stormbringer if we have it.
	if(isStructureAvailable("P0-AASite-Laser")) {
		if(countAndBuild("P0-AASite-Laser", Math.floor(vtolCount / 3))) {
			return true;
		}
	}
	else {
		var aaType = subpersonalities[personality].antiAir.defenses;

		for(var i = aaType.length - 1; i >= 0; --i) {
			if(isStructureAvailable(aaType[i].stat)) {
				if(countAndBuild(aaType[i].stat, Math.floor(vtolCount / 3))) {
					return true;
				}
			}
		}
	}

	return false;
}

//Build defense systems.
function buildDefenses() {
	const MIN_POWER = -40;

	if(getRealPower() > MIN_POWER) {
		if(buildSensors()) {
			return true;
		}

		if(protectUnguardedDerricks()) {
			return true;
		}
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
		if(countAndBuild(FACTORY, 1)) {
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

//Build at least one of each factory and then pursue the favorite factory.
function factoryBuildOrder() {
	const MIN_POWER = -50;
	if(getRealPower() < MIN_POWER) {
		return false;
	}

	for(var x = 0; x < 2; ++x) {
		var num = (!x) ? 1 : 5;

		for(var i = 0; i < 3; ++i) {
			var fac = subpersonalities[personality].factoryOrder[i];

			if(!((fac === CYBORG_FACTORY) && turnOffCyborgs && !forceHover)) {
				if(isStructureAvailable(fac) && countAndBuild(fac, num)) {
					return true;
				}
			}
		}
	}

	return false;
}

//Build all research labs and one of each factory and pursue the decided factory order.
//Build repair bays when possible.
function buildPhase2() {
	const MIN_POWER = -50;
	const MIN_TIME = 190000;
	if(!countStruct(structures.gens) || (getRealPower() < MIN_POWER)) {
		return true;
	}

	if(!researchComplete && countAndBuild(structures.labs, 3)) {
		return true;
	}

	if(countAndBuild(FACTORY, 2)) {
		return true;
	}

	if(gameTime > MIN_TIME) {
		if(!researchComplete && countAndBuild(structures.labs, 5)) {
			return true;
		}

		if (!random(2) && factoryBuildOrder())
		{
			return true;
		}

		if(isStructureAvailable(structures.extras[0])) {
			if(countAndBuild(structures.extras[0], 5)) {
				return true;
			}
		}
	}

	return false;
}

//AA sites and Laser satellite/uplink center
function buildSpecialStructures() {
	if(buildAAForPersonality()) {
		return true;
	}

	for(var i = 1, l = structures.extras.length; i < l; ++i) {
		if(isStructureAvailable(structures.extras[i]) && countAndBuild(structures.extras[i], 1)) {
			return true;
		}
	}

	return false;
}

//Build the minimum repairs and any vtol pads.
function buildExtras() {
	if(!isStructureAvailable("A0PowMod1") || (gameTime < 80000)) {
		return false;
	}

	//Build the minimum repair facilities.
	if(isStructureAvailable(structures.extras[0])) {
		if(countAndBuild(structures.extras[0], 1 + (countStruct(structures.gens) > 1))) {
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
	if(maintenance()) { return; }
	if(enemyUnitsInBase()) { return; }
	if(buildSpecialStructures()) { return; }
	if(buildExtras()) { return; }
	if(lookForOil() && random(3)) { return; }
	if(buildPhase2()) { return; }
	if(buildDefenses()) { return; }
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
		if (isStructureAvailable(list[i])) {
			if(struct !== null) {
				break;
			}
			switch(i) {
				case 0: { structList = enumStruct(me, structures.gens).sort(distanceToBase);  break; }
				case 1: { structList = enumStruct(me, structures.labs).sort(distanceToBase);  break; }
				case 2: { structList = enumStruct(me, FACTORY).sort(distanceToBase);  break; }
				case 3: { structList = enumStruct(me, VTOL_FACTORY).sort(distanceToBase);  break; }
				default: { break; }
			}

			for (var c = 0, s = structList.length; c < s; ++c) {
				if (structList[c].modules < mods[i]) {
					//Only build the last factory module if we have a heavy body
					if(structList[c].modules === 1) {
						if((i === 2) && !componentAvailable("Body11ABT")) {
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

	//Make sure to build power module regardless of real power.
	if (struct && (!checkLowPower(50) || (module === list[0]))) {
		if(buildStuff(struct, module)) {
			return true;
		}
	}

	return false;
}
