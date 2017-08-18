
const TANK_ARMOR = [
	"R-Vehicle-Metals09",
	"R-Vehicle-Armor-Heat09",
];

const CYBORG_ARMOR = [
	"R-Cyborg-Metals09",
	"R-Cyborg-Armor-Heat09",
];

const ESSENTIALS = [
	"R-Wpn-MG1Mk1",
	"R-Wpn-MG-Damage01",
	"R-Struc-PowerModuleMk1",
	"R-Defense-Tower01",
	"R-Wpn-MG2Mk1",
	"R-Struc-Research-Upgrade09",
	"R-Struc-Power-Upgrade03a",
	"R-Vehicle-Prop-Halftracks",
	"R-Vehicle-Body05",
	"R-Struc-RprFac-Upgrade01",
	"R-Vehicle-Prop-Hover",
	"R-Vehicle-Body04",
];

const SYSTEM_UPGRADES = [
	"R-Sys-Sensor-Upgrade03",
	"R-Sys-MobileRepairTurretHvy",
	"R-Struc-Factory-Upgrade09",
	"R-Sys-Autorepair-General",
	"R-Struc-RprFac-Upgrade06",
];

const FLAMER = [
	"R-Wpn-Flame2",
	"R-Wpn-Flamer-ROF03",
	"R-Wpn-Flamer-Damage09",
];

const SENSOR_TECH = [
	"R-Sys-ECM-Upgrade02",
	"R-Sys-Sensor-WS",
	"R-Sys-RadarDetector01",
	"R-Wpn-LasSat",
];

const DEFENSE_UPGRADES = [
	"R-Sys-Resistance-Circuits",
	"R-Defense-WallUpgrade12",
	"R-Struc-Materials09",
];

const BODY_RESEARCH = [
	"R-Vehicle-Body11",
	"R-Vehicle-Body12",
	"R-Vehicle-Body06",
	"R-Vehicle-Body10",
	"R-Vehicle-Body14",
];

const VTOL_RES = [
	"R-Wpn-Bomb-Accuracy03",
	"R-Struc-VTOLPad-Upgrade06",
	"R-Wpn-Bomb05",
	"R-Wpn-Bomb06",
];

const MID_GAME_TECH = [
	"R-Cyborg-Metals05",
	"R-Vehicle-Metals05",
	"R-Wpn-Bomb04",
	"R-Wpn-Bomb-Accuracy02",
	"R-Struc-VTOLPad-Upgrade04",
	"R-Defense-WallUpgrade03",
];

const LATE_EARLY_GAME_TECH = [
	"R-Vehicle-Body11",
	"R-Vehicle-Prop-Tracks",
	"R-Cyborg-Metals03",
];

// -- Weapon research list (initializeResearchLists).
var techlist;
var weaponTech;
var mgWeaponTech;
var laserTech;
var artilleryTech;
var artillExtra;
var laserExtra;
var extraTech;
var cyborgWeaps;
var antiAirTech;
var antiAirExtras;
var extremeLaserTech;
var secondaryWeaponTech;
var secondaryWeaponExtra;
var defenseTech;

