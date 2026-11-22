/**
 * Data-driven team catalog.
 * Authoring inputs (ids, names, hostileTo, allyTo, role) come from Rules / map / pack JSON.
 * Code only evaluates relations — it does not invent Team 1..6 as a fixed menu.
 */

import { TEAM, CollisionLayer } from '../config.js';
import {
  TEAM_ROW_CAP,
  teamIdList,
  normalizeTeamRows,
  teamsFromDoc,
  teamIdsFromRows,
  teamIdsFromDoc,
  firstTeamId,
  teamIdByRole,
  findTeamRow,
  clampTeamId,
  teamSelectOptions,
  teamsFromMatch,
} from './teamRows.js';

export {
  TEAM_ROW_CAP,
  teamIdList,
  normalizeTeamRows,
  teamsFromDoc,
  teamIdsFromRows,
  teamIdsFromDoc,
  firstTeamId,
  teamIdByRole,
  findTeamRow,
  clampTeamId,
  teamSelectOptions,
  teamsFromMatch,
};

export function playerTeamId(match, packTeams) {
  if (match && match.playerTeam != null) return match.playerTeam | 0;
  return teamIdByRole('player', teamsFromMatch(match, packTeams), packTeams);
}

export function enemyTeamId(match, packTeams) {
  return teamIdByRole('enemy', teamsFromMatch(match, packTeams), packTeams);
}

/**
 * Collision layer from team row role / order — formula over data.
 */
export function collisionLayerForTeam(teamId, matchOrDoc, packTeams) {
  if (teamId === TEAM.NEUTRAL || teamId === 0) return CollisionLayer.NATURE;
  const rows =
    matchOrDoc && matchOrDoc.mapTeams
      ? teamsFromMatch(matchOrDoc, packTeams)
      : teamsFromDoc(matchOrDoc, packTeams);
  const row = findTeamRow(teamId, rows, packTeams);
  if (row && row.role === 'player') return CollisionLayer.TEAM_1;
  if (row && row.role === 'enemy') return CollisionLayer.TEAM_2;
  if (row && row.role === 'ally') return CollisionLayer.TEAM_3;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].id === (teamId | 0)) {
      if (i === 0) return CollisionLayer.TEAM_1;
      if (i === 1) return CollisionLayer.TEAM_2;
      if (i === 2) return CollisionLayer.TEAM_3;
      return CollisionLayer.OTHER;
    }
  }
  return CollisionLayer.OTHER;
}
