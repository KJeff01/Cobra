
const tankBody = [
	"Body14SUP", // Dragon
	"Body13SUP", // Wyvern
	"Body10MBT", // Vengeance
	"Body7ABT",  // Retribution
	"Body9REC",  // Tiger
	"Body6SUPP", // Panther
	"Body12SUP", // Mantis
	"Body8MBT",  // Scorpion
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

	if(!isDefined(weaps) || (returnPrimaryAlias() !== "las")) {
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
	if(!(isDefined(weap) && componentAvailable("hover01"))) {
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

//Choose our ground propulsion. Non-hover units will have a preference for tracks.
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

	if((random(101) < 33) || (gameTime < TIME_FOR_HALF_TRACKS)) {
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

	//Use Medium body for the first twenty minutes into a skirmish.
	const TIME_FOR_MEDIUM_BODY = 1200000;
	var useLighterBodies = (gameTime < TIME_FOR_MEDIUM_BODY);
	var body = (useLighterBodies) ? vtolBody : tankBody;

	//Use light body sometimes if on a T1 match, excluding primary MG personalities.
	if(useLighterBodies && ((returnPrimaryAlias() !== "mg") && !turnOffMG) && random(3)) {
		body = sysBody;
	}

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

//Create a cyborg with available research. Expects a boolean for useEngineer or can undefined.
function buildCyborg(fac, useEngineer) {
	var weap = "CyborgSpade";
	var body = "CyborgLightBody";
	var prop = "CyborgLegs";

	//Build combat engineer if requested.
	if(isDefined(useEngineer) && (useEngineer === true)) {
		if(buildDroid(fac, "Combat Engineer", body, prop, "", "", weap)) {
			return true;
		}

		return false;
	}

	var weaponLine = choosePersonalityWeapon("CYBORG");
	if(isDefined(weaponLine) && isDefined(fac)) {
		for(var x = weaponLine.templates.length - 1; x >= 0; --x) {
			body = weaponLine.templates[x].body;
			prop = weaponLine.templates[x].prop;
			weap = weaponLine.templates[x].weapons[0];

			if(buildDroid(fac, weap + " Cyborg", body, prop, "", "", weap)) {
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

//Check what system units are queued in a regular factory. Returns an object
//containing the number or trucks/sensors/repairs queued.
function analyzeQueuedSystems() {
	var fac = enumStruct(me, FACTORY);
	var trucks = 0;
	var sens = 0;
	var reps = 0;

	for(var i = 0, l = fac.length; i < l; ++i) {
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

	return { "truck": trucks, "sensor": sens, "repair": reps };
}


//Produce a unit when factories allow it.
function produce() {
	if(isDefined(enumDroid(me)[149])) {
		return;
	}

	const MIN_POWER = -20;
	const MIN_TRUCKS = 5;
	const MIN_COM_ENG = 3;
	const MIN_SENSORS = 2;
	const MIN_REPAIRS = 3;
	var useCybEngineer = false; //countStruct(CYBORG_FACTORY) && !componentAvailable("hover01");
	var systems = analyzeQueuedSystems();

	var attackers = enumGroup(attackGroup);
	var allowSpecialSystems = isDefined(attackers[7]);
	var buildSensors = ((enumGroup(sensorGroup).length + systems.sensor) < MIN_SENSORS);
	var buildRepairs = ((enumGroup(repairGroup).length + systems.repair) < MIN_REPAIRS);
	var buildTrucks = ((enumGroup(constructGroup).length + enumGroup(oilGrabberGroup).length + systems.truck) < MIN_TRUCKS);

	//Loop through factories in the order the personality likes.
	for(var i = 0; i < 3; ++i) {
		var facType = subpersonalities[personality].factoryOrder[i];
		var fac = enumStruct(me, facType);

		if(!((facType === CYBORG_FACTORY) && !forceHover && turnOffCyborgs)) {

			for(var x = 0, l = fac.length; x < l; ++x) {
				if(isDefined(fac[x]) && structureIdle(fac[x]) && (getRealPower() > MIN_POWER)) {

					if(facType === FACTORY) {
						if(buildTrucks) {
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
							if((fac[x].modules < 1) && componentAvailable("Body11ABT"))
								continue;

							buildAttacker(fac[x]);
						}
					}
					else {
						(facType === CYBORG_FACTORY) ? buildCyborg(fac[x], useCybEngineer) : buildVTOL(fac[x]);
					}
				}
			}
		}
	}

}
