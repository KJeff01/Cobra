

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
	techlist = subpersonalities[personality]["res"];
	antiAirTech = updateResearchList(weaponStats.AA.defenses, 1);
	antiAirExtras = updateResearchList(weaponStats.AA.extras);
	extremeLaserTech = updateResearchList(weaponStats.AS.extras);
	mgWeaponTech = updateResearchList(weaponStats.machineguns.weapons);
	laserTech = updateResearchList(weaponStats.lasers.weapons);
	laserExtra = updateResearchList(weaponStats.lasers.extras);
	weaponTech = updateResearchList(subpersonalities[personality]["primaryWeapon"].weapons);
	artilleryTech = updateResearchList(subpersonalities[personality]["artillery"].weapons);
	artillExtra = updateResearchList(subpersonalities[personality]["artillery"].extras);
	extraTech = updateResearchList(subpersonalities[personality]["primaryWeapon"].extras);
	secondaryWeaponTech = updateResearchList(subpersonalities[personality]["secondaryWeapon"].weapons);
	secondaryWeaponExtra = updateResearchList(subpersonalities[personality]["secondaryWeapon"].extras);
	defenseTech = updateResearchList(subpersonalities[personality]["primaryWeapon"].defenses);
	defenseTech.push("R-Struc-Materials09");
	defenseTech.push("R-Defense-WallUpgrade12");
	cyborgWeaps = updateResearchList(subpersonalities[personality]["primaryWeapon"].templates);
	cyborgWeaps = appendListElements(cyborgWeaps, updateResearchList(weaponStats.lasers.templates));
	cyborgWeaps = appendListElements(cyborgWeaps, updateResearchList(subpersonalities[personality]["secondaryWeapon"].templates));
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

//The research decisions. On T2/T3 it is more artillery/laser/vtol focused
//Needs to have bloat reduction here.

//TODO: Sort by .power and .points to complete cheaper research first.

function eventResearched() {
	if(!isDefined(techlist) || !isDefined(turnOffMG) || !isDefined(turnOffCyborgs)) { return; }
	if(getRealPower() < -400) { return; }

	const PROPULSION = [
		"R-Vehicle-Prop-Hover", "R-Vehicle-Prop-Tracks"
	];
	const START_BODY = [
		"R-Vehicle-Body05", "R-Vehicle-Body11"
	];
	const REPAIR_UPGRADES = [
		"R-Sys-Autorepair-General", "R-Struc-RprFac-Upgrade06"
	]
	const FLAMER = ["R-Wpn-Flame2", "R-Wpn-Flamer-ROF03", "R-Wpn-Flamer-Damage09"]

	var lablist = enumStruct(me, structures.labs);
	for (var i = 0; i < lablist.length; ++i) {
		var lab = lablist[i];
		var found = false;
		if (lab.status === BUILT && structureIdle(lab)) {
			found = evalResearch(lab, techlist);

			if(!found)
				found = pursueResearch(lab, "R-Vehicle-Prop-Halftracks");
			if(!found)
				found = evalResearch(lab, START_BODY);
			if(!found)
				found = pursueResearch(lab, "R-Struc-Power-Upgrade03a");
			if(!found)
				found = pursueResearch(lab, fastestResearch);
			if(!found)
				found = evalResearch(lab, PROPULSION);

			//If T1 - Go for machine-guns. else focus on lasers and the primary weapon.
			if(!turnOffMG || (personality === "AM")) {
				if(!found)
					found = pursueResearch(lab, mgWeaponTech);
				if(!found)
					found = pursueResearch(lab, "R-Wpn-MG-Damage08");
			}

			if(!random(4)) {
				if(!turnOffCyborgs) {
					if(!found)
						found = evalResearch(lab, kineticResearch);
				}
				else {
					if(!found)
						found = pursueResearch(lab, "R-Vehicle-Metals09");
				}
			}

			if(random(3)) {
				if(!turnOffCyborgs && !found)
					found = evalResearch(lab, FLAMER);
				if(!turnOffCyborgs && !found)
					found = evalResearch(lab, cyborgWeaps);
				if(!found)
					found = evalResearch(lab, REPAIR_UPGRADES);
			}

			if(random(2)) {
				if(!found)
					found = evalResearch(lab, weaponTech);
				if(!found)
					found = evalResearch(lab, extraTech);
				if(!found)
					found = evalResearch(lab, secondaryWeaponTech);
				if(!found)
					found = evalResearch(lab, secondaryWeaponExtra);
			}
			else if(random(2)) {
				if(!found)
					found = evalResearch(lab, laserTech);
				if(!found)
					found = evalResearch(lab, artilleryTech);
				if(!found)
					found = evalResearch(lab, laserExtra);
				if(!found)
					found = evalResearch(lab, artillExtra);
			}

			if(random(2)) {
				if(!found)
					found = evalResearch(lab, bodyResearch);
				if(!found)
					found = evalResearch(lab, defenseTech);
			}

			if(forceHover || (gameTime > 600000) && random(2)) {
				if(!found)
					found = pursueResearch(lab, "R-Struc-VTOLPad-Upgrade06");
			}

			if(countEnemyVTOL()) {
				if(!found)
					found = evalResearch(lab, antiAirTech);
				if(!found)
					found = evalResearch(lab, antiAirExtras);
			}

			if(!found)
				found = pursueResearch(lab, "R-Struc-Factory-Upgrade09");

			/*
			if(!found)
				found = pursueResearch(lab, "R-Comp-CommandTurret01");
			*/

			if(!found)
				found = pursueResearch(lab, "R-Sys-Sensor-WS");


			if(!turnOffCyborgs) {
				if(!found)
					found = evalResearch(lab, thermalResearch);
			}
			else {
				if(!found)
					found = pursueResearch(lab, "R-Vehicle-Armor-Heat09");
			}

			if(!found)
				found = pursueResearch(lab, "R-Wpn-PlasmaCannon");

			if(isDesignable("Laser4-PlasmaCannon") && (gameTime > 350000)) {
				if(!found)
					found = evalResearch(lab, extremeLaserTech);
				if(!found)
					found = pursueResearch(lab, "R-Wpn-LasSat");
				if(!found)
					found = pursueResearch(lab, "R-Wpn-EMPCannon");
				if(!found)
					found = pursueResearch(lab, "R-Sys-Resistance-Circuits");

				//Very likely going to be done with research by now.
				if(!found && componentAvailable("Body14SUP")
					&& isDesignable("EMP-Cannon")
					&& isStructureAvailable(structures.extras[2])
				) {
					researchComplete = true;
				}
			}
		}
	}
}
