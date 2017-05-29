
//Pick a random weapon line. May return undefined for machineguns.
//Returns an object containing weapon line and whether to skip the first element.
function chooseRandomWeapon() {
	var weaps;
	var isSecondary = false;

	switch(random(6)) {
		case 0: weaps = subpersonalities[personality].primaryWeapon; break;
		case 1: if(!turnOffMG || (personality === "AM")) { weaps = weaponStats.machineguns; } break;
		case 2: weaps = subpersonalities[personality].artillery; break;
		case 3: weaps = weaponStats.lasers; break;
		case 4: weaps = subpersonalities[personality].secondaryWeapon; isSecondary = true; break;
		case 5: weaps = weaponStats.AS; break;
		default: weaps = subpersonalities[personality].primaryWeapon; break;
	}

	if(!isDefined(weaps)) {
		weaps = subpersonalities[personality].primaryWeapon;
	}

	return {"weaponLine": weaps, "shift": isSecondary};
}

//Prepare the weapon list.
function shuffleWeaponList(weaps, shiftIt) {
	var weaponList = [];

	for(var i = 0; i < weaps.length; ++i) {
		weaponList.push(weaps[i].stat);
	}

	if(shiftIt && (weaponList.length > 1)) {
		weaponList.shift(); //remove first weapon.
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

//Choose random VTOL weapon line. Defaults to laser if undefined.
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
		weaps = weaponStats.lasers;
	}

	return weaps;
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
		const SPECIAL_WEAPONS = ["PlasmaHeavy", "MortarEMP"];

		weaps = chooseRandomWeapon();
		weaponList = shuffleWeaponList(chooseWeaponType(weaps.weaponLine), weaps.shift);
		weaps = weaps.weaponLine;

		//on hard difficulty and above.
		if(componentAvailable("tracked01") && (random(101) <= 1)) {
			if((difficulty === HARD) || (difficulty === INSANE)) {
				weaponList.push(SPECIAL_WEAPONS[random(SPECIAL_WEAPONS.length)]);
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

		for(var i = weaps.vtols.length - 1; i >= 0; --i) {
			weaponList.push(weaps.vtols[i].stat);
		}
	}

	return ((type === "CYBORG") || !isDefined(weaps)) ? weaps : weaponList;
}

//What conditions will allow hover use. Flamers always use hover, rockets/missile
//Have a 20% chance of using hover and a 35% chance for laser. Also there is a 15% chance regardless of weapon.
//Expects an array of weapons.
function useHover(weap) {
	if(!isDefined(weap)) {
		return false;
	}

	if(forceHover) {
		return true;
	}

	var useHover = false;
	for(var i = 0; i < weap.length; ++i) {
		if((weap[i] === "Flame1Mk1") || (weap[i] === "Flame2") || (weap[i] === "PlasmiteFlamer")) {
			useHover = true;
			break;
		}

		if((weap[i] === "Rocket-LtA-T") || (weap[i] === "Rocket-HvyA-T") || (weap[i] === "Missile-A-T")) {
			useHover = (random(101) <= 20) ? true : false;
			break;
		}

		if((weap[i] === "Laser3BEAMMk1") || (weap[i] === "Laser2PULSEMk1") || (weap[i] === "HeavyLaser")) {
			useHover = (random(101) <= 35) ? true : false;
			break;
		}
	}

	return ((useHover === true) || (random(101) <= 15));
}

//Randomly use tracks or half-tracks.
function pickGroundPropulsion() {
	var tankProp = [
		"tracked01", // tracked01
		"HalfTrack", // half-track
		"wheeled01", // wheels
	];

	if(random(101) < 50) {
		tankProp.shift();
	}

	return tankProp;
}

//Create a ground attacker tank with a heavy body when possible.
//Personality AR uses hover when posssible. All personalities may use special weapons on Hard/Insane.
//Also when Cobra has Dragon body, the EMP Cannon may be selected as the second weapon if it is researched.
function buildAttacker(struct) {
	if(!isDefined(forceHover) || !isDefined(seaMapWithLandEnemy) || !isDefined(turnOffMG))
		return false;
	if(forceHover && !seaMapWithLandEnemy && !componentAvailable("hover01"))
		return false;

	var weap = choosePersonalityWeapon("TANK");
	if(!isDefined(weap)) {
		return false;
	}

	if(useHover(weap) && componentAvailable("hover01")) {
		if(!random(3) && componentAvailable("Body14SUP") && componentAvailable("EMP-Cannon")) {
			if(weap !== "MortarEMP") {
				if(isDefined(struct) && buildDroid(struct, "Hover EMP Droid", tankBody, "hover01", "", "", weap, "EMP-Cannon")) {
					return true;
				}
			}
		}
		else if(isDefined(struct) && buildDroid(struct, "Hover Droid", tankBody, "hover01", "", "", weap, weap)) {
			return true;
		}
	}
	else {
		if(!random(3) && componentAvailable("Body14SUP") && componentAvailable("EMP-Cannon")) {
			if((weap !== "MortarEMP")) {
				if(isDefined(struct) && buildDroid(struct, "EMP Droid", tankBody, pickGroundPropulsion(), "", "", weap, "EMP-Cannon")) {
					return true;
				}
			}
		}
		else if (isDefined(struct) && buildDroid(struct, "Droid", tankBody, pickGroundPropulsion(), "", "", weap, weap)) {
			return true;
		}
	}

	return false;
}

//Create trucks or sensors with a light body. Default to a sensor.
function buildSys(struct, weap) {
	if(!isDefined(weap)) {
		weap = ["Sensor-WideSpec", "SensorTurret1Mk1"];
	}
	if (isDefined(struct) && buildDroid(struct, "System unit", sysBody, sysProp, "", "", weap)) {
		return true;
	}
	return false;
}

//Create a cyborg with available research.
function buildCyborg(fac) {
	var weap;
	var body;
	var prop;
	var weapon = choosePersonalityWeapon("CYBORG");

	if(!isDefined(weapon)) {
		return false;
	}

	for(var x = weapon.templates.length - 1; x >= 0; --x) {
		body = weapon.templates[x].body;
		prop = weapon.templates[x].prop;
		weap = weapon.templates[x].weapons[0];

		//skip weak flamer cyborg.
		if((weap !== "CyborgFlamer01") && isDefined(fac) && buildDroid(fac, weap + " Cyborg", body, prop, "", "", weap, weap)) {
			return true;
		}
	}

	return false;
}

//Create a vtol fighter with a medium body.
function buildVTOL(struct) {
	var weap = choosePersonalityWeapon("VTOL");
	if (isDefined(struct) && buildDroid(struct, "VTOL unit", vtolBody, "V-Tol", "", "", weap, weap)) {
		return true;
	}

	return false;
}


//Produce a unit when factories allow it.
function produce() {
	const MIN_POWER = -100;
	const MIN_TRUCKS = 4;
	const MIN_SENSORS = 2;
	const MIN_REPAIRS = 3;
	//Try not to produce more units.
	if((enumDroid(me).length - 1) === 150) {
		return false;
	}

	var fac = enumStruct(me, structures.factories);
	var cybFac = enumStruct(me, structures.templateFactories);
	var vtolFac = enumStruct(me, structures.vtolFactories);

	//Look what is being queued and consider unit production later.
	var trucks = 0;
	var sens = 0;
	var reps = 0;

	for(var i = 0; i < fac.length; ++i) {
		var virDroid = getDroidProduction(fac[i]);
		if(virDroid !== null) {
			if(virDroid.droidType === DROID_CONSTRUCT)
				trucks += 1;
			if(virDroid.droidType === DROID_SENSOR)
				sens += 1;
			if(virDroid.droidType === DROID_REPAIR)
				reps += 1;
		}
	}

	for(var x = 0; x < fac.length; ++x) {
		if(isDefined(fac[x]) && structureIdle(fac[x]) && (getRealPower() > MIN_POWER)) {
			if ((countDroid(DROID_CONSTRUCT, me) + trucks) < MIN_TRUCKS) {
				if(playerAlliance(true).length && (countDroid(DROID_CONSTRUCT, me) < MIN_TRUCKS) && (gameTime > 30000)) {
					sendChatMessage("need truck", ALLIES);
				}
				buildSys(fac[x], "Spade1Mk1");
			}
			else if((enumGroup(sensorGroup).length + sens) < MIN_SENSORS) {
				buildSys(fac[x]);
			}
			else if((enumGroup(attackGroup).length > 6) && ((enumGroup(repairGroup).length + reps) < MIN_REPAIRS)) {
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

	if(isDefined(turnOffCyborgs) && !turnOffCyborgs) {
		for(var x = 0; x < cybFac.length; ++x) {
			if(isDefined(cybFac[x]) && structureIdle(cybFac[x]) && (getRealPower() > MIN_POWER)) {
				buildCyborg(cybFac[x]);
			}
		}
	}

	for(var x = 0; x < vtolFac.length; ++x) {
		if(isDefined(vtolFac[x]) && structureIdle(vtolFac[x]) && (getRealPower() > MIN_POWER)) {
			buildVTOL(vtolFac[x]);
		}
	}
}
