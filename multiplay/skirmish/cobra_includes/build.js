
//Can a construction droid do something right now.
function conCanHelp(mydroid, bx, by) {
	return (mydroid.order != DORDER_HELPBUILD 
	        && mydroid.order != DORDER_BUILD
	        && mydroid.order != DORDER_LINEBUILD
			&& mydroid.busy != true
	        && droidCanReach(mydroid, bx, by));
}

//Build a certain number of something
function countAndBuild(stat, count) {
	if (countStruct(stat) < count)
		if (buildStuff(stat))
			return true;
	return false;
}

//Find a location to build something within a safe area.
function buildStructure(droid, stat) {
	var derricks = countStruct(structures.derricks);
	var loc;
	var dist;
	
	if (!isStructureAvailable(stat, me)) { return false; }
	if(isDefined(droid)) { loc = pickStructLocation(droid, stat, droid.x, droid.y, 0); }
	if (!isDefined(loc)) { return false; }	
	
	//Try not to build stuff in dangerous locations
	if(isDefined(droid))
		dist = distBetweenTwoPoints(startPositions[me].x, startPositions[me].y, droid.x, droid.y);
	else
		return false;
	
	if (isDefined(droid) && (!safeDest(me, loc.x, loc.y) || (dist > (8 + Math.floor(1.5 * derricks))))) {
		orderDroid(droid, DORDER_RTB);
		return false;
	}
	
	if(isDefined(droid) && orderDroidBuild(droid, DORDER_BUILD, stat, loc.x, loc.y))
		return true;
	return false;
}

//Build some object. Builds modules on structures also.
function buildStuff(struc, module) {
	var construct = enumDroid(me, DROID_CONSTRUCT);
	
	if (construct.length > 0) {
		var freeTrucks = [];
		for(var x = 0; x < construct.length; x++) {
			if (conCanHelp(construct[x], construct[x].x, construct[x].y)) {
				freeTrucks.push(construct[x]);
			}
		}
		
		if(freeTrucks.length > 0) {
			var truck = freeTrucks[random(freeTrucks.length)];
			
			if(isDefined(struc) && isDefined(module) && isDefined(truck)) {
				if(orderDroidBuild(truck, DORDER_BUILD, module, struc.x, struc.y))
					return true;
			}
			if(isDefined(truck) && isDefined(struc)) {
				if(buildStructure(truck, struc))
					return true;
			}
		}
	}
	return false;
}

//Check for unfinshed structures and help complete them.
function checkUnfinishedStructures() {
	var struct = unfinishedStructures();
	var breakOut = enumFeature(-1, oilResources).length;
	
	//Prevent trucks from moving to finished structures that were previously unfinished
	//or break away from building something to get oil.
	var allTrucks = enumDroid(me, DROID_CONSTRUCT);
	if((struct.length === 0) || ((gameTime > 280000) && (breakOut > 0))) {
		for(var i = 0; i < allTrucks.length; ++i) {
			allTrucks[i].busy = false;
		}
		if(breakOut > 0) { return false; }
	}
	
	if(struct.length > 0) {
		var trucks = enumDroid(me, DROID_CONSTRUCT).filter(function(obj){ 
			return conCanHelp(obj, struct[0].x, struct[0].y)
		});
	
		if(trucks.length > 0) {
			if (orderDroidObj(trucks[0], DORDER_HELPBUILD, struct[0]))
				return true;
		}
	}
	return false;
}

//Look for oil.
function lookForOil() {
	var droids = enumDroid(me, DROID_CONSTRUCT);
	var oils = enumFeature(-1, oilResources);
	var s = 0;
	
	if(droids.length <= 1) { return; }
	if (oils.length === 0) { return; }
	
	oils.sort(distanceToBase); // grab closer oils first
	for (var i = 0; i < oils.length; i++) {
		for (var j = 0; j < droids.length - (1 * (gameTime > 120000)); j++) {
			if(i + s >= oils.length)
				break;
					
			var safe = enumRange(oils[i + s].x, oils[i + s].y, 4, ENEMIES, false);
			if (!safe.length && conCanHelp(droids[j], oils[i + s].x, oils[i + s].y)) {
				droids[j].busy = true;
				orderDroidBuild(droids[j], DORDER_BUILD, structures.derricks, oils[i + s].x, oils[i + s].y);
				s += 1;
			}
		}
	}
}

//Only supports Anti-Air for now
function buildDefenses() {
	var enemies = playerAlliance(false);
	var enemyVtolCount = 0;
	
	for (var x = 0; x < enemies.length; ++x) {
		var temp = enumDroid(enemies[x]).filter(function(obj){ return isVTOL(obj) }).length;
		enemyVtolCount += temp;
	}
	
	if((enemyVtolCount > 0) && (playerPower(me) > 130)) {
		if(isStructureAvailable("AASite-QuadRotMg")) {
			if(buildStuff("AASite-QuadRotMg")) { return true; }
		}
		else {
			if(isStructureAvailable("AASite-QuadMg1")) {
				if(buildStuff("AASite-QuadMg1")) { return true; }
			}
		}
	}
	
	return false;
}

