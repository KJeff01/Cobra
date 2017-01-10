
//Remove hard coded stuff(subpersonalities) and improve the spyRoutine() function and research.

//Use a custom NullBot standard for weapon definitions
include("/multiplay/skirmish/nb_includes/_head.js");
include("/multiplay/skirmish/nb_rulesets/standard.js");

// -- Important functions
function random(max) {
	return (max <= 0) ? 0 : Math.floor(Math.random() * max)
}

// Returns true if something is defined
function isDefined(data) {
	return typeof(data) !== "undefined";
}

function mapLimits(x, y, num1, num2, xOffset, yOffset) {
	var coordinates = [];
	var xPos = x + xOffset + random(num1) - num2;
	var yPos = y + yOffset + random(num1) - num2;

	if(xPos < 2)
		xPos = 2;
	if(yPos < 2)
		yPos = 2;
	if(xPos >= mapWidth - 2)
		xPos = mapWidth - 3;
	if(yPos >= mapHeight - 2)
		yPos = mapHeight - 3;
	
	coordinates[coordinates.length] = xPos;
	coordinates[coordinates.length] = yPos;
	return coordinates;
}

//Taken from nullbot v3.06
function vtolArmed(obj, percent) {
	if (obj.type != DROID)
		return;
	
	if (!isVTOL(obj))
		return false;
	
	for (var i = 0; i < obj.weapons.length; ++i)
		if (obj.weapons[i].armed >= percent)
			return true;
		
	return false;
}

//Taken from nullbot v3.06
function vtolReady(droid) {
	if (droid.order == DORDER_ATTACK)
		return false;
	
	if (vtolArmed(droid, 1))
		return true;
	
	if (droid.order != DORDER_REARM) {
		orderDroid(droid, DORDER_REARM);
	}
	
	return false;
}

function droidBusy(droid)
{
	return droid.order == DORDER_ATTACK || droid.order == DORDER_SCOUT;
}

//Ally is false for checking for enemy players
//Ally is true for allies.
function playerAlliance(ally)
{
	if(!isDefined(ally))
		ally = false;
	var players = [];
	
	for(var i = 0; i < maxPlayers; ++i) {
		if(!ally) {
			if(!allianceExistsBetween(i, me) && i != me) {
				players.push(i);
			}
		}
		else {
			if(allianceExistsBetween(i, me) && i != me) {
				players.push(i);
			}
		}
	}
	return players;
}

/*Unused
function findNearest(list, x, y, flag) {
	var minDist = Infinity, minIdx;
	for (var i = 0; i < list.length; ++i) {
		var d = distBetweenTwoPoints(list[i].x, list[i].y, x, y);
		if (d < minDist) {
			minDist = d;
			minIdx = i;
		}
	}
	return (flag === true) ? list[minIdx] : minIdx;
}
*/
// -- useful lists

const kineticResearch = [
	"R-Vehicle-Metals02",
	"R-Cyborg-Metals02",
	"R-Vehicle-Metals04",
	"R-Cyborg-Metals04",
	"R-Vehicle-Metals06",
	"R-Cyborg-Metals06",
	"R-Vehicle-Metals09",
	"R-Cyborg-Metals09",
]

const thermalResearch = [
	"R-Vehicle-Armor-Heat02",
	"R-Cyborg-Armor-Heat02",
	"R-Vehicle-Armor-Heat04",
	"R-Cyborg-Armor-Heat04",
	"R-Vehicle-Armor-Heat06",
	"R-Cyborg-Armor-Heat06",
	"R-Vehicle-Armor-Heat09",
	"R-Cyborg-Armor-Heat09",
]

const baseResearch = [
	"R-Struc-Materials09",
]

const bodyResearch = [
	"R-Vehicle-Body05",
	"R-Vehicle-Body11",
	"R-Vehicle-Body12",
	"R-Vehicle-Body10",
	"R-Vehicle-Body14",
]

const subpersonalities = {
	AC: {
		"chatalias": "ac",
		"primaryWeapon": weaponStats.cannons,
		"artillery": weaponStats.mortars,
		"antiAir": weaponStats.AA,
		"extra": weaponStats.nexusTech,
		"res": [
			"R-Wpn-MG-Damage01",
			"R-Wpn-Cannon-Damage01",
			"R-Struc-PowerModuleMk1",
			"R-Wpn-Cannon-Damage02",
			"R-Struc-Research-Module",
			"R-Vehicle-Body05",
			"R-Vehicle-Prop-Tracks",
			"R-Vehicle-Prop-Hover",
			"R-Wpn-Cannon-Damage05",
			"R-Wpn-Cannon-ROF03",
			"R-Struc-Power-Upgrade01c",
			"R-Wpn-Bomb02",
		]
	},
	AR: {
		"chatalias": "ar",
		"primaryWeapon": weaponStats.flamers,
		"artillery": weaponStats.mortars,
		"antiAir": weaponStats.AA,
		"extra": weaponStats.nexusTech,
		"res": [
			"R-Wpn-MG-Damage01",
			"R-Wpn-Flamer-Damage01",
			"R-Struc-PowerModuleMk1",
			"R-Struc-Research-Module",
			"R-Vehicle-Body05",
			"R-Wpn-Flamer-Damage02",
			"R-Wpn-Flamer-ROF01",
			"R-Vehicle-Prop-Tracks",
			"R-Vehicle-Prop-Hover",
			"R-Wpn-Flame2",
			"R-Wpn-Flamer-ROF03",
			"R-Struc-Power-Upgrade01c",
			"R-Wpn-Bomb02",
		],
	},
}