//updates a research list with whatever is passed to it.
function updateResearchList(stat, len) {
	if(!isDefined(len)) {
		len = 0;
	}

	var list = [];
	for(var x = 0, d = stat.length - len; x < d; ++x) {
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
	defenseTech = updateResearchList(subpersonalities[personality].artillery.defenses);
	cyborgWeaps = updateResearchList(subpersonalities[personality].primaryWeapon.templates);
}

//This function aims to more cleanly discover available research topics
//with the given list provided. pursueResearch falls short in that it fails to
//acknowledge the availability of an item further into the list if a previous
//one is not completed... so lets help it a bit.
function evalResearch(lab, list) {
	var found = false;

	for(var i = 0, a = list.length; i < a; ++i) {
		found = pursueResearch(lab, list[i]);
		if(found) {
			break;
		}
	}

	return found;
}

function eventResearched() {
	const MIN_POWER = 150;
	if((gameTime < 2000) || (getRealPower() < MIN_POWER) || !(isDefined(techlist) && isDefined(turnOffMG) && isDefined(turnOffCyborgs))) {
		return;
	}

	var labList = enumStruct(me, structures.labs).filter(function(lb) {
		return ((lb.status === BUILT) && structureIdle(lb));
	});

	for (var i = 0, a = labList.length; i < a; ++i) {
		var lab = labList[i];
		var found = false;

		if(getRealPower() > MIN_POWER) {
			found = evalResearch(lab, ESSENTIALS);
			if(!found)
				found = evalResearch(lab, techlist);

			if(!turnOffMG || (returnPrimaryAlias() === "mg")) {
				if(!found)
					found = pursueResearch(lab, mgWeaponTech);
				if(!found)
					found = pursueResearch(lab, "R-Wpn-MG-Damage08");
			}

			if(!found && !turnOffCyborgs)
				found = evalResearch(lab, cyborgWeaps);
			if(!found)
				found = evalResearch(lab, weaponTech);

			if(!found)
				found = evalResearch(lab, SYSTEM_UPGRADES);

			if((random(101) < subpersonalities[personality].systemPriority)) {
				if(!found)
					found = evalResearch(lab, LATE_EARLY_GAME_TECH);
				if(!found)
					found = evalResearch(lab, SENSOR_TECH);
			}

			if(!found && (random(101) < subpersonalities[personality].alloyPriority)) {
				if(turnOffCyborgs || (droidPreference(false) === "TANK")) {
					found = evalResearch(lab, TANK_ARMOR);
				}
				else {
					found = evalResearch(lab, CYBORG_ARMOR);
				}

				//Research the lesser preferred alloys now.
				if(!found && !random(4)) {
					if(droidPreference(true) === "TANK") {
						found = evalResearch(lab, TANK_ARMOR);
					}
					else {
						found = evalResearch(lab, CYBORG_ARMOR);
					}
				}
			}

			//Use default AA until stormbringer.
			if(countEnemyVTOL() && !isStructureAvailable("P0-AASite-Laser")) {
				if(!found)
					found = evalResearch(lab, antiAirTech);
				if(!found)
					found = evalResearch(lab, antiAirExtras);
			}

			//Rocket/missile personalities NEED to seriously commit
			//to their rocket upgrades to be even remotely successful.
			if(!found && ((returnPrimaryAlias() === "rkt") || (returnPrimaryAlias() === "miss")))
				found = evalResearch(lab, extraTech);

			if(!found)
				found = evalResearch(lab, artilleryTech);
			if(!found)
				found = evalResearch(lab, extraTech);
			if(!found)
				found = evalResearch(lab, artillExtra);

			//Defense related tech.
			if(!found)
				found = evalResearch(lab, defenseTech);
			if(random(101) < subpersonalities[personality].defensePriority) {
				if(!found)
					found = evalResearch(lab, DEFENSE_UPGRADES);
			}

			if(!found)
				found = evalResearch(lab, MID_GAME_TECH);
			if(!found)
				found = evalResearch(lab, BODY_RESEARCH);

			if(!found && (random(101) < subpersonalities[personality].vtolPriority))
				found = evalResearch(lab, VTOL_RES);


			if(!random(3)) {
				if(!found)
					found = pursueResearch(lab, "R-Wpn-PlasmaCannon");

				if(componentAvailable("Laser4-PlasmaCannon")) {
					if(!found)
						found = evalResearch(lab, extremeLaserTech);
					if(!found)
						found = evalResearch(lab, FLAMER);
				}
			}


			//Late game weapon.
			if(random(3)) {
				var cyborgSecondary = appendListElements(cyborgSecondary, updateResearchList(subpersonalities[personality].secondaryWeapon.templates));
				var len = subpersonalities[personality].primaryWeapon.weapons.length - 1;

				if(isDesignable(subpersonalities[personality].primaryWeapon.weapons[len].stat)) {
					if(!found && !turnOffCyborgs && isDefined(cyborgSecondary[0]))
						found = pursueResearch(lab, cyborgSecondary);
					if(!found)
						found = evalResearch(lab, secondaryWeaponExtra);
					if(!found)
						found = evalResearch(lab, secondaryWeaponTech);
				}
			}

			// Lasers
			if(!found && !turnOffCyborgs)
				found = pursueResearch(lab, "R-Cyborg-Hvywpn-PulseLsr");
			if(!found)
				found = evalResearch(lab, laserTech);
			if(!found)
				found = evalResearch(lab, laserExtra);
			if(!found)
				found = pursueResearch(lab, "R-Defense-AA-Laser");

			//Very likely going to be done with research by now.
			if(!found && componentAvailable("Body14SUP") && isDesignable("EMP-Cannon") && isStructureAvailable(structures.extras[2])) {
				researchComplete = true;
			}
		}
	}
}
