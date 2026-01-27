
# Systém Notifikací - Komplexní Implementace

## Shrnutí

Vytvoření robustního notifikačního systému, který bude informovat uživatele o relevantních událostech v rámci zakázek, leadů, víceprací a Creative Boost, kde jsou přímo zapojeni. Systém bude navržen tak, aby byl přínosný, ale nezahltil uživatele zbytečnými notifikacemi.

---

## Klíčový Princip: "Relevance First"

Uživatel dostane notifikaci POUZE pokud:
1. **Je přímo přiřazen** k zakázce/projektu (v `engagement_assignments`)
2. **Je vlastníkem leadu** (`leads.owner_id`)
3. **Je přiřazen k vícepráci** (`extra_works.colleague_id`)
4. **Je přiřazen ke Creative Boost** projektu (jako grafik)
5. **Je admin/management** a událost vyžaduje jejich pozornost

---

## Typy Notifikací a Triggery

### 1. Leady (pro vlastníka leadu)
| Událost | Kdy notifikovat | Příklad zprávy |
|---------|-----------------|----------------|
| Formulář vyplněn | Lead vyplnil onboarding formulář | "Lead XYZ vyplnil onboarding formulář" |
| Přístupy nasdíleny | Klient sdílel přístupy | "XYZ nasdílel přístupy k Meta Ads, Google Ads" |
| Nabídka zobrazena | Klient otevřel nabídku (tracking) | "XYZ zobrazil nabídku" |
| Smlouva podepsána | Klient podepsal smlouvu | "XYZ podepsal smlouvu!" |

### 2. Zakázky (pro přiřazené kolegy)
| Událost | Kdy notifikovat | Příklad zprávy |
|---------|-----------------|----------------|
| Přiřazení k zakázce | Kolega přiřazen k nové zakázce | "Byl/a jsi přiřazen/a k zakázce ABC" |
| Změna ceny služby | Cena byla změněna (klient schválil) | "Cena služby na zakázce ABC byla upravena" |
| Přidání nové služby | Nová služba aktivována | "Na zakázce ABC byla aktivována nová služba" |
| Zakázka končí | 30 dní před end_date | "Zakázka ABC končí za 30 dní" |

### 3. Vícepráce (pro přiřazeného kolegu + admin)
| Událost | Kdy notifikovat | Příklad zprávy |
|---------|-----------------|----------------|
| Vícepráce schválena | Status změněn na approved | "Vícepráce 'Banner sada' byla schválena" |
| Vícepráce připravena k fakturaci | Status: ready_to_invoice | "Vícepráce čeká na fakturaci" |

### 4. Creative Boost (pro grafiky)
| Událost | Kdy notifikovat | Příklad zprávy |
|---------|-----------------|----------------|
| Nový měsíc spuštěn | Klient přidán do nového měsíce | "Creative Boost pro XYZ - leden 2026 aktivován" |
| Blížící se deadline | 3 dny před koncem měsíce a < 80% kreditů | "XYZ: vyčerpáno jen 60% kreditů, zbývají 3 dny" |

### 5. Návrhy změn / Modifikace
| Událost | Kdy notifikovat | Příklad zprávy |
|---------|-----------------|----------------|
| Klient schválil změnu | `status: client_approved` | "Klient XYZ schválil změnu ceny!" |
| Nový návrh čeká na schválení | Pro adminy | "Nový návrh změny čeká na schválení" |

---

## Databázová Struktura

**Nová tabulka: `notifications`**

```sql
CREATE TABLE notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Komu notifikace patří
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Typ a obsah
    type text NOT NULL, -- enum: 'lead_form_completed', 'engagement_assigned', etc.
    title text NOT NULL,
    message text NOT NULL,
    
    -- Odkaz na související entitu
    entity_type text, -- 'lead', 'engagement', 'extra_work', 'creative_boost', 'modification'
    entity_id uuid,
    link text, -- URL pro přesměrování
    
    -- Stav
    is_read boolean DEFAULT false,
    read_at timestamptz,
    
    -- Metadata (pro rozšířené informace)
    metadata jsonb DEFAULT '{}',
    
    created_at timestamptz DEFAULT now()
);

-- Indexy pro rychlé dotazy
CREATE INDEX idx_notifications_user_unread 
ON notifications(user_id, is_read, created_at DESC);

CREATE INDEX idx_notifications_entity 
ON notifications(entity_type, entity_id);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- System can create notifications (via service role or triggers)
CREATE POLICY "Service role can create notifications"
ON notifications FOR INSERT
WITH CHECK (true);
```

