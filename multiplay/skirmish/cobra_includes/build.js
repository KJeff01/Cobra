
//Determine if we need a generator.
function needPowerGenerator()
{
	function uncached()
	{
		return ((countStruct(structures.derricks) - (countStruct(structures.gens) * 4)) > 0);
	}

	return cacheThis(uncached, [], undefined, 8000);
}

//Determine if this is a constructor droid. Specify and optional second paramter
//to find combat engineers.
function isConstruct(obj, countCybEng)
{
	if ((obj.droidType === DROID_SENSOR) || (obj.droidType === DROID_REPAIR) || (obj.droidType === DROID_COMMAND))
	{
		return false;
	}

	if (!isDefined(countCybEng))
	{
		countCybEng = false;
	}

	return ((obj.droidType === DROID_CONSTRUCT) || (countCybEng && !isDefined(obj.weapons[0])));
}

//Returns unfinished structures in the form of IDs.
function unfinishedStructures()
{
	const SAFE_DIST = 30;
	var unfinished = [];
	var stuff = enumStruct(me);

	for (var i = 0, l = stuff.length; i < l; ++i)
	{
		var s = stuff[i];
		if (s.status !== BUILT && s.stattype !== RESOURCE_EXTRACTOR && distBetweenTwoPoints(MY_BASE.x, MY_BASE.y, s.x, s.y) < SAFE_DIST)
		{
			unfinished.push(s.id);
		}
	}

	return unfinished;
}


//Can a construction droid do something right now.
function conCanHelp(mydroid, bx, by)
{
	return (mydroid.order !== DORDER_BUILD
		&& mydroid.order !== DORDER_LINEBUILD
		&& mydroid.order !== DORDER_RECYCLE
		&& mydroid.busy !== true
		&& !repairDroid(mydroid)
		&& droidCanReach(mydroid, bx, by)
	);
}

//Return all idle constructs object IDs.
function findIdleTrucks(type)
{
	const BUILDERS = isDefined(type) ? enumGroup(oilGrabberGroup) : enumGroup(constructGroup);
	var droidlist = [];

	for (var i = 0, s = BUILDERS.length; i < s; i++)
	{
		if (conCanHelp(BUILDERS[i], MY_BASE.x, MY_BASE.y))
		{
			droidlist.push(BUILDERS[i].id);
		}
	}

	return droidlist;
}

// Demolish an object.
function demolishThis(object)
{
	var success = false;
	const DROID_LIST = findIdleTrucks();

	for (var i = 0, t = DROID_LIST.length; i < t; i++)
	{
		var truck = getObject(DROID, me, DROID_LIST[i]);
		if(isDefined(truck) && orderDroidObj(truck, DORDER_DEMOLISH, object))
		{
			success = true;
		}
	}

	return success;
}

//Build a certain number of something
function countAndBuild(stat, count)
{
	if (countStruct(stat) < count)
	{
		if (isStructureAvailable(stat) && buildStuff(stat))
		{
			return true;
		}
	}

	return false;
}

//Find the closest derrick that is not guarded a defense or ECM tower.
function protectUnguardedDerricks(droid)
{
	var derrs = enumStruct(me, structures.derricks);
	const LEN = derrs.length;

	if (isDefined(droid))
	{
		if (buildStructure(droid, returnDefense(), droid, 0))
		{
			return true;
		}

		return false;
	}

	if (LEN)
	{
		var undefended = [];
		derrs = sortAndReverseDistance(derrs);

		for (var i = 0; i < LEN; ++i)
		{
			var found = false;
			var objects = enumRange(derrs[i].x, derrs[i].y, 8, me, false);

			for (var c = 0, u = objects.length; c < u; ++c)
			{
				if ((objects[c].type === STRUCTURE) && (objects[c].stattype === DEFENSE))
				{
					found = true;
					break;
				}
			}

			if (!found)
			{
				undefended.push(derrs[i]);
			}
		}

		if (isDefined(undefended[0]))
		{
			if (buildStuff(returnDefense(), undefined, undefended[0], 0, true))
			{
				return true;
			}
		}
	}

	return false;
}

