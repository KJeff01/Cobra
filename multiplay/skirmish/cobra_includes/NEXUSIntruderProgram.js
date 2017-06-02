
if(DEVELOPMENT) {
	//Sometimes the required research list has duplicate strings. So lets remove them.
	function cleanResearchItem(res, player) {
		var temp = findResearch(res, player).reverse();
		if(temp.length === 0) {
			return temp;
		}

		return removeDuplicateItems(temp);
	}
	//for stealing technology
	function completeRequiredResearch(item) {
		log("Searching for required research of item: " + item);
		var reqRes = cleanResearchItem(item, me);
		var cacheReq = reqRes.length;

		for(var s = 0; s < cacheReq; ++s) {
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

		var cacheStats = statList.length;

		if(isDefined(component) && !componentAvailable(component)) {
			for(var x = 0; x < cacheStats; ++x) {

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

	//Check an enemy droid and steal any new components not researched.
	function analyzeDroidComponents(droid) {
		var body = droid.body;
		var propulsion = droid.propulsion;
		var weapon;

		if(isDefined(droid.weapons[0])) {
			weapon = droid.weapons[0].name;
		}
		//check for Dragon body
		if(isDefined(weapon) && (droid.weapons.length > 0) && isDefined(droid.weapons[1]) && isDesignable(weapon)) {
			weapon = droid.weapons[1].name;
		}

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

				if(breakOut === true) {
					break;
				}
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

		var droids = enumDroid(enemy).filter(function(d) { return ((d.droidType !== DROID_SENSOR) && (d.droidType !== DROID_CONSTRUCT)); });
		var cacheDroids = droids.length;

		if(cacheDroids > 2) {
			if(random(2)) {
				var aDroid = droids[random(cacheDroids)];
				var victim = droids[random(cacheDroids)];
				logObj(aDroid, "Enemy droid told to attack its own units");

				if(isDefined(aDroid) && isDefined(victim) && (aDroid !== victim)) {
					orderDroidObj(aDroid, DORDER_ATTACK, victim);
				}
			}
			else {
				for(var j = 0; j < cacheDroids; ++j) {
					if(!random(4) && isDefined(droids[j])) {
						var dr = droids[j];
						var rg = enumRange(dr.x, dr.y, 40, ALL_PLAYERS, false).filter(function(obj) {
							return (obj.type === DROID) && allianceExistsBetween(obj, enemy) || (obj.player === enemy);
						});
						if(rg.length > 0) {
							var newDroid = rg[random(rg.length)];
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
		var enemies = playerAlliance(false);
		var enemy = enemies[random(enemies.length)];
		var enemyDroids = enumDroid(enemy).filter(function(d) {
			return isVTOL(d) || (d.droidType === DROID_WEAPON) || (d.droidType === DROID_CYBORG) || (d.droidType === DROID_SENSOR);
		});

		var cacheEnemyDroids = enemyDroids.length;

		//Steal a randomly selected player technology.
		if(cacheEnemyDroids) {
			var dr = enemyDroids[random(cacheEnemyDroids)];
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
}
else {
	function cleanResearchItem(e, n) {
		var a = findResearch(e, n).reverse();
		return 0 === a.length ? a : removeDuplicateItems(a)
	}

	function completeRequiredResearch(e) {
		log("Searching for required research of item: " + e);
		for (var n = cleanResearchItem(e, me), a = n.length, o = 0; a > o; ++o) log("	Found: " + n[o].name), enableResearch(n[o].name, me), completeResearch(n[o].name, me)
	}

	function analyzeDroidAlloys(e) {
		for (var n, a = e.droidType == DROID_CYBORG ? "cyborg" : "tank", o = "cyborg" === a ? "R-Cyborg-Metals0" : "R-Vehicle-Metals0", r = "cyborg" === a ? "R-Cyborg-Armor-Heat0" : "R-Vehicle-Armor-Heat0", i = 0; 2 > i; ++i)
		for (var t = 1; 10 > t; ++t) {
			var n = 0 === i ? o : r,
			l = cleanResearchItem(n + t, e.player);
			if (0 === l.length) {
				var s = n + t;
				if (findResearch(s).length > 0) {
					completeRequiredResearch(s);
					break
				}
			}
		}
	}

	function analyzeComponent(e, n, a) {
		var o, r = !1,
		i = e.length;
		if (isDefined(n) && !componentAvailable(n))
		for (var t = 0; i > t; ++t)
		if (o = a.droidType === DROID_CYBORG ? e[t].weapons[0] : e[t].stat, o === n) {
			completeRequiredResearch(e[t].res), logObj(a, "Assimilated player " + a.player + "'s technology -> " + n + "."), makeComponentAvailable(n, me), r = !0;
			break
		}
		return r
	}

	function analyzeDroidComponents(e) {
		var n, a = e.body,
		o = e.propulsion;
		if (isDefined(e.weapons[0]) && (n = e.weapons[0].name), isDefined(n) && e.weapons.length > 0 && isDefined(e.weapons[1]) && isDesignable(n) && (n = e.weapons[1].name), analyzeComponent(bodyStats, a, e), analyzeComponent(propulsionStats, o, e), isDefined(n) && !isDesignable(n, a, o)) {
			var r = !1;
			for (var i in weaponStats)
			if (isVTOL(e) ? r = analyzeComponent(weaponStats[i].vtols, n, e) : e.droidType == DROID_WEAPON ? r = analyzeComponent(weaponStats[i].weapons, n, e) : e.droidType == DROID_CYBORG && (r = analyzeComponent(weaponStats[i].templates, n, e)), r === !0) break
		}
	}

	function stealEnemyTechnology(e) {
		analyzeDroidComponents(e), analyzeDroidAlloys(e)
	}

	function malfunctionDroid() {
		var e = playerAlliance(!1),
		n = e[random(e.length)],
		a = enumDroid(n).filter(function(e) {
			return e.droidType !== DROID_SENSOR && e.droidType !== DROID_CONSTRUCT
		}),
		o = a.length;
		if (o > 2)
		if (random(2)) {
			var r = a[random(o)],
			i = a[random(o)];
			logObj(r, "Enemy droid told to attack its own units"), isDefined(r) && isDefined(i) && r !== i && orderDroidObj(r, DORDER_ATTACK, i)
		} else
		for (var t = 0; o > t; ++t)
		if (!random(4) && isDefined(a[t])) {
			var l = a[t],
			s = enumRange(l.x, l.y, 40, ALL_PLAYERS, !1).filter(function(e) {
				return e.type === DROID && allianceExistsBetween(e, n) || e.player === n
			});
			if (!(s.length > 0)) break;
			var d = s[random(s.length)];
			isDefined(l) && isDefined(d) && orderDroidObj(l, DORDER_ATTACK, d)
		}
	}

	function analyzeRandomEnemyDroid() {
		var e = playerAlliance(!1),
		n = e[random(e.length)],
		a = enumDroid(n).filter(function(e) {
			return isVTOL(e) || e.droidType === DROID_WEAPON || e.droidType === DROID_CYBORG || e.droidType === DROID_SENSOR
		}),
		o = a.length;
		if (o) {
			var r = a[random(o)];
			stealEnemyTechnology(r), random(100) <= 20 && donateObject(r, me)
		}
	}

	function nexusWave() {
		return isDefined(nexusWaveOn) && !nexusWaveOn ? void removeThisTimer("nexusWave") : void(isDefined(nexusWaveOn) && nexusWaveOn && countStruct(structures.hqs) && (analyzeRandomEnemyDroid(), random(100) <= 15 && malfunctionDroid()))
	}
}
