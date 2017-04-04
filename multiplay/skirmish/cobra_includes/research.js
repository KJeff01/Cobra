
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
	vtolWeapons = updateResearchList(weaponStats.bombs.vtols);
	vtolExtras = updateResearchList(weaponStats.bombs.extras);
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
function eventResearched() {
	if(!isDefined(techlist)) { return; }
	if(getRealPower() < -400) { return; }

	const PROPULSION = [
		"R-Vehicle-Prop-Halftracks", "R-Vehicle-Prop-Hover",
		"R-Vehicle-Prop-Tracks"
	];
	const START_BODY = [
		"R-Vehicle-Body05", "R-Vehicle-Body11"
	];
	const REPAIR_UPGRADES = [
		"R-Sys-Autorepair-General", "R-Struc-RprFac-Upgrade06"
	]

	var lablist = enumStruct(me, structures.labs);
	for (var i = 0; i < lablist.length; ++i) {
		var lab = lablist[i];
		var found = false;
		if (lab.status == BUILT && structureIdle(lab)) {
			found = pursueResearch(lab, techlist);

			if(!found)
				found = evalResearch(lab, START_BODY);
			if(!found)
				found = evalResearch(lab, PROPULSION);

			if(!found)
				found = pursueResearch(lab, "R-Struc-Power-Upgrade03a");
			if(!found)
				found = pursueResearch(lab, fastestResearch);

			//If T1 - Go for machine-guns. else focus on lasers and the primary weapon.
			if(isDefined(turnOffMG) && (turnOffMG === false) || (personality === "AM")) {
				if(!found)
					found = pursueResearch(lab, mgWeaponTech);
				if(!found)
					found = pursueResearch(lab, "R-Wpn-MG-Damage08");
			}

			if(isDefined(turnOffCyborgs)) {
				if(turnOffCyborgs === false) {
					if(!found)
						found = evalResearch(lab, kineticResearch);
				}
				else {
					if(!found)
						found = pursueResearch(lab, "R-Vehicle-Metals09");
				}
			}

			if(isDefined(turnOffCyborgs) && (turnOffCyborgs === false) && !found)
				found = evalResearch(lab, cyborgWeaps);

			if(random(2)) {
				if(!found)
					found = evalResearch(lab, extraTech);
				if(!found)
					found = evalResearch(lab, weaponTech);
				if(!found)
					found = evalResearch(lab, artilleryTech);
				if(!found)
					found = evalResearch(lab, artillExtra);
			}
			else if((gameTime > 1600000) && random(2)) {

				if(!found)
					found = pursueResearch(lab, "R-Struc-VTOLPad-Upgrade02");

				if(!found && (personality !== "AB"))
					found = pursueResearch(lab, "R-Wpn-Bomb04");

				if(personality !== "AB") {
					if(!found)
						found = evalResearch(lab, vtolExtras);
					if(!found)
						found = evalResearch(lab, vtolWeapons);
				}
				else {
					if(!found)
						found = pursueResearch(lab, "R-Struc-VTOLPad-Upgrade06");
				}

				if(!found)
					found = evalResearch(lab, antiAirTech);
				if(!found)
					found = evalResearch(lab, antiAirExtras);
			}

			if(!found)
				found = evalResearch(lab, laserExtra);
			if(!found)
				found = evalResearch(lab, laserTech);
			if(!found)
				found = evalResearch(lab, secondaryWeaponExtra);
			if(!found)
				found = evalResearch(lab, secondaryWeaponTech);


			/*
			if(!found)
				found = pursueResearch(lab, "R-Comp-CommandTurret01");
			*/

			if(!found)
				found = evalResearch(lab, REPAIR_UPGRADES);
			if(!found)
				found = pursueResearch(lab, "R-Struc-Factory-Upgrade09");

			if(!found)
				found = pursueResearch(lab, "R-Sys-Sensor-WS");
			if(!found)
				found = evalResearch(lab, bodyResearch);


			if(isDefined(turnOffCyborgs)) {
				if(turnOffCyborgs === false) {
					if(!found)
						found = evalResearch(lab, thermalResearch);
				}
				else {
					if(!found)
						found = pursueResearch(lab, "R-Vehicle-Armor-Heat09");
				}
			}

			if(!found)
				found = pursueResearch(lab, "R-Wpn-PlasmaCannon");

			if(componentAvailable("Laser4-PlasmaCannon")) {
				if(!found)
					found = evalResearch(lab, extremeLaserTech);
				if(!found)
					found = pursueResearch(lab, "R-Wpn-LasSat");
				if(!found)
					found = pursueResearch(lab, "R-Wpn-EMPCannon");
				if(!found)
					found = pursueResearch(lab, "R-Struc-Materials09");
			}
		}
	}
}
