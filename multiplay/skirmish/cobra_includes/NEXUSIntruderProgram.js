
//Experimental code to be later used in the campaign scripts. This code
//only is used on insane difficulty.

//Sometimes the required research list has duplicate strings. So lets remove them.
function cleanResearchItem(res, player) {
	var temp = findResearch(res, player).reverse();
	if(temp.length === 0)
		return temp;

	return removeDuplicateItems(temp);
}
//for stealing technology
function completeRequiredResearch(item) {
	log("Searching for required research of item: " + item);
	var reqRes = cleanResearchItem(item, me);

	for(var s = 0; s < reqRes.length; ++s) {
		log("	Found: " + reqRes[s].name);
		enableResearch(reqRes[s].name, me);
		completeResearch(reqRes[s].name, me);
	}
}

//Try to determine if the droid has superior defenses.
function analyzeDroidAlloys(droid) {
	var dStr = (droid.droidType == DROID_CYBORG) ? "cyborg" : "tank";
	var kinetic = (dStr === "cyborg") ? "R-Cyborg-Metals0" : "R-Vehicle-Metals0";
	var thermal = (dStr === "cyborg") ? "R-Cyborg-Armor-Heat0" : "R-Vehicle-Armor-Heat0";
	var temp;

	for(var t = 0; t < 2; ++t) {
		for(var i = 1; i < 10; ++i) {
			var temp = (t === 0) ? kinetic : thermal;
			var reqRes = cleanResearchItem((temp + i), droid.player);

			if(reqRes.length === 0) {
				var armorAlloy = temp + i;
				if(findResearch(armorAlloy).length > 0) {
					completeRequiredResearch(armorAlloy);
					i = 10;
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
		for(var x = 0; x < statList.length; ++x) {

			if(droid.droidType === DROID_CYBORG) {
				statHolder = statList[x].weapons[0];
			}
			else {
				statHolder = statList[x].stat;
			}

			if(statHolder === component) {
				completeRequiredResearch(statList[x].res);
				logObj(droid, "Assimilated player " + droid.player +"'s technology -> " + component + ".");
				makeComponentAvailable(component, me);
				foundComponent = true;
				break;
			}
		}
	}

	return foundComponent;
}

//Check a enemy droid and steal any new components not researched.
function analyzeDroidComponents(droid) {
	var body;
	var propulsion;
	var weapon;

	if(isDefined(droid.body))
		body = droid.body;
	if(isDefined(droid.propulsion))
		propulsion = droid.propulsion;

	if(isDefined(droid.weapons[0]))
		weapon = droid.weapons[0].name;
	//check for Dragon body
	if(isDefined(weapon) && (droid.weapons.length > 0) && isDefined(droid.weapons[1]) && isDesignable(weapon))
		weapon = droid.weapons[1].name;

	//steal body technology
	analyzeComponent(bodyStats, body, droid);
	//steal propulsion technology
	analyzeComponent(propulsionStats, propulsion, droid);


	//steal weapon technology
	if(isDefined(weapon) && !isDesignable(weapon, body, propulsion)) {
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

			if(breakOut === true)
				break;
		}
	}
}

//Check the unit's technology and enable it for Cobra if it is new.
//Called from nexusWave. (insane difficulty only).
function stealEnemyTechnology(droid) {
	analyzeDroidComponents(droid);
	analyzeDroidAlloys(droid);
}

//Droid will attack allies. Either the enemy will attack its units or a friend.
function malfunctionDroid() {
	var enemies = playerAlliance(false);
	var enemy = enemies[random(enemies.length)];

	var droids = enumDroid(enemy).filter(function(d) { return d.droidType !== DROID_SENSOR });
	if(droids.length > 2) {
		if(random(2)) {
			var aDroid = droids[droids.length - 1];
			var victim = droids[droids.length - 2];
			logObj(aDroid, "Enemy droid told to attack its own units");
			if(isDefined(aDroid) && isDefined(victim))
				orderDroidObj(aDroid, DORDER_ATTACK, victim);
		}
		else {
			for(var j = 0; j < droids.length; ++j) {
				if(!random(4) && isDefined(droids[j])) {
					var dr = droids[j];
					var rg = enumRange(dr.x, dr.y, 40, ALL_PLAYERS, false).filter(function(obj) {
						return obj.type === DROID && allianceExistsBetween(enemy, obj) || obj.player === enemy
					});
					if(rg.length > 0) {
						var newDroid = rg[random(rg.length)];
						if(isDefined(dr) && isDefined(newDroid))
							orderDroidObj(dr, DORDER_ATTACK, newDroid);
					}
					else
						break;
				}
			}
		}
	}
}

//Steal technology and potentially compromise the droid itself.
function analyzeRandomEnemyDroid() {
	var enemies = playerAlliance(false);
	var enemy = enemies[random(enemies.length)];
	var enemyDroids = enumDroid(enemy).filter(function(d) {
		return isVTOL(d) || d.droidType == DROID_WEAPON || d.droidType == DROID_CYBORG || d.droidType == DROID_SENSOR
	});

	//Steal a randomly selected player technology.
	if(enemyDroids.length > 0) {
		var dr = enemyDroids[random(enemyDroids.length)];
		stealEnemyTechnology(dr);
		if(!random(20)) {
			donateObject(dr, me);
		}
	}
}

//On insane difficulty Cobra can mess with other player's units
//in ways of stopping what they are doing or ordering them to attack
//another player or even stealing technology.
//This effect only occurs while the Cobra command center is not destroyed.
function nexusWave() {
	if(isDefined(nexusWaveOn) && (nexusWaveOn === false)) {
		removeTimer("nexusWave");
		return;
	}

	if(isDefined(nexusWaveOn) && (nexusWaveOn === true) && (countStruct(structures.hqs) > 0)) {
		analyzeRandomEnemyDroid();
		if(!random(15)) {
			malfunctionDroid();
		}
	}
}