// -- globals
var attackGroup;
var vtolGroup;
var cyborgGroup;
var sensorGroup;
//var nexusLinkGroup
//var artilleryGroup
var grudgeCount = []; //See who bullies this bot the most and act on it
var personality;
var lastMsg = "";

// -- Weapon research (eventGameInit)
var weaponTech = [];
var artilleryTech = [];
var artillExtra = [];
var extraTech = [];
var vtolWeapons = [];
var vtolExtras = [];
var cyborgWeaps = [];
//var antiAirTech = [];
//var antiAirExtra = [];


// -- MAIN CODE --

function buildAttacker(struct)
{
	const fallBack = weaponStats.machineguns.weapons;
	var useHover = 0;
	var weaps;
	if(personality <= 1) {
		if(random(3))
			weaps = subpersonalities["AC"]["primaryWeapon"];
		else
			weaps = subpersonalities["AC"]["artillery"];
	}
	else {
		if(random(3)) {
			weaps = subpersonalities["AR"]["primaryWeapon"];
			useHover = 1;
		}
		else
			weaps = subpersonalities["AR"]["artillery"];
	}
	var weap = [];
	const body = [
		"Body14SUP", // Dragon
		"Body13SUP", // Wyvern
		"Body10MBT", // Vengeance
		"Body9REC",  // Tiger
		"Body12SUP", // Mantis
		"Body11ABT", // Python
		"Body5REC",  // Cobra
		"Body1REC",  // Viper
	];
	var prop = [
		"tracked01", // tracked01
		"HalfTrack", // half-track
		"wheeled01", // wheels
	];
	
	//HACK: Detect technology level. Command relay would be better, but seems to not work.
	if(!isStructureAvailable(structures.templateFactories)) {
		for(var x = fallBack.length - 1; x >= 0; --x) {
			weap.push(fallBack[x].stat);
		}
	}
	else {
		for(var x = weaps.weapons.length - 1; x >= 0; --x) {
			weap.push(weaps.weapons[x].stat);
		}
	}
	
	if(useHover === 1 && componentAvailable("hover01"))
		prop = "hover01"
	
	if (buildDroid(struct, "Droid", body, prop, null, null, weap, weap))
	{
		return true;
	}
	
	return false;
}

function buildSys(struct, weap)
{
	if(!isDefined(weap))
		weap = "Spade1Mk1";
	
	const bodylist = [
		"Body3MBT",  // Retaliation
		"Body2SUP",  // Leopard
		"Body4ABT",  // Bug
		"Body1REC",  // Viper
	];
	const proplist = [
		"hover01", // hover
		"wheeled01", // wheels
	];
	if (buildDroid(struct, "System unit", bodylist, proplist, null, null, weap))
	{
		return true;
	}
	return false;
}

function buildCyborg(fac)
{
	var weapon;
	if(personality <= 1)
		weapon = subpersonalities["AC"]["primaryWeapon"];
	else
		weapon = subpersonalities["AR"]["primaryWeapon"];
	var weap = [];
	var body = [];
	var prop = [];
	var weap = [];
	//weapons
	for(var x = weapon.templates.length - 1; x >= 0; --x) {
		body.push(weapon.templates[x].body);
		prop.push(weapon.templates[x].prop);
		weap.push(weapon.templates[x].weapons[0]);
	}
	
	if(buildDroid(fac, "Cyborg", body, prop, null, null, weap))
	{
		return true;
	}
	return false;
}

function buildVTOL(struct)
{
	const weapons = weaponStats.bombs.vtols;
	var weap = [];
	const bodyList = [
		"Body13SUP", // Wyvern
		"Body7ABT",  // Retribution
		"Body6SUPP", // Panther
		"Body8MBT",  // Scorpion
		"Body5REC",  // Cobra
	];
	
	for(var x = weapons.length - 1; x >= 0; --x) {
		weap.push(weapons[x].stat);
	}
	
	if (buildDroid(struct, "Bomber", bodyList, "V-Tol", null, null, weap))
	{
		return true;
	}

	return false;
}

function conCanHelp(mydroid, bx, by)
{
	return (mydroid.order != DORDER_HELPBUILD 
	        && mydroid.order != DORDER_BUILD
	        && mydroid.order != DORDER_LINEBUILD
			&& mydroid.busy != true
	        && droidCanReach(mydroid, bx, by));
}

