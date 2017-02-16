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

function rangeStep(obj, visibility) {
	const step = 10000;
	var target;
	
	for(var i = 0; i < 30000; i += step) {	
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
			if(!allianceExistsBetween(i, me) && (i != me)) {
				players.push(i);
			}
		}
		else {
			if(allianceExistsBetween(i, me) && (i != me)) {
				players.push(i);
			}
		}
	}
	return players;
}

//Change stuff depending on difficulty.
function diffPerks() {	
	switch(difficulty) {
		case EASY:
			break;
		case MEDIUM:
			break;
		case HARD:
			if(!isStructureAvailable("A0PowMod1"))
				completeRequiredResearch("R-Struc-PowerModuleMk1");
			break;
		case INSANE:
			if(!isStructureAvailable("A0PowMod1"))
				completeRequiredResearch("R-Struc-PowerModuleMk1");
			nexusWaveOn = true;
			if(isDefined(scavengerNumber))
				setAlliance(scavengerNumber, me, true); //Scavs are friendly
			break;
	}
}

// log function
function log(message) {
	dump(gameTime + " : " + message);
}

function logObj(obj, message) {
	dump(gameTime + " [" + obj.name + " id=" + obj.id + "] > " + message);
}

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
	"R-Vehicle-Body11",
	"R-Vehicle-Body12",
	"R-Vehicle-Body09",
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

