const MAX_GRUDGE = 5e4,
MIN_ATTACK_DROIDS = 6,
subpersonalities = {
     AC: {
          primaryWeapon: weaponStats.cannons,
          secondaryWeapon: weaponStats.gauss,
          artillery: weaponStats.mortars,
          antiAir: weaponStats.AA,
          res: ["R-Struc-PowerModuleMk1", "R-Wpn-Cannon-Damage03", "R-Vehicle-Body05", "R-Wpn-Cannon2Mk1", "R-Wpn-Cannon-ROF03", "R-Wpn-Cannon4AMk1"]
     },
     AR: {
          primaryWeapon: weaponStats.flamers,
          secondaryWeapon: weaponStats.gauss,
          artillery: weaponStats.mortars,
          antiAir: weaponStats.AA,
          res: ["R-Wpn-Flamer-Damage02", "R-Wpn-Flamer-ROF01", "R-Defense-Tower01"]
     },
     AB: {
          primaryWeapon: weaponStats.rockets_AT,
          secondaryWeapon: weaponStats.gauss,
          artillery: weaponStats.rockets_Arty,
          antiAir: weaponStats.AA,
          res: ["R-Struc-PowerModuleMk1", "R-Wpn-Rocket02-MRL", "R-Wpn-Rocket07-Tank-Killer", "R-Wpn-Rocket06-IDF", "R-Wpn-Rocket-ROF03"]
     },
     AM: {
          primaryWeapon: weaponStats.machineguns,
          secondaryWeapon: weaponStats.lasers,
          artillery: weaponStats.mortars,
          antiAir: weaponStats.AA,
          res: ["R-Wpn-MG2Mk1", "R-Defense-Tower01"]
     },
     AL: {
          primaryWeapon: weaponStats.lasers,
          secondaryWeapon: weaponStats.gauss,
          artillery: weaponStats.fireMortars,
          antiAir: weaponStats.AA,
          res: ["R-Wpn-Mortar-Incenediary", "R-Wpn-Laser01", "R-Sys-Autorepair-General", "R-Wpn-Mortar-Damage06", "R-Wpn-Mortar-ROF04", "R-Wpn-Mortar-Acc03"]
     }
};
var attackGroup, vtolGroup, cyborgGroup, sensorGroup, repairGroup, artilleryGroup, grudgeCount, personality, lastMsg, forceHover, seaMapWithLandEnemy, turnOffCyborgs, nexusWaveOn, turnOffMG, throttleTime, researchComplete;

function random(o) {
     return 0 >= o ? 0 : Math.floor(Math.random() * o)
}

function isDefined(o) {
     return "undefined" != typeof o
}

function sortArrayNumeric(o, n) {
     return o - n
}

function sortDroidsByHealth(o, n) {
     return o.health - n.health
}

function isUnsafeEnemyObject(o) {
     return o.type === DROID || o.type === STRUCTURE && o.stattype === DEFENSE
}

function sortAndReverseDistance(o) {
     return o.sort(distanceToBase).reverse()
}

function returnPrimaryAlias() {
     return subpersonalities[personality].primaryWeapon.alias
}

function returnSecondaryAlias() {
     return subpersonalities[personality].secondaryWeapon.alias
}

function returnAntiAirAlias() {
     return subpersonalities[personality].antiAir.alias
}

function returnArtilleryAlias() {
     return subpersonalities[personality].artillery.alias
}

function appendListElements(o, n) {
     isDefined(o) || (o = []);
     for (var h = o, g = n.length, m = 0; m < g; ++m) h.push(n[m]);
     return h
}

function addDroidsToGroup(o, n) {
     for (var h = 0, g = n.length; h < g; ++h) groupAdd(o, n[h])
}

function rangeStep(o) {
     var n, h = [],
     g = enumStruct(o).sort(distanceToBase),
     m = enumDroid(o).sort(distanceToBase);
     return 0 < g.length && h.push(g[0]), 0 < m.length && h.push(m[0]), 0 < h.length && (h = h.sort(distanceToBase), n = h[0]), n
}

function playerAlliance(o) {
     isDefined(o) || (o = !1);
     for (var n = [], h = 0; h < maxPlayers; ++h) o ? allianceExistsBetween(h, me) && h !== me && n.push(h) : allianceExistsBetween(h, me) || h === me || n.push(h);
     return n
}

function diffPerks() {
     switch (difficulty) {
          case EASY:
          break;
          case MEDIUM:
          break;
          case INSANE:
          nexusWaveOn = !0;
          case HARD:
          isStructureAvailable("A0PowMod1") || completeRequiredResearch("R-Sys-Engineering01"), makeComponentAvailable("PlasmaHeavy", me), makeComponentAvailable("MortarEMP", me);
     }
}

function log(o) {
     dump(gameTime + " : " + o)
}

function logObj(o, n) {
     dump(gameTime + " : [" + o.name + " id=" + o.id + "] > " + n)
}

function distanceToBase(o, n) {
     var h = distBetweenTwoPoints(startPositions[me].x, startPositions[me].y, o.x, o.y),
     g = distBetweenTwoPoints(startPositions[me].x, startPositions[me].y, n.x, n.y);
     return h - g
}

function isDesignable(o, n, h) {
     if (!isDefined(o)) return !1;
     isDefined(n) || (n = "Body1REC"), isDefined(h) || (h = "wheeled01");
     var g = makeTemplate(me, "Virtual Droid", n, h, "", "", o, o);
     return null !== g
}

function checkLowPower(o) {
     return isDefined(o) || (o = 25), !!(playerPower(me) < o) && (0 < playerAlliance(!0).length && sendChatMessage("need Power", ALLIES), !0)
}

function getRealPower() {
     var o = playerPower(me) - queuedPower(me);
     return 0 < playerAlliance(!0).length && 50 > o && sendChatMessage("need Power", ALLIES), playerPower(me) - queuedPower(me)
}

function stopExecution(o, n) {
     return isDefined(o) || (o = 0), isDefined(n) || (n = 1e3), !(gameTime > throttleTime[o] + n) || (throttleTime[o] = gameTime + 4 * random(500), !1)
}

function findLivingEnemies() {
     for (var o = [], n = 0; n < maxPlayers; ++n) n !== me && !allianceExistsBetween(n, me) && (enumDroid(n).length || enumStruct(n).length) ? o.push(n) : grudgeCount[n] = allianceExistsBetween(n, me) || n === me ? -2 : -1;
     return o
}

function getMostHarmfulPlayer(o) {
     for (var n = 0, h = findLivingEnemies(), g = 0, m = h.length; g < m; ++g) 0 <= grudgeCount[h[g]] && grudgeCount[h[g]] > grudgeCount[n] && (n = h[g]);
     isDefined(o) && n !== me && sendChatMessage("Most harmful player: " + n, ALLIES);
     var R = playerAlliance(!1);
     return n === me ? R[0] : n
}

function removeDuplicateItems(o) {
     var n = {
          boolean: {},
          number: {},
          string: {}
     },
     h = [];
     return o.filter(function(g) {
          var m = typeof g;
          return m in n ? !n[m].hasOwnProperty(g) && (n[m][g] = !0) : !(0 <= h.indexOf(g)) && h.push(g)
     })
}

function initializeGrudgeCounter() {
     grudgeCount = [];
     for (var n = 0; n < maxPlayers; ++n) grudgeCount.push(0);
     for (var n = 0; n < maxPlayers; ++n) grudgeCount[n] = allianceExistsBetween(n, me) || n === me ? -2 : random(30)
}

function initiaizeRequiredGlobals() {
     nexusWaveOn = !1, researchComplete = !1, throttleTime = [], initializeGrudgeCounter();
     for (var o = 0; 4 > o; ++o) throttleTime.push(0);
     diffPerks(), forceHover = checkIfSeaMap(), turnOffCyborgs = !!forceHover, personality = choosePersonality(), turnOffMG = CheckStartingBases(), initializeResearchLists()
}

function countEnemyVTOL() {
     for (var o = findLivingEnemies(), n = 0, h = 0, g = o.length; h < g; ++h) n += enumDroid(o[h]).filter(function(m) {
          return isVTOL(m)
     }).length;
     return n
}