function buildStructure(droid, stat) {
	if (!isStructureAvailable(stat, me))
		return false;
	
	var loc = pickStructLocation(droid, stat, droid.x, droid.y, 0);
	if (!isDefined(loc))
		return false;	
	
	if(orderDroidBuild(droid, DORDER_BUILD, stat, loc.x, loc.y))
		return true;
	return false;
}

function distanceToBase(obj1, obj2)
{
	var dist1 = distBetweenTwoPoints(startPositions[me].x, startPositions[me].y, obj1.x, obj1.y);
	var dist2 = distBetweenTwoPoints(startPositions[me].x, startPositions[me].y, obj2.x, obj2.y);
	return (dist1 - dist2);
}

function buildStuff(struc)
{
	var construct = enumDroid(me, DROID_CONSTRUCT);
	
	if (construct.length > 0) {
		var freeTrucks = [];
		for(var x = 0; x < construct.length; x++) {
			if (conCanHelp(construct[x], construct[x].x, construct[x].y)) {
				freeTrucks.push(construct[x]);
			}
		}
		
		if(freeTrucks.length > 0) {
			if(struc != structures.derricks) {
				if(buildStructure(freeTrucks[random(freeTrucks.length)], struc))
					return true;
			}
		}
	}
	return false;
}

function countAndBuild(stat, count) {
	if (countStruct(stat) < count)
		if (buildStuff(stat))
			return true;
	return false;
}

function checkUnfinishedStructures()
{
	const struct = enumStruct(me).filter(function(struct){ return struct.status != BUILT});
	if(struct.length === 0)
		return false;
	const trucks = enumDroid(me, DROID_CONSTRUCT).filter(function(obj){ return conCanHelp(obj, struct[0].x, struct[0].y) });
	if(trucks.length === 0)
		return false;
	if (orderDroidObj(trucks[0], DORDER_HELPBUILD, struct[0]))
		return true;
	return false;
}

function lookForOil()
{
	var droids = enumDroid(me, DROID_CONSTRUCT);
	var oils = enumFeature(-1, oilResources);
	var s = 0;
	if (oils.length > 0)
	{
		oils.sort(distanceToBase); // grab closer oils first
		for (var i = 0; i < oils.length; i++)
		{
			for (var j = 0; j < droids.length; j++)
			{
				if(i + s >= oils.length)
					break;
				
				if (droidCanReach(droids[j], oils[i + s].x, oils[i + s].y)
				    && safeDest(me, oils[i + s].x, oils[i + s].y)
				    && conCanHelp(droids[j], oils[i + s].x, oils[i + s].y)
					&& !droids[j].busy)
				{
					droids[j].busy = true;
					orderDroidBuild(droids[j], DORDER_BUILD, structures.derricks, oils[i + s].x, oils[i + s].y);
					s += 1;
				}
			}
		}
	}
}

function buildOrder()
{
	if(maintenance())
		return false;

	if(countAndBuild(structures.factories, 1)) { return true; }
	if(countAndBuild(structures.labs, 1)) { return true; }
	if(countAndBuild(structures.hqs, 1)) { return true; }
	
	if ((countStruct(structures.derricks) - countStruct(structures.gens) * 4) > 0 
		&& isStructureAvailable(structures.gens) || countStruct(structures.gens) < 1)
	{
		if(countAndBuild(structures.gens, enumStruct(me, structures.gens).length + 1))
			return true;
	}
	
	if (playerPower(me) > 110 && isStructureAvailable(structures.templateFactories))
	{
		if (countAndBuild(structures.templateFactories, 3))
			return true
	}
	
	if(gameTime > 210000 && playerPower(me) > 90 ) {
		if(countAndBuild(structures.labs, 3)) { return true; }
		if(countAndBuild(structures.factories, 2)) { return true; }
	}
	if(gameTime > 400000 && playerPower(me) > 120) {
		if(countAndBuild(structures.labs, 5)) { return true; }
		if(countAndBuild(structures.factories, 3)) { return true; }
	}

	if (componentAvailable("Bomb1-VTOL-LtHE") && playerPower(me) > 180 && isStructureAvailable(structures.vtolFactories))
	{
		const vtols = enumDroid(me).filter(function(obj){return isVTOL(obj)}).length;
		if(isStructureAvailable(structures.vtolPads) && 2 * countStruct(structures.vtolPads) < vtols && buildStuff(structures.vtolPads))
			return true;
		
		if (countAndBuild(structures.vtolFactories, 3))
			return true;
	}
	
	if(isStructureAvailable(structures.extras[0]))
	{
		countAndBuild(structures.extras[0], 1);
	}
	
	/*
	if(playerPower(me) > 150 && isStructureAvailable(structures.extras[1]))
	{
		countAndBuild(structures.extras[1], 1);
	}
	
	if(isStructureAvailable(structures.extras[2]))
	{
		countAndBuild(structures.extras[2], 1);
	}
	*/
	
	//DEFENSES
	//BUILD MORE BASE STUFF
	lookForOil();
}

