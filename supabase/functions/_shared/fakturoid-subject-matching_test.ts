import {
  normalizeCompanyName,
  resolveSubjectDedupMatch,
} from "./fakturoid-subject-matching.ts";
import type { FakturoidSubject } from "./fakturoid.ts";

function createSubject(
  id: number,
  name: string,
  overrides: Partial<FakturoidSubject> = {}
): FakturoidSubject {
  return {
    id,
    name,
    ...overrides,
  };
}

Deno.test("resolveSubjectDedupMatch prefers exact ICO match", () => {
  const subjects = [
    createSubject(1, "Nejaka Firma s.r.o.", { registration_no: "12345678", email: "x@example.com" }),
    createSubject(2, "Jina Firma a.s.", { registration_no: "87654321", email: "billing@example.com" }),
  ];

  const result = resolveSubjectDedupMatch(subjects, {
    ico: "123 45 678",
    email: "billing@example.com",
  });

  if (result.status !== "single" || !result.match) {
    throw new Error(`Expected single match, got ${JSON.stringify(result)}`);
  }
  if (result.criterion !== "registration_no") {
    throw new Error(`Expected ICO criterion, got ${result.criterion}`);
  }
  if (result.match.id !== 1) {
    throw new Error(`Expected subject 1, got ${result.match.id}`);
  }
});

Deno.test("resolveSubjectDedupMatch matches VAT number case-insensitively", () => {
  const subjects = [
    createSubject(10, "Alpha", { vat_no: "CZ12345678" }),
  ];

  const result = resolveSubjectDedupMatch(subjects, {
    vatNo: "cz12345678",
  });

  if (result.status !== "single" || result.match?.id !== 10 || result.criterion !== "vat_no") {
    throw new Error(`Expected vat_no match, got ${JSON.stringify(result)}`);
  }
});

Deno.test("resolveSubjectDedupMatch matches email case-insensitively", () => {
  const subjects = [
    createSubject(20, "Beta", { email: "Billing@Example.com" }),
  ];

  const result = resolveSubjectDedupMatch(subjects, {
    email: "billing@example.com",
  });

  if (result.status !== "single" || result.match?.id !== 20 || result.criterion !== "email") {
    throw new Error(`Expected email match, got ${JSON.stringify(result)}`);
  }
});

Deno.test("resolveSubjectDedupMatch falls back to normalized name", () => {
  const subjects = [
    createSubject(30, "Česká Židle, s.r.o."),
  ];

  const result = resolveSubjectDedupMatch(subjects, {
    name: "Ceska zidle sro",
  });

  if (result.status !== "single" || result.match?.id !== 30 || result.criterion !== "name") {
    throw new Error(`Expected name match, got ${JSON.stringify(result)}`);
  }
});

Deno.test("resolveSubjectDedupMatch returns multiple when ambiguous", () => {
  const subjects = [
    createSubject(40, "Gamma", { email: "same@example.com" }),
    createSubject(41, "Gamma 2", { email: "same@example.com" }),
  ];

  const result = resolveSubjectDedupMatch(subjects, {
    email: "same@example.com",
  });

  if (result.status !== "multiple" || result.criterion !== "email" || (result.matches?.length ?? 0) !== 2) {
    throw new Error(`Expected multiple email matches, got ${JSON.stringify(result)}`);
  }
});

Deno.test("normalizeCompanyName removes diacritics and legal suffix noise", () => {
  const normalized = normalizeCompanyName("Žluťoučký kůň, a.s.");
  if (normalized !== "zlutoucky kun") {
    throw new Error(`Unexpected normalized value: ${normalized}`);
  }
});
