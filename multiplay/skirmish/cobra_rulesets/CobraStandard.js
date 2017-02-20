

// a factor for figuring out how large things are in this ruleset,
// or simply a typical radius of a player's base
const baseScale = 20; 
const lassatSplash = 4; 

const structures = {
	factories: [ "A0LightFactory", ],
	templateFactories: [ "A0CyborgFactory", ],
	vtolFactories: [ "A0VTolFactory1", ],
	labs: [ "A0ResearchFacility", ],
	gens: [ "A0PowerGenerator", ],
	hqs: [ "A0CommandCentre", ],
	vtolPads: [ "A0VtolPad", ],
	derricks: [ "A0ResourceExtractor", ],
	extras: [ "A0RepairCentre3", "A0Sat-linkCentre", "A0LasSatCommand", ],
};

const oilResources = [ "OilResource", ];
const powerUps = [ "OilDrum", "Crate" ];

const modules = [
	{ base: POWER_GEN, module: "A0PowMod1", count: 1 },
	{ base: FACTORY, module: "A0FacMod1", count: 2 },
	{ base: RESEARCH_LAB, module: "A0ResearchModule1", count: 1 },
	{ base: VTOL_FACTORY, module: "A0FacMod1", count: 2 },
];

const targets = []
	.concat(structures.factories)
	.concat(structures.templateFactories)
	.concat(structures.vtolFactories)
	.concat(structures.extras)
;

const miscTargets = []
	.concat(structures.derricks)
;

const sensorTurrets = [
	"SensorTurret1Mk1", // sensor
	"Sys-CBTurret01", //counter-battery
	"Sys-VTOLCBTurret01", //VTOL counter-battery
	"Sys-VstrikeTurret01", //VTOL Strike turret
	"Sensor-WideSpec", // wide spectrum sensor
];

const fundamentalResearch = [
	"R-Struc-PowerModuleMk1",
	"R-Struc-RprFac-Upgrade01",
	"R-Sys-Sensor-Tower02",
	"R-Vehicle-Prop-Halftracks",
	"R-Struc-Power-Upgrade01c",
	"R-Vehicle-Prop-Tracks",
	"R-Sys-Sensor-Upgrade02",
	"R-Struc-VTOLPad-Upgrade01",
	"R-Struc-Power-Upgrade03a",
	"R-Struc-VTOLPad-Upgrade03",
	"R-Sys-Sensor-Upgrade03",
	"R-Sys-Sensor-WSTower",
	"R-Sys-Autorepair-General",
	"R-Wpn-LasSat",
	"R-Struc-RprFac-Upgrade04",
	"R-Struc-VTOLPad-Upgrade06",
	"R-Struc-RprFac-Upgrade06",
];

const fastestResearch = [
	"R-Struc-Research-Upgrade09",
];

// body and propulsion arrays don't affect fixed template droids
const bodyStats = [
	{ res: "R-Vehicle-Body01", stat: "Body1REC"  }, // viper
	{ res: "R-Vehicle-Body05", stat: "Body5REC"  }, // cobra
	{ res: "R-Vehicle-Body11", stat: "Body11ABT"  }, // python
	{ res: "R-Vehicle-Body02", stat: "Body2SUP"  }, // leopard
	{ res: "R-Vehicle-Body06", stat: "Body6SUPP" }, // panther
	{ res: "R-Vehicle-Body09", stat: "Body9REC" }, // tiger
	{ res: "R-Vehicle-Body13", stat: "Body13SUP" }, // wyvern
	{ res: "R-Vehicle-Body14", stat: "Body14SUP" }, // dragon
	{ res: "R-Vehicle-Body04", stat: "Body4ABT" }, // bug
	{ res: "R-Vehicle-Body08", stat: "Body8MBT" }, // scorpion
	{ res: "R-Vehicle-Body12", stat: "Body12SUP" }, // mantis
	{ res: "R-Vehicle-Body03", stat: "Body3MBT" }, // retaliation
	{ res: "R-Vehicle-Body07", stat: "Body7ABT" }, // retribution
	{ res: "R-Vehicle-Body10", stat: "Body10MBT" }, // vengeance
];

