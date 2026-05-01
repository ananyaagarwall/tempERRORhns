import { fetchBuilders } from "../services/api";

const PROPERTY_ROUTE_PREFIX = "p";
const BUILDER_ROUTE_PREFIX = "b";

export const normalizeBuilderSlug = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const buildPropertyRouteToken = (propertyId) => {
  if (propertyId === null || propertyId === undefined || propertyId === "") {
    return "";
  }

  const raw = String(propertyId).trim();
  if (!raw) {
    return "";
  }

  const match = raw.match(/^p*(\d+)$/i);
  if (match) {
    return `${PROPERTY_ROUTE_PREFIX}${match[1]}`;
  }

  return `${PROPERTY_ROUTE_PREFIX}${raw}`;
};

export const buildPropertyPath = (propertyId) => {
  const token = buildPropertyRouteToken(propertyId);
  return token ? `/property/${token}` : "/properties";
};

export const parsePropertyIdFromRouteToken = (token) => {
  const match = String(token || "").trim().match(/^p?(\d+)$/i);
  if (!match) {
    return null;
  }
  return Number(match[1]);
};

const sortBuildersForRouting = (builders = []) =>
  [...builders].sort((left, right) => {
    const leftName = (left?.company_name || left?.brand_name || "").toLowerCase();
    const rightName = (right?.company_name || right?.brand_name || "").toLowerCase();
    const byName = leftName.localeCompare(rightName);
    if (byName !== 0) {
      return byName;
    }
    return String(left?.rera_id || "").localeCompare(String(right?.rera_id || ""));
  });

export const normalizeBuildersForRouting = (builders = []) =>
  sortBuildersForRouting(builders).map((builder, index) => ({
    ...builder,
    route_code: `${BUILDER_ROUTE_PREFIX}${index + 1}`,
    route_slug: normalizeBuilderSlug(builder?.company_name || builder?.brand_name || builder?.rera_id),
  }));

const isSameBuilder = (left, right) => {
  if (!left || !right) {
    return false;
  }

  if (left.rera_id && right.rera_id && String(left.rera_id) === String(right.rera_id)) {
    return true;
  }

  return normalizeBuilderSlug(left.company_name) === normalizeBuilderSlug(right.company_name);
};

export const buildBuilderPathFromCollection = (builder, builders = []) => {
  if (!builder) {
    return "/builders-page";
  }

  const normalizedBuilders = normalizeBuildersForRouting(builders);
  const matchedBuilder = normalizedBuilders.find((candidate) => isSameBuilder(candidate, builder));

  if (matchedBuilder?.route_code) {
    return `/builder/${matchedBuilder.route_code}`;
  }

  const fallbackSlug = normalizeBuilderSlug(builder.company_name || builder.brand_name || builder.rera_id);
  return fallbackSlug ? `/builder/${fallbackSlug}` : "/builders-page";
};

export const buildBuilderPath = async (builder) => {
  if (!builder) {
    return "/builders-page";
  }

  try {
    const builders = await fetchBuilders();
    return buildBuilderPathFromCollection(builder, Array.isArray(builders) ? builders : []);
  } catch (error) {
    const fallbackSlug = normalizeBuilderSlug(builder.company_name || builder.brand_name || builder.rera_id);
    return fallbackSlug ? `/builder/${fallbackSlug}` : "/builders-page";
  }
};

export const resolveBuilderFromRouteToken = async (token) => {
  const builders = await fetchBuilders();
  const normalizedBuilders = normalizeBuildersForRouting(Array.isArray(builders) ? builders : []);
  const normalizedToken = String(token || "").trim();
  const routeMatch = normalizedToken.match(/^b(\d+)$/i);

  if (routeMatch) {
    const builderIndex = Number(routeMatch[1]) - 1;
    return {
      builder: normalizedBuilders[builderIndex] || null,
      builders: normalizedBuilders,
    };
  }

  const slugToken = normalizeBuilderSlug(normalizedToken);
  const builder =
    normalizedBuilders.find((candidate) => candidate.route_slug === slugToken) ||
    normalizedBuilders.find((candidate) => String(candidate.rera_id || "").toLowerCase() === normalizedToken.toLowerCase()) ||
    normalizedBuilders.find((candidate) => normalizeBuilderSlug(candidate.company_name) === slugToken);

  return {
    builder: builder || null,
    builders: normalizedBuilders,
  };
};