function donateFromGroup(o, n) {
     if (isDefined(n)) {
          var h;
          switch (n) {
               case "ATTACK":
               h = enumGroup(attackGroup);
               break;
               case "CYBORG":
               h = enumGroup(cyborgGroup);
               break;
               case "VTOL":
               h = enumGroup(vtolGroup);
               break;
               default:
               h = enumGroup(attackGroup);
          }
          var g = h.filter(function(M) {
               return M.health > 80
          }),
          m = g.length;
          if (m >= MIN_ATTACK_DROIDS) {
               var R = g[random(m)];
               isDefined(R) && donateObject(R, o)
          }
     }
}

function removeThisTimer(o) {
     if (o instanceof Array)
     for (var n = 0, h = o.length; n < h; ++n) removeTimer(o[n]);
     else removeTimer(o)
}

function StopTimersIfDead() {
     if (!enumDroid(me) && !enumStruct(me)) {
          removeThisTimer(["buildOrder", "repairDamagedDroids", "produce", "battleTactics", "spyRoutine", "StopTimersIfDead", "eventResearched"])
     }
}

function unfinishedStructures() {
     return enumStruct(me).filter(function(n) {
          return n.status !== BUILT && (n.stattype !== RESOURCE_EXTRACTOR || n.stattype === DEFENSE && distBetweenTwoPoints(startPositions[me].x, startPositions[me].y, n.x, n.y) < 20)
     })
}

function conCanHelp(o, n, h) {
     return o.order !== DORDER_BUILD && o.order !== DORDER_LINEBUILD && o.order !== DORDER_RECYCLE && !0 !== o.busy && !repairDroid(o) && droidCanReach(o, n, h)
}

function findIdleTrucks() {
     for (var o = enumDroid(me, DROID_CONSTRUCT), n = [], h = 0, g = o.length; h < g; h++) conCanHelp(o[h], startPositions[me].x, startPositions[me].y) && n.push(o[h]);
     return n
}

function demolishThis(o) {
     for (var n = !1, h = findIdleTrucks(), g = 0, m = h.length; g < m; g++) orderDroidObj(h[g], DORDER_DEMOLISH, o) && (n = !0);
     return n
}

function countAndBuild(o, n) {
     return countStruct(o) < n && buildStuff(o)
}

function getDefenseStructure() {
     for (var n = subpersonalities[personality].primaryWeapon.defenses, h = n.length - 1; 0 < h; --h)
     if (isStructureAvailable(n[h].stat)) return n[h].stat;
     return "GuardTower1"
}

function protectUnguardedDerricks() {
     if (25000 > gameTime) return !1;
     var o = enumStruct(me, structures.derricks),
     n = o.length;
     if (n) {
          var h = [];
          o = sortAndReverseDistance(o);
          for (var g = 0; g < n; ++g) {
               for (var m = !1, R = enumRange(o[g].x, o[g].y, 8, me, !1), A = 0, M = R.length; A < M; ++A)
               if (R[A].type === STRUCTURE && R[A].stattype === DEFENSE) {
                    m = !0;
                    break
               }
               m || h.push(o[g])
          }
          if (h.length) {
               var T;
               if (buildStuff(getDefenseStructure(), T, h[0])) return !0
          }
     }
     return !1
}

function buildStructure(o, n, h) {
     if (isStructureAvailable(n, me)) {
          var g;
          if (isDefined(o) && (isDefined(h) ? g = pickStructLocation(o, n, h.x, h.y, 1) : g = pickStructLocation(o, n, startPositions[me].x, startPositions[me].y, 0)), isDefined(g)) {
               if (isDefined(o) && o.order !== DORDER_RTB && !safeDest(me, g.x, g.y)) return orderDroid(o, DORDER_RTB), !1;
               if (isDefined(o) && orderDroidBuild(o, DORDER_BUILD, n, g.x, g.y)) return !0
          }
     }
     return !1
}

function buildStuff(o, n, h) {
     var g = enumDroid(me, DROID_CONSTRUCT);
     if (g.length) {
          var m = findIdleTrucks(),
          R = m.length;
          if (R) {
               m = m.sort(distanceToBase);
               var A = m[random(R)];
               if (isDefined(o) && isDefined(n) && isDefined(A) && orderDroidBuild(A, DORDER_BUILD, n, o.x, o.y)) return !0;
               if (isDefined(A) && isDefined(o))
               if (isDefined(h)) {
                    if (buildStructure(A, o, h)) return !0;
               } else if (buildStructure(A, o)) return !0
          }
     }
     return !1
}

function checkUnfinishedStructures() {
     var o = unfinishedStructures();
     if (o.length) {
          o = o.sort(distanceToBase);
          var n = findIdleTrucks();
          if (n.length && (n = n.sort(distanceToBase), orderDroidObj(n[0], DORDER_HELPBUILD, o[0]))) return !0
     }
     return !1
}

function lookForOil() {
     var o = enumDroid(me, DROID_CONSTRUCT),
     n = enumFeature(-1, oilResources),
     h = o.length,
     g = n.length,
     m = 0;
     const R = 2.1e5 > gameTime ? 10 : 5;
     if (1 < h && g) {
          n = n.sort(distanceToBase), o = o.sort(distanceToBase);
          for (var A = 0; A < g; A++)
          for (var M = 0; M < h - 1 * (1.1e5 < gameTime) && !(A + m >= g); M++) {
               var T = enumRange(n[A + m].x, n[A + m].y, R, ENEMIES, !1);
               T = T.filter(isUnsafeEnemyObject), !T.length && conCanHelp(o[M], n[A + m].x, n[A + m].y) && (orderDroidBuild(o[M], DORDER_BUILD, structures.derricks, n[A + m].x, n[A + m].y), o[M].busy = !0, m += 1)
          }
     }
}

function buildSensors() {
     const o = "Sys-CB-Tower01",
     n = "Sys-SensoTowerWS";
     if (isStructureAvailable(o))
     if (isStructureAvailable(n)) {
          if (countAndBuild(n, 2)) return !0;
     } else if (countAndBuild(o, 2)) return !0;
     return !!countAndBuild("Sys-RadarDetector01", 2) || !!countAndBuild("ECM1PylonMk1", 3) || void 0
}

function buildAAForPersonality() {
     var o = countEnemyVTOL();
     if (!isStructureAvailable("P0-AASite-Laser")) {
          for (var n = subpersonalities[personality].antiAir.defenses, h = n.length - 1; 0 <= h; --h)
          if (isStructureAvailable(n[h].stat) && countAndBuild(n[h].stat, Math.floor(o / 2))) return !0;
     } else if (countAndBuild("P0-AASite-Laser", Math.floor(o / 2))) return !0;
     return !1
}

function buildDefenses() {
     return !!protectUnguardedDerricks() || gameTime > 6e5 && buildSensors()
}

function needPowerGenerator() {
     return 0 < countStruct(structures.derricks) - 4 * countStruct(structures.gens)
}

function buildPhase1() {
     if (!forceHover || seaMapWithLandEnemy) {
          if (countAndBuild(structures.factories, 1)) return !0;
          var o = baseType === CAMP_CLEAN ? 1 : 2;
          if (!researchComplete && countAndBuild(structures.labs, o)) return !0;
          if (countAndBuild(structures.hqs, 1)) return !0
     } else {
          if (!researchComplete && countAndBuild(structures.labs, 2)) return !0;
          if (countAndBuild(structures.hqs, 1)) return !0
     }
     return needPowerGenerator() && countAndBuild(structures.gens, countStruct(structures.gens) + 1)
}

function buildPhase2() {
     const o = -200;
     if (!countStruct(structures.gens) || getRealPower() < o) return !0;
     if (!researchComplete && countAndBuild(structures.labs, 3)) return !0;
     var n = getRealPower() > o ? 3 : 2;
     return !!countAndBuild(structures.factories, n) || !!(2.1e5 > gameTime) || !researchComplete && -175 < getRealPower() && countAndBuild(structures.labs, 5) || !turnOffCyborgs && isStructureAvailable(structures.templateFactories) && componentAvailable("Body11ABT") && countAndBuild(structures.templateFactories, 2)
}

