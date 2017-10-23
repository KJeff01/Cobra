//If starting with a low tech level, then disable Machine-guns when the
//personality can design its last primary weapon.
function switchOffMG()
{
	if (turnOffMG || (returnPrimaryAlias() === "mg"))
	{
		return;
	}

	if (componentAvailable("Body5REC"))
	{
		turnOffMG = true;
		//removeThisTimer("switchOffMG");
	}
}


//Choose the personality as described in the global SUB_PERSONALITIES.
//When called from chat it will switch to that one directly.
function choosePersonality(chatEvent)
{
	if (!isDefined(chatEvent))
	{
		personality = adaptToMap();
	}
	else
	{
		personality = chatEvent;
		sendChatMessage("Using personality: " + personality, ALLIES);
	}

	initializeResearchLists();
}

//Tell us what our personality is.
function myPersonality()
{
	return personality;
}

//Choose personality based on map oil/ally count or technology. Called from eventStartLevel().
//isDesignable("Howitzer03-Rot") checks if it a T3 match and allows personality AL to be used (must have bases).
function adaptToMap() {
	var choice = "";
	const ALLY_COUNT = playerAlliance(true).length - 1;
	const MAP_OIL_LEVEL = mapOilLevel();
	const T3_MATCH = isDesignable("Howitzer03-Rot");
	const ADAPT_PERSONALITIES = ["AM", "AR", "AB", "AC", "AL"];

	if (!T3_MATCH && (((maxPlayers - 1) === 1) || ((MAP_OIL_LEVEL === "LOW") && !ALLY_COUNT)))
	{
		choice = ADAPT_PERSONALITIES[random(3)]; // AM, AR, AB.
	}
	else if ((MAP_OIL_LEVEL === "MEDIUM") || ALLY_COUNT)
	{
		var offset = (T3_MATCH && (baseType !== CAMP_CLEAN)) ? 4 : 3;
		choice = ADAPT_PERSONALITIES[random(offset) + 1]; // AR, AB, AC, AL.
	}
	else
	{
		var offset = (T3_MATCH && (baseType !== CAMP_CLEAN)) ? 2 : 1;
		choice = ADAPT_PERSONALITIES[random(offset) + 2]; // AC, AL.
	}

	return choice;
}