//Find a location to build something within a safe area.
//the parameter defendThis is used to build something (ie. a defensive structure)
//around what is passed to it.
function buildStructure(droid, stat, defendThis, blocking)
{
	if (!isStructureAvailable(stat, me))
	{
		return false;
	}
	if (!isDefined(blocking))
	{
		blocking = 0;
	}

	var loc;
	if (isDefined(droid))
	{
		if (isDefined(defendThis))
		{
			loc = pickStructLocation(droid, stat, defendThis.x, defendThis.y, blocking);
		}
		else
		{
			loc = pickStructLocation(droid, stat, MY_BASE.x, MY_BASE.y, blocking);
		}

		if (isDefined(loc))
		{
			if (isDefined(droid) && (droid.order !== DORDER_RTB) && !safeDest(me, loc.x, loc.y))
			{
				orderDroid(droid, DORDER_RTB);
				return false;
			}
			if (isDefined(droid) && orderDroidBuild(droid, DORDER_BUILD, stat, loc.x, loc.y))
			{
				return true;
			}
		}
	}

	return false;
}

//Build some object. Builds modules on structures also.
function buildStuff(struc, module, defendThis, blocking, oilGroup)
{
	if (!isDefined(blocking))
	{
		blocking = 0;
	}

	var freeTrucks = findIdleTrucks(oilGroup);
	if (freeTrucks.length)
	{
		var truck = getObject(DROID, me, freeTrucks[0]);
		if (isDefined(module) && isDefined(truck))
		{
			if (orderDroidBuild(truck, DORDER_BUILD, module, struc.x, struc.y))
			{
				return true;
			}
		}
		if (isDefined(truck))
		{
			if (isDefined(defendThis))
			{
				if (buildStructure(truck, struc, defendThis, blocking))
				{
					return true;
				}
			}
			else
			{
				if (buildStructure(truck, struc, undefined, blocking))
				{
					return true;
				}
			}
		}
	}

	return false;
}

//Check for unfinished structures and help complete them.
function checkUnfinishedStructures()
{
	var structs = unfinishedStructures();
	if (structs.length)
	{
		var trucks = findIdleTrucks();
		if (trucks.length)
		{
			var t = getObject(DROID, me, trucks[0])
			var s = getObject(STRUCTURE, me, structs[0]);
			if (isDefined(t) && isDefined(s) && orderDroidObj(t, DORDER_HELPBUILD, s))
			{
				return true;
			}
		}
	}

	return false;
}

function lookForOil()
{
	var droids = enumGroup(oilGrabberGroup);
	var oils = enumFeature(-1, OIL_RES);
	var bestDroid = null;
	var bestDist = 99999;
	var success = false;

	oils = oils.sort(distanceToBase); // grab closer oils first
	for (var i = 0, oilLen = oils.length; i < oilLen; i++)
	{
		for (var j = 0, drLen = droids.length; j < drLen; j++)
		{
			var dist = distBetweenTwoPoints(droids[j].x, droids[j].y, oils[i].x, oils[i].y);
			var unsafe = enumRange(oils[i].x, oils[i].y, 6, ENEMIES, false);
			unsafe = unsafe.filter(isUnsafeEnemyObject);
			if (!isDefined(unsafe[0]) && conCanHelp(droids[j], oils[i].x, oils[i].y))
			{
				bestDroid = droids[j];
				bestDist = dist;
			}
		}

		if (bestDroid && !stopExecution("oil" + oils[i].y * mapWidth * oils[i].x, 50000))
		{
			bestDroid.busy = true;
			orderDroidBuild(bestDroid, DORDER_BUILD, structures.derricks, oils[i].x, oils[i].y);
			bestDist = 99999;
			bestDroid = null;
			success = true;
		}
	}

	return success;
}

