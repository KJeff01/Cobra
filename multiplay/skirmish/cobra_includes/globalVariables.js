
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
//	"R-Vehicle-Body12",
//	"R-Vehicle-Body09",
	"R-Vehicle-Body10",
	"R-Vehicle-Body14",
]

const tankBody = [
	"Body14SUP", // Dragon
//	"Body13SUP", // Wyvern
	"Body10MBT", // Vengeance
//	"Body9REC",  // Tiger
//	"Body12SUP", // Mantis
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
//	"Body2SUP",  // Leopard
	"Body4ABT",  // Bug
	"Body1REC",  // Viper
];

const sysProp = [
	"hover01", // hover
	"wheeled01", // wheels
];

const vtolBody = [
	"Body7ABT",  // Retribution
//	"Body6SUPP", // Panther
	"Body8MBT",  // Scorpion
	"Body5REC",  // Cobra
];

const ADAPT_PERSONALITIES = ["AM", "AR", "AB", "AC", "AL"];

/*
const repairTurrets = [
	"HeavyRepair",
	"LightRepair1",
]
*/

//List of Cobra personalities:
//AC: Cannon/gauss/howitzer.
//AR: Flamer/Rocket/howitzer.
//AB: Rocket/Missle/gauss.
//AM: Machine-gun/howitzer/Cannons.
//AL: Lasers/Lasers/fireMortars. *Strictly a T3 personality.
//All personalities use laser technology. This includes the plasma cannon.
//The secondary weapon has low priority.
const subpersonalities = {
	AC: {
		"primaryWeapon": weaponStats.cannons,
		"secondaryWeapon": weaponStats.gauss,
		"artillery": weaponStats.howitzers,
		"antiAir": weaponStats.AA,
		"res": [
			"R-Struc-PowerModuleMk1",
			"R-Wpn-Cannon-Damage03",
			"R-Wpn-Cannon2Mk1",
			"R-Wpn-Cannon-ROF03",
			"R-Wpn-Cannon4AMk1",
		],
	},
	AR: {
		"primaryWeapon": weaponStats.flamers,
		"secondaryWeapon": weaponStats.rockets_AT,
		"artillery": weaponStats.howitzers,
		"antiAir": weaponStats.AA,
		"res": [
			"R-Wpn-Flamer-Damage02",
			"R-Wpn-Flamer-ROF01",
			"R-Defense-Tower01",
		],
	},
	AB: {
		"primaryWeapon": weaponStats.rockets_AT,
		"secondaryWeapon": weaponStats.gauss,
		"artillery": weaponStats.rockets_Arty,
		"antiAir": weaponStats.AA,
		"res": [
			"R-Struc-PowerModuleMk1",
			"R-Wpn-Rocket02-MRL",
			"R-Wpn-Rocket07-Tank-Killer",
			"R-Wpn-Rocket06-IDF",
			"R-Wpn-Rocket-ROF03",
		],
	},
	AM: {
		"primaryWeapon": weaponStats.machineguns,
		"secondaryWeapon": weaponStats.lasers,
		"artillery": weaponStats.howitzers,
		"antiAir": weaponStats.AA,
		"res": [
			"R-Wpn-MG2Mk1",
			"R-Defense-Tower01",
			"R-Wpn-MG-Damage04",
		],
	},
	AL: {
		"primaryWeapon": weaponStats.lasers,
		"secondaryWeapon": weaponStats.lasers,
		"artillery": weaponStats.fireMortars,
		"antiAir": weaponStats.AA,
		"res": [
			"R-Wpn-Mortar-Incenediary",
			"R-Wpn-Laser01",
			"R-Sys-Autorepair-General",
			"R-Wpn-Mortar-Damage06",
			"R-Wpn-Mortar-ROF04",
			"R-Wpn-Mortar-Acc03",
		],
	},
}

// Groups
//TODO: Put artillery units in a different group.
var attackGroup; //All tanks units.
var vtolGroup; //All vtol units.
var cyborgGroup; //All cyborg units.
var sensorGroup; //All sensor units.
//var commanderGroup; //All commander units.


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

// -- Weapon research list (initializeResearchLists).
var techlist;
var weaponTech;
var mgWeaponTech;
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
