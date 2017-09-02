
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
	techlist = subpersonalities[personality].res;
	antiAirTech = updateResearchList(subpersonalities[personality].antiAir.defenses);
	antiAirExtras = updateResearchList(subpersonalities[personality].antiAir.extras);
	extremeLaserTech = updateResearchList(weaponStats.AS.extras);
	laserTech = updateResearchList(weaponStats.lasers.weapons);
	laserExtra = updateResearchList(weaponStats.lasers.extras);
	weaponTech = updateResearchList(subpersonalities[personality].primaryWeapon.weapons);
	artilleryTech = updateResearchList(subpersonalities[personality].artillery.weapons);
	artillExtra = updateResearchList(subpersonalities[personality].artillery.extras);
	extraTech = updateResearchList(subpersonalities[personality].primaryWeapon.extras);
	secondaryWeaponTech = updateResearchList(subpersonalities[personality].secondaryWeapon.weapons);
	secondaryWeaponExtra = updateResearchList(subpersonalities[personality].secondaryWeapon.extras);
	defenseTech = updateResearchList(subpersonalities[personality].artillery.defenses);
	cyborgWeaps = updateResearchList(subpersonalities[personality].primaryWeapon.templates);
}

//This function aims to more cleanly discover available research topics
//with the given list provided. pursueResearch falls short in that it fails to
//acknowledge the availability of an item further into the list if a previous
//one is not completed... so lets help it a bit.
function evalResearch(lab, list)
{
	var found = false;

	for (var i = 0, a = list.length; i < a; ++i)
	{
		found = pursueResearch(lab, list[i]);
		if (found)
		{
			break;
		}
	}

	return found;
}

function researchCobra()
{
	const MIN_POWER = 170;
	if (!countDroid(DROID_CONSTRUCT)
		|| getRealPower() < MIN_POWER
		|| !(isDefined(techlist) && isDefined(turnOffCyborgs)))
	{
		return;
	}

	var labList = enumStruct(me, structures.labs).filter(function(lb) {
		return ((lb.status === BUILT) && structureIdle(lb));
	});

	for (var i = 0, a = labList.length; i < a; ++i)
	{
		var lab = labList[i];
		var found = false;

		if (getRealPower() > MIN_POWER)
		{
			found = evalResearch(lab, ESSENTIALS);
			if (!found)
				found = evalResearch(lab, techlist);

			if (!found)
				found = evalResearch(lab, weaponTech);
			if (!found)
				found = evalResearch(lab, SYSTEM_UPGRADES);
			if (!found)
				found = evalResearch(lab, LATE_EARLY_GAME_TECH);

			//Use default AA until stormbringer.
			if (countEnemyVTOL() && !isStructureAvailable("P0-AASite-Laser"))
			{
				if (!found)
					found = evalResearch(lab, antiAirTech);
				if (!found)
					found = evalResearch(lab, antiAirExtras);
			}

			if (!found && (random(101) < subpersonalities[personality].alloyPriority))
			{
				found = evalResearch(lab, TANK_ARMOR);
				if (!found && !turnOffCyborgs && countStruct(CYBORG_FACTORY))
				{
					found = evalResearch(lab, CYBORG_ARMOR);
				}
			}

			if (!found && !turnOffCyborgs)
				found = evalResearch(lab, cyborgWeaps);
			if (!found)
				found = evalResearch(lab, extraTech);
			if (!found)
				found = evalResearch(lab, artilleryTech);
			if (!found)
				found = evalResearch(lab, MID_GAME_TECH);
			if (!found)
				found = evalResearch(lab, artillExtra);

			if (!found)
				found = evalResearch(lab, defenseTech);
			if (!found && (random(101) < subpersonalities[personality].systemPriority))
				found = evalResearch(lab, SENSOR_TECH);

			if (!found && (random(101) < subpersonalities[personality].vtolPriority))
				found = evalResearch(lab, VTOL_RES);

			if (!found && (random(101) < subpersonalities[personality].defensePriority))
				found = evalResearch(lab, DEFENSE_UPGRADES);
			if (!found)
				found = evalResearch(lab, BODY_RESEARCH);


			if (!found)
				found = pursueResearch(lab, "R-Wpn-PlasmaCannon");
			if (componentAvailable("Laser4-PlasmaCannon"))
			{
				if(!found)
					found = evalResearch(lab, extremeLaserTech);
				if(!found)
					found = evalResearch(lab, FLAMER);
			}


			//Late game weapon.
			if (random(3))
			{
				var cyborgSecondary = appendListElements(cyborgSecondary, updateResearchList(subpersonalities[personality].secondaryWeapon.templates));
				var len = subpersonalities[personality].primaryWeapon.weapons.length - 1;

				if (isDesignable(subpersonalities[personality].primaryWeapon.weapons[len].stat))
				{
					if(!found && !turnOffCyborgs && isDefined(cyborgSecondary[0]))
						found = pursueResearch(lab, cyborgSecondary);
					if(!found)
						found = evalResearch(lab, secondaryWeaponExtra);
					if(!found)
						found = evalResearch(lab, secondaryWeaponTech);
				}
			}

			// Lasers
			if (!found && !turnOffCyborgs)
				found = pursueResearch(lab, "R-Cyborg-Hvywpn-PulseLsr");
			if (!found)
				found = evalResearch(lab, laserTech);
			if (!found)
				found = evalResearch(lab, laserExtra);
			if (!found)
				found = pursueResearch(lab, "R-Defense-AA-Laser");

			//Very likely going to be done with research by now.
			if (!found && componentAvailable("Body14SUP") && isDesignable("EMP-Cannon") && isStructureAvailable(structures.extras[2]))
			{
				researchComplete = true;
			}
		}
	}
}
