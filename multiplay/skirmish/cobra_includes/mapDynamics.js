
//Need to search for scavenger player number. Keep undefined if there are no scavengers.
function getScavengerNumber() {
	var scavNumber;

	for(var x = maxPlayers; x < 11; ++x) {
		if(enumStruct(x).length > 0) {
			scavNumber = x;
			break;
		}
	}

	return scavNumber;
}

//Figure out if we are on a hover map. This is determined by checking if a
//ground only propulsion fails to reach a target (checking if it is a vtol only player
//or map spotter pits) and doing similar checks for hover propulsion.
//Furthermore it can discover if it is sharing land with an enemy and disable/enable
//unit production depending on the case until it reaches hover propulsion.
function checkIfSeaMap() {
	var hoverMap = false;
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
				hoverMap = true; //And thus forceHover = true
				break;
			}
		}
	}

	//Determine if we are sharing land on a hover map with an enemy that can reach us via non-hover propulsion.
	if(hoverMap === true) {
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

	return hoverMap;
}

//If played on the team that won, then break alliance with everybody and try to conquer them.
//Completely pointless feature, but makes everything a bit more fun.
//chat: 'FFA'.
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
			if(isDefined(getScavengerNumber()) && allianceExistsBetween(getScavengerNumber(), me))
				setAlliance(getScavengerNumber(), me, false);

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

	if(personality === "AL") {
		return true;
	}

	for(var i = 0; i < subpersonalities[personality]["primaryWeapon"].weapons.length; ++i) {
		if(isDesignable(subpersonalities[personality]["primaryWeapon"].weapons[i].stat)) {
			return true;
		}
	}

	return false;
}

/*
function getDrumsAndArtifacts() {
	var objs = enumFeature(-1, OilDrum).concat(enumFeature(-1, Crate));
}
*/

//All derricks and all oil resources to find the map total.
function countAllResources() {
	var resources = enumFeature(-1, oilResources);
	for(var i = 0; i < maxPlayers; ++i) {
		var res = enumStruct(i, structures.derricks)
		for(var c = 0; c < res.length; ++c)
			resources.push(res[c]);
	}
	if(isDefined(getScavengerNumber())) {
		var res = enumStruct(getScavengerNumber(), structures.derricks);
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
