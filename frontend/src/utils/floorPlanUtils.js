import { normalizeImageUrl } from './imageUtils';

/** "2 BHK" → "2bhk", "1/2 BHK" → "12bhk" */
export function normalizeBhkKey(bhk) {
  if (!bhk) return null;
  return String(bhk).toLowerCase().replace(/\s+/g, '').replace(/\//g, '');
}

/** "Type 3A" → "type3a", "Combination 01" → "combination01" */
export function normalizeTypeKey(unitType) {
  if (!unitType) return null;
  return String(unitType).toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
}

export function parseFloorPlanFilename(filename) {
  const raw = String(filename || '')
    .trim()
    .toLowerCase()
    .replace(/\.[^.]+$/, '');

  const bhkMatch = raw.match(/(\d+(?:\.\d+)?)(?:\/(\d+))?\s*-?\s*bhk/i);
  let bhkKey = null;
  if (bhkMatch) {
    const whole = bhkMatch[2] ? `${bhkMatch[1]}/${bhkMatch[2]}` : bhkMatch[1];
    bhkKey = `${whole.replace(/\s/g, '')}bhk`;
  }

  const typeMatch = raw.match(/type\s*([a-z0-9]+)/i);
  const typeKey = typeMatch ? `type${typeMatch[1].replace(/\s/g, '')}` : null;

  return { raw, bhkKey, typeKey };
}

/** Exclude wing-level floor plans (e.g. PalmPresident-Awing(...).png). */
export function isWingPlan(filename) {
  const raw = String(filename || '').trim().toLowerCase();
  if (!raw) return false;
  if (/\b[ab]?wing\s*\(/.test(raw)) return true;
  if (/-\s*[ab]?wing\b/.test(raw)) return true;
  if (raw.includes('wing') && raw.includes('floor plan')) return true;
  return false;
}

export function bhkLabelFromParsed(parsed) {
  if (!parsed?.bhkKey) return 'Other';
  const match = parsed.bhkKey.match(/^([\d./]+)bhk$/i);
  if (!match) return 'Other';
  const value = match[1].includes('/') ? match[1].replace('/', ' / ') : match[1];
  return `${value} BHK`;
}

export function typeLabelFromParsed(parsed) {
  if (!parsed?.typeKey) return null;
  const match = parsed.typeKey.match(/^type(\d+)([a-z]*)$/i);
  if (match) return `Type ${match[1]}${match[2].toUpperCase()}`;
  return parsed.typeKey.replace(/^type/i, 'Type ');
}

function bhkKeysMatch(filenameBhk, unitBhk) {
  if (!filenameBhk || !unitBhk) return false;
  const normalize = (key) => String(key || '').toLowerCase().replace(/bhk$/, '').replace(/[./\s]/g, '');
  return normalize(filenameBhk) === normalize(unitBhk);
}

export function mediaMatchesUnit(media, unit, unitsSameBhk = []) {
  const parsed = parseFloorPlanFilename(media.original_filename || media.blob_url);
  const unitBhk = normalizeBhkKey(unit.bhk_type);
  const unitType = normalizeTypeKey(unit.unit_type);

  if (unit.is_combination || (!unit.bhk_type && unit.unit_type)) {
    const comboKey = normalizeTypeKey(unit.unit_type);
    return parsed.raw.includes(comboKey) || parsed.typeKey === comboKey;
  }

  if (!unitBhk || !parsed.bhkKey || !bhkKeysMatch(parsed.bhkKey, unitBhk)) {
    return false;
  }

  if (!parsed.typeKey) {
    if (!unit.unit_type) return true;
    return unitsSameBhk.length === 1;
  }

  if (!unitType) return false;
  return parsed.typeKey === unitType;
}

export function findUnitForMedia(media, unitConfigs = []) {
  return (unitConfigs || []).find((unit) => {
    const unitsSameBhk = unitConfigs.filter(
      (row) => normalizeBhkKey(row.bhk_type) === normalizeBhkKey(unit.bhk_type),
    );
    return mediaMatchesUnit(media, unit, unitsSameBhk);
  }) || null;
}

export function formatUnitArea(unit) {
  if (!unit) return null;
  const area = unit.rera_carpet_area ?? unit.carpet_area_min;
  const unitLabel = unit.area_unit || 'sqft';
  if (!area) return null;
  if (unit.carpet_area_min && unit.carpet_area_max && unit.carpet_area_min !== unit.carpet_area_max) {
    return `${unit.carpet_area_min} – ${unit.carpet_area_max} ${unitLabel}`;
  }
  return `${area} ${unitLabel}`;
}

function sortTypes(a, b) {
  const parseType = (label) => {
    const match = String(label || '').match(/type\s*(\d+)([a-z]*)/i);
    return match ? [Number(match[1]), match[2] || ''] : [999, String(label || '')];
  };
  const [numA, suffixA] = parseType(a.typeLabel);
  const [numB, suffixB] = parseType(b.typeLabel);
  if (numA !== numB) return numA - numB;
  return String(suffixA).localeCompare(String(suffixB));
}

const sortBhk = (a, b) => {
  const numA = parseFloat((a.bhkLabel || '').match(/[\d.]+/)?.[0] || '0');
  const numB = parseFloat((b.bhkLabel || '').match(/[\d.]+/)?.[0] || '0');
  if (numA !== numB) return numA - numB;
  return a.bhkLabel.localeCompare(b.bhkLabel);
};

/**
 * Media-first floor plan catalog.
 * Every floor_plan media row is shown (except wing plans).
 * unit_config is used only to enrich details when a match exists.
 */
export function buildFloorPlanCatalog(unitConfigs = [], mediaItems = []) {
  const groups = new Map();

  const media = (mediaItems || [])
    .filter((item) => item?.blob_url && !isWingPlan(item.original_filename || item.blob_url))
    .map((item) => ({
      ...item,
      url: normalizeImageUrl(item.blob_url),
      parsed: parseFloorPlanFilename(item.original_filename || item.blob_url),
    }))
    .filter((item) => item.url);

  for (const item of media) {
    const matchedUnit = findUnitForMedia(item, unitConfigs);
    const bhkLabel = matchedUnit?.bhk_type || bhkLabelFromParsed(item.parsed);
    const typeLabel = matchedUnit?.unit_type || typeLabelFromParsed(item.parsed) || 'Plan';
    const typeKey = matchedUnit
      ? (normalizeTypeKey(matchedUnit.unit_type) || `unit-${matchedUnit.id}`)
      : (item.parsed.typeKey || `plan-${item.id}`);

    if (!groups.has(bhkLabel)) {
      groups.set(bhkLabel, { bhkLabel, bhkType: matchedUnit?.bhk_type || bhkLabel, types: [] });
    }

    const group = groups.get(bhkLabel);
    if (group.types.some((entry) => entry.typeKey === typeKey && entry.image === item.url)) {
      continue;
    }

    group.types.push({
      typeKey,
      typeLabel,
      unit: matchedUnit,
      image: item.url,
      media: item,
      label: matchedUnit?.unit_type
        ? `${matchedUnit.bhk_type} – ${matchedUnit.unit_type}`
        : [bhkLabel, typeLabel !== 'Plan' ? typeLabel : ''].filter(Boolean).join(' – '),
    });
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      types: [...group.types].sort(sortTypes),
    }))
    .filter((group) => group.types.length > 0)
    .sort(sortBhk);
}

