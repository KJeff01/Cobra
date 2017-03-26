
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
//compoenent was found.
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

//Check the units technology and enable it for Cobra if it is new.
//Called from nexusWave. (insane difficulty only).
function stealEnemyTechnology(droid) {
	analyzeDroidComponents(droid);
	analyzeDroidAlloys(droid);
}

//On insane difficulty Cobra can mess with other player's units
//in ways of stopping what they are doing or ordering them to attack
//another player or even stealing technology.
//This effect only occurs while the Cobra command center is not destroyed

function nexusWave() {
	if(isDefined(nexusWaveOn) && (nexusWaveOn === false)) {
		removeTimer("nexusWave");
		return;
	}

	if(isDefined(nexusWaveOn) && (nexusWaveOn === true) && (countStruct(structures.hqs) > 0)) {
		var enemies = playerAlliance(false);
		var firstEnemy = enemies[random(enemies.length)];
		var firstDroids = enumDroid(firstEnemy).filter(function(d) {
			return isVTOL(d) || d.droidType == DROID_WEAPON || d.droidType == DROID_CYBORG || d.droidType == DROID_SENSOR
		});
		var secondEnemy = enemies[random(enemies.length)];
		var secondDroids = enumDroid(secondEnemy).filter(function(d) {
			return isVTOL(d) || d.droidType == DROID_WEAPON || d.droidType == DROID_CYBORG || d.droidType == DROID_SENSOR
		});

		//Steal a randomly selected player technology
		if(isDefined(firstEnemy) && isDefined(firstDroids) && (firstDroids.length > 0)) {
			var dr = firstDroids[random(firstDroids.length)];
			stealEnemyTechnology(dr);
			if(!random(30)) {
				donateObject(dr, me);
			}
		}

		if(isDefined(secondEnemy) && isDefined(secondDroids) && (secondDroids.length > 0)) {
			var dr = secondDroids[random(secondDroids.length)];
			stealEnemyTechnology(dr);
			if(!random(30)) {
				donateObject(dr, me);
			}
		}

		var enemyStruct = enumStruct(firstEnemy);

		if(enemyStruct.length > 0) {
			var newStruct = enemyStruct[random(enemyStruct.length)];

			if(!random(10)) {
				var aDroid = secondDroids[random(secondDroids.length)];
				//log("NXwave -> player " + aDroid.player + " told to attack player " + newStruct.player);
				if(isDefined(aDroid) && isDefined(newStruct))
					orderDroidObj(aDroid, DORDER_ATTACK, newStruct);
			}
			else if(!random(10)) {
				//log("NXwave -> player " + secondDroids[0].player + "'s droids malfunctioned.");
				for(var j = 0; j < secondDroids.length; ++j) {
					//Attack own units
					if(!random(5) && isDefined(secondDroids[j])) {
						var dr = secondDroids[j];
						var rg = enumRange(dr.x, dr.y, 8, dr.player, false).filter(function(obj) {
							return obj.type == DROID
						});
						if((rg.length > 0)) {
							var newDroid = rg[random(rg.length)];

							if(isDefined(dr) && isDefined(newDroid))
								orderDroidObj(dr, DORDER_ATTACK, newDroid);
							else
								break;
						}
					}
				}
			}
		}
	}
}