function buildPhase3() {
     return !componentAvailable("Body11ABT") || getRealPower() < -180 || 2.1e5 > gameTime || isStructureAvailable(structures.vtolFactories) && countAndBuild(structures.vtolFactories, 2) || isStructureAvailable(structures.extras[0]) && countAndBuild(structures.extras[0], 5)
}

function buildPhase4() {
     if (getRealPower() > -50 && isStructureAvailable(structures.vtolFactories)) {
          if (countAndBuild(structures.vtolFactories, 5)) return !0;
          if (countAndBuild(structures.factories, 5)) return !0;
          if (!turnOffCyborgs && isStructureAvailable(structures.templateFactories) && countAndBuild(structures.templateFactories, 5)) return !0
     }
     return !1
}

function buildSpecialStructures() {
     for (var n = 1, h = structures.extras.length; n < h; ++n)
     if (playerPower(me) > 80 && isStructureAvailable(structures.extras[n]) && countAndBuild(structures.extras[n], 1)) return !0;
     return !1
}

function buildExtras() {
     if (!isStructureAvailable("A0PowMod1") || 8e4 > gameTime) return !1;
     if (isStructureAvailable(structures.extras[0])) {
          var o = -50 < getRealPower() ? countStruct(structures.gens) : 1;
          if (2 < o && (o = 2), countAndBuild(structures.extras[0], o)) return !0
     }
     var n = 2 * countStruct(structures.vtolPads) < enumGroup(vtolGroup).length;
     if (isStructureAvailable(structures.vtolPads) && n && buildStuff(structures.vtolPads)) return !0
}

function buildOrder() {
     checkUnfinishedStructures() || buildPhase1() || (!turnOffMG && 8e4 < gameTime || turnOffMG) && maintenance() || buildExtras() || (lookForOil(), buildPhase2() || buildAAForPersonality() || -300 > getRealPower() || countStruct(structures.derricks) < averageOilPerPlayer() || buildSpecialStructures() || buildPhase3() || buildPhase4() || buildDefenses())
}

function maintenance() {
     const o = ["A0PowMod1", "A0ResearchModule1", "A0FacMod1", "A0FacMod1"],
     n = [1, 1, 2, 2];
     var h = o.length,
     g = null,
     m = "",
     R = [];
     if (4 > countStruct(structures.derricks)) return !1;
     for (var A = 0; A < h; ++A)
     if (isStructureAvailable(o[A])) {
          if (null != g) break;
          switch (A) {
               case 0:
               {
                    R = enumStruct(me, structures.gens).sort(distanceToBase);
                    break
               }
               case 1:
               {
                    R = enumStruct(me, structures.labs).sort(distanceToBase);
                    break
               }
               case 2:
               {
                    R = enumStruct(me, structures.factories).sort(distanceToBase);
                    break
               }
               case 3:
               {
                    R = enumStruct(me, structures.vtolFactories).sort(distanceToBase);
                    break
               }
               default:
          }
          for (var M = 0, T = R.length; M < T; ++M)
          if (R[M].modules < n[A]) {
               if (1 === R[M].modules) {
                    if (2 === A && -50 > getRealPower() && !componentAvailable("Body11ABT")) continue;
                    if (3 === A && -200 > getRealPower() && !componentAvailable("Body7ABT")) continue
               }
               g = R[M], m = o[A];
               break
          }
     }
     return g && !checkLowPower(50) && buildStuff(g, m)
}
const tankBody = ["Body14SUP", "Body13SUP", "Body10MBT", "Body11ABT", "Body5REC", "Body1REC"],
sysBody = ["Body3MBT", "Body4ABT", "Body1REC"],
sysProp = ["hover01", "wheeled01"],
vtolBody = ["Body7ABT", "Body6SUPP", "Body8MBT", "Body5REC"],
earlyTankBody = ["Body6SUPP", "Body8MBT", "Body5REC", "Body1REC"],
repairTurrets = ["HeavyRepair", "LightRepair1"];

function chooseRandomWeapon() {
     var o, n = !1;
     switch (random(6)) {
          case 0:
          o = subpersonalities[personality].primaryWeapon;
          break;
          case 1:
          turnOffMG && "AM" !== personality || (o = weaponStats.machineguns);
          break;
          case 2:
          o = subpersonalities[personality].artillery;
          break;
          case 3:
          o = weaponStats.lasers;
          break;
          case 4:
          o = subpersonalities[personality].secondaryWeapon, n = !0;
          break;
          case 5:
          o = weaponStats.AS;
          break;
          default:
          o = subpersonalities[personality].primaryWeapon;
     }
     return isDefined(o) || (o = subpersonalities[personality].primaryWeapon), {
          weaponLine: o,
          shift: n
     }
}

function shuffleWeaponList(o) {
     for (var h = [], g = 0, m = o.length; g < m; ++g) h.push(o[g].stat);
     return h.reverse(), h
}

function chooseWeaponType(o) {
     var n = o;
     return n = isDefined(o.fastFire) && 50 > random(101) ? o.fastFire : o.weapons, n
}

function chooseRandomCyborgWeapon() {
     var o;
     switch (random(4)) {
          case 0:
          o = subpersonalities[personality].primaryWeapon;
          break;
          case 1:
          o = weaponStats.lasers;
          break;
          case 2:
          o = subpersonalities[personality].secondaryWeapon;
          break;
          case 3:
          componentAvailable("Mortar3ROTARYMk1") || (o = subpersonalities[personality].artillery);
          break;
          default:
          o = subpersonalities[personality].primaryWeapon;
     }
     return o
}

function chooseRandomVTOLWeapon() {
     var o, n = !1;
     switch (random(5)) {
          case 0:
          "mg" !== returnPrimaryAlias() && "fl" !== returnPrimaryAlias() && (o = subpersonalities[personality].primaryWeapon);
          break;
          case 1:
          o = weaponStats.lasers;
          break;
          case 2:
          o = subpersonalities[personality].secondaryWeapon;
          break;
          case 3:
          o = weaponStats.bombs;
          break;
          case 4:
          o = weaponStats.empBomb, n = !0;
          break;
          default:
          o = weaponStats.lasers;
     }
     return isDefined(o) && (n || !(0 >= o.vtols.length - 1)) || (o = weaponStats.bombs), o.vtols
}

function choosePersonalityWeapon(o) {
     var n, h = [];
     if (isDefined(o) || (o = "TANK"), "TANK" === o) {
          const R = ["PlasmaHeavy", "MortarEMP"];
          if (n = chooseRandomWeapon(), h = shuffleWeaponList(chooseWeaponType(n.weaponLine), n.shift), n = n.weaponLine, componentAvailable("tracked01") && 1 >= random(101) && (difficulty === HARD || difficulty === INSANE) && h.push(R[random(R.length)]), !turnOffMG && !isDesignable(h)) {
               h = [];
               for (var m = weaponStats.machineguns.weapons.length - 1; 0 <= m; --m) h.push(weaponStats.machineguns.weapons[m].stat)
          }
     } else if ("CYBORG" === o) n = chooseRandomCyborgWeapon();
     else if ("VTOL" === o) {
          n = chooseRandomVTOLWeapon();
          for (var m = n.length - 1; 0 <= m; --m) h.push(n[m].stat)
     }
     return "CYBORG" !== o && isDefined(n) ? h : n
}

function useHover(o) {
     if (!isDefined(o)) return !1;
     if (forceHover) return !0;
     for (var n = !1, h = 0, g = o.length; h < g; ++h) {
          if ("Flame1Mk1" === o[h] || "Flame2" === o[h] || "PlasmiteFlamer" === o[h]) {
               n = !0;
               break
          }
          if ("Rocket-LtA-T" === o[h] || "Rocket-HvyA-T" === o[h] || "Missile-A-T" === o[h]) {
               n = 60 >= random(101);
               break
          }
          if ("Laser3BEAMMk1" === o[h] || "Laser2PULSEMk1" === o[h] || "HeavyLaser" === o[h]) {
               n = 45 >= random(101);
               break
          }
     }
     return (!0 == n || 15 >= random(101)) && "Laser4-PlasmaCannon" !== o[0]
}