---

## Logika Vytváření Notifikací

### Přístup 1: Frontend-based (jednodušší, bez DB triggerů)

Notifikace se vytvoří přímo v hooks/mutacích při akci:

```typescript
// Příklad: Když se změní status leadu
const updateLead = async (leadId, newData) => {
  await supabase.from('leads').update(newData).eq('id', leadId);
  
  // Pokud vyplněn formulář → notifikace pro owner_id
  if (newData.onboarding_form_completed_at && lead.owner_id) {
    await createNotification({
      user_id: getOwnerUserId(lead.owner_id), // colleague → profile_id → user_id
      type: 'lead_form_completed',
      title: 'Formulář vyplněn',
      message: `${lead.company_name} vyplnil onboarding formulář`,
      entity_type: 'lead',
      entity_id: leadId,
      link: '/leads'
    });
  }
};
```

### Přístup 2: Database Triggers (robustnější)

Pro kritické události použít DB triggery:

```sql
CREATE OR REPLACE FUNCTION notify_on_extra_work_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Když se status změní na 'approved'
    IF NEW.status = 'approved' AND OLD.status = 'pending_approval' THEN
        -- Najít user_id přiřazeného kolegy
        INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id, link)
        SELECT 
            c.profile_id,
            'extra_work_approved',
            'Vícepráce schválena',
            'Vícepráce "' || NEW.name || '" byla schválena',
            'extra_work',
            NEW.id,
            '/extra-work'
        FROM colleagues c
        WHERE c.id = NEW.colleague_id
          AND c.profile_id IS NOT NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_extra_work_status_notify
AFTER UPDATE ON extra_works
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION notify_on_extra_work_status_change();
```

---

## Frontend Komponenty

### 1. Upravený useNotifications Hook

```typescript
// src/hooks/useNotifications.tsx

export function useNotifications() {
  const { user } = useAuth();
  
  // Načtení notifikací z Supabase
  const { data: notifications, refetch } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(100);
      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Poll každých 30 sekund
  });
  
  // Real-time subscription pro okamžité notifikace
  useEffect(() => {
    if (!user?.id) return;
    
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        refetch();
        // Volitelně: zobrazit toast
        toast({ title: payload.new.title, description: payload.new.message });
      })
      .subscribe();
    
    return () => subscription.unsubscribe();
  }, [user?.id]);
  
  // ... rest of implementation
}
```

### 2. Notifikační služba

```typescript
// src/services/notificationService.ts

export async function createNotification(params: {
  recipientColleagueId?: string;
  recipientUserId?: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  link?: string;
  metadata?: Record<string, unknown>;
}) {
  // Získat user_id z colleague_id pokud potřeba
  let userId = params.recipientUserId;
  
  if (!userId && params.recipientColleagueId) {
    const { data: colleague } = await supabase
      .from('colleagues')
      .select('profile_id')
      .eq('id', params.recipientColleagueId)
      .single();
    
    userId = colleague?.profile_id;
  }
  
  if (!userId) return null; // Kolega nemá propojený profil
  
  return supabase.from('notifications').insert({
    user_id: userId,
    type: params.type,
    title: params.title,
    message: params.message,
    entity_type: params.entityType,
    entity_id: params.entityId,
    link: params.link,
    metadata: params.metadata || {},
  });
}

// Hromadné notifikace pro tým zakázky
export async function notifyEngagementTeam(
  engagementId: string,
  excludeUserId: string | null,
  notification: Omit<NotificationParams, 'recipientUserId'>
) {
  // Získat všechny přiřazené kolegy
  const { data: assignments } = await supabase
    .from('engagement_assignments')
    .select('colleague_id, colleagues(profile_id)')
    .eq('engagement_id', engagementId);
  
  // Vytvořit notifikace pro každého (kromě toho, kdo akci provedl)
  const notifications = assignments
    ?.filter(a => a.colleagues?.profile_id && a.colleagues.profile_id !== excludeUserId)
    .map(a => ({
      user_id: a.colleagues.profile_id,
      ...notification,
    }));
  
  if (notifications?.length) {
    await supabase.from('notifications').insert(notifications);
  }
}
```

