
//Choose the personality as described in the global subpersonalities.
//When called from chat it will switch to that one directly.
function choosePersonality(chatEvent) {
	var person = "";
	var len = 4;

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

	//If outnumbered (or high tech level), go for cannons and rockets.
	if ((MAP_OIL_LEVEL === "MEDIUM") || ((ALLY_COUNT !== 0) && (ALLY_COUNT < ENEMY_COUNT)) || (turnOffMG === true)) {
		if(random(2)) { choice = ADAPT_PERSONALITIES[2]; }
		else { choice = ADAPT_PERSONALITIES[3]; }
	}
	else if((MAP_OIL_LEVEL === "LOW") || (ALLY_COUNT === 0)) {
		if(random(2)) { choice = ADAPT_PERSONALITIES[0]; }
		else { choice = ADAPT_PERSONALITIES[1]; }
	}
	else {
		choice = ADAPT_PERSONALITIES[3];
	}

	return choice;
}
