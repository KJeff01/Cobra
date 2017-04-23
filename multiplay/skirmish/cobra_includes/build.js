
//Returns all unfinished structures.
function unfinishedStructures() {
	return enumStruct(me).filter(function(struct) {
		return (struct.status !== BUILT) && (struct.stattype !== RESOURCE_EXTRACTOR)
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

//Build a certain number of something
function countAndBuild(stat, count) {
	if (countStruct(stat) < count)
		if (buildStuff(stat))
			return true;
	return false;
}

//Return the best available primary weapon defense strcuture.
function getDefenseStructure() {
	var stats = [];
	var templates = subpersonalities[personality]["primaryWeapon"].defenses;
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

	if(derrs.length) {
		var undefended = [];
		derrs.sort(distanceToBase);

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

	if (isDefined(droid) && !safeDest(me, loc.x, loc.y)) {
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
		var freeTrucks = [];
		for(var x = 0; x < construct.length; x++) {
			if (conCanHelp(construct[x], construct[x].x, construct[x].y)) {
				freeTrucks.push(construct[x]);
			}
		}

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

//Check for unfinshed structures and help complete them.
function checkUnfinishedStructures() {
	var struct = unfinishedStructures();
	var breakOut = enumFeature(-1, oilResources).length;

	if(struct.length > 0) {
		var trucks = enumDroid(me, DROID_CONSTRUCT).filter(function(obj){
			return conCanHelp(obj, struct[0].x, struct[0].y)
		});

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
			safe.filter(function(obj) { return (obj.type === DROID)
				|| ((obj.type === STRUCTURE) && ((obj.stattype !== WALL)))
			});
			if (!safe.length && conCanHelp(droids[j], oils[i + s].x, oils[i + s].y)
				&& droidCanReach(droids[j], oils[i + s].x, oils[i + s].y)) {
				droids[j].busy = true;
				orderDroidBuild(droids[j], DORDER_BUILD, structures.derricks, oils[i + s].x, oils[i + s].y);
				s += 1;
			}
		}
	}
}

//Build either air defenses at the base or defend a derrick.
function buildDefenses() {
	if((playerPower(me) < 90)) {
		return false;
	}

	var enemyVtolCount = countEnemyVTOL();
	if(enemyVtolCount) {
		if(isStructureAvailable("AASite-QuadRotMg")) {
			if(countAndBuild("AASite-QuadRotMg", Math.floor(enemyVtolCount / 2))) {
				return true;
			}
		}
		else {
			if(isStructureAvailable("AASite-QuadMg1")) {
				if(countAndBuild("AASite-QuadMg1", Math.floor(enemyVtolCount / 2))) {
					return true;
				}
			}
		}
	}

	if(protectUnguardedDerricks()) {
		return true;
	}

	return false;
}

//Build the basics when available.
function buildPhase1() {

	//if a hover map without land enemies, then build research labs first to get to hover propulsion even faster
	if(!forceHover || seaMapWithLandEnemy) {
		if(countAndBuild(structures.factories, 1)) {
			return true;
		}

		if(!researchComplete && countAndBuild(structures.labs, 1)) {
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

	if (((countStruct(structures.derricks) - (countStruct(structures.gens) * 4)) > 0)
		&& isStructureAvailable(structures.gens))
	{
		if(countAndBuild(structures.gens, countStruct(structures.gens) + 1)) {
			return true;
		}
	}

	return false;
}

//Build five research labs and three tank factories.
function buildPhase2() {
	if(!countStruct(structures.gens)) {
		return true;
	}

	if(playerPower(me) > 80) {
		if(!researchComplete && countAndBuild(structures.labs, 3)) {
			return true;
		}

		if(countAndBuild(structures.factories, 3)) {
			return true;
		}

		if(!researchComplete && (getRealPower() > -50) && countAndBuild(structures.labs, 5)) {
			return true;
		}

		if (!turnOffCyborgs && isStructureAvailable(structures.templateFactories)) {
			if (componentAvailable("Body11ABT") && countAndBuild(structures.templateFactories, 2)) {
				return true;
			}
		}
	}

	return false;
}

//Build the minimum vtol factories and maximum ground/cyborg factories.
function buildPhase3() {
	if(!componentAvailable("Body11ABT") || (getRealPower() < -200) || (countStruct(structures.derricks) <= 7)) {
		return true;
	}

	if(playerPower(me) > 100) {
		if (isStructureAvailable(structures.vtolFactories)) {
			if (countAndBuild(structures.vtolFactories, 2)) {
				return true;
			}
		}

		/*
		if(isStructureAvailable("A0ComDroidControl")) {
			if(countAndBuild("A0ComDroidControl", 1)) {
				return true;
			}
		}
		*/

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

//Finish building all vtol factories and repairs.
function buildPhase4() {
	if ((countStruct(structures.derricks) >= 10) && (getRealPower() > -200) && isStructureAvailable(structures.vtolFactories))
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
function buildPhase5() {
	if((playerPower(me) > 150) && isStructureAvailable(structures.extras[1])) {
		if(!countStruct(structures.extras[1]) && countAndBuild(structures.extras[1], 1)) {
			return true;
		}
	}

	if((playerPower(me) > 150) && isStructureAvailable(structures.extras[2])) {
		if(!countStruct(structures.extras[2]) && countAndBuild(structures.extras[2], 1)) {
			return true;
		}
	}

	return false;
}

//Build the minimum repairs and any vtol pads.
function buildExtras() {
	if(!isStructureAvailable("A0PowMod1")) {
		return false;
	}

	//At least have two repair facilities.
	if(isStructureAvailable(structures.extras[0])) {
		if(countAndBuild(structures.extras[0], 2)) {
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
	if(recycleObsoleteDroids()) { return false; }
	if(checkUnfinishedStructures()) { return false; }
	if(buildPhase1()) { return false; }
	if(((!turnOffMG && (gameTime > 80000)) || turnOffMG) && maintenance()) { return false; }
	lookForOil();
	if(getRealPower() < -600) { return false; }
	if(buildExtras()) { return false; }
	if(buildPhase2()) { return false; }
	if(buildDefenses()) { return false; }
	if(buildPhase3()) { return false; }
	if(buildPhase4()) { return false; }
	if(buildPhase5()) { return false; }
}

//Check if a building has modules to be built
function maintenance() {
	const list = ["A0PowMod1", "A0ResearchModule1", "A0FacMod1", "A0FacMod1"];
	const mods = [1, 1, 2, 2]; //Number of modules paired with list above
	var struct = null, module = "", structList = [];

	if(countStruct(structures.derricks) < 4) { return false; }

	for (var i = 0; i < list.length; ++i) {
		if (isStructureAvailable(list[i]) && (struct == null)) {
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
						if((i === 2) && (getRealPower() < -200) && !componentAvailable("Body11ABT")) {
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

		//Force the closest truck to upgrade the structure.
		var trucks = enumDroid(me, DROID_CONSTRUCT).filter(function(tr) {
			return conCanHelp(tr, struct.x, struct.y)
		});
		trucks.sort(distanceToBase);

		if(isDefined(trucks[0])) {
			trucks[0].busy = false;
		}

		if(buildStuff(struct, module)) {
			return true;
		}
	}

	return false;
}
