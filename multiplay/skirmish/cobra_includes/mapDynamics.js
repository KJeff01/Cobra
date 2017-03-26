
//Initialization of research lists when eventStartLevel is triggered.
//Call this again when manually changing a personality.
function initializeResearchLists() {
	techlist = [];
	weaponTech = [];
	mgWeaponTech = [];
	laserTech = [];
	artilleryTech = [];
	artillExtra = [];
	laserExtra = [];
	extraTech = [];
	vtolWeapons = [];
	vtolExtras = [];
	cyborgWeaps = [];
	antiAirTech = [];
	antiAirExtras = [];
	extremeLaserTech = [];

	for(var x = 0; x < weaponStats.bombs.vtols.length; ++x)
		vtolWeapons.push(weaponStats.bombs.vtols[x].res);
	for(var x = 0; x < weaponStats.bombs.extras.length; ++x)
		vtolExtras.push(weaponStats.bombs.extras[x]);
	for(var x = 0; x < weaponStats.AA.defenses.length - 1; ++x) //Do not research the whirlwind hardpoint
		antiAirTech.push(weaponStats.AA.defenses[x].res);
	for(var x = 0; x < weaponStats.AA.extras.length; ++x)
		antiAirExtras.push(weaponStats.AA.extras[x]);

	for(var x = 0; x < weaponStats.machineguns.weapons.length; ++x)
		mgWeaponTech.push(weaponStats.machineguns.weapons[x].res);

	for(var x = 0; x < weaponStats.AS.extras.length; ++x)
		extremeLaserTech.push(weaponStats.AS.extras[x]);

	for(var x = 0; x < weaponStats.lasers.weapons.length; ++x)
		laserTech.push(weaponStats.lasers.weapons[x].res);
	for(var x = 0; x < weaponStats.lasers.weapons.length; ++x)
		laserExtra.push(weaponStats.lasers.extras[x]);


	techlist = subpersonalities[personality]["res"];
	for(var x = 0; x < subpersonalities[personality]["primaryWeapon"].weapons.length;  ++x)
		weaponTech.push(subpersonalities[personality]["primaryWeapon"].weapons[x].res);
	for(var x = 0; x < subpersonalities[personality]["artillery"].weapons.length; ++x)
		artilleryTech.push(subpersonalities[personality]["artillery"].weapons[x].res);
	for(var x = 0; x < subpersonalities[personality]["primaryWeapon"].extras.length; ++x)
		extraTech.push(subpersonalities[personality]["primaryWeapon"].extras[x]);
	for(var x = 0; x < subpersonalities[personality]["artillery"].extras.length; ++x)
		artillExtra.push(subpersonalities[personality]["artillery"].extras[x]);
	for(var x = 0; x < subpersonalities[personality]["primaryWeapon"].templates.length; ++x)
		cyborgWeaps.push(subpersonalities[personality]["primaryWeapon"].templates[x].res);


	for(var x = 0; x < weaponStats.lasers.templates.length; ++x)
		cyborgWeaps.push(weaponStats.lasers.templates[x].res);
}

//Cobra's behavior will change dramatically if it is on a hover map. It will be more aggressive
//than usual and have stronger units and research times.
function checkIfSeaMap() {
	turnOffCyborgs = false;
	seaMapWithLandEnemy = false;

	for(var i = 0; i < maxPlayers; ++i) {
		if(!propulsionCanReach("wheeled01", startPositions[me].x, startPositions[me].y, startPositions[i].x, startPositions[i].y)) {

			//Check if it is a map 'spotter' pit
			//Cyborgs will turn off in divided maps with a physical barrier still
			var temp = 0;
			for(var t = 0; t < maxPlayers; ++t) {
				if(!propulsionCanReach("hover01", startPositions[i].x, startPositions[i].y, startPositions[t].x, startPositions[t].y))
					temp = temp + 1;
			}

			if(temp !== maxPlayers - 1) {
				turnOffCyborgs = true; //And thus forceHover = true
				break;
			}
		}
	}

	//Determine if we are sharing land on a hover map with an enemy that can reach us via non-hover propulsion.
	if(turnOffCyborgs === true) {
		for(var i = 0; i < maxPlayers; ++i) {
			if(propulsionCanReach("wheeled01", startPositions[me].x, startPositions[me].y, startPositions[i].x, startPositions[i].y)
			&& (i !== me) && !allianceExistsBetween(i, me)) {
				//Check to see if it is a closed player slot
				if(enumDroid(i).length > 0) {
					seaMapWithLandEnemy = true;
					break;
				}
			}
			if(seaMapWithLandEnemy === true)
				break;
		}
	}

	return turnOffCyborgs;
}

//If played on the team that won, then break alliance with everybody and try to conquer them.
//Completely pointless feature, but makes everything a bit more fun.
function freeForAll() {
	var won = true;

	for (var p = 0; p < maxPlayers; ++p) {
		if (p != me && !allianceExistsBetween(p, me)) {
			var factories = countStruct("A0LightFactory", p) + countStruct("A0CyborgFactory", p);
			var droids = countDroid(DROID_ANY, p);
			if (droids > 0 || factories > 0) {
				won = false;
				break;
			}
		}
	}

	if(won === true) {
		var friends = playerAlliance(true);
		if(friends.length > 0) {
			if(isDefined(scavengerNumber) && allianceExistsBetween(scavengerNumber, me))
				setAlliance(scavengerNumber, me, false);

			for(var i = 0; i < friends.length; ++i) {
				chat(friends[i], "FREE FOR ALL!");
				setAlliance(friends[i], me, false);
			}
		}
	}
}


//Turn off Machine-guns on T2 and T3
//Very cheap analysis done here.
function CheckStartingBases() {
	for(var i = 0; i < subpersonalities[personality]["primaryWeapon"].weapons.length; ++i) {
		if(isDesignable(subpersonalities[personality]["primaryWeapon"].weapons[i].stat)) { return true; }
	}

	return false;
}

/*
function getDrumsAndArtifacts() {
	var objs = enumFeature(-1, OilDrum).concat(enumFeature(-1, Crate));
}
*/

//All derricks and all oil resources to find the map total. --unused.
function countAllResources() {
	var resources = enumFeature(-1, oilResources);
	for(var i = 0; i < maxPlayers; ++i) {
		var res = enumStruct(i, structures.derricks)
		for(var c = 0; c < res.length; ++c)
			resources.push(res[c]);
	}
	if(isDefined(scavengerNumber)) {
		var res = enumStruct(scavengerNumber, structures.derricks);
		for(var c = 0; c < res.length; ++c)
			resources.push(res[c]);
	}

	return resources.length;
}

//Is the map a low/medium/high power level. Returns a string of LOW/MEDIUM/HIGH.
function mapOilLevel() {
	var perPlayer = countAllResources() / maxPlayers;
	var str = "";

	if(perPlayer <= 8) { str = "LOW"; }
	else if((perPlayer > 8) && (perPlayer <= 16)) { str = "MEDIUM"; }
	else { str = "HIGH"; }

	return str;
}
