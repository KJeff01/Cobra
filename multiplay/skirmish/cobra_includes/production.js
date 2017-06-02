
if(DEVELOPMENT) {
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
		var cacheWeaps = weaps.length;

		for(var i = 0; i < cacheWeaps; ++i) {
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
				var cacheMG = weaponStats.machineguns.weapons.length - 1;

				for(var i = cacheMG; i >= 0; --i) {
					weaponList.push(weaponStats.machineguns.weapons[i].stat);
				}
			}
		}
		else if(type === "CYBORG") {
			weaps = chooseRandomCyborgWeapon();
		}
		else if(type === "VTOL") {
			weaps = chooseRandomVTOLWeapon();
			var cacheWeaps = weaps.length - 1;

			for(var i = cacheWeaps; i >= 0; --i) {
				weaponList.push(weaps[i].stat);
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
		var cacheWeaps = weap.length;

		for(var i = 0; i < cacheWeaps; ++i) {
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

	//Choose either tracks or half-tracks. Has a preference for half-tracks.
	function pickGroundPropulsion() {
		var tankProp = [
			"tracked01", // tracked01
			"HalfTrack", // half-track
			"wheeled01", // wheels
		];

		if(random(101) < 67) {
			tankProp.shift();
		}

		return tankProp;
	}

	//Create a ground attacker tank with a heavy body when possible.
	//Personality AR uses hover when posssible. All personalities may use special weapons on Hard/Insane.
	//Also when Cobra has Dragon body, the EMP Cannon may be selected as the second weapon if it is researched.
	function buildAttacker(struct) {
		if(!isDefined(forceHover) || !isDefined(seaMapWithLandEnemy) || !isDefined(turnOffMG)) {
			return false;
		}

		if(forceHover && !seaMapWithLandEnemy && !componentAvailable("hover01")) {
			return false;
		}

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

		var cacheWeapons = weapon.templates.length - 1;
		for(var x = cacheWeapons; x >= 0; --x) {
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
		if (isDefined(struct) && isDefined(weap) && buildDroid(struct, "VTOL unit", vtolBody, "V-Tol", "", "", weap, weap)) {
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

		var fac = enumStruct(me, structures.factories);
		var cybFac = enumStruct(me, structures.templateFactories);
		var vtolFac = enumStruct(me, structures.vtolFactories);

		var cacheFacs = fac.length;
		var cacheCybFacs = cybFac.length;
		var cacheVtolFacs = vtolFac.length;

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

		for(var x = 0; x < cacheFacs; ++x) {
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
					if((fac[x].modules < 2) && componentAvailable("Body11ABT")) {
						continue;
					}
					buildAttacker(fac[x]);
				}
			}
		}

		if(!turnOffCyborgs) {
			for(var x = 0; x < cacheCybFacs; ++x) {
				if(isDefined(cybFac[x]) && structureIdle(cybFac[x]) && (getRealPower() > MIN_POWER)) {
					buildCyborg(cybFac[x]);
				}
			}
		}

		for(var x = 0; x < cacheVtolFacs; ++x) {
			if(isDefined(vtolFac[x]) && structureIdle(vtolFac[x]) && (getRealPower() > MIN_POWER)) {
				buildVTOL(vtolFac[x]);
			}
		}
	}
}
else {
	function chooseRandomWeapon() {
		var e, r = !1;
		switch (random(6)) {
			case 0:
			e = subpersonalities[personality].primaryWeapon;
			break;
			case 1:
			turnOffMG && "AM" !== personality || (e = weaponStats.machineguns);
			break;
			case 2:
			e = subpersonalities[personality].artillery;
			break;
			case 3:
			e = weaponStats.lasers;
			break;
			case 4:
			e = subpersonalities[personality].secondaryWeapon, r = !0;
			break;
			case 5:
			e = weaponStats.AS;
			break;
			default:
			e = subpersonalities[personality].primaryWeapon
		}
		return isDefined(e) || (e = subpersonalities[personality].primaryWeapon), {
			weaponLine: e,
			shift: r
		}
	}

	function shuffleWeaponList(e, r) {
		for (var n = [], a = e.length, o = 0; a > o; ++o) n.push(e[o].stat);
		return r && n.length > 1 && n.shift(), n.reverse(), n
	}

	function chooseWeaponType(e) {
		var r = e;
		return r = isDefined(e.fastFire) && random(101) < 50 ? e.fastFire : e.weapons
	}

	function chooseRandomCyborgWeapon() {
		var e;
		switch (random(4)) {
			case 0:
			e = subpersonalities[personality].primaryWeapon;
			break;
			case 1:
			e = weaponStats.lasers;
			break;
			case 2:
			e = subpersonalities[personality].secondaryWeapon;
			break;
			case 3:
			componentAvailable("Mortar3ROTARYMk1") || (e = subpersonalities[personality].artillery);
			break;
			default:
			e = subpersonalities[personality].primaryWeapon
		}
		return e
	}

	function chooseRandomVTOLWeapon() {
		var e, r = !1;
		switch (random(5)) {
			case 0:
			"mg" !== returnPrimaryAlias() && "fl" !== returnPrimaryAlias() && (e = subpersonalities[personality].primaryWeapon);
			break;
			case 1:
			e = weaponStats.lasers;
			break;
			case 2:
			e = subpersonalities[personality].secondaryWeapon;
			break;
			case 3:
			e = weaponStats.bombs;
			break;
			case 4:
			e = weaponStats.empBomb, r = !0;
			break;
			default:
			e = weaponStats.lasers
		}
		return (!isDefined(e) || !r && e.vtols.length - 1 <= 0) && (e = weaponStats.bombs), e.vtols
	}

	function choosePersonalityWeapon(e) {
		var r, n = [];
		if (isDefined(e) || (e = "TANK"), "TANK" === e) {
			const a = ["PlasmaHeavy", "MortarEMP"];
			if (r = chooseRandomWeapon(), n = shuffleWeaponList(chooseWeaponType(r.weaponLine), r.shift), r = r.weaponLine, componentAvailable("tracked01") && random(101) <= 1 && (difficulty === HARD || difficulty === INSANE) && n.push(a[random(a.length)]), !turnOffMG && !isDesignable(n)) {
				n = [];
				for (var o = weaponStats.machineguns.weapons.length - 1, i = o; i >= 0; --i) n.push(weaponStats.machineguns.weapons[i].stat)
			}
		} else if ("CYBORG" === e) r = chooseRandomCyborgWeapon();
		else if ("VTOL" === e) {
			r = chooseRandomVTOLWeapon();
			for (var s = r.length - 1, i = s; i >= 0; --i) n.push(r[i].stat)
		}
		return "CYBORG" !== e && isDefined(r) ? n : r
	}

	function useHover(e) {
		if (!isDefined(e)) return !1;
		if (forceHover) return !0;
		for (var r = !1, n = e.length, a = 0; n > a; ++a) {
			if ("Flame1Mk1" === e[a] || "Flame2" === e[a] || "PlasmiteFlamer" === e[a]) {
				r = !0;
				break
			}
			if ("Rocket-LtA-T" === e[a] || "Rocket-HvyA-T" === e[a] || "Missile-A-T" === e[a]) {
				r = random(101) <= 20 ? !0 : !1;
				break
			}
			if ("Laser3BEAMMk1" === e[a] || "Laser2PULSEMk1" === e[a] || "HeavyLaser" === e[a]) {
				r = random(101) <= 35 ? !0 : !1;
				break
			}
		}
		return r === !0 || random(101) <= 15
	}

	function pickGroundPropulsion() {
		var e = ["tracked01", "HalfTrack", "wheeled01"];
		return random(101) < 67 && e.shift(), e
	}

	function buildAttacker(e) {
		if (!isDefined(forceHover) || !isDefined(seaMapWithLandEnemy) || !isDefined(turnOffMG)) return !1;
		if (forceHover && !seaMapWithLandEnemy && !componentAvailable("hover01")) return !1;
		var r = choosePersonalityWeapon("TANK");
		if (!isDefined(r)) return !1;
		if (useHover(r) && componentAvailable("hover01")) {
			if (!random(3) && componentAvailable("Body14SUP") && componentAvailable("EMP-Cannon")) {
				if ("MortarEMP" !== r && isDefined(e) && buildDroid(e, "Hover EMP Droid", tankBody, "hover01", "", "", r, "EMP-Cannon")) return !0
			} else if (isDefined(e) && buildDroid(e, "Hover Droid", tankBody, "hover01", "", "", r, r)) return !0
		} else if (!random(3) && componentAvailable("Body14SUP") && componentAvailable("EMP-Cannon")) {
			if ("MortarEMP" !== r && isDefined(e) && buildDroid(e, "EMP Droid", tankBody, pickGroundPropulsion(), "", "", r, "EMP-Cannon")) return !0
		} else if (isDefined(e) && buildDroid(e, "Droid", tankBody, pickGroundPropulsion(), "", "", r, r)) return !0;
		return !1
	}

	function buildSys(e, r) {
		return isDefined(r) || (r = ["Sensor-WideSpec", "SensorTurret1Mk1"]), isDefined(e) && buildDroid(e, "System unit", sysBody, sysProp, "", "", r) ? !0 : !1
	}

	function buildCyborg(e) {
		var r, n, a, o = choosePersonalityWeapon("CYBORG");
		if (!isDefined(o)) return !1;
		for (var i = o.templates.length - 1, s = i; s >= 0; --s)
		if (n = o.templates[s].body, a = o.templates[s].prop, r = o.templates[s].weapons[0], "CyborgFlamer01" !== r && isDefined(e) && buildDroid(e, r + " Cyborg", n, a, "", "", r, r)) return !0;
		return !1
	}

	function buildVTOL(e) {
		var r = choosePersonalityWeapon("VTOL");
		return isDefined(e) && isDefined(r) && buildDroid(e, "VTOL unit", vtolBody, "V-Tol", "", "", r, r) ? !0 : !1
	}

	function produce() {
		const e = -100,
		r = 4,
		n = 2,
		a = 3;
		for (var o = enumStruct(me, structures.factories), i = enumStruct(me, structures.templateFactories), s = enumStruct(me, structures.vtolFactories), t = o.length, l = i.length, u = s.length, p = 0, d = 0, f = 0, c = 0; t > c; ++c) {
			var m = getDroidProduction(o[c]);
			null !== m && (m.droidType === DROID_CONSTRUCT && (p += 1), m.droidType === DROID_SENSOR && (d += 1), m.droidType === DROID_REPAIR && (f += 1))
		}
		for (var b = 0; t > b; ++b)
		if (isDefined(o[b]) && structureIdle(o[b]) && getRealPower() > e)
		if (countDroid(DROID_CONSTRUCT, me) + p < r) playerAlliance(!0).length && countDroid(DROID_CONSTRUCT, me) < r && gameTime > 3e4 && sendChatMessage("need truck", ALLIES), buildSys(o[b], "Spade1Mk1");
		else if (enumGroup(sensorGroup).length + d < n) buildSys(o[b]);
		else if (enumGroup(attackGroup).length > 6 && enumGroup(repairGroup).length + f < a) buildSys(o[b], repairTurrets);
		else {
			if (o[b].modules < 2 && componentAvailable("Body11ABT")) continue;
			buildAttacker(o[b])
		}
		if (!turnOffCyborgs)
		for (var b = 0; l > b; ++b) isDefined(i[b]) && structureIdle(i[b]) && getRealPower() > e && buildCyborg(i[b]);
		for (var b = 0; u > b; ++b) isDefined(s[b]) && structureIdle(s[b]) && getRealPower() > e && buildVTOL(s[b])
	}
}