function pickGroundPropulsion() {
     var n = ["tracked01", "HalfTrack", "wheeled01"];
     return (67 > random(101) || gameTime < 1.2e6) && n.shift(), n
}

function buildAttacker(o) {
     if (!isDefined(forceHover) || !isDefined(seaMapWithLandEnemy) || !isDefined(turnOffMG)) return !1;
     if (forceHover && !seaMapWithLandEnemy && !componentAvailable("hover01")) return !1;
     var h = gameTime < 1.2e6 ? earlyTankBody : tankBody,
     g = choosePersonalityWeapon("TANK");
     if (!isDefined(g)) return !1;
     if (useHover(g) && componentAvailable("hover01")) {
          if (!random(3) && componentAvailable("Body14SUP") && componentAvailable("EMP-Cannon")) {
               if ("MortarEMP" !== g && isDefined(o) && buildDroid(o, "Hover EMP Droid", h, "hover01", "", "", g, "EMP-Cannon")) return !0;
          } else if (isDefined(o) && buildDroid(o, "Hover Droid", h, "hover01", "", "", g, g)) return !0;
     } else if (!random(3) && componentAvailable("Body14SUP") && componentAvailable("EMP-Cannon")) {
          if ("MortarEMP" !== g && isDefined(o) && buildDroid(o, "EMP Droid", h, pickGroundPropulsion(), "", "", g, "EMP-Cannon")) return !0;
     } else if (isDefined(o) && buildDroid(o, "Droid", h, pickGroundPropulsion(), "", "", g, g)) return !0;
     return !1
}

function buildSys(o, n) {
     return isDefined(n) || (n = ["Sensor-WideSpec", "SensorTurret1Mk1"]), isDefined(o) && buildDroid(o, "System unit", sysBody, sysProp, "", "", n)
}

function buildCyborg(o) {
     var n, h, g, m = choosePersonalityWeapon("CYBORG");
     if (!isDefined(m)) return !1;
     for (var R = m.templates.length - 1; 0 <= R; --R)
     if (h = m.templates[R].body, g = m.templates[R].prop, n = m.templates[R].weapons[0], "CyborgFlamer01" !== n && isDefined(o) && buildDroid(o, n + " Cyborg", h, g, "", "", n, n)) return !0;
     return !1
}

function buildVTOL(o) {
     var n = choosePersonalityWeapon("VTOL");
     return isDefined(o) && isDefined(n) && buildDroid(o, "VTOL unit", vtolBody, "V-Tol", "", "", n, n)
}

function produce() {
     const o = -100,
     n = 4;
     for (var k, m = enumStruct(me, structures.factories), R = enumStruct(me, structures.templateFactories), A = enumStruct(me, structures.vtolFactories), M = m.length, T = 0, W = 0, B = 0, S = 0; S < M; ++S) k = getDroidProduction(m[S]), null !== k && (k.droidType === DROID_CONSTRUCT && (T += 1), k.droidType === DROID_SENSOR && (W += 1), k.droidType === DROID_REPAIR && (B += 1));
     for (var P = 0; P < M; ++P)
     if (isDefined(m[P]) && structureIdle(m[P]) && getRealPower() > o)
     if (countDroid(DROID_CONSTRUCT, me) + T < n) playerAlliance(!0).length && countDroid(DROID_CONSTRUCT, me) < n && 3e4 < gameTime && sendChatMessage("need truck", ALLIES), buildSys(m[P], "Spade1Mk1");
     else if (enumGroup(sensorGroup).length + W < 2) buildSys(m[P]);
     else if (6 < enumGroup(attackGroup).length && enumGroup(repairGroup).length + B < 3) buildSys(m[P], repairTurrets);
     else {
          if (2 > m[P].modules && componentAvailable("Body11ABT")) continue;
          buildAttacker(m[P])
     }
     if (!turnOffCyborgs)
     for (var P = 0, F = R.length; P < F; ++P) isDefined(R[P]) && structureIdle(R[P]) && getRealPower() > o && buildCyborg(R[P]);
     for (var P = 0, C = A.length; P < C; ++P) isDefined(A[P]) && structureIdle(A[P]) && getRealPower() > o && buildVTOL(A[P])
}

function droidReady(o) {
     return !repairDroid(o, !1) && o.order !== DORDER_ATTACK && o.order !== DORDER_RTR && o.order !== DORDER_RECYCLE && vtolReady(o)
}

function isPlasmaCannon(o) {
     return "Laser4-PlasmaCannon" === o.weapons[0].name
}

function vtolArmed(o, n) {
     for (var h = 0, g = o.weapons.length; h < g; ++h)
     if (o.weapons[h].armed >= n) return !0;
     return !1
}

function returnEnemyFactories(o) {
     isDefined(o) || (o = getMostHarmfulPlayer());
     var n = enumStruct(o, structures.factories);
     return n = appendListElements(n, enumStruct(o, structures.templateFactories)), n = appendListElements(n, enumStruct(o, structures.vtolFactories)), n = n.sort(distanceToBase), n
}

function vtolReady(o) {
     if (!isVTOL(o)) return !0;
     return o.order === DORDER_ATTACK || o.order === DORDER_REARM ? !1 : !!vtolArmed(o, 1) || (o.order !== DORDER_REARM && orderDroid(o, DORDER_REARM), !1)
}

function repairDroid(o, n) {
     const m = 58 + Math.floor(o.experience / 22);
     return isDefined(n) || (n = !1), Math.floor(o.health) <= 33 && (n = !0), o.order === DORDER_RTR && (100 > Math.floor(o.health) || n) || countStruct(structures.extras[0]) && (n || Math.floor(o.health) <= m) && (orderDroid(o, DORDER_RTR), !0)
}

function chooseGroup() {
     var o = enumGroup(attackGroup),
     n = enumGroup(cyborgGroup);
     if (n.length > MIN_ATTACK_DROIDS && random(2)) return n;
     return o.length > MIN_ATTACK_DROIDS && random(2) ? o : o
}

function findEnemyDerricks(o) {
     var n = [];
     if (!isDefined(o)) {
          for (var h = findLivingEnemies(), g = 0, m = h.length; g < m; ++g) n = appendListElements(n, enumStruct(h[g], structures.derricks));
          isDefined(getScavengerNumber()) && !allianceExistsBetween(getScavengerNumber(), me) && (n = appendListElements(n, enumStruct(getScavengerNumber(), structures.derricks)))
     } else n = enumStruct(o, structures.derricks);
     return n
}

function findNearestEnemyDroid(o) {
     isDefined(o) || (o = getMostHarmfulPlayer());
     var n = enumDroid(o);
     return n.length ? (n = n.sort(distanceToBase), n[0]) : []
}

function findNearestEnemyStructure(o) {
     isDefined(o) || (o = getMostHarmfulPlayer());
     var n = enumStruct(o).filter(function(h) {
          return h.stattype !== WALL
     });
     return 0 === n.length && (n = enumStruct(o)), 0 < n.length ? (n = n.sort(distanceToBase), n[0]) : []
}

function attackWithGroup(o, n) {
     var h = chooseGroup(),
     g = h.length;
     if (g < MIN_ATTACK_DROIDS) return !1;
     isDefined(o) || (o = getMostHarmfulPlayer());
     var m;
     isDefined(n) && n.length ? (n = n.sort(distanceToBase), m = n[0]) : m = getCloseEnemyObject();
     for (var R = 0; R < g; R++) attackThisObject(h[R], m)
}

function chatTactic(o) {
     isDefined(o) || (o = getMostHarmfulPlayer());
     const n = averageOilPerPlayer();
     var h = lastMsg.slice(0, -1),
     g = !1;
     return "attack" !== h && "oil" !== h && (countStruct(structures.derricks) > n && enumDroid(me).length > MIN_ATTACK_DROIDS ? sendChatMessage("attack" + o, ALLIES) : (sendChatMessage("oil" + o, ALLIES), chatAttackOil(o), g = !0)), g
}

function attackStuff(o) {
     var n = getMostHarmfulPlayer();
     isDefined(o) && !allianceExistsBetween(o, me) && o !== me && (n = o);
     chatTactic(n) || attackWithGroup(n)
}

