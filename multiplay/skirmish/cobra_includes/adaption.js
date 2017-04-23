
//Only use cyborgs if we have enough power.
/*
function useCyborgs() {
	if(forceHover && (getRealPower() <= -500)) {
		turnOffCyborgs = true;
	}
	else {
		turnOffCyborgs = false;
	}
}
*/

//If starting with a low tech level, then disable Machine-guns when the
//personality can design its primary weapon.
function switchOffMG() {
	if(personality === "AM") {
		removeTimer("switchOffMG");
		return;
	}

	if(isDesignable(subpersonalities[personality]["primaryWeapon"].weapons[0].stat)) {
		turnOffMG = true;
		removeTimer("switchOffMG");
	}
}

//Choose the personality as described in the global subpersonalities.
//When called from chat it will switch to that one directly.
function choosePersonality(chatEvent) {
	if(!isDefined(chatEvent)) {
		return adaptToMap();
	}
	else {
		personality = chatEvent;
		initializeResearchLists();
		sendChatMessage("Using personality: " + personality, ALLIES);
	}
}

//Choose personality based on map oil/ally count or technology. Called from eventStartLevel().
//isDesignable("Howitzer03-Rot") checks if it a T3 match and allows personality AL to be used (must have bases).
function adaptToMap() {
	var choice = "";
	const ENEMY_COUNT = playerAlliance(false).length;
	const ALLY_COUNT = playerAlliance(true).length;
	const MAP_OIL_LEVEL = mapOilLevel();
	const T3_MATCH = isDesignable("Howitzer03-Rot");

	if(!T3_MATCH && ((MAP_OIL_LEVEL === "LOW") || (enumStruct(me).length <= 1))) {
		choice = ADAPT_PERSONALITIES[random(2)]; // AM, AR.
	}
	else if ((MAP_OIL_LEVEL === "MEDIUM") || ((ALLY_COUNT !== 0) && (ALLY_COUNT < ENEMY_COUNT))) {
		var offset = (T3_MATCH && (enumStruct(me).length >= 1)) ? 4 : 3;
		choice = ADAPT_PERSONALITIES[random(offset) + 1]; //AR, AB, AC, AL.
	}
	else {
		var offset = (T3_MATCH && (enumStruct(me).length >= 1)) ? 3 : 2;
		choice = ADAPT_PERSONALITIES[random(offset) + 2]; //AB, AC, AL.
	}

	return choice;
}
