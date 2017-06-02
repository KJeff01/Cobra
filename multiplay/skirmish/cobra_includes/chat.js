
if(DEVELOPMENT) {
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
			var cacheDroids = droids.length;

			if(cacheDroids > 2) {
				donateObject(droids[random(cacheDroids)], from);
			}
		}
		else if((message === "need power") && allianceExistsBetween(from, to)) {
			if(playerPower(me) > 50) {
				donatePower(playerPower(me) / 2, from);
			}
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
}
else {
	function sendChatMessage(e, t) {
		isDefined(e) && (isDefined(t) || (t = ALLIES), lastMsg !== e && (lastMsg = e, chat(t, e)))
	}

	function eventChat(e, t, n) {
		if (t === me && ("AC" === n || "AR" === n || "AB" === n || "AM" === n || "AL" === n ? allianceExistsBetween(e, t) && personality !== n && choosePersonality(n) : "toggle cyborg" === n && allianceExistsBetween(e, t) ? turnOffCyborgs = !turnOffCyborgs : "toggle mg" === n && allianceExistsBetween(e, t) ? turnOffMG = !turnOffMG : "stats" === n && allianceExistsBetween(e, t) ? getMostHarmfulPlayer("chatEvent") : "FFA" === n && allianceExistsBetween(e, t) ? freeForAll() : "toggle hover" === n && allianceExistsBetween(e, t) ? forceHover = !forceHover : "oil level" === n && allianceExistsBetween(e, t) && sendChatMessage("Map oil count is: " + mapOilLevel(), ALLIES), t !== e)) {
			if ("need truck" === n && allianceExistsBetween(e, t)) {
				var a = enumDroid(me, DROID_CONSTRUCT),
				s = a.length;
				s > 2 && donateObject(a[random(s)], e)
			} else if ("need power" === n && allianceExistsBetween(e, t)) playerPower(me) > 50 && donatePower(playerPower(me) / 2, e);
			else if ("need tank" === n && allianceExistsBetween(e, t)) donateFromGroup(enumGroup(attackGroup), e);
			else if ("need cyborg" === n && allianceExistsBetween(e, t)) donateFromGroup(enumGroup(cyborgGroup), e);
			else if ("need vtol" === n && allianceExistsBetween(e, t)) donateFromGroup(enumGroup(vtolGroup), e);
			else if (("help me!" === n || "help me!!" === n) && allianceExistsBetween(e, t)) {
				var r = enumStruct(e, structures.hqs);
				1 === r.length ? (sendChatMessage("Sending units to your command center!", e), eventBeacon(r.x, r.y, e, me, "")) : sendChatMessage("Sorry, no can do.", e)
			}
			var i = n.slice(0, -1);
			if ("attack" === i) {
				var l = n.slice(-1);
				allianceExistsBetween(l, me) || l === me || ((!isDefined(getScavengerNumber()) || isDefined(getScavengerNumber()) && l !== getScavengerNumber()) && grudgeCount[l] < MAX_GRUDGE && (grudgeCount[l] = grudgeCount[l] + 15), attackStuff(l))
			} else if ("oil" === i) {
				var l = n.slice(-1);
				allianceExistsBetween(l, me) || l === me || ((!isDefined(getScavengerNumber()) || isDefined(getScavengerNumber()) && l !== getScavengerNumber()) && grudgeCount[l] < MAX_GRUDGE && (grudgeCount[l] = grudgeCount[l] + 15), chatAttackOil(l))
			}
		}
	}
}