//Important build order for T1 no bases. Build the basics when available.
function buildPhase1() {
	
	//if a hover map without land enemies, then build research labs first to get to hover propulsion even faster
	if((forceHover === false) || (seaMapWithLandEnemy === true)) {
		if(countAndBuild(structures.factories, 1)) { return true; }
		if(countAndBuild(structures.labs, 1)) { return true; }
		if(countAndBuild(structures.hqs, 1)) { return true; }
	}
	else {
		if(countAndBuild(structures.labs, 2)) { return true; }
		if(countAndBuild(structures.factories, 1)) { return true; }
		if(countAndBuild(structures.hqs, 1)) { return true; }
	}
	
	if (((countStruct(structures.derricks) - (countStruct(structures.gens) * 4)) > 0) 
		&& isStructureAvailable(structures.gens) || (countStruct(structures.gens) < 1)
		&& (buildStop === 0)) 
	{
		buildStop = 1;
		if(buildStuff(structures.gens)) {
			buildStop = 0;
			return true;
		}
	}
	
	if ((gameTime > 240000) && isDefined(turnOffCyborgs) && (turnOffCyborgs === false)
		&& isStructureAvailable(structures.templateFactories)) {
		if (countAndBuild(structures.templateFactories, 1)) { return true; }
	}
	
	if(isStructureAvailable(structures.vtolPads)
		&& (2 * countStruct(structures.vtolPads) < enumGroup(vtolGroup).length) && buildStuff(structures.vtolPads))
		return true;
	
	return false;
}

//Build three research labs and three ground/cyborg factories and 1 repair center
function buildPhase2() {
	if(gameTime > 180000) {
		if(countAndBuild(structures.labs, 3)) { return true; }
	}
	
	if(gameTime > 210000 && playerPower(me) > 80) {
		if(isStructureAvailable(structures.extras[0])) {
			if(countAndBuild(structures.extras[0], 1)) { return true; }
		}
		if(countAndBuild(structures.factories, 3)) { return true; }
		if (isDefined(turnOffCyborgs) && turnOffCyborgs === false && isStructureAvailable(structures.templateFactories)) {
			if (countAndBuild(structures.templateFactories, 2)) { return true; }
		}
	}
	
	return false;
}

//Build five research labs and the minimum vtol factories and maximum ground/cyborg factories and repair centers
function buildPhase3() {
	if((gameTime > 210000) && isDefined(turnOffMG) && (turnOffMG === true) && countAndBuild(structures.labs, 4)) { return true; }
	
	if((gameTime > 680000) && (playerPower(me) > 110) ) {
		if(countAndBuild(structures.labs, 5)) { return true; }
		
		if (componentAvailable("Bomb1-VTOL-LtHE") && isStructureAvailable(structures.vtolFactories)) {
			if (countAndBuild(structures.vtolFactories, 2)) { return true; }
		}
		
		if(countAndBuild(structures.factories, 5)) { return true; }
		
		if (isDefined(turnOffCyborgs) && (turnOffCyborgs === false) && isStructureAvailable(structures.templateFactories)) {
			if (countAndBuild(structures.templateFactories, 5)) { return true; }
		}
		
		if(isStructureAvailable(structures.extras[0])) {
			if(countAndBuild(structures.extras[0], 5)) { return true; }
		}
	}
	
	return false;
}

//Finish building all vtol factories
function buildPhase4() {
	if ((gameTime > 680000) && componentAvailable("Bomb1-VTOL-LtHE") && (playerPower(me) > 230)
		&& isStructureAvailable(structures.vtolFactories))
	{
		if (countAndBuild(structures.vtolFactories, 5)) { return true; }
	}
	
	return false;
}

//Laser satellite/uplink center
function buildPhase5() {
	if(playerPower(me) > 250 && isStructureAvailable(structures.extras[1])) {
		if(!countStruct(structures.extras[1]) && countAndBuild(structures.extras[1], 1))
			return true;
	}
	
	if(playerPower(me) > 250 && isStructureAvailable(structures.extras[2])) {
		if(!countStruct(structures.extras[2]) && countAndBuild(structures.extras[2], 1))
			return true;
	}
	
	return false;
}

//Cobra's unique build decisions
function buildOrder() {
	if(recycleObsoleteDroids()) { return false; }
	if(checkUnfinishedStructures()) { return false; }
	if(buildPhase1()) { return false; }
	if((turnOffMG === true) && maintenance()) { return false; } //T2/T3
	if((turnOffMG === false) && (gameTime > 80000) && maintenance()) { return false; } //T1
	lookForOil();
	if(buildPhase2()) { return false; }
	if(buildPhase3()) { return false; }
	if(!buildDefenses()) { return false; }
	if(buildPhase4()) { return false; }
	if(buildPhase5()) { return false; }
	else
		return false;
}

//Check if a building has modules to be built
function maintenance() {
	const list = ["A0PowMod1", "A0ResearchModule1", "A0FacMod1", "A0FacMod1"];
	const mods = [1, 1, 2, 2]; //Number of modules paired with list above
	var struct = null, module = "", structList = [];
	
	if(countStruct(structures.derricks) <= 4) { return false; }
	
	for (var i = 0; i < list.length; ++i) {
		if (isStructureAvailable(list[i]) && (struct == null)) {
			switch(i) {
				case 0: { structList = enumStruct(me, structures.gens);  break; }
				case 1: { structList = enumStruct(me, structures.labs);  break; }
				case 2: { structList = enumStruct(me, structures.factories);  break; }
				case 3: { structList = enumStruct(me, structures.vtolFactories);  break; }
				default: { break; }
			}
			
			for (var c = 0; c < structList.length; ++c) {
				if (structList[c].modules < mods[i]) {
					//Only build the last factory module if we have a heavy body
					if((i === 2) && (structList[c].modules === 1) && !componentAvailable("Body11ABT")) {
						continue;
					}
					//Build last vtol factory module once Cobra gets retribution
					if((i === 3) && (structList[c].modules === 1) && !componentAvailable("Body7ABT")) {
						continue;
					}
					struct = structList[c];
					module = list[i];
					break;
				}
			}
		}
		else {
			break;
		}
	}
	
	if ((!checkLowPower(35)) && (struct || (struct && (module === list[0])))) {
		if(buildStuff(struct, module)) { return true; }
	}
	
	return false;
}

