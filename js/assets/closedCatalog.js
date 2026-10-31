/**
 * Closed art tier. Creators add model files here.
 * A map editor can only assign these ids. A missing id does not invent a file.
 * Sounds stay in data/pack/audio.json and play from Asset/AudioV2/.
 */

export const UNIT_TEMPLATE_FILE = 'Asset/AssetSVG/Unit/Unit_Template.svg';

export const CLOSED_MODELS = Object.freeze({
  'model.unit.default_1': Object.freeze({
    id: 'model.unit.default_1',
    file: UNIT_TEMPLATE_FILE,
    groupId: 'Default_skin_1',
  }),
  'model.unit.default_2': Object.freeze({
    id: 'model.unit.default_2',
    file: UNIT_TEMPLATE_FILE,
    groupId: 'Default_skin_2',
  }),
});

export function getClosedModel(id) {
  if (!id) return null;
  return CLOSED_MODELS[id] || null;
}

export function closedModelGroupId(id) {
  const model = getClosedModel(id);
  return model ? model.groupId : '';
}

export function listClosedModelGroupIds() {
  const ids = [];
  const keys = Object.keys(CLOSED_MODELS);
  for (let i = 0; i < keys.length; i++) {
    const groupId = CLOSED_MODELS[keys[i]].groupId;
    if (groupId && ids.indexOf(groupId) < 0) ids.push(groupId);
  }
  return ids;
}
