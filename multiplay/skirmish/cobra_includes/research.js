
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
	"R-Wpn-MG-Damage02",
	"R-Struc-PowerModuleMk1",
	"R-Struc-Research-Upgrade09",
	"R-Struc-Power-Upgrade03a",
	"R-Vehicle-Prop-Halftracks",
	"R-Vehicle-Body05",
];

const SYSTEM_UPGRADES = [
	"R-Struc-RprFac-Upgrade01",
	"R-Struc-Factory-Upgrade09",
	"R-Vehicle-Prop-Hover",
	"R-Sys-MobileRepairTurretHvy",
	"R-Sys-Autorepair-General",
	"R-Struc-RprFac-Upgrade06",
];

const FLAMER = [
	"R-Wpn-Flame2",
	"R-Wpn-Flamer-ROF03",
	"R-Wpn-Flamer-Damage09",
];

const SENSOR_TECH = [
	"R-Sys-Sensor-Upgrade03",
	"R-Sys-Sensor-WS",
	"R-Sys-RadarDetector01",
];

const DEFENSE_UPGRADES = [
	"R-Struc-Materials09",
	"R-Sys-Resistance-Circuits",
	"R-Defense-WallUpgrade12",
	"R-Wpn-LasSat",
];

const BODY_RESEARCH = [
	"R-Vehicle-Body11",
//	"R-Vehicle-Body12",
//	"R-Vehicle-Body09",
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
	"R-Cyborg-Armor-Heat03",
	"R-Wpn-Bomb04",
	"R-Wpn-Bomb-Accuracy02",
	"R-Struc-VTOLPad-Upgrade04",
	"R-Defense-WallUpgrade06",
	"R-Sys-ECM-Upgrade02",
];

const LATE_EARLY_GAME_TECH = [
	"R-Vehicle-Body11",
	"R-Vehicle-Body04",
	"R-Vehicle-Prop-Tracks",
	"R-Vehicle-Prop-VTOL",
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
		for(var i = 0, a = list.length; i < a; ++i) {
			found = pursueResearch(lab, list[i]);
			if(found) {
				break;
			}
		}
	}

	return found;
}


function eventResearched() {
	const MIN_POWER = -130;
	if((getRealPower() < MIN_POWER) || !isDefined(techlist) || !isDefined(turnOffMG) || !isDefined(turnOffCyborgs)) {
		return;
	}

	var lablist = enumStruct(me, structures.labs).filter(function(lb) {
		return ((lb.status === BUILT) && structureIdle(lb));
	});

	for (var i = 0, a = lablist.length; i < a; ++i) {
		var lab = lablist[i];
		var found = false;

		if(getRealPower() > MIN_POWER) {
			found = pursueResearch(lab, ESSENTIALS);

			//Early research.
			if(!found)
				found = evalResearch(lab, techlist);

			if(!found)
				found = evalResearch(lab, SYSTEM_UPGRADES);
			if(!found && !random(4))
				found = evalResearch(lab, TANK_ARMOR);

			if(!turnOffMG || (returnPrimaryAlias() === "mg")) {
				if(!found)
					found = pursueResearch(lab, mgWeaponTech);
				if(!found)
					found = pursueResearch(lab, "R-Wpn-MG-Damage08");
			}

			if(!found)
				found = evalResearch(lab, LATE_EARLY_GAME_TECH);

			if(random(2)) {
				if(!found && !turnOffCyborgs)
					found = evalResearch(lab, cyborgWeaps);
				if(!found)
					found = evalResearch(lab, weaponTech);
				if(!found)
					found = evalResearch(lab, extraTech);
				if(!found && random(2))
					found = evalResearch(lab, defenseTech);
			}

			if(!found && (returnPrimaryAlias() === "fl"))
				found = evalResearch(lab, FLAMER);
			if(!found)
				found = evalResearch(lab, artilleryTech);
			if(!found)
				found = evalResearch(lab, SENSOR_TECH);

			if(random(3)) {
				if(!found)
					found = evalResearch(lab, artillExtra);

				if(!random(3) && (gameTime > 1200000)) {
					if(!found)
						found = pursueResearch(lab, "R-Wpn-PlasmaCannon");
					if(!found && componentAvailable("Laser4-PlasmaCannon"))
						found = evalResearch(lab, extremeLaserTech);
				}
			}

			if(!found)
				found = evalResearch(lab, MID_GAME_TECH);

			//Use default AA until stormbringer.
			if(!isStructureAvailable("P0-AASite-Laser") && countEnemyVTOL()) {
				if(!found)
					found = evalResearch(lab, antiAirTech);
				if(!found)
					found = evalResearch(lab, antiAirExtras);
			}

			if(!found)
				found = evalResearch(lab, BODY_RESEARCH);

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

			if(!found && !turnOffCyborgs)
				found = evalResearch(lab, CYBORG_ARMOR);
			if(!found)
				found = evalResearch(lab, VTOL_RES);

			if(!found)
				found = evalResearch(lab, DEFENSE_UPGRADES);

				if(random(4)) {
					if(!found && !turnOffCyborgs)
						found = pursueResearch(lab, "R-Cyborg-Hvywpn-PulseLsr");
					if(!found && countEnemyVTOL())
						found = pursueResearch(lab, "R-Defense-AA-Laser");
					if(!found)
						found = evalResearch(lab, laserTech);
					if(!found)
						found = evalResearch(lab, laserExtra);
				}

			if(!found)
				found = evalResearch(lab, FLAMER);

			//Very likely going to be done with research by now.
			if(!found && componentAvailable("Body14SUP") && isDesignable("EMP-Cannon") && isStructureAvailable(structures.extras[2])) {
				researchComplete = true;
			}
		}
	}
}