function maintenance()
{
	if(checkUnfinishedStructures())
		return true;
	
	const powModule = "A0PowMod1";
	const facModule = "A0FacMod1";
	const resModule = "A0ResearchModule1";
	
	var struct = null, module = "";
	if (isStructureAvailable(powModule))
	{
		var structlist = enumStruct(me, POWER_GEN);
		for (i = 0; i < structlist.length; i++)
		{
			if (structlist[i].modules < 1) 
			{
				struct = structlist[i];
				module = powModule;
				break;
			}
		}
	}
	if (!struct && isStructureAvailable(resModule))
	{
		var structlist = enumStruct(me, RESEARCH_LAB);
		for (i = 0; i < structlist.length; i++)
		{
			if (structlist[i].modules < 1) 
			{
				struct = structlist[i];
				module = resModule;
				break;
			}
		}
	}
	if (!struct && isStructureAvailable(facModule))
	{
		var structlist = enumStruct(me, FACTORY);
		for (i = 0; i < structlist.length; i++)
		{
			if (structlist[i].modules < 2) 
			{
				struct = structlist[i];
				module = facModule;
				break;
			}
		}
	}
	if (!struct && isStructureAvailable(facModule))
	{
		var structlist = enumStruct(me, VTOL_FACTORY);
		for (i = 0; i < structlist.length; i++)
		{
			if (structlist[i].modules < 2) 
			{
				struct = structlist[i];
				module = facModule;
				break;
			}
		}
	}
	if (playerPower(me) > 50 && struct) 
	{
		var builders = enumDroid(me, DROID_CONSTRUCT);
		for (j = 0; j < builders.length; j++)
		{
			mydroid = builders[j];
			if(conCanHelp(mydroid, struct.x, struct.y)) {
				orderDroidBuild(mydroid, DORDER_BUILD, module, struct.x, struct.y);
			}
		}
		return true;
	}
	
	// Check for idle structures
	var faclist = enumStruct(me, FACTORY);
	var cybList = enumStruct(me, CYBORG_FACTORY);
	var vtolList = enumStruct(me, VTOL_FACTORY);
	for (var j = 0; j < faclist.length; j++)
	{
		if (structureIdle(faclist[j]))
		{
			eventStructureBuilt(faclist[j], null);
		}
	}
	for (var j = 0; j < cybList.length; j++)
	{
		if (structureIdle(cybList[j]))
		{
			eventStructureBuilt(cybList[j], null);
		}
	}
	for (var j = 0; j < vtolList.length; j++)
	{
		if (structureIdle(vtolList[j]))
		{
			eventStructureBuilt(vtolList[j], null);
		}
	}
	eventResearched();
	
	return false;
}

function checkMood()
{
	//Tell allies (ideally non-bots) who is attacking Cobra the most
	var temp = 0;
	var next = 0;
	for(var x = 0; x < maxPlayers; ++x) {
		temp = grudgeCount[x];
		if(temp > 0 && temp > grudgeCount[next])
			next = x;
	}
	if(grudgeCount[next] > 5 && lastMsg != "player " + next + " is a bully!") {
		lastMsg = "player " + next + " is a bully!";
		chat(ALLIES, lastMsg);
	}
	
	for(var x = 0; x < maxPlayers; ++x) {
		if(grudgeCount[x] >= 30) {
			attackStuff(x);
			grudgeCount[x] = 0;
		}
		else if(grudgeCount[x] > 10 && grudgeCount[x] < 30) {
			const derr = enumStruct(x, structures.derricks);
			const fac = enumStruct(x, structures.factories);
			const cybFac = enumStruct(x, structures.templateFactories);
			
			var cyborgs = enumGroup(cyborgGroup);
			var target = derr[random(derr.length)];
			
			for (var i = 0; i < cyborgs.length; i++)
			{
				if(isDefined(target) && !repairDroid(cyborgs[i]))
					orderDroidLoc(cyborgs[i], DORDER_SCOUT, target.x, target.y)
			}
		
			//Attack their base!
			var targetFac = fac[random(fac.length)];
			var targetCyb = cybFac[random(cybFac.length)];
			var vtols = enumGroup(vtolGroup);
			
			for (var i = 0; i < vtols.length; ++i)
			{
				if(!random(2)) {
					if(vtolReady(vtols[i]) && isDefined(targetFac)) {
						orderDroidLoc(vtols[i], DORDER_SCOUT, targetFac.x, targetFac.y);
					}
				}
				else {
					if(vtolReady(vtols[i]) && isDefined(targetCyb)) {
						orderDroidLoc(vtols[i], DORDER_SCOUT, targetCyb.x, targetCyb.y);
					}
				}
			}
			
			if(!random(4))
				grudgeCount[x] -= 1;
			return true;
		}
	}
}

