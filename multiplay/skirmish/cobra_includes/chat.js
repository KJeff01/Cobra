
//A way to control chat messages sent to Cobra AI.
function sendChatMessage(msg, receiver) {
	if(!isDefined(msg)) {
		return;
	}
	if(!isDefined(receiver)) {
		receiver = ALLIES;
	}

	if(lastMsg !== msg) {
		lastMsg = msg;
		chat(receiver, msg);
	}
}

function eventChat(from, to, message) {
	if(to !== me) {
		return;
	}

	//Here are all chat messages that can be executed by itself.
	if((message === "AC") || (message === "AR") || (message === "AB") || (message === "AM") || (message === "AL")) {
		if(allianceExistsBetween(from, to) && (personality !== message)) {
			choosePersonality(message);
		}
	}
	else if((message === "toggle cyborg") && allianceExistsBetween(from, to)) {
		turnOffCyborgs = !turnOffCyborgs;
	}
	else if((message === "toggle mg") && allianceExistsBetween(from, to)) {
		turnOffMG = !turnOffMG;
	}
	else if((message === "stats") && allianceExistsBetween(from, to)) {
		getMostHarmfulPlayer("chatEvent");
	}
	else if((message === "FFA") && allianceExistsBetween(from, to)) {
		freeForAll();
	}
	else if((message === "toggle hover") && allianceExistsBetween(from, to)) {
		forceHover = !forceHover;
	}
	else if((message === "oil level") && allianceExistsBetween(from, to)) {
		sendChatMessage("Map oil count is: " + mapOilLevel(), ALLIES);
	}

	//Do not execute these statements if from is me.
	if(to === from) {
		return;
	}


	if((message === "need truck") && allianceExistsBetween(from, to)) {
		var droids = enumDroid(me, DROID_CONSTRUCT);
		if(droids.length <= 2) { return; }
		donateObject(droids[random(droids.length)], from);
	}
	else if((message === "need power") && allianceExistsBetween(from, to)) {
		if(playerPower(me) > 50) { donatePower(playerPower(me) / 2, from); }
	}
	else if((message === "need tank") && allianceExistsBetween(from, to)) {
		donateFromGroup(enumGroup(attackGroup), from);
	}
	else if((message === "need cyborg") && allianceExistsBetween(from, to)) {
		donateFromGroup(enumGroup(cyborgGroup), from);
	}
	else if((message === "need vtol") && allianceExistsBetween(from, to)) {
		donateFromGroup(enumGroup(vtolGroup), from);
	}
	else if(((message === "help me!") || (message === "help me!!")) && allianceExistsBetween(from, to)) {
		var hq = enumStruct(from, structures.hqs);
		if(hq.length === 1) {
			sendChatMessage("Sending units to your command center!", from);
			eventBeacon(hq.x, hq.y, from, me, "");
		}
		else {
			sendChatMessage("Sorry, no can do.", from);
		}
	}

	var tmp = message.slice(0, -1);
	if(tmp === "attack") {
		var num = message.slice(-1);
		if(!allianceExistsBetween(num, me) && (num !== me)) {
			if(!isDefined(getScavengerNumber()) || (isDefined(getScavengerNumber()) && (num !== getScavengerNumber()))) {
				if(grudgeCount[num] < MAX_GRUDGE) {
					grudgeCount[num] = grudgeCount[num] + 15;
				}
			}
			attackStuff(num);
		}
	}
	else if(tmp === "oil") {
		var num = message.slice(-1);
		if(!allianceExistsBetween(num, me) && (num !== me)) {
			if(!isDefined(getScavengerNumber()) || (isDefined(getScavengerNumber()) && (num !== getScavengerNumber()))) {
				if(grudgeCount[num] < MAX_GRUDGE) {
					grudgeCount[num] = grudgeCount[num] + 15;
				}
			}
			chatAttackOil(num);
		}
	}

}
