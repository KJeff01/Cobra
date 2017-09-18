
//Determine if we need a generator.
function needPowerGenerator()
{
	function uncached()
	{
		return ((countStruct(structures.derricks) - (countStruct(structures.gens) * 4)) > 0);
	}

	return cacheThis(uncached, [], undefined, 4000);
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

//Returns unfinished structures that are close to base
function unfinishedStructures()
{
	const SAFE_DIST = 25;
	return enumStruct(me).filter(function(str) {
		return (str.status !== BUILT
			&& str.stattype !== RESOURCE_EXTRACTOR
			&& distBetweenTwoPoints(MY_BASE.x, MY_BASE.y, str.x, str.y) < SAFE_DIST
		);
	});
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

//Return all idle constructs.
function findIdleTrucks(type)
{
	const BUILDERS = isDefined(type) ? enumGroup(oilGrabberGroup) : enumGroup(constructGroup);
	var droidlist = [];

	for (var i = 0, s = BUILDERS.length; i < s; i++)
	{
		if (conCanHelp(BUILDERS[i], MY_BASE.x, MY_BASE.y))
		{
			droidlist.push(BUILDERS[i]);
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
		if(orderDroidObj(DROID_LIST[i], DORDER_DEMOLISH, object))
		{
			success = true;
		}
	}

	return success;
}

//Check if a stored id matches this soon to be built object. Very good for oil snatching.
function inBuildQueue(obj)
{
	for (var i = 0, l = buildQueue.length; i < l; ++i)
	{
		if (obj.id === buildQueue[i])
		{
			return true;
		}
	}

	return false;
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

//Return the best available artillery defense structure.
function getDefenseStructure()
{
	function uncached()
	{
		var templates = SUB_PERSONALITIES[personality].artillery.defenses;
		for (var i = templates.length - 1; i > 0; --i)
		{
			if (isStructureAvailable(templates[i].stat))
			{
				return templates[i].stat;
			}
		}
		//Fallback onto the hmg tower.
		return "GuardTower1";
	}

	return cacheThis(uncached, []);
}

//Find the closest derrick that is not guarded a defense or ECM tower.
function protectUnguardedDerricks(droid)
{
	var derrs = enumStruct(me, structures.derricks);
	const LEN = derrs.length;

	if (isDefined(droid))
	{
		if (buildStructure(droid, getDefenseStructure(), droid, 0))
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
			if (buildStuff(getDefenseStructure(), undefined, undefended[0], 0, true))
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
	const LEN = freeTrucks.length;

	if (LEN)
	{
		freeTrucks = freeTrucks.sort(distanceToBase);
		var truck = freeTrucks[0];

		if (isDefined(struc) && isDefined(module) && isDefined(truck))
		{
			if (orderDroidBuild(truck, DORDER_BUILD, module, struc.x, struc.y))
			{
				return true;
			}
		}
		if (isDefined(truck) && isDefined(struc))
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
	var struct = unfinishedStructures();

	if (isDefined(struct[0]))
	{
		struct = struct.sort(distanceToBase);
		var trucks = findIdleTrucks();

		if (isDefined(trucks[0]))
		{
			trucks = trucks.sort(distanceToBase);
			if (orderDroidObj(trucks[0], DORDER_HELPBUILD, struct[0]))
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
	buildQueue = [];

	oils = oils.sort(distanceToBase); // grab closer oils first
	for (var i = 0, oilLen = oils.length; i < oilLen; i++)
	{
		if (inBuildQueue(oils[i]))
		{
			continue;
		}

		for (var j = 0, drLen = droids.length; j < drLen; j++)
		{
			var dist = distBetweenTwoPoints(droids[j].x, droids[j].y, oils[i].x, oils[i].y);
			var unsafe = enumRange(oils[i].x, oils[i].y, 9, ENEMIES, false);
			unsafe = unsafe.filter(isUnsafeEnemyObject);
			if (!isDefined(unsafe[0]) && conCanHelp(droids[j], oils[i].x, oils[i].y))
			{
				bestDroid = droids[j];
				bestDist = dist;
			}
		}

		if (bestDroid)
		{
			bestDroid.busy = true;
			orderDroidBuild(bestDroid, DORDER_BUILD, structures.derricks, oils[i].x, oils[i].y);
			bestDist = 99999;
			bestDroid = null;
			success = true;
			buildQueue.push(oils[i].id);
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

//Build defense systems.
function buildDefenses()
{
	const MIN_POWER = 180;
	if (buildAAForPersonality())
	{
		return true;
	}

	if ((gameTime > 240000) && (getRealPower() > MIN_POWER))
	{
		if (buildSensors())
		{
			return true;
		}

		if (protectUnguardedDerricks())
		{
			return true;
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
		var num = (!x) ? 1 : 5;
		for (var i = 0; i < 3; ++i)
		{
			var fac = SUB_PERSONALITIES[personality].factoryOrder[i];
			if (fac === VTOL_FACTORY && !useVtol)
			{
				continue;
			}
			
			if (!((fac === CYBORG_FACTORY) && turnOffCyborgs && !forceHover))
			{
				if (countAndBuild(fac, num))
				{
					return true;
				}
			}
		}
	}

	return false;
}

//Build all research labs and one of each factory and pursue the decided factory order.
//Build repair bays when possible.
function buildPhase2()
{
	const MIN_POWER = 230;

	if (!countStruct(structures.gens) || (getRealPower() < MIN_POWER))
	{
		return true;
	}

	if (!researchComplete && countAndBuild(structures.labs, 5))
	{
		return true;
	}

	if (countAndBuild(structures.extras[0], 5))
	{
		return true;
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

	var needVtolPads = ((2 * countStruct(structures.vtolPads)) < enumGroup(vtolGroup).length);
	if (needVtolPads && buildStuff(structures.vtolPads))
	{
		return true;
	}
}

//Cobra's unique build decisions
function buildOrderCobra()
{
	if(checkUnfinishedStructures()) { return; }
	if(maintenance()) { return; }
	if(buildPhase1()) { return; }
	if(enemyUnitsInBase()) { return; }
	if(buildSpecialStructures()) { return; }
	buildDefenses();
	if(buildExtras()) { return; }
	if(buildPhase2()) { return; }
}

//Check if a building has modules to be built
function maintenance()
{
	const MIN_POWER = 160;
	const LIST = ["A0PowMod1", "A0FacMod1", "A0ResearchModule1", "A0FacMod1"];
	const MODS = [1, 2, 1, 2]; //Number of modules paired with list above
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
				case 1: { structList = enumStruct(me, FACTORY).sort(distanceToBase);  break; }
				case 2: { structList = enumStruct(me, structures.labs).sort(distanceToBase);  break; }
				case 3: { structList = enumStruct(me, VTOL_FACTORY).sort(distanceToBase);  break; }
				default: { break; }
			}

			for (var c = 0, s = structList.length; c < s; ++c)
			{
				if (structList[c].modules < MODS[i])
				{
					//Only build the last factory module if we have a heavy body
					if (structList[c].modules === 1)
					{
						if ((i === 1) && !componentAvailable("Body11ABT"))
						{
							continue;
						}
					}
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
