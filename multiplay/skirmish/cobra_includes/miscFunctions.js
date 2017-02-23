
// Random number between 0 and max-1.
function random(max) {
	return (max <= 0) ? 0 : Math.floor(Math.random() * max)
}

// Returns true if something is defined
function isDefined(data) {
	return typeof(data) !== "undefined";
}

//Control the amount of objects being put in memory so we do not create a large array of objects.
//Returns enemy objects only.
function rangeStep(obj, visibility) {
	const step = 3000;
	var target;
	
	for(var i = 0; i <= 30000; i += step) {	
		var temp = enumRange(obj.x, obj.y, i, ENEMIES, visibility);
		if(temp.length > 0) {
			return temp[0];
		}
	}
	
	return target;
}

//Taken from nullbot v3.06
//Do the vtol weapon have ammo?
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
//Should the vtol attack when ammo is high enough?
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
	if(!isDefined(ally)) { ally = false; }
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
			//maybe make the worst build order ever.
			break;
		case MEDIUM:
			//Do nothing
			break;
		case HARD:
			if(!isStructureAvailable("A0PowMod1"))
				completeRequiredResearch("R-Struc-PowerModuleMk1");
			makeComponentAvailable("PlasmaHeavy", me);
			makeComponentAvailable("MortarEMP", me);
			break;
		case INSANE:
			//In addition to what Hard does, turn on the NIP.
			if(!isStructureAvailable("A0PowMod1"))
				completeRequiredResearch("R-Struc-PowerModuleMk1");
			nexusWaveOn = true;
			makeComponentAvailable("PlasmaHeavy", me);
			makeComponentAvailable("MortarEMP", me);
			break;
	}
}

//Dump some text.
function log(message) {
	dump(gameTime + " : " + message);
}

//Dump information about an object and some text.
function logObj(obj, message) {
	dump(gameTime + " [" + obj.name + " id=" + obj.id + "] > " + message);
}

//Distance between an object and the Cobra base.
function distanceToBase(obj1, obj2) {
	var dist1 = distBetweenTwoPoints(startPositions[me].x, startPositions[me].y, obj1.x, obj1.y);
	var dist2 = distBetweenTwoPoints(startPositions[me].x, startPositions[me].y, obj2.x, obj2.y);
	return (dist1 - dist2);
}

//See if we can design this droid. Mostly used for checking for new weapons wit the NIP.
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

//See if power levels are low. This is not the total power levels which would be
//playerPower(me) - queuedPower(me)
function checkLowPower(pow) {
	if(!isDefined(pow)) { pow = 25; }
	
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

//Returns all unfinished structures.
function unfinishedStructures() {
	return enumStruct(me).filter(function(struct){ return struct.status != BUILT});
}

//Choose the personality as described in the global subpersonalities.
function choosePersonality() {
	var person = "";
	
	switch(random(subpersonalities.length) + 1) {
		case 1: person = "AC"; break;
		case 2: person = "AR"; break;
		case 3: person = "AB"; break;
		default: person = "AC"; break;
	}
	
	return person;
}

//Randomly choose the best weapon with current technology.
//Defaults to machine-guns when other choices are unavailable (if allowed). May return undefined.
//Also cyborgs will not return the actual stat list with this function. (requires more stuff).
function choosePersonalityWeapon(type) {
	var weaps;
	var weaponList = [];
	if(!isDefined(type)) { type = "TANK"; }
	
	if(type === "TANK") {
		switch(random(5)) {
			case 0: weaps = subpersonalities[personality]["primaryWeapon"]; break;
			case 1: if(turnOffMG === false) { weaps = subpersonalities[personality]["secondaryWeapon"]; } break;
			case 2: weaps = subpersonalities[personality]["artillery"]; break;
			case 3: weaps = subpersonalities[personality]["tertiaryWeapon"]; break;
			case 4: weaps = weaponStats.AS; break;
			default: weaps = subpersonalities[personality]["primaryWeapon"]; break;
		}
		
		for(var i = weaps.weapons.length - 1; i >= 0; --i) {
			weaponList.push(weaps.weapons[i].stat);
		}
		
		//on hard difficulty and above.
		if(componentAvailable("MortarEMP") && componentAvailable("tracked01") && !random(40))
			weaponList = ["MortarEMP"];
		else if(componentAvailable("PlasmaHeavy") && componentAvailable("tracked01") && !random(40))
			weaponList = ["PlasmaHeavy"];
		
		//Try defaulting to machine-guns then.
		if((isDesignable(weaponList, tankBody, tankProp) === false) && (turnOffMG === false)) {
			weaponList = [];
			for(var i = weaponStats.machineguns.weapons.length - 1; i >= 0; --i) {
				weaponList.push(weaponStats.machineguns.weapons[i].stat);
			}
		}
	}
	else if(type === "CYBORG") {
		switch(random(3)) {
			case 0: weaps = subpersonalities[personality]["primaryWeapon"]; break;
			case 1: if(turnOffMG === false) { weaps = subpersonalities[personality]["secondaryWeapon"]; } break;
			case 2: weaps = subpersonalities[personality]["tertiaryWeapon"]; break;
			default: weaps = subpersonalities[personality]["primaryWeapon"]; break;
		}
	}
	else if(type === "VTOL") {
		weaps = weaponStats.bombs;
		for(var i = weaps.vtols.length - 1; i >= 0; --i) {
			weaponList.push(weaps.vtols[i].stat);
		}
	}
	
	return (type === "CYBORG") ? weaps : weaponList;
}

