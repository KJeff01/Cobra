const MAX_GRUDGE = 50000;
const MIN_ATTACK_DROIDS = 6;

//List of Cobra personalities:
//AC: Cannon/Gauss/howitzer.
//AR: Flamer/Gauss/howitzer.
//AB: Rocket/Missle/gauss.
//AM: Machine-gun/howitzer/lasers.
//AL: Lasers/Gauss/fireMortars. *Strictly a T3 personality.
//All personalities use laser technology. This includes the plasma cannon.
//The secondary weapon has low priority.
const subpersonalities = {
	AC: {
		"primaryWeapon": weaponStats.cannons,
		"secondaryWeapon": weaponStats.gauss,
		"artillery": weaponStats.mortars,
		"antiAir": weaponStats.AA, //cannons_AA is too weak.
		"res": [
			"R-Struc-PowerModuleMk1",
			"R-Wpn-Cannon-Damage03",
			"R-Vehicle-Body05",
			"R-Wpn-Cannon2Mk1",
			"R-Wpn-Cannon-ROF03",
			"R-Wpn-Cannon4AMk1",
		],
	},
	AR: {
		"primaryWeapon": weaponStats.flamers,
		"secondaryWeapon": weaponStats.gauss,
		"artillery": weaponStats.mortars,
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
		"artillery": weaponStats.mortars,
		"antiAir": weaponStats.AA,
		"res": [
			"R-Wpn-MG2Mk1",
			"R-Defense-Tower01",
		],
	},
	AL: {
		"primaryWeapon": weaponStats.lasers,
		"secondaryWeapon": weaponStats.gauss,
		"artillery": weaponStats.fireMortars,
		"antiAir": weaponStats.lasers_AA,
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
var attackGroup; //All tanks units.
var vtolGroup; //All vtol units.
var cyborgGroup; //All cyborg units.
var sensorGroup; //All sensor units.
var repairGroup; //All repair units.
var artilleryGroup; //All artillery (CB) units.

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
