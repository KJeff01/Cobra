//Cache/throttle/other similar stuff goes here.

//callFuncWithArgs(FUNCTION_NAME, ARRAY_OF_PARAMETERS);
function callFuncWithArgs(func, parameters) {
    return func.apply(this, parameters);
}

function cacheThis(func, funcParameters, cachedItem) {
     const REFRESH_TIME = 40000;

     if (!isDefined(func.caller.cachedTimes)) {
		func.caller.cachedTimes = {};
		func.caller.cachedValues = {};
	}

	var t = func.caller.cachedTimes[cachedItem];

	if (!isDefined(t) || ((gameTime - t) >= REFRESH_TIME)) {
		func.caller.cachedValues[cachedItem] = callFuncWithArgs(func, funcParameters);
		func.caller.cachedTimes[cachedItem] = gameTime;
	}

     return func.caller.cachedValues[cachedItem];
}

//TODO: Implement this better
//Determine if something (namely events) should be skipped momentarily.
//0 - eventAttacked().
//1 - eventChat().
//2 - eventBeacon().
//3 - eventGroupLoss(). (the addBeacon call).
//ms is a delay value.
//Defaults to checking eventAttacked timer.
function stopExecution(throttleNumber, ms) {
	if(!isDefined(throttleNumber)) {
		throttleNumber = 0;
	}

	if(!isDefined(ms)) {
		ms = 1000;
	}

	if(gameTime > (throttleTime[throttleNumber] + ms)) {
		throttleTime[throttleNumber] = gameTime + (4 * random(500));
		return false;
	}

	return true;
}