//attacker is a player number
function attackStuff(attacker)
{
	var attackers = enumGroup(attackGroup);
	var cyborgs = enumGroup(cyborgGroup);
	var vtols = enumGroup(vtolGroup);
	var enemy = playerAlliance(false);
	var str = lastMsg.slice(0, -1);
	
	if(attackers.length > 5)
	{
		var selectedEnemy = enemy[random(enemy.length)];
		if(isDefined(attacker) && !allianceExistsBetween(attacker, me) && (attacker !== me))
		{
			selectedEnemy = attacker;
			grudgeCount[attacker] = 100;
		}
		
		const derr = enumStruct(selectedEnemy, structures.derricks);
		const fac = enumStruct(selectedEnemy, structures.factories);
		const cybFac = enumStruct(selectedEnemy, structures.templateFactories);
		var target = derr[random(derr.length)];
		var targetFac = fac[random(fac.length)];
		var targetCyb = cybFac[random(cybFac.length)];
		
		if(str != "attack") {
			lastMsg = "attack" + selectedEnemy;
			chat(ALLIES, lastMsg);
		}
	
		for (var j = 0; j < attackers.length; j++)
		{
			if(isDefined(targetFac) && !repairDroid(attackers[j]))
				orderDroidLoc(attackers[j], DORDER_SCOUT, targetFac.x, targetFac.y);
			else
				break;
		}

		if(cyborgs.length > 5)
		{
			for (var j = 0; j < cyborgs.length; j++)
			{
				if(isDefined(target) && !repairDroid(cyborgs[j]))
					orderDroidLoc(cyborgs[j], DORDER_SCOUT, target.x, target.y);
				else
					break;
			}
		}
		if(vtols.length > 6)
		{
			for (var j = 0; j < vtols.length; j++)
			{
				if (vtolReady(vtols[j]))
				{
					if(isDefined(cybFac))
						orderDroidLoc(vtols[j], DORDER_SCOUT, cybFac.x, cybFac.y);
				}
			}
		}
	}
}

function produce()
{
	const fac = enumStruct(me, FACTORY);
	const cybFac = enumStruct(me, CYBORG_FACTORY);
	const vtolFac = enumStruct(me, VTOL_FACTORY);
	var extra = false;
	
	for(var x = 0; x < fac.length; ++x) {
		if(structureIdle(fac[x])) {
			if (extra === false && countDroid(DROID_CONSTRUCT, me) < 4)
			{
				if(countDroid(DROID_CONSTRUCT, me) < 2) {
					lastMsg = "need truck";
					chat(ALLIES, lastMsg);
				}
				buildSys(fac[x], "Spade1Mk1");
				extra = true;
			}
			else if(enumGroup(attackGroup).length > 7 && extra === false && enumGroup(sensorGroup).length < 3 )
			{
				if(componentAvailable("Sensor-WideSpec"))
				{
					buildSys(fac[x], "Sensor-WideSpec");
				}
				else
				{
					buildSys(fac[x], "SensorTurret1Mk1");
				}
				extra = true;
			}
			else
			{
				buildAttacker(fac[x]);
			}
		}
	}
	
	for(var x = 0; x < cybFac.length; ++x) {
		if(structureIdle(cybFac[x])) {
			buildCyborg(cybFac[x]);
		}
	}
	
	for(var x = 0; x < vtolFac.length; ++x) {
		if(structureIdle(vtolFac[x])) {
			buildVTOL(vtolFac[x]);
		}
	}
}

function repairDroid(droid, force)
{
	if(!isDefined(force))
		force = false;
	
	var repairs = enumStruct(me, structures.extras[0]);
	if(repairs.length > 0 && (droid.health < 30 || force)) {
		orderDroid(droid, DORDER_RTR);
		return true;
	}
	return false;
}

function repairAll()
{
	var tanks = enumGroup(attackGroup);
	var cyborgs = enumGroup(cyborgGroup);
	
	for(var x = 0; x < tanks.length; ++x) {
		if(tanks[x].health < 30)
			repairDroid(tanks[x], true);
	}
	
	for(var x = 0; x < cyborgs.length; ++x) {
		if(cyborgs[x].health < 30)
			repairDroid(cyborgs[x], true);
	}
}

function spyRoutine()
{
	var sensors = enumGroup(sensorGroup);
	if (sensors.length === 0)
		return false;
	
	for(var x = 0; x < sensors.length; ++x) {
		if(sensors[x].health < 60) 
		{
			repairDroid(sensors[x], true);
			continue;
		}

		//Observe closest enemy object
		var object = enumRange(sensors[x].x, sensors[x].y, 99999, ENEMIES, false);
		if(object.length > 0)
		{
			orderDroidObj(sensors[x], DORDER_OBSERVE, object[0]);

			if(grudgeCount[object[0].player] > 5)
			{
				var tanks = enumGroup(attackGroup);
				if(!random(30) && tanks.length > 10 && !droidBusy(tanks[0]))
					orderDroidLoc(tanks[0], DORDER_SCOUT, object[0].x, object[0].y);
			}
		}
	}
}

