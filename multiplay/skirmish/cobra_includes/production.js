
//Create a ground attacker tank with a heavy body when possible.
//Creates a variety of tank variants. Flamers use hover when posssible.
//A plasma laucher has a very small chance of being built when Inferno is avaliable.

//Needs bloat reduction here
function buildAttacker(struct) {
	//May not be defined yet
	if(!isDefined(forceHover) || !isDefined(seaMapWithLandEnemy) || !isDefined(turnOffMG))
		return false;
	if((forceHover === true) && (seaMapWithLandEnemy === false) && !componentAvailable("hover01"))
		return false;
	
	var useHover = false;
	var weaps;
	var weap = [];
	
	
	if(personality === 1) {
		if(!random(2))
			weaps = subpersonalities["AC"]["primaryWeapon"];
		else if((turnOffMG === false) && !random(2))
			weaps = subpersonalities["AC"]["secondaryWeapon"];
		else if(!random(2))
			weaps = subpersonalities["AC"]["artillery"];
		else if(!random(2))
			weaps = subpersonalities["AC"]["tertiaryWeapon"];
		else
			weaps = weaponStats.AS;
	}
	else if(personality === 2) {
		if(!random(2)) {
			weaps = subpersonalities["AR"]["primaryWeapon"];
			useHover = true;
		}
		else if((turnOffMG === false) && !random(2))
			weaps = subpersonalities["AR"]["secondaryWeapon"];
		else if(!random(2))
			weaps = subpersonalities["AR"]["artillery"];
		else if(!random(2))
			weaps = subpersonalities["AR"]["tertiaryWeapon"];
		else
			weaps = weaponStats.AS;
	}
	else{
		if(!random(2)) {
			weaps = subpersonalities["AB"]["primaryWeapon"];
		}
		else if((turnOffMG === false) && !random(2))
			weaps = subpersonalities["AB"]["secondaryWeapon"];
		else if(!random(2))
			weaps = subpersonalities["AB"]["artillery"];
		else if(!random(2))
			weaps = subpersonalities["AB"]["tertiaryWeapon"];
		else
			weaps = weaponStats.AS;
	}
	
	for(var x = weaps.weapons.length - 1; x >= 0; --x) {
		weap.push(weaps.weapons[x].stat);
	}
	
	var designableDroid = isDesignable(weap, tankBody, tankProp);
	if((designableDroid === false) && (turnOffMG === false)) {
		weap = [];
		for(var x = weaponStats.machineguns.weapons.length - 1; x >= 0; --x) {
			weap.push(weaponStats.machineguns.weapons[x].stat);
		}
	}
	
	//on hard difficulty and above
	if(componentAvailable("MortarEMP") && componentAvailable("tracked01") && !random(35))
		weap = "MortarEMP";
	else if(componentAvailable("PlasmaHeavy") && componentAvailable("tracked01") && !random(40))
		weap = "PlasmaHeavy";
	
	if(((useHover === true) || (forceHover === true) || !random(12)) && componentAvailable("hover01")) {
		buildDroid(struct, "Hover Droid", tankBody, "hover01", null, null, weap, weap);
		return true; //Forced success
	}
	
	if (buildDroid(struct, "Droid", tankBody, tankProp, null, null, weap, weap)) { return true; }
	
	return false;
}

//Create trucks or sensors with a light body.
function buildSys(struct, weap) {
	if(!isDefined(weap)) { weap = "Spade1Mk1"; }
	
	if (buildDroid(struct, "System unit", sysBody, sysProp, null, null, weap)) {
		return true;
	}
	return false;
}

//Create a cyborg with avaliable research.
//Needs bloat reduction here.
function buildCyborg(fac) {
	var weap;
	var body;
	var prop;
	var weapon;
	
	if(personality === 1) {
		if(!random(2))
			weapon = subpersonalities["AC"]["primaryWeapon"];
		else if((turnOffMG === false) && !random(2))
			weapon = subpersonalities["AC"]["secondaryWeapon"];
		else
			weapon = subpersonalities["AC"]["tertiaryWeapon"];
	}
	else if(personality === 2) {
		if(!random(2))
			weapon = subpersonalities["AR"]["primaryWeapon"];
		else if((turnOffMG === false) && !random(2))
			weapon = subpersonalities["AR"]["secondaryWeapon"];
		else
			weapon = subpersonalities["AR"]["tertiaryWeapon"];
	}
	else {
		if(!random(2))
			weapon = subpersonalities["AB"]["primaryWeapon"];
		else if((turnOffMG === false) && !random(2))
			weapon = subpersonalities["AB"]["secondaryWeapon"];
		else
			weapon = subpersonalities["AB"]["tertiaryWeapon"];
	}
	
	//weapons
	for(var x = weapon.templates.length - 1; x >= 0; --x) {
		body = weapon.templates[x].body;
		prop = weapon.templates[x].prop;
		weap = weapon.templates[x].weapons[0];
		if(buildDroid(fac, "Cyborg", body, prop, null, null, weap)) {
			return true;
		}
	}
	
	return false;
}

//Create a vtol fighter with a medium body.
function buildVTOL(struct) {
	var weap;
	const weapons = weaponStats.bombs.vtols;
	
	for(var x = weapons.length - 1; x >= 0; --x) {
		weap = weapons[x].stat;
		if (buildDroid(struct, "Bomber", vtolBody, "V-Tol", null, null, weap)) {
			return true;
		}
	}

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
			else if((enumGroup(attackGroup).length > 10) && (extra === false) && (enumGroup(sensorGroup).length < 2) ) {
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

