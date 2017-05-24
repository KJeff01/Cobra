

//updates a research list with whatever is passed to it.
function updateResearchList(stat, len) {
	if(!isDefined(len))
		len = 0;
	var list = [];
	for(var x = 0; x < stat.length - len; ++x) {
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
	var found = pursueResearch(lab, list);
	//Try going a bit deeper.
	if(!found) {
		for(var i = 0; i < list.length; ++i) {
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
	for (var i = 0; i < lablist.length; ++i) {
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

			if(!random(4)) {
				if(!turnOffCyborgs && componentAvailable("Body11ABT")) {
					if(!found)
						found = evalResearch(lab, kineticResearch);
				}
				else {
					if(!found)
						found = pursueResearch(lab, "R-Vehicle-Metals09");
				}
			}

			if(!found)
				found = evalResearch(lab, REPAIR_UPGRADES);

			if(!turnOffMG || (returnPrimaryAlias() === "mg")) {
				if(!found)
					found = pursueResearch(lab, mgWeaponTech);
				if(!found)
					found = pursueResearch(lab, "R-Wpn-MG-Damage08");
			}

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

			if(!found)
				found = evalResearch(lab, SENSOR_TECH);

			if(random(3)) {
				if(!found)
					found = evalResearch(lab, artilleryTech);
				if(!found)
					found = evalResearch(lab, artillExtra);
			}

			//Just like the semperfi AI bots (which Cobra is derived from) it
			//stays true to the use of those thermite cyborgs.
			if(!found && !turnOffCyborgs)
				found = evalResearch(lab, FLAMER);

			if(random(3)) {
				const VTOL_RES = ["R-Struc-VTOLPad-Upgrade02", "R-Wpn-Bomb05", "R-Wpn-Bomb-Accuracy03", "R-Struc-VTOLPad-Upgrade06", "R-Wpn-Bomb06"];
				if(!found)
					found = evalResearch(lab, VTOL_RES);
			}

			if(!turnOffCyborgs) {
				if(!found)
					found = evalResearch(lab, thermalResearch);
			}
			else {
				if(!found)
					found = pursueResearch(lab, "R-Vehicle-Armor-Heat09");
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

			if(random(4)) {
				if(!found && !turnOffCyborgs)
					found = pursueResearch(lab, "R-Cyborg-Hvywpn-PulseLsr");
				if(!found)
					found = evalResearch(lab, laserTech);
				if(!found)
					found = evalResearch(lab, laserExtra);
			}

			if(!found)
				found = pursueResearch(lab, "R-Sys-Resistance-Circuits");
			if(!found)
				found = evalResearch(lab, STRUCTURE_DEFENSE_UPGRADES);

			if(!found)
				found = pursueResearch(lab, "R-Wpn-PlasmaCannon");
			if(!found)
				found = evalResearch(lab, extremeLaserTech);

			if(!found)
				found = pursueResearch(lab, "R-Wpn-LasSat");
			if(!found)
				found = pursueResearch(lab, "R-Wpn-EMPCannon");

			//Very likely going to be done with research by now.
			if(!found && componentAvailable("Body14SUP") && isDesignable("EMP-Cannon") && isStructureAvailable(structures.extras[2])) {
				researchComplete = true;
			}
		}
	}
}
