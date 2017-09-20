const MAX_GRUDGE = 50000;
const MIN_ATTACK_DROIDS = 7;
const FACTORY = "A0LightFactory";
const CYBORG_FACTORY = "A0CyborgFactory";
const VTOL_FACTORY = "A0VTolFactory1";
const MY_BASE = startPositions[me];
const MIN_TRUCKS = 6;
const OIL_RES = "OilResource";

//Research constants
const TANK_ARMOR = [
	"R-Vehicle-Metals09",
	"R-Vehicle-Armor-Heat09",
];
const CYBORG_ARMOR = [
	"R-Cyborg-Metals09",
	"R-Cyborg-Armor-Heat09",
];
const ESSENTIALS = [
	"R-Sys-Engineering01",
	"R-Defense-Tower01",
	"R-Struc-PowerModuleMk1",
	"R-Struc-Research-Upgrade09",
	"R-Struc-Power-Upgrade03a",
	"R-Vehicle-Prop-Halftracks",
	"R-Vehicle-Body05",
	"R-Struc-RprFac-Upgrade01",
	"R-Vehicle-Prop-Hover",
	"R-Vehicle-Body04",
];
const SYSTEM_UPGRADES = [
	"R-Sys-Sensor-Upgrade03",
	"R-Sys-MobileRepairTurretHvy",
	"R-Sys-Autorepair-General",
	"R-Struc-Factory-Upgrade09",
	"R-Struc-RprFac-Upgrade06",
];
const FLAMER = [
	"R-Wpn-Flame2",
	"R-Wpn-Flamer-ROF03",
	"R-Wpn-Flamer-Damage09",
];
const SENSOR_TECH = [
	"R-Sys-ECM-Upgrade02",
	"R-Sys-Sensor-WS",
	"R-Sys-RadarDetector01",
	"R-Wpn-LasSat",
];
const DEFENSE_UPGRADES = [
	"R-Sys-Resistance-Circuits",
	"R-Defense-WallUpgrade12",
	"R-Struc-Materials09",
];
const BODY_RESEARCH = [
	"R-Vehicle-Body11",
	"R-Vehicle-Body12",
	"R-Vehicle-Body06",
	"R-Vehicle-Body10",
	"R-Vehicle-Body14",
];
const VTOL_RES = [
	"R-Wpn-Bomb-Accuracy03",
	"R-Wpn-Bomb04",
	"R-Struc-VTOLPad-Upgrade06",
	"R-Wpn-Bomb06",
];
const LATE_EARLY_GAME_TECH = [
	"R-Vehicle-Body11",
	"R-Vehicle-Prop-Tracks",
];

//Production constants
const TANK_BODY = [
	"Body14SUP", // Dragon
	"Body13SUP", // Wyvern
	"Body10MBT", // Vengeance
	"Body7ABT",  // Retribution
	"Body6SUPP", // Panther
	"Body11ABT", // Python
	"Body12SUP", // Mantis
	"Body8MBT",  // Scorpion
	"Body5REC",  // Cobra
	"Body1REC",  // Viper
];
const SYSTEM_BODY = [
	"Body3MBT",  // Retaliation
//	"Body2SUP",  // Leopard
	"Body4ABT",  // Bug
	"Body1REC",  // Viper
];
const SYSTEM_PROPULSION = [
	"hover01", // hover
	"wheeled01", // wheels
];
const VTOL_BODY = [
	"Body7ABT",  // Retribution
	"Body6SUPP", // Panther
	"Body8MBT",  // Scorpion
	"Body5REC",  // Cobra
	"Body1REC",  // Viper
];
const REPAIR_TURRETS = [
	"HeavyRepair",
	"LightRepair1",
];


//List of Cobra personalities:
//AC: Cannon/Gauss/howitzer.
//AR: Flamer/Gauss/howitzer.
//AB: Missile/Gauss/rockets_Arty
//AM: Machine-gun/howitzer/lasers.
//AL: Lasers/Gauss/fireMortars. *Strictly a T3 personality.
//All personalities use laser technology. This includes the plasma cannon.
//The secondary weapon has low priority.
//TODO: Stop producing primaryWeapon when secondary is available.
const SUB_PERSONALITIES =
{
	AC:
	{
		"primaryWeapon": weaponStats.cannons,
		"secondaryWeapon": weaponStats.gauss,
		"artillery": weaponStats.howitzers,
		"antiAir": weaponStats.AA, //cannons_AA is too weak.
		"factoryOrder": [FACTORY, CYBORG_FACTORY, VTOL_FACTORY],
		"defensePriority": 10,
		"vtolPriority": 20,
		"systemPriority": 30,
		"alloyPriority": 20,
		"res": [
			"R-Wpn-Cannon-Damage02",
			"R-Wpn-Cannon-ROF02",
		],
	},
	AR:
	{
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
			"R-Wpn-Flamer-ROF03",
		],
	},
	AB:
	{
		"primaryWeapon": weaponStats.rockets_AT,
		"secondaryWeapon": weaponStats.gauss,
		"artillery": weaponStats.rockets_Arty,
		"antiAir": weaponStats.AA,
		"factoryOrder": [CYBORG_FACTORY, VTOL_FACTORY, FACTORY],
		"defensePriority": 60,
		"vtolPriority": 90,
		"systemPriority": 15,
		"alloyPriority": 25,
		"res": [
			"R-Wpn-MG2Mk1",
		],
	},
	AM:
	{
		"primaryWeapon": weaponStats.machineguns,
		"secondaryWeapon": weaponStats.lasers,
		"artillery": weaponStats.mortars,
		"antiAir": weaponStats.AA,
		"factoryOrder": [FACTORY, CYBORG_FACTORY, VTOL_FACTORY],
		"defensePriority": 30,
		"vtolPriority": 80,
		"systemPriority": 45,
		"alloyPriority": 55,
		"res": [
			"R-Wpn-MG2Mk1",
		],
	},
	AL:
	{
		"primaryWeapon": weaponStats.lasers,
		"secondaryWeapon": weaponStats.gauss,
		"artillery": weaponStats.fireMortars,
		"antiAir": weaponStats.AA,
		"factoryOrder": [VTOL_FACTORY, FACTORY, CYBORG_FACTORY],
		"defensePriority": 10,
		"vtolPriority": 60,
		"systemPriority": 40,
		"alloyPriority": 15,
		"res": [
			"R-Wpn-Laser01",
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
var throttleTime; //For events so that some do not trigger their code too fast. More details in stopExecution() in miscFunctions.
var researchComplete; //Check if done with research.
var lastAttackedTime;
var turnOffMG; //This is only used for when the personalities don't have their weapons researched.
var buildQueue;
var useArti;
var useVtol;

// -- Weapon research list (initializeResearchLists).
var techlist;
var weaponTech;
var laserTech;
var artilleryTech;
var artillExtra;
var laserExtra;
var extraTech;
var cyborgWeaps;
var antiAirTech;
var antiAirExtras;
var extremeLaserTech;
var secondaryWeaponTech;
var secondaryWeaponExtra;
var defenseTech;
