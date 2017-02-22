
//One time initialization of the research lists when eventStartLevel is triggered.
//Need to cut down the bloat here
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
	
	if(personality === 1) {
		techlist = subpersonalities["AC"]["res"];
		for(var x = 0; x < weaponStats.cannons.weapons.length;  ++x)
			weaponTech.push(weaponStats.cannons.weapons[x].res);
		for(var x = 0; x < weaponStats.mortars.weapons.length; ++x)
			artilleryTech.push(weaponStats.mortars.weapons[x].res);
		for(var x = 0; x < weaponStats.cannons.extras.length; ++x)
			extraTech.push(weaponStats.cannons.extras[x]);
		for(var x = 0; x < weaponStats.mortars.extras.length; ++x)
			artillExtra.push(weaponStats.mortars.extras[x]);
		for(var x = 0; x < weaponStats.cannons.templates.length; ++x)
			cyborgWeaps.push(weaponStats.cannons.templates[x].res);
	}
	else if(personality === 2) {
		techlist = subpersonalities["AR"]["res"];
		for(var y = 0; y < weaponStats.flamers.weapons.length; ++y)
			weaponTech.push(weaponStats.flamers.weapons[y].res);
		for(var y = 0; y < weaponStats.mortars.weapons.length; ++y)
			artilleryTech.push(weaponStats.mortars.weapons[y].res);
		for(var y = 0; y < weaponStats.flamers.extras.length; ++y)
			extraTech.push(weaponStats.flamers.extras[y]);
		for(var y = 0; y < weaponStats.mortars.extras.length; ++y)
			artillExtra.push(weaponStats.mortars.extras[y]);
	}
	else {
		techlist = subpersonalities["AB"]["res"];
		for(var y = 0; y < weaponStats.rockets_AT.weapons.length; ++y)
			weaponTech.push(weaponStats.rockets_AT.weapons[y].res);
		for(var y = 0; y < weaponStats.rockets_Arty.weapons.length; ++y)
			artilleryTech.push(weaponStats.rockets_Arty.weapons[y].res);
		for(var y = 0; y < weaponStats.rockets_AT.extras.length; ++y)
			extraTech.push(weaponStats.rockets_AT.extras[y]);
		for(var y = 0; y < weaponStats.rockets_Arty.extras.length; ++y)
			artillExtra.push(weaponStats.rockets_Arty.extras[y]);
		for(var x = 0; x < weaponStats.rockets_AT.templates.length; ++x)
			cyborgWeaps.push(weaponStats.rockets_AT.templates[x].res);
	}
	
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

//If playing teams, then break alliance with everybody and try to conquer them.
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
			
			lastMsg = "FREE FOR ALL!";
			for(var i = 0; i < friends.length; ++i) {
				chat(friends[i], lastMsg);
				setAlliance(friends[i], me, false);
			}
		}
		
		removeTimer("freeForAll");
	}
}

//Turn off Machine-guns on T2 and T3
//Very cheap analysis done here.
function CheckStartingBases() {
	if(personality === 1) {
		for(var y = 0; y < weaponStats.cannons.weapons.length; ++y) {
			if(componentAvailable(weaponStats.cannons.weapons[y].stat)) { return true; }
		}
	}
	else if(personality === 2) {
		for(var y = 0; y < weaponStats.flamers.weapons.length; ++y) {
			if(componentAvailable(weaponStats.flamers.weapons[y].stat)) { return true; }
		}
	}
	else if(personality === 3) {
		for(var y = 0; y < weaponStats.rockets_AT.weapons.length; ++y) {
			if(componentAvailable(weaponStats.rockets_AT.weapons[y].stat)) { return true; }
		}
	}
	
	return false;
}

/*
function getDrumsAndArtifacts() {
	var objs = enumFeature(-1, OilDrum).concat(enumFeature(-1, Crate));
}
*/