function spyRoutine() {
     var o = enumGroup(sensorGroup),
     n = enumGroup(artilleryGroup),
     h = n.length,
     g = o.length;
     if (!(g * h)) return !1;
     o = sortAndReverseDistance(o);
     for (var R, W, m = findLivingEnemies(), A = [], M = 0, T = m.length; M < T; ++M) W = rangeStep(m[M]), isDefined(W) && A.push(W);
     if (A.length && (A = A.sort(distanceToBase), R = A[0], isDefined(R))) {
          orderDroidObj(o[0], DORDER_OBSERVE, R);
          for (var M = 0; M < h; ++M) attackThisObject(n[M], R)
     }
}

function attackEnemyOil() {
     var o = chooseGroup(),
     n = o.length,
     h = 0;
     if (n >= MIN_ATTACK_DROIDS) {
          var g = findEnemyDerricks();
          if (g.length) {
               g = g.sort(distanceToBase);
               for (var m = 0; m < n && !(!isDefined(g[h]) && (h += 1, 4 == h)); ++m) attackThisObject(o[m], g[h])
          }
     }
}

function battleTactics() {
     const o = averageOilPerPlayer(),
     n = getMostHarmfulPlayer();
     if (countStruct(structures.derricks) < o || -200 > getRealPower()) attackEnemyOil();
     else if (grudgeCount[n] > 300) {
          const T = returnEnemyFactories();
          if (chatTactic(n), T.length) attackWithGroup(n, T);
          else {
               var g = enumDroid(n, DROID_CONSTRUCT);
               g.length ? attackWithGroup(n, g) : grudgeCount[n] = 0
          }
     } else {
          var m = chooseGroup(),
          R = m.length;
          if (R >= MIN_ATTACK_DROIDS)
          for (var A = getCloseEnemyObject(n), M = 0; M < R; ++M) attackThisObject(m[M], A)
     }
}

function recycleDroidsForHover() {
     var n = enumDroid(me, DROID_CONSTRUCT);
     n = appendListElements(n, enumDroid(me, DROID_SENSOR)), n = appendListElements(n, enumDroid(me, DROID_REPAIR)), n = n.filter(function(M) {
          return "hover01" !== M.propulsion
     });
     var h = unfinishedStructures();
     const g = n.length;
     if (countStruct(structures.factories) > 1 && componentAvailable("hover01")) {
          if (!h.length && g)
          for (var m = 0; m < g; ++m) orderDroid(n[m], DORDER_RECYCLE);
          if (forceHover || g || removeThisTimer("recycleDroidsForHover"), forceHover) {
               var R = enumGroup(attackGroup).filter(function(T) {
                    return T.droidType === DROID_WEAPON && "hover01" !== T.propulsion
               });
               const M = R.length;
               for (var A = 0; A < M; ++A) orderDroid(R[A], DORDER_RECYCLE);
               M + g || removeThisTimer("recycleDroidsForHover")
          }
     }
}

function chatAttackOil(o) {
     var n = findEnemyDerricks(o),
     h = chooseGroup(),
     g = h.length;
     if (n.length && g >= MIN_ATTACK_DROIDS) {
          n = n.sort(distanceToBase);
          for (var m = 0; m < g; ++m) attackThisObject(h[m], n[0])
     }
}

function repairDamagedDroids() {
     var o = enumGroup(repairGroup),
     n = o.length;
     if (n) {
          var h = appendListElements(h, enumGroup(attackGroup));
          if (h = appendListElements(h, enumGroup(cyborgGroup)), h.length) {
               h = h.sort(sortDroidsByHealth);
               for (var g = h[0], R = 0; R < n; ++R) isDefined(o[R]) && isDefined(g) && 100 > Math.ceil(g.health) && (orderDroidLoc(g, DORDER_MOVE, o[R].x, o[R].y), orderDroidObj(o[R], 26, g))
          }
     }
}

function targetPlayer(o) {
     const n = 100;
     var h = getMostHarmfulPlayer();
     o !== h && grudgeCount[o] + n < MAX_GRUDGE && (grudgeCount[o] = grudgeCount[h] + n)
}

function vtolTactics() {
     var n = enumGroup(vtolGroup),
     h = n.length;
     if (h >= 5)
     for (var g = getCloseEnemyObject(getMostHarmfulPlayer()), m = 0; m < h; ++m) attackThisObject(n[m], g)
}

function attackThisObject(o, n) {
     isDefined(n) || (n = getCloseEnemyObject()), isDefined(o) && isDefined(n) && droidReady(o) && droidCanReach(o, n.x, n.y) && !(n.type === DROID && isVTOL(n) && isVTOL(o) && !o.weapons[0].canHitAir) && (isPlasmaCannon(o) || n.type === STRUCTURE ? orderDroidObj(o, DORDER_ATTACK, n) : orderDroidLoc(o, DORDER_SCOUT, n.x, n.y))
}

function getCloseEnemyObject(o) {
     isDefined(o) || (o = getMostHarmfulPlayer());
     var n = findNearestEnemyStructure(o),
     h;
     return n instanceof Array && !n.length && (n = findNearestEnemyDroid(o), n instanceof Array && !n.length) ? h : n
}

function cleanResearchItem(o, n) {
     var h = findResearch(o, n).reverse();
     return h.length ? removeDuplicateItems(h) : h
}

function completeRequiredResearch(o) {
     log("Searching for required research of item: " + o);
     for (var n = cleanResearchItem(o, me), h = 0, g = n.length; h < g; ++h) log("\tFound: " + n[h].name), enableResearch(n[h].name, me), completeResearch(n[h].name, me)
}

function analyzeDroidAlloys(o) {
     for (var m, n = o.droidType == DROID_CYBORG ? "cyborg" : "tank", h = "cyborg" == n ? "R-Cyborg-Metals0" : "R-Vehicle-Metals0", g = "cyborg" == n ? "R-Cyborg-Armor-Heat0" : "R-Vehicle-Armor-Heat0", R = 0; 2 > R; ++R)
     for (var A = 1; 10 > A; ++A) {
          var m = 0 === R ? h : g,
          M = cleanResearchItem(m + A, o.player);
          if (0 === M.length) {
               var T = m + A;
               if (0 < findResearch(T).length) {
                    completeRequiredResearch(T);
                    break
               }
          }
     }
}

function analyzeComponent(o, n, h) {
     var g, m = !1;
     if (isDefined(n) && !componentAvailable(n))
     for (var R = 0, A = o.length; R < A; ++R)
     if (g = h.droidType === DROID_CYBORG ? o[R].weapons[0] : o[R].stat, g === n) {
          completeRequiredResearch(o[R].res), logObj(h, "Assimilated player " + h.player + "'s technology -> " + n + "."), makeComponentAvailable(n, me), m = !0;
          break
     }
     return m
}

function analyzeDroidComponents(o) {
     var g, n = o.body,
     h = o.propulsion;
     if (isDefined(o.weapons[0]) && (g = o.weapons[0].name), isDefined(g) && 0 < o.weapons.length && isDefined(o.weapons[1]) && isDesignable(g) && (g = o.weapons[1].name), analyzeComponent(bodyStats, n, o), analyzeComponent(propulsionStats, h, o), isDefined(g) && !isDesignable(g, n, h)) {
          var m = !1;
          for (var R in weaponStats)
          if (isVTOL(o) ? m = analyzeComponent(weaponStats[R].vtols, g, o) : o.droidType == DROID_WEAPON ? m = analyzeComponent(weaponStats[R].weapons, g, o) : o.droidType == DROID_CYBORG && (m = analyzeComponent(weaponStats[R].templates, g, o)), !0 == m) break
     }
}

function stealEnemyTechnology(o) {
     analyzeDroidComponents(o), analyzeDroidAlloys(o)
}

