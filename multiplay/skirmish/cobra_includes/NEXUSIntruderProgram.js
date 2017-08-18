
//Sometimes the required research list has duplicate strings. So lets remove them.
function cleanResearchItem(res, player) {
	var temp = findResearch(res, player).reverse();
	if(!isDefined(temp[0])) {
		return temp;
	}

	return removeDuplicateItems(temp);
}

//for stealing technology
function completeRequiredResearch(item) {
	//log("Searching for required research of item: " + item);

	var reqRes = cleanResearchItem(item, me);
	for(var s = 0, c = reqRes.length; s < c; ++s) {
		//log("	Found: " + reqRes[s].name);
		const NAME = reqRes[s].name;
		enableResearch(NAME, me);
		completeResearch(NAME, me);
	}
}

//Try to determine if the droid has superior defenses.
function analyzeDroidAlloys(droid) {
	const TYPE = (droid.droidType == DROID_CYBORG) ? "cyborg" : "tank";
	const KINETIC = (TYPE === "cyborg") ? "R-Cyborg-Metals0" : "R-Vehicle-Metals0";
	const THERMAL = (TYPE === "cyborg") ? "R-Cyborg-Armor-Heat0" : "R-Vehicle-Armor-Heat0";
	const PLAYER = droid.player;
	var temp;

	for(var t = 0; t < 2; ++t) {
		for(var i = 1; i < 10; ++i) {
			var temp = (t === 0) ? KINETIC : THERMAL;
			var reqRes = cleanResearchItem((temp + i), PLAYER);

			if(isDefined(reqRes[0])) {
				var armorAlloy = temp + i;
				if(findResearch(armorAlloy).length) {
					completeRequiredResearch(armorAlloy);
					break;
				}
			}
		}
	}
}

//Figure out if we can steal some new technology. returns true if a new
//component was found.
function analyzeComponent(statList, component, droid) {
	var statHolder;
	var foundComponent = false;

	if(isDefined(component) && !componentAvailable(component)) {
		for(var x = 0, s = statList.length; x < s; ++x) {
			if(droid.droidType === DROID_CYBORG) {
				statHolder = statList[x].weapons[0];
			}
			else {
				statHolder = statList[x].stat;
			}

			if(statHolder === component) {
				completeRequiredResearch(statList[x].res);
				//logObj(droid, "Assimilated player " + droid.player +"'s technology -> " + component + ".");
				makeComponentAvailable(component, me);
				foundComponent = true;
				break;
			}
		}
	}

	return foundComponent;
}

//Check an enemy droid and steal any new components not researched.
function analyzeDroidComponents(droid) {
	const BODY = droid.body;
	const PROPULSION = droid.propulsion;
	var weapon;

	if(isDefined(droid.weapons[0])) {
		weapon = droid.weapons[0].name;
	}
	//check for Dragon body
	if(isDefined(weapon) && (droid.weapons.length > 0) && isDefined(droid.weapons[1]) && isDesignable(weapon)) {
		weapon = droid.weapons[1].name;
	}

	//steal body technology
	analyzeComponent(bodyStats, BODY, droid);
	//steal propulsion technology
	analyzeComponent(propulsionStats, PROPULSION, droid);


	//steal weapon technology
	if(isDefined(weapon) && !isDesignable(weapon, BODY, PROPULSION)) {
		var breakOut = false;
		for(var weaponList in weaponStats) {
			if(isVTOL(droid)) {
				breakOut = analyzeComponent(weaponStats[weaponList].vtols, weapon, droid);
			}
			else if(droid.droidType == DROID_WEAPON) {
				breakOut = analyzeComponent(weaponStats[weaponList].weapons, weapon, droid);
			}
			else if(droid.droidType == DROID_CYBORG) {
				breakOut = analyzeComponent(weaponStats[weaponList].templates, weapon, droid);
			}

			if(breakOut === true) {
				break;
			}
		}
	}
}

//Check the unit's technology and enable it for Cobra if it is new.
function stealEnemyTechnology(droid) {
	analyzeDroidComponents(droid);
	analyzeDroidAlloys(droid);
}

//Droid will attack allies. Either the enemy will attack its units or a friend.
function malfunctionDroid() {
	const ENEMY_PLAYERS = playerAlliance(false);
	const TARGET_ENEMY = ENEMY_PLAYERS[random(ENEMY_PLAYERS.length)];

	const DROIDS = enumDroid(TARGET_ENEMY).filter(function(d) {
		return ((d.droidType !== DROID_SENSOR)
			&& !isConstruct(d)
			&& (d.droidType !== DROID_REPAIR));
	});

	const CACHE_DROIDS = droids.length;
	if(CACHE_DROIDS > 2) {
		if(random(2)) {
			var aDroid = DROIDS[random(CACHE_DROIDS)];
			var victim = DROIDS[random(CACHE_DROIDS)];
			//logObj(aDroid, "Enemy droid told to attack its own units");
			if(isDefined(aDroid) && isDefined(victim) && (aDroid !== victim)) {
				orderDroidObj(aDroid, DORDER_ATTACK, victim);
			}
		}
		else {
			for(var j = 0; j < CACHE_DROIDS; ++j) {
				if(!random(4) && isDefined(DROIDS[j])) {
					var dr = DROIDS[j];
					var rg = enumRange(dr.x, dr.y, 20, ALL_PLAYERS, false).filter(function(obj) {
						return ((obj.type === DROID) && allianceExistsBetween(obj, TARGET_ENEMY) || (obj.player === TARGET_ENEMY));
					});
					const CACHE_RG = rg.length;

					if(CACHE_RG) {
						var newDroid = rg[random(CACHE_RG)];
						if(isDefined(dr) && isDefined(newDroid)) {
							orderDroidObj(dr, DORDER_ATTACK, newDroid);
						}
					}
					else {
						break;
					}
				}
			}
		}
	}
}

//Steal technology and potentially compromise the droid itself.
function analyzeRandomEnemyDroid() {
	const ENEMY_PLAYERS = playerAlliance(false);
	const TARGET_ENEMY = ENEMY_PLAYERS[random(ENEMY_PLAYERS.length)];
	const ENEMY_DROIDS = enumDroid(TARGET_ENEMY).filter(function(d) {
		return (isVTOL(d) || (d.droidType === DROID_WEAPON) || (d.droidType === DROID_CYBORG) || (d.droidType === DROID_SENSOR));
	});

	const LEN = ENEMY_DROIDS.length;

	//Steal a randomly selected player technology.
	if(LEN) {
		var dr = ENEMY_DROIDS[random(LEN)];
		stealEnemyTechnology(dr);
		if(random(100) <= 20) {
			donateObject(dr, me);
		}
	}
}

//On insane difficulty Cobra can mess with other player's units
//in ways of stopping what they are doing or ordering them to attack
//another player or even stealing technology.
//This effect only occurs while the Cobra command center is not destroyed.
function nexusWave() {
	if(isDefined(nexusWaveOn) && !nexusWaveOn) {
		removeThisTimer("nexusWave");
		return;
	}

	if(isDefined(nexusWaveOn) && nexusWaveOn && countStruct(structures.hqs)) {
		analyzeRandomEnemyDroid();
		if(random(100) <= 15) {
			malfunctionDroid();
		}
	}
}
