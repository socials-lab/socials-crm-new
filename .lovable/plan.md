

## Synchronizace IČO z onboarding formuláře zpět do leadu

### Problém
Klient může v onboarding formuláři změnit IČO (a tím i další firemní údaje), ale při odeslání formuláře se tyto změny nezapíší zpět do leadu. Lead tak zůstane s původním (odhadovaným) IČO.

### Řešení
V `onSubmit` funkci v `src/pages/OnboardingForm.tsx` rozšířit volání `updateLead` o všechny firemní údaje z formuláře, aby lead vždy obsahoval finální data od klienta.

### Technické detaily

**Soubor:** `src/pages/OnboardingForm.tsx`

**Změna:** V metodě `onSubmit` (cca řádek 344) rozšířit objekt předávaný do `updateLead` o tyto pole:

```typescript
await updateLead(lead.id, {
  // Existující pole
  onboarding_form_completed_at: new Date().toISOString(),
  contract_url: mockContractUrl,
  contract_created_at: new Date().toISOString(),
  // Nově přidaná pole -- finální data od klienta
  ico: data.ico,
  dic: data.dic || null,
  company_name: data.company_name,
  website: data.website || null,
  industry: data.industry || null,
  billing_street: data.billing_street || null,
  billing_city: data.billing_city || null,
  billing_zip: data.billing_zip || null,
  billing_country: data.billing_country || null,
  billing_email: data.billing_email || null,
});
```

Tím se zajistí, že:
- IČO v leadu bude vždy finální (to, které klient potvrdil v onboarding formuláři)
- Všechny související údaje (název, DIČ, sídlo, fakturační email) budou synchronizovány
- Klient vytvořený z leadu bude mít stejné údaje jako lead

Žádné další soubory není třeba měnit -- formulář již sleduje změny IČO (stav `icoChanged`) a ARES lookup funguje správně.
