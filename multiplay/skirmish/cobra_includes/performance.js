//Cache/throttle/other similar stuff goes here.

//callFuncWithArgs(FUNCTION_NAME, ARRAY_OF_PARAMETERS);
function callFuncWithArgs(func, parameters) {
    return func.apply(this, parameters);
}

//cacheThis(FUNCTION_NAME, [FUNCTION_PARAMETERS], [CACHED_NAME], [TIME])
//Pass in Infinity for time to never recalculate it again.
function cacheThis(func, funcParameters, cachedItem, time) {
     const REFRESH_TIME = isDefined(time) ? time : 15000;
     if (!isDefined(cachedItem)) {
          cachedItem = 0;
     }
     if(!isDefined(funcParameters)) {
          funcParameters = [];
     }

     if((time === Infinity) && isDefined(arguments.callee.caller.cachedValues)) {
          return arguments.callee.caller.cachedValues[cachedItem];
     }

     if (!isDefined(arguments.callee.caller.cachedTimes)) {
		arguments.callee.caller.cachedTimes = {};
		arguments.callee.caller.cachedValues = {};
	}

	var t = arguments.callee.caller.cachedTimes[cachedItem];
	if (!isDefined(t) || ((gameTime - t) >= REFRESH_TIME))
     {
		arguments.callee.caller.cachedValues[cachedItem] = callFuncWithArgs(func, funcParameters);
		arguments.callee.caller.cachedTimes[cachedItem] = gameTime;
	}

     return arguments.callee.caller.cachedValues[cachedItem];
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