function malfunctionDroid() {
     var o = playerAlliance(!1),
     n = o[random(o.length)],
     h = enumDroid(n).filter(function(S) {
          return S.droidType !== DROID_SENSOR && S.droidType !== DROID_CONSTRUCT && S.droidType !== DROID_REPAIR
     }),
     g = h.length;
     if (2 < g)
     if (random(2)) {
          var m = h[random(g)],
          R = h[random(g)];
          logObj(m, "Enemy droid told to attack its own units"), isDefined(m) && isDefined(R) && m !== R && orderDroidObj(m, DORDER_ATTACK, R)
     } else
     for (var A = 0; A < g; ++A)
     if (!random(4) && isDefined(h[A])) {
          var M = h[A],
          T = enumRange(M.x, M.y, 40, ALL_PLAYERS, !1).filter(function(S) {
               return S.type === DROID && allianceExistsBetween(S, n) || S.player === n
          }),
          W = T.length;
          if (W) {
               var B = T[random(W)];
               isDefined(M) && isDefined(B) && orderDroidObj(M, DORDER_ATTACK, B)
          } else break
     }
}

function analyzeRandomEnemyDroid() {
     var o = playerAlliance(!1),
     n = o[random(o.length)],
     h = enumDroid(n).filter(function(R) {
          return isVTOL(R) || R.droidType === DROID_WEAPON || R.droidType === DROID_CYBORG || R.droidType === DROID_SENSOR
     }),
     g = h.length;
     if (g) {
          var m = h[random(g)];
          stealEnemyTechnology(m), 20 >= random(100) && donateObject(m, me)
     }
}

function nexusWave() {
     return isDefined(nexusWaveOn) && !nexusWaveOn ? void removeThisTimer("nexusWave") : void(isDefined(nexusWaveOn) && nexusWaveOn && countStruct(structures.hqs) && (analyzeRandomEnemyDroid(), 15 >= random(100) && malfunctionDroid()))
}

function getScavengerNumber() {
     for (var o, n = maxPlayers; 11 > n; ++n)
     if (0 < enumStruct(n).length) {
          o = n;
          break
     }
     return o
}

function checkIfSeaMap() {
     var o = !1;
     seaMapWithLandEnemy = !1;
     for (var n = 0; n < maxPlayers; ++n)
     if (!propulsionCanReach("wheeled01", startPositions[me].x, startPositions[me].y, startPositions[n].x, startPositions[n].y)) {
          for (var h = 0, g = 0; g < maxPlayers; ++g) propulsionCanReach("hover01", startPositions[n].x, startPositions[n].y, startPositions[g].x, startPositions[g].y) || ++h;
          if (h != maxPlayers - 1) {
               o = !0;
               break
          }
     }
     if (!0 == o)
     for (var n = 0; n < maxPlayers; ++n) {
          if (propulsionCanReach("wheeled01", startPositions[me].x, startPositions[me].y, startPositions[n].x, startPositions[n].y) && n !== me && !allianceExistsBetween(n, me) && 0 < enumDroid(n).length) {
               seaMapWithLandEnemy = !0;
               break
          }
          if (!0 === seaMapWithLandEnemy) break
     }
     return o
}

function freeForAll() {
     for (var o = !0, n = 0; n < maxPlayers; ++n)
     if (n != me && !allianceExistsBetween(n, me)) {
          var h = countStruct("A0LightFactory", n) + countStruct("A0CyborgFactory", n),
          g = countDroid(DROID_ANY, n);
          if (0 < g || 0 < h) {
               o = !1;
               break
          }
     }
     if (!0 == o) {
          var m = playerAlliance(!0),
          R = m.length;
          if (R) {
               isDefined(getScavengerNumber()) && allianceExistsBetween(getScavengerNumber(), me) && setAlliance(getScavengerNumber(), me, !1);
               for (var A = 0; A < R; ++A) chat(m[A], "FREE FOR ALL!"), setAlliance(m[A], me, !1)
          }
     }
}

function CheckStartingBases() {
     if ("AL" === personality) return !0;
     for (var o = subpersonalities[personality].primaryWeapon.weapons.length, n = 0; n < o; ++n)
     if (isDesignable(subpersonalities[personality].primaryWeapon.weapons[n].stat)) return !0;
     return !1
}

function countAllResources() {
     for (var h, o = enumFeature(-1, oilResources), n = 0; n < maxPlayers; ++n) {
          h = enumStruct(n, structures.derricks);
          for (var g = 0, m = h.length; g < m; ++g) o.push(h[g])
     }
     return isDefined(getScavengerNumber()) && (o = appendListElements(o, enumStruct(getScavengerNumber(), structures.derricks))), o.length
}

function averageOilPerPlayer() {
     return countAllResources() / maxPlayers
}

function mapOilLevel() {
     var o = averageOilPerPlayer(),
     n = "";
     return n = 8 >= o ? "LOW" : 8 < o && 16 >= o ? "MEDIUM" : "HIGH", n
}
const TANK_ARMOR = ["R-Vehicle-Metals09", "R-Vehicle-Armor-Heat09"],
CYBORG_ARMOR = ["R-Cyborg-Metals09", "R-Cyborg-Armor-Heat09"],
ESSENTIALS = ["R-Wpn-MG1Mk1", "R-Wpn-MG-Damage02", "R-Struc-PowerModuleMk1"],
PROPULSION = ["R-Vehicle-Prop-Hover", "R-Vehicle-Prop-Tracks"],
START_BODY = ["R-Vehicle-Body05", "R-Vehicle-Body11"],
REPAIR_UPGRADES = ["R-Struc-RprFac-Upgrade01", "R-Sys-MobileRepairTurretHvy", "R-Sys-Autorepair-General", "R-Struc-RprFac-Upgrade06"],
FLAMER = ["R-Wpn-Flame2", "R-Wpn-Flamer-ROF03", "R-Wpn-Flamer-Damage09"],
SENSOR_TECH = ["R-Sys-Sensor-Upgrade03", "R-Sys-Sensor-WS", "R-Sys-RadarDetector01", "R-Sys-ECM-Upgrade02"],
STRUCTURE_DEFENSE_UPGRADES = ["R-Struc-Materials09", "R-Defense-WallUpgrade12"],
BODY_RESEARCH = ["R-Vehicle-Body11", "R-Vehicle-Body10", "R-Vehicle-Body14"],
VTOL_RES = ["R-Struc-VTOLPad-Upgrade02", "R-Wpn-Bomb-Accuracy03", "R-Wpn-Bomb02", "R-Wpn-Bomb05", "R-Struc-VTOLPad-Upgrade06", "R-Wpn-Bomb06"],
MID_GAME_TECH = ["R-Cyborg-Metals04", "R-Cyborg-Armor-Heat02", "R-Wpn-Bomb04", "R-Struc-VTOLPad-Upgrade04", "R-Struc-Materials06"];
var techlist, weaponTech, mgWeaponTech, laserTech, artilleryTech, artillExtra, laserExtra, extraTech, cyborgWeaps, antiAirTech, antiAirExtras, extremeLaserTech, secondaryWeaponTech, secondaryWeaponExtra, defenseTech;

function updateResearchList(o, n) {
     isDefined(n) || (n = 0);
     for (var h = [], g = 0, m = o.length - n; g < m; ++g) isDefined(o[g].res) ? h.push(o[g].res) : h.push(o[g]);
     return h
}

function initializeResearchLists() {
     techlist = subpersonalities[personality].res, antiAirTech = updateResearchList(subpersonalities[personality].antiAir.defenses), antiAirExtras = updateResearchList(subpersonalities[personality].antiAir.extras), extremeLaserTech = updateResearchList(weaponStats.AS.extras), mgWeaponTech = updateResearchList(weaponStats.machineguns.weapons), laserTech = updateResearchList(weaponStats.lasers.weapons), laserExtra = updateResearchList(weaponStats.lasers.extras), weaponTech = updateResearchList(subpersonalities[personality].primaryWeapon.weapons), artilleryTech = updateResearchList(subpersonalities[personality].artillery.weapons), artillExtra = updateResearchList(subpersonalities[personality].artillery.extras), extraTech = updateResearchList(subpersonalities[personality].primaryWeapon.extras), secondaryWeaponTech = updateResearchList(subpersonalities[personality].secondaryWeapon.weapons), secondaryWeaponExtra = updateResearchList(subpersonalities[personality].secondaryWeapon.extras), defenseTech = updateResearchList(subpersonalities[personality].primaryWeapon.defenses), cyborgWeaps = updateResearchList(subpersonalities[personality].primaryWeapon.templates)
}