// Build CB, Wide-Spectrum, radar detector, or ECM.
// TODO: Find a way to space these out.
function buildSensors()
{
	const CB_TOWER = "Sys-CB-Tower01";
	const WS_TOWER = "Sys-SensoTowerWS";
	const RADAR_DETECTOR = "Sys-RadarDetector01";
	const ECM = "ECM1PylonMk1";

	if (countAndBuild(WS_TOWER, 1))
	{
		return true;
	}

	if (countAndBuild(CB_TOWER, 1))
	{
		return true;
	}

	if (countAndBuild(RADAR_DETECTOR, 1))
	{
		return true;
	}

	if (countAndBuild(ECM, 3))
	{
		return true;
	}
}

//Builds an AA site for the personality. It will always use stormbringer AA
//once available.
function buildAAForPersonality()
{
	const VTOL_COUNT = countEnemyVTOL();

	//Use stormbringer if we have it.
	if (countAndBuild("P0-AASite-Laser", Math.floor(VTOL_COUNT / 3)))
	{
		return true;
	}
	else
	{
		var aaType = SUB_PERSONALITIES[personality].antiAir.defenses;
		for (var i = aaType.length - 1; i >= 0; --i)
		{
			if (countAndBuild(aaType[i].stat, Math.floor(VTOL_COUNT / 3)))
			{
				return true;
			}
		}
	}

	return false;
}

// type refers to either a hardpoint like structure or an artillery emplacement.
// returns undefined if no structure it can build can be built.
function returnDefense(type)
{
	if (!isDefined(type))
	{
		type = random(2);
	}

	const ELECTRONIC_CHANCE = 67;
	var defenses = (type === 0) ? SUB_PERSONALITIES[personality].primaryWeapon.defenses : SUB_PERSONALITIES[personality].artillery.defenses;
	var bestDefense = "Emplacement-MortarEMP"; //default

	//Choose a random electronic warfare defense if possible.
	if (random(101) < ELECTRONIC_CHANCE)
	{
		var avail = 0;
		for (var i = 0, t = ELECTRONIC_DEFENSES.length; i < t; ++i)
		{
			if(isStructureAvailable(ELECTRONIC_DEFENSES[i]))
			{
				avail += 1;
			}
		}

		if (avail > 0)
		{
			defenses = [];
			defenses.push(ELECTRONIC_DEFENSES[random(avail)]);
		}
	}

	for (var i = defenses.length - 1; i > -1; --i)
	{
		var def = isDefined(defenses[i].stat);
		if (def && isStructureAvailable(defenses[i].stat))
		{
			bestDefense = defenses[i].stat;
			break;
		}
		else if (!def && isStructureAvailable(defenses[i]))
		{
			bestDefense = defenses[i];
			break;
		}
	}

	return bestDefense;
}

// Immediately try building a defense near this truck.
function buildDefenseNearTruck(truck, type)
{
	if (!isDefined(type))
	{
		type = 0;
	}

	var defense = returnDefense(type);

	if (isDefined(defense))
	{
		var result = pickStructLocation(truck, defense, truck.x, truck.y, 1);
		if (result)
		{
			return orderDroidBuild(truck, DORDER_BUILD, defense, result.x, result.y);
		}
	}

	return false;
}

// Passing a truck will instruct that truck to pick
// a location to build a defense structure near it.
function buildDefenses(truck)
{
	if ((gameTime > 180000) && (getRealPower() > MIN_BUILD_POWER))
	{
		if (isDefined(truck))
		{
			return buildDefenseNearTruck(truck, 0);
		}

		if (protectUnguardedDerricks())
		{
			return true;
		}

		var def = returnDefense();
		if (isDefined(def))
		{
			return countAndBuild(def, Infinity);
		}
	}

	return false;
}

//Build the basics when available.
function buildPhase1()
{
	if (countAndBuild(FACTORY, 1))
	{
		return true;
	}
	if (!researchComplete && countAndBuild(structures.labs, 1))
	{
		return true;
	}
	if (countAndBuild(structures.hqs, 1))
	{
		return true;
	}

	if (needPowerGenerator() && countAndBuild(structures.gens, countStruct(structures.gens) + 1))
	{
		return true;
	}

	if (!researchComplete && countAndBuild(structures.factories, 2))
	{
		return true;
	}
	if (!researchComplete && countAndBuild(structures.labs, 3))
	{
		return true;
	}

	return false;
}

