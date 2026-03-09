import type { FakturoidSubject } from "./fakturoid.ts";

export type SubjectMatchCriterion = "registration_no" | "vat_no" | "email" | "name";

export interface SubjectDedupResult {
  status: "single" | "multiple" | "none";
  criterion?: SubjectMatchCriterion;
  normalizedValue?: string;
  match?: FakturoidSubject;
  matches?: FakturoidSubject[];
}

const LEGAL_SUFFIX_PATTERNS: RegExp[] = [
  /\bspolecnost\s+s\s+rucenim\s+omezenym\b/gi,
  /\bs\.?\s*r\.?\s*o\.?\b/gi,
  /\ba\.?\s*s\.?\b/gi,
  /\bv\.?\s*o\.?\s*s\.?\b/gi,
  /\bk\.?\s*s\.?\b/gi,
];

function removeDiacritics(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeIco(value?: string): string {
  if (!value) return "";
  return value.replace(/\D/g, "");
}

export function normalizeVatNo(value?: string): string {
  if (!value) return "";
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function normalizeEmail(value?: string): string {
  if (!value) return "";
  return value.trim().toLowerCase();
}

export function normalizeCompanyName(value?: string): string {
  if (!value) return "";

  let normalized = removeDiacritics(value).toLowerCase();
  for (const pattern of LEGAL_SUFFIX_PATTERNS) {
    normalized = normalized.replace(pattern, " ");
  }

  normalized = normalized
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized;
}

function findExactMatches(
  subjects: FakturoidSubject[],
  criterion: SubjectMatchCriterion,
  expected: string
): FakturoidSubject[] {
  if (!expected) return [];

  switch (criterion) {
    case "registration_no":
      return subjects.filter((subject) => normalizeIco(subject.registration_no) === expected);
    case "vat_no":
      return subjects.filter((subject) => normalizeVatNo(subject.vat_no) === expected);
    case "email":
      return subjects.filter((subject) => normalizeEmail(subject.email) === expected);
    case "name":
      return subjects.filter((subject) => normalizeCompanyName(subject.name) === expected);
    default:
      return [];
  }
}

function buildResult(
  criterion: SubjectMatchCriterion,
  normalizedValue: string,
  matches: FakturoidSubject[]
): SubjectDedupResult {
  if (matches.length === 1) {
    return {
      status: "single",
      criterion,
      normalizedValue,
      match: matches[0],
      matches,
    };
  }

  if (matches.length > 1) {
    return {
      status: "multiple",
      criterion,
      normalizedValue,
      matches,
    };
  }

  return {
    status: "none",
    criterion,
    normalizedValue,
  };
}

export function resolveSubjectDedupMatch(
  subjects: FakturoidSubject[],
  input: { ico?: string; vatNo?: string; email?: string; name?: string }
): SubjectDedupResult {
  const normalizedIco = normalizeIco(input.ico);
  if (normalizedIco) {
    const icoMatches = findExactMatches(subjects, "registration_no", normalizedIco);
    if (icoMatches.length > 0) return buildResult("registration_no", normalizedIco, icoMatches);
  }

  const normalizedVatNo = normalizeVatNo(input.vatNo);
  if (normalizedVatNo) {
    const vatMatches = findExactMatches(subjects, "vat_no", normalizedVatNo);
    if (vatMatches.length > 0) return buildResult("vat_no", normalizedVatNo, vatMatches);
  }

  const normalizedEmail = normalizeEmail(input.email);
  if (normalizedEmail) {
    const emailMatches = findExactMatches(subjects, "email", normalizedEmail);
    if (emailMatches.length > 0) return buildResult("email", normalizedEmail, emailMatches);
  }

  const normalizedName = normalizeCompanyName(input.name);
  if (normalizedName) {
    const nameMatches = findExactMatches(subjects, "name", normalizedName);
    if (nameMatches.length > 0) return buildResult("name", normalizedName, nameMatches);
  }

  return { status: "none" };
}
