
const tankBody = [
	"Body14SUP", // Dragon
	"Body13SUP", // Wyvern
	"Body10MBT", // Vengeance
	"Body7ABT",  // Retribution
//	"Body9REC",  // Tiger
//	"Body12SUP", // Mantis
	"Body11ABT", // Python
	"Body5REC",  // Cobra
	"Body1REC",  // Viper
];

const sysBody = [
	"Body3MBT",  // Retaliation
//	"Body2SUP",  // Leopard
	"Body4ABT",  // Bug
	"Body1REC",  // Viper
];

const sysProp = [
	"hover01", // hover
	"wheeled01", // wheels
];

const vtolBody = [
	"Body7ABT",  // Retribution
	"Body6SUPP", // Panther
	"Body8MBT",  // Scorpion
	"Body5REC",  // Cobra
	"Body1REC",  // Viper
];

const repairTurrets = [
	"HeavyRepair",
	"LightRepair1",
];

//Pick a random weapon line. May return undefined for machineguns.
function chooseRandomWeapon() {
	var weaps;

	switch(random(6)) {
		case 0: weaps = subpersonalities[personality].primaryWeapon; break;
		case 1: if(!turnOffMG || (personality === "AM")) { weaps = weaponStats.machineguns; } break;
		case 2: weaps = subpersonalities[personality].artillery; break;
		case 3: weaps = weaponStats.lasers; break;
		case 4: weaps = subpersonalities[personality].secondaryWeapon; break;
		case 5: weaps = weaponStats.AS; break;
		default: weaps = subpersonalities[personality].primaryWeapon; break;
	}

	if(!isDefined(weaps)) {
		weaps = subpersonalities[personality].primaryWeapon;
	}

	return weaps;
}

//Prepare the weapon list.
function shuffleWeaponList(weaps) {
	var weaponList = [];

	for(var i = 0, w = weaps.length; i < w; ++i) {
		weaponList.push(weaps[i].stat);
	}

	weaponList.reverse();
	return weaponList;
}

//Either fastFire or normal.
function chooseWeaponType(weaps) {
	var weaponType = weaps;

	if(isDefined(weaps.fastFire) && (random(101) < 50)) {
		weaponType = weaps.fastFire;
	}
	else {
		weaponType = weaps.weapons;
	}

	return weaponType;
}

//Choose a random cyborg weapon line. May return undefined.
function chooseRandomCyborgWeapon() {
	var weaps;

	//grenadier cyborgs can only be built as long as Cobra does not Have
	//access to pepperpot. They are too weak after that.
	switch(random(4)) {
		case 0: weaps = subpersonalities[personality].primaryWeapon; break;
		case 1: weaps = weaponStats.lasers; break;
		case 2: weaps = subpersonalities[personality].secondaryWeapon; break;
		case 3: if(!componentAvailable("Mortar3ROTARYMk1")) { weaps = subpersonalities[personality].artillery; } break;
		default: weaps = subpersonalities[personality].primaryWeapon; break;
	}

	return weaps;
}

//Choose random VTOL weapon line. Defaults to bombs if undefined.
function chooseRandomVTOLWeapon() {
	var weaps;
	var isEMP = false;

	switch(random(5)) {
		case 0: if((returnPrimaryAlias() !== "mg") && (returnPrimaryAlias() !== "fl")) { weaps = subpersonalities[personality].primaryWeapon; } break;
		case 1: weaps = weaponStats.lasers; break;
		case 2: weaps = subpersonalities[personality].secondaryWeapon; break;
		case 3: weaps = weaponStats.bombs; break;
		case 4: weaps = weaponStats.empBomb; isEMP = true; break;
		default: weaps = weaponStats.lasers; break;
	}

	if(!isDefined(weaps) || (!isEMP && (weaps.vtols.length - 1 <= 0))) {
		weaps = weaponStats.bombs;
	}

	return weaps.vtols;
}


