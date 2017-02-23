
//Create a ground attacker tank with a heavy body when possible.
//Personality AR uses hover when posssible. All personalities may use special weapons on Hard/Insane.
function buildAttacker(struct) {
	if(!isDefined(forceHover) || !isDefined(seaMapWithLandEnemy) || !isDefined(turnOffMG))
		return false;
	if((forceHover === true) && (seaMapWithLandEnemy === false) && !componentAvailable("hover01"))
		return false;
	
	var weap = choosePersonalityWeapon("TANK");
	
	if(!isDefined(weap)) { return false; }
	if(((useHover() === true) || (forceHover === true) || !random(12)) && componentAvailable("hover01")) {
		buildDroid(struct, "Hover Droid", tankBody, "hover01", null, null, weap, weap);
		return true; //Forced success
	}
	if (buildDroid(struct, "Droid", tankBody, tankProp, null, null, weap, weap)) { return true; }
	
	return false;
}

//Create trucks or sensors with a light body. Default to a sensor.
function buildSys(struct, weap) {
	if(!isDefined(weap)) { weap = ["Sensor-WideSpec", "SensorTurret1Mk1"]; }
	if (buildDroid(struct, "System unit", sysBody, sysProp, null, null, weap)) { return true; }
	return false;
}

//Create a cyborg with avaliable research.
function buildCyborg(fac) {
	var weap;
	var body;
	var prop;
	var weapon = choosePersonalityWeapon("CYBORG");
	
	if(!isDefined(weapon)) { return false; }
	
	//weapons
	for(var x = weapon.templates.length - 1; x >= 0; --x) {
		body = weapon.templates[x].body;
		prop = weapon.templates[x].prop;
		weap = weapon.templates[x].weapons[0];
		if(buildDroid(fac, "Cyborg", body, prop, null, null, weap, weap)) {
			return true;
		}
	}
	
	return false;
}

//Create a vtol fighter with a medium body.
function buildVTOL(struct) {
	var weap = choosePersonalityWeapon("VTOL");
	if (buildDroid(struct, "Bomber", vtolBody, "V-Tol", null, null, weap, weap)) { return true; }
	
	return false;
}


//Produce a unit when factories allow it.
function produce() {
	eventResearched(); //check for idle research centers.
	
	//Try not to produce more units. Not that anymore will be made, but it is a performance hack.
	if((enumDroid(me).length - 1) === 150) { return false; }
	
	var fac = enumStruct(me, structures.factories);
	var cybFac = enumStruct(me, structures.templateFactories);
	var vtolFac = enumStruct(me, structures.vtolFactories);
	var extra = false;
	
	for(var x = 0; x < fac.length; ++x) {
		if(isDefined(fac[x]) && structureIdle(fac[x])) {
			if ((extra === false) && (countDroid(DROID_CONSTRUCT, me) < 4)) {
				if((playerAlliance(true).length > 0) && (countDroid(DROID_CONSTRUCT, me) < 2) && (gameTime > 10000)) {
					lastMsg = "need truck";
					chat(ALLIES, lastMsg);
				}
				buildSys(fac[x], "Spade1Mk1");
				extra = true;
			}
			else if((enumGroup(attackGroup).length > 10) && (extra === false) && (enumGroup(sensorGroup).length < 2)) {
				buildSys(fac[x]);
				extra = true;
			}
			else {
				buildAttacker(fac[x]);
			}
		}
	}
	
	if(isDefined(turnOffCyborgs) && (turnOffCyborgs === false)) {
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

