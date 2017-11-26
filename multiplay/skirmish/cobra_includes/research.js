
//updates a research list with whatever is passed to it.
function updateResearchList(stat, len)
{
	if (!isDefined(len))
	{
		len = 0;
	}

	var list = [];
	for (var x = 0, d = stat.length - len; x < d; ++x)
	{
		isDefined(stat[x].res) ? list.push(stat[x].res) : list.push(stat[x]);
	}

	return list;
}

//Initialization of research lists when eventStartLevel is triggered.
//Call this again when manually changing a personality.
function initializeResearchLists()
{
	techlist = SUB_PERSONALITIES[personality].res;
	antiAirTech = updateResearchList(SUB_PERSONALITIES[personality].antiAir.defenses);
	antiAirExtras = updateResearchList(SUB_PERSONALITIES[personality].antiAir.extras);
	extremeLaserTech = updateResearchList(weaponStats.AS.extras);
	laserTech = updateResearchList(weaponStats.lasers.weapons);
	laserExtra = updateResearchList(weaponStats.lasers.extras);
	weaponTech = updateResearchList(SUB_PERSONALITIES[personality].primaryWeapon.weapons);
	artilleryTech = updateResearchList(SUB_PERSONALITIES[personality].artillery.weapons);
	artillExtra = updateResearchList(SUB_PERSONALITIES[personality].artillery.extras);
	extraTech = updateResearchList(SUB_PERSONALITIES[personality].primaryWeapon.extras);
	secondaryWeaponTech = updateResearchList(SUB_PERSONALITIES[personality].secondaryWeapon.weapons);
	secondaryWeaponExtra = updateResearchList(SUB_PERSONALITIES[personality].secondaryWeapon.extras);
	defenseTech = updateResearchList(SUB_PERSONALITIES[personality].artillery.defenses);
	standardDefenseTech = updateResearchList(SUB_PERSONALITIES[personality].primaryWeapon.defenses)
	cyborgWeaps = updateResearchList(SUB_PERSONALITIES[personality].primaryWeapon.templates);
}

//This function aims to more cleanly discover available research topics
//with the given list provided. pursueResearch falls short in that it fails to
//acknowledge the availability of an item further into the list if a previous
//one is not completed... so lets help it a bit.
function evalResearch(lab, list)
{
	for (var i = 0, a = list.length; i < a; ++i)
	{
		if (pursueResearch(lab, list[i]))
		{
			return true;
		}
	}

	return false;
}

function researchCobra()
{
	if (!countDroid(DROID_CONSTRUCT) || !(isDefined(techlist) && isDefined(turnOffCyborgs)))
	{
		return;
	}

	var labList = enumStruct(me, structures.labs).filter(function(lb) {
		return ((lb.status === BUILT) && structureIdle(lb));
	});

	for (var i = 0, a = labList.length; i < a; ++i)
	{
		var lab = labList[i];
		var found = found = evalResearch(lab, ESSENTIALS);

		if (!found && getRealPower() > MIN_POWER + (2 * i))
		{
			if (!found)
				found = evalResearch(lab, techlist);
			if (!found)
				found = evalResearch(lab, ESSENTIALS_2);

			if (!found && (random(101) < SUB_PERSONALITIES[personality].systemPriority))
			{
				if (!found)
					found = evalResearch(lab, SYSTEM_UPGRADES);
				if (!found)
					found = evalResearch(lab, LATE_EARLY_GAME_TECH);
			}

			if (!found && !turnOffCyborgs)
				found = evalResearch(lab, cyborgWeaps);
			if (!found)
				found = evalResearch(lab, weaponTech);

			if (!found && (random(101) < SUB_PERSONALITIES[personality].alloyPriority))
			{
				if (!turnOffCyborgs && countStruct(CYBORG_FACTORY))
				{
					found = evalResearch(lab, CYBORG_ARMOR);
				}
				if (!found)
					found = evalResearch(lab, TANK_ARMOR);
			}

			if (!found)
				found = evalResearch(lab, SENSOR_TECH);

			//Use default AA until stormbringer.
			if (!random(2) && countEnemyVTOL() && !isStructureAvailable("P0-AASite-Laser"))
			{
				if (!found)
					found = evalResearch(lab, antiAirTech);
				if (!found)
					found = evalResearch(lab, antiAirExtras);
			}

			if (!found && useArti)
				found = evalResearch(lab, artilleryTech);
			if (!found)
				found = evalResearch(lab, extraTech);

			if (!found)
				found = evalResearch(lab, BODY_RESEARCH);
			if (!found && useArti)
				found = evalResearch(lab, artillExtra);


			if (!found && (random(101) < SUB_PERSONALITIES[personality].defensePriority))
			{
				found = evalResearch(lab, standardDefenseTech);
				if (!found && useArti)
					found = evalResearch(lab, defenseTech);
				if (!found)
					found = evalResearch(lab, DEFENSE_UPGRADES);
			}

			if (!found && useVtol && (random(101) < SUB_PERSONALITIES[personality].vtolPriority))
				found = evalResearch(lab, VTOL_RES);

			if (!found)
				found = pursueResearch(lab, "R-Wpn-PlasmaCannon");
			if (componentAvailable("Laser4-PlasmaCannon"))
			{
				if(!found)
					found = evalResearch(lab, extremeLaserTech);
				if(!found)
					found = evalResearch(lab, FLAMER);
			}

			var cyborgSecondary = updateResearchList(SUB_PERSONALITIES[personality].secondaryWeapon.templates);
			var len = SUB_PERSONALITIES[personality].primaryWeapon.weapons.length - 1;
			if (isDesignable(SUB_PERSONALITIES[personality].primaryWeapon.weapons[len].stat))
			{
				if(!found && !turnOffCyborgs && isDefined(cyborgSecondary[0]))
					found = pursueResearch(lab, cyborgSecondary);
				if(!found)
					found = evalResearch(lab, secondaryWeaponExtra);
				if(!found)
					found = evalResearch(lab, secondaryWeaponTech);
			}

			// Lasers
			var aa = returnAntiAirAlias();
			if (!found && !turnOffCyborgs)
				found = pursueResearch(lab, "R-Cyborg-Hvywpn-PulseLsr");
			if (!found)
				found = evalResearch(lab, laserTech);
			if (!found)
				found = evalResearch(lab, laserExtra);
			//Rocket/missile AA does not need this. Still uses it if researched.
			if (!found && (aa !== "rkta" && aa !== "missa"))
				found = pursueResearch(lab, "R-Defense-AA-Laser");

			//Very likely going to be done with research by now.
			if (!found && componentAvailable("Body14SUP") && isDesignable("EMP-Cannon") && isStructureAvailable(structures.extras[2]))
			{
				researchComplete = true;
			}
		}
	}
}