const propulsionStats = [
	{ res: "R-Vehicle-Prop-Wheels", stat: "wheeled01"  },
	{ res: "R-Vehicle-Prop-Halftracks", stat: "HalfTrack" },
	{ res: "R-Vehicle-Prop-Tracks", stat: "tracked01" },
	{ res: "R-Vehicle-Prop-Hover", stat: "hover01" },
	{ res: "R-Vehicle-Prop-VTOL", stat: "V-Tol" },
];

const fallbackWeapon = 'machineguns';
const weaponStats = {
	machineguns: {
		weapons: [
			{ res: "R-Wpn-MG1Mk1", stat: "MG1Mk1" }, // mg
			{ res: "R-Wpn-MG2Mk1", stat: "MG2Mk1" }, // tmg
			{ res: "R-Wpn-MG3Mk1", stat: "MG3Mk1" }, // hmg
			{ res: "R-Wpn-MG4", stat: "MG4ROTARYMk1" }, // ag
			{ res: "R-Wpn-MG5", stat: "MG5TWINROTARY" }, // tag
		],
		// VTOL weapons of the path, in the same order.
		vtols: [
			{ res: "R-Wpn-MG3Mk1", stat: "MG3-VTOL" }, // vtol hmg
			{ res: "R-Wpn-MG4", stat: "MG4ROTARY-VTOL" }, // vtol ag
		],
		defenses: [
			{ res: "R-Defense-Tower01", stat: "GuardTower1" }, // hmg tower
			{ res: "R-Defense-Tower01", stat: "GuardTower1" }, // hmg tower
			{ res: "R-Defense-Pillbox01", stat: "PillBox1" }, // hmg bunker
			{ res: "R-Defense-WallTower01", stat: "WallTower01" }, // hmg hardpoint
			{ res: "R-Defense-RotMG", stat: "Pillbox-RotMG" }, // ag bunker
			{ res: "R-Defense-Wall-RotMg", stat: "Wall-RotMg" }, // ag hardpoint
			{ res: "R-Defense-WallTower-TwinAGun", stat: "WallTower-TwinAssaultGun" }, // tag hardpoint
		],
		// Cyborg templates, better borgs below, as usual.
		templates: [
			{ res: "R-Wpn-MG1Mk1", body: "CyborgLightBody", prop: "CyborgLegs", weapons: [ "CyborgChaingun", ] }, // mg cyborg
			{ res: "R-Wpn-MG4", body: "CyborgLightBody", prop: "CyborgLegs", weapons: [ "CyborgRotMG", ] }, // ag cyborg
		],
		// Extra things to research on this path, even if they don't lead to any new stuff
		extras: [
			"R-Wpn-MG-Damage08",
		],
	},
	flamers: {
		weapons: [
			{ res: "R-Wpn-Flamer01Mk1", stat: "Flame1Mk1" }, // flamer
			{ res: "R-Wpn-Flame2", stat: "Flame2" }, // inferno
			{ res: "R-Wpn-Plasmite-Flamer", stat: "PlasmiteFlamer" }, // plasmite
		],
		vtols: [],
		defenses: [
			{ res: "R-Defense-Pillbox05", stat: "PillBox5" }, // flamer bunker
			{ res: "R-Defense-HvyFlamer", stat: "Tower-Projector" }, // inferno bunker
			{ res: "R-Defense-PlasmiteFlamer", stat: "Plasmite-flamer-bunker" }, // plasmite bunker
		],
		templates: [
			{ res: "R-Wpn-Flamer01Mk1", body: "CyborgLightBody", prop: "CyborgLegs", weapons: [ "CyborgFlamer01", ] }, // flamer cyborg
			{ res: "R-Wpn-Flame2", body: "CyborgLightBody", prop: "CyborgLegs", weapons: [ "Cyb-Wpn-Thermite", ] }, // flamer cyborg
		],
		extras: [
			"R-Wpn-Flamer-ROF03",
			"R-Wpn-Flamer-Damage06", //Damage06 is otherwise never researched
			"R-Wpn-Flamer-Damage09",
		],
	},
	cannons: {
		weapons: [
			{ res: "R-Wpn-Cannon1Mk1", stat: "Cannon1Mk1" }, // lc
			{ res: "R-Wpn-Cannon2Mk1", stat: "Cannon2A-TMk1" }, // mc
			{ res: "R-Wpn-Cannon4AMk1", stat: "Cannon4AUTOMk1" }, // hpv
			{ res: "R-Wpn-Cannon5", stat: "Cannon5VulcanMk1" }, // ac
			{ res: "R-Wpn-Cannon6TwinAslt", stat: "Cannon6TwinAslt" }, // tac
			{ res: "R-Wpn-Cannon3Mk1", stat: "Cannon375mmMk1" }, // hc
			{ res: "R-Wpn-RailGun01", stat: "RailGun1Mk1" }, // needle
			{ res: "R-Wpn-RailGun02", stat: "RailGun2Mk1" }, // rail
			{ res: "R-Wpn-RailGun03", stat: "RailGun3Mk1" }, // gauss
		],
		vtols: [
			{ res: "R-Wpn-Cannon1Mk1", stat: "Cannon1-VTOL" }, // lc
			{ res: "R-Wpn-Cannon4AMk1", stat: "Cannon4AUTO-VTOL" }, // hpv
			{ res: "R-Wpn-Cannon5", stat: "Cannon5Vulcan-VTOL" }, // ac
			{ res: "R-Wpn-RailGun01", stat: "RailGun1-VTOL" }, // needle
			{ res: "R-Wpn-RailGun02", stat: "RailGun2-VTOL" }, // rail
		],
		defenses: [
			{ res: "R-Defense-Pillbox04", stat: "PillBox4" }, // lc bunker
			{ res: "R-Defense-WallTower02", stat: "WallTower02" }, // lc hard
			{ res: "R-Defense-WallTower03", stat: "WallTower03" }, // mc hard
			{ res: "R-Defense-Emplacement-HPVcannon", stat: "Emplacement-HPVcannon" }, // hpv empl
			{ res: "R-Defense-WallTower-HPVcannon", stat: "WallTower-HPVcannon" }, // hpv hard
			{ res: "R-Defense-Wall-VulcanCan", stat: "Wall-VulcanCan" }, // ac hard
			{ res: "R-Defense-Cannon6", stat: "PillBox-Cannon6" }, // tac bunker
			{ res: "R-Defense-WallTower04", stat: "WallTower04" }, // hc hard
			{ res: "R-Defense-Super-Cannon", stat: "X-Super-Cannon" }, // cannon fort
			{ res: "R-Defense-GuardTower-Rail1", stat: "GuardTower-Rail1" }, // needle tower
			{ res: "R-Defense-Rail2", stat: "Emplacement-Rail2" }, // rail empl
			{ res: "R-Defense-WallTower-Rail2", stat: "WallTower-Rail2" }, // rail hard
			{ res: "R-Defense-Rail3", stat: "Emplacement-Rail3" }, // gauss empl
			{ res: "R-Defense-WallTower-Rail3", stat: "WallTower-Rail3" }, // gauss hard
			{ res: "R-Defense-MassDriver", stat: "X-Super-MassDriver" }, // mass driver fort
		],
		templates: [
			{ res: "R-Wpn-Cannon1Mk1", body: "CyborgLightBody", prop: "CyborgLegs", weapons: [ "CyborgCannon", ] }, // lc borg
			{ res: "R-Cyborg-Hvywpn-Mcannon", body: "CyborgHeavyBody", prop: "CyborgLegs", weapons: [ "Cyb-Hvywpn-Mcannon", ] }, // mc super
			{ res: "R-Cyborg-Hvywpn-HPV", body: "CyborgHeavyBody", prop: "CyborgLegs", weapons: [ "Cyb-Hvywpn-HPV", ] }, // hpv super
			{ res: "R-Cyborg-Hvywpn-Acannon", body: "CyborgHeavyBody", prop: "CyborgLegs", weapons: [ "Cyb-Hvywpn-Acannon", ] }, // ac super
			{ res: "R-Wpn-RailGun01", body: "CyborgLightBody", prop: "CyborgLegs", weapons: [ "Cyb-Wpn-Rail1", ] }, // needle borg
			{ res: "R-Cyborg-Hvywpn-RailGunner", body: "CyborgHeavyBody", prop: "CyborgLegs", weapons: [ "Cyb-Hvywpn-RailGunner", ] }, // rail super
		],
		extras: [
			"R-Wpn-Cannon-Accuracy02",
			"R-Wpn-Cannon-Damage09",
			"R-Wpn-Cannon-ROF06",
			"R-Wpn-Rail-Damage03", // sure it's required by gauss, but what if our AI uses only cyborgs and vtols?
			"R-Wpn-Rail-ROF03",
			"R-Vehicle-Engine09", // cannons are heeeeavy
		],
	},
	cannons_AA: {
		weapons: [
			{ res: "R-Wpn-AAGun02", stat: "AAGun2Mk1" },
		],
		vtols: [],
		defenses: [
			{ res: "R-Defense-AASite-QuadBof", stat: "AASite-QuadBof" },
			{ res: "R-Defense-WallTower-DoubleAAgun", stat: "WallTower-DoubleAAGun" },
		],
		templates: [],
		extras: [],
	},
	mortars: {
		weapons: [
			{ res: "R-Wpn-Mortar01Lt", stat: "Mortar1Mk1" }, // duplicate stat!
			{ res: "R-Wpn-Mortar02Hvy", stat: "Mortar2Mk1" },
			{ res: "R-Wpn-Mortar3", stat: "Mortar3ROTARYMk1" },
			{ res: "R-Wpn-HowitzerMk1", stat: "Howitzer105Mk1" },
			{ res: "R-Wpn-Howitzer03-Rot", stat: "Howitzer03-Rot" },
			{ res: "R-Wpn-HvyHowitzer", stat: "Howitzer150Mk1" },
		],
		vtols: [
			{ res: "R-Wpn-Bomb01", stat: "Bomb1-VTOL-LtHE" },
			{ res: "R-Wpn-Bomb02", stat: "Bomb2-VTOL-HvHE" },
		],
		defenses: [
			{ res: "R-Defense-MortarPit", stat: "Emplacement-MortarPit01" },
			{ res: "R-Defense-HvyMor", stat: "Emplacement-MortarPit02" },
			{ res: "R-Defense-RotMor", stat: "Emplacement-RotMor" },
			{ res: "R-Defense-Howitzer", stat: "Emplacement-Howitzer105" },
			{ res: "R-Defense-RotHow", stat: "Emplacement-RotHow" },
			{ res: "R-Defense-HvyHowitzer", stat: "Emplacement-Howitzer150" },
		],
		templates: [
			{ res: "R-Wpn-Mortar01Lt", body: "CyborgLightBody", prop: "CyborgLegs", weapons: [ "Cyb-Wpn-Grenade", ] },
		],
		extras: [
			"R-Wpn-Mortar-Damage06",
			"R-Wpn-Mortar-ROF04",
			"R-Wpn-Mortar-Acc03",
			"R-Wpn-Bomb-Accuracy03",
			"R-Wpn-Howitzer-Damage06",
			"R-Wpn-Howitzer-ROF04",
			"R-Wpn-Howitzer-Accuracy03",
		],
	},
	fireMortars: {
		weapons: [
			{ res: "R-Wpn-Mortar01Lt", stat: "Mortar1Mk1" }, // duplicate stat!
			{ res: "R-Wpn-Mortar-Incenediary", stat: "Mortar-Incenediary" },
			{ res: "R-Wpn-Howitzer-Incenediary", stat: "Howitzer-Incenediary" },
		],
		vtols: [
			{ res: "R-Wpn-Bomb03", stat: "Bomb3-VTOL-LtINC" },
			{ res: "R-Wpn-Bomb04", stat: "Bomb4-VTOL-HvyINC" },
			{ res: "R-Wpn-Bomb05", stat: "Bomb5-VTOL-Plasmite" },
		],
		defenses: [
			{ res: "R-Defense-MortarPit-Incenediary", stat: "Emplacement-MortarPit-Incenediary" },
			{ res: "R-Defense-Howitzer-Incenediary", stat: "Emplacement-Howitzer-Incenediary" },
		],
		templates: [],
		extras: [
			"R-Wpn-Mortar-Damage06",
			"R-Wpn-Mortar-ROF04",
			"R-Wpn-Mortar-Acc03",
			"R-Wpn-Bomb-Accuracy03",
			"R-Wpn-Howitzer-Damage06",
			"R-Wpn-Howitzer-ROF04",
			"R-Wpn-Howitzer-Accuracy03",
		],
	},
	rockets_AT: {
		weapons: [
			{ res: "R-Wpn-Rocket05-MiniPod", stat: "Rocket-Pod" }, // pod
			{ res: "R-Wpn-Rocket01-LtAT", stat: "Rocket-LtA-T" }, // lancer
			{ res: "R-Wpn-Rocket07-Tank-Killer", stat: "Rocket-HvyA-T" }, // tk
			{ res: "R-Wpn-Missile2A-T", stat: "Missile-A-T" }, // scourge
		],
		vtols: [
			{ res: "R-Wpn-Rocket05-MiniPod", stat: "Rocket-VTOL-Pod" }, // pod
			{ res: "R-Wpn-Rocket01-LtAT", stat: "Rocket-VTOL-LtA-T" }, // lancer
			{ res: "R-Wpn-Rocket07-Tank-Killer", stat: "Rocket-VTOL-HvyA-T" }, // tk
			{ res: "R-Wpn-Missile2A-T", stat: "Missile-VTOL-AT" }, // scourge
		],
		defenses: [
			// rocket turtle AI needs early AT gateway towers, hence duplicate stat
			{ res: "R-Defense-Tower06", stat: "GuardTower6" }, // pod tower
			{ res: "R-Defense-Tower06", stat: "GuardTower6" }, // pod tower
			{ res: "R-Defense-Pillbox06", stat: "GuardTower5" }, // lancer tower
			{ res: "R-Defense-WallTower06", stat: "WallTower06" }, // lancer hardpoint
			{ res: "R-Defense-HvyA-Trocket", stat: "Emplacement-HvyATrocket" }, // tk emplacement
			{ res: "R-Defense-WallTower-HvyA-Trocket", stat: "WallTower-HvATrocket" }, // tk hardpoint
			{ res: "R-Defense-Super-Rocket", stat: "X-Super-Rocket" }, // rocket bastion
			{ res: "R-Defense-GuardTower-ATMiss", stat: "GuardTower-ATMiss" }, // scourge tower
			{ res: "R-Defense-WallTower-A-Tmiss", stat: "WallTower-Atmiss" }, // scourge hardpoint
			{ res: "R-Defense-Super-Missile", stat: "X-Super-Missile" }, // missile fortress
		],
		templates: [
			{ res: "R-Wpn-Rocket01-LtAT", body: "CyborgLightBody", prop: "CyborgLegs", weapons: [ "CyborgRocket", ] }, // lancer borg
			{ res: "R-Cyborg-Hvywpn-TK", body: "CyborgHeavyBody", prop: "CyborgLegs", weapons: [ "Cyb-Hvywpn-TK", ] }, // tk super
			{ res: "R-Wpn-Missile2A-T", body: "CyborgLightBody", prop: "CyborgLegs", weapons: [ "Cyb-Wpn-Atmiss", ] }, // scourge borg
			{ res: "R-Cyborg-Hvywpn-A-T", body: "CyborgHeavyBody", prop: "CyborgLegs", weapons: [ "Cyb-Hvywpn-A-T", ] }, // scourge super
		],
		extras: [
			"R-Wpn-Rocket-ROF03",
			"R-Wpn-Rocket-Damage09",
			"R-Wpn-Missile-Damage03",
			"R-Wpn-Missile-ROF03",
			"R-Wpn-Missile-Accuracy02",
		],
	},
	rockets_Arty: {
		weapons: [
			{ res: "R-Wpn-Rocket02-MRL", stat: "Rocket-MRL" }, // mra
			{ res: "R-Wpn-Rocket03-HvAT", stat: "Rocket-BB" }, // bb
			{ res: "R-Wpn-Rocket06-IDF", stat: "Rocket-IDF" }, // ripple
			{ res: "R-Wpn-MdArtMissile", stat: "Missile-MdArt" }, // seraph
			{ res: "R-Wpn-HvArtMissile", stat: "Missile-HvyArt" }, // archie
		],
		vtols: [
			{ res: "R-Wpn-Rocket03-HvAT", stat: "Rocket-VTOL-BB" }, // bb
		],
		defenses: [
			{ res: "R-Defense-MRL", stat: "Emplacement-MRL-pit" }, // mra
			{ res: "R-Defense-IDFRocket", stat: "Emplacement-Rocket06-IDF" }, // ripple
			{ res: "R-Defense-MdArtMissile", stat: "Emplacement-MdART-pit" }, // seraph
			{ res: "R-Defense-HvyArtMissile", stat: "Emplacement-HvART-pit" }, // archie
		],
		templates: [],
		extras: [
			"R-Wpn-Rocket-ROF03",
			"R-Wpn-Rocket-Damage09",
			"R-Wpn-Missile-Damage03",
			"R-Wpn-Missile-ROF03",
			"R-Wpn-Missile-Accuracy02",
		],
	},
	rockets_AS: {
		weapons: [
			{ res: "R-Wpn-Rocket03-HvAT", stat: "Rocket-BB" }, // bb
		],
		vtols: [
			{ res: "R-Wpn-Rocket03-HvAT", stat: "Rocket-VTOL-BB" }, // bb
		],
		defenses: [],
		templates: [],
		extras: [],
	},
	rockets_AA: {
		weapons: [
			{ res: "R-Wpn-Sunburst", stat: "Rocket-Sunburst" }, // sunburst
			{ res: "R-Wpn-Missile-LtSAM", stat: "Missile-LtSAM" }, // avenger
			{ res: "R-Wpn-Missile-HvSAM", stat: "Missile-HvySAM" }, // vindicator
		],
		vtols: [
			{ res: "R-Wpn-Sunburst", stat: "Rocket-VTOL-Sunburst" }, // sunburst a2a
		],
		defenses: [
			{ res: "R-Defense-Sunburst", stat: "P0-AASite-Sunburst" }, // sunburst
			{ res: "R-Defense-SamSite1", stat: "P0-AASite-SAM1" }, // avenger
			{ res: "R-Defense-WallTower-SamSite", stat: "WallTower-SamSite" }, // avenger
			{ res: "R-Defense-SamSite2", stat: "P0-AASite-SAM2" }, // vindicator
			{ res: "R-Defense-WallTower-SamHvy", stat: "WallTower-SamHvy" }, // vindicator hardpoint
		],
		templates: [],
		extras: [],
	},
	lasers: {
		weapons: [
			{ res: "R-Wpn-Laser01", stat: "Laser3BEAMMk1" }, // flash
			{ res: "R-Wpn-Laser02", stat: "Laser2PULSEMk1" }, // pulse
			{ res: "R-Wpn-HvyLaser", stat: "HeavyLaser" }, // hvy laser
		],
		vtols: [
			{ res: "R-Wpn-Laser01", stat: "Laser3BEAM-VTOL" }, // flash
			{ res: "R-Wpn-Laser02", stat: "Laser2PULSE-VTOL" }, // pulse
			{ res: "R-Wpn-HvyLaser", stat: "HeavyLaser-VTOL" }, // hvy laser
		],
		defenses: [
			{ res: "R-Defense-PrisLas", stat: "Emplacement-PrisLas" }, // flash empl
			{ res: "R-Defense-PulseLas", stat: "GuardTower-BeamLas" }, // pulse tower
			{ res: "R-Defense-WallTower-PulseLas", stat: "WallTower-PulseLas" }, // pulse hard
			{ res: "R-Defense-HeavyLas", stat: "Emplacement-HeavyLaser" }, // hvy empl
		],
		templates: [
			{ res: "R-Wpn-Laser01", body: "CyborgLightBody", prop: "CyborgLegs", weapons: [ "Cyb-Wpn-Laser", ] }, // flash borg
			{ res: "R-Cyborg-Hvywpn-PulseLsr", body: "CyborgHeavyBody", prop: "CyborgLegs", weapons: [ "Cyb-Hvywpn-PulseLsr", ] }, // pulse super
		],
		extras: [
			"R-Wpn-Energy-Damage03",
			"R-Wpn-Energy-ROF03",
			"R-Wpn-Energy-Accuracy01",
		],
	},
	fort_AT: {
		weapons: [],
		vtols: [],
		defenses: [
		  { res: "R-Defense-Super-Cannon", stat: "X-Super-Cannon" },
		  { res: "R-Defense-Super-Rocket", stat: "X-Super-Rocket" },
		  { res: "R-Defense-Super-Missile", stat: "X-Super-Missile" },
		  { res: "R-Defense-MassDriver", stat: "X-Super-MassDriver" },
		],
		templates: [],
		extras: [],
	}, 
	useless_AP: {
		weapons: [
			{ stat: "MG1-Pillbox" }, // imaginary invisible single mg, may be found on some maps
			{ stat: "MG2-Pillbox" }, // imaginary invisible twin mg, may be found on some maps
			{ stat: "MG3-Pillbox" }, // mg bunker dedicated weapon
			{ stat: "NEXUSlink" }, // nexus link (still unused)
			{ stat: "MG4ROTARY-Pillbox" }, // ag bunker dedicated weapon
		],
		vtols: [],
		defenses: [],
		templates: [],
		extras: [],
	},
	AS: {
		weapons: [
			{ res: "R-Wpn-PlasmaCannon", stat: "Laser4-PlasmaCannon" }, // plasma cannon
			//{ res: "", stat: "PlasmaHeavy" }, // Heavy Plasma launcher
		],
		vtols: [],
		defenses: [
		    { res: "R-Defense-PlasmaCannon", stat: "Emplacement-PlasmaCannon" },
		],
		templates: [],
		extras: [
			"R-Wpn-Flamer-Damage06", //Damage06 is otherwise never researched
			"R-Wpn-Flamer-Damage09",
		],
	},
	bombs: {
		weapons: [],
		vtols: [
			{ res: "R-Wpn-Bomb01", stat: "Bomb1-VTOL-LtHE" }, // cluster bomb
			{ res: "R-Wpn-Bomb02", stat: "Bomb2-VTOL-HvHE" }, // HEAP bomb
			{ res: "R-Wpn-Bomb03", stat: "Bomb3-VTOL-LtINC" }, // Phosphor bomb
			{ res: "R-Wpn-Bomb04", stat: "Bomb4-VTOL-HvyINC" }, // Thermite bomb
			{ res: "R-Wpn-Bomb05", stat: "Bomb5-VTOL-Plasmite" }, // Plasmite bomb
			//{ res: "R-Wpn-Bomb06", stat: "Bomb6-VTOL-EMP" }, // EMP Missile Launcher
		],
		defenses: [],
		templates: [],
		extras: [
			"R-Wpn-Bomb-Accuracy03",
			"R-Wpn-Flamer-Damage06", //Damage06 is otherwise never researched
			"R-Wpn-Flamer-Damage09",
			"R-Struc-VTOLPad-Upgrade06",
		],
	},
	AA: {
		weapons: [
			{ res: "R-Wpn-AAGun03", stat: "QuadMg1AAGun" }, // hurricane 
			{ res: "R-Wpn-AAGun04", stat: "QuadRotAAGun" }, // whirlwind 
		],
		vtols: [
			{ res: "R-Wpn-Sunburst", stat: "Rocket-VTOL-Sunburst" },
		],
		defenses: [
			{ res: "R-Defense-AASite-QuadMg1", stat: "AASite-QuadMg1" }, // hurricane 
			{ res: "R-Defense-AASite-QuadRotMg", stat: "AASite-QuadRotMg" }, // whirlwind
			{ res: "R-Defense-WallTower-QuadRotAA", stat: "WallTower-QuadRotAAGun" },
		],
		templates: [],
		extras: [
			"R-Wpn-AAGun-Damage06",
			"R-Wpn-AAGun-ROF06",
			"R-Wpn-AAGun-Accuracy03",
		],
	},
	nexusTech: {
		weapons: [
			//{ res: "R-Wpn-EMPCannon", stat: "EMP-Cannon" },
			//{ res: "R-Wpn-MortarEMP", stat: "MortarEMP" },
			{ res: "R-Sys-SpyTurret", stat: "SpyTurret01" },
		],
		vtols: [],
		defenses: [
		    { res: "R-Sys-SpyTurret", stat: "Sys-SpyTower" },
		    { res: "R-Wpn-EMPCannon", stat: "WallTower-EMP" },
		    { res: "R-Defense-EMPMortar", stat: "Emplacement-MortarEMP" }, 
		],
		templates: [],
		extras: [
		    "R-Sys-Resistance-Circuits",
		],
	},
	lasers_AA: {
		weapons: [
			{ res: "R-Wpn-AALaser", stat: "AAGunLaser" }, // stormbringer
		],
		vtols: [],
		defenses: [
			{ res: "R-Defense-AA-Laser", stat: "P0-AASite-Laser" }, // stormbringer
		],
		templates: [],
		extras: [
			"R-Wpn-Energy-Damage03",
			"R-Wpn-Energy-ROF03",
			"R-Wpn-Energy-Accuracy01",
		],
	},
};