function evalResearch(o, n) {
     var h = pursueResearch(o, n);
     if (!h)
     for (var g = 0, m = n.length; g < m && (h = pursueResearch(o, n[g]), !h); ++g);
     return h
}

function eventResearched() {
     if (isDefined(techlist) && isDefined(turnOffMG) && isDefined(turnOffCyborgs))
     for (var n = enumStruct(me, structures.labs), h = 0, g = n.length; h < g; ++h) {
          var m = n[h],
          R = !1;
          if (m.status === BUILT && structureIdle(m) && getRealPower() > -230) {
               if (R = pursueResearch(m, ESSENTIALS), R || "AL" !== personality || (R = evalResearch(m, techlist)), R || (R = pursueResearch(m, fastestResearch)), R || (R = pursueResearch(m, "R-Struc-Power-Upgrade03a")), R || (R = pursueResearch(m, "R-Vehicle-Prop-Halftracks")), R || "AL" === personality || (R = evalResearch(m, techlist)), R || (R = evalResearch(m, START_BODY)), R || (R = evalResearch(m, PROPULSION)), R || (R = pursueResearch(m, "R-Struc-Factory-Upgrade09")), R || (R = evalResearch(m, REPAIR_UPGRADES)), R || random(4) || (R = evalResearch(m, TANK_ARMOR)), turnOffMG && "mg" !== returnPrimaryAlias() || (!R && (R = pursueResearch(m, mgWeaponTech)), !R && (R = pursueResearch(m, "R-Wpn-MG-Damage08"))), R || "fl" !== returnPrimaryAlias() && "fmor" !== returnArtilleryAlias() || (R = evalResearch(m, FLAMER)), random(2) && (!R && !turnOffCyborgs && (R = evalResearch(m, cyborgWeaps)), !R && (R = evalResearch(m, weaponTech)), !R && random(3) && (R = evalResearch(m, defenseTech)), !R && (R = evalResearch(m, extraTech))), R || (R = evalResearch(m, SENSOR_TECH)), random(3) && (!R && (R = evalResearch(m, artilleryTech)), !R && (R = evalResearch(m, artillExtra)), !random(3) && (!R && (R = pursueResearch(m, "R-Wpn-PlasmaCannon")), !R && (R = evalResearch(m, extremeLaserTech)))), R || (R = evalResearch(m, MID_GAME_TECH)), !isStructureAvailable("P0-AASite-Laser") && countEnemyVTOL() && (!R && (R = evalResearch(m, antiAirTech)), !R && (R = evalResearch(m, antiAirExtras))), R || (R = evalResearch(m, BODY_RESEARCH)), random(4) && (!R && !turnOffCyborgs && (R = pursueResearch(m, "R-Cyborg-Hvywpn-PulseLsr")), !R && countEnemyVTOL() && (R = pursueResearch(m, "R-Defense-AA-Laser")), !R && (R = evalResearch(m, laserTech)), !R && (R = evalResearch(m, laserExtra))), R || turnOffCyborgs || !random(2) || (R = evalResearch(m, CYBORG_ARMOR)), R || (R = evalResearch(m, VTOL_RES)), !R && random(2) && (R = pursueResearch(m, STRUCTURE_DEFENSE_UPGRADES)), R || (R = pursueResearch(m, "R-Sys-Resistance-Circuits")), random(3)) {
                    var A = appendListElements(A, updateResearchList(subpersonalities[personality].secondaryWeapon.templates)),
                    M = subpersonalities[personality].primaryWeapon.weapons.length - 1;
                    isDesignable(subpersonalities[personality].primaryWeapon.weapons[M].stat) && (!R && !turnOffCyborgs && A.length && (R = pursueResearch(m, A)), !R && (R = evalResearch(m, secondaryWeaponExtra)), !R && (R = evalResearch(m, secondaryWeaponTech)))
               }
               R || (R = evalResearch(m, FLAMER)), R || (R = pursueResearch(m, "R-Wpn-LasSat")), !R && componentAvailable("Body14SUP") && isDesignable("EMP-Cannon") && isStructureAvailable(structures.extras[2]) && (researchComplete = !0)
          }
     }
}

function eventGameInit() {
     attackGroup = newGroup(), vtolGroup = newGroup(), cyborgGroup = newGroup(), sensorGroup = newGroup(), repairGroup = newGroup(), artilleryGroup = newGroup(), lastMsg = "eventGameInit", addDroidsToGroup(attackGroup, enumDroid(me, DROID_WEAPON).filter(function(o) {
          return !o.isCB
     })), addDroidsToGroup(cyborgGroup, enumDroid(me, DROID_CYBORG)), addDroidsToGroup(vtolGroup, enumDroid(me).filter(function(o) {
          return isVTOL(o)
     })), addDroidsToGroup(sensorGroup, enumDroid(me, DROID_SENSOR)), addDroidsToGroup(repairGroup, enumDroid(me, DROID_REPAIR)), addDroidsToGroup(artilleryGroup, enumDroid(me, DROID_WEAPON).filter(function(o) {
          return o.isCB
     }))
}

function eventStartLevel() {
     initiaizeRequiredGlobals(), recycleDroidsForHover(), buildOrder();
     const o = difficulty === EASY ? 4e3 + (1 + random(4)) * random(1200) : 0;
     setTimer("buildOrder", o + 1100 + 3 * random(60)), setTimer("produce", o + 1800 + 3 * random(70)), setTimer("repairDamagedDroids", o + 2500 + 4 * random(60)), setTimer("switchOffMG", o + 3e3 + 5 * random(60)), setTimer("spyRoutine", o + 4500 + 4 * random(60)), setTimer("vtolTactics", o + 5600 + 3 * random(70)), setTimer("eventResearched", o + 6500 + 3 * random(70)), setTimer("battleTactics", o + 7e3 + 5 * random(60)), setTimer("nexusWave", o + 13000 + 3 * random(70)), setTimer("recycleDroidsForHover", o + 15000 + 2 * random(60)), setTimer("StopTimersIfDead", o + 1e5 + 5 * random(70))
}

function eventStructureBuilt(o, n) {
     if (isDefined(n) && o.stattype === RESOURCE_EXTRACTOR) {
          var h = enumRange(n.x, n.y, 8, ALL_PLAYERS, !1);
          if (h = h.filter(function(m) {
               return m.type === FEATURE && m.stattype === OIL_RESOURCE
          }), h = h.sort(distanceToBase), h.length && isDefined(h[0])) n.busy = !1, orderDroidBuild(n, DORDER_BUILD, structures.derricks, h[0].x, h[0].y);
          else if (-120 < getRealPower() && countStruct(structures.derricks) > averageOilPerPlayer()) {
               var g;
               buildStuff(getDefenseStructure(), g, o)
          }
     } else if ((!turnOffMG && 8e4 < gameTime || turnOffMG) && maintenance()) return
}

function eventDroidIdle(o) {
     if (o.player === me && isDefined(o) && (o.droidType === DROID_WEAPON || o.droidType === DROID_CYBORG || isVTOL(o))) {
          var n = enumRange(o.x, o.y, 10, ENEMIES, !1);
          n.length && (n = n.sort(distanceToBase), orderDroidLoc(o, DORDER_SCOUT, n[0].x, n[0].y))
     }
}

function eventDroidBuilt(o) {
     o && o.droidType !== DROID_CONSTRUCT && (isVTOL(o) ? groupAdd(vtolGroup, o) : o.droidType === DROID_SENSOR ? groupAdd(sensorGroup, o) : o.droidType === DROID_REPAIR ? groupAdd(repairGroup, o) : o.droidType === DROID_CYBORG ? groupAdd(cyborgGroup, o) : o.droidType === DROID_WEAPON && (o.isCB || o.hasIndirect ? groupAdd(artilleryGroup, o) : groupAdd(attackGroup, o)))
}

