
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
	var droidlist = [];

	for (var i = 0; i < builders.length; i++)
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

	for (var i = 0; i < droidList.length; i++)
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
	if (countStruct(stat) < count)
		if (buildStuff(stat))
			return true;
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

	if(derrs.length) {
		var undefended = [];
		derrs = sortAndReverseDistance(derrs);

		for(var i = 0; i < derrs.length; ++i) {
			var found = false;
			var objects = enumRange(derrs[i].x, derrs[i].y, 8, me, false);

			for(var c = 0; c < objects.length; ++c) {
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

		if(freeTrucks.length > 0) {
			freeTrucks.sort(distanceToBase);
			var truck = freeTrucks[random(freeTrucks.length)];

			if(isDefined(struc) && isDefined(module) && isDefined(truck)) {
				if(orderDroidBuild(truck, DORDER_BUILD, module, struc.x, struc.y))
					return true;
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
	var s = 0;
	const SAFE_RANGE = (gameTime < 210000) ? 10 : 5;

	if ((droids.length <= 1) || !oils.length) {
		return;
	}

	oils.sort(distanceToBase); // grab closer oils first
	droids.sort(distanceToBase);

	for (var i = 0; i < oils.length; i++) {
		for (var j = 0; j < droids.length - (1 * (gameTime > 110000)); j++) {
			if(i + s >= oils.length)
				break;

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
	var vtolCount = countEnemyVTOL();

	for(var i = aaType.length - 1; i >= 0; --i) {
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

	for(var i = 1; i < structures.extras.length; ++i) {
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
	var struct = null, module = "", structList = [];

	if(countStruct(structures.derricks) < 4) {
		return false;
	}

	for (var i = 0; i < list.length; ++i) {
		if (isStructureAvailable(list[i]) && (struct === null)) {
			switch(i) {
				case 0: { structList = enumStruct(me, structures.gens).sort(distanceToBase);  break; }
				case 1: { structList = enumStruct(me, structures.labs).sort(distanceToBase);  break; }
				case 2: { structList = enumStruct(me, structures.factories).sort(distanceToBase);  break; }
				case 3: { structList = enumStruct(me, structures.vtolFactories).sort(distanceToBase);  break; }
				default: { break; }
			}

			for (var c = 0; c < structList.length; ++c) {
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