//Randomly choose the best weapon with current technology.
//Defaults to machine-guns when other choices are unavailable (if allowed). May return undefined.
//Also cyborgs will not return the actual stat list with this function due to how they are built.
function choosePersonalityWeapon(type) {
	var weaps;
	var weaponList = [];
	var isSecondary = false;
	if(!isDefined(type)) {
		type = "TANK";
	}

	if(type === "TANK") {
		const PLASMA_LAUNCHER = "PlasmaHeavy";

		weaps = chooseRandomWeapon();
		weaponList = shuffleWeaponList(chooseWeaponType(weaps));

		//on hard difficulty and above.
		if(componentAvailable("tracked01") && (random(101) <= 1)) {
			if((difficulty === HARD) || (difficulty === INSANE)) {
				weaponList.push(PLASMA_LAUNCHER);
			}
		}

		//Try defaulting to machine-guns then.
		if(!turnOffMG && !isDesignable(weaponList)) {
			weaponList = [];

			for(var i = weaponStats.machineguns.weapons.length - 1; i >= 0; --i) {
				weaponList.push(weaponStats.machineguns.weapons[i].stat);
			}
		}
	}
	else if(type === "CYBORG") {
		weaps = chooseRandomCyborgWeapon();
	}
	else if(type === "VTOL") {
		weaps = chooseRandomVTOLWeapon();

		for(var i = weaps.length - 1; i >= 0; --i) {
			weaponList.push(weaps[i].stat);
		}
	}

	return ((type === "CYBORG") || !isDefined(weaps)) ? weaps : weaponList;
}

//What conditions will allow hover use. There is a 15% chance regardless of weapon.
//Expects an array of weapons.
function useHover(weap) {
	if(!isDefined(weap)) {
		return false;
	}

	if(forceHover) {
		return true;
	}

	var useHover = false;

	for(var i = 0, w = weap.length; i < w; ++i) {
		if((weap[i] === "Flame1Mk1") || (weap[i] === "Flame2") || (weap[i] === "PlasmiteFlamer")) {
			useHover = true;
			break;
		}

		if((weap[i] === "Rocket-LtA-T") || (weap[i] === "Rocket-HvyA-T") || (weap[i] === "Missile-A-T")) {
			useHover = (random(101) <= 75);
			break;
		}

		if((weap[i] === "Laser3BEAMMk1") || (weap[i] === "Laser2PULSEMk1") || (weap[i] === "HeavyLaser")) {
			useHover = (random(101) <= 55);
			break;
		}
	}

	return (((useHover === true) || (random(101) <= 15)) && (weap[0] !== "Laser4-PlasmaCannon"));
}

//Choose our ground propulsion. Non-hover units will have a preference for half-tracks.
function pickPropulsion(weap) {
	if(useHover(weap)) {
		return "hover01";
	}

	const TIME_FOR_HALF_TRACKS = 1200000;
	var tankProp = [
		"tracked01", // tracked01
		"HalfTrack", // half-track
		"wheeled01", // wheels
	];

	if((random(101) < 67) || (gameTime < TIME_FOR_HALF_TRACKS)) {
		tankProp.shift();
	}

	return tankProp;
}

//Create a ground attacker tank with a heavy body when possible.
//Personality AR uses hover when possible. All personalities may use special weapons on Hard/Insane.
//Also when Cobra has Dragon body, the EMP Cannon may be selected as the second weapon if it is researched.
function buildAttacker(struct) {
	if(!(isDefined(forceHover) && isDefined(seaMapWithLandEnemy) && isDefined(turnOffMG))) {
		return false;
	}
	if(forceHover && !seaMapWithLandEnemy && !componentAvailable("hover01")) {
		return false;
	}

	//Use Medium body when low on power or the first twenty minutes into a skirmish,
	const TIME_FOR_MEDIUM_BODY = 1200000;
	var body = (gameTime < TIME_FOR_MEDIUM_BODY) ? vtolBody : tankBody;
	var weap = choosePersonalityWeapon("TANK");

	if(isDefined(weap)) {
		var secondary = weap;

		if(isDefined(struct)) {
			if(!random(3) && componentAvailable("Body14SUP") && componentAvailable("EMP-Cannon")) {
				secondary = "EMP-Cannon";
			}

			return buildDroid(struct, "Droid", body, pickPropulsion(weap), "", "", weap, secondary);
		}
	}

	return false;
}

