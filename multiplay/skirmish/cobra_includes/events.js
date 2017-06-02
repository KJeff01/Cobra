//This file contains generic events. Chat and research events are split into
//their own seperate files.

if(DEVELOPMENT) {
	//Initialize groups
	function eventGameInit() {
		attackGroup = newGroup();
		vtolGroup = newGroup();
		cyborgGroup = newGroup();
		sensorGroup = newGroup();
		repairGroup = newGroup();
		artilleryGroup = newGroup();
		lastMsg = "eventGameInit";

		addDroidsToGroup(attackGroup, enumDroid(me, DROID_WEAPON).filter(function(obj) { return !obj.isCB; }));
		addDroidsToGroup(cyborgGroup, enumDroid(me, DROID_CYBORG));
		addDroidsToGroup(vtolGroup, enumDroid(me).filter(function(obj) { return isVTOL(obj); }));
		addDroidsToGroup(sensorGroup, enumDroid(me, DROID_SENSOR));
		addDroidsToGroup(repairGroup, enumDroid(me, DROID_REPAIR));
		addDroidsToGroup(artilleryGroup, enumDroid(me, DROID_WEAPON).filter(function(obj) { return obj.isCB; }));
	}

	//Initialze global variables and setup timers.
	function eventStartLevel() {
		initiaizeRequiredGlobals();
		buildOrder(); //Start building right away.

		const THINK_LONGER = (difficulty === EASY) ? 4000 + ((1 + random(4)) * random(1200)) : 0;

		setTimer("buildOrder", THINK_LONGER + 425 + 3 * random(60));
		setTimer("repairDamagedDroids", THINK_LONGER + 540 + 4 * random(60));
		setTimer("produce", THINK_LONGER + 900 + 3 * random(70));
		setTimer("battleTactics", THINK_LONGER + 2000 + 5 * random(60));
		setTimer("switchOffMG", THINK_LONGER + 3000 + 5 * random(60)); //May remove itself.
		setTimer("spyRoutine", THINK_LONGER + 4500 + 4 * random(60));
		setTimer("eventResearched", THINK_LONGER + 6500 + 3 * random(70));
		setTimer("nexusWave", THINK_LONGER + 10000 + 3 * random(70)); //May remove itself.
		setTimer("checkMood", THINK_LONGER + 20000 + 4 * random(70));
		setTimer("StopTimersIfDead", THINK_LONGER + 80000 + 5 * random(70));
	}

	//This is meant to check for nearby oil resources next to the construct. also
	//defend our derrick if possible.
	function eventStructureBuilt(structure, droid) {
		if(isDefined(droid) && (structure.stattype === RESOURCE_EXTRACTOR)) {
			var nearbyOils = enumRange(droid.x, droid.y, 8, ALL_PLAYERS, false);
			nearbyOils = nearbyOils.filter(function(obj) {
				return (obj.type === FEATURE) && (obj.stattype === OIL_RESOURCE);
			});
			nearbyOils.sort(distanceToBase);
			if(nearbyOils.length && isDefined(nearbyOils[0])) {
				droid.busy = false;
				orderDroidBuild(droid, DORDER_BUILD, structures.derricks, nearbyOils[0].x, nearbyOils[0].y);
			}
			else if(getRealPower() > -120) {
				var undef;
				buildStuff(getDefenseStructure(), undef, structure);
			}
		}
		else {
			if(((!turnOffMG && (gameTime > 80000)) || turnOffMG) && maintenance()) { return; }
		}
	}

	//Make droids attack hidden close by enemy object.
	function eventDroidIdle(droid) {
		if(droid.player === me) {
			if(isDefined(droid) && ((droid.droidType === DROID_WEAPON) || (droid.droidType === DROID_CYBORG) || isVTOL(droid))) {
				var enemyObjects = enumRange(droid.x, droid.y, 10, ENEMIES, false);
				if(enemyObjects.length > 0) {
					enemyObjects.sort(distanceToBase);
					orderDroidLoc(droid, DORDER_SCOUT, enemyObjects[0].x, enemyObjects[0].y);
				}
			}
		}
	}

	//Groups droid types.
	function eventDroidBuilt(droid, struct) {
		if (droid && (droid.droidType !== DROID_CONSTRUCT)) {
			if(isVTOL(droid)) {
				groupAdd(vtolGroup, droid);
			}
			else if(droid.droidType === DROID_SENSOR) {
				groupAdd(sensorGroup, droid);
			}
			else if(droid.droidType === DROID_REPAIR) {
				groupAdd(repairGroup, droid);
			}
			else if(droid.droidType === DROID_CYBORG) {
				groupAdd(cyborgGroup, droid);
			}
			else if(droid.droidType === DROID_WEAPON) {
				//Anything with splash damage or CB abiliities go here.
				if(droid.isCB || droid.hasIndirect) {
					groupAdd(artilleryGroup, droid);
				}
				else {
					groupAdd(attackGroup, droid);
				}
			}
		}
	}

	function eventAttacked(victim, attacker) {
		if((victim.player !== me) || (attacker === null) || allianceExistsBetween(attacker.player, victim.player)) {
			return;
		}

		if(isDefined(getScavengerNumber()) && (attacker.player === getScavengerNumber())) {
			if(isDefined(victim) && isDefined(attacker) && (victim.type === DROID) && !repairDroid(victim, false)) {
				if((victim.droidType === DROID_WEAPON) || (victim.droidType === DROID_CYBORG)) {
					orderDroidObj(victim, DORDER_ATTACK, attacker);
				}
			}
			if(stopExecution(0, 2000) === false) {
				attackStuff(getScavengerNumber());
			}
			return;
		}

		if (attacker && victim && (attacker.player !== me) && !allianceExistsBetween(attacker.player, victim.player)) {
			if(grudgeCount[attacker.player] < MAX_GRUDGE) {
				grudgeCount[attacker.player] += (victim.type === STRUCTURE) ? 20 : 5;
			}

			//Check if a droid needs repair.
			if((victim.type === DROID) && countStruct(structures.extras[0])) {
				//System units are timid.
				if ((victim.droidType === DROID_SENSOR) || (victim.droidType === DROID_CONSTRUCT)) {
					orderDroid(victim, DORDER_RTR);
				}
				else {
					//Try to repair.
					if(Math.floor(victim.health) < 34) {
						repairDroid(victim, true);
					}
					else {
						repairDroid(victim, false);
					}
				}
			}

			if(stopExecution(0, 110) === true) {
				return;
			}

			var units;
			if(victim.type === STRUCTURE) {
				units = chooseGroup();
			}
			else {
				units = enumRange(victim.x, victim.y, 18, me, false).filter(function(d) {
					return (d.type === DROID) && ((d.droidType === DROID_WEAPON) || (d.droidType === DROID_CYBORG) || isVTOL(d));
				});

				if(units.length < 4) {
					units = chooseGroup();
				}
			}

			units.filter(function(dr) { return droidCanReach(dr, attacker.x, attacker.y); });
			var cacheUnits = units.length;

			for (var i = 0; i < cacheUnits; i++) {
				if(random(4) && isDefined(units[i]) && droidReady(units[i]) && isDefined(attacker)) {
					orderDroidObj(units[i], DORDER_ATTACK, attacker);
				}
			}
		}
	}

	//Add a beacon and potentially request a unit.
	function eventGroupLoss(droid, group, size) {
		const MIN_DROIDS = 5;
		if(droid.order === DORDER_RECYCLE) {
			return;
		}

		if(stopExecution(3, 3000) === false) {
			addBeacon(droid.x, droid.y, ALLIES);
		}

		if(playerAlliance(true).length > 0) {
			if (enumGroup(attackGroup).length < MIN_DROIDS) {
				sendChatMessage("need tank", ALLIES);
			}
			if (!turnoffCyborgs && countStruct(structures.templateFactories) && enumGroup(cyborgGroup).length < MIN_DROIDS) {
				sendChatMessage("need cyborg", ALLIES);
			}
			if (countStruct(structures.vtolFactories) && enumGroup(vtolGroup).length < MIN_DROIDS) {
				sendChatMessage("need vtol", ALLIES);
			}
		}
	}

	//Better check what is going on over there.
	function eventBeacon(x, y, from, to, message) {
		if(stopExecution(2, 2000) === true) {
			return;
		}

		if(allianceExistsBetween(from, to) || (to === from)) {
			var cyborgs = enumGroup(cyborgGroup);
			var tanks = enumGroup(attackGroup);
			var vtols = enumGroup(vtolGroup);

			var cacheCyborgs = cyborgs.length;
			var cacheTanks = tanks.length;
			var cacheVtols = vtols.length;

			for (var i = 0; i < cacheCyborgs; i++) {
				if(!repairDroid(cyborgs[i]) && droidCanReach(cyborgs[i], x, y)) {
					orderDroidLoc(cyborgs[i], DORDER_SCOUT, x, y);
				}
			}
			for (var i = 0; i < cacheTanks; i++) {
				if(!repairDroid(tanks[i]) && droidCanReach(tanks[i], x, y)) {
					orderDroidLoc(tanks[i], DORDER_SCOUT, x, y);
				}
			}
			for (var i = 0; i < cacheVtols; i++) {
				if(vtolReady(vtols[i])) {
					orderDroidLoc(vtols[i], DORDER_SCOUT, x, y);
				}
			}
		}
	}

	function eventObjectTransfer(obj, from) {
		logObj(obj, "eventObjectTransfer event. from: " + from + ". health: " + obj.health);

		if((from !== me) && allianceExistsBetween(from, me)) {
			if(obj.type === DROID) {
				eventDroidBuilt(obj, null);
			}
		}

		if((from !== me) && (from === obj.player) && !allianceExistsBetween(obj.player, me)) {
			if(obj.type === DROID) {
				eventDroidBuilt(obj, null);
			}
		}
	}

	//Increae grudge counter for closest enemy.
	function eventDestroyed(object) {
		if(isDefined(getScavengerNumber()) && (object.player === getScavengerNumber()))
		return;

		if(object.player === me) {
			var enemies = enumRange(object.x, object.y, 8, ENEMIES, false);
			enemies.sort(distanceToBase);
			if(enemies.length && grudgeCount[enemies[0].player] < MAX_GRUDGE) {
				grudgeCount[enemies[0].player] = grudgeCount[enemies[0].player] + 5;
			}
		}
	}

	//Basic Laser Satellite support.
	function eventStructureReady(structure) {
		if(!isDefined(structure)) {
			var las = enumStruct(me, structures.extras[2]);
			if(las.length) {
				structure = las[0];
			}
			else {
				queue("eventStructureReady", 10000);
				return;
			}
		}

		const ENEMY_FACTORIES = returnEnemyFactories();
		var cacheFacs = ENEMY_FACTORIES.length;

		if(cacheFacs) {
			activateStructure(structure, ENEMY_FACTORIES[random(cacheFacs)]);
		}
		else {
			queue("eventStructureReady", 10000, structure);
		}
	}
}
else {
	function eventGameInit() {
	    attackGroup = newGroup(), vtolGroup = newGroup(), cyborgGroup = newGroup(), sensorGroup = newGroup(), repairGroup = newGroup(), artilleryGroup = newGroup(), lastMsg = "eventGameInit", addDroidsToGroup(attackGroup, enumDroid(me, DROID_WEAPON).filter(function(e) {
	        return !e.isCB
	    })), addDroidsToGroup(cyborgGroup, enumDroid(me, DROID_CYBORG)), addDroidsToGroup(vtolGroup, enumDroid(me).filter(function(e) {
	        return isVTOL(e)
	    })), addDroidsToGroup(sensorGroup, enumDroid(me, DROID_SENSOR)), addDroidsToGroup(repairGroup, enumDroid(me, DROID_REPAIR)), addDroidsToGroup(artilleryGroup, enumDroid(me, DROID_WEAPON).filter(function(e) {
	        return e.isCB
	    }))
	}

	function eventStartLevel() {
	    initiaizeRequiredGlobals(), buildOrder();
	    const e = difficulty === EASY ? 4e3 + (1 + random(4)) * random(1200) : 0;
	    setTimer("buildOrder", e + 425 + 3 * random(60)), setTimer("repairDamagedDroids", e + 540 + 4 * random(60)), setTimer("produce", e + 900 + 3 * random(70)), setTimer("battleTactics", e + 2e3 + 5 * random(60)), setTimer("switchOffMG", e + 3e3 + 5 * random(60)), setTimer("spyRoutine", e + 4500 + 4 * random(60)), setTimer("eventResearched", e + 6500 + 3 * random(70)), setTimer("nexusWave", e + 1e4 + 3 * random(70)), setTimer("checkMood", e + 2e4 + 4 * random(70)), setTimer("StopTimersIfDead", e + 8e4 + 5 * random(70))
	}

	function eventStructureBuilt(e, r) {
	    if (isDefined(r) && e.stattype === RESOURCE_EXTRACTOR) {
	        var t = enumRange(r.x, r.y, 8, ALL_PLAYERS, !1);
	        if (t = t.filter(function(e) {
	                return e.type === FEATURE && e.stattype === OIL_RESOURCE
	            }), t.sort(distanceToBase), t.length && isDefined(t[0])) r.busy = !1, orderDroidBuild(r, DORDER_BUILD, structures.derricks, t[0].x, t[0].y);
	        else if (getRealPower() > -120) {
	            var o;
	            buildStuff(getDefenseStructure(), o, e)
	        }
	    } else if ((!turnOffMG && gameTime > 8e4 || turnOffMG) && maintenance()) return
	}

	function eventDroidIdle(e) {
	    if (e.player === me && isDefined(e) && (e.droidType === DROID_WEAPON || e.droidType === DROID_CYBORG || isVTOL(e))) {
	        var r = enumRange(e.x, e.y, 10, ENEMIES, !1);
	        r.length > 0 && (r.sort(distanceToBase), orderDroidLoc(e, DORDER_SCOUT, r[0].x, r[0].y))
	    }
	}

	function eventDroidBuilt(e, r) {
	    e && e.droidType !== DROID_CONSTRUCT && (isVTOL(e) ? groupAdd(vtolGroup, e) : e.droidType === DROID_SENSOR ? groupAdd(sensorGroup, e) : e.droidType === DROID_REPAIR ? groupAdd(repairGroup, e) : e.droidType === DROID_CYBORG ? groupAdd(cyborgGroup, e) : e.droidType === DROID_WEAPON && (e.isCB || e.hasIndirect ? groupAdd(artilleryGroup, e) : groupAdd(attackGroup, e)))
	}

	function eventAttacked(e, r) {
	    if (e.player === me && null !== r && !allianceExistsBetween(r.player, e.player)) {
	        if (isDefined(getScavengerNumber()) && r.player === getScavengerNumber()) return isDefined(e) && isDefined(r) && e.type === DROID && !repairDroid(e, !1) && (e.droidType === DROID_WEAPON || e.droidType === DROID_CYBORG) && orderDroidObj(e, DORDER_ATTACK, r), void(stopExecution(0, 2e3) === !1 && attackStuff(getScavengerNumber()));
	        if (r && e && r.player !== me && !allianceExistsBetween(r.player, e.player)) {
	            if (grudgeCount[r.player] < MAX_GRUDGE && (grudgeCount[r.player] += e.type === STRUCTURE ? 20 : 5), e.type === DROID && countStruct(structures.extras[0]) && (e.droidType === DROID_SENSOR || e.droidType === DROID_CONSTRUCT ? orderDroid(e, DORDER_RTR) : Math.floor(e.health) < 34 ? repairDroid(e, !0) : repairDroid(e, !1)), stopExecution(0, 110) === !0) return;
	            var t;
	            e.type === STRUCTURE ? t = chooseGroup() : (t = enumRange(e.x, e.y, 18, me, !1).filter(function(e) {
	                return e.type === DROID && (e.droidType === DROID_WEAPON || e.droidType === DROID_CYBORG || isVTOL(e))
	            }), t.length < 4 && (t = chooseGroup())), t.filter(function(e) {
	                return droidCanReach(e, r.x, r.y)
	            });
	            for (var o = t.length, n = 0; o > n; n++) random(4) && isDefined(t[n]) && droidReady(t[n]) && isDefined(r) && orderDroidObj(t[n], DORDER_ATTACK, r)
	        }
	    }
	}

	function eventGroupLoss(e, r, t) {
	    const o = 5;
	    e.order !== DORDER_RECYCLE && (stopExecution(3, 3e3) === !1 && addBeacon(e.x, e.y, ALLIES), playerAlliance(!0).length > 0 && (enumGroup(attackGroup).length < o && sendChatMessage("need tank", ALLIES), !turnoffCyborgs && countStruct(structures.templateFactories) && enumGroup(cyborgGroup).length < o && sendChatMessage("need cyborg", ALLIES), countStruct(structures.vtolFactories) && enumGroup(vtolGroup).length < o && sendChatMessage("need vtol", ALLIES)))
	}

	function eventBeacon(e, r, t, o, n) {
	    if (stopExecution(2, 2e3) !== !0 && (allianceExistsBetween(t, o) || o === t)) {
	        for (var i = enumGroup(cyborgGroup), u = enumGroup(attackGroup), d = enumGroup(vtolGroup), a = i.length, s = u.length, D = d.length, p = 0; a > p; p++) !repairDroid(i[p]) && droidCanReach(i[p], e, r) && orderDroidLoc(i[p], DORDER_SCOUT, e, r);
	        for (var p = 0; s > p; p++) !repairDroid(u[p]) && droidCanReach(u[p], e, r) && orderDroidLoc(u[p], DORDER_SCOUT, e, r);
	        for (var p = 0; D > p; p++) vtolReady(d[p]) && orderDroidLoc(d[p], DORDER_SCOUT, e, r)
	    }
	}

	function eventObjectTransfer(e, r) {
	    logObj(e, "eventObjectTransfer event. from: " + r + ". health: " + e.health), r !== me && allianceExistsBetween(r, me) && e.type === DROID && eventDroidBuilt(e, null), r === me || r !== e.player || allianceExistsBetween(e.player, me) || e.type === DROID && eventDroidBuilt(e, null)
	}

	function eventDestroyed(e) {
	    if ((!isDefined(getScavengerNumber()) || e.player !== getScavengerNumber()) && e.player === me) {
	        var r = enumRange(e.x, e.y, 8, ENEMIES, !1);
	        r.sort(distanceToBase), r.length && grudgeCount[r[0].player] < MAX_GRUDGE && (grudgeCount[r[0].player] = grudgeCount[r[0].player] + 5)
	    }
	}

	function eventStructureReady(e) {
	    if (!isDefined(e)) {
	        var r = enumStruct(me, structures.extras[2]);
	        if (!r.length) return void queue("eventStructureReady", 1e4);
	        e = r[0]
	    }
	    const t = returnEnemyFactories();
	    var o = t.length;
	    o ? activateStructure(e, t[random(o)]) : queue("eventStructureReady", 1e4, e)
}