const tankProp = [
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
		"tertiaryWeapon": weaponStats.lasers,
		"artillery": weaponStats.mortars,
		"antiAir": weaponStats.AA,
		"res": [
			"R-Wpn-MG-Damage01",
			"R-Struc-PowerModuleMk1",
			"R-Wpn-MG2Mk1",
			"R-Wpn-Cannon-Damage02",
			"R-Vehicle-Body11",
			"R-Vehicle-Prop-Tracks",
			"R-Vehicle-Prop-Hover",
			"R-Struc-RprFac-Upgrade01",
			"R-Wpn-MG-Damage04",
			"R-Wpn-Cannon-ROF01",
			"R-Wpn-Cannon-Damage03",
			"R-Struc-VTOLPad-Upgrade01",
			"R-Wpn-Bomb02",
		],
	},
	AR: {
		"chatalias": "ar",
		"primaryWeapon": weaponStats.flamers,
		"secondaryWeapon": weaponStats.machineguns,
		"tertiaryWeapon": weaponStats.lasers,
		"artillery": weaponStats.mortars,
		"antiAir": weaponStats.AA,
		"res": [
			"R-Wpn-MG-Damage01",
			"R-Struc-PowerModuleMk1",
			"R-Wpn-MG2Mk1",
			"R-Wpn-Flamer-Damage02",
			"R-Wpn-Flamer-ROF01",
			"R-Vehicle-Body11",
			"R-Vehicle-Prop-Tracks",
			"R-Vehicle-Prop-Hover",
			"R-Struc-RprFac-Upgrade01",
			"R-Wpn-MG-Damage04",
			"R-Wpn-Flamer-ROF03",
			"R-Struc-VTOLPad-Upgrade01",
			"R-Wpn-Bomb02",
		],
	},
	AB: {
		"chatalias": "ab",
		"primaryWeapon": weaponStats.machineguns,
		"secondaryWeapon": weaponStats.rockets_AT,
		"tertiaryWeapon": weaponStats.lasers,
		"artillery": weaponStats.rockets_Arty,
		"antiAir": weaponStats.AA,
		"res": [
			"R-Wpn-MG-Damage01",
			"R-Struc-PowerModuleMk1",
			"R-Wpn-MG2Mk1",
			"R-Vehicle-Body11",
			"R-Vehicle-Prop-Tracks",
			"R-Vehicle-Prop-Hover",
			"R-Struc-RprFac-Upgrade01",
			"R-Wpn-MG-Damage04",
			"R-Wpn-Rocket06-IDF",
			"R-Struc-VTOLPad-Upgrade01",
			"R-Wpn-Bomb02",
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
var personality; //Initialization in eventStartLevel()
var lastMsg = "";
var buildStop = 0;
var forceHover; //Initialization in eventStartLevel()
var seaMapWithLandEnemy; //Initialization in eventStartLevel()
var turnOffCyborgs;
var nexusWaveOn;
var scavengerNumber;

// -- Weapon research (initializeResearchLists)
var techlist;
var weaponTech;
var mgWeaponTech;
var laserTech;
var artilleryTech;
var artillExtra;
var laserExtra;
var extraTech;
var vtolWeapons;
var vtolExtras;
var cyborgWeaps;
var antiAirTech;
var antiAirExtras;


// -- MAIN CODE --

function buildAttacker(struct) {
	
	//May not be defined yet
	if(!isDefined(forceHover) || !isDefined(seaMapWithLandEnemy))
		return false;
	if(forceHover === true && seaMapWithLandEnemy === false && !componentAvailable("hover01"))
		return false;
	
	var useHover = false;
	var weaps;
	var weap = [];
	
	
	if(personality === 1) {
		if(!random(2))
			weaps = subpersonalities["AC"]["primaryWeapon"];
		else if(!random(2))
			weaps = subpersonalities["AC"]["secondaryWeapon"];
		else if(!random(2))
			weaps = subpersonalities["AC"]["artillery"];
		else
			weaps = subpersonalities["AC"]["tertiaryWeapon"];
	}
	else if(personality === 2) {
		if(!random(2)) {
			weaps = subpersonalities["AR"]["primaryWeapon"];
			useHover = true;
		}
		else if(!random(2))
			weaps = subpersonalities["AR"]["secondaryWeapon"];
		else if(!random(2))
			weaps = subpersonalities["AR"]["artillery"];
		else
			weaps = subpersonalities["AR"]["tertiaryWeapon"];
	}
	else{
		if(!random(2)) {
			weaps = subpersonalities["AB"]["primaryWeapon"];
		}
		else if(!random(2))
			weaps = subpersonalities["AB"]["secondaryWeapon"];
		else if(!random(2))
			weaps = subpersonalities["AB"]["artillery"];
		else
			weaps = subpersonalities["AB"]["tertiaryWeapon"];
	}
	
	for(var x = weaps.weapons.length - 1; x >= 0; --x) {
		weap.push(weaps.weapons[x].stat);
	}
	
	var virDroid = makeTemplate(me, "Virtual Droid", tankBody, tankProp, null, null, weap, weap);
	if(virDroid == null) {
		weap = [];
		for(var x = weaponStats.machineguns.weapons.length - 1; x >= 0; --x) {
			weap.push(weaponStats.machineguns.weapons[x].stat);
		}
	}
	
	if((useHover === true || forceHover === true || !random(12)) && componentAvailable("hover01")) {
		buildDroid(struct, "Hover Droid", tankBody, "hover01", null, null, weap, weap);
		return true; //Forced success
	}
	
	if (buildDroid(struct, "Droid", tankBody, tankProp, null, null, weap, weap)) { return true; }
	
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
		if(!random(2))
			weapon = subpersonalities["AC"]["primaryWeapon"];
		else if(!random(2))
			weapon = subpersonalities["AC"]["secondaryWeapon"];
		else
			weapon = subpersonalities["AC"]["tertiaryWeapon"];
	}
	else if(personality === 2) {
		if(!random(2))
			weapon = subpersonalities["AR"]["primaryWeapon"];
		else if(!random(2))
			weapon = subpersonalities["AR"]["secondaryWeapon"];
		else
			weapon = subpersonalities["AR"]["tertiaryWeapon"];
	}
	else {
		if(!random(2))
			weapon = subpersonalities["AB"]["primaryWeapon"];
		else if(!random(2))
			weapon = subpersonalities["AB"]["secondaryWeapon"];
		else
			weapon = subpersonalities["AB"]["tertiaryWeapon"];
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
	if (!safeDest(me, loc.x, loc.y) || dist > (8 + Math.floor(1.5 * derricks))) {
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
	var struct = enumStruct(me).filter(function(struct){ return struct.status != BUILT});
	
	//Prevent trucks from moving to finished structures that were previously unfinished
	var allTrucks = enumDroid(me, DROID_CONSTRUCT);
	if(struct.length === 0) {
		for(var i = 0; i < allTrucks.length; ++i) {
			allTrucks[i].busy = false;
		}
	}
	
	if(struct.length > 0) {
		var trucks = enumDroid(me, DROID_CONSTRUCT).filter(function(obj){ 
			return conCanHelp(obj, struct[0].x, struct[0].y)
		});
	
		if(trucks.length > 0) {
			if (orderDroidObj(trucks[0], DORDER_HELPBUILD, struct[0]))
				return true;
		}
	}
	return false;
}

function lookForOil() {
	var droids = enumDroid(me, DROID_CONSTRUCT);
	
	if(droids.length > 1) {
		var oils = enumFeature(-1, oilResources);
		var s = 0;
	
		if(oils.length < 2 && !random(2))
			return false;
	
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
	
	if (isDefined(turnOffCyborgs) && turnOffCyborgs === false && isStructureAvailable(structures.templateFactories)) {
		if (countAndBuild(structures.templateFactories, 1)) { return true; }
	}
	
	if(isStructureAvailable(structures.extras[0])) {
		if(countAndBuild(structures.extras[0], 1)) { return true; }
	}
	
	if(isStructureAvailable(structures.vtolPads)
		&& (2 * countStruct(structures.vtolPads) < enumGroup(vtolGroup).length) && buildStuff(structures.vtolPads))
		return true;
	
	return false;
}

function buildPhase2() {
	if(gameTime > 210000 && playerPower(me) > 80) {
		if(countAndBuild(structures.labs, 3)) { return true; }
		if(isStructureAvailable(structures.extras[0])) {
			if(countAndBuild(structures.extras[0], 1)) { return true; }
		}
		if (isDefined(turnOffCyborgs) && turnOffCyborgs === false && isStructureAvailable(structures.templateFactories)) {
			if (countAndBuild(structures.templateFactories, 3)) { return true; }
		}
		if(countAndBuild(structures.factories, 3)) { return true; }
	}
	
	return false;
}

function buildPhase3() {
	if(countAndBuild(structures.labs, 5)) { return true; }
	
	if(gameTime > 680000 && playerPower(me) > 110 ) {
		if (componentAvailable("Bomb1-VTOL-LtHE") && isStructureAvailable(structures.vtolFactories)) {
			var vtols = enumGroup(vtolGroup).length
			var pads = 2 * countStruct(structures.vtolPads);
		
			if (countAndBuild(structures.vtolFactories, 2))
				return true;
		}
		
		if (isDefined(turnOffCyborgs) && turnOffCyborgs === false && isStructureAvailable(structures.templateFactories)) {
			if (countAndBuild(structures.templateFactories, 5)) { return true; }
		}
		
		if(countAndBuild(structures.factories, 5)) { return true; }
		
		if(isStructureAvailable(structures.extras[0])) {
			if(countAndBuild(structures.extras[0], 5)) { return true; }
		}
	}
	
	return false;
}

function buildPhase4() {
	if (componentAvailable("Bomb1-VTOL-LtHE") && playerPower(me) > 230 && isStructureAvailable(structures.vtolFactories))
	{
		if (countAndBuild(structures.vtolFactories, 5)) { return true; }
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
	if(buildPhase2()) { return false; }
	if(!buildDefenses()) { 
		if(buildPhase3()) { return false; }
		if(buildPhase4()) { return false; }
		if(buildPhase5()) { return false; }
	}
	else
		return false;
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
	
	if (playerPower(me) > 85 && struct || (struct && module === list[0])) {
		if(buildStuff(struct, module))
			return true;
	}
	
	return false;
}

function checkMood() {
	//Tell allies (ideally non-bots) who is attacking Cobra the most
	var temp = 0;
	var next = 0;
	for(var x = 0; x < maxPlayers; ++x) {
		temp = grudgeCount[x];
		if(temp > 0 && temp > grudgeCount[next])
			next = x;
	}
	if((grudgeCount[next] > 5) && (lastMsg != ("Most harmful player: " + next))) {
		lastMsg = "Most harmful player: " + next;
		chat(ALLIES, lastMsg);
	}
	
	for(var c = 0; c < maxPlayers; ++c) {
		if(grudgeCount[c] >= 30) {
			attackStuff(c);
			grudgeCount[c] = 0;
			break;
		}
		else if(grudgeCount[c] > 10 && grudgeCount[c] < 30) {
			var derr = enumStruct(c, structures.derricks);
			var struc = enumStruct(c);
			
			var cyborgs = enumGroup(cyborgGroup);
			var target;
			if(derr.length > 0)
				target = derr[random(derr.length)];
			else {
				if(struc.length > 0)
					target = struc[random(struc.length)];
				else {
					grudgeCount[c] -= 1;
					break;
				}
			}
			
			for (var i = 0; i < cyborgs.length; i++) {
				if(!repairDroid(cyborgs[i]) && isDefined(target) && droidCanReach(cyborgs[i], target.x, target.y))
					orderDroidLoc(cyborgs[i], DORDER_SCOUT, target.x, target.y)
			}
		
			var vtols = enumGroup(vtolGroup);
			var vtTarget;
			if(vtols.length > 0)
				vtTarget = rangeStep(vtols[0], false);
			
			for (var i = 0; i < vtols.length; ++i) {
				if(vtolReady(vtols[i]) && isDefined(vtTarget[0])) {
					orderDroidLoc(vtols[i], DORDER_SCOUT, vtTarget[0].x, vtTarget[0].y);
				}
			}
			
			if(!random(4))
				grudgeCount[c] -= 1;
			
			break;
		}
	}
}

//attacker is a player number
function attackStuff(attacker) {
	var tanks = enumGroup(attackGroup);
	var cyborgs = enumGroup(cyborgGroup);
	var vtols = enumGroup(vtolGroup);
	var enemy = playerAlliance(false);
	var str = lastMsg.slice(0, -1);
	
	var selectedEnemy = enemy[random(enemy.length)];
	if(isDefined(attacker) && !allianceExistsBetween(attacker, me) && (attacker !== me)) {
		selectedEnemy = attacker;
		grudgeCount[attacker] = 100;
	}
		
	var derr = enumStruct(selectedEnemy, structures.derricks);
	var fac = enumStruct(selectedEnemy, structures.factories);
	fac.concat(enumStruct(selectedEnemy, structures.templateFactories));
	
	var target = derr[random(derr.length)];
	var targetFac = fac[random(fac.length)];
		
	if(str != "attack") {
		lastMsg = "attack" + selectedEnemy;
		chat(ALLIES, lastMsg);
	}
	
	if(tanks.length > 4) {
		for (var j = 0; j < tanks.length; j++) {
			if(isDefined(targetFac) && !repairDroid(tanks[j]) && droidCanReach(tanks[j], targetFac.x, targetFac.y))
				orderDroidLoc(tanks[j], DORDER_SCOUT, targetFac.x, targetFac.y);
			else {
				var s = enumStruct(selectedEnemy);
				if(s.length > 0) {
					s.sort(distanceToBase);
					if(droidCanReach(tanks[j], s[0].x, s[0].y))
						orderDroidLoc(tanks[j], DORDER_SCOUT, s[0].x, s[0].y);
				}
			}
		}
	}

	if(isDefined(turnOffCyborgs) && turnOffCyborgs === false && cyborgs.length > 4) {
		for (var j = 0; j < cyborgs.length; j++) {
			if(isDefined(target) && !repairDroid(cyborgs[j]) && droidCanReach(cyborgs[j], target.x, target.y))
				orderDroidLoc(cyborgs[j], DORDER_SCOUT, target.x, target.y);
			else {
				var s = enumStruct(selectedEnemy);
				if(s.length > 0) {
					s.sort(distanceToBase);
					if(droidCanReach(cyborgs[j], s[0].x, s[0].y))
						orderDroidLoc(cyborgs[j], DORDER_SCOUT, s[0].x, s[0].y);
				}
			}
		}
	}
	if(vtols.length > 4) {
		for (var j = 0; j < vtols.length; j++) {
			if (vtolReady(vtols[j])) {
				var s = enumStruct(selectedEnemy);
				if(s.length > 0) {
					s.sort(distanceToBase);
					orderDroidLoc(vtols[j], DORDER_SCOUT, s[0].x, s[0].y);
				}
			}
		}
	}
}

function produce() {
	recycleObsoleteDroids();
	eventResearched(); //check for idle research centers.
	
	//Try not to produce more units. Not that anymore will be made, but it is a performance hack.
	if((enumDroid(me).length - 1) === 150)
		return false;
	
	var fac = enumStruct(me, structures.factories);
	var cybFac = enumStruct(me, structures.templateFactories);
	var vtolFac = enumStruct(me, structures.vtolFactories);
	var extra = false;
	
	for(var x = 0; x < fac.length; ++x) {
		if(isDefined(fac[x]) && structureIdle(fac[x])) {
			if (extra === false && countDroid(DROID_CONSTRUCT, me) < 4) {
				if((playerAlliance(true).length > 0) && (countDroid(DROID_CONSTRUCT, me) < 2) && (gameTime > 10000)) {
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
	
	if(isDefined(turnOffCyborgs) && turnOffCyborgs === false) {
		for(var x = 0; x < cybFac.length; ++x) {
			if(isDefined(cybFac[x]) && structureIdle(cybFac[x])) {
				buildCyborg(cybFac[x]);
			}
		}
	}
	
	for(var x = 0; x < vtolFac.length; ++x) {
		if(isDefined(vtolFac[x]) && structureIdle(vtolFac[x])) {
			buildVTOL(vtolFac[x]);
		}
	}
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


	//Observe closest enemy object with a hover unit
	var object = rangeStep(sensors[0], false);
	if(isDefined(object) && droidCanReach(sensors[0], object.x, object.y)) {
		orderDroidObj(sensors[0], DORDER_OBSERVE, object);

		var tanks = enumGroup(attackGroup).filter(function(obj) { return obj.propulsion === "hover01" });
		if(tanks.length === 0)
			tanks = enumGroup(attackGroup);
		tanks.sort(sensors[0]);
		if(tanks.length > 0) {
			var xPos = (sensors[0].x + object.x) / 2;
			var yPos = (sensors[0].y + object.y) / 2;
			orderDroidLoc(tanks[0], DORDER_SCOUT, xPos, yPos);
		}
	}
}

//Attack enemy oil when tank group is large enough.
//Prefer cyborgs over tanks.
function attackEnemyOil() {
	var tanks = enumGroup(attackGroup);
	var borgs = enumGroup(cyborgGroup);
	var who;
		
	var enemy = playerAlliance(false);
	var derr = [];
	
	for(var i = 0; i < enemy.length; ++i) {
		derr.concat(enumStruct(enemy[i], structures.derricks));
	}
	
	//Check for scavs
	if(isDefined(nexusWave) && isDefined(scavengerNumber) && nexusWave === false) {
		derr.concat(enumStruct(scavengerNumber, structures.derricks));
	}
	
	if(!derr.length)
		return false;
	
	derr.sort(distanceToBase);
	if(isDefined(turnOffCyborgs) && turnOffCyborgs === false && borgs.length > 2 && gameTime > 210000)
		who = borgs;
	else
		who = tanks;
	
	if(who.length < 3)
		return false;

	for(var i = 0; i < who.length; ++i) {
		if(i < derr.length) {
			if(isDefined(derr[0]) && !repairDroid(who[i], false) && droidCanReach(who[i], derr[0].x, derr[0].y))
				orderDroidLoc(who[i], DORDER_SCOUT, derr[i].x, derr[i].y);
		}
		else
			break;
	}
}

function initializeResearchLists() {
	techlist = [];
	weaponTech = [];
	mgWeaponTech = [];
	laserTech = [];
	artilleryTech = [];
	artillExtra = [];
	laserExtra = [];
	extraTech = [];
	vtolWeapons = [];
	vtolExtras = [];
	cyborgWeaps = [];
	antiAirTech = [];
	antiAirExtras = [];
	
	// --START Research lists
	for(var x = 0; x < weaponStats.bombs.vtols.length; ++x)
		vtolWeapons.push(weaponStats.bombs.vtols[x].res);
	for(var x = 0; x < weaponStats.bombs.extras.length; ++x)
		vtolExtras.push(weaponStats.bombs.extras[x]);
	for(var x = 0; x < weaponStats.AA.defenses.length - 1; ++x) //Do not research whirlwind hardpoint
		antiAirTech.push(weaponStats.AA.defenses[x].res);
	for(var x = 0; x < weaponStats.AA.extras.length; ++x)
		antiAirExtras.push(weaponStats.AA.extras[x]);
	
	for(var x = 0; x < weaponStats.machineguns.weapons.length; ++x)
		mgWeaponTech.push(weaponStats.machineguns.weapons[x].res);
	
	for(var x = 0; x < weaponStats.lasers.weapons.length; ++x)
		laserTech.push(weaponStats.lasers.weapons[x].res);
	for(var x = 0; x < weaponStats.lasers.weapons.length; ++x)
		laserExtra.push(weaponStats.lasers.extras[x]);
	
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
		for(var x = 0; x < weaponStats.rockets_AT.templates.length; ++x)
			cyborgWeaps.push(weaponStats.rockets_AT.templates[x].res);
	}
	
	for(var x = 0; x < weaponStats.lasers.templates.length; ++x)
		cyborgWeaps.push(weaponStats.lasers.templates[x].res);
	// --END Research lists
}

//Cobra's behavior will change dramatically if it is on a hover map. It will be more aggressive
//than usual and have stronger units and research times.
function checkIfSeaMap() {
	turnOffCyborgs = false;
	seaMapWithLandEnemy = false;
	
	for(var i = 0; i < maxPlayers; ++i) {
		if(!propulsionCanReach("wheeled01", startPositions[me].x, startPositions[me].y, startPositions[i].x, startPositions[i].y)) {
				
			//Check if it is a map 'spotter' pit
			//Cyborgs will turn off in divided maps with a physical barrier still
			var temp = 0;		
			for(var t = 0; t < maxPlayers; ++t) {
				if(!propulsionCanReach("hover01", startPositions[i].x, startPositions[i].y, startPositions[t].x, startPositions[t].y))
					temp = temp + 1;
			}

			if(temp !== maxPlayers - 1) {
				turnOffCyborgs = true; //And thus forceHover = true
				break;
			}
		}
	}

	//Determine if we are sharing land on a hover map with an enemy that can reach us via non-hover propulsion.
	if(turnOffCyborgs === true) {
		for(var i = 0; i < maxPlayers; ++i) {
			if(propulsionCanReach("wheeled01", startPositions[me].x, startPositions[me].y, startPositions[i].x, startPositions[i].y)
			&& (i !== me) && !allianceExistsBetween(i, me)) {
				//Check to see if it is a closed player slot
				if(enumDroid(i).length > 0) {
					seaMapWithLandEnemy = true;
					break;
				}
			}
			if(seaMapWithLandEnemy === true)
				break;
		}
	}
	
	return turnOffCyborgs;
}


function recycleObsoleteDroids() {
	var tanks = enumGroup(attackGroup);
	//var vtols = enumGroup(vtolGroup);
	var systems = enumGroup(sensorGroup).concat(enumDroid(me, DROID_CONSTRUCT));
 
	for(var i = 0; i < systems.length; ++i) {
		if((systems[i].propulsion != "hover01") && componentAvailable("hover01"))
			orderDroid(systems[i], DORDER_RECYCLE);
	}
	
	if(forceHover === true) {
		for(var i = 0; i < tanks.length; ++i) {
			if((tanks[i].propulsion != "hover01") && componentAvailable("hover01"))
				orderDroid(tanks[i], DORDER_RECYCLE);
		}
	}
}

//for stealing technology
function completeRequiredResearch(item) {
	var reqRes = findResearch(item);
	for(var s = 0; s < reqRes.length; ++s) {
		enableResearch(reqRes[s].name, me);
		completeResearch(reqRes[s].name, me);
	}
}

//Check the units technology and enable it for Cobra if it is new
//Called from nexusWave. (insane difficulty only). Needs to complete the research path to a weapon
function stealEnemyTechnology(droid) {
	var body = droid.body;
	var propulsion = droid.propulsion;
	var weapon = droid.weapons[0].name;
	
	//steal body technology
	if(!componentAvailable(body)) {
		for(var x = 0; x < bodyStats.length; ++x) {
			if(bodyStats[x].stat === body) {
				completeRequiredResearch(bodyStats[x].res);
				enableResearch(bodyStats[x].res, me);
				completeResearch(bodyStats[x].res, me);
				logObj(droid, "Assimilated player " + droid.player +"'s body -> " + body + ".");
				break;
			}
		}
	}
	
	//steal propulsion technology
	if(!componentAvailable(propulsion)) {
		for(var x = 0; x < propulsionStats.length; ++x) {
			if(propulsionStats[x].stat === propulsion) {
				completeRequiredResearch(propulsionStats[x].res);
				enableResearch(propulsionStats[x].res, me);
				completeResearch(propulsionStats[x].res, me);
				logObj(droid, "Assimilated player " + droid.player +"'s propulsion -> " + propulsion + ".");
				break;
			}
		}
	}
	
	//steal weapon technology
	if(!componentAvailable(weapon)) {
		
		if(droid.droidType == DROID_SENSOR) {
			/*
			const sensorRes = [
				"R-Sys-Sensor-Turret01",
				"R-Sys-CBSensor-Turret01",
				"R-Sys-VTOLCBS-Turret01",
				"R-Sys-VTOLStrike-Turret01",
				"R-Sys-RadarDetector01",
				"R-Sys-ECM-Upgrade01",
				"R-Sys-Sensor-WS",
			];
			
			for(var y = 0; y < sensorTurrets.length; ++y) {
				if(sensorTurrets[y] === weapon) {
					completeRequiredResearch(findResearch(sensorRes[y]));
					enableResearch(sensorRes[y], me);
					completeResearch(sensorRes[y], me);
					logObj(droid, "Assimilated player " + droid.player + "'s sensor -> " + weapon + ".");
					break;
				}
			}
			*/
		}
		else {
			var breakOut = false;
			for(var weaponList in weaponStats) {
				if(isVTOL(droid)) {
					for(var y = 0; y < weaponStats[weaponList].vtols.length; ++y) {
						if(weaponStats[weaponList].vtols[y].stat === weapon) {
							completeRequiredResearch(weaponStats[weaponList].vtols[y].res);
							enableResearch(weaponStats[weaponList].vtols[y].res, me);
							completeResearch(weaponStats[weaponList].vtols[y].res, me);
							logObj(droid, "Assimilated player " + droid.player + "'s vtol weapon -> " + weapon + ".");
							breakOut = true;
							break;
						}
					}
				}
				else if(droid.droidType == DROID_WEAPON) {
					for(var y = 0; y < weaponStats[weaponList].weapons.length; ++y) {
						if(weaponStats[weaponList].weapons[y].stat === weapon) {
							completeRequiredResearch(weaponStats[weaponList].weapons[y].res);
							enableResearch(weaponStats[weaponList].weapons[y].res, me);
							completeResearch(weaponStats[weaponList].weapons[y].res, me);
							logObj(droid, "Assimilated player " + droid.player +"'s tank weapon -> " + weapon + ".");
							breakOut = true;
							break;
						}
					}
				}
				else if(droid.droidType == DROID_CYBORG) {
					for(var y = 0; y < weaponStats[weaponList].templates.length; ++y) {
						if(weaponStats[weaponList].templates[y].weapons[0] === weapon) {
							completeRequiredResearch(weaponStats[weaponList].templates[y].res);
							enableResearch(weaponStats[weaponList].templates[y].res, me);
							completeResearch(weaponStats[weaponList].templates[y].res, me);
							logObj(droid, "Assimilated player " + droid.player + "'s template weapon -> " + weapon + ".");
							breakOut = true;
							break;
						}
					}
				}
				
				if(breakOut === true)
					break;
			}
		}
	}
	
	
	makeComponentAvailable(body, me);
	makeComponentAvailable(propulsion, me);
	makeComponentAvailable(weapon, me);
	//Do some other kinds of droid analysis here
}

//On insane difficulty Cobra can mess with other player's units
//in ways of stopping what they are doing or ordering them to attack
//another player or even stealing technology.
//This effect only occurs while the Cobra command center is not destroyed

/*
    Disruption of communications
    Spying on your plans and technologies --Partial
    Causing your technologies to fail --done
    Assimilating your technologies and using them to fight against you --done
*/
	
function nexusWave() {
	if(isDefined(nexusWaveOn) && (nexusWaveOn === true) && countStruct(structures.hqs) > 0) {
		var enemies = playerAlliance(false);
		var firstEnemy = enemies[random(enemies.length)];
		var firstDroids = enumDroid(firstEnemy).filter(function(d) { 
			return isVTOL(d) || d.droidType == DROID_WEAPON || d.droidType == DROID_CYBORG || d.droidType == DROID_SENSOR
		});
		var secondEnemy = enemies[random(enemies.length)];
		var secondDroids = enumDroid(secondEnemy).filter(function(d) { 
			return isVTOL(d) || d.droidType == DROID_WEAPON || d.droidType == DROID_CYBORG || d.droidType == DROID_SENSOR
		});
		
		//Steal a random player's technology
		if(isDefined(secondEnemy) && isDefined(secondDroids) && (secondDroids.length > 0)) {
			
			if(isDefined(firstEnemy) && isDefined(firstDroids) && (firstDroids.length > 0)) {
				var dr = secondDroids[random(secondDroids.length)];
				stealEnemyTechnology(dr);
			}
			
			var dr = secondDroids[random(secondDroids.length)];
			stealEnemyTechnology(dr);
			var enemyStruct = enumStruct(firstEnemy);
			
			if(enemyStruct.length > 0) {
				if(secondDroids.length > 0) {
					if(!random(12)) {
						//log("NXwave -> player " + secondDroids[0].player + " told to attack player " + enemyStruct[0].player);
						for(var j = 0; j < enemyStruct.length; ++j) {
							if(isDefined(secondDroids[j]) && isDefined(enemyStruct[j]) && secondDroids[j] && enemyStruct[j])
								orderDroidObj(secondDroids[j], DORDER_ATTACK, enemyStruct[j]);
							else
								break;
						}
					}
					else if(!random(6)) {
						//log("NXwave -> player " + secondDroids[0].player + "'s droids malfunctioned.");
						for(var j = 0; j < secondDroids.length; ++j) {
							//Basically does not do anything until order to do something again
							if(!random(2))
								orderDroidObj(secondDroids[j], DORDER_ATTACK, secondDroids[j]);
							else {
								//Or attack own units
								var dr = secondDroids[j];
								var rg = enumRange(dr.x, dr.y, 8, me, false).filter(function(obj) {
									return obj.type == DROID
								});
								if((rg.length > 0) && isDefined(rg[0]) && rg[0])
									orderDroidObj(secondDroids[j], DORDER_ATTACK, rg[random(rg.length)]);
							}
						}
					}
				}
			}
		}
	}
}

//Only on Insane difficulty
function betrayScavengers() {
	if(isDefined(scavengerNumber) && isDefined(nexusWave) 
		&& (nexusWave === true) && allianceExistsBetween(scavengerNumber, me)) {
			
		if(countStruct(structures.derricks) < 6 && gameTime > 80000) {
			var tanks = enumGroup(attackGroup);
			var derr = enumStruct(scavengerNumber, structures.derricks);
			derr.sort(distanceToBase);
			
			setAlliance(scavengerNumber, me, false);
			
			for(var i = 0; i < tanks.length; ++i) {
				if(isDefined(tanks[i]) && isDefined(derr[0]) && tanks[i] && derr[0])
					orderDroidObj(tanks[i], DORDER_ATTACK, derr[0]);
			}
			
			return; //break out of queue
		}
	}
	else if(isDefined(nexusWave) && nexusWave === false)
		return;
	
	queue("betrayScavengers", 30000);
}

//If playing teams, then break alliance with everybody and try to conquer them.
//Completely pointless feature, but makes everything a bit more fun.
function freeForAll() {
	var won = true;
	
	for (var p = 0; p < maxPlayers; ++p) {
		if (p != me && !allianceExistsBetween(p, me)) {
			var factories = countStruct("A0LightFactory", p) + countStruct("A0CyborgFactory", p);
			var droids = countDroid(DROID_ANY, p);
			if (droids > 0 || factories > 0) {
				won = false;
				break;
			}
		}
	}
	
	if(won === true) {
		var friends = playerAlliance(true);
		if(friends.length > 0) {
			if(isDefined(scavengerNumber))
				setAlliance(scavengerNumber, me, false);
			
			lastMsg = "FREE FOR ALL!";
			for(var i = 0; i < friends.length; ++i) {
				chat(friends[i], lastMsg);
				setAlliance(friends[i], me, false);
			}
		}
	}
	else 
		queue("freeForAll", 120000);
}

/*
function getDrumsAndArtifacts() {
	var objs = enumFeature(-1, OilDrum).concat(enumFeature(-1, Crate));
}
*/

// --- game events

//Needs to be better here
function eventResearched() {
	if(!isDefined(techlist) || !isDefined(artillExtra))
		return;
	
	if(playerPower(me) < 20) {
		if((playerAlliance(true).length > 0) && (lastMsg != "need power")) {
			lastMsg = "need power";
			chat(ALLIES, lastMsg);
		}
		return;
	}

	var lablist = enumStruct(me, structures.labs);
	for (var i = 0; i < lablist.length; ++i) {
		var lab = lablist[i];
		if (lab.status == BUILT && structureIdle(lab)) {
			var found = pursueResearch(lab, techlist);
			
			if(!found)
				found = pursueResearch(lab, "R-Vehicle-Prop-Halftracks");
			if(!found)
				found = pursueResearch(lab, "R-Struc-Power-Upgrade03a");
			if(isDefined(forceHover) && forceHover === true) {
				if(!found)
					found = pursueResearch(lab, "R-Vehicle-Prop-Hover");
			}
			if(!found)
				found = pursueResearch(lab, fastestResearch);
			
			
			if(isDefined(turnOffCyborgs)) {
				if(turnOffCyborgs === false) {
					if(!found)
						found = pursueResearch(lab, kineticResearch);
				}
				else {
					if(!found)
						found = pursueResearch(lab, "R-Vehicle-Metals09");
				}
			}
		
			if(!found)
				found = pursueResearch(lab, mgWeaponTech);
			if(!found)
				found = pursueResearch(lab, "R-Wpn-MG-Damage08");
			
			if(!random(2) && componentAvailable("Body11ABT")) {
				if(!found)
					found = pursueResearch(lab, weaponTech);
				if(!found)
					found = pursueResearch(lab, extraTech);
				if(!found)
					found = pursueResearch(lab, artillExtra);
				if(!found)
					found = pursueResearch(lab, artilleryTech);
			}
			else if(!random(2) && componentAvailable("Body11ABT")) {
				if(!found)
					found = pursueResearch(lab, vtolExtras);
				if(!found)
					found = pursueResearch(lab, vtolWeapons);
				if(!found)
					found = pursueResearch(lab, antiAirTech);
				if(!found)
					found = pursueResearch(lab, antiAirExtras);
			}
			else {
				if(!found)
					found = pursueResearch(lab, laserExtra);
				if(!found)
					found = pursueResearch(lab, laserTech);
			}
			if(isDefined(turnOffCyborgs) && turnOffCyborgs === false && !found)
				found = pursueResearch(lab, cyborgWeaps);
			
			if(!found)
				found = pursueResearch(lab, "R-Struc-Factory-Upgrade09");
			if(!found)
				found = pursueResearch(lab, bodyResearch);
			
			
			if(isDefined(turnOffCyborgs)) {
				if(turnOffCyborgs === false) {
					if(!found)
						found = pursueResearch(lab, thermalResearch);
				}
				else {
					if(!found)
						found = pursueResearch(lab, "R-Vehicle-Armor-Heat09");
				}
			}
	
	
			if(!found)
				found = pursueResearch(lab, "R-Sys-Autorepair-General");
			if(!found)
				found = pursueResearch(lab, "R-Struc-RprFac-Upgrade06");
			if(!found)
				found = pursueResearch(lab, fundamentalResearch);
			if(!found && componentAvailable("Body11ABT"))
				found = pursueResearch(lab, "R-Struc-Materials09");
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
		else if(droid.droidType == DROID_SENSOR){
			groupAdd(sensorGroup, droid);
		}
		else if(droid.droidType == DROID_CYBORG) {
			groupAdd(cyborgGroup, droid);
		}
		else if (droid.droidType == DROID_WEAPON) {
			groupAdd(attackGroup, droid);
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
	buildStop = 0;
	grudgeCount = [];
	
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
		groupAdd(sensorGroup, sensors[i]);
	}
	// --END Group initialization
}

function eventStartLevel() {
	// Pretend like all buildings were just produced, to initiate productions
	var structlist = enumStruct(me);
	for (var i = 0; i < structlist.length; i++) {
		eventStructureBuilt(structlist[i]);
	}
	
	nexusWaveOn = false;
	
	//Need to search for scavenger player number
	//Keep undefined if there are no scavenger
	for(var x = maxPlayers; x < 11; ++x) {
		if(enumStruct(x).length > 0) {
			scavengerNumber = x;
			break;
		}
	}
	
	diffPerks();
	personality = random(3) + 1;
	initializeResearchLists();
	
	forceHover = checkIfSeaMap();
	
	buildOrder();
	setTimer("buildOrder", 300 + 3 * random(60));
	setTimer("produce", 700 + 3 * random(60));
	setTimer("repairAll", 1500 + 3 * random(60));
	setTimer("attackEnemyOil", 4000 + 3 * random(60));
	setTimer("spyRoutine", 8000 + 3 * random(60));
	setTimer("nexusWave", 10000 + 3 * random(70));
	setTimer("checkMood", 20000 + 3 * random(60));
	queue("betrayScavengers", 30000 + 3 * random(60));
	queue("freeForAll", 120000 + 3 * random(60));
}

function eventAttacked(victim, attacker) {
	if (attacker && victim && (attacker.player != me) && !allianceExistsBetween(attacker.player, victim.player)) {
		grudgeCount[attacker.player] += 1;
		
		//find nearby units
		var units = enumRange(victim, victim.x, victim.y, 6, false).filter(function(obj) {
			return obj.player === me
		});
		
		for (var i = 0; i < units.length; i++) {
			if(isDefined(units[i]) && units[i] && isDefined(attacker) && attacker && !repairDroid(units[i])
				&& droidCanReach(units[i], attacker.x, attacker.y))
				orderDroidObj(units[i], DORDER_ATTACK, attacker);
		}
		
		//swarm behavior exhibited here. Might be better to do multiple attack points.
		var vtols = enumGroup(vtolGroup);
		if(vtols.length > 5) {
			var targets = enumStruct(attacker, structures.derricks);
			targets.concat(enumStruct(attacker, structures.factories));
			targets.concat(enumStruct(attacker, structures.templateFactories));
			
			var target = targets[random(targets.length)];

			for (var i = 0; i < vtols.length; i++) {
				if(vtolReady(vtols[i])) {
					if(isDefined(target) && target)
						orderDroidLoc(vtols[i], DORDER_SCOUT, target.x, target.y);
				}
			}
		}
		if(grudgeCount[attacker.player] > 5)
			attackStuff(attacker.player);
	}
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
	if(droid.order == DORDER_RECYCLE)
		return;
	
	var who = enumRange(droid.x, droid.y, 15, ENEMIES, true);
	addBeacon(droid.x, droid.y, ALLIES);
	
	if(who.length > 0)
		grudgeCount[who[0].player] += 1;
	
	if((playerAlliance(true).lrngth > 0) && (lastMsg != "need tank") && (lastMsg != "need cyborg") && (lastMsg != "need vtol")) {
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
	if ((to != me) || (to == from)) {
		//When on insane difficulty, distrupt communications
		if(isDefined(nexusWave) && nexusWave === true && (to != me) && !allianceExistsBetween(from, me)) {
			//do something
		}
		return; // not for me
	}
	
	if ((message == "need truck") && allianceExistsBetween(from, to)) {
		var droids = enumDroid(me, DROID_CONSTRUCT);
		if(droids.length <= 3)
			return;
		donateObject(droids[random(droids.length)], from);
	}
	else if ((message == "need power") && allianceExistsBetween(from, to)) {
		if(playerPower(me) - queuedPower(me) > 0)
			donatePower(playerPower(me) / 2, from);
	}
	else if ((message == "need tank") && allianceExistsBetween(from, to)) {
		var droids = enumDroid(me, DROID_WEAPON);
		if(droids.length < 6)
			return;
		donateObject(droids[random(droids.length)], from);
	}
	else if ((message == "need cyborg") && allianceExistsBetween(from, to)) {
		var droids = enumDroid(me, DROID_CYBORG);
		if(droids.length < 6)
			return;
		donateObject(droids[random(droids.length)], from);
	}
	else if ((message == "need vtol") && allianceExistsBetween(from, to)) {
		var droids = enumDroid(me).filter(function(obj){ return isVTOL(obj); });
		if(droids.length < 6)
			return;
		donateObject(droids[random(droids.length)], from);
	}
	else if (((message == "help me!") || (message == "help me!!")) && allianceExistsBetween(from, to)) {
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
	else if((message == "friend") && !allianceExistsBetween(from, to) && (gameTime > 210000)) {
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
		if ((message == ("attack" + x)) && !allianceExistsBetween(x, me) && (x != me)) {
			attackStuff(x);
		}
		if ((message == ("attack" + x)) && allianceExistsBetween(x, me) ) {
			if(x !== me)
				chat(from, "I'm no traitor");
			
			setAlliance(from, me, false);
			if(from != me)
				chat(ALLIES, "Player " + from + " is a traitor");
			
			attackStuff(from);
			break;
		}
}
}

//Better check what is going on over there.
function eventBeacon(x, y, from, to, message) {
	if(allianceExistsBetween(from, to) || (to == from)) {
		if((playerAlliance(true).length > 0) && (lastMsg != "Help is on the way!")) {
			lastMsg = "Help is on the way!";
			chat(from, lastMsg);
		}
		
		var cyborgs = enumGroup(cyborgGroup);
		var tanks = enumGroup(attackGroup);
		var vtols = enumGroup(vtolGroup);
		for (var i = 0; i < cyborgs.length; i++) {
			if(!repairDroid(cyborgs[i]) && droidCanReach(cyborgs[i], x, y))
				orderDroidLoc(cyborgs[i], DORDER_SCOUT, x, y);
		}
		for (var i = 0; i < tanks.length; i++) {
			if(!repairDroid(tanks[i]) && droidCanReach(tanks[i], x, y))
				orderDroidLoc(tanks[i], DORDER_SCOUT, x, y);
		}
		for (var i = 0; i < vtols.length; i++) {
			if(vtolReady(vtols[i]))
				orderDroidLoc(vtols[i], DORDER_SCOUT, x, y);
		}
	}
}

/*
function eventSyncRequest(id, x, y, obj1, obj2) {
	if(id == "") {
		setHealth(obj1, 100);
	}
}
*/

function eventObjectTransfer(obj, from) {
	logObj(obj, "eventObjectTransfer event. from: " + from + ". health: " + obj.health);
	
	if((obj.health > 100) && !allianceExistsBetween(from, me)) {
		log("eventObjectTranfer: Destroying droid with health over 100%");
		removeObject(obj, true);
		//syncRequest("", obj.x, obj.y, obj);
	}
	
	if((from !== me) && allianceExistsBetween(from, me)) {
		if(obj.type == DROID)
			eventDroidBuilt(obj, null);
		lastMsg = "Thank you!";
		chat(from, lastMsg);
	}
	
	//NexusWave transer
	if((from !== me) && (from === obj.player) && !allianceExistsBetween(obj.player, me)) {
		if(obj.type == DROID)
			eventDroidBuilt(obj, null);
	}
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