//Create trucks or sensors with a light body. Default to a sensor.
function buildSys(struct, weap) {
	if(!isDefined(weap)) {
		weap = ["Sensor-WideSpec", "SensorTurret1Mk1"];
	}

	return (isDefined(struct) && buildDroid(struct, "System unit", sysBody, sysProp, "", "", weap));
}

//Create a cyborg with available research.
function buildCyborg(fac) {
	var weap;
	var body;
	var prop;
	var weapon = choosePersonalityWeapon("CYBORG");

	if(isDefined(weapon) && isDefined(fac)) {
		for(var x = weapon.templates.length - 1; x >= 0; --x) {
			body = weapon.templates[x].body;
			prop = weapon.templates[x].prop;
			weap = weapon.templates[x].weapons[0];

			//skip weak flamer cyborg.
			if((weap !== "CyborgFlamer01") && buildDroid(fac, weap + " Cyborg", body, prop, "", "", weap, weap)) {
				return true;
			}
		}
	}

	return false;
}

//Create a vtol fighter with a medium body.
function buildVTOL(struct) {
	var weap = choosePersonalityWeapon("VTOL");
	return (isDefined(struct) && isDefined(weap) && buildDroid(struct, "VTOL unit", vtolBody, "V-Tol", "", "", weap, weap));
}


//Produce a unit when factories allow it.
function produce() {
	const MIN_POWER = -70;
	const MIN_TRUCKS = 4;
	const MIN_SENSORS = 2;
	const MIN_REPAIRS = 3;

	var fac = enumStruct(me, structures.factories);
	var cybFac = enumStruct(me, structures.templateFactories);
	var vtolFac = enumStruct(me, structures.vtolFactories);
	var cacheFacs = fac.length;

	//Look what is being queued and consider unit production later.
	var trucks = 0;
	var sens = 0;
	var reps = 0;

	for(var i = 0; i < cacheFacs; ++i) {
		var virDroid = getDroidProduction(fac[i]);
		if(virDroid !== null) {
			if(virDroid.droidType === DROID_CONSTRUCT) {
				trucks += 1;
			}
			if(virDroid.droidType === DROID_SENSOR) {
				sens += 1;
			}
			if(virDroid.droidType === DROID_REPAIR) {
				reps += 1;
			}
		}
	}

	var attackers = enumGroup(attackGroup);
	var allowSpecialSystems = isDefined(attackers[7]);
	var buildSensors = ((enumGroup(sensorGroup).length + sens) < MIN_SENSORS);
	var buildRepairs = ((enumGroup(repairGroup).length + reps) < MIN_REPAIRS);

	for(var x = 0; x < cacheFacs; ++x) {
		if(isDefined(fac[x]) && structureIdle(fac[x]) && (getRealPower() > MIN_POWER)) {
			if ((countDroid(DROID_CONSTRUCT, me) + trucks) < MIN_TRUCKS) {
				if(playerAlliance(true).length && (countDroid(DROID_CONSTRUCT, me) < MIN_TRUCKS) && (gameTime > 30000)) {
					sendChatMessage("need truck", ALLIES);
				}
				buildSys(fac[x], "Spade1Mk1");
			}
			else if(buildSensors) {
				buildSys(fac[x]);
			}
			else if(allowSpecialSystems && buildRepairs) {
				buildSys(fac[x], repairTurrets);
			}
			else {
				//Do not produce weak body units if we can give this factory a module.
				if((fac[x].modules < 2) && componentAvailable("Body11ABT"))
					continue;
				buildAttacker(fac[x]);
			}
		}
	}

	if(!turnOffCyborgs) {
		for(var x = 0, f = cybFac.length; x < f; ++x) {
			if(isDefined(cybFac[x]) && structureIdle(cybFac[x]) && (getRealPower() > MIN_POWER)) {
				buildCyborg(cybFac[x]);
			}
		}
	}

	for(var x = 0, v = vtolFac.length; x < v; ++x) {
		if(isDefined(vtolFac[x]) && structureIdle(vtolFac[x]) && (getRealPower() > MIN_POWER)) {
			buildVTOL(vtolFac[x]);
		}
	}
}