---

## Stránka Notifikací (Vylepšení)

Stávající `/notifications` stránka zůstane, ale bude:

1. **Filtrování podle entity** - Zobrazit jen leady / zakázky / vícepráce
2. **Seskupování podle dne** - Přehlednější organizace
3. **Archivace** - Možnost smazat staré notifikace
4. **Nastavení preferencí** - Tab pro nastavení, které typy chce uživatel dostávat

### Wireframe rozšířené stránky:

```text
+----------------------------------------------------------+
|  🔔 Notifikace                          [Označit vše ✓]  |
+----------------------------------------------------------+
|  [Všechny] [Leady] [Zakázky] [Vícepráce] [Nastavení ⚙️]  |
+----------------------------------------------------------+
|                                                          |
|  Dnes                                                    |
|  ┌────────────────────────────────────────────────────┐  |
|  │ ✅ Klient schválil změnu                     10:32 │  |
|  │    ABC Corp potvrdil změnu ceny na zakázce...      │  |
|  └────────────────────────────────────────────────────┘  |
|  ┌────────────────────────────────────────────────────┐  |
|  │ 📋 Formulář vyplněn                          09:15 │  |
|  │    XYZ s.r.o. vyplnil onboarding formulář          │  |
|  └────────────────────────────────────────────────────┘  |
|                                                          |
|  Včera                                                   |
|  ┌────────────────────────────────────────────────────┐  |
|  │ 🎯 Přiřazení k zakázce                       18:45 │  |
|  │    Byl/a jsi přiřazen/a k "NewClient Retainer"     │  |
|  └────────────────────────────────────────────────────┘  |
+----------------------------------------------------------+
```

---

## Nastavení Preferencí (Volitelné - Fáze 2)

Pro pokročilé uživatele tabulka preferencí:

```sql
CREATE TABLE notification_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type text NOT NULL,
    enabled boolean DEFAULT true,
    UNIQUE(user_id, notification_type)
);
```

Toto umožní uživatelům vypnout specifické typy notifikací.

---

## Soubory k Vytvoření/Úpravě

### Nové soubory:
1. `src/services/notificationService.ts` - Centrální služba pro vytváření notifikací
2. `src/types/notifications.ts` - Rozšíření typů (přidání entity_type, entity_id)
3. `docs/supabase-migration-notifications.sql` - Migrace pro novou tabulku

### Soubory k úpravě:
1. `src/hooks/useNotifications.tsx` - Přepsat na Supabase místo localStorage
2. `src/pages/Notifications.tsx` - Přidat filtrování a seskupování
3. `src/hooks/useLeadsData.tsx` - Integrovat notifikace při změnách leadů
4. `src/hooks/useCRMData.tsx` - Integrovat notifikace při přiřazení k zakázkám
5. `src/data/modificationRequestsMockData.ts` - Přepsat na Supabase notifikace

---

## Implementační Fáze

### Fáze 1: Základní infrastruktura
- [ ] Vytvořit tabulku `notifications` v Supabase
- [ ] Implementovat `notificationService.ts`
- [ ] Přepsat `useNotifications` hook na Supabase

### Fáze 2: Integrace triggerů
- [ ] Leady: formulář vyplněn, smlouva podepsána
- [ ] Zakázky: přiřazení kolegy
- [ ] Vícepráce: status změny
- [ ] Modifikace: klient schválil

### Fáze 3: UI vylepšení
- [ ] Filtrování na stránce notifikací
- [ ] Seskupování podle dne
- [ ] Real-time updates přes Supabase subscriptions

### Fáze 4: Preference (volitelné)
- [ ] Tabulka preferencí
- [ ] UI pro správu preferencí

---

## Přínosy Řešení

1. **Personalizace** - Každý vidí jen notifikace relevantní pro jeho práci
2. **Persistentní historie** - Data v databázi, ne localStorage
3. **Real-time** - Okamžité doručení přes Supabase subscriptions
4. **Škálovatelnost** - Snadné přidání nových typů notifikací
5. **Nezahltí uživatele** - Striktní pravidla kdy notifikovat
