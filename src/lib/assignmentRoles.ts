export const ASSIGNMENT_ROLE_OPTIONS = [
  'Meta Ads Specialist',
  'PPC Specialist',
  'SEO Specialist',
  'Graphic Designer',
  'Video Editor',
  'Sales Specialist',
  'Account Manager',
] as const;

type AssignmentRoleOption = (typeof ASSIGNMENT_ROLE_OPTIONS)[number];

function normalizeRoleKey(role: string): string {
  return role
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function mapKnownRoleByNormalizedKey(normalizedRole: string): AssignmentRoleOption | null {
  for (const role of ASSIGNMENT_ROLE_OPTIONS) {
    if (normalizeRoleKey(role) === normalizedRole) {
      return role;
    }
  }
  return null;
}

export function canonicalizeAssignmentRole(role: string): AssignmentRoleOption | null {
  const normalizedRole = normalizeRoleKey(role);
  if (!normalizedRole) {
    return null;
  }

  if (
    normalizedRole.includes('graphic designer') ||
    normalizedRole.includes('grafik') ||
    normalizedRole.includes('graficky designer')
  ) {
    return 'Graphic Designer';
  }

  if (
    normalizedRole.includes('video editor') ||
    normalizedRole.includes('videoeditor')
  ) {
    return 'Video Editor';
  }

  if (
    normalizedRole.includes('seo specialist') ||
    normalizedRole === 'seo'
  ) {
    return 'SEO Specialist';
  }

  return mapKnownRoleByNormalizedKey(normalizedRole);
}

export function isPerCreditRole(role: string): boolean {
  const canonicalRole = canonicalizeAssignmentRole(role);
  return canonicalRole === 'Graphic Designer' || canonicalRole === 'Video Editor';
}

export function canUsePerCreditCostModel(role: string, hasCreativeBoostService: boolean): boolean {
  return hasCreativeBoostService && isPerCreditRole(role);
}
