
//Remove hard coded stuff(subpersonalities) and improve research.

//checkMood, eventAttacked, spyroutine are the most costly.

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

function rangeStep(obj, visibility) {
	const step = 10000;
	var target;
	
	for(var i = 0; i < 99999; i += step) {	
		var temp = enumRange(obj.x, obj.y, i, ENEMIES, visibility);
		if(temp.length > 0) {
			return temp[0];
		}
	}
	
	return target;
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

function droidBusy(droid) {
	return droid.order == DORDER_ATTACK || droid.order == DORDER_SCOUT;
}

//Ally is false for checking for enemy players
//Ally is true for allies.
function playerAlliance(ally) {
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

/*
//Difficulty cheats
function researchCheat(count, tech) {
	if(isDefined(tech)) {
		for(var i = 0; i < tech.length; ++i)
			enableResearch(tech[i], me);
	}
	
	for(var i = 0; i < count; ++i) {
		var reslist = enumResearch();
		if (reslist.length > 0) {
			var idx = Math.floor(Math.random() * reslist.length);
			enableResearch(reslist[idx].name, me);
		}
	}
}

//Change stuff depending on difficulty.
function diffPerks() {	
	
	switch(difficulty) {
		case EASY:
			break;
		case MEDIUM:
			break;
		case HARD: 
			break;
		case INSANE:
			break;
	}
}
*/

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

const bodyResearch = [
	"R-Vehicle-Body05",
	"R-Vehicle-Body11",
	"R-Vehicle-Body12",
	"R-Vehicle-Body10",
	"R-Vehicle-Body14",
]

const tankBody = [
	"Body14SUP", // Dragon
	"Body13SUP", // Wyvern
	"Body10MBT", // Vengeance
	"Body9REC",  // Tiger
	"Body12SUP", // Mantis
	"Body11ABT", // Python
	"Body5REC",  // Cobra
	"Body1REC",  // Viper
];

var tankProp = [
	"tracked01", // tracked01
	"HalfTrack", // half-track
	"wheeled01", // wheels
];

const sysBody = [
	"Body3MBT",  // Retaliation
	"Body2SUP",  // Leopard
	"Body4ABT",  // Bug
	"Body1REC",  // Viper
];

const sysProp = [
	"hover01", // hover
	"wheeled01", // wheels
];

const vtolBody = [
	"Body13SUP", // Wyvern
	"Body7ABT",  // Retribution
	"Body6SUPP", // Panther
	"Body8MBT",  // Scorpion
	"Body5REC",  // Cobra
];


const subpersonalities = {
	AC: {
		"chatalias": "ac",
		"primaryWeapon": weaponStats.cannons,
		"secondaryWeapon": weaponStats.machineguns,
		"artillery": weaponStats.mortars,
		"antiAir": weaponStats.AA,
		"extra": weaponStats.nexusTech,
		"res": [
			"R-Wpn-Cannon-Damage01",
			"R-Wpn-Cannon-Damage02",
			"R-Wpn-MG2Mk1",
			"R-Wpn-MG-Damage03",
			"R-Vehicle-Prop-Tracks",
			"R-Vehicle-Prop-Hover",
			"R-Wpn-Cannon-ROF01",
			"R-Wpn-Cannon-Damage05",
			"R-Wpn-Cannon-ROF03",
			"R-Struc-VTOLPad-Upgrade01",
			"R-Wpn-Bomb02",
			"R-Wpn-MG-Damage05",
		]
	},
	AR: {
		"chatalias": "ar",
		"primaryWeapon": weaponStats.flamers,
		"secondaryWeapon": weaponStats.machineguns,
		"artillery": weaponStats.mortars,
		"antiAir": weaponStats.AA,
		"extra": weaponStats.nexusTech,
		"res": [
			"R-Wpn-MG2Mk1",
			"R-Wpn-MG-Damage03",
			"R-Wpn-Flamer-Damage02",
			"R-Wpn-Flamer-ROF01",
			"R-Vehicle-Prop-Tracks",
			"R-Vehicle-Prop-Hover",
			"R-Wpn-Flame2",
			"R-Wpn-Flamer-ROF03",
			"R-Struc-VTOLPad-Upgrade01",
			"R-Wpn-Bomb02",
			"R-Wpn-MG-Damage05",
		],
	},
	AB: {
		"chatalias": "ab",
		"primaryWeapon": weaponStats.machineguns,
		"secondaryWeapon": weaponStats.rockets_AT,
		"artillery": weaponStats.rockets_Arty,
		"antiAir": weaponStats.AA,
		"extra": weaponStats.nexusTech,
		"res": [
			"R-Wpn-MG2Mk1",
			"R-Wpn-MG-Damage03",
			"R-Vehicle-Prop-Tracks",
			"R-Vehicle-Prop-Hover",
			"R-Wpn-Rocket05-MiniPod",
			"R-Wpn-Rocket01-LtAT",
			"R-Struc-VTOLPad-Upgrade01",
			"R-Wpn-Bomb02",
			"R-Wpn-MG-Damage05",
		],
	},
}

// -- globals
// Groups
var attackGroup;
var vtolGroup;
var cyborgGroup;
var sensorGroup;
//var nexusLinkGroup
//var artilleryGroup

var grudgeCount = []; //See who bullies this bot the most and act on it
var personality = 0;
var lastMsg = "";
var buildStop = 0;

// -- Weapon research (eventGameInit)
var techlist = [];
var weaponTech = [];
var mgWeaponTech = [];
var artilleryTech = [];
var artillExtra = [];
var extraTech = [];
var vtolWeapons = [];
var vtolExtras = [];
var cyborgWeaps = [];
var antiAirTech = [];
var antiAirExtras = [];


// -- MAIN CODE --

function buildAttacker(struct) {
	const fallBack = weaponStats.machineguns.weapons;
	var useHover = 0;
	var weaps;
	var weap = [];
	
	if(personality === 1) {
		if(!random(2))
			weaps = subpersonalities["AC"]["primaryWeapon"];
		else if(!random(2))
			weaps = subpersonalities["AC"]["secondaryWeapon"];
		else
			weaps = subpersonalities["AC"]["artillery"];
	}
	else if(personality === 2) {
		if(!random(2)) {
			weaps = subpersonalities["AR"]["primaryWeapon"];
			useHover = 1;
		}
		else if (!random(2))
			weaps = subpersonalities["AR"]["secondaryWeapon"];
		else
			weaps = subpersonalities["AR"]["artillery"];
	}
	else{
		if(!random(2)) {
			weaps = subpersonalities["AB"]["primaryWeapon"];
			useHover = 1;
		}
		else if (!random(2))
			weaps = subpersonalities["AB"]["secondaryWeapon"];
		else
			weaps = subpersonalities["AB"]["artillery"];
	}
	
	for(var x = weaps.weapons.length - 1; x >= 0; --x) {
		weap.push(weaps.weapons[x].stat);
	}
	
	var virDroid = makeTemplate(me, "Virtual Droid", tankBody, tankProp, null, null, weap, weap);
	if(virDroid == null) {
		weap = [];
		for(var x = fallBack.length - 1; x >= 0; --x) {
			weap.push(fallBack[x].stat);
		}
	}
	
	if((useHover === 1 || !random(12)) && componentAvailable("hover01")) {
		tankProp = "hover01";
	}
	
	if (buildDroid(struct, "Droid", tankBody, tankProp, null, null, weap, weap)) {
		return true;
	}
	
	return false;
}

function buildSys(struct, weap) {
	if(!isDefined(weap)) {
		weap = "Spade1Mk1";
	}
	
	if (buildDroid(struct, "System unit", sysBody, sysProp, null, null, weap)) {
		return true;
	}
	return false;
}

function buildCyborg(fac) {
	var weap = [];
	var body = [];
	var prop = [];
	var weap = [];
	var weapon;
	
	if(personality === 1) {
		var rand = random(4);
		if(rand <= 2)
			weapon = subpersonalities["AC"]["primaryWeapon"];
		else
			weapon = subpersonalities["AC"]["secondaryWeapon"];
	}
	else if(personality === 2) {
		var rand = random(4);
		if(rand <= 2)
			weapon = subpersonalities["AR"]["primaryWeapon"];
		else
			weapon = subpersonalities["AR"]["secondaryWeapon"];
	}
	else {
		var rand = random(4);
		if(rand <= 2)
			weapon = subpersonalities["AB"]["primaryWeapon"];
		else
			weapon = subpersonalities["AB"]["secondaryWeapon"];
	}
	
	//weapons
	for(var x = weapon.templates.length - 1; x >= 0; --x) {
		body.push(weapon.templates[x].body);
		prop.push(weapon.templates[x].prop);
		weap.push(weapon.templates[x].weapons[0]);
	}
	
	if(buildDroid(fac, "Cyborg", body, prop, null, null, weap)) {
		return true;
	}
	return false;
}

function buildVTOL(struct) {
	var weap = [];
	const weapons = weaponStats.bombs.vtols;
	
	for(var x = weapons.length - 1; x >= 0; --x) {
		weap.push(weapons[x].stat);
	}
	
	if (buildDroid(struct, "Bomber", vtolBody, "V-Tol", null, null, weap)) {
		return true;
	}

	return false;
}

function conCanHelp(mydroid, bx, by) {
	return (mydroid.order != DORDER_HELPBUILD 
	        && mydroid.order != DORDER_BUILD
	        && mydroid.order != DORDER_LINEBUILD
			&& mydroid.busy != true
	        && droidCanReach(mydroid, bx, by));
}

function distanceToBase(obj1, obj2) {
	var dist1 = distBetweenTwoPoints(startPositions[me].x, startPositions[me].y, obj1.x, obj1.y);
	var dist2 = distBetweenTwoPoints(startPositions[me].x, startPositions[me].y, obj2.x, obj2.y);
	return (dist1 - dist2);
}

function buildStructure(droid, stat) {
	if (!isStructureAvailable(stat, me))
		return false;
	
	var loc = pickStructLocation(droid, stat, droid.x, droid.y, 0);
	if (!isDefined(loc))
		return false;	
	
	var derricks = countStruct(structures.derricks);
	var dist = distBetweenTwoPoints(startPositions[me].x, startPositions[me].y, droid.x, droid.y);
	//Try not to build stuff in dangerous locations
	if (!safeDest(me, loc.x, loc.y) || dist > (15 + (2 * derricks))) {
		orderDroid(droid, DORDER_RTB);
		return false;
	}
	
	if(orderDroidBuild(droid, DORDER_BUILD, stat, loc.x, loc.y))
		return true;
	return false;
}

function buildStuff(struc, module) {
	var construct = enumDroid(me, DROID_CONSTRUCT);
	
	if (construct.length > 0) {
		var freeTrucks = [];
		for(var x = 0; x < construct.length; x++) {
			if (conCanHelp(construct[x], construct[x].x, construct[x].y)) {
				freeTrucks.push(construct[x]);
			}
		}
		
		if(freeTrucks.length > 0) {
			var truck = freeTrucks[random(freeTrucks.length)];
			
			if(isDefined(module)) {
				if(orderDroidBuild(truck, DORDER_BUILD, module, struc.x, struc.y))
					return true;
			}
			if(struc != structures.derricks) {
				if(buildStructure(truck, struc))
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

function checkUnfinishedStructures() {
	const struct = enumStruct(me).filter(function(struct){ return struct.status != BUILT});
	
	if(struct.length === 0)
		return false;
	
	const trucks = enumDroid(me, DROID_CONSTRUCT).filter(function(obj){ 
		return conCanHelp(obj, struct[0].x, struct[0].y)
	});
	
	if(trucks.length === 0)
		return false;
	
	if (orderDroidObj(trucks[0], DORDER_HELPBUILD, struct[0]))
		return true;
	return false;
}

function lookForOil() {
	var droids = enumDroid(me, DROID_CONSTRUCT);
	var oils = enumFeature(-1, oilResources);
	var s = 0;
	
	if (oils.length > 0) {
		oils.sort(distanceToBase); // grab closer oils first
		for (var i = 0; i < oils.length; i++) {
			for (var j = 0; j < droids.length; j++) {
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

function buildDefenses() {
	var enemies = playerAlliance(false);
	var enemyVtolCount = 0;
	
	for (var x = 0; x < enemies.length; ++x) {
		var temp = enumDroid(enemies[x]).filter(function(obj){ return isVTOL(obj) }).length;
		enemyVtolCount += temp;
	}
	
	if(enemyVtolCount > 0 && playerPower(me) > 130) {
		if(isStructureAvailable("AASite-QuadMg1")) {
			if(isStructureAvailable("AASite-QuadRotMg")) {
				if(buildStuff("AASite-QuadRotMg")) { return true; }
			}
			else { 
				if(buildStuff("AASite-QuadMg1")) { return true; }
			}
		}
	}
	
	return false;
}

function buildPhase1() {
	if(countAndBuild(structures.factories, 1)) { return true; }
	if(countAndBuild(structures.labs, 1)) { return true; }
	if(countAndBuild(structures.hqs, 1)) { return true; }
	
	if ((countStruct(structures.derricks) - countStruct(structures.gens) * 4) > 0 
		&& isStructureAvailable(structures.gens) || countStruct(structures.gens) < 1
		&& buildStop === 0) 
	{
		buildStop = 1;
		if(buildStuff(structures.gens)) {
			buildStop = 0;
			return true;
		}
	}
	
	if (isStructureAvailable(structures.templateFactories)) {
		if (countAndBuild(structures.templateFactories, 1)) { return true; }
	}
	
	if(isStructureAvailable(structures.extras[0])) {
		if(countAndBuild(structures.extras[0], 1)) { return true; }
	}
	
	return false;
}

function buildPhase2() {
	if (playerPower(me) > 80 && isStructureAvailable(structures.templateFactories)) {
		if (countAndBuild(structures.templateFactories, 3)) { return true; }
	}
	
	if(gameTime > 210000 && playerPower(me) > 85 ) {
		if(isStructureAvailable(structures.extras[0])) {
			if(countAndBuild(structures.extras[0], 2)) { return true; }
		}
		if(countAndBuild(structures.labs, 3)) { return true; }
		if(countAndBuild(structures.factories, 3)) { return true; }
	}
	
	return false;
}

function buildPhase3() {
	
	if(gameTime > 680000 && playerPower(me) > 200 ) {
		if (componentAvailable("Bomb1-VTOL-LtHE") && isStructureAvailable(structures.vtolFactories)) {
			var vtols = enumGroup(vtolGroup).length
			var pads = 2 * countStruct(structures.vtolPads);
		
			if(isStructureAvailable(structures.vtolPads) && (pads < vtols) && buildStuff(structures.vtolPads))
				return true;
			if (countAndBuild(structures.vtolFactories, 1))
				return true;
		}
		
		if(countAndBuild(structures.labs, 5)) { return true; }
		if(countAndBuild(structures.factories, 5)) { return true; }
		
		if (playerPower(me) > 160 && isStructureAvailable(structures.templateFactories)) {
			if (countAndBuild(structures.templateFactories, 5))
				return true;
		}
		
		if(isStructureAvailable(structures.extras[0])) {
			if(countAndBuild(structures.extras[0], 5)) { return true; }
		}
	}
	
	return false;
}

function buildPhase4() {
	if (componentAvailable("Bomb1-VTOL-LtHE") && playerPower(me) > 230 && isStructureAvailable(structures.vtolFactories))
	{
		var vtols = enumGroup(vtolGroup).length
		var vtFac = countStruct(structures.vtolFactories);
		var pads = 2 * countStruct(structures.vtolPads);
		
		if(isStructureAvailable(structures.vtolPads) && (pads < vtols) && buildStuff(structures.vtolPads))
			return true;
		if (vtFac < 5 && countAndBuild(structures.vtolFactories, vtFac + 1))
			return true;
	}
	
	return false;
}

function buildPhase5() {
	if(playerPower(me) > 250 && isStructureAvailable(structures.extras[1])) {
		if(!countStruct(structures.extras[1]) && countAndBuild(structures.extras[1], 1))
			return true;
	}
	
	if(playerPower(me) > 250 && isStructureAvailable(structures.extras[2])) {
		if(!countStruct(structures.extras[2]) && countAndBuild(structures.extras[2], 1))
			return true;
	}
	
	return false;
}

function buildOrder() {
	if(checkUnfinishedStructures()) { return false; }
	if(buildPhase1()) { return false; }
	lookForOil();
	if(gameTime > 80000 && maintenance()) { return false; }
	if(buildDefenses()) { return false; }
	if(playerPower(me) > 110) {
		if(buildPhase2()) { return false; }
		if(buildPhase3()) { return false; }
		if(buildPhase4()) { return false; }
		if(buildPhase5()) { return false; }
	}
}

function maintenance() {
	const list = ["A0PowMod1", "A0ResearchModule1", "A0FacMod1", "A0FacMod1"];
	const mods = [1, 1, 2, 2]; //Number of modules paired with list above
	var struct = null, module = "", structList = [];
	
	for (var i = 0; i < list.length; ++i) {
		if (isStructureAvailable(list[i]) && struct == null ) {
			switch(i) {
				case 0: { structList = enumStruct(me, POWER_GEN);  break; }
				case 1: { structList = enumStruct(me, RESEARCH_LAB);  break; }
				case 2: { structList = enumStruct(me, FACTORY);  break; }
				case 3: { structList = enumStruct(me, VTOL_FACTORY);  break; }
				default: { break; }
			}
			
			for (var c = 0; c < structList.length; ++c) {
				if (structList[c].modules < mods[i]) {
					//Only build the last factory module if we have a heavy body
					if(i === 2 && structList[c].modules === 1 && !componentAvailable("Body11ABT")) {
						continue;
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
	
	if (playerPower(me) > 50 && struct || (struct && module === list[0])) {
		if(buildStuff(struct, module))
			return true;
	}
	
	return false;
}

function checkMood() {
	buildStop = 0; //Not the best spot, but it will prevent too many power gens being built.
	//Tell allies (ideally non-bots) who is attacking Cobra the most
	var temp = 0;
	var next = 0;
	for(var x = 0; x < maxPlayers; ++x) {
		temp = grudgeCount[x];
		if(temp > 0 && temp > grudgeCount[next])
			next = x;
	}
	if(grudgeCount[next] > 5 && "Most harmful player: " + next) {
		lastMsg = "Most harmful player: " + next;
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
			
			for (var i = 0; i < cyborgs.length; i++) {
				if(isDefined(target) && !repairDroid(cyborgs[i]))
					orderDroidLoc(cyborgs[i], DORDER_SCOUT, target.x, target.y)
			}
		
			//Attack their base!
			var targetFac = fac[random(fac.length)];
			var targetCyb = cybFac[random(cybFac.length)];
			var vtols = enumGroup(vtolGroup);
			
			for (var i = 0; i < vtols.length; ++i) {
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
function attackStuff(attacker) {
	var attackers = enumGroup(attackGroup);
	var cyborgs = enumGroup(cyborgGroup);
	var vtols = enumGroup(vtolGroup);
	var enemy = playerAlliance(false);
	var str = lastMsg.slice(0, -1);
	
	if(attackers.length > 7) {
		var selectedEnemy = enemy[random(enemy.length)];
		if(isDefined(attacker) && !allianceExistsBetween(attacker, me) && (attacker !== me)) {
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
	
		for (var j = 0; j < attackers.length; j++) {
			if(isDefined(targetFac) && !repairDroid(attackers[j]))
				orderDroidLoc(attackers[j], DORDER_SCOUT, targetFac.x, targetFac.y);
			else
				break;
		}

		if(cyborgs.length > 7) {
			for (var j = 0; j < cyborgs.length; j++) {
				if(isDefined(target) && !repairDroid(cyborgs[j]))
					orderDroidLoc(cyborgs[j], DORDER_SCOUT, target.x, target.y);
				else
					break;
			}
		}
		if(vtols.length > 6) {
			for (var j = 0; j < vtols.length; j++) {
				if (vtolReady(vtols[j])) {
					if(isDefined(cybFac))
						orderDroidLoc(vtols[j], DORDER_SCOUT, cybFac.x, cybFac.y);
				}
			}
		}
	}
}

function produce() {
	var fac = enumStruct(me, structures.factories);
	var cybFac = enumStruct(me, structures.templateFactories);
	var vtolFac = enumStruct(me, structures.vtolFactories);
	var extra = false;
	
	for(var x = 0; x < fac.length; ++x) {
		if(isDefined(fac[x]) && structureIdle(fac[x])) {
			if (extra === false && countDroid(DROID_CONSTRUCT, me) < 4) {
				if(countDroid(DROID_CONSTRUCT, me) < 2 && gameTime > 10000) {
					lastMsg = "need truck";
					chat(ALLIES, lastMsg);
				}
				buildSys(fac[x], "Spade1Mk1");
				extra = true;
			}
			else if(enumGroup(attackGroup).length > 7 && extra === false && enumGroup(sensorGroup).length < 2 ) {
				if(componentAvailable("Sensor-WideSpec")) {
					buildSys(fac[x], "Sensor-WideSpec");
				}
				else {
					buildSys(fac[x], "SensorTurret1Mk1");
				}
				extra = true;
			}
			else {
				buildAttacker(fac[x]);
			}
		}
	}
	
	for(var x = 0; x < cybFac.length; ++x) {
		if(isDefined(cybFac[x]) && structureIdle(cybFac[x])) {
			buildCyborg(cybFac[x]);
		}
	}
	
	for(var x = 0; x < vtolFac.length; ++x) {
		if(isDefined(vtolFac[x]) && structureIdle(vtolFac[x])) {
			buildVTOL(vtolFac[x]);
		}
	}
	
	eventResearched();
}

function repairDroid(droid, force) {
	if(!isDefined(force))
		force = false;
	
	var repairs = countStruct(structures.extras[0]);
	if(repairs > 0 && (droid.health < 30 || force)) {
		orderDroid(droid, DORDER_RTR);
		return true;
	}
	return false;
}

function repairAll() {
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

//only use one sensor and keep the extras as backup in case it dies
function spyRoutine() {
	var sensors = enumGroup(sensorGroup);
	if(!sensors.length)
		return false;

	if(sensors[0].health < 60)
		repairDroid(sensors[0], true);


	//Observe closest enemy object
	var object = rangeStep(sensors[0], false);
	if(isDefined(object) && droidCanReach(sensors[0], object.x, object.y)) {
		orderDroidObj(sensors[0], DORDER_OBSERVE, object);

		var tanks = enumGroup(attackGroup);
		tanks.sort(distanceToBase);
		if(tanks.length > 10) {
			var xPos = (sensors[0].x + object.x) / 2;
			var yPos = (sensors[0].y + object.y) / 2;
			orderDroidLoc(tanks[0], DORDER_SCOUT, xPos, yPos);
		}
	}
}

//Attack enemy oil when tank group is large enough
function attackEnemyOil() {
	var tanks = enumGroup(attackGroup);
	if(tanks.length < 7)
		return false;
		
	var enemy = playerAlliance(false);
	var derr = [];
	
	for(var i = 0; i < enemy.length; ++i) {
		derr.concat(enumStruct(enemy[i], structures.derricks));
	}
	
	if(derr.length === 0)
		return false;
		
	for(var i = 0; i < tanks.length; ++i) {
		if(i < derr.length) {
			derr.sort(distanceToBase);
			orderDroidObj(tanks[i], DORDER_ATTACK, derr[0]);
		}
		else
			break;
	}
}

// --- game events

//Needs to be better here
function eventResearched(tech, labparam) {
	if(playerPower(me) < 30) {
		if(lastMsg != "need power") {
			lastMsg = "need power";
			chat(ALLIES, lastMsg);
		}
		queue("eventResearched", 1000);
		return;
	}
	
	var num = random(3);
	var defenseTech = [];
	if(num === 0) { defenseTech = kineticResearch; }
	else if(num === 1) { defenseTech = thermalResearch;}
	//else { defenseTech.push("R-Struc-Materials09"); } 

	var lablist = enumStruct(me, structures.labs);
	for (i = 0; i < lablist.length; i++) {
		var lab = lablist[i];
		if (lab.status == BUILT && structureIdle(lab)) {
			var found = pursueResearch(lab, techlist);
			
			if(!found)
				found = pursueResearch(lab, "R-Struc-PowerModuleMk1");
			if(!found)
				found = pursueResearch(lab, "R-Vehicle-Prop-Halftracks");
			if(!found)
				found = pursueResearch(lab, "R-Vehicle-Body05");
			if(!found)
				found = pursueResearch(lab, fastestResearch);
			if(!found)
				found = pursueResearch(lab, "R-Struc-Power-Upgrade03a");
			if(!found)
				found = pursueResearch(lab, defenseTech);
			if(!found)
				found = pursueResearch(lab, "R-Struc-RprFac-Upgrade01");
			if(!found)
				found = pursueResearch(lab, mgWeaponTech);
			
			if(!found)
				found = pursueResearch(lab, weaponTech);
			if(!found)
				found = pursueResearch(lab, artilleryTech);

			if(!found)
				found = pursueResearch(lab, bodyResearch);
			if(!found)
				found = pursueResearch(lab, "R-Sys-Autorepair-General");

			if(!found)
				found = pursueResearch(lab, "R-Wpn-MG-Damage08");
			if(!found)
				found = pursueResearch(lab, extraTech);
			if(!found)
				found = pursueResearch(lab, artillExtra);
			
			if(!found)
				found = pursueResearch(lab, vtolWeapons);
			if(!found && playerPower(me) > 80)
				found = pursueResearch(lab, antiAirTech);
			if(!found && playerPower(me) > 80)
				found = pursueResearch(lab, antiAirExtras);
			if(!found)
				found = pursueResearch(lab, vtolExtras);
			
			if(!found)
				found = pursueResearch(lab, "R-Struc-RprFac-Upgrade06");
			if(!found && cyborgWeaps.length > 0)
				found = pursueResearch(lab, cyborgWeaps);
			if(!found)
				found = pursueResearch(lab, fundamentalResearch);
		}
	}
}

function eventStructureBuilt(struct, droid) {
	if (struct.stattype == RESEARCH_LAB) {
		queue("eventResearched");
	}
	else if (struct.stattype == FACTORY || struct.stattype == CYBORG_FACTORY || struct.stattype == VTOL_FACTORY) {
		produce();
	}
}

function eventDroidBuilt(droid, struct) {
	if (droid) {
		if (isVTOL(droid)) {
			groupAdd(vtolGroup, droid);
		}
		else if (droid.droidType == DROID_WEAPON) {
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

//Initialize groups and research
function eventGameInit() {
	attackGroup = newGroup();
	vtolGroup = newGroup();
	cyborgGroup = newGroup();
	sensorGroup = newGroup();
	lastMsg = "eventGameInit";
	personality = random(3) + 1;
	buildStop = 0;
	
	tankProp = [
		"tracked01", // tracked01
		"HalfTrack", // half-track
		"wheeled01", // wheels
	];
	
	for(var i = 0; i < maxPlayers; ++i) {
		grudgeCount.push(0);
	}
	
	//-- START Group initialization
	var tanks = enumDroid(me, DROID_WEAPON);
	var cyborgs = enumDroid(me, DROID_CYBORG);
	var vtols = enumDroid(me).filter(function(obj){ return isVTOL(obj) });
	var sensors = enumDroid(me, DROID_SENSOR);
	
	for(var i = 0; i < tanks.length; ++i) {
		groupAdd(attackGroup, tanks[i]);
	}
	for(var i = 0; i < cyborgs.length; ++i) {
		groupAdd(cyborgGroup, cyborgs[i]);
	}
	for(var i = 0; i < vtols.length; ++i) {
		groupAdd(vtolGroup, vtols[i]);
	}
	for(var i = 0; i < sensors.length; ++i) {
		groupAdd(attackGroup, sensors[i]);
	}
	
	// --END Group initialization
	
	// --START Research lists
	for(var x = 0; x < weaponStats.bombs.vtols.length; ++x)
		vtolWeapons.push(weaponStats.bombs.vtols[x].res);
	for(var x = 0; x < weaponStats.bombs.extras.length; ++x)
		vtolExtras.push(weaponStats.bombs.extras[x]);
	for(var x = 0; x < weaponStats.AA.defenses.length; ++x)
		antiAirTech.push(weaponStats.AA.defenses[x].res);
	for(var x = 0; x < weaponStats.AA.extras.length; ++x)
		antiAirExtras.push(weaponStats.AA.extras[x]);
	
	for(var x = 0; x < weaponStats.machineguns.weapons.length; ++x)
		mgWeaponTech.push(weaponStats.machineguns.weapons[x].res);
	
	if(personality === 1) {
		techlist = subpersonalities["AC"]["res"];
		for(var x = 0; x < weaponStats.cannons.weapons.length;  ++x)
			weaponTech.push(weaponStats.cannons.weapons[x].res);
		for(var x = 0; x < weaponStats.mortars.weapons.length; ++x)
			artilleryTech.push(weaponStats.mortars.weapons[x].res);
		for(var x = 0; x < weaponStats.cannons.extras.length; ++x)
			extraTech.push(weaponStats.cannons.extras[x]);
		for(var x = 0; x < weaponStats.mortars.extras.length; ++x)
			artillExtra.push(weaponStats.mortars.extras[x]);
		for(var x = 0; x < weaponStats.cannons.templates.length; ++x)
			cyborgWeaps.push(weaponStats.cannons.templates[x].res);
	}
	else if(personality === 2) {
		techlist = subpersonalities["AR"]["res"];
		for(var y = 0; y < weaponStats.flamers.weapons.length; ++y)
			weaponTech.push(weaponStats.flamers.weapons[y].res);
		for(var y = 0; y < weaponStats.mortars.weapons.length; ++y)
			artilleryTech.push(weaponStats.mortars.weapons[y].res);
		for(var y = 0; y < weaponStats.flamers.extras.length; ++y)
			extraTech.push(weaponStats.flamers.extras[y]);
		for(var y = 0; y < weaponStats.mortars.extras.length; ++y)
			artillExtra.push(weaponStats.mortars.extras[y]);
	}
	else {
		techlist = subpersonalities["AB"]["res"];
		for(var y = 0; y < weaponStats.rockets_AT.weapons.length; ++y)
			weaponTech.push(weaponStats.rockets_AT.weapons[y].res);
		for(var y = 0; y < weaponStats.rockets_Arty.weapons.length; ++y)
			artilleryTech.push(weaponStats.rockets_Arty.weapons[y].res);
		for(var y = 0; y < weaponStats.rockets_AT.extras.length; ++y)
			extraTech.push(weaponStats.rockets_AT.extras[y]);
		for(var y = 0; y < weaponStats.rockets_Arty.extras.length; ++y)
			artillExtra.push(weaponStats.rockets_Arty.extras[y]);
	}
	// --END Research lists
	
}

function eventAttacked(victim, attacker) {
	if (attacker && victim && attacker.player != me && !allianceExistsBetween(attacker.player, victim.player)) {
		grudgeCount[attacker.player] += 1;
		
		var tanks = enumGroup(attackGroup);
		for (var i = 0; i < tanks.length; i++) {
			if(isDefined(tanks[i]) && !repairDroid(tanks[i]))
				orderDroidObj(tanks[i], DORDER_ATTACK, attacker);
		}
		
		var vtols = enumGroup(vtolGroup);
		if(vtols.length > 5) {
			var derr = enumStruct(attacker, structures.derricks);
			var fac = enumStruct(attacker, structures.factories);
			var target = derr[random(derr.length)];
			var targetFac = fac[random(fac.length)];
			for (var i = 0; i < vtols.length; i++) {
				if(vtolReady(vtols[i])) {
					if(isDefined(target))
						orderDroidLoc(vtols[i], DORDER_SCOUT, target.x, target.y);
					else {
						if(isDefined(targetFac))
							orderDroidLoc(vtols[i], DORDER_SCOUT, targetFac.x, targetFac.y);
					}
				}
			}
		}
		if(grudgeCount[attacker.player] > 5)
			attackStuff(attacker.player);
	}
}

function eventStartLevel() {
	// Pretend like all buildings were just produced, to initiate productions
	var structlist = enumStruct(me);
	for (var i = 0; i < structlist.length; i++) {
		eventStructureBuilt(structlist[i]);
	}
	
	//diffPerks();
	
	buildOrder();
	setTimer("buildOrder", 300);
	setTimer("produce", 700);
	setTimer("repairAll", 1500);
	setTimer("attackEnemyOil", 4000);
	setTimer("spyRoutine", 8000);
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
function eventGroupLoss(droid, group, size) {
	var who = enumRange(droid.x, droid.y, 15, ENEMIES, true);
	addBeacon(droid.x, droid.y, ALLIES);
	
	if(who.length > 0)
		grudgeCount[who[0].player] += 1;
	
	if(lastMsg != "need tank" && lastMsg != "need cyborg" && lastMsg != "need vtol") {
		if (enumGroup(attackGroup).length < 2) {
			lastMsg = "need tank";
			chat(ALLIES, lastMsg);
		}
		if (countStruct(structures.templateFactories) && enumGroup(cyborgGroup).length < 2) {
			lastMsg = "need cyborg";
			chat(ALLIES, lastMsg);
		}
		if (countStruct(structures.vtolFactories) && enumGroup(vtolGroup).length < 2) {
			lastMsg = "need vtol";
			chat(ALLIES, lastMsg);
		}
	}
}

function eventChat(from, to, message)
{
	if (to != me || to == from) {
		return; // not for me
	}
	if (message == "need truck" && allianceExistsBetween(from, to)) {
		var droids = enumDroid(me, DROID_CONSTRUCT);
		if(droids.length <= 3)
			return;
		donateObject(droids[random(droids.length)], from);
	}
	else if (message == "need power" && allianceExistsBetween(from, to)) {
		if(playerPower(me) - queuedPower(me) > 0)
			donatePower(playerPower(me) / 2, from);
	}
	else if (message == "need tank" && allianceExistsBetween(from, to)) {
		var droids = enumDroid(me, DROID_WEAPON);
		if(droids.length < 6)
			return;
		donateObject(droids[random(droids.length)], from);
	}
	else if (message == "need cyborg" && allianceExistsBetween(from, to)) {
		var droids = enumDroid(me, DROID_CYBORG);
		if(droids.length < 6)
			return;
		donateObject(droids[random(droids.length)], from);
	}
	else if (message == "need vtol" && allianceExistsBetween(from, to)) {
		var droids = enumDroid(me).filter(function(obj){ return isVTOL(obj); });
		if(droids.length < 6)
			return;
		donateObject(droids[random(droids.length)], from);
	}
	else if (message == "help me!" || message == "help me!!" && allianceExistsBetween(from, to)) {
		var hq = enumStruct(from, structures.hqs);
		if( hq.length === 1 ) {
			lastMsg = "Sending units to your command center!";
			chat(from, lastMsg);
			eventBeacon(hq.x, hq.y, from, me, "");
		}
		else {
			lastMsg = "Sorry, no can do";
			chat(from, lastMsg);
		}
	}
	else if(message == "friend" && !allianceExistsBetween(from, to) && gameTime > 210000) {
		if(grudgeCount[from] < 5) {
			lastMsg = "I accept";
			chat(from, lastMsg);
			setAlliance(from, me, true);
			grudgeCount[from] = 0;
		}
		else {
			lastMsg = "I refuse";
			chat(from, lastMsg);
		}
	}
	
	//Attacks a certain player should they be an enemy. If allied with the target player then
	//break alliance with the sender and attack them.
	for(var x = 0; x < maxPlayers; ++x) {
		if (message == "attack" + x && !allianceExistsBetween(x, me) && x != me) {
			attackStuff(x);
		}
		if (message == "attack" + x && allianceExistsBetween(x, me) ) {
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
function eventBeacon(x, y, from, to, message) {
	if(allianceExistsBetween(from, to) || to == from) {
		if(lastMsg != "Help is on the way!") {
			lastMsg = "Help is on the way!";
			chat(from, lastMsg);
		}
		
		var cyborgs = enumGroup(cyborgGroup);
		var tanks = enumGroup(attackGroup);
		var vtols = enumGroup(vtolGroup);
		for (var i = 0; i < cyborgs.length; i++) {
			if(!random(5) && !repairDroid(cyborgs[i]))
				orderDroidLoc(cyborgs[i], DORDER_SCOUT, x, y);
		}
		for (var i = 0; i < tanks.length; i++) {
			if(!random(5) && !repairDroid(tanks[i]))
				orderDroidLoc(tanks[i], DORDER_SCOUT, x, y);
		}
		for (var i = 0; i < vtols.length; i++) {
			if(!random(5))
				orderDroidLoc(vtols[i], DORDER_SCOUT, x, y);
		}
	}
}

function eventObjectTransfer(obj, from)
{
	if(from !== me && allianceExistsBetween(from, me)) {
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
function eventDestroyed(object) {
	if(!allianceExistsBetween(object.player, me)) {
		if(grudgeCount[object.player] > 0)
			grudgeCount[object.player] -= 1;
	}
}

//Basic Laser Satellite support
function eventStructureReady(structure) {
	var enemy = playerAlliance(false);
	var facs = [];
	
	enemy = enemy[random(enemy.length)];
	facs = facs.concat(enumStruct(enemy, FACTORY), enumStruct(enemy, CYBORG_FACTORY));
	
	if(facs.length > 0)
		activateStructure(structure, facs[random(facs.length)]);
}