# Plan: Feedback Zone - Napady od kolecu

## Prehled

Vytvoreni nove funkce "Feedback Zone" kde kolegove mohou zadavat napady na zlepseni firmy (procesy, sluzby, komunikace, systemy). Kazdy napad je viditelny vsem kolegum, kteri mohou hlasovat palcem nahoru nebo dolu.

## Pozadavky

1. Nova stranka "Feedback Zone" v navigaci
2. Kolegove mohou zadat novy "ticket" (napad)
3. Vsichni dostanou notifikaci pri novem napadu
4. Viditelne jmeno autora napadu
5. Hlasovani palcem nahoru/dolu
6. Dummy data (bez databaze)

## Datova struktura

### Typy (types/feedback.ts)

```typescript
export interface FeedbackIdea {
  id: string;
  title: string;
  description: string;
  category: FeedbackCategory;
  author_id: string; // colleague_id
  created_at: string;
  updated_at: string;
  status: FeedbackStatus;
}

export type FeedbackCategory = 
  | 'process'      // Procesy
  | 'service'      // Sluzby
  | 'communication'// Komunikace
  | 'system'       // System/CRM
  | 'other';       // Ostatni

export type FeedbackStatus = 
  | 'new'          // Novy
  | 'in_review'    // V hodnoceni
  | 'accepted'     // Prijato
  | 'rejected'     // Zamitnuto
  | 'implemented'; // Implementovano

export interface FeedbackVote {
  id: string;
  idea_id: string;
  colleague_id: string;
  vote_type: 'up' | 'down';
  created_at: string;
}
```

## Implementacni kroky

### 1. Vytvorit typy pro Feedback

**Soubor:** `src/types/feedback.ts`

- Definovat `FeedbackIdea` interface
- Definovat `FeedbackCategory` a `FeedbackStatus` typy
- Definovat `FeedbackVote` interface
- Exportovat konfiguraci kategorii (ikony, barvy)

### 2. Vytvorit hook useFeedbackData

**Soubor:** `src/hooks/useFeedbackData.tsx`

- Vytvorit context a provider podobne jako `useMeetingsData`
- Drzet state pro `ideas` a `votes`
- Generovat dummy data (3-5 ukazkových napadu)
- Implementovat funkce:
  - `addIdea(data)` - pridat novy napad
  - `updateIdeaStatus(id, status)` - zmenit status (pro adminy)
  - `vote(ideaId, voteType)` - hlasovat (kazdy kolega muze hlasovat jednou)
  - `removeVote(ideaId)` - odebrat hlas
  - `getVoteCounts(ideaId)` - pocet hlasu nahoru/dolu
  - `getUserVote(ideaId)` - jak hlasoval aktualni uzivatel
- Integrace s notifikacemi - pri pridani napadu vytvorit notifikaci

### 3. Pridat typ notifikace

**Soubor:** `src/types/notifications.ts`

- Pridat `'new_feedback_idea'` do `NotificationType`
- Pridat konfiguraci (ikona, barvy)

### 4. Vytvorit komponenty pro Feedback

**Slozka:** `src/components/feedback/`

#### a) AddFeedbackDialog.tsx
- Formular pro zadani noveho napadu
- Pole: Nazev, Popis, Kategorie
- Po odeslani zavola `addIdea` a prida notifikaci

#### b) FeedbackCard.tsx
- Karta zobrazujici jeden napad
- Zobrazuje: nazev, popis (zkraceny), kategorii, autora, datum
- Tlacitka pro hlasovani (palec nahoru/dolu s pocty)
- Badge se statusem
- Kliknuti otevre detail

#### c) FeedbackDetailSheet.tsx
- Sheet s plnym detailem napadu
- Plny popis
- Historie hlasovani
- Pro adminy: moznost zmenit status

### 5. Vytvorit stranku Feedback

**Soubor:** `src/pages/Feedback.tsx`

- PageHeader s titulkem a tlacitkem pro pridani
- Filtry: kategorie, status
- Razeni: nejnovejsi, nejvice hlasu
- Grid s kartami napadu

### 6. Pridat routu a navigaci

**Soubor:** `src/App.tsx`
- Import stranky Feedback
- Pridat Route `/feedback`

**Soubor:** `src/components/layout/AppSidebar.tsx`
- Pridat polozku `{ title: '💡 Feedback Zone', url: '/feedback', page: 'feedback' }`

### 7. Pridat provider do App

**Soubor:** `src/App.tsx`
- Obalit aplikaci `FeedbackProvider`

## Struktura souboru

```
src/
  types/
    feedback.ts (novy)
  hooks/
    useFeedbackData.tsx (novy)
  components/
    feedback/ (nova slozka)
      AddFeedbackDialog.tsx
      FeedbackCard.tsx
      FeedbackDetailSheet.tsx
  pages/
    Feedback.tsx (novy)
```

## UI/UX detaily

### Kategorie s ikonami
- Procesy
- Sluzby  
- Komunikace
- System
- Ostatni

### Statusy s barvami
- Novy - modra
- V hodnoceni - zluta
- Prijato - zelena
- Zamitnuto - cervena
- Implementovano - fialova

### Hlasovaci tlacitka
- Palec nahoru (zelena pri aktivnim hlasu)
- Palec dolu (cervena pri aktivnim hlasu)
- Zobrazit pocet hlasu vedle kazdeho tlacitka

## Notifikace

Pri pridani noveho napadu:
```typescript
addNotification({
  type: 'new_feedback_idea',
  title: 'Novy napad!',
  message: `${authorName} pridal novy napad: "${ideaTitle}"`,
  link: '/feedback',
  metadata: {
    idea_id: idea.id,
    colleague_id: idea.author_id,
    colleague_name: authorName,
  }
});
```

## Kriticke soubory pro implementaci

- `src/types/feedback.ts` - Definice datovych typu pro feedback systém
- `src/hooks/useFeedbackData.tsx` - Hlavni datovy hook s logikou a dummy daty
- `src/pages/Feedback.tsx` - Stranka se seznamem napadu
- `src/components/feedback/FeedbackCard.tsx` - Komponenta karty s hlasovanim
- `src/types/notifications.ts` - Rozsireni o novy typ notifikace
