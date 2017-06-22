MAX_GRUDGE = 5e4,
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
          antiAir: weaponStats.lasers_AA,
          res: ["R-Wpn-Mortar-Incenediary", "R-Wpn-Laser01", "R-Sys-Autorepair-General", "R-Wpn-Mortar-Damage06", "R-Wpn-Mortar-ROF04", "R-Wpn-Mortar-Acc03"]
     }
};
var attackGroup, vtolGroup, cyborgGroup, sensorGroup, repairGroup, artilleryGroup, grudgeCount, personality, lastMsg, forceHover, seaMapWithLandEnemy, turnOffCyborgs, nexusWaveOn, turnOffMG, throttleTime, researchComplete;

function random(n) {
     return 0 >= n ? 0 : Math.floor(Math.random() * n)
}

function isDefined(n) {
     return "undefined" != typeof n
}

function sortArrayNumeric(n, o) {
     return n - o
}

function sortDroidsByHealth(n, o) {
     return n.health - o.health
}

function isUnsafeEnemyObject(n) {
     return n.type === DROID || n.type === STRUCTURE && n.stattype === DEFENSE
}

function sortAndReverseDistance(n) {
     return n.sort(distanceToBase).reverse()
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

function appendListElements(n, o) {
     isDefined(n) || (n = []);
     for (var R = n, y = o.length, m = 0; m < y; ++m) R.push(o[m]);
     return R
}

function addDroidsToGroup(n, o) {
     for (var R = 0, y = o.length; R < y; ++R) groupAdd(n, o[R])
}

function rangeStep(n) {
     var o, R = [],
     y = enumStruct(n).sort(distanceToBase),
     m = enumDroid(n).sort(distanceToBase);
     return 0 < y.length && R.push(y[0]), 0 < m.length && R.push(m[0]), 0 < R.length && (R.sort(distanceToBase), o = R[0]), o
}

function playerAlliance(n) {
     isDefined(n) || (n = !1);
     for (var o = [], R = 0; R < maxPlayers; ++R) n ? allianceExistsBetween(R, me) && R !== me && o.push(R) : allianceExistsBetween(R, me) || R === me || o.push(R);
     return o
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

function log(n) {
     dump(gameTime + " : " + n)
}

function logObj(n, o) {
     dump(gameTime + " : [" + n.name + " id=" + n.id + "] > " + o)
}

function distanceToBase(n, o) {
     var R = distBetweenTwoPoints(startPositions[me].x, startPositions[me].y, n.x, n.y),
     y = distBetweenTwoPoints(startPositions[me].x, startPositions[me].y, o.x, o.y);
     return R - y
}

function isDesignable(n, o, R) {
     if (!isDefined(n)) return !1;
     isDefined(o) || (o = "Body1REC"), isDefined(R) || (R = "wheeled01");
     var y = makeTemplate(me, "Virtual Droid", o, R, "", "", n, n);
     return null !== y
}

function checkLowPower(n) {
     return isDefined(n) || (n = 25), !!(playerPower(me) < n) && (0 < playerAlliance(!0).length && sendChatMessage("need Power", ALLIES), !0)
}

function getRealPower() {
     var n = playerPower(me) - queuedPower(me);
     return 0 < playerAlliance(!0).length && 50 > n && sendChatMessage("need Power", ALLIES), playerPower(me) - queuedPower(me)
}

function stopExecution(n, o) {
     return isDefined(n) || (n = 0), isDefined(o) || (o = 1e3), !(gameTime > throttleTime[n] + o) || (throttleTime[n] = gameTime + 4 * random(500), !1)
}

function findLivingEnemies() {
     for (var n = [], o = 0; o < maxPlayers; ++o) o !== me && !allianceExistsBetween(o, me) && (enumDroid(o).length || enumStruct(o).length) ? n.push(o) : grudgeCount[o] = allianceExistsBetween(o, me) || o === me ? -2 : -1;
     return n
}

function getMostHarmfulPlayer(n) {
     for (var o = 0, R = findLivingEnemies(), y = 0, m = R.length; y < m; ++y) 0 <= grudgeCount[R[y]] && grudgeCount[R[y]] > grudgeCount[o] && (o = R[y]);
     isDefined(n) && o !== me && sendChatMessage("Most harmful player: " + o, ALLIES);
     var g = playerAlliance(!1);
     return o === me ? g[0] : o
}

function removeDuplicateItems(n) {
     var o = {
          boolean: {},
          number: {},
          string: {}
     },
     R = [];
     return n.filter(function(y) {
          var m = typeof y;
          return m in o ? !o[m].hasOwnProperty(y) && (o[m][y] = !0) : !(0 <= R.indexOf(y)) && R.push(y)
     })
}

function randomizeFirstEnemy() {
     for (var n = 0; n < maxPlayers; ++n) grudgeCount[n] = allianceExistsBetween(n, me) || n === me ? -2 : random(30)
}

function initiaizeRequiredGlobals() {
     nexusWaveOn = !1, researchComplete = !1, grudgeCount = [], throttleTime = [];
     for (var n = 0; n < maxPlayers; ++n) grudgeCount.push(0);
     for (var n = 0; 4 > n; ++n) throttleTime.push(0);
     diffPerks(), forceHover = checkIfSeaMap(), turnOffCyborgs = !!forceHover, personality = choosePersonality(), turnOffMG = CheckStartingBases(), randomizeFirstEnemy(), initializeResearchLists()
}

function countEnemyVTOL() {
     for (var n = findLivingEnemies(), o = 0, R = 0, y = n.length; R < y; ++R) o += enumDroid(n[R]).filter(function(m) {
          return isVTOL(m)
     }).length;
     return o
}

function donateFromGroup(n, o) {
     var y = enumGroup(n),
     m = y.length;
     if (!(m < MIN_ATTACK_DROIDS)) {
          var g = y[random(m)];
          isDefined(g) && g.health >= 70 && donateObject(g, o)
     }
}

function removeThisTimer(n) {
     if (n instanceof Array)
     for (var o = 0, R = n.length; o < R; ++o) removeTimer(n[o]);
     else removeTimer(n)
}

function StopTimersIfDead() {
     if (!enumDroid(me) && !enumStruct(me)) {
          removeThisTimer(["buildOrder", "repairDamagedDroids", "produce", "battleTactics", "spyRoutine", "StopTimersIfDead", "eventResearched"])
     }
}

function unfinishedStructures() {
     return enumStruct(me).filter(function(o) {
          return o.status !== BUILT && (o.stattype !== RESOURCE_EXTRACTOR || o.stattype === DEFENSE && distBetweenTwoPoints(startPositions[me].x, startPositions[me].y, o.x, o.y) < 20)
     })
}

function conCanHelp(n, o, R) {
     return n.order !== DORDER_BUILD && n.order !== DORDER_LINEBUILD && n.order !== DORDER_RECYCLE && !0 !== n.busy && !repairDroid(n) && droidCanReach(n, o, R)
}

function findIdleTrucks() {
     for (var n = enumDroid(me, DROID_CONSTRUCT), o = [], R = 0, y = n.length; R < y; R++) conCanHelp(n[R], startPositions[me].x, startPositions[me].y) && o.push(n[R]);
     return o
}

function demolishThis(n) {
     for (var o = !1, R = findIdleTrucks(), y = 0, m = R.length; y < m; y++) orderDroidObj(R[y], DORDER_DEMOLISH, n) && (o = !0);
     return o
}

function countAndBuild(n, o) {
     return countStruct(n) < o && buildStuff(n)
}

function getDefenseStructure() {
     for (var o = subpersonalities[personality].primaryWeapon.defenses, R = o.length - 1; 0 < R; --R)
     if (isStructureAvailable(o[R].stat)) return o[R].stat;
     return "GuardTower1"
}

function protectUnguardedDerricks() {
     if (25000 > gameTime) return !1;
     var n = enumStruct(me, structures.derricks),
     o = n.length;
     if (o) {
          var R = [];
          n = sortAndReverseDistance(n);
          for (var y = 0; y < o; ++y) {
               for (var m = !1, g = enumRange(n[y].x, n[y].y, 8, me, !1), W = 0, A = g.length; W < A; ++W)
               if (g[W].type === STRUCTURE && g[W].stattype === DEFENSE) {
                    m = !0;
                    break
               }
               m || R.push(n[y])
          }
          if (R.length) {
               var M;
               if (buildStuff(getDefenseStructure(), M, R[0])) return !0
          }
     }
     return !1
}

function buildStructure(n, o, R) {
     if (!isStructureAvailable(o, me)) return !1;
     var y;
     return isDefined(n) && (isDefined(R) ? y = pickStructLocation(n, o, R.x, R.y, 1) : y = pickStructLocation(n, o, startPositions[me].x, startPositions[me].y, 0)), !!isDefined(y) && (isDefined(n) && n.order !== DORDER_RTB && !safeDest(me, y.x, y.y) ? (orderDroid(n, DORDER_RTB), !1) : isDefined(n) && orderDroidBuild(n, DORDER_BUILD, o, y.x, y.y))
}

function buildStuff(n, o, R) {
     var y = enumDroid(me, DROID_CONSTRUCT);
     if (0 < y.length) {
          var m = findIdleTrucks(),
          g = m.length;
          if (g) {
               m.sort(distanceToBase);
               var W = m[random(g)];
               if (isDefined(n) && isDefined(o) && isDefined(W) && orderDroidBuild(W, DORDER_BUILD, o, n.x, n.y)) return !0;
               if (isDefined(W) && isDefined(n))
               if (isDefined(R)) {
                    if (buildStructure(W, n, R)) return !0;
               } else if (buildStructure(W, n)) return !0
          }
     }
     return !1
}

function checkUnfinishedStructures() {
     var n = unfinishedStructures();
     if (0 < n.length) {
          n.sort(distanceToBase);
          var o = findIdleTrucks();
          if (0 < o.length && (o.sort(distanceToBase), orderDroidObj(o[0], DORDER_HELPBUILD, n[0]))) return !0
     }
     return !1
}

function lookForOil() {
     var n = enumDroid(me, DROID_CONSTRUCT),
     o = enumFeature(-1, oilResources),
     R = n.length,
     y = o.length,
     m = 0;
     const g = 2.1e5 > gameTime ? 10 : 5;
     if (!(1 >= R) && y) {
          o.sort(distanceToBase), n.sort(distanceToBase);
          for (var W = 0; W < y; W++)
          for (var M, A = 0; A < R - 1 * (1.1e5 < gameTime) && !(W + m >= y); A++) M = enumRange(o[W + m].x, o[W + m].y, g, ENEMIES, !1), M.filter(isUnsafeEnemyObject), !M.length && conCanHelp(n[A], o[W + m].x, o[W + m].y) && (orderDroidBuild(n[A], DORDER_BUILD, structures.derricks, o[W + m].x, o[W + m].y), n[A].busy = !0, m += 1)
     }
}

function buildSensors() {
     const n = "Sys-CB-Tower01",
     o = "Sys-SensoTowerWS";
     if (isStructureAvailable(n))
     if (isStructureAvailable(o)) {
          if (countAndBuild(o, 2)) return !0;
     } else if (countAndBuild(n, 2)) return !0;
     return !!countAndBuild("Sys-RadarDetector01", 2) || !!countAndBuild("ECM1PylonMk1", 3) || void 0
}

function buildAAForPersonality() {
     var n = subpersonalities[personality].antiAir.defenses,
     o = countEnemyVTOL();
     if ("lasaa" === returnAntiAirAlias() && !isStructureAvailable("P0-AASite-Laser") && isStructureAvailable("AASite-QuadRotMg") && countAndBuild("AASite-QuadRotMg", Math.floor(o / 2))) return !0;
     for (var R = n.length - 1; 0 <= R; --R)
     if (isStructureAvailable(n[R].stat) && countAndBuild(n[R].stat, Math.floor(o / 2))) return !0;
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
          var n = baseType === CAMP_CLEAN ? 1 : 2;
          if (!researchComplete && countAndBuild(structures.labs, n)) return !0;
          if (countAndBuild(structures.hqs, 1)) return !0
     } else {
          if (!researchComplete && countAndBuild(structures.labs, 2)) return !0;
          if (countAndBuild(structures.hqs, 1)) return !0
     }
     return needPowerGenerator() && isStructureAvailable(structures.gens) && countAndBuild(structures.gens, countStruct(structures.gens) + 1)
}

function buildPhase2() {
     const n = -200;
     if (!countStruct(structures.gens) || getRealPower() < n) return !0;
     if (!researchComplete && countAndBuild(structures.labs, 3)) return !0;
     var o = getRealPower() > n ? 3 : 2;
     return !!countAndBuild(structures.factories, o) || !!(2.1e5 > gameTime) || !researchComplete && -175 < getRealPower() && countAndBuild(structures.labs, 5) || !turnOffCyborgs && isStructureAvailable(structures.templateFactories) && componentAvailable("Body11ABT") && countAndBuild(structures.templateFactories, 2)
}

function buildPhase3() {
     return !componentAvailable("Body11ABT") || getRealPower() < -180 || 2.1e5 > gameTime || isStructureAvailable(structures.vtolFactories) && countAndBuild(structures.vtolFactories, 2) || isStructureAvailable(structures.extras[0]) && countAndBuild(structures.extras[0], 5)
}

function buildPhase4() {
     if (getRealPower() > -180 && isStructureAvailable(structures.vtolFactories)) {
          if (countAndBuild(structures.vtolFactories, 5)) return !0;
          if (countAndBuild(structures.factories, 5)) return !0;
          if (!turnOffCyborgs && isStructureAvailable(structures.templateFactories) && countAndBuild(structures.templateFactories, 5)) return !0
     }
     return !1
}

function buildSpecialStructures() {
     for (var o = 1, R = structures.extras.length; o < R; ++o)
     if (playerPower(me) > 80 && isStructureAvailable(structures.extras[o]) && countAndBuild(structures.extras[o], 1)) return !0;
     return !1
}

function buildExtras() {
     if (!isStructureAvailable("A0PowMod1") || 8e4 > gameTime) return !1;
     if (isStructureAvailable(structures.extras[0])) {
          var n = -50 < getRealPower() ? countStruct(structures.gens) : 1;
          if (2 < n && (n = 2), countAndBuild(structures.extras[0], n)) return !0
     }
     var o = 2 * countStruct(structures.vtolPads) < enumGroup(vtolGroup).length;
     if (isStructureAvailable(structures.vtolPads) && o && buildStuff(structures.vtolPads)) return !0
}

function buildOrder() {
     checkUnfinishedStructures() || buildPhase1() || (!turnOffMG && 8e4 < gameTime || turnOffMG) && maintenance() || buildExtras() || (lookForOil(), buildPhase2() || buildAAForPersonality() || -300 > getRealPower() || countStruct(structures.derricks) < averageOilPerPlayer() || buildSpecialStructures() || buildPhase3() || buildDefenses() || buildPhase4())
}

function maintenance() {
     const n = ["A0PowMod1", "A0ResearchModule1", "A0FacMod1", "A0FacMod1"],
     o = [1, 1, 2, 2];
     var R = n.length,
     y = null,
     m = "",
     g = [];
     if (4 > countStruct(structures.derricks)) return !1;
     for (var W = 0; W < R && isStructureAvailable(n[W]) && null == y; ++W) {
          switch (W) {
               case 0:
               {
                    g = enumStruct(me, structures.gens).sort(distanceToBase);
                    break
               }
               case 1:
               {
                    g = enumStruct(me, structures.labs).sort(distanceToBase);
                    break
               }
               case 2:
               {
                    g = enumStruct(me, structures.factories).sort(distanceToBase);
                    break
               }
               case 3:
               {
                    g = enumStruct(me, structures.vtolFactories).sort(distanceToBase);
                    break
               }
               default:
          }
          for (var A = 0, M = g.length; A < M; ++A)
          if (g[A].modules < o[W]) {
               if (1 === g[A].modules) {
                    if (2 === W && -50 > getRealPower() && !componentAvailable("Body11ABT")) continue;
                    if (3 === W && -200 > getRealPower() && !componentAvailable("Body7ABT")) continue
               }
               y = g[A], m = n[W];
               break
          }
     }
     return y && !checkLowPower(50) && buildStuff(y, m)
}
const tankBody = ["Body14SUP", "Body13SUP", "Body10MBT", "Body11ABT", "Body5REC", "Body1REC"],
sysBody = ["Body3MBT", "Body4ABT", "Body1REC"],
sysProp = ["hover01", "wheeled01"],
vtolBody = ["Body7ABT", "Body6SUPP", "Body8MBT", "Body5REC"],
repairTurrets = ["HeavyRepair", "LightRepair1"];

function chooseRandomWeapon() {
     var n, o = !1;
     switch (random(6)) {
          case 0:
          n = subpersonalities[personality].primaryWeapon;
          break;
          case 1:
          turnOffMG && "AM" !== personality || (n = weaponStats.machineguns);
          break;
          case 2:
          n = subpersonalities[personality].artillery;
          break;
          case 3:
          n = weaponStats.lasers;
          break;
          case 4:
          n = subpersonalities[personality].secondaryWeapon, o = !0;
          break;
          case 5:
          n = weaponStats.AS;
          break;
          default:
          n = subpersonalities[personality].primaryWeapon;
     }
     return isDefined(n) || (n = subpersonalities[personality].primaryWeapon), {
          weaponLine: n,
          shift: o
     }
}

function shuffleWeaponList(n, o) {
     for (var R = [], y = 0, m = n.length; y < m; ++y) R.push(n[y].stat);
     return o && 1 < R.length && R.shift(), R.reverse(), R
}

function chooseWeaponType(n) {
     var o = n;
     return o = isDefined(n.fastFire) && 50 > random(101) ? n.fastFire : n.weapons, o
}

function chooseRandomCyborgWeapon() {
     var n;
     switch (random(4)) {
          case 0:
          n = subpersonalities[personality].primaryWeapon;
          break;
          case 1:
          n = weaponStats.lasers;
          break;
          case 2:
          n = subpersonalities[personality].secondaryWeapon;
          break;
          case 3:
          componentAvailable("Mortar3ROTARYMk1") || (n = subpersonalities[personality].artillery);
          break;
          default:
          n = subpersonalities[personality].primaryWeapon;
     }
     return n
}

function chooseRandomVTOLWeapon() {
     var n, o = !1;
     switch (random(5)) {
          case 0:
          "mg" !== returnPrimaryAlias() && "fl" !== returnPrimaryAlias() && (n = subpersonalities[personality].primaryWeapon);
          break;
          case 1:
          n = weaponStats.lasers;
          break;
          case 2:
          n = subpersonalities[personality].secondaryWeapon;
          break;
          case 3:
          n = weaponStats.bombs;
          break;
          case 4:
          n = weaponStats.empBomb, o = !0;
          break;
          default:
          n = weaponStats.lasers;
     }
     return isDefined(n) && (o || !(0 >= n.vtols.length - 1)) || (n = weaponStats.bombs), n.vtols
}

function choosePersonalityWeapon(n) {
     var o, R = [];
     if (isDefined(n) || (n = "TANK"), "TANK" === n) {
          const g = ["PlasmaHeavy", "MortarEMP"];
          if (o = chooseRandomWeapon(), R = shuffleWeaponList(chooseWeaponType(o.weaponLine), o.shift), o = o.weaponLine, componentAvailable("tracked01") && 1 >= random(101) && (difficulty === HARD || difficulty === INSANE) && R.push(g[random(g.length)]), !turnOffMG && !isDesignable(R)) {
               R = [];
               for (var m = weaponStats.machineguns.weapons.length - 1; 0 <= m; --m) R.push(weaponStats.machineguns.weapons[m].stat)
          }
     } else if ("CYBORG" === n) o = chooseRandomCyborgWeapon();
     else if ("VTOL" === n) {
          o = chooseRandomVTOLWeapon();
          for (var m = o.length - 1; 0 <= m; --m) R.push(o[m].stat)
     }
     return "CYBORG" !== n && isDefined(o) ? R : o
}

function useHover(n) {
     if (!isDefined(n)) return !1;
     if (forceHover) return !0;
     for (var o = !1, R = 0, y = n.length; R < y; ++R) {
          if ("Flame1Mk1" === n[R] || "Flame2" === n[R] || "PlasmiteFlamer" === n[R]) {
               o = !0;
               break
          }
          if ("Rocket-LtA-T" === n[R] || "Rocket-HvyA-T" === n[R] || "Missile-A-T" === n[R]) {
               o = !!(20 >= random(101));
               break
          }
          if ("Laser3BEAMMk1" === n[R] || "Laser2PULSEMk1" === n[R] || "HeavyLaser" === n[R]) {
               o = !!(35 >= random(101));
               break
          }
     }
     return (!0 == o || 15 >= random(101)) && "Laser4-PlasmaCannon" !== n[0]
}

function pickGroundPropulsion() {
     var n = ["tracked01", "HalfTrack", "wheeled01"];
     return 67 > random(101) && n.shift(), n
}

function buildAttacker(n) {
     if (!isDefined(forceHover) || !isDefined(seaMapWithLandEnemy) || !isDefined(turnOffMG)) return !1;
     if (forceHover && !seaMapWithLandEnemy && !componentAvailable("hover01")) return !1;
     var o = choosePersonalityWeapon("TANK");
     if (!isDefined(o)) return !1;
     if (useHover(o) && componentAvailable("hover01")) {
          if (!random(3) && componentAvailable("Body14SUP") && componentAvailable("EMP-Cannon")) {
               if ("MortarEMP" !== o && isDefined(n) && buildDroid(n, "Hover EMP Droid", tankBody, "hover01", "", "", o, "EMP-Cannon")) return !0;
          } else if (isDefined(n) && buildDroid(n, "Hover Droid", tankBody, "hover01", "", "", o, o)) return !0;
     } else if (!random(3) && componentAvailable("Body14SUP") && componentAvailable("EMP-Cannon")) {
          if ("MortarEMP" !== o && isDefined(n) && buildDroid(n, "EMP Droid", tankBody, pickGroundPropulsion(), "", "", o, "EMP-Cannon")) return !0;
     } else if (isDefined(n) && buildDroid(n, "Droid", tankBody, pickGroundPropulsion(), "", "", o, o)) return !0;
     return !1
}

function buildSys(n, o) {
     return isDefined(o) || (o = ["Sensor-WideSpec", "SensorTurret1Mk1"]), isDefined(n) && buildDroid(n, "System unit", sysBody, sysProp, "", "", o)
}

function buildCyborg(n) {
     var o, R, y, m = choosePersonalityWeapon("CYBORG");
     if (!isDefined(m)) return !1;
     for (var g = m.templates.length - 1; 0 <= g; --g)
     if (R = m.templates[g].body, y = m.templates[g].prop, o = m.templates[g].weapons[0], "CyborgFlamer01" !== o && isDefined(n) && buildDroid(n, o + " Cyborg", R, y, "", "", o, o)) return !0;
     return !1
}

function buildVTOL(n) {
     var o = choosePersonalityWeapon("VTOL");
     return isDefined(n) && isDefined(o) && buildDroid(n, "VTOL unit", vtolBody, "V-Tol", "", "", o, o)
}

function produce() {
     const n = -100,
     o = 4;
     for (var B, m = enumStruct(me, structures.factories), g = enumStruct(me, structures.templateFactories), W = enumStruct(me, structures.vtolFactories), A = m.length, M = 0, h = 0, T = 0, C = 0; C < A; ++C) B = getDroidProduction(m[C]), null !== B && (B.droidType === DROID_CONSTRUCT && (M += 1), B.droidType === DROID_SENSOR && (h += 1), B.droidType === DROID_REPAIR && (T += 1));
     for (var L = 0; L < A; ++L)
     if (isDefined(m[L]) && structureIdle(m[L]) && getRealPower() > n)
     if (countDroid(DROID_CONSTRUCT, me) + M < o) playerAlliance(!0).length && countDroid(DROID_CONSTRUCT, me) < o && 3e4 < gameTime && sendChatMessage("need truck", ALLIES), buildSys(m[L], "Spade1Mk1");
     else if (enumGroup(sensorGroup).length + h < 2) buildSys(m[L]);
     else if (6 < enumGroup(attackGroup).length && enumGroup(repairGroup).length + T < 3) buildSys(m[L], repairTurrets);
     else {
          if (2 > m[L].modules && componentAvailable("Body11ABT")) continue;
          buildAttacker(m[L])
     }
     if (!turnOffCyborgs)
     for (var L = 0, k = g.length; L < k; ++L) isDefined(g[L]) && structureIdle(g[L]) && getRealPower() > n && buildCyborg(g[L]);
     for (var L = 0, H = W.length; L < H; ++L) isDefined(W[L]) && structureIdle(W[L]) && getRealPower() > n && buildVTOL(W[L])
}

function droidReady(n) {
     return !repairDroid(n, !1) && n.order !== DORDER_ATTACK && n.order !== DORDER_RTR && n.order !== DORDER_RECYCLE && vtolReady(n)
}

function isPlasmaCannon(n) {
     return "Laser4-PlasmaCannon" === n.weapons[0].name
}

function vtolArmed(n, o) {
     if (n.type === DROID) {
          if (!isVTOL(n)) return !1;
          for (var R = 0, y = n.weapons.length; R < y; ++R)
          if (n.weapons[R].armed >= o) return !0;
          return !1
     }
}

function returnEnemyFactories(n) {
     isDefined(n) || (n = getMostHarmfulPlayer());
     var o = enumStruct(n, structures.factories);
     return o = appendListElements(o, enumStruct(n, structures.templateFactories)), o = appendListElements(o, enumStruct(n, structures.vtolFactories)), o.sort(distanceToBase), o
}

function vtolReady(n) {
     if (!isVTOL(n)) return !0;
     return n.order !== DORDER_ATTACK && (!!vtolArmed(n, 1) || (n.order !== DORDER_REARM && orderDroid(n, DORDER_REARM), !1))
}

function repairDroid(n, o) {
     const m = 58 + Math.floor(n.experience / 22);
     return isDefined(o) || (o = !1), Math.floor(n.health) <= 33 && (o = !0), n.order === DORDER_RTR && (100 > Math.floor(n.health) || o) || countStruct(structures.extras[0]) && (o || Math.floor(n.health) <= m) && (orderDroid(n, DORDER_RTR), !0)
}

function chooseGroup() {
     for (var n = enumGroup(attackGroup), o = enumGroup(cyborgGroup), R = enumGroup(vtolGroup), y = R.length, m = 0; m < y; ++m) vtolReady(R[m]);
     if (o.length > MIN_ATTACK_DROIDS && random(2)) return o;
     return n.length > MIN_ATTACK_DROIDS && random(2) ? n : y > MIN_ATTACK_DROIDS && random(2) ? R : n
}

function findEnemyDerricks(n) {
     var o = [];
     if (!isDefined(n)) {
          for (var R = findLivingEnemies(), y = 0, m = R.length; y < m; ++y) o = appendListElements(o, enumStruct(R[y], structures.derricks));
          isDefined(getScavengerNumber()) && !allianceExistsBetween(getScavengerNumber(), me) && (o = appendListElements(o, enumStruct(getScavengerNumber(), structures.derricks)))
     } else o = enumStruct(n, structures.derricks);
     return o
}

function findNearestEnemyDroid(n, o) {
     isDefined(o) || (o = getMostHarmfulPlayer());
     var R = enumDroid(o);
     R.length && (R.sort(distanceToBase), droidReady(n) && isDefined(R[0]) && droidCanReach(n, R[0].x, R[0].y) && (isPlasmaCannon(n) ? orderDroidObj(n, DORDER_ATTACK, R[0]) : orderDroidLoc(n, DORDER_SCOUT, R[0].x, R[0].y)))
}

function findNearestEnemyStructure(n, o, R) {
     isDefined(o) || (o = getMostHarmfulPlayer());
     var y = isDefined(R) ? R : enumStruct(o).filter(function(g) {
          return g.stattype !== WALL
     });
     if (0 === y.length && (y = enumStruct(o)), 0 < y.length) {
          y.sort(distanceToBase);
          var m = y[0];
          droidReady(n) && isDefined(m) && droidCanReach(n, m.x, m.y) && orderDroidObj(n, DORDER_ATTACK, m)
     } else findNearestEnemyDroid(n, o)
}

function attackWithGroup(n, o, R) {
     if (isDefined(n)) {
          isDefined(o) || (o = getMostHarmfulPlayer());
          var y = n.length;
          if (y < MIN_ATTACK_DROIDS) return !1;
          var m;
          isDefined(R) && R.length && (R.sort(distanceToBase), m = R[0]);
          for (var g = 0; g < y; g++) isDefined(n[g]) && droidReady(n[g]) && (isDefined(m) && droidCanReach(n[g], m.x, m.y) ? isPlasmaCannon(n[g]) || m.type === STRUCTURE ? orderDroidObj(n[g], DORDER_ATTACK, m) : orderDroidLoc(n[g], DORDER_SCOUT, m.x, m.y) : findNearestEnemyStructure(n[g], o))
     }
}

function chatTactic(n) {
     const o = averageOilPerPlayer();
     var y, R = lastMsg.slice(0, -1);
     return "attack" !== R && "oil" !== R && (countStruct(structures.derricks) > o && enumDroid(me) > MIN_ATTACK_DROIDS ? sendChatMessage("attack" + n, ALLIES) : (sendChatMessage("oil" + n, ALLIES), chatAttackOil(n), y = !0)), y
}

function attackStuff(n) {
     var o = getMostHarmfulPlayer();
     isDefined(n) && !allianceExistsBetween(n, me) && n !== me && (o = n);
     isDefined(chatTactic(o)) || (attackWithGroup(enumGroup(attackGroup), o), !turnOffCyborgs && attackWithGroup(enumGroup(cyborgGroup), o), attackWithGroup(enumGroup(vtolGroup), o))
}

function spyRoutine() {
     var n = enumGroup(sensorGroup),
     o = enumGroup(artilleryGroup),
     R = o.length,
     y = n.length;
     if (!(y * R)) return !1;
     n = sortAndReverseDistance(n);
     for (var g, h, m = findLivingEnemies(), W = [], A = 0, M = m.length; A < M; ++A) h = rangeStep(m[A]), isDefined(h) && W.push(h);
     if (W.length && (W.sort(distanceToBase), g = W[0], !!isDefined(g))) {
          orderDroidObj(n[0], DORDER_OBSERVE, g);
          for (var A = 0; A < R; ++A) isDefined(g) && isDefined(o[A]) && droidReady(o[A]) && droidCanReach(o[A], g.x, g.y) && orderDroidObj(o[A], DORDER_ATTACK, g)
     }
}

function attackEnemyOil() {
     var n = chooseGroup(),
     o = n.length,
     R = 0;
     if (!(o < MIN_ATTACK_DROIDS)) {
          var y = findEnemyDerricks();
          if (y.length) {
               y.sort(distanceToBase);
               for (var m = 0; m < o; ++m) isDefined(n[m]) && droidReady(n[m]) && (isDefined(y[R]) || (R += 1), isDefined(y[R]) && droidCanReach(n[m], y[R].x, y[R].y) && (isPlasmaCannon(n[m]) ? orderDroidObj(n[m], DORDER_ATTACK, y[R]) : orderDroidLoc(n[m], DORDER_SCOUT, y[R].x, y[R].y)))
          }
     }
}

function battleTactics() {
     const n = averageOilPerPlayer(),
     o = getMostHarmfulPlayer();
     if (countStruct(structures.derricks) < n || -200 > getRealPower()) attackEnemyOil();
     else if (grudgeCount[o] > 300) {
          const W = returnEnemyFactories();
          W.length ? attackWithGroup(chooseGroup(), o, W) : grudgeCount[o] = 0
     } else {
          var y = chooseGroup(),
          m = y.length;
          if (m < MIN_ATTACK_DROIDS) return;
          for (var g = 0; g < m; ++g) isDefined(y[g]) && droidReady(y[g]) && findNearestEnemyStructure(y[g], o)
     }
}

function recycleDroidsForHover() {
     var o = enumDroid(me, DROID_CONSTRUCT);
     o = appendListElements(o, enumDroid(me, DROID_SENSOR)), o = appendListElements(o, enumDroid(me, DROID_REPAIR)), o.filter(function(A) {
          return "hover01" != A.propulsion
     });
     var R = unfinishedStructures();
     const y = o.length;
     if (countStruct(structures.factories) > 1 && componentAvailable("hover01")) {
          if (!R.length && y)
          for (var m = 0; m < y; ++m) orderDroid(o[m], DORDER_RECYCLE);
          if (forceHover || y || removeThisTimer("recycleDroidsForHover"), forceHover) {
               var g = enumGroup(attackGroup).filter(function(M) {
                    return M.droidType == DROID_WEAPON && "hover01" != M.propulsion
               });
               const A = g.length;
               for (var W = 0; W < A; ++W) orderDroid(g[W], DORDER_RECYCLE);
               A + y || removeThisTimer("recycleDroidsForHover")
          }
     }
}

function chatAttackOil(n) {
     var o = findEnemyDerricks(n),
     R = chooseGroup(),
     y = R.length;
     if (!o.length || y < MIN_ATTACK_DROIDS) return !1;
     o.sort(distanceToBase);
     for (var m = 0; m < y; ++m) isDefined(R[m]) && droidReady(R[m]) && isDefined(o[0]) && orderDroidObj(R[m], DORDER_ATTACK, o[0])
}

function repairDamagedDroids() {
     var n = enumGroup(repairGroup),
     o = n.length;
     if (o) {
          var R = appendListElements(R, enumGroup(attackGroup));
          R = appendListElements(R, enumGroup(cyborgGroup));
          var y = R.length;
          if (y) {
               R.sort(sortDroidsByHealth);
               for (var m = 0; m < o; ++m)
               for (var g = 0; g < y; ++g)
               if (isDefined(n[m]) && !repairDroid(n[m], !1) && isDefined(R[g]) && 100 > Math.ceil(R[g].health) && (orderDroidLoc(n[m], DORDER_SCOUT, R[g].x, R[g].y), 6 < distBetweenTwoPoints(n[m].x, n[m].y, R[g].x, R[g].y))) {
                    orderDroidLoc(n[m], DORDER_MOVE, R[g].x, R[g].y);
                    break
               }
          }
     }
}

function targetPlayer(n) {
     const o = 50;
     var R = getMostHarmfulPlayer();
     n === R || grudgeCount[n] + o < MIN_GRUDGE && (grudgeCount[n] = grudgeCount[R] + o)
}

function cleanResearchItem(n, o) {
     var R = findResearch(n, o).reverse();
     return 0 === R.length ? R : removeDuplicateItems(R)
}

function completeRequiredResearch(n) {
     log("Searching for required research of item: " + n);
     for (var o = cleanResearchItem(n, me), R = 0, y = o.length; R < y; ++R) log("\tFound: " + o[R].name), enableResearch(o[R].name, me), completeResearch(o[R].name, me)
}

function analyzeDroidAlloys(n) {
     for (var m, o = n.droidType == DROID_CYBORG ? "cyborg" : "tank", R = "cyborg" == o ? "R-Cyborg-Metals0" : "R-Vehicle-Metals0", y = "cyborg" == o ? "R-Cyborg-Armor-Heat0" : "R-Vehicle-Armor-Heat0", g = 0; 2 > g; ++g)
     for (var W = 1; 10 > W; ++W) {
          var m = 0 === g ? R : y,
          A = cleanResearchItem(m + W, n.player);
          if (0 === A.length) {
               var M = m + W;
               if (0 < findResearch(M).length) {
                    completeRequiredResearch(M);
                    break
               }
          }
     }
}

function analyzeComponent(n, o, R) {
     var y, m = !1;
     if (isDefined(o) && !componentAvailable(o))
     for (var g = 0, W = n.length; g < W; ++g)
     if (y = R.droidType === DROID_CYBORG ? n[g].weapons[0] : n[g].stat, y === o) {
          completeRequiredResearch(n[g].res), logObj(R, "Assimilated player " + R.player + "'s technology -> " + o + "."), makeComponentAvailable(o, me), m = !0;
          break
     }
     return m
}

function analyzeDroidComponents(n) {
     var y, o = n.body,
     R = n.propulsion;
     if (isDefined(n.weapons[0]) && (y = n.weapons[0].name), isDefined(y) && 0 < n.weapons.length && isDefined(n.weapons[1]) && isDesignable(y) && (y = n.weapons[1].name), analyzeComponent(bodyStats, o, n), analyzeComponent(propulsionStats, R, n), isDefined(y) && !isDesignable(y, o, R)) {
          var m = !1;
          for (var g in weaponStats)
          if (isVTOL(n) ? m = analyzeComponent(weaponStats[g].vtols, y, n) : n.droidType == DROID_WEAPON ? m = analyzeComponent(weaponStats[g].weapons, y, n) : n.droidType == DROID_CYBORG && (m = analyzeComponent(weaponStats[g].templates, y, n)), !0 == m) break
     }
}

function stealEnemyTechnology(n) {
     analyzeDroidComponents(n), analyzeDroidAlloys(n)
}

function malfunctionDroid() {
     var n = playerAlliance(!1),
     o = n[random(n.length)],
     R = enumDroid(o).filter(function(T) {
          return T.droidType !== DROID_SENSOR && T.droidType !== DROID_CONSTRUCT
     }),
     y = R.length;
     if (2 < y)
     if (random(2)) {
          var m = R[random(y)],
          g = R[random(y)];
          logObj(m, "Enemy droid told to attack its own units"), isDefined(m) && isDefined(g) && m !== g && orderDroidObj(m, DORDER_ATTACK, g)
     } else
     for (var W = 0; W < y; ++W)
     if (!random(4) && isDefined(R[W])) {
          var A = R[W],
          M = enumRange(A.x, A.y, 40, ALL_PLAYERS, !1).filter(function(T) {
               return T.type === DROID && allianceExistsBetween(T, o) || T.player === o
          });
          if (0 < M.length) {
               var h = M[random(M.length)];
               isDefined(A) && isDefined(h) && orderDroidObj(A, DORDER_ATTACK, h)
          } else break
     }
}

function analyzeRandomEnemyDroid() {
     var n = playerAlliance(!1),
     o = n[random(n.length)],
     R = enumDroid(o).filter(function(g) {
          return isVTOL(g) || g.droidType === DROID_WEAPON || g.droidType === DROID_CYBORG || g.droidType === DROID_SENSOR
     }),
     y = R.length;
     if (y) {
          var m = R[random(y)];
          stealEnemyTechnology(m), 20 >= random(100) && donateObject(m, me)
     }
}

function nexusWave() {
     return isDefined(nexusWaveOn) && !nexusWaveOn ? void removeThisTimer("nexusWave") : void(isDefined(nexusWaveOn) && nexusWaveOn && countStruct(structures.hqs) && (analyzeRandomEnemyDroid(), 15 >= random(100) && malfunctionDroid()))
}

function getScavengerNumber() {
     for (var n, o = maxPlayers; 11 > o; ++o)
     if (0 < enumStruct(o).length) {
          n = o;
          break
     }
     return n
}

function checkIfSeaMap() {
     var n = !1;
     seaMapWithLandEnemy = !1;
     for (var o = 0; o < maxPlayers; ++o)
     if (!propulsionCanReach("wheeled01", startPositions[me].x, startPositions[me].y, startPositions[o].x, startPositions[o].y)) {
          for (var R = 0, y = 0; y < maxPlayers; ++y) propulsionCanReach("hover01", startPositions[o].x, startPositions[o].y, startPositions[y].x, startPositions[y].y) || ++R;
          if (R != maxPlayers - 1) {
               n = !0;
               break
          }
     }
     if (!0 == n)
     for (var o = 0; o < maxPlayers; ++o) {
          if (propulsionCanReach("wheeled01", startPositions[me].x, startPositions[me].y, startPositions[o].x, startPositions[o].y) && o !== me && !allianceExistsBetween(o, me) && 0 < enumDroid(o).length) {
               seaMapWithLandEnemy = !0;
               break
          }
          if (!0 === seaMapWithLandEnemy) break
     }
     return n
}

function freeForAll() {
     for (var n = !0, o = 0; o < maxPlayers; ++o)
     if (o != me && !allianceExistsBetween(o, me)) {
          var R = countStruct("A0LightFactory", o) + countStruct("A0CyborgFactory", o),
          y = countDroid(DROID_ANY, o);
          if (0 < y || 0 < R) {
               n = !1;
               break
          }
     }
     if (!0 == n) {
          var m = playerAlliance(!0),
          g = m.length;
          if (g) {
               isDefined(getScavengerNumber()) && allianceExistsBetween(getScavengerNumber(), me) && setAlliance(getScavengerNumber(), me, !1);
               for (var W = 0; W < g; ++W) chat(m[W], "FREE FOR ALL!"), setAlliance(m[W], me, !1)
          }
     }
}

function CheckStartingBases() {
     if ("AL" === personality) return !0;
     for (var n = subpersonalities[personality].primaryWeapon.weapons.length, o = 0; o < n; ++o)
     if (isDesignable(subpersonalities[personality].primaryWeapon.weapons[o].stat)) return !0;
     return !1
}

function countAllResources() {
     for (var R, n = enumFeature(-1, oilResources), o = 0; o < maxPlayers; ++o) {
          R = enumStruct(o, structures.derricks);
          for (var y = 0, m = R.length; y < m; ++y) n.push(R[y])
     }
     return isDefined(getScavengerNumber()) && (n = appendListElements(n, enumStruct(getScavengerNumber(), structures.derricks))), n.length
}

function averageOilPerPlayer() {
     return countAllResources() / maxPlayers
}

function mapOilLevel() {
     var n = averageOilPerPlayer(),
     o = "";
     return o = 8 >= n ? "LOW" : 8 < n && 16 >= n ? "MEDIUM" : "HIGH", o
}
const TANK_ARMOR = ["R-Vehicle-Metals09", "R-Vehicle-Armor-Heat09"],
CYBORG_ARMOR = ["R-Cyborg-Metals09", "R-Cyborg-Armor-Heat09"],
ESSENTIALS = ["R-Wpn-MG1Mk1", "R-Wpn-MG-Damage02", "R-Struc-PowerModuleMk1"],
PROPULSION = ["R-Vehicle-Prop-Hover", "R-Vehicle-Prop-Tracks"],
START_BODY = ["R-Vehicle-Body05", "R-Vehicle-Body11"],
REPAIR_UPGRADES = ["R-Struc-RprFac-Upgrade01", "R-Sys-MobileRepairTurretHvy", "R-Sys-Autorepair-General", "R-Struc-RprFac-Upgrade06"],
FLAMER = ["R-Wpn-Flame2", "R-Wpn-Flamer-ROF03", "R-Wpn-Flamer-Damage09"],
SENSOR_TECH = ["R-Sys-Sensor-Upgrade03", "R-Sys-CBSensor-Tower01", "R-Sys-RadarDetector01", "R-Sys-ECM-Upgrade02", "R-Sys-Sensor-WSTower"],
STRUCTURE_DEFENSE_UPGRADES = ["R-Struc-Materials09", "R-Defense-WallUpgrade12"],
BODY_RESEARCH = ["R-Vehicle-Body11", "R-Vehicle-Body10", "R-Vehicle-Body14"];
var techlist, weaponTech, mgWeaponTech, laserTech, artilleryTech, artillExtra, laserExtra, extraTech, cyborgWeaps, antiAirTech, antiAirExtras, extremeLaserTech, secondaryWeaponTech, secondaryWeaponExtra, defenseTech;

function updateResearchList(n, o) {
     isDefined(o) || (o = 0);
     for (var R = [], y = 0, m = n.length - o; y < m; ++y) isDefined(n[y].res) ? R.push(n[y].res) : R.push(n[y]);
     return R
}

function initializeResearchLists() {
     techlist = subpersonalities[personality].res, antiAirTech = updateResearchList(subpersonalities[personality].antiAir.defenses), antiAirExtras = updateResearchList(subpersonalities[personality].antiAir.extras), extremeLaserTech = updateResearchList(weaponStats.AS.extras), mgWeaponTech = updateResearchList(weaponStats.machineguns.weapons), laserTech = updateResearchList(weaponStats.lasers.weapons), laserExtra = updateResearchList(weaponStats.lasers.extras), weaponTech = updateResearchList(subpersonalities[personality].primaryWeapon.weapons), artilleryTech = updateResearchList(subpersonalities[personality].artillery.weapons), artillExtra = updateResearchList(subpersonalities[personality].artillery.extras), extraTech = updateResearchList(subpersonalities[personality].primaryWeapon.extras), secondaryWeaponTech = updateResearchList(subpersonalities[personality].secondaryWeapon.weapons), secondaryWeaponExtra = updateResearchList(subpersonalities[personality].secondaryWeapon.extras), defenseTech = updateResearchList(subpersonalities[personality].primaryWeapon.defenses), cyborgWeaps = updateResearchList(subpersonalities[personality].primaryWeapon.templates)
}

function evalResearch(n, o) {
     var R = pursueResearch(n, o);
     if (!R)
     for (var y = 0, m = o.length; y < m && (R = pursueResearch(n, o[y]), !R); ++y);
     return R
}

function eventResearched() {
     if (isDefined(techlist) && isDefined(turnOffMG) && isDefined(turnOffCyborgs))
     for (var o = enumStruct(me, structures.labs), R = 0, y = o.length; R < y; ++R) {
          var m = o[R],
          g = !1;
          if (m.status === BUILT && structureIdle(m) && getRealPower() > -230) {
               if (g = pursueResearch(m, ESSENTIALS), g || "AL" !== personality || (g = evalResearch(m, techlist)), g || (g = pursueResearch(m, fastestResearch)), g || (g = pursueResearch(m, "R-Struc-Power-Upgrade03a")), g || (g = pursueResearch(m, "R-Vehicle-Prop-Halftracks")), g || "AL" === personality || (g = evalResearch(m, techlist)), g || (g = evalResearch(m, START_BODY)), g || (g = evalResearch(m, PROPULSION)), g || random(4) || (g = evalResearch(m, TANK_ARMOR)), g || (g = evalResearch(m, REPAIR_UPGRADES)), turnOffMG && "mg" !== returnPrimaryAlias() || (!g && (g = pursueResearch(m, mgWeaponTech)), !g && (g = pursueResearch(m, "R-Wpn-MG-Damage08"))), g || "fl" !== returnPrimaryAlias() && "fmor" !== returnArtilleryAlias() || (g = evalResearch(m, FLAMER)), g || (g = pursueResearch(m, "R-Struc-Factory-Upgrade09")), random(2) && (!g && (g = evalResearch(m, extraTech)), !g && !turnOffCyborgs && (g = evalResearch(m, cyborgWeaps)), !g && (g = evalResearch(m, weaponTech)), !g && random(3) && (g = evalResearch(m, defenseTech))), g || (g = evalResearch(m, SENSOR_TECH)), random(3) && (!g && (g = evalResearch(m, artilleryTech)), !g && (g = evalResearch(m, artillExtra)), !random(3) && (!g && (g = pursueResearch(m, "R-Wpn-PlasmaCannon")), !g && (g = evalResearch(m, extremeLaserTech)))), ("las" === returnAntiAirAlias() || countEnemyVTOL()) && (!g && (g = evalResearch(m, antiAirTech)), !g && (g = evalResearch(m, antiAirExtras))), random(4) && (!g && !turnOffCyborgs && (g = pursueResearch(m, "R-Cyborg-Hvywpn-PulseLsr")), !g && (g = evalResearch(m, laserTech)), !g && (g = evalResearch(m, laserExtra))), random(4)) {
                    g || (g = evalResearch(m, ["R-Struc-VTOLPad-Upgrade02", "R-Wpn-Bomb02", "R-Wpn-Bomb05", "R-Wpn-Bomb-Accuracy03", "R-Struc-VTOLPad-Upgrade06", "R-Wpn-Bomb06"]))
               }
               if (g || turnOffCyborgs || !random(2) || (g = evalResearch(m, CYBORG_ARMOR)), !g && random(2) && (g = pursueResearch(m, STRUCTURE_DEFENSE_UPGRADES)), g || (g = pursueResearch(m, "R-Sys-Resistance-Circuits")), g || (g = evalResearch(m, BODY_RESEARCH)), random(3)) {
                    var W = appendListElements(W, updateResearchList(subpersonalities[personality].secondaryWeapon.templates)),
                    A = subpersonalities[personality].primaryWeapon.weapons.length - 1;
                    isDesignable(subpersonalities[personality].primaryWeapon.weapons[A].stat) && (!g && !turnOffCyborgs && W.length && (g = pursueResearch(m, W)), !g && (g = evalResearch(m, secondaryWeaponExtra)), !g && (g = evalResearch(m, secondaryWeaponTech)))
               }
               g || (g = evalResearch(m, FLAMER)), g || (g = pursueResearch(m, "R-Wpn-LasSat")), !g && componentAvailable("Body14SUP") && isDesignable("EMP-Cannon") && isStructureAvailable(structures.extras[2]) && (researchComplete = !0)
          }
     }
}

function eventGameInit() {
    attackGroup = newGroup(), vtolGroup = newGroup(), cyborgGroup = newGroup(), sensorGroup = newGroup(), repairGroup = newGroup(), artilleryGroup = newGroup(), lastMsg = "eventGameInit", addDroidsToGroup(attackGroup, enumDroid(me, DROID_WEAPON).filter(function(a) {
        return !a.isCB
    })), addDroidsToGroup(cyborgGroup, enumDroid(me, DROID_CYBORG)), addDroidsToGroup(vtolGroup, enumDroid(me).filter(function(a) {
        return isVTOL(a)
    })), addDroidsToGroup(sensorGroup, enumDroid(me, DROID_SENSOR)), addDroidsToGroup(repairGroup, enumDroid(me, DROID_REPAIR)), addDroidsToGroup(artilleryGroup, enumDroid(me, DROID_WEAPON).filter(function(a) {
        return a.isCB
    }))
}

function eventStartLevel() {
    initiaizeRequiredGlobals(), recycleDroidsForHover(), buildOrder();
    const a = difficulty === EASY ? 4e3 + (1 + random(4)) * random(1200) : 0;
    setTimer("buildOrder", a + 425 + 3 * random(60)), setTimer("produce", a + 1500 + 3 * random(70)), setTimer("repairDamagedDroids", a + 2200 + 4 * random(60)), setTimer("switchOffMG", a + 3e3 + 5 * random(60)), setTimer("spyRoutine", a + 4500 + 4 * random(60)), setTimer("eventResearched", a + 6500 + 3 * random(70)), setTimer("battleTactics", THINK_LONGER + 7e3 + 5 * random(60)), setTimer("nexusWave", a + 1e4 + 3 * random(70)), setTimer("recycleDroidsForHover", THINK_LONGER + 15000 + 2 * random(60)), setTimer("StopTimersIfDead", a + 1e5 + 5 * random(70))
}

function eventStructureBuilt(a, b) {
    if (isDefined(b) && a.stattype === RESOURCE_EXTRACTOR) {
        var e = enumRange(b.x, b.y, 8, ALL_PLAYERS, !1);
        if (e = e.filter(function(g) {
                return g.type === FEATURE && g.stattype === OIL_RESOURCE
            }), e.sort(distanceToBase), e.length && isDefined(e[0])) b.busy = !1, orderDroidBuild(b, DORDER_BUILD, structures.derricks, e[0].x, e[0].y);
        else if (-120 < getRealPower() && countStruct(structures.derricks) > averageOilPerPlayer()) {
            var f;
            buildStuff(getDefenseStructure(), f, a)
        }
    } else if ((!turnOffMG && 8e4 < gameTime || turnOffMG) && maintenance()) return
}

function eventDroidIdle(a) {
    if (a.player === me && isDefined(a) && (a.droidType === DROID_WEAPON || a.droidType === DROID_CYBORG || isVTOL(a))) {
        var b = enumRange(a.x, a.y, 10, ENEMIES, !1);
        0 < b.length && (b.sort(distanceToBase), orderDroidLoc(a, DORDER_SCOUT, b[0].x, b[0].y))
    }
}

function eventDroidBuilt(a) {
    a && a.droidType !== DROID_CONSTRUCT && (isVTOL(a) ? groupAdd(vtolGroup, a) : a.droidType === DROID_SENSOR ? groupAdd(sensorGroup, a) : a.droidType === DROID_REPAIR ? groupAdd(repairGroup, a) : a.droidType === DROID_CYBORG ? groupAdd(cyborgGroup, a) : a.droidType === DROID_WEAPON && (a.isCB || a.hasIndirect ? groupAdd(artilleryGroup, a) : groupAdd(attackGroup, a)))
}

function eventAttacked(a, b) {
    if (!(a.player !== me || null === b || allianceExistsBetween(b.player, a.player))) {
        if (isDefined(getScavengerNumber()) && b.player === getScavengerNumber()) return isDefined(a) && isDefined(b) && a.type === DROID && !repairDroid(a, !1) && (a.droidType === DROID_WEAPON || a.droidType === DROID_CYBORG) && orderDroidObj(a, DORDER_ATTACK, b), void(!1 === stopExecution(0, 2e3) && attackStuff(getScavengerNumber()));
        if (b && a && b.player !== me && !allianceExistsBetween(b.player, a.player)) {
            if (grudgeCount[b.player] < MAX_GRUDGE && (grudgeCount[b.player] += a.type === STRUCTURE ? 20 : 5), a.type === DROID && countStruct(structures.extras[0]) && (a.droidType === DROID_SENSOR || a.droidType === DROID_CONSTRUCT ? orderDroid(a, DORDER_RTR) : 40 > Math.floor(a.health) ? repairDroid(a, !0) : repairDroid(a, !1)), !0 === stopExecution(0, 150)) return;
            var e;
            a.type === STRUCTURE ? e = chooseGroup() : (e = enumRange(a.x, a.y, 18, me, !1).filter(function(j) {
                return j.type === DROID && (j.droidType === DROID_WEAPON || j.droidType === DROID_CYBORG || isVTOL(j))
            }), 4 > e.length && (e = chooseGroup())), e.filter(function(j) {
                return droidCanReach(j, b.x, b.y)
            });
            var f = e.length;
            if (f < MIN_ATTACK_DROIDS) return;
            for (var g = !!(18 > distBetweenTwoPoints(startPositions[me].x, startPositions[me].y, b.x, b.y)), h = 0; h < f; h++) isDefined(e[h]) && isDefined(b) && (random(3) || g) && (g && !repairDroid(e[h]) ? orderDroidObj(e[h], DORDER_ATTACK, b) : droidReady(e[h]) && orderDroidLoc(e[h], DORDER_SCOUT, b.x, b.y))
        }
    }
}

function eventGroupLoss(a) {
    a.order === DORDER_RECYCLE || (!1 === stopExecution(3, 3e3) && addBeacon(a.x, a.y, ALLIES), 0 < playerAlliance(!0).length && (enumGroup(attackGroup).length < MIN_ATTACK_DROIDS && sendChatMessage("need tank", ALLIES), !turnOffCyborgs && countStruct(structures.templateFactories) && enumGroup(cyborgGroup).length < MIN_ATTACK_DROIDS && sendChatMessage("need cyborg", ALLIES), countStruct(structures.vtolFactories) && enumGroup(vtolGroup).length < MIN_ATTACK_DROIDS && sendChatMessage("need vtol", ALLIES)))
}

function eventBeacon(a, b, e, f) {
    if (!0 !== stopExecution(2, 2e3) && (allianceExistsBetween(e, f) || f === e)) {
        for (var h = enumGroup(cyborgGroup), j = enumGroup(attackGroup), k = enumGroup(vtolGroup), l = 0, m = h.length; l < m; l++) !repairDroid(h[l]) && droidCanReach(h[l], a, b) && orderDroidLoc(h[l], DORDER_SCOUT, a, b);
        for (var l = 0, n = j.length; l < n; l++) !repairDroid(j[l]) && droidCanReach(j[l], a, b) && orderDroidLoc(j[l], DORDER_SCOUT, a, b);
        for (var l = 0, o = k.length; l < o; l++) vtolReady(k[l]) && orderDroidLoc(k[l], DORDER_SCOUT, a, b)
    }
}

function eventObjectTransfer(a, b) {
    logObj(a, "eventObjectTransfer event. from: " + b + ". health: " + a.health), b !== me && allianceExistsBetween(b, me) && a.type === DROID && eventDroidBuilt(a, null), b === me || b !== a.player || allianceExistsBetween(a.player, me) || a.type !== DROID || eventDroidBuilt(a, null)
}

function eventDestroyed(a) {
    if (!(isDefined(getScavengerNumber()) && a.player === getScavengerNumber()) && a.player === me) {
        var b = enumRange(a.x, a.y, 8, ENEMIES, !1);
        b.sort(distanceToBase), b.length && grudgeCount[b[0].player] < MAX_GRUDGE && (grudgeCount[b[0].player] = grudgeCount[b[0].player] + 5)
    }
}

function eventStructureReady(a) {
    if (!isDefined(a)) {
        var b = enumStruct(me, structures.extras[2]);
        if (b.length) a = b[0];
        else return void queue("eventStructureReady", 1e4)
    }
    const e = returnEnemyFactories();
    var f = e.length;
    f ? activateStructure(a, e[random(f)]) : queue("eventStructureReady", 1e4, a)
}

function sendChatMessage(n, o) {
     isDefined(n) && (!isDefined(o) && (o = ALLIES), lastMsg !== n && (lastMsg = n, chat(o, n)))
}

function eventChat(n, o, R) {
     if (o === me && ("AC" === R || "AR" === R || "AB" === R || "AM" === R || "AL" === R ? allianceExistsBetween(n, o) && personality !== R && choosePersonality(R) : "toggle cyborg" === R && allianceExistsBetween(n, o) ? turnOffCyborgs = !turnOffCyborgs : "toggle mg" === R && allianceExistsBetween(n, o) ? turnOffMG = !turnOffMG : "stats" === R && allianceExistsBetween(n, o) ? getMostHarmfulPlayer("chatEvent") : "FFA" === R && allianceExistsBetween(n, o) ? freeForAll() : "toggle hover" === R && allianceExistsBetween(n, o) ? forceHover = !forceHover : "oil level" == R && allianceExistsBetween(n, o) && sendChatMessage("Map oil count is: " + mapOilLevel(), ALLIES), o !== n)) {
          if ("need truck" === R && allianceExistsBetween(n, o)) {
               var y = enumDroid(me, DROID_CONSTRUCT).filter(function(A) {
                    return 60 < A.health
               }),
               m = y.length;
               2 < m && donateObject(y[random(m)], n)
          } else "need power" === R && allianceExistsBetween(n, o) ? 50 < playerPower(me) && donatePower(playerPower(me) / 2, n) : "need tank" === R && allianceExistsBetween(n, o) ? donateFromGroup(enumGroup(attackGroup), n) : "need cyborg" === R && allianceExistsBetween(n, o) ? donateFromGroup(enumGroup(cyborgGroup), n) : "need vtol" === R && allianceExistsBetween(n, o) && donateFromGroup(enumGroup(vtolGroup), n);
          var g = R.slice(0, -1);
          if ("attack" === g) {
               var W = R.slice(-1);
               allianceExistsBetween(W, me) || W === me || attackStuff(W)
          } else if ("oil" === g) {
               var W = R.slice(-1);
               allianceExistsBetween(W, me) || W === me || chatAttackOil(W)
          } else if ("target" === g) {
               var W = R.slice(-1);
               allianceExistsBetween(W, me) || W === me || targetPlayer(W)
          }
     }
}

function switchOffMG() {
     return "mg" === returnPrimaryAlias() ? void removeThisTimer("switchOffMG") : void(isDesignable(subpersonalities[personality].primaryWeapon.weapons[0].stat) && (turnOffMG = !0, removeThisTimer("switchOffMG")))
}

function choosePersonality(n) {
     return isDefined(n) ? void(personality = n, initializeResearchLists(), sendChatMessage("Using personality: " + personality, ALLIES)) : adaptToMap()
}

function adaptToMap() {
     var n = "";
     const o = playerAlliance(!1).length - 1,
     R = playerAlliance(!0).length - 1,
     y = mapOilLevel(),
     m = isDesignable("Howitzer03-Rot"),
     g = ["AM", "AR", "AB", "AC", "AL"];
     if (!m && (1 == maxPlayers - 1 || "LOW" === y || baseType === CAMP_CLEAN)) n = g[random(2)];
     else if ("MEDIUM" === y || 0 != R && R < o) {
          var W = m && baseType !== CAMP_CLEAN ? 4 : 3;
          n = g[random(W) + 1]
     } else {
          var W = m && baseType !== CAMP_CLEAN ? 3 : 2;
          n = g[random(W) + 2]
     }
     return n
}
