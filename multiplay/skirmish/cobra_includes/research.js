
if(DEVELOPMENT) {
	//updates a research list with whatever is passed to it.
	function updateResearchList(stat, len) {
		if(!isDefined(len)) {
			len = 0;
		}

		var list = [];
		var cacheStats = stat.length - len;

		for(var x = 0; x < cacheStats; ++x) {
			if(isDefined(stat[x].res))
			list.push(stat[x].res); //weapon
			else
			list.push(stat[x]); //extra
		}
		return list;
	}

	//Initialization of research lists when eventStartLevel is triggered.
	//Call this again when manually changing a personality.
	function initializeResearchLists() {
		techlist = subpersonalities[personality].res;
		antiAirTech = updateResearchList(subpersonalities[personality].antiAir.defenses);
		antiAirExtras = updateResearchList(subpersonalities[personality].antiAir.extras);
		extremeLaserTech = updateResearchList(weaponStats.AS.extras);
		mgWeaponTech = updateResearchList(weaponStats.machineguns.weapons);
		laserTech = updateResearchList(weaponStats.lasers.weapons);
		laserExtra = updateResearchList(weaponStats.lasers.extras);
		weaponTech = updateResearchList(subpersonalities[personality].primaryWeapon.weapons);
		artilleryTech = updateResearchList(subpersonalities[personality].artillery.weapons);
		artillExtra = updateResearchList(subpersonalities[personality].artillery.extras);
		extraTech = updateResearchList(subpersonalities[personality].primaryWeapon.extras);
		secondaryWeaponTech = updateResearchList(subpersonalities[personality].secondaryWeapon.weapons);
		secondaryWeaponExtra = updateResearchList(subpersonalities[personality].secondaryWeapon.extras);
		defenseTech = updateResearchList(subpersonalities[personality].primaryWeapon.defenses);
		cyborgWeaps = updateResearchList(subpersonalities[personality].primaryWeapon.templates);
	}

	//This function aims to more cleanly discover available research topics
	//with the given list provided. pursueResearch falls short in that it fails to
	//acknowledge the availability of an item further into the list if a previous
	//one is not completed... so lets help it a bit.
	function evalResearch(lab, list) {
		var cacheList = list.length;
		var found = pursueResearch(lab, list);
		//Try going a bit deeper.
		if(!found) {
			for(var i = 0; i < cacheList; ++i) {
				found = pursueResearch(lab, list[i]);
				if(found) {
					break;
				}
			}
		}
		return found;
	}


	function eventResearched() {
		const MIN_POWER = -230;
		if(!isDefined(techlist) || !isDefined(turnOffMG) || !isDefined(turnOffCyborgs)) {
			return;
		}

		var lablist = enumStruct(me, structures.labs);
		var cacheLabs = lablist.length;

		for (var i = 0; i < cacheLabs; ++i) {
			var lab = lablist[i];

			var found = false;
			if ((lab.status === BUILT) && structureIdle(lab) && (getRealPower() > MIN_POWER)) {
				found = pursueResearch(lab, ESSENTIALS);

				if(!found && (personality === "AL"))
					found = evalResearch(lab, techlist);

				//To get all the good stuff as fast as possible.
				if(!found)
					found = pursueResearch(lab, fastestResearch);
				if(!found)
					found = pursueResearch(lab, "R-Struc-Power-Upgrade03a");

				//Early research.
				if(!found)
					found = pursueResearch(lab, "R-Vehicle-Prop-Halftracks");
				if(!found && (personality !== "AL"))
					found = evalResearch(lab, techlist);

				if(!found)
					found = evalResearch(lab, START_BODY);
				if(!found)
					found = evalResearch(lab, PROPULSION);

				if(!found && !random(4))
					found = evalResearch(lab, tankArmorResearch);
				if(!found)
					found = evalResearch(lab, REPAIR_UPGRADES);

				if(!turnOffMG || (returnPrimaryAlias() === "mg")) {
					if(!found)
						found = pursueResearch(lab, mgWeaponTech);
					if(!found)
						found = pursueResearch(lab, "R-Wpn-MG-Damage08");
				}

				if(!found && (returnPrimaryAlias() === "fl" || returnArtilleryAlias() === "fmor"))
					found = evalResearch(lab, FLAMER);

				if(!found)
					found = pursueResearch(lab, "R-Struc-Factory-Upgrade09");

				if(random(2)) {
					if(!found)
						found = evalResearch(lab, extraTech);
					if(!found && !turnOffCyborgs)
						found = evalResearch(lab, cyborgWeaps);
					if(!found)
						found = evalResearch(lab, weaponTech);
					if(!found)
						found = evalResearch(lab, defenseTech);
				}

				//lasers AA needs stormbringer ASAP. Otherwise just research antiAir
				//when enemy gets VTOLs.
				if((returnAntiAirAlias() === "las") || countEnemyVTOL()) {
					if(!found)
						found = evalResearch(lab, antiAirTech);
					if(!found)
						found = evalResearch(lab, antiAirExtras);
				}

				if(random(3)) {
					if(!found)
						found = evalResearch(lab, artilleryTech);
					if(!found)
						found = evalResearch(lab, artillExtra);

					if(!found)
						found = pursueResearch(lab, "R-Wpn-PlasmaCannon");
					if(!found)
						found = evalResearch(lab, extremeLaserTech);
				}

				if(random(3)) {
					const VTOL_RES = [
						"R-Struc-VTOLPad-Upgrade02", "R-Wpn-Bomb02", "R-Wpn-Bomb05",
						"R-Wpn-Bomb-Accuracy03", "R-Struc-VTOLPad-Upgrade06"
					];

					if(!found)
						found = evalResearch(lab, VTOL_RES);
				}

				if(!found)
					found = evalResearch(lab, SENSOR_TECH);

				if(!found && !turnOffCyborgs && random(2))
					found = evalResearch(lab, cyborgArmorResearch);
				if(!found && random(2))
					found = evalResearch(lab, STRUCTURE_DEFENSE_UPGRADES);

				if(!found)
					found = pursueResearch(lab, "R-Wpn-Bomb06");

				if(random(4)) {
					if(!found && !turnOffCyborgs)
						found = pursueResearch(lab, "R-Cyborg-Hvywpn-PulseLsr");
					if(!found)
						found = evalResearch(lab, laserTech);
					if(!found)
						found = evalResearch(lab, laserExtra);
				}

				//Late game weapon.
				if(random(3)) {
					var cyborgSecondary = appendListElements(cyborgSecondary, updateResearchList(subpersonalities[personality].secondaryWeapon.templates));
					var len = subpersonalities[personality].primaryWeapon.weapons.length - 1;

					if(isDesignable(subpersonalities[personality].primaryWeapon.weapons[len].stat)) {
						if(!found && !turnOffCyborgs && cyborgSecondary.length)
							found = pursueResearch(lab, cyborgSecondary);
						if(!found)
							found = evalResearch(lab, secondaryWeaponExtra);
						if(!found)
							found = evalResearch(lab, secondaryWeaponTech);
					}
				}

				if(!found)
					found = evalResearch(lab, bodyResearch);
				if(!found)
					found = pursueResearch(lab, "R-Sys-Resistance-Circuits");
				if(!found)
					found = evalResearch(lab, FLAMER);
				if(!found)
					found = pursueResearch(lab, "R-Wpn-LasSat");

				//Very likely going to be done with research by now.
				if(!found && componentAvailable("Body14SUP") && isDesignable("EMP-Cannon") && isStructureAvailable(structures.extras[2])) {
					researchComplete = true;
				}
			}
		}
	}
}
else {
	function updateResearchList(e, a) {
		isDefined(a) || (a = 0);
		for (var r = [], s = e.length - a, t = 0; s > t; ++t) isDefined(e[t].res) ? r.push(e[t].res) : r.push(e[t]);
		return r
	}

	function initializeResearchLists() {
		techlist = subpersonalities[personality].res, antiAirTech = updateResearchList(subpersonalities[personality].antiAir.defenses), antiAirExtras = updateResearchList(subpersonalities[personality].antiAir.extras), extremeLaserTech = updateResearchList(weaponStats.AS.extras), mgWeaponTech = updateResearchList(weaponStats.machineguns.weapons), laserTech = updateResearchList(weaponStats.lasers.weapons), laserExtra = updateResearchList(weaponStats.lasers.extras), weaponTech = updateResearchList(subpersonalities[personality].primaryWeapon.weapons), artilleryTech = updateResearchList(subpersonalities[personality].artillery.weapons), artillExtra = updateResearchList(subpersonalities[personality].artillery.extras), extraTech = updateResearchList(subpersonalities[personality].primaryWeapon.extras), secondaryWeaponTech = updateResearchList(subpersonalities[personality].secondaryWeapon.weapons), secondaryWeaponExtra = updateResearchList(subpersonalities[personality].secondaryWeapon.extras), defenseTech = updateResearchList(subpersonalities[personality].primaryWeapon.defenses), cyborgWeaps = updateResearchList(subpersonalities[personality].primaryWeapon.templates)
	}

	function evalResearch(e, a) {
		var r = a.length,
		s = pursueResearch(e, a);
		if (!s)
		for (var t = 0; r > t && !(s = pursueResearch(e, a[t])); ++t);
		return s
	}

	function eventResearched() {
		const e = -230;
		if (isDefined(techlist) && isDefined(turnOffMG) && isDefined(turnOffCyborgs))
		for (var a = enumStruct(me, structures.labs), r = a.length, s = 0; r > s; ++s) {
			var t = a[s],
			n = !1;
			if (t.status === BUILT && structureIdle(t) && getRealPower() > e) {
				if (n = pursueResearch(t, ESSENTIALS), n || "AL" !== personality || (n = evalResearch(t, techlist)), n || (n = pursueResearch(t, fastestResearch)), n || (n = pursueResearch(t, "R-Struc-Power-Upgrade03a")), n || (n = pursueResearch(t, "R-Vehicle-Prop-Halftracks")), n || "AL" === personality || (n = evalResearch(t, techlist)), n || (n = evalResearch(t, START_BODY)), n || (n = evalResearch(t, PROPULSION)), n || random(4) || (n = evalResearch(t, tankArmorResearch)), n || (n = evalResearch(t, REPAIR_UPGRADES)), turnOffMG && "mg" !== returnPrimaryAlias() || (n || (n = pursueResearch(t, mgWeaponTech)), n || (n = pursueResearch(t, "R-Wpn-MG-Damage08"))), n || "fl" !== returnPrimaryAlias() && "fmor" !== returnArtilleryAlias() || (n = evalResearch(t, FLAMER)), n || (n = pursueResearch(t, "R-Struc-Factory-Upgrade09")), random(2) && (n || (n = evalResearch(t, extraTech)), n || turnOffCyborgs || (n = evalResearch(t, cyborgWeaps)), n || (n = evalResearch(t, weaponTech)), n || (n = evalResearch(t, defenseTech))), ("las" === returnAntiAirAlias() || countEnemyVTOL()) && (n || (n = evalResearch(t, antiAirTech)), n || (n = evalResearch(t, antiAirExtras))), random(3) && (n || (n = evalResearch(t, artilleryTech)), n || (n = evalResearch(t, artillExtra)), n || (n = pursueResearch(t, "R-Wpn-PlasmaCannon")), n || (n = evalResearch(t, extremeLaserTech))), random(3)) {
					const i = ["R-Struc-VTOLPad-Upgrade02", "R-Wpn-Bomb02", "R-Wpn-Bomb05", "R-Wpn-Bomb-Accuracy03", "R-Struc-VTOLPad-Upgrade06"];
					n || (n = evalResearch(t, i))
				}
				if (n || (n = evalResearch(t, SENSOR_TECH)), n || turnOffCyborgs || !random(2) || (n = evalResearch(t, cyborgArmorResearch)), !n && random(2) && (n = evalResearch(t, STRUCTURE_DEFENSE_UPGRADES)), n || (n = pursueResearch(t, "R-Wpn-Bomb06")), random(4) && (n || turnOffCyborgs || (n = pursueResearch(t, "R-Cyborg-Hvywpn-PulseLsr")), n || (n = evalResearch(t, laserTech)), n || (n = evalResearch(t, laserExtra))), random(3)) {
					var c = appendListElements(c, updateResearchList(subpersonalities[personality].secondaryWeapon.templates)),
					p = subpersonalities[personality].primaryWeapon.weapons.length - 1;
					isDesignable(subpersonalities[personality].primaryWeapon.weapons[p].stat) && (n || turnOffCyborgs || !c.length || (n = pursueResearch(t, c)), n || (n = evalResearch(t, secondaryWeaponExtra)), n || (n = evalResearch(t, secondaryWeaponTech)))
				}
				n || (n = evalResearch(t, bodyResearch)), n || (n = pursueResearch(t, "R-Sys-Resistance-Circuits")), n || (n = evalResearch(t, FLAMER)), n || (n = pursueResearch(t, "R-Wpn-LasSat")), !n && componentAvailable("Body14SUP") && isDesignable("EMP-Cannon") && isStructureAvailable(structures.extras[2]) && (researchComplete = !0)
			}
		}
	}
}
