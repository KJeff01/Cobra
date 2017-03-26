
const kineticResearch = [
	"R-Vehicle-Metals02",
	"R-Cyborg-Metals02",
	"R-Vehicle-Metals04",
	"R-Cyborg-Metals04",
	"R-Vehicle-Metals06",
	"R-Cyborg-Metals06",
	"R-Vehicle-Metals09",
	"R-Cyborg-Metals09",
]

const thermalResearch = [
	"R-Vehicle-Armor-Heat02",
	"R-Cyborg-Armor-Heat02",
	"R-Vehicle-Armor-Heat04",
	"R-Cyborg-Armor-Heat05",
	"R-Vehicle-Armor-Heat06",
	"R-Cyborg-Armor-Heat06",
	"R-Vehicle-Armor-Heat09",
	"R-Cyborg-Armor-Heat09",
]

const bodyResearch = [
	"R-Vehicle-Body11",
	"R-Vehicle-Body12",
	"R-Vehicle-Body09",
	"R-Vehicle-Body10",
	"R-Vehicle-Body14",
]

const tankBody = [
	"Body14SUP", // Dragon
	"Body13SUP", // Wyvern
	"Body10MBT", // Vengeance
	"Body9REC",  // Tiger
	"Body12SUP", // Mantis
	"Body11ABT", // Python
	"Body5REC",  // Cobra
	"Body1REC",  // Viper
];

const tankProp = [
	"tracked01", // tracked01
	"HalfTrack", // half-track
	"wheeled01", // wheels
];

const sysBody = [
	"Body3MBT",  // Retaliation
	"Body2SUP",  // Leopard
	"Body4ABT",  // Bug
	"Body1REC",  // Viper
];

const sysProp = [
	"hover01", // hover
	"wheeled01", // wheels
];

const vtolBody = [
	"Body7ABT",  // Retribution
	"Body6SUPP", // Panther
	"Body8MBT",  // Scorpion
	"Body5REC",  // Cobra
];

const ADAPT_PERSONALITIES = ["AM", "AR", "AB", "AC"];

/*
//These are for ground unit production only (non-system).
const kineticBody = [
	"Body14SUP", // Dragon
	"Body13SUP", // Wyvern
	"Body9REC",  // Tiger
	"Body11ABT", // Python
];

//For ground unit production only (non-system).
const thermalBody = [
	"Body10MBT", // Vengeance
	"Body12SUP", // Mantis
];
*/
/*
const repairTurrets = [
	"HeavyRepair",
	"LightRepair1",
]
*/