//Prevent greedy players from taking too much oil early game
function checkOilCount()
{
	if(enumStruct(me, structures.derricks).length < 5)
	{
		var tanks = enumGroup(attackGroup);
		if(tanks.length < 6)
			return false;
		
		var enemy = playerAlliance(false);
		
		var derr = enumStruct(enemy[random(enemy.length)], structures.derricks);
		if(derr.length === 0)
			return false;
		
		derr.sort(distanceToBase);
		
		for(var i = 0; i < tanks.length; ++i)
		{
			if(i < derr.length)
				orderDroidObj(tanks[i], DORDER_ATTACK, derr[i]);
			else
				break;
		}
	}
}

// --- game events
function eventResearched(tech, labparam)
{
	if(playerPower(me) < 10) {
		if(lastMsg != "need power") {
			lastMsg = "need power";
			chat(ALLIES, lastMsg);
		}
		queue("eventResearched");
		return;
	}
	
	var num = random(3);
	var defenseTech = [];
	var techlist = [];
	
	if(num === 0) { defenseTech = kineticResearch; }
	else if(num === 1) { defenseTech = thermalResearch;}
	//else { defenseTech = baseResearch; }

	var lablist = enumStruct(me, structures.labs);
	for (i = 0; i < lablist.length; i++)
	{
		var lab = lablist[i];
		if (lab.status == BUILT && structureIdle(lab))
		{
			var found = pursueResearch(lab, techlist);
			if(!found)
				found = pursueResearch(lab, "R-Struc-Power-Upgrade03a");
			if(!found)
				found = pursueResearch(lab, weaponTech);
			if(!found)
				found = pursueResearch(lab, fastestResearch);
			if(!found)
				found = pursueResearch(lab, defenseTech);
			if(!found)
				found = pursueResearch(lab, bodyResearch);
			if(!found)
				found = pursueResearch(lab, extraTech);
			if(!found)
				found = pursueResearch(lab, artilleryTech);
			if(!found)
				found = pursueResearch(lab, artillExtra);
			if(!found)
				found = pursueResearch(lab, "R-Sys-Autorepair-General");
			if(!found)
				found = pursueResearch(lab, vtolWeapons);
			if(!found)
				found = pursueResearch(lab, vtolExtras);
			if(!found)
				found = pursueResearch(lab, "R-Struc-RprFac-Upgrade06");
			if(!found && cyborgWeaps.length > 0)
				found = pursueResearch(lab, cyborgWeaps);
			/*
			if(!found)
				found = pursueResearch(lab, antiAirTech);
			if(!found && cyborgWeaps.length > 0)
				found = pursueResearch(lab, antiAirExtra);
			*/
			/*
			if (!found)
			{
				// Find a random research item
				var reslist = enumResearch();
				if (reslist.length > 0)
				{
					var idx = Math.floor(Math.random() * reslist.length);
					if(playerPower(me) - queuedPower(me) > 120)
						pursueResearch(lab, reslist[idx].name);
				}
				
			}
			*/
		}
	}
}

function eventStructureBuilt(struct, droid)
{
	if (struct.stattype == RESEARCH_LAB)
	{
		queue("eventResearched");
	}
	else if (struct.stattype == FACTORY || struct.stattype == CYBORG_FACTORY || struct.stattype == VTOL_FACTORY)
	{
		produce();
	}
}

function eventDroidBuilt(droid, struct)
{
	if (droid)
	{
		if (isVTOL(droid))
		{
			groupAdd(vtolGroup, droid);
		}
		else if (droid.droidType == DROID_WEAPON)
		{
			groupAdd(attackGroup, droid);
		}
		else if(droid.droidType == DROID_CYBORG) {
			groupAdd(cyborgGroup, droid);
		}
		else if(droid.droidType == DROID_SENSOR){
			groupAdd(sensorGroup, droid);
		}
	}
}

