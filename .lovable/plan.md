

## Plan: Individuální odesílání emailů + omezení na adminy

### Rozhodnutí: Individuální emaily (ne BCC)

Best practice pro hromadné rozesílky je **odeslat každému příjemci samostatný email**. Důvody:
- Příjemci nevidí ostatní adresy (na rozdíl od BCC, kde chyba = únik kontaktů)
- Lepší personalizace (`{contact_name}`, `{company}`)
- Lepší deliverability (emailové servery méně penalizují individuální emaily)
- Možnost sledovat doručení per příjemce v budoucnu

### Změny

**1. `supabase/functions/send-broadcast/index.ts`**
- Upravit edge function tak, aby iterovala přes příjemce a pro každého připravila samostatný email (aktuálně už iteruje, jen upřesnit log, že jde o individuální odeslání)
- Až se napojí Resend API, každý příjemce dostane vlastní API call

**2. `src/pages/Broadcasts.tsx`**
- Přidat kontrolu `isSuperAdmin` z `useUserRole`
- Tlačítko "Nová rozesílka" zobrazit pouze pro adminy
- Ostatní uživatelé vidí historii rozesílek (read-only), ale nemohou vytvářet nové

**3. `src/components/broadcasts/CreateBroadcastDialog.tsx`**
- Žádné změny potřeba — dialog se otevírá jen z tlačítka, které bude skryté pro ne-adminy

### Technické detaily
- Edge function již iteruje přes `recipients` pole — struktura je připravena na individuální Resend API volání
- Omezení na adminy je čistě UI-side (tlačítko skryté) + RLS na DB úrovni již omezuje na CRM users; pro přísnější kontrolu by se dala přidat RLS policy s `is_admin(auth.uid())` na INSERT

