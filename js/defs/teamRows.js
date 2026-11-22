/**
 * Pure team-row helpers (no config / gamePack imports).
 * Keeps catalog normalize usable from gamePack without a circular init cycle.
 */

/** Soft capacity so a bad file cannot allocate forever — not an authoring menu of 1..N. */
export const TEAM_ROW_CAP = 32;

function asRows(teams) {
  return Array.isArray(teams) ? teams : [];
}

export function teamIdList(src) {
  const out = [];
  const list = Array.isArray(src) ? src : [];
  for (let i = 0; i < list.length; i++) {
    const id = list[i] | 0;
    if (id >= 1 && out.indexOf(id) < 0) out.push(id);
  }
  return out;
}

/** Normalize team rows from JSON (map Rules or pack). */
export function normalizeTeamRows(teams) {
  const src = asRows(teams);
  const out = [];
  const seen = Object.create(null);
  for (let i = 0; i < src.length && out.length < TEAM_ROW_CAP; i++) {
    const row = src[i];
    if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
    const id = row.id | 0;
    if (id < 1 || seen[id]) continue;
    seen[id] = true;
    const next = Object.assign({}, row);
    next.id = id;
    next.name = typeof row.name === 'string' && row.name ? row.name : 'Team ' + id;
    next.hostileTo = teamIdList(row.hostileTo);
    next.allyTo = teamIdList(row.allyTo);
    if (typeof row.role === 'string' && row.role) next.role = row.role;
    out.push(next);
  }
  return out;
}

/**
 * Teams from map doc Rules, else optional pack.teams fallback.
 * @param {object|null} doc
 * @param {object[]|null} [packTeams]
 */
export function teamsFromDoc(doc, packTeams) {
  if (doc && Array.isArray(doc.teams) && doc.teams.length) {
    return normalizeTeamRows(doc.teams);
  }
  return normalizeTeamRows(packTeams);
}

export function teamIdsFromRows(rows) {
  const list = normalizeTeamRows(rows);
  const ids = [];
  for (let i = 0; i < list.length; i++) ids.push(list[i].id);
  return ids;
}

export function teamIdsFromDoc(doc, packTeams) {
  return teamIdsFromRows(teamsFromDoc(doc, packTeams));
}

/** First authored team id — never assumes "1". */
export function firstTeamId(docOrRows, packTeams) {
  const rows = Array.isArray(docOrRows)
    ? normalizeTeamRows(docOrRows)
    : teamsFromDoc(docOrRows, packTeams);
  return rows.length ? rows[0].id : 0;
}

/** Pack/map team id tagged with role (e.g. player / enemy) — data field. */
export function teamIdByRole(role, docOrRows, packTeams) {
  if (!role) return firstTeamId(docOrRows, packTeams);
  const rows = Array.isArray(docOrRows)
    ? normalizeTeamRows(docOrRows)
    : teamsFromDoc(docOrRows, packTeams);
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].role === role) return rows[i].id;
  }
  return firstTeamId(rows, packTeams);
}

export function findTeamRow(teamId, docOrRows, packTeams) {
  const id = teamId | 0;
  const rows = Array.isArray(docOrRows)
    ? normalizeTeamRows(docOrRows)
    : teamsFromDoc(docOrRows, packTeams);
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].id === id) return rows[i];
  }
  return null;
}

/** Keep id only if it exists in the catalog; otherwise first authored id. */
export function clampTeamId(teamId, docOrRows, packTeams) {
  const id = teamId | 0;
  const rows = Array.isArray(docOrRows)
    ? normalizeTeamRows(docOrRows)
    : teamsFromDoc(docOrRows, packTeams);
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].id === id) return id;
  }
  return firstTeamId(rows, packTeams);
}

/**
 * Editor select options — only teams present in Rules/doc (or pack fallback).
 * Neutral is nature, not listed unless includeNeutral.
 */
export function teamSelectOptions(doc, opts, packTeams) {
  const rows = teamsFromDoc(doc, packTeams);
  const options = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    options.push({
      value: String(row.id),
      label: row.name || String(row.id),
    });
  }
  if (opts && opts.includeNeutral) {
    options.push({ value: '0', label: 'Neutral' });
  }
  return options;
}

/** Match-time team rows: map install first, else packTeams. */
export function teamsFromMatch(match, packTeams) {
  if (match && Array.isArray(match.mapTeams) && match.mapTeams.length) {
    return normalizeTeamRows(match.mapTeams);
  }
  if (match && match.editorMapDoc) {
    return teamsFromDoc(match.editorMapDoc, packTeams);
  }
  if (match && match.playMap && match.playMap.mapDoc) {
    return teamsFromDoc(match.playMap.mapDoc, packTeams);
  }
  return normalizeTeamRows(packTeams);
}
