
// -- Important functions
function random(max) {
	return (max <= 0) ? 0 : Math.floor(Math.random() * max)
}

// Returns true if something is defined
function isDefined(data) {
	return typeof(data) !== "undefined";
}

function rangeStep(obj, visibility) {
	const step = 10000;
	var target;
	
	for(var i = 0; i < 30000; i += step) {	
		var temp = enumRange(obj.x, obj.y, i, ENEMIES, visibility);
		if(temp.length > 0) {
			return temp[0];
		}
	}
	
	return target;
}

//Taken from nullbot v3.06
function vtolArmed(obj, percent) {
	if (obj.type != DROID)
		return;
	
	if (!isVTOL(obj))
		return false;
	
	for (var i = 0; i < obj.weapons.length; ++i)
		if (obj.weapons[i].armed >= percent)
			return true;
		
	return false;
}

//Taken from nullbot v3.06
function vtolReady(droid) {
	if (droid.order == DORDER_ATTACK)
		return false;
	
	if (vtolArmed(droid, 1))
		return true;
	
	if (droid.order != DORDER_REARM) {
		orderDroid(droid, DORDER_REARM);
	}
	
	return false;
}

//Ally is false for checking for enemy players
//Ally is true for allies.
function playerAlliance(ally) {
	if(!isDefined(ally))
		ally = false;
	var players = [];
	
	for(var i = 0; i < maxPlayers; ++i) {
		if(!ally) {
			if(!allianceExistsBetween(i, me) && (i != me)) {
				players.push(i);
			}
		}
		else {
			if(allianceExistsBetween(i, me) && (i != me)) {
				players.push(i);
			}
		}
	}
	return players;
}

//Change stuff depending on difficulty.
function diffPerks() {	
	switch(difficulty) {
		case EASY:
			break;
		case MEDIUM:
			break;
		case HARD:
			if(!isStructureAvailable("A0PowMod1"))
				completeRequiredResearch("R-Struc-PowerModuleMk1");
			makeComponentAvailable("PlasmaHeavy", me);
			makeComponentAvailable("MortarEMP", me);
			break;
		case INSANE:
			if(!isStructureAvailable("A0PowMod1"))
				completeRequiredResearch("R-Struc-PowerModuleMk1");
			nexusWaveOn = true;
			makeComponentAvailable("PlasmaHeavy", me);
			makeComponentAvailable("MortarEMP", me);
			break;
	}
}

function log(message) {
	dump(gameTime + " : " + message);
}

function logObj(obj, message) {
	dump(gameTime + " [" + obj.name + " id=" + obj.id + "] > " + message);
}

function distanceToBase(obj1, obj2) {
	var dist1 = distBetweenTwoPoints(startPositions[me].x, startPositions[me].y, obj1.x, obj1.y);
	var dist2 = distBetweenTwoPoints(startPositions[me].x, startPositions[me].y, obj2.x, obj2.y);
	return (dist1 - dist2);
}

function isDesignable(item, body, prop) {
	if(!isDefined(item))
		return false;
	if(!isDefined(body))
		body = "Body1REC";
	if(!isDefined(prop))
		prop = "wheeled01";
	
	var virDroid = makeTemplate(me, "Virtual Droid", body, prop, null, null, item, item);
	return (virDroid != null) ? true : false;
}

function checkLowPower(pow) {
	if(!isDefined(pow))
		pow = 25;
	
	if(playerPower(me) < pow) {
		if((playerAlliance(true).length > 0) && (lastMsg != "need power")) {
			lastMsg = "need power";
			chat(ALLIES, lastMsg);
		}
		return true;
	}
	
	return false;
}

//Need to search for scavenger player number. Keep undefined if there are no scavengers.
function checkForScavs() {
	for(var x = maxPlayers; x < 11; ++x) {
		if(enumStruct(x).length > 0) {
			scavengerNumber = x;
			break;
		}
	}
}


