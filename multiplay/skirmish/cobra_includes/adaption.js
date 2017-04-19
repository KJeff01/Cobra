
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

//Choose personality based on map oil/ally count. Called from eventStartLevel().
function adaptToMap() {
	var choice = "";
	const ENEMY_COUNT = playerAlliance(false).length;
	const ALLY_COUNT = playerAlliance(true).length;
	const MAP_OIL_LEVEL = mapOilLevel();

	if(MAP_OIL_LEVEL === "LOW" || (enumStruct(me).length <= 1)) {
		choice = ADAPT_PERSONALITIES[random(2)]; // AM, AR.
	}
	else if ((MAP_OIL_LEVEL === "MEDIUM") || ((ALLY_COUNT !== 0) && (ALLY_COUNT < ENEMY_COUNT))) {
		choice = ADAPT_PERSONALITIES[random(3) + 1]; //AR, AB, AC.
	}
	else {
		choice = ADAPT_PERSONALITIES[random(2) + 2]; //AB, AC.
	}

	return choice;
}