function eventGameInit()
{
	attackGroup = newGroup();
	vtolGroup = newGroup();
	cyborgGroup = newGroup();
	sensorGroup = newGroup();
	lastMsg = "eventGameInit";
	personality = random(4);
	for(var i = 0; i < maxPlayers; ++i) {
		grudgeCount[grudgeCount.length] = 0;
	}
	
	//-- START Group initialization
	var weapons = enumDroid(me, DROID_WEAPON);
	var cyborgs = enumDroid(me, DROID_CYBORG);
	var vtols = enumDroid(me).filter(function(obj){ return isVTOL(obj) });
	var sensors = enumDroid(me, DROID_SENSOR);
	
	if(weapons.length > 0)
		groupAdd(attackGroup, weapons);
	if(cyborgs.length > 0)
		groupAdd(cyborgGroupGroup, cyborgs);
	if(vtols.length > 0)
		groupAdd(vtolGroup, vtols);
	if(sensors.length > 0)
		groupAdd(sensorGroup, sensors);
	// --END Group initialization
	
	// --START Research lists
	for(var x = weaponStats.bombs.weapons.length - 1; x >= 0; --x)
		vtolWeapons.push(weaponStats.bombs.weapons[x].res);
	for(var x = weaponStats.bombs.weapons.length - 1; x >= 0; --x)
		vtolWeapons.push(weaponStats.bombs.extras[x]);
	//for(var x = weaponStats.AA.defenses.length - 1; x >= 0; --x)
		//antiAirTech.push(weaponStats.AA.defenses[x].res);
	//for(var x = weaponStats.AA.extras.length - 1; x >= 0; --x)
		//antiAirTech.push(weaponStats.AA.extras[x]);
	
	if(personality <= 1) {
		techlist = subpersonalities["AC"]["res"];
		for(var x = weaponStats.cannons.weapons.length - 1; x >= 0; --x)
			weaponTech.push(weaponStats.cannons.weapons[x].res);
		for(var x = weaponStats.mortars.weapons.length - 1; x >= 0; --x)
			artilleryTech.push(weaponStats.mortars.weapons[x].res);
		for(var x = weaponStats.cannons.extras.length - 1; x >= 0; --x)
			extraTech.push(weaponStats.cannons.extras[x]);
		for(var x = weaponStats.mortars.extras.length - 1; x >= 0; --x)
			artillExtra.push(weaponStats.mortars.extras[x]);
		for(var x = weaponStats.cannons.templates.length - 1; x >= 0; --x)
			cyborgWeaps.push(weaponStats.cannons.templates[x].res);
	}
	else {
		techlist = subpersonalities["AR"]["res"];
		for(var x = weaponStats.flamers.weapons.length - 1; x >= 0; --x)
			weaponTech.push(weaponStats.flamers.weapons[x].res);
		for(var x = weaponStats.mortars.weapons.length - 1; x >= 0; --x)
			artilleryTech.push(weaponStats.mortars.weapons[x].res);
		for(var x = weaponStats.flamers.extras.length - 1; x >= 0; --x)
			extraTech.push(weaponStats.flamers.extras[x]);
		for(var x = weaponStats.mortars.extras.length - 1; x >= 0; --x)
			artillExtra.push(weaponStats.mortars.extras[x]);
	}
	// --END Research lists
	
}

function eventAttacked(victim, attacker)
{
	if (attacker && victim && attacker.player != me && !allianceExistsBetween(attacker.player, victim.player))
	{
		addBeacon(victim.x, victim.y, ALLIES);
		grudgeCount[attacker.player] += 1;
		
		var tanks = enumGroup(attackGroup);
		for (var i = 0; i < tanks.length; i++)
		{
			if(!repairDroid(tanks[i]))
				orderDroidObj(tanks[i], DORDER_ATTACK, attacker);
		}
		
		const derr = enumStruct(attacker, structures.derricks);
		const fac = enumStruct(attacker, structures.factories);
		var target = derr[random(derr.length)];
		var targetFac = fac[random(fac.length)];
		var vtols = enumGroup(vtolGroup);
		for (var i = 0; i < vtols.length; i++)
		{
			if(vtolReady(vtols[i])) {
				if(isDefined(target))
					orderDroidLoc(vtols[i], DORDER_SCOUT, target.x, target.y);
				else {
					if(isDefined(targetFac))
						orderDroidLoc(vtols[i], DORDER_SCOUT, targetFac.x, targetFac.y);
				}
			}
		}
		if(grudgeCount[attacker.player] > 5)
			attackStuff(attacker.player);
	}
}

function eventStartLevel()
{
	// Pretend like all buildings were just produced, to initiate productions
	var structlist = enumStruct(me);
	for (var i = 0; i < structlist.length; i++)
	{
		eventStructureBuilt(structlist[i]);
	}
	
	buildOrder();
	setTimer("buildOrder", 300);
	setTimer("produce", 700);
	setTimer("spyRoutine", 1000);
	setTimer("repairAll", 1500);
	setTimer("checkOilCount", 4000);
	setTimer("checkMood", 20000);
}

function eventDroidIdle(droid)
{
	if(droid.droidType == DROID_CONSTRUCT || droid.droidType == DROID_SENSOR)
		return false;
	
	if(droid.droidType == DROID_WEAPON || droid.droidType == DROID_CYBORG) {
		orderDroid(droid, DORDER_RTB);
	}
}

//Increase grudge counter
function eventGroupLoss(droid, group, size)
{
	var who = enumRange(droid.x, droid.y, 15, ENEMIES, true);
	for(var x = 0; x < who.length; ++x) {
		for(var y = 0; y < maxPlayers; ++y) {
			if(who[x].player == y) {
				grudgeCount[y] += 1;
			}
		}
	}
	if (lastMsg != "need tank" && enumGroup(attackGroup).length < 2) {
		lastMsg = "need tank";
		chat(ALLIES, lastMsg);
	}
	if (lastMsg != "need cyborg" && isStructureAvailable(structures.templateFactories) && enumGroup(cyborgGroup).length < 2) {
		lastMsg = "need cyborg";
		chat(ALLIES, lastMsg);
	}
	if (lastMsg != "need vtol" && isStructureAvailable(structures.vtolFactories) && enumGroup(vtolGroup).length < 2) {
		lastMsg = "need vtol";
		chat(ALLIES, lastMsg);
	}
}