//Build at least one of each factory and then pursue the favorite factory.
function factoryBuildOrder()
{
	for (var x = 0; x < 2; ++x)
	{
		//Always build at least one of each factory, if allowed.
		if (x && (getRealPower() < MIN_BUILD_POWER))
		{
			break;
		}

		var num = (!x) ? 1 : 5;
		for (var i = 0; i < 3; ++i)
		{
			var fac = SUB_PERSONALITIES[personality].factoryOrder[i];
			if ((fac === VTOL_FACTORY && !useVtol) || (fac === CYBORG_FACTORY && (turnOffCyborgs || forceHover)))
			{
				continue;
			}

			if (countAndBuild(fac, num))
			{
				return true;
			}
		}
	}

	return false;
}

//Build all research labs and one of each factory and pursue the decided factory order.
//Build repair bays when possible.
function buildPhase2()
{
	if (!countStruct(structures.gens))
	{
		return true;
	}

	if (!(getRealPower() < MIN_BUILD_POWER))
	{
		if (!researchComplete && countAndBuild(structures.labs, 5))
		{
			return true;
		}

		if (countAndBuild(structures.extras[0], 5))
		{
			return true;
		}
	}

	if (factoryBuildOrder())
	{
		return true;
	}

	return false;
}

//Laser satellite/uplink center
function buildSpecialStructures()
{
	for (var i = 1, l = structures.extras.length; i < l; ++i)
	{
		if (countAndBuild(structures.extras[i], 1))
		{
			return true;
		}
	}

	return false;
}

//Build the minimum repairs and any vtol pads.
function buildExtras()
{
	if (!isStructureAvailable("A0PowMod1") || (gameTime < 80000))
	{
		return false;
	}
	//Build the minimum repair facilities.
	if (countAndBuild(structures.extras[0], 1 + (countStruct(structures.gens) > 1)))
	{
		return true;
	}

	if (buildSensors())
	{
		return true;
	}

	var needVtolPads = ((2 * countStruct(structures.vtolPads)) < enumGroup(vtolGroup).length);
	if (needVtolPads && buildStuff(structures.vtolPads))
	{
		return true;
	}
}

//Cobra's unique build decisions
function buildOrderCobra()
{
	if (!findIdleTrucks().length) { return; }
	if (checkUnfinishedStructures()) { return; }
	if (maintenance()) { return; }
	if (buildPhase1()) { return; }
	if (buildSpecialStructures()) { return; }
	if (buildAAForPersonality()) { return; }
	if (buildExtras()) { return; }
	if (buildPhase2()) { return; }
	buildDefenses();
}

//Check if a building has modules to be built
function maintenance()
{
	const LIST = ["A0PowMod1", "A0ResearchModule1", "A0FacMod1", "A0FacMod1"];
	const MODS = [1, 1, 2, 2]; //Number of modules paired with list above
	var struct = null, module = "", structList = [];

	if (!countStruct(structures.gens) || (countStruct(structures.derricks) < 4))
	{
		return false;
	}

	for (var i = 0, l = LIST.length; i < l; ++i)
	{
		if (isStructureAvailable(LIST[i]))
		{
			if (struct !== null)
			{
				break;
			}
			switch (i) {
				case 0: { structList = enumStruct(me, structures.gens).sort(distanceToBase);  break; }
				case 1: { structList = enumStruct(me, structures.labs).sort(distanceToBase);  break; }
				case 2: { structList = enumStruct(me, FACTORY).sort(distanceToBase);  break; }
				case 3: { structList = enumStruct(me, VTOL_FACTORY).sort(distanceToBase);  break; }
				default: { break; }
			}

			for (var c = 0, s = structList.length; c < s; ++c)
			{
				if (structList[c].modules < MODS[i])
				{
					struct = structList[c];
					module = LIST[i];
					break;
				}
			}
		}
	}

	if (((getRealPower() > MIN_POWER) || (module === LIST[0])) && struct && buildStuff(struct, module))
	{
		return true;
	}

	return false;
}
