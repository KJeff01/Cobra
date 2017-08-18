const MAX_GRUDGE = 50000;
const MIN_ATTACK_DROIDS = 6;
const FACTORY = "A0LightFactory";
const CYBORG_FACTORY = "A0CyborgFactory";
const VTOL_FACTORY = "A0VTolFactory1";
const MY_BASE = startPositions[me];

//List of Cobra personalities:
//AC: Cannon/Gauss/howitzer.
//AR: Flamer/Gauss/howitzer.
//AB: Missile/Gauss/rockets_Arty
//AM: Machine-gun/howitzer/lasers.
//AL: Lasers/Gauss/fireMortars. *Strictly a T3 personality.
//All personalities use laser technology. This includes the plasma cannon.
//The secondary weapon has low priority.
//TODO: Stop producing primaryWeapon when secondary is available.
const subpersonalities = {
	AC: {
		"primaryWeapon": weaponStats.cannons,
		"secondaryWeapon": weaponStats.gauss,
		"artillery": weaponStats.howitzers,
		"antiAir": weaponStats.AA, //cannons_AA is too weak.
		"factoryOrder": [FACTORY, CYBORG_FACTORY, VTOL_FACTORY],
		"defensePriority": 10,
		"vtolPriority": 20,
		"systemPriority": 30,
		"alloyPriority": 40,
		"res": [
			"R-Wpn-Cannon-Damage02",
		],
	},
	AR: {
		"primaryWeapon": weaponStats.flamers,
		"secondaryWeapon": weaponStats.gauss,
		"artillery": weaponStats.mortars,
		"antiAir": weaponStats.AA,
		"factoryOrder": [FACTORY, VTOL_FACTORY, CYBORG_FACTORY],
		"defensePriority": 20,
		"vtolPriority": 40,
		"systemPriority": 20,
		"alloyPriority": 45,
		"res": [
			"R-Wpn-Flamer-Damage03",
			"R-Wpn-Flamer-ROF01",
		],
	},
	AB: {
		"primaryWeapon": weaponStats.rockets_AT,
		"secondaryWeapon": weaponStats.gauss,
		"artillery": weaponStats.missile_Arty,
		"antiAir": weaponStats.AA,
		"factoryOrder": [CYBORG_FACTORY, VTOL_FACTORY, FACTORY],
		"defensePriority": 60,
		"vtolPriority": 90,
		"systemPriority": 15,
		"alloyPriority": 35,
		"res": [
			"R-Wpn-MG2Mk1",
		],
	},
	AM: {
		"primaryWeapon": weaponStats.machineguns,
		"secondaryWeapon": weaponStats.lasers,
		"artillery": weaponStats.mortars,
		"antiAir": weaponStats.AA,
		"factoryOrder": [FACTORY, CYBORG_FACTORY, VTOL_FACTORY],
		"defensePriority": 30,
		"vtolPriority": 80,
		"systemPriority": 45,
		"alloyPriority": 35,
		"res": [
			"R-Wpn-MG2Mk1",
		],
	},
	AL: {
		"primaryWeapon": weaponStats.lasers,
		"secondaryWeapon": weaponStats.gauss,
		"artillery": weaponStats.fireMortars,
		"antiAir": weaponStats.AA,
		"factoryOrder": [VTOL_FACTORY, FACTORY, CYBORG_FACTORY],
		"defensePriority": 10,
		"vtolPriority": 60,
		"systemPriority": 40,
		"alloyPriority": 20,
		"res": [
			"R-Wpn-Mortar-Incenediary",
			"R-Wpn-Laser01",
			"R-Sys-Autorepair-General",
			"R-Wpn-Mortar-Damage06",
			"R-Wpn-Mortar-ROF04",
			"R-Wpn-Mortar-Acc03",
		],
	},
};

// Groups
var attackGroup;
var vtolGroup;
var cyborgGroup;
var sensorGroup;
var repairGroup;
var artilleryGroup;
var constructGroup;
var oilGrabberGroup;

var grudgeCount; //See who bullies this bot the most and act on it. DO NOT let this use the scavenger player number.
var personality; //What personality is this instance of Cobra using.
var lastMsg; //The last Cobra chat message.
var forceHover; //Use hover propulsion only.
var seaMapWithLandEnemy; //Hover map with an enemy sharing land with Cobra.
var turnOffCyborgs; //Turn of cyborgs (hover maps/chat).
var nexusWaveOn; //Determine if the 'NEXUS Intruder Program' feature is on.
var turnOffMG; //Turn off machine-gun related stuff.
var throttleTime; //For events so that some do not trigger their code too fast. More details in stopExecution() in miscFunctions.
var researchComplete; //Check if done with research.
var lastAttackedTime;
