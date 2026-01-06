# Plan: Omezeni pristupu k meetingum podle role a ucastnika

## Pozadavky
- Bezni kolegove vidi pouze meetingy, kde jsou pridani jako ucastnici
- Admini (a super admini) vidi vsechny meetingy
- Kolegove nemohou prohlizet zapisy z meetingu, kterych se neucastnili

## Analyza soucasneho stavu

### Dostupne informace z hooku useUserRole:
- `isSuperAdmin` - zda je uzivatel super admin
- `role` - role uzivatele (admin, management, project_manager, specialist, finance)
- `colleagueId` - ID kolegy propojeho s aktualnim uzivatelem
- `hasRole(role)` - pomocna funkce pro kontrolu role

### Struktura dat:
- `meetings` - seznam meetingu
- `participants` - seznam ucastniku s `meeting_id` a `colleague_id`
- Uzivatel je propojen s kolegou pres `colleagues.profile_id`

## Implementacni plan

### 1. Uprava MeetingsDataProvider - filtrace meetingu

**Soubor:** `src/hooks/useMeetingsData.tsx`

**Zmeny:**
1. Importovat `useUserRole` hook
2. Ziskat `colleagueId`, `isSuperAdmin` a `role` z useUserRole
3. Pridat novou funkci `getVisibleMeetings()` ktera:
   - Pro adminy/super adminy vrati vsechny meetingy
   - Pro ostatni vrati pouze meetingy kde je uzivatel jako ucastnik
4. Exportovat `visibleMeetings` misto raw `meetings`

**Logika filtrace:**
```typescript
const isAdmin = isSuperAdmin || role === 'admin' || role === 'management';

const visibleMeetings = useMemo(() => {
  if (isAdmin) return meetings;
  if (!colleagueId) return [];
  
  // Najdi meeting IDs kde je kolega ucastnikem
  const myMeetingIds = participants
    .filter(p => p.colleague_id === colleagueId)
    .map(p => p.meeting_id);
  
  return meetings.filter(m => myMeetingIds.includes(m.id));
}, [meetings, participants, colleagueId, isAdmin]);
```

### 2. Uprava kontextove hodnoty

**Zmeny v MeetingsDataContextType:**
- Pridat `canViewAllMeetings: boolean` - pro UI indikaci
- Zamenit `meetings` za `visibleMeetings` v hodnote kontextu

### 3. Uprava strance Meetings.tsx

**Soubor:** `src/pages/Meetings.tsx`

**Zmeny:**
- Zadne zmeny nutne - stranka uz pouziva `meetings` z hooku, ktery bude automaticky filtrovany

### 4. Uprava MeetingDetailSheet

**Soubor:** `src/components/meetings/MeetingDetailSheet.tsx`

**Zmeny:**
- Zadne zmeny nutne - detail se zobrazi pouze pro meetingy ktere uzivatel vidi

## Bezpecnostni poznamky

- Toto je pouze frontend filtrace pro dummy data
- Pri napojeni na databazi bude potreba implementovat RLS politiky:
  ```sql
  -- Admini vidi vse
  CREATE POLICY "Admins can view all meetings"
  ON public.meetings FOR SELECT
  USING (
    is_admin(auth.uid()) OR 
    has_role(auth.uid(), 'management')
  );
  
  -- Ucastnici vidi sve meetingy
  CREATE POLICY "Participants can view their meetings"
  ON public.meetings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meeting_participants mp
      JOIN colleagues c ON c.id = mp.colleague_id
      WHERE mp.meeting_id = meetings.id
        AND c.profile_id = auth.uid()
    )
  );
  ```

## Shrnutí zmeny v souborech

| Soubor | Zmena |
|--------|-------|
| `src/hooks/useMeetingsData.tsx` | Pridat filtraci meetingu podle role a ucastniku |

## Kriticke soubory pro implementaci

- `src/hooks/useMeetingsData.tsx` - Hlavni soubor pro implementaci filtrace
- `src/hooks/useUserRole.tsx` - Zdroj informaci o roli uzivatele a colleagueId
- `src/pages/Meetings.tsx` - Overeni ze zmena funguje spravne