//Do note that personality AM will always use machine-guns regardless if it is Above T1 or not.
const subpersonalities = {
	AC: {
		"chatalias": "ac",
		"primaryWeapon": weaponStats.cannons,
		"secondaryWeapon": weaponStats.machineguns,
		"tertiaryWeapon": weaponStats.lasers,
		"artillery": weaponStats.fireMortars,
		"antiAir": weaponStats.AA,
		"res": [
			"R-Wpn-MG-Damage01",
			"R-Wpn-MG1Mk1",
			"R-Struc-PowerModuleMk1",
			"R-Vehicle-Body05",
			"R-Struc-RprFac-Upgrade01",
			"R-Wpn-MG2Mk1",
			"R-Wpn-Cannon-Damage02",
			"R-Vehicle-Body11",
			"R-Vehicle-Prop-Tracks",
			"R-Vehicle-Prop-Hover",
			"R-Wpn-Cannon-Damage03",
			"R-Wpn-Cannon2Mk1",
			"R-Wpn-Cannon-ROF03",
			"R-Wpn-Mortar-Incenediary",
			"R-Struc-RprFac-Upgrade06",
		],
	},
	AR: {
		"chatalias": "ar",
		"primaryWeapon": weaponStats.flamers,
		"secondaryWeapon": weaponStats.machineguns,
		"tertiaryWeapon": weaponStats.lasers,
		"artillery": weaponStats.mortars,
		"antiAir": weaponStats.AA,
		"res": [
			"R-Wpn-MG-Damage01",
			"R-Wpn-MG1Mk1",
			"R-Struc-PowerModuleMk1",
			"R-Vehicle-Body05",
			"R-Struc-RprFac-Upgrade01",
			"R-Wpn-MG2Mk1",
			"R-Wpn-Flamer-Damage02",
			"R-Wpn-Flamer-ROF01",
			"R-Vehicle-Body11",
			"R-Vehicle-Prop-Tracks",
			"R-Vehicle-Prop-Hover",
			"R-Wpn-Flamer-ROF03",
			"R-Wpn-Mortar3",
			"R-Struc-RprFac-Upgrade06",
		],
	},
	AB: {
		"chatalias": "ab",
		"primaryWeapon": weaponStats.rockets_AT,
		"secondaryWeapon": weaponStats.machineguns,
		"tertiaryWeapon": weaponStats.lasers,
		"artillery": weaponStats.rockets_Arty,
		"antiAir": weaponStats.AA,
		"res": [
			"R-Wpn-MG-Damage01",
			"R-Wpn-MG1Mk1",
			"R-Struc-PowerModuleMk1",
			"R-Vehicle-Body05",
			"R-Struc-RprFac-Upgrade01",
			"R-Wpn-MG2Mk1",
			"R-Vehicle-Body11",
			"R-Vehicle-Prop-Tracks",
			"R-Vehicle-Prop-Hover",
			"R-Wpn-Rocket02-MRL",
			"R-Wpn-Rocket07-Tank-Killer",
			"R-Wpn-Rocket06-IDF",
			"R-Struc-RprFac-Upgrade06",
		],
	},
	AM: {
		"chatalias": "am",
		"primaryWeapon": weaponStats.fireMortars,
		"secondaryWeapon": weaponStats.machineguns,
		"tertiaryWeapon": weaponStats.lasers,
		"artillery": weaponStats.mortars,
		"antiAir": weaponStats.AA,
		"res": [
			"R-Wpn-MG-Damage01",
			"R-Wpn-MG1Mk1",
			"R-Struc-PowerModuleMk1",
			"R-Vehicle-Body05",
			"R-Struc-RprFac-Upgrade01",
			"R-Wpn-MG2Mk1",
			"R-Vehicle-Body11",
			"R-Vehicle-Prop-Tracks",
			"R-Vehicle-Prop-Hover",
			"R-Wpn-Mortar3",
			"R-Wpn-Mortar-Incenediary",
			"R-Struc-RprFac-Upgrade06",
		],
	},
}

// Groups
var attackGroup; //All tanks units
var vtolGroup; //All vtol units
var cyborgGroup; //All cyborg units
var sensorGroup; //All sensor units
//var commanderGroup; //All commander units


var grudgeCount; //See who bullies this bot the most and act on it. DO NOT let this use the scavenger player number.
var personality; //Initialization in eventStartLevel()
var lastMsg; //The last Cobra chat message
var buildStop; //A hack that tries to prevent too many power gens from being built at once
var forceHover; //Use hover propulsion only. Initialization in eventStartLevel()
var seaMapWithLandEnemy; //Hover map with an enemy sharing land with Cobra. Initialization in eventStartLevel()
var turnOffCyborgs; //Turn of cyborgs (hover maps)
var nexusWaveOn; //Determine if the 'NEXUS Intruder Program' feature is on.
var scavengerNumber; //What player number are the scavengers.
var turnOffMG; //Turn off machine-gun related stuff.
var throttleTime; //For events so that some do not trigger their code too fast. More details in stopExecution() in miscFunctions.

// -- Weapon research list (initializeResearchLists)
var techlist;
var weaponTech;
var mgWeaponTech;
var laserTech;
var artilleryTech;
var artillExtra;
var laserExtra;
var extraTech;
var vtolWeapons;
var vtolExtras;
var cyborgWeaps;
var antiAirTech;
var antiAirExtras;
var extremeLaserTech;
