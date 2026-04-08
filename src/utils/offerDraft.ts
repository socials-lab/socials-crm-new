const OFFER_DRAFT_EVENT = 'offer-draft-state-changed';

interface OfferDraftLike {
  savedAt?: number;
}

function parseDraft(raw: string | null): OfferDraftLike | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OfferDraftLike;
  } catch {
    return null;
  }
}

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getOfferDraftKey(scopeKey: string): string {
  return `offer-draft-${scopeKey}`;
}

export function getOfferDraftRefKey(leadId: string): string {
  return `offer-draft-ref-${leadId}`;
}

export function setOfferDraftRef(leadId: string, draftKey: string): void {
  try {
    localStorage.setItem(getOfferDraftRefKey(leadId), draftKey);
  } catch {
    // noop
  }
}

export function clearOfferDraftRef(leadId: string): void {
  try {
    localStorage.removeItem(getOfferDraftRefKey(leadId));
  } catch {
    // noop
  }
}

export function notifyOfferDraftChanged(leadId: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OFFER_DRAFT_EVENT, { detail: { leadId } }));
}

export function subscribeOfferDraftChanged(callback: (leadId: string | null) => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const handler = (event: Event) => {
    const custom = event as CustomEvent<{ leadId?: string }>;
    callback(custom.detail?.leadId || null);
  };
  window.addEventListener(OFFER_DRAFT_EVENT, handler as EventListener);
  return () => window.removeEventListener(OFFER_DRAFT_EVENT, handler as EventListener);
}

export function getOfferDraftInfoForLead(leadId: string): { hasDraft: boolean; savedAt: number | null } {
  const directLeadDraft = parseDraft(safeGetItem(getOfferDraftKey(`lead-${leadId}`)));
  const refDraftKey = safeGetItem(getOfferDraftRefKey(leadId));
  const referencedDraft = parseDraft(refDraftKey ? safeGetItem(refDraftKey) : null);

  if (refDraftKey && !referencedDraft) {
    clearOfferDraftRef(leadId);
  }

  const timestamps = [directLeadDraft?.savedAt, referencedDraft?.savedAt].filter(
    (value): value is number => typeof value === 'number' && Number.isFinite(value),
  );

  if (timestamps.length === 0) {
    return { hasDraft: false, savedAt: null };
  }

  return {
    hasDraft: true,
    savedAt: Math.max(...timestamps),
  };
}

