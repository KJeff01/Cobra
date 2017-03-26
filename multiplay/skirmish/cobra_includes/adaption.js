//If power levels are low, then go for a more economic friendly personality.
function adaptToPowerLevels() {
	var choice = "";
	const POWER = getRealPower();

	if(POWER < -600) {
		if(random(2)) { choice = ADAPT_PERSONALITIES[0]; }
		else { choice = ADAPT_PERSONALITIES[1]; }
	}
	else {
		if(random(2)) { choice = ADAPT_PERSONALITIES[2]; }
		else { choice = ADAPT_PERSONALITIES[3]; }
	}

	choosePersonality(choice);
}

//Choose personality based on map oil count. Called from eventStartLevel().
function adaptToMap() {
	var choice = "";
	const MAP_OIL_LEVEL = mapOilLevel();

	if(MAP_OIL_LEVEL === "LOW") {
		if(random(2)) { choice = ADAPT_PERSONALITIES[0]; }
		else { choice = ADAPT_PERSONALITIES[1]; }
	}
	else if (MAP_OIL_LEVEL === "MEDIUM") {
		if(random(2)) { choice = ADAPT_PERSONALITIES[2]; }
		else { choice = ADAPT_PERSONALITIES[3]; }
	}
	else {
		choice = ADAPT_PERSONALITIES[3];
	}

	return choice;
}
