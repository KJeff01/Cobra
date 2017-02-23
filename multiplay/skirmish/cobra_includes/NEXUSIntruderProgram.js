
//for stealing technology
function completeRequiredResearch(item) {
	var reqRes = findResearch(item);
	for(var s = 0; s < reqRes.length; ++s) {
		enableResearch(reqRes[s].name, me);
		completeResearch(reqRes[s].name, me);
	}
	
	enableResearch(item, me);
	completeResearch(item, me);
}

//Try to determine if the droid has superior defenses.
/*
function analyzeDroidAlloys(droid) {
	var weapon;
	if(isDefined(droid.weapons[0])) {
		weapon = droid.weapons[0].hitpoints;
		if(isDefined(droid.weapons[1]))
			weapon += droid.weapons[1].hitpoints;
	}
	else 
		return;
	
	//minimum HP
	const baseHP = weapon + droid.body.hitpoints + droid.propulsion.hitpoints;
	//cyborg hp +35. tanks +30. per upgrade
	var dType = (droid.droidType == DROID_CYBORG) ? 35 : 30;
	var dStr = (droid.droidType == DROID_CYBORG) ? "cyborg" : "tank";
	var dTemp = (droid.droidType == DROID_CYBORG) ? "R-Cyborg-Metals0" : "R-Vehicle-Metals0";
	
	for(var i = 1; i < 10; ++i) {
		if(   ) {
			var kineticUpgrade = dTemp.concat(i);
			log("Assimilated Kinetic " + dStr + " research " + kineticUpgrade + "from player " + droid.player);
			completeRequiredResearch(kineticUpgrade);
			break;
		}
	}
	
	//Do thermal Research
}*/

//Check the units technology and enable it for Cobra if it is new.
//Called from nexusWave. (insane difficulty only). Does not steal sensors yet.
function stealEnemyTechnology(droid) {
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
	if(isDefined(weapon) && componentAvailable(weapon) && (droid.weapons.length > 0) && isDefined(droid.weapons[1]))
		weapon = droid.weapons[1].name;
	
	//steal body technology
	if(isDefined(body) && !componentAvailable(body)) {
		for(var x = 0; x < bodyStats.length; ++x) {
			if(bodyStats[x].stat === body) {
				completeRequiredResearch(bodyStats[x].res);
				enableResearch(bodyStats[x].res, me);
				completeResearch(bodyStats[x].res, me);
				logObj(droid, "Assimilated player " + droid.player +"'s body -> " + body + ".");
				makeComponentAvailable(body, me);
				break;
			}
		}
	}
	
	//steal propulsion technology
	if(isDefined(propulsion) && !componentAvailable(propulsion)) {
		for(var x = 0; x < propulsionStats.length; ++x) {
			if(propulsionStats[x].stat === propulsion) {
				completeRequiredResearch(propulsionStats[x].res);
				enableResearch(propulsionStats[x].res, me);
				completeResearch(propulsionStats[x].res, me);
				logObj(droid, "Assimilated player " + droid.player +"'s propulsion -> " + propulsion + ".");
				makeComponentAvailable(propulsion, me);
				break;
			}
		}
	}
	
	
	
	//steal weapon technology
	if(isDefined(weapon) && !isDesignable(weapon, body, propulsion)) {
		if(droid.droidType == DROID_SENSOR) {
			/*
			const sensorRes = [
				"R-Sys-Sensor-Turret01",
				"R-Sys-CBSensor-Turret01",
				"R-Sys-VTOLCBS-Turret01",
				"R-Sys-VTOLStrike-Turret01",
				"R-Sys-RadarDetector01",
				"R-Sys-ECM-Upgrade01",
				"R-Sys-Sensor-WS",
			];
			
			for(var y = 0; y < sensorTurrets.length; ++y) {
				if(sensorTurrets[y] === weapon) {
					completeRequiredResearch(findResearch(sensorRes[y]));
					enableResearch(sensorRes[y], me);
					completeResearch(sensorRes[y], me);
					logObj(droid, "Assimilated player " + droid.player + "'s sensor -> " + weapon + ".");
					break;
				}
			}
			*/
		}
		else {
			var breakOut = false;
			for(var weaponList in weaponStats) {
				if(isVTOL(droid)) {
					for(var y = 0; y < weaponStats[weaponList].vtols.length; ++y) {
						if(weaponStats[weaponList].vtols[y].stat === weapon) {
							completeRequiredResearch(weaponStats[weaponList].vtols[y].res);
							logObj(droid, "Assimilated player " + droid.player + "'s vtol weapon -> " + weapon + ".");
							breakOut = true;
							break;
						}
					}
				}
				else if(droid.droidType == DROID_WEAPON) {
					for(var y = 0; y < weaponStats[weaponList].weapons.length; ++y) {
						if(weaponStats[weaponList].weapons[y].stat === weapon) {
							completeRequiredResearch(weaponStats[weaponList].weapons[y].res);
							logObj(droid, "Assimilated player " + droid.player +"'s tank weapon -> " + weapon + ".");
							breakOut = true;
							break;
						}
					}
				}
				else if(droid.droidType == DROID_CYBORG) {
					for(var y = 0; y < weaponStats[weaponList].templates.length; ++y) {
						if(weaponStats[weaponList].templates[y].weapons[0] === weapon) {
							completeRequiredResearch(weaponStats[weaponList].templates[y].res);
							logObj(droid, "Assimilated player " + droid.player + "'s template weapon -> " + weapon + ".");
							breakOut = true;
							break;
						}
					}
				}
				
				if(breakOut === true)
					break;
			}
			
			makeComponentAvailable(weapon, me);
		}
	}
	
	//analyzeDroidAlloys(droid);
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
		}
		
		if(isDefined(secondEnemy) && isDefined(secondDroids) && (secondDroids.length > 0)) {
			var dr = secondDroids[random(secondDroids.length)];
			stealEnemyTechnology(dr);
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