function eventChat(from, to, message)
{
	if (to != me || to == from)
	{
		return; // not for me
	}
	if (message == "need truck" && allianceExistsBetween(from, to))
	{
		var droids = enumDroid(me, DROID_CONSTRUCT);
		if(droids.length < 3)
			return;
		donateObject(droids[random(droids.length)], from);
	}
	else if (message == "need power" && allianceExistsBetween(from, to))
	{
		if(playerPower(me) - queuedPower(me) > 0)
			donatePower(playerPower(me) / 2, from);
	}
	else if (message == "need tank" && allianceExistsBetween(from, to))
	{
		var droids = enumDroid(me, DROID_WEAPON);
		if(droids.length < 6)
			return;
		donateObject(droids[random(droids.length)], from);
	}
	else if (message == "need cyborg" && allianceExistsBetween(from, to))
	{
		var droids = enumDroid(me, DROID_CYBORG);
		if(droids.length < 6)
			return;
		donateObject(droids[random(droids.length)], from);
	}
	else if (message == "need vtol" && allianceExistsBetween(from, to))
	{
		var droids = enumDroid(me).filter(function(obj){ return isVTOL(obj); });
		if(droids.length < 6)
			return;
		donateObject(droids[random(droids.length)], from);
	}
	else if (message == "help me!" || message == "help me!!" && allianceExistsBetween(from, to))
	{
		var hq = enumStruct(from, structures.hqs);
		if( hq.length === 1 )
		{
			lastMsg = "Sending units to your command center!";
			chat(from, lastMsg);
			eventBeacon(hq.x, hq.y, from, me, "");
		}
		else
		{
			lastMsg = "Sorry, no can do";
			chat(from, lastMsg);
		}
	}
	else if(message == "friend" && !allianceExistsBetween(from, to))
	{
		if(grudgeCount[from] < 5)
		{
			lastMsg = "I accept";
			chat(from, lastMsg);
			setAlliance(from, me, true);
			grudgeCount[from] = 0;
		}
		else
		{
			lastMsg = "I refuse";
			chat(from, lastMsg);
		}
	}
	
	//Attacks a certain player should they be an enemy. If allied with the target player then
	//break alliance with the sender and attack them.
	for(var x = 0; x < maxPlayers; ++x)
	{
		if (message == "attack" + x && !allianceExistsBetween(x, me) && x != me)
		{
			attackStuff(x);
		}
		if (message == "attack" + x && allianceExistsBetween(x, me) )
		{
			if(x !== me)
				chat(from, "I'm no traitor");
			else
				chat(from, "You are no friend");
			
			setAlliance(from, me, false);

			chat(ALLIES, "Player " + from + " is a traitor");
			attackStuff(from);
			break;
		}
	}
}

//Better check what is going on over there.
function eventBeacon(x, y, from, to, message)
{
	if(allianceExistsBetween(from, to) || to == from)
	{
		if(lastMsg != "Help is on the way!") {
			lastMsg = "Help is on the way!";
			chat(from, lastMsg);
		}
		
		var cyborgs = enumGroup(cyborgGroup);
		var tanks = enumGroup(attackGroup);
		var vtols = enumGroup(vtolGroup);
		for (var i = 0; i < cyborgs.length; i++)
		{
			if(!random(5) && !repairDroid(cyborgs[i]))
				orderDroidLoc(cyborgs[i], DORDER_SCOUT, x, y);
		}
		for (var i = 0; i < tanks.length; i++)
		{
			if(!random(5) && !repairDroid(tanks[i]))
				orderDroidLoc(tanks[i], DORDER_SCOUT, x, y);
		}
		for (var i = 0; i < vtols.length; i++)
		{
			if(!random(5))
				orderDroidLoc(vtols[i], DORDER_SCOUT, x, y);
		}
	}
}

function eventObjectTransfer(obj, from)
{
	if(allianceExistsBetween(from, me)) {
		if(obj.type == DROID)
			eventDroidBuilt(obj, null);
		lastMsg = "Thank you!";
		chat(from, lastMsg);
	}
	/*
	if(from == me && !allianceExistsBetween(obj.player, me)) {
		if(lastMsg != "") {
			lastMsg = "";
			chat(from, lastMsg);
		}
	}
	*/
}

//Mostly meant to reduce stress about enemies.
function eventDestroyed(object)
{
	if(!allianceExistsBetween(object.player, me))
	{
		if(grudgeCount[object.player] > 0)
			grudgeCount[object.player] -= 1;
	}
}