export function unitToPlanDetails(unit, mediaEntry = null) {
  if (!unit) {
    const parsed = mediaEntry?.parsed;
    const bhkLabel = parsed ? bhkLabelFromParsed(parsed) : null;
    const typeLabel = parsed?.typeKey ? typeLabelFromParsed(parsed) : null;
    return {
      title: [bhkLabel, typeLabel].filter(Boolean).join(' – ') || 'Floor Plan',
      builtUpArea: null,
      ceilingHeight: null,
      mainDoorFacing: null,
      modularKitchen: null,
      img: mediaEntry?.url || null,
      wing: null,
      floorRange: null,
      roomDetails: [],
    };
  }

  return {
    title: unit.unit_type ? `${unit.bhk_type || ''} – ${unit.unit_type}`.trim() : (unit.bhk_type || 'Floor Plan'),
    builtUpArea: formatUnitArea(unit),
    ceilingHeight: unit.ceiling_height || null,
    mainDoorFacing: unit.main_door_facing || null,
    modularKitchen: unit.kitchen_type || (unit.modular_kitchen ? 'Modular Kitchen' : null),
    img: null,
    wing: unit.wing || null,
    floorRange: unit.floor_range_raw || null,
    roomDetails: Array.isArray(unit.room_details) ? unit.room_details : [],
  };
}
