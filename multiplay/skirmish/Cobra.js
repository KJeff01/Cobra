//This is the main file that brings everything all together.
//TODO: Make sure ground units do not chase VTOL units if they can not hit them.

const COBRA_INCLUDES = "/multiplay/skirmish/cobra_includes/";
const COBRA_RULESETS = "/multiplay/skirmish/cobra_rulesets/";

include(COBRA_RULESETS + "CobraStandard.js");
include(COBRA_INCLUDES + "globalVariables.js");
include(COBRA_INCLUDES + "miscFunctions.js");
include(COBRA_INCLUDES + "build.js");
include(COBRA_INCLUDES + "production.js");
include(COBRA_INCLUDES + "tactics.js");
include(COBRA_INCLUDES + "NEXUSIntruderProgram.js");
include(COBRA_INCLUDES + "mapDynamics.js");
include(COBRA_INCLUDES + "research.js");
include(COBRA_INCLUDES + "events.js");
include(COBRA_INCLUDES + "chat.js");
include(COBRA_INCLUDES + "adaption.js");