function eventAttacked(o, n) {
     if (!(o.player !== me || null === n || allianceExistsBetween(n.player, o.player))) {
          if (isDefined(getScavengerNumber()) && n.player === getScavengerNumber()) return isDefined(o) && isDefined(n) && o.type === DROID && !repairDroid(o, !1) && (o.droidType === DROID_WEAPON || o.droidType === DROID_CYBORG) && orderDroidObj(o, DORDER_ATTACK, n), void(!1 === stopExecution(0, 12000) && attackStuff(getScavengerNumber()));
          if (n && o && n.player !== me && !allianceExistsBetween(n.player, o.player)) {
               if (grudgeCount[n.player] < MAX_GRUDGE && (grudgeCount[n.player] += o.type === STRUCTURE ? 20 : 5), o.type === DROID && countStruct(structures.extras[0]) && (o.droidType === DROID_SENSOR || o.droidType === DROID_CONSTRUCT || o.droidType === DROID_REPAIR ? orderDroid(o, DORDER_RTR) : 40 > Math.floor(o.health) ? repairDroid(o, !0) : repairDroid(o, !1)), !0 === stopExecution(0, 150)) return;
               var h;
               o.type === STRUCTURE ? h = chooseGroup() : (h = enumRange(o.x, o.y, 18, me, !1).filter(function(A) {
                    return A.type === DROID && (A.droidType === DROID_WEAPON || A.droidType === DROID_CYBORG || isVTOL(A))
               }), 4 > h.length && (h = chooseGroup())), h = h.filter(function(A) {
                    return droidCanReach(A, n.x, n.y)
               });
               var g = h.length;
               if (g >= MIN_ATTACK_DROIDS)
               for (var m = 18 > distBetweenTwoPoints(startPositions[me].x, startPositions[me].y, n.x, n.y), R = 0; R < g; R++)(random(3) || m) && isDefined(h[R]) && isDefined(n) && (m && !repairDroid(h[R]) ? orderDroidObj(h[R], DORDER_ATTACK, n) : droidReady(h[R]) && orderDroidLoc(h[R], DORDER_SCOUT, n.x, n.y))
          }
     }
}

function eventGroupLoss(o) {
     o.order !== DORDER_RECYCLE && (!1 === stopExecution(3, 3e3) && addBeacon(o.x, o.y, ALLIES), playerAlliance(!0).length && (enumGroup(attackGroup).length < MIN_ATTACK_DROIDS && sendChatMessage("need tank", ALLIES), !turnOffCyborgs && countStruct(structures.templateFactories) && enumGroup(cyborgGroup).length < MIN_ATTACK_DROIDS && sendChatMessage("need cyborg", ALLIES), countStruct(structures.vtolFactories) && enumGroup(vtolGroup).length < MIN_ATTACK_DROIDS && sendChatMessage("need vtol", ALLIES)))
}

function eventBeacon(o, n, h, g) {
     if (!0 !== stopExecution(2, 2e3) && (allianceExistsBetween(h, g) || g === h)) {
          for (var R = enumGroup(cyborgGroup), A = enumGroup(attackGroup), M = enumGroup(vtolGroup), T = 0, W = R.length; T < W; T++) !repairDroid(R[T]) && droidCanReach(R[T], o, n) && orderDroidLoc(R[T], DORDER_SCOUT, o, n);
          for (var T = 0, B = A.length; T < B; T++) !repairDroid(A[T]) && droidCanReach(A[T], o, n) && orderDroidLoc(A[T], DORDER_SCOUT, o, n);
          for (var T = 0, S = M.length; T < S; T++) vtolReady(M[T]) && orderDroidLoc(M[T], DORDER_SCOUT, o, n)
     }
}

function eventObjectTransfer(o, n) {
     logObj(o, "eventObjectTransfer event. from: " + n + " to: " + o.player + ". health: " + o.health), n !== me && allianceExistsBetween(n, me) && o.type === DROID && eventDroidBuilt(o, null), n === me || n !== o.player || allianceExistsBetween(o.player, me) || o.type !== DROID || eventDroidBuilt(o, null)
}

function eventDestroyed(o) {
     if (!(isDefined(getScavengerNumber()) && o.player === getScavengerNumber()) && o.player === me) {
          var n = enumRange(o.x, o.y, 8, ENEMIES, !1);
          n = n.sort(distanceToBase), n.length && grudgeCount[n[0].player] < MAX_GRUDGE && (grudgeCount[n[0].player] = grudgeCount[n[0].player] + 5)
     }
}

function eventStructureReady(o) {
     if (!isDefined(o)) {
          var n = enumStruct(me, structures.extras[2]);
          if (n.length) o = n[0];
          else return void queue("eventStructureReady", 1e4)
     }
     const h = returnEnemyFactories();
     var g = h.length;
     g ? activateStructure(o, h[random(g)]) : queue("eventStructureReady", 1e4, o)
}

function sendChatMessage(o, n) {
     isDefined(o) && (!isDefined(n) && (n = ALLIES), lastMsg !== o && (lastMsg = o, chat(n, o)))
}

function eventChat(o, n, h) {
     if (n === me && ("AC" === h || "AR" === h || "AB" === h || "AM" === h || "AL" === h ? allianceExistsBetween(o, n) && personality !== h && choosePersonality(h) : "toggle cyborg" === h && allianceExistsBetween(o, n) ? turnOffCyborgs = !turnOffCyborgs : "toggle mg" === h && allianceExistsBetween(o, n) ? turnOffMG = !turnOffMG : "stats" === h && allianceExistsBetween(o, n) ? getMostHarmfulPlayer("chatEvent") : "FFA" === h && allianceExistsBetween(o, n) ? freeForAll() : "toggle hover" === h && allianceExistsBetween(o, n) ? forceHover = !forceHover : "oil level" == h && allianceExistsBetween(o, n) && sendChatMessage("Map oil count is: " + mapOilLevel(), ALLIES), n !== o)) {
          if ("need truck" === h && allianceExistsBetween(o, n)) {
               var g = enumDroid(me, DROID_CONSTRUCT).filter(function(M) {
                    return 90 < M.health
               }),
               m = g.length;
               2 < m && donateObject(g[random(m)], o)
          } else "need power" === h && allianceExistsBetween(o, n) ? 50 < playerPower(me) && donatePower(playerPower(me) / 2, o) : "need tank" === h && allianceExistsBetween(o, n) ? donateFromGroup(o, "ATTACK") : "need cyborg" === h && allianceExistsBetween(o, n) ? donateFromGroup(o, "CYBORG") : "need vtol" === h && allianceExistsBetween(o, n) && donateFromGroup(o, "VTOL");
          var R = h.slice(0, -1);
          if ("attack" === R) {
               var A = h.slice(-1);
               allianceExistsBetween(A, me) || A === me || attackStuff(A)
          } else if ("oil" === R) {
               var A = h.slice(-1);
               allianceExistsBetween(A, me) || A === me || chatAttackOil(A)
          } else if ("target" === R) {
               var A = h.slice(-1);
               allianceExistsBetween(A, me) || A === me || targetPlayer(A)
          }
     }
}

function switchOffMG() {
     return "mg" === returnPrimaryAlias() ? void removeThisTimer("switchOffMG") : void(isDesignable(subpersonalities[personality].primaryWeapon.weapons[0].stat) && (turnOffMG = !0, removeThisTimer("switchOffMG")))
}

function choosePersonality(o) {
     return isDefined(o) ? void(personality = o, initializeResearchLists(), sendChatMessage("Using personality: " + personality, ALLIES)) : adaptToMap()
}

function adaptToMap() {
     var o = "";
     const n = playerAlliance(!1).length - 1,
     h = playerAlliance(!0).length - 1,
     g = mapOilLevel(),
     m = isDesignable("Howitzer03-Rot"),
     R = ["AM", "AR", "AB", "AC", "AL"];
     if (!m && (1 == maxPlayers - 1 || "LOW" === g || baseType === CAMP_CLEAN)) o = R[random(2)];
     else if ("MEDIUM" === g || 0 != h && h < n) {
          var A = m && baseType !== CAMP_CLEAN ? 4 : 3;
          o = R[random(A) + 1]
     } else {
          var A = m && baseType !== CAMP_CLEAN ? 3 : 2;
          o = R[random(A) + 2]
     }
     return o
}
