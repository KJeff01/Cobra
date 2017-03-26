
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
	if(!isDefined(techlist) || !isDefined(artillExtra)) { return; }
	if(getRealPower() < -400) { return; }

	var lablist = enumStruct(me, structures.labs);
	for (var i = 0; i < lablist.length; ++i) {
		var lab = lablist[i];
		var found = false;
		if (lab.status == BUILT && structureIdle(lab)) {
			found = evalResearch(lab, techlist);

			if(!found)
				found = pursueResearch(lab, "R-Vehicle-Prop-Halftracks");
			if((isDefined(forceHover) && (forceHover === true)) || (turnOffMG === true)) {
				if(!found)
					found = pursueResearch(lab, "R-Vehicle-Prop-Hover");
			}

			if(!found)
				pursueResearch(lab, "R-Vehicle-Body05"); // Cobra body

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

			if((gameTime < 280000) && isDefined(turnOffMG) && (turnOffMG === false))
				continue;

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

			if(random(2) && componentAvailable("Body11ABT")) {
				if(isDefined(turnOffCyborgs) && (turnOffCyborgs === false) && !found)
					found = evalResearch(lab, cyborgWeaps);
				if(!found)
					found = evalResearch(lab, extraTech);
				if(!found)
					found = evalResearch(lab, artillExtra);
				if(!found)
					found = evalResearch(lab, weaponTech);
				if(!found)
					found = evalResearch(lab, artilleryTech);
			}
			else if(random(2) && componentAvailable("Body11ABT")) {
				if(!found)
					found = pursueResearch(lab, "R-Struc-VTOLPad-Upgrade02");
				if(!found)
					found = pursueResearch(lab, "R-Wpn-Bomb03");
				if(!found)
					found = evalResearch(lab, antiAirTech);

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
					found = evalResearch(lab, antiAirExtras);
			}
			else {
				if(!found)
					found = evalResearch(lab, laserTech);
				if(!found)
					found = evalResearch(lab, laserExtra);
			}

			/*
			if(!found)
				found = pursueResearch(lab, "R-Comp-CommandTurret01");
			*/

			if(!found)
				found = pursueResearch(lab, "R-Sys-Autorepair-General");
			if(!found)
				found = pursueResearch(lab, "R-Struc-Factory-Upgrade09");

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
				found = pursueResearch(lab, "R-Sys-Sensor-WS");
			if(!found)
				found = pursueResearch(lab, "R-Wpn-PlasmaCannon");
			if(!found)
				found = evalResearch(lab, extremeLaserTech);

			if(componentAvailable("Body11ABT")) {
				if(!found)
					found = pursueResearch(lab, "R-Wpn-EMPCannon");
				if(!found)
					found = pursueResearch(lab, "R-Struc-Materials09");
				if(!found)
					found = pursueResearch(lab, "R-Wpn-LasSat");
			}
		}
	}
}
