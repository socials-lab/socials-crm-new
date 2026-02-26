SET ROLE postgres;

-- Delete existing articles first
DELETE FROM sop_articles;

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'6ceaf80a-8db2-4790-bf4f-ed69485b5c99',
'11111111-1111-1111-1111-111111111108',
'Buddy pro nové kolegy',
'<p><strong>Role:</strong> Jaroslav Bobák („Jarda“)</p>
<p><strong>Cíl role:</strong> Podpora nových kolegů a kontrola kvality doručování služby</p>
<p><strong>Popis role:</strong></p>
<ul>
<li>Jarda funguje jako <strong>Buddy</strong> pro nové kolegy.</li>
<li>U nových kolegů je k ruce u jejich <strong>nových projektů</strong>.</li>
<li>Kontroluje <strong>výstupy</strong> a dohlíží na správné doručení služby.</li>
<li>Pokud má nový kolega <strong>jakýkoliv dotaz</strong> k doručování služby, obrací se na <strong>Jardu</strong>.</li>
</ul>
<p><strong>Spolupráce:</strong></p>
<ul>
<li><p>Nový kolega si s Jardou může <strong>domluvit call / konzultaci</strong> dle potřeby.</p>
</li>
<li><p>U <strong>prvních 3 klientů</strong>, které nový kolega dostane,</p>
<p>  probíhá řešení <strong>primárně s Jardou</strong>.</p>
</li>
</ul>
<p><strong>Cíl:</strong></p>
<p>Zajistit hladký onboarding nových kolegů a konzistentní kvalitu služby.</p>
',
'Role: Jaroslav Bobák („Jarda“) Cíl role: Podpora nových kolegů a kontrola kvality doručování služby Popis role: Jarda funguje jako Buddy pro nové kolegy. U nových kolegů je k ruce u jejich nových projektů. Kontroluje výstupy a dohlíží na správné doručení služby. Pokud má nový kolega jakýkoliv dotaz k doručování služby, obrací se na Jardu. Spolupráce: Nový kolega si s Jardou může domluvit call / konzultaci dle potřeby. U prvních 3 klientů, které nový kolega dostane, probíhá řešení primárně s Jardou. Cíl: Zajistit hladký onboarding nových kolegů a konzistentní kvalitu služby.',
1,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'e6ee3aec-e1cf-439c-8e3b-8eecd74be6f1',
'11111111-1111-1111-1111-111111111108',
'Co dělat, když jedeš na dovolenou',
'<p>Před odjezdem na dovolenou je klíčové zajistit, aby tvoje absence co nejméně ovlivnila chod projektů a spokojenost klientů. Dobrá příprava umožní týmu hladce pokračovat v práci, minimalizuje stres z nenadálých situací a zároveň ti poskytne klidnou dovolenou bez nutnosti řešit problémy na dálku. 😊</p>
<hr>
<h3><strong>Checklist: Co udělat před odjezdem na dovolenou</strong></h3>
<ol>
<li><strong>Informuj nadřízené a kolegy</strong><ul>
<li>Napiš do Slack kanálu <strong>#scls_dovolena</strong> termíny dovolené a jméno svého zástupce.</li>
</ul>
</li>
<li><strong>Informuj klienta</strong><ul>
<li>Domluv se s klientem, aby se co nejvíce práce stihlo před odjezdem.</li>
<li>Sděl mu, kdo tě bude zastupovat, a ujisti se, že ví, jak zástupce kontaktovat přes Freelo.</li>
</ul>
</li>
<li><strong>Domluv zástupce</strong><ul>
<li>Urči kolegu, který tě bude zastupovat, a dej mu všechny potřebné informace o projektech a úkolech.</li>
</ul>
</li>
<li><strong>Připrav Freelo</strong><ul>
<li>Aktualizuj všechny rozpracované úkoly ve Freelu.</li>
<li>Označ zástupce jako odpovědnou osobu tam, kde je to potřeba.</li>
</ul>
</li>
<li><strong>Nastav automatickou odpověď na e-mailu</strong><ul>
<li><p>Zde je návod, jak na to</p>
<h3><strong>Šablona: Automatická odpověď během dovolené</strong></h3>
<hr>
<p>  <strong>Předmět</strong>: Automatická odpověď: Děkuji za váš e-mail, nyní jsem na dovolené 🌴</p>
<p>  Dobrý den,</p>
<p>  děkuji za váš e-mail. Momentálně jsem na dovolené do <strong>[vložit datum konce].</strong></p>
<p>  Pokud je váš požadavek urgentní, prosím, kontaktujte mého kolegu, který mě během mé nepřítomnosti zastupuje:</p>
<ul>
<li><strong>[Jméno zastupujícího kolegy]</strong></li>
<li>E-mail: <strong>[e-mailová adresa]</strong></li>
</ul>
<p>  Vašemu e-mailu se budu věnovat ihned po návratu.</p>
<p>  Děkuji za pochopení a přeji krásný den!</p>
<hr>
<h3><strong>Návod: Jak nastavit automatickou odpověď v Gmailu</strong></h3>
<ol>
<li><strong>Přihlaste se do Gmailu</strong>:<ul>
<li>Otevřete Gmail na počítači (<a href="https://mail.google.com/">https://mail.google.com</a>).</li>
</ul>
</li>
<li><strong>Otevřete nastavení</strong>:<ul>
<li>Klikněte na ikonu ozubeného kolečka v pravém horním rohu.</li>
<li>Vyberte <strong>„Zobrazit všechna nastavení“</strong>.</li>
</ul>
</li>
<li><strong>Najděte sekci „Automatická odpověď“</strong>:<ul>
<li>Přepněte na kartu <strong>„Obecné“</strong>.</li>
<li>Posuňte se dolů k sekci <strong>„Automatická odpověď“</strong>.</li>
</ul>
</li>
<li><strong>Zapněte automatickou odpověď</strong>:<ul>
<li>Klikněte na možnost <strong>„Automatická odpověď zapnuta“</strong>.</li>
</ul>
</li>
<li><strong>Vyplňte podrobnosti</strong>:<ul>
<li><strong>První den</strong>: Zadejte datum začátku dovolené.</li>
<li><strong>Poslední den</strong>: Zadejte datum konce dovolené (volitelně, pokud chcete automatickou odpověď vypnout po návratu).</li>
<li><strong>Předmět</strong>: „Děkuji za váš e-mail, jsem na dovolené 🌴“.</li>
<li><strong>Tělo zprávy</strong>: Zkopírujte a vložte šablonu výše, upravte detaily dle potřeby.</li>
</ul>
</li>
<li><strong>Uložte změny</strong>:<ul>
<li>Klikněte na <strong>„Uložit změny“</strong> ve spodní části stránky.</li>
</ul>
</li>
</ol>
</li>
</ul>
</li>
<li><strong>Sdílej fotky z dovolené!</strong><ul>
<li>Pošli do Slack kanálu fotky a inspiruj kolegy na příští dovolenou. 🌴📸</li>
</ul>
</li>
</ol>
<hr>
<p>S tímto postupem si užiješ klidnou dovolenou a tvůj tým bude mít všechno pod kontrolou. 😊</p>
',
'Před odjezdem na dovolenou je klíčové zajistit, aby tvoje absence co nejméně ovlivnila chod projektů a spokojenost klientů. Dobrá příprava umožní týmu hladce pokračovat v práci, minimalizuje stres z nenadálých situací a zároveň ti poskytne klidnou dovolenou bez nutnosti řešit problémy na dálku. 😊 --Checklist: Co udělat před odjezdem na dovolenou Informuj nadřízené a kolegy Napiš do Slack kanálu #scls_dovolena termíny dovolené a jméno svého zástupce. Informuj klienta Domluv se s klientem, aby se co nejvíce práce stihlo před odjezdem. Sděl mu, kdo tě bude zastupovat, a ujisti se, že ví, jak zástupce kontaktovat přes Freelo. Domluv zástupce Urči kolegu, který tě bude zastupovat, a dej mu všechny potřebné informace o projektech a úkolech. Připrav Freelo Aktualizuj všechny rozpracované úkoly ve Freelu. Označ zástupce jako odpovědnou osobu tam, kde je to potřeba. Nastav automatickou odpověď na e-mailu Zde je návod, jak na to Šablona: Automatická odpověď během dovolené --Předmět: Automatická odpověď: Děkuji za váš e-mail, nyní jsem na dovolené 🌴 Dobrý den, děkuji za váš e-mail. Momentálně jsem na dovolené do [vložit datum konce]. Pokud je váš požadavek urgentní, prosím, kontaktujte mého kolegu, který mě během mé nepřítomnosti zastupuje: [Jméno zastupujícího kolegy] E-mail: [e-mailová adresa] Vašemu e-mailu se budu věnovat ihned po návratu. Děkuji za pochopení a přeji krásný den! --Návod: Jak nastavit automatickou odpověď v Gmailu Přihlaste se do Gmailu: Otevřete Gmail na počítači (https://mail.google.com). Otevřete nastavení: Klikněte na ikonu ozubeného kolečka v pravém horním rohu. Vyberte „Zobrazit všechna nastavení“. Najděte sekci „Automatická odpověď“: Přepněte na kartu „Obecné“. Posuňte se dolů k sekci „Automatická odpověď“. Zapněte automatickou odpověď: Klikněte na možnost „Automatická odpověď zapnuta“. Vyplňte podrobnosti: První den: Zadejte datum začátku dovolené. Poslední den: Zadejte datum konce dovolené (volitelně, pokud chcete automatickou odpověď vypnout po návratu). Předmět: „Děkuji za váš e-mail, jsem na dovolené 🌴“. Tělo zprávy: Zkopírujte a vložte šablonu výše, upravte detaily dle potřeby. Uložte změny: Klikněte na „Uložit změny“ ve spodní části stránky. Sdílej fotky z dovolené! Pošli do Slack kanálu fotky a inspiruj kolegy na příští dovolenou. 🌴📸 --S tímto postupem si užiješ klidnou dovolenou a tvůj tým bude mít všechno pod kontrolou. 😊',
2,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'a41204b3-c2b8-4eef-9c20-2a296ec7d17e',
'11111111-1111-1111-1111-111111111103',
'Co dělat, když se zhoršují výsledky',
'<h3><strong>Cíl: Rychle identifikovat hlavní příčinu problému. Musíš zjistit, jesti je chyba v kampaních, na webu a nebo v externím faktoru (sezónnost, konkurence)</strong></h3>
<ul>
<li>Prioritizuj kroky pomocí vylučovací metodou.</li>
<li>Věnuj analýze maximálně 1–2 hodiny, komplexnější problémy by se měly řešit jako samostatný projekt (např. nabídni klientovi UX analýzu, pokud zjistíš, že problém je na webu)</li>
</ul>
<hr>
<h3><strong>1. Diagnostika kampaní - interní faktor: CTR, CPC, frekvence</strong></h3>
<ul>
<li><strong>Cíl:</strong> Zjisti, zda špatné výsledky pocházejí přímo z reklamních kampaní.</li>
<li><strong>Kroky:</strong><ol>
<li><strong>Zkontroluj klíčové metriky v reklamních účtech:</strong><ul>
<li><strong>CTR (míra proklikovosti):</strong><ul>
<li>Stabilní CTR = reklamy stále přitahují relevantní publikum.</li>
<li>Klesající CTR = problém v kreativitách (texty, vizuály) nebo v cílení.</li>
</ul>
</li>
<li><strong>CPC (cena za proklik):</strong><ul>
<li>Stabilní CPC = aukce se nemění, konkurence není hlavním problémem.</li>
<li>Rostoucí CPC = vyšší konkurence nebo nerelevantní cílení.</li>
</ul>
</li>
<li><strong>Frekvence (frequency):</strong><ul>
<li>Není příliš vysoká (přes 3–5 zobrazení)? Vysoká frekvence může znamenat únavu publika.</li>
</ul>
</li>
</ul>
</li>
<li><strong>Porovnej metriky s předchozím obdobím (7, 14 nebo 30 dní):</strong><ul>
<li>Srovnej CTR, CPC a frekvenci s předchozím obdobím.</li>
<li>Stabilní metriky = problém není přímo v kampaních.</li>
</ul>
</li>
</ol>
</li>
<li><strong>Výsledek:</strong><ul>
<li>Pokud jsou metriky CTR, CPC a frekvence <strong>stabilní</strong>, přejdi k analýze externích faktorů.</li>
<li>Pokud jsou <strong>odchylky</strong>, optimalizuj kampaně (kreativy, cílení, rozpočty).</li>
</ul>
</li>
</ul>
<hr>
<h3><strong>2. Diagnostika webu - interní faktor: Google Analytics a konverzní poměr</strong></h3>
<ul>
<li><strong>Cíl:</strong> Zjisti, zda špatné výsledky pramení z problémů na webu.</li>
<li><strong>Kroky:</strong><ol>
<li><strong>Zkontroluj konverzní poměr webu:</strong><ul>
<li>Porovnej konverzní poměr za posledních 7, 14 nebo 30 dní s předchozím obdobím.</li>
<li>Zhoršení konverzního poměru = problém pravděpodobně na webu nebo v nabídce.</li>
</ul>
</li>
<li><strong>Zaměř se na průchodnost košíkem:</strong><ul>
<li>Použij Google Analytics (nebo jiný nástroj) k analýze jednotlivých kroků v konverzní cestě.</li>
<li>Identifikuj stránky s nejvyšší mírou opuštění.</li>
<li>Zkontroluj chování na úrovni <strong>zařízení (mobil/desktop/tablet):</strong><ul>
<li>Nejsou chyby pouze na jednom typu zařízení?</li>
</ul>
</li>
</ul>
</li>
<li><strong>Proveď manuální kontrolu konverzní cesty:</strong><ul>
<li>Proveď testovací objednávku na všech zařízeních (mobil, desktop).</li>
<li>Zkontroluj:<ul>
<li>Rychlost načítání.</li>
<li>Funkčnost tlačítek (Přidat do košíku, Pokračovat k pokladně).</li>
<li>Platební brány a možnosti.</li>
</ul>
</li>
</ul>
</li>
</ol>
</li>
<li><strong>Výsledek:</strong><ul>
<li>Pokud najdeš problém na webu, <strong>pošli ho klientovi</strong> k řešení.</li>
<li>Pokud je problém komplexní, doporuč klientovi <strong>UX analýzu webu.</strong></li>
</ul>
</li>
</ul>
<hr>
<h3><strong>3. Podfinancování kampaní - Interní faktor</strong></h3>
<ul>
<li><strong>Cíl:</strong> Prověř, zda kampaně nemají omezený výkon kvůli nízkým rozpočtům.</li>
<li><strong>Kroky:</strong><ol>
<li>Zkontroluj, zda je <strong>denní rozpočet</strong> dostatečný vzhledem k výkonu celého e-shopu (PNO je nižší neš by mělo).</li>
<li>Podívej se na <strong>překročení nebo dosažení limitu rozpočtu:</strong><ul>
<li>Pokud je kampaň často zastavována z důvodu vyčerpání rozpočtu, doporuč klientovi jeho navýšení.</li>
</ul>
</li>
</ol>
</li>
</ul>
<hr>
<h3><strong>4. Sezónnost - Externí faktor</strong></h3>
<ul>
<li><strong>Cíl:</strong> Zjisti, zda špatné výsledky souvisí se sezónními výkyvy na trhu.</li>
<li><strong>Kroky:</strong><ol>
<li><strong>Porovnej výkon s daty z předchozího roku:</strong><ul>
<li>Analyzuj data za stejné období v loňském roce.</li>
<li>Sleduj trendy v CTR, CPC, konverzním poměru nebo tržbách.</li>
</ul>
</li>
<li><strong>Sleduj sezónní trendy v odvětví:</strong><ul>
<li>Použij <strong>Google Trends</strong> a analyzuj objemy vyhledávání na relevantní klíčová slova:<ul>
<li>Klesá zájem v aktuálním období?</li>
</ul>
</li>
<li>Ověř sezónní trendy ve zprávách z oboru nebo v benchmark reportech.</li>
</ul>
</li>
<li><strong>Zkontroluj data o prodejích klienta:</strong><ul>
<li>Pokud klient podniká v odvětví se sezónními výkyvy (např. cestování, móda, dárky), ověř, zda je aktuální pokles konzistentní s minulými sezónami.</li>
</ul>
</li>
<li><strong>Zvaž vliv aktuálních událostí:</strong><ul>
<li>Nepůsobí aktuální faktory, jako jsou svátky, prázdniny nebo ekonomické události, pokles aktivity publika?</li>
</ul>
</li>
</ol>
</li>
<li><strong>Výsledek:</strong><ul>
<li>Pokud je problém sezónní:<ul>
<li><strong>Přizpůsob kampaně:</strong> Zaměř se na produkty nebo služby, které jsou relevantní pro aktuální období.</li>
<li><strong>Optimalizuj rozpočty:</strong> Sniž výdaje na kampaně, které mají nízkou sezónní poptávku, a navyš rozpočty tam, kde je vyšší zájem.</li>
<li><strong>Připrav se na budoucí sezónu:</strong> Testuj strategie pro nadcházející období a optimalizuj kampaně podle těchto výsledků.</li>
</ul>
</li>
</ul>
</li>
</ul>
<h3><strong>5. Konkurence - Externí faktor</strong></h3>
<ul>
<li><strong>Cíl:</strong> Zjisti, zda výsledky kampaní nebo webu ovlivňuje nová nebo stávající konkurence se silnější nabídkou.</li>
<li><strong>Kroky:</strong><ol>
<li><strong>Zjisti, zda se objevila nová konkurence:</strong><ul>
<li><strong>Sleduj aukční přehledy v reklamních účtech:</strong><ul>
<li>V Google Ads zkontroluj nové hráče v aukčním přehledu.</li>
<li>Zvyšuje se podíl konkurence, kterou dříve v přehledech nevidíš?</li>
</ul>
</li>
<li><strong>Zkontroluj vyhledávače zboží (Heureka, Google Shopping):</strong><ul>
<li>Hledej, zda se v produktových kategoriích neobjevili noví prodejci.</li>
</ul>
</li>
</ul>
</li>
<li><strong>Porovnej ceny a nabídky konkurence:</strong><ul>
<li><strong>Zkontroluj ceny produktů:</strong><ul>
<li>Ověř, zda konkurence neprodává podobné produkty levněji.</li>
</ul>
</li>
<li><strong>Zkontroluj cenu dopravy:</strong><ul>
<li>Nabízí konkurence výhodnější podmínky dopravy (např. dopravu zdarma)?</li>
</ul>
</li>
<li><strong>Zkontroluj aktuální akce:</strong><ul>
<li>Má konkurence výrazné slevy, promo kódy nebo speciální nabídky?</li>
</ul>
</li>
<li><strong>Sleduj jejich reklamní sdělení:</strong><ul>
<li>Nabízí konkurenční značka bonusy, dárky nebo jiné benefity?</li>
</ul>
</li>
</ul>
</li>
<li><strong>Analyzuj zpětnou vazbu na konkurenci:</strong><ul>
<li><strong>Přečti si recenze a hodnocení konkurence:</strong><ul>
<li>Mají zákazníci lepší zkušenosti s jejich službami, rychlostí dodání nebo podporou?</li>
</ul>
</li>
<li><strong>Zkontroluj aktivity na sociálních sítích:</strong><ul>
<li>Jaký mají konkurenti engagement na svých příspěvcích? Jsou jejich kampaně populární?</li>
</ul>
</li>
</ul>
</li>
<li><strong>Vyhodnoť změny v kampaních:</strong><ul>
<li>Sleduj, zda rostou náklady na reklamu (<strong>CPC, CPM</strong>), což může naznačovat zvýšenou konkurenci v aukcích.</li>
<li>Pokud si konkurence více přihazuje na podobné publikum, může to ovlivnit tvé kampaně.</li>
</ul>
</li>
</ol>
</li>
<li><strong>Výsledek:</strong><ul>
<li>Pokud identifikuješ, že konkurence nabízí lepší podmínky:<ul>
<li><strong>Optimalizuj vlastní nabídku:</strong> Přizpůsob ceny, dopravu nebo slevy tak, aby byly konkurenceschopné.</li>
<li><strong>Posiluj hodnotu značky:</strong> Zviditelni benefity, které konkurence nenabízí (kvalita, rychlost, bonusy).</li>
<li><strong>Zvaž strategii retargetingu:</strong> Zaměř se na publikum, které už interagovalo s tvou značkou, a nabídni jim personalizované nabídky.</li>
<li><strong>Investuj do komunikace:</strong> Vysvětli, proč je tvá nabídka lepší, i když například není nejlevnější.</li>
</ul>
</li>
</ul>
</li>
</ul>
<hr>
<h3><strong>Check-list: Rychlá identifikace příčiny problému</strong></h3>
<p>Použij tento check-list pro strukturovanou analýzu problému v kampaních, na webu nebo v externích faktorech:</p>
<hr>
<h3><strong>1. Diagnostika kampaní (interní faktor)</strong></h3>
<ul>
<li><input disabled="" type="checkbox"> Zkontroluj <strong>CTR (míru proklikovosti)</strong>:<ul>
<li>Stabilní nebo klesající? Problém může být v kreativitách nebo cílení.</li>
</ul>
</li>
<li><input disabled="" type="checkbox"> Ověř <strong>CPC (cenu za proklik)</strong>:<ul>
<li>Stabilní nebo rostoucí? Vyšší CPC může naznačovat nerelevantní cílení nebo zvýšenou konkurenci.</li>
</ul>
</li>
<li><input disabled="" type="checkbox"> Sleduj <strong>frekvenci zobrazení (frequency)</strong>:<ul>
<li>Je vysoká (přes 3–5)? Únava publika může ovlivnit výkon kampaně.</li>
</ul>
</li>
<li><input disabled="" type="checkbox"> Porovnej metriky (CTR, CPC, frekvence) s předchozím obdobím (7, 14, 30 dní).</li>
</ul>
<hr>
<h3><strong>2. Diagnostika webu (interní faktor)</strong></h3>
<ul>
<li><input disabled="" type="checkbox"> Zkontroluj <strong>konverzní poměr webu</strong>:<ul>
<li>Je horší než v minulém období?</li>
</ul>
</li>
<li><input disabled="" type="checkbox"> Analyzuj průchodnost košíkem:<ul>
<li>Najdi stránky s nejvyšší mírou opuštění.</li>
<li>Zkontroluj chování na různých zařízeních (mobil/desktop/tablet).</li>
</ul>
</li>
<li><input disabled="" type="checkbox"> Proveď manuální testování konverzní cesty:<ul>
<li>Rychlost načítání.</li>
<li>Funkčnost tlačítek a platebních bran.</li>
</ul>
</li>
</ul>
<hr>
<h3><strong>3. Zhodnocení rozpočtů kampaní (interní faktor)</strong></h3>
<ul>
<li><input disabled="" type="checkbox"> Je denní rozpočet dostatečný pro dosažení požadovaného výkonu?</li>
<li><input disabled="" type="checkbox"> Nedochází k pravidelnému vyčerpání rozpočtu, což omezuje výkon kampaně?</li>
</ul>
<hr>
<h3><strong>4. Sezónnost (externí faktor)</strong></h3>
<ul>
<li><input disabled="" type="checkbox"> Porovnej výkon s daty z předchozího roku:<ul>
<li>Sleduj trendy v CTR, CPC, konverzním poměru nebo tržbách.</li>
</ul>
</li>
<li><input disabled="" type="checkbox"> Použij <strong>Google Trends</strong> k ověření sezónních výkyvů zájmu o produkty/služby.</li>
<li><input disabled="" type="checkbox"> Zkontroluj data o prodejích klienta:<ul>
<li>Odpovídá aktuální pokles sezónním výkyvům z minulosti?</li>
</ul>
</li>
<li><input disabled="" type="checkbox"> Zvaž vliv aktuálních událostí (svátky, prázdniny, ekonomické změny).</li>
</ul>
<hr>
<h3><strong>5. Konkurence (externí faktor)</strong></h3>
<ul>
<li><input disabled="" type="checkbox"> Zjisti, zda se objevila <strong>nová konkurence</strong>:<ul>
<li>Sleduj aukční přehledy v reklamních účtech (Meta Ads, Google Ads).</li>
<li>Analyzuj vyhledávače zboží (Heureka, Google Shopping).</li>
</ul>
</li>
<li><input disabled="" type="checkbox"> Porovnej ceny a nabídky konkurence:<ul>
<li>Prodávají levněji?</li>
<li>Nabízejí lepší podmínky dopravy nebo speciální akce?</li>
</ul>
</li>
<li><input disabled="" type="checkbox"> Přečti si recenze konkurence:<ul>
<li>Mají lepší hodnocení služeb, dodání nebo podpory?</li>
</ul>
</li>
<li><input disabled="" type="checkbox"> Sleduj jejich reklamní sdělení a engagement na sociálních sítích.</li>
<li><input disabled="" type="checkbox"> Vyhodnoť vliv konkurence na náklady reklamy (CPC, CPM):<ul>
<li>Zvyšují se kvůli agresivnější nabídce konkurence?</li>
</ul>
</li>
</ul>
<hr>
<h3><strong>Výstup analýzy:</strong></h3>
<ul>
<li><input disabled="" type="checkbox"> Shrň závěry:<ul>
<li>Kde je problém (kampaně, web, sezónnost, konkurence)?</li>
</ul>
</li>
<li><input disabled="" type="checkbox"> Navrhni doporučení klientovi:<ul>
<li>Jaké konkrétní kroky by měl podniknout (např. optimalizace kampaní, UX analýza webu, úprava cenové strategie).</li>
</ul>
</li>
</ul>
<p>Použij tento check-list k rychlé diagnostice problému a vytvoř konkrétní akční plán.</p>
',
'Cíl: Rychle identifikovat hlavní příčinu problému. Musíš zjistit, jesti je chyba v kampaních, na webu a nebo v externím faktoru (sezónnost, konkurence) Prioritizuj kroky pomocí vylučovací metodou. Věnuj analýze maximálně 1–2 hodiny, komplexnější problémy by se měly řešit jako samostatný projekt (např. nabídni klientovi UX analýzu, pokud zjistíš, že problém je na webu) --Diagnostika kampaní interní faktor: CTR, CPC, frekvence Cíl: Zjisti, zda špatné výsledky pocházejí přímo z reklamních kampaní. Kroky: Zkontroluj klíčové metriky v reklamních účtech: CTR (míra proklikovosti): Stabilní CTR = reklamy stále přitahují relevantní publikum. Klesající CTR = problém v kreativitách (texty, vizuály) nebo v cílení. CPC (cena za proklik): Stabilní CPC = aukce se nemění, konkurence není hlavním problémem. Rostoucí CPC = vyšší konkurence nebo nerelevantní cílení. Frekvence (frequency): Není příliš vysoká (přes 3–5 zobrazení)? Vysoká frekvence může znamenat únavu publika. Porovnej metriky s předchozím obdobím (7, 14 nebo 30 dní): Srovnej CTR, CPC a frekvenci s předchozím obdobím. Stabilní metriky = problém není přímo v kampaních. Výsledek: Pokud jsou metriky CTR, CPC a frekvence stabilní, přejdi k analýze externích faktorů. Pokud jsou odchylky, optimalizuj kampaně (kreativy, cílení, rozpočty). --Diagnostika webu interní faktor: Google Analytics a konverzní poměr Cíl: Zjisti, zda špatné výsledky pramení z problémů na webu. Kroky: Zkontroluj konverzní poměr webu: Porovnej konverzní poměr za posledních 7, 14 nebo 30 dní s předchozím obdobím. Zhoršení konverzního poměru = problém pravděpodobně na webu nebo v nabídce. Zaměř se na průchodnost košíkem: Použij Google Analytics (nebo jiný nástroj) k analýze jednotlivých kroků v konverzní cestě. Identifikuj stránky s nejvyšší mírou opuštění. Zkontroluj chování na úrovni zařízení (mobil/desktop/tablet): Nejsou chyby pouze na jednom typu zařízení? Proveď manuální kontrolu konverzní cesty: Proveď testovací objednávku na všech zařízeních (mobil, desktop). Zkontroluj: Rychlost načítání. Funkčnost tlačítek (Přidat do košíku, Pokračovat k pokladně). Platební brány a možnosti. Výsledek: Pokud najdeš problém na webu, pošli ho klientovi k řešení. Pokud je problém komplexní, doporuč klientovi UX analýzu webu. --Podfinancování kampaní Interní faktor Cíl: Prověř, zda kampaně nemají omezený výkon kvůli nízkým rozpočtům. Kroky: Zkontroluj, zda je denní rozpočet dostatečný vzhledem k výkonu celého e-shopu (PNO je nižší neš by mělo). Podívej se na překročení nebo dosažení limitu rozpočtu: Pokud je kampaň často zastavována z důvodu vyčerpání rozpočtu, doporuč klientovi jeho navýšení. --Sezónnost Externí faktor Cíl: Zjisti, zda špatné výsledky souvisí se sezónními výkyvy na trhu. Kroky: Porovnej výkon s daty z předchozího roku: Analyzuj data za stejné období v loňském roce. Sleduj trendy v CTR, CPC, konverzním poměru nebo tržbách. Sleduj sezónní trendy v odvětví: Použij Google Trends a analyzuj objemy vyhledávání na relevantní klíčová slova: Klesá zájem v aktuálním období? Ověř sezónní trendy ve zprávách z oboru nebo v benchmark reportech. Zkontroluj data o prodejích klienta: Pokud klient podniká v odvětví se sezónními výkyvy (např. cestování, móda, dárky), ověř, zda je aktuální pokles konzistentní s minulými sezónami. Zvaž vliv aktuálních událostí: Nepůsobí aktuální faktory, jako jsou svátky, prázdniny nebo ekonomické události, pokles aktivity publika? Výsledek: Pokud je problém sezónní: Přizpůsob kampaně: Zaměř se na produkty nebo služby, které jsou relevantní pro aktuální období. Optimalizuj rozpočty: Sniž výdaje na kampaně, které mají nízkou sezónní poptávku, a navyš rozpočty tam, kde je vyšší zájem. Připrav se na budoucí sezónu: Testuj strategie pro nadcházející období a optimalizuj kampaně podle těchto výsledků. Konkurence Externí faktor Cíl: Zjisti, zda výsledky kampaní nebo webu ovlivňuje nová nebo stávající konkurence se silnější nabídkou. Kroky: Zjisti, zda se objevila nová konkurence: Sleduj aukční přehledy v reklamních účtech: V Google Ads zkontroluj nové hráče v aukčním přehledu. Zvyšuje se podíl konkurence, kterou dříve v přehledech nevidíš? Zkontroluj vyhledávače zboží (Heureka, Google Shopping): Hledej, zda se v produktových kategoriích neobjevili noví prodejci. Porovnej ceny a nabídky konkurence: Zkontroluj ceny produktů: Ověř, zda konkurence neprodává podobné produkty levněji. Zkontroluj cenu dopravy: Nabízí konkurence výhodnější podmínky dopravy (např. dopravu zdarma)? Zkontroluj aktuální akce: Má konkurence výrazné slevy, promo kódy nebo speciální nabídky? Sleduj jejich reklamní sdělení: Nabízí konkurenční značka bonusy, dárky nebo jiné benefity? Analyzuj zpětnou vazbu na konkurenci: Přečti si recenze a hodnocení konkurence: Mají zákazníci lepší zkušenosti s jejich službami, rychlostí dodání nebo podporou? Zkontroluj aktivity na sociálních sítích: Jaký mají konkurenti engagement na svých příspěvcích? Jsou jejich kampaně populární? Vyhodnoť změny v kampaních: Sleduj, zda rostou nákla',
3,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'99fc7098-4a1e-4538-9f3e-7bd80199e26f',
'11111111-1111-1111-1111-111111111109',
'Content management',
'<h1><strong>Zodpovědnosti</strong></h1>
<p>Plánování, koordinace a exekuce obsahu na všech agenturních kanálech (sociální sítě, blog, newsletter, podcast, případové studie apod.) a kanálech majitelů.</p>
<h1><strong>Cíl SOP</strong></h1>
<p>Zajistit jasný postup pro efektivní a konzistentní práci s obsahem napříč kanály agentury a majitelů.</p>
<h1>1. Hlavní oblasti odpovědnosti</h1>
<h2>Plánování obsahu</h2>
<ul>
<li>Vytváří měsíční publikační plán pro sociální sítě, podcast a newslettery.</li>
<li>Úzce spolupracuje s Dannym a Oťasem (někdy specialisty) pro získávání témat.</li>
<li>Aktualizuje plány v nástroji Zoomsphere</li>
</ul>
<h2>Tvorba obsahu</h2>
<ul>
<li><p>Koordinuje grafika a videoeditora.</p>
</li>
<li><p>Píše nebo edituje texty (titulky, příspěvky, thumbnaily, případové studie, popisky k podcastům, emaily).</p>
<ul>
<li>Pro podcasty využívá transkripty z descriptu</li>
</ul>
</li>
<li><p>Zadává produkční podklady pro natáčení (např. scénáře, hooky, popisky).</p>
</li>
<li><p>Tvoří short form z long form obsahu:</p>
<p>  Video (the highest leverage) → Audio → Statické grafické posty → Psaná tvorba (Threads, Twitter, e-mailing, případovky)</p>
</li>
<li><p>Dává inspiraci, co tvořit dál (př. top performing reelsko z podcastu → doporučí připravit epizodu podcastu nebo YouTube video).</p>
</li>
</ul>
<h2>Publikace obsahu</h2>
<ul>
<li>Plánuje a publikuje schválený obsah dle kalendáře v Zoomsphere.</li>
<li>Používá schválené nástroje pro plánování (Zoomsphere)</li>
<li>Dodržuje nastavený harmonogram (např. 1 podcast týdně ve čtvrtek, min. 5 reels týdně, min. 2 statické posty týdně)</li>
</ul>
<h2>Vyhodnocení a reporting</h2>
<ul>
<li>Stanoví benchmark pro vyhodnocení úspěšného obsahu.</li>
<li>Sleduje výkon obsahu (views, dosah, engagement)</li>
<li>1× měsíčně připraví přehled s poznatky: co fungovalo / co ne / návrhy pro zlepšení.</li>
<li>Využívá přehledy z platforem</li>
</ul>
<h1><strong>2. Standardní pracovní postupy</strong></h1>
<h1><strong>Měsíční plánování</strong></h1>
<ul>
<li>Termín: mít kompletně připravený obsah na minimálně 2 (ideálně 3) týdny dopředu</li>
<li>Výstup: Vyplněné Zoomsphere se všemi tématy, formáty a deadliny.</li>
<li>1x měsíčně 1 velký společný meeting nad obsahem pro další období.</li>
</ul>
<h1>Vytváření obsahu (long form do short form)</h1>
<p>Cílem je efektivně přetvářet dlouhé formáty (např. video podcasty, případové studie) do krátkých, atraktivních videí nebo statických postů pro sociální sítě (short-form content).</p>
<ul>
<li>Zdrojem je dlouhé video nebo případová studie.</li>
<li>Nástroje pro zpracování videa:<ul>
<li>zdroj videa: YouTube</li>
<li>nástroj pro vytvoření reels: OpusClip</li>
</ul>
</li>
<li>Výstup:<ul>
<li>reels</li>
<li>statický příspěvek (carousel, image,…)</li>
</ul>
</li>
</ul>
<h1><strong>Vytváření reels</strong></h1>
<ul>
<li>Postup: Danny + Oťas natočí videa → nahrají na drive → vytvoří nový post v Zoomsphere → v interním komentáři označí Content Managera a vloží odkaz na složku s videem → předání na editaci →  postprodukce → kontrola kvality výstupu → donahrání titulků → upload do Zoomsphere → přichystání thumbnailu → schválení → naplánování → publikace</li>
<li>Thumbnail: obrázek dodává editor, overlay připravuje content manager v Canva</li>
</ul>
<h1>Případové studie</h1>
<ul>
<li>Píše Meta Ads specialista nebo Oťas → před schválením případovky posílá ke gramatické kontrole Content Managerce → po kontrole posílá projektový manažer na klienta → finálně odsouhlasenou případovku → Content Manager nahazuje na web → Příprava obsahu</li>
</ul>
<h1><strong>Podcasty</strong></h1>
<ul>
<li>Termín: pravidelná publikace každý čtvrtek ráno</li>
<li>Video editor nahrává epizody na podcasters → příprava popisků na všech platformách → doplnění timeline → příprava thumbnailu a popisku k reelsku k epizodě → naplánování a publikace → vložení příspěvku do stories s odkazem na podcasters</li>
<li>Postup nahrávání podcastů na platformy: <a href="https://www.loom.com/share/e8d2ed49571f43afa109130455f38f4c?sid=4ffbd85d-06d0-4ffa-a31d-8fe8c5f1006c">https://www.loom.com/share/e8d2ed49571f43afa109130455f38f4c?sid=4ffbd85d-06d0-4ffa-a31d-8fe8c5f1006c</a></li>
<li>Postup přidání podcastu na web</li>
<li>Thumbnail pro reels: obrázek dodává editor, overlay připravuje content manager v Canva</li>
<li>Thumbnail pro YouTube: obrázek dodává editor, overlay připravuje grafička Ivka Šimková v Canva</li>
</ul>
<h1>YouTube</h1>
<p>Doplní Danny</p>
<h1><strong>3. Komunikační linky a odpovědnosti</strong></h1>
<ul>
<li><strong>Reportuje komu:</strong> CMO</li>
<li><strong>Spolupracuje s:</strong> CEO, CMO, grafiky, video editory</li>
<li><strong>Hlavní komunikační kanály:</strong> Zoomsphere, Slack</li>
</ul>
<h1><strong>4. Měřitelné výstupy (KPI)</strong></h1>
<ul>
<li>Počet publikovaných agenturních výstupů:<ul>
<li>28 reelsek</li>
<li>4 podcasty</li>
<li>8 statických příspěvků</li>
<li>40 stories</li>
</ul>
</li>
<li>Plnění harmonogramu: Naplánovaný obsah na 2-3 týdny dopředu</li>
<li>Pravidelná zpětná vazba content creatorům</li>
</ul>
<h1><strong>5. Systematizace a názvosloví</strong></h1>
<ul>
<li>Dbá na pořádek, dodržování pravidel a správné pojmenování videí, transkriptů a dalších materiálů dodaných od grafiků a editorů.</li>
<li>Veškeré podklady (grafika, texty, videa) se ukládají do G-Drive struktury dle měsíce a typu výstupu.</li>
</ul>
',
'Zodpovědnosti Plánování, koordinace a exekuce obsahu na všech agenturních kanálech (sociální sítě, blog, newsletter, podcast, případové studie apod.) a kanálech majitelů. Cíl SOP Zajistit jasný postup pro efektivní a konzistentní práci s obsahem napříč kanály agentury a majitelů. Hlavní oblasti odpovědnosti Plánování obsahu Vytváří měsíční publikační plán pro sociální sítě, podcast a newslettery. Úzce spolupracuje s Dannym a Oťasem (někdy specialisty) pro získávání témat. Aktualizuje plány v nástroji Zoomsphere Tvorba obsahu Koordinuje grafika a videoeditora. Píše nebo edituje texty (titulky, příspěvky, thumbnaily, případové studie, popisky k podcastům, emaily). Pro podcasty využívá transkripty z descriptu Zadává produkční podklady pro natáčení (např. scénáře, hooky, popisky). Tvoří short form z long form obsahu: Video (the highest leverage) → Audio → Statické grafické posty → Psaná tvorba (Threads, Twitter, e-mailing, případovky) Dává inspiraci, co tvořit dál (př. top performing reelsko z podcastu → doporučí připravit epizodu podcastu nebo YouTube video). Publikace obsahu Plánuje a publikuje schválený obsah dle kalendáře v Zoomsphere. Používá schválené nástroje pro plánování (Zoomsphere) Dodržuje nastavený harmonogram (např. 1 podcast týdně ve čtvrtek, min. 5 reels týdně, min. 2 statické posty týdně) Vyhodnocení a reporting Stanoví benchmark pro vyhodnocení úspěšného obsahu. Sleduje výkon obsahu (views, dosah, engagement) 1× měsíčně připraví přehled s poznatky: co fungovalo / co ne / návrhy pro zlepšení. Využívá přehledy z platforem Standardní pracovní postupy Měsíční plánování Termín: mít kompletně připravený obsah na minimálně 2 (ideálně 3) týdny dopředu Výstup: Vyplněné Zoomsphere se všemi tématy, formáty a deadliny. 1x měsíčně 1 velký společný meeting nad obsahem pro další období. Vytváření obsahu (long form do short form) Cílem je efektivně přetvářet dlouhé formáty (např. video podcasty, případové studie) do krátkých, atraktivních videí nebo statických postů pro sociální sítě (short-form content). Zdrojem je dlouhé video nebo případová studie. Nástroje pro zpracování videa: zdroj videa: YouTube nástroj pro vytvoření reels: OpusClip Výstup: reels statický příspěvek (carousel, image,…) Vytváření reels Postup: Danny + Oťas natočí videa → nahrají na drive → vytvoří nový post v Zoomsphere → v interním komentáři označí Content Managera a vloží odkaz na složku s videem → předání na editaci → postprodukce → kontrola kvality výstupu → donahrání titulků → upload do Zoomsphere → přichystání thumbnailu → schválení → naplánování → publikace Thumbnail: obrázek dodává editor, overlay připravuje content manager v Canva Případové studie Píše Meta Ads specialista nebo Oťas → před schválením případovky posílá ke gramatické kontrole Content Managerce → po kontrole posílá projektový manažer na klienta → finálně odsouhlasenou případovku → Content Manager nahazuje na web → Příprava obsahu Podcasty Termín: pravidelná publikace každý čtvrtek ráno Video editor nahrává epizody na podcasters → příprava popisků na všech platformách → doplnění timeline → příprava thumbnailu a popisku k reelsku k epizodě → naplánování a publikace → vložení příspěvku do stories s odkazem na podcasters Postup nahrávání podcastů na platformy: https://www.loom.com/share/e8d2ed49571f43afa109130455f38f4c?sid=4ffbd85d-06d0-4ffa-a31d-8fe8c5f1006c Postup přidání podcastu na web Thumbnail pro reels: obrázek dodává editor, overlay připravuje content manager v Canva Thumbnail pro YouTube: obrázek dodává editor, overlay připravuje grafička Ivka Šimková v Canva YouTube Doplní Danny Komunikační linky a odpovědnosti Reportuje komu: CMO Spolupracuje s: CEO, CMO, grafiky, video editory Hlavní komunikační kanály: Zoomsphere, Slack Měřitelné výstupy (KPI) Počet publikovaných agenturních výstupů: 28 reelsek 4 podcasty 8 statických příspěvků 40 stories Plnění harmonogramu: Naplánovaný obsah na 2-3 týdny dopředu Pravidelná zpětná vazba content creatorům Systematizace a názvosloví Dbá na pořádek, dodržování pravidel a správné pojmenování videí, transkriptů a dalších materiálů dodaných od grafiků a editorů. Veškeré podklady (grafika, texty, videa) se ukládají do G-Drive struktury dle měsíce a typu výstupu.',
4,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'1539a246-d8ac-44b2-9228-4742b593e4b7',
'11111111-1111-1111-1111-111111111112',
'Doporučení služby: Creative Boost - Tvorba grafiky do reklam',
'<p>Služba <strong>Creative Boost</strong> není jen “grafika do kampaní”.</p>
<p>Je to <strong>systém prodeje pomocí výkonnostní strategické kreativy</strong>.</p>
<p>Řešíme <strong>komunikaci produktu/služby do hloubky</strong> – ne jen vzhled banneru nebo videa:</p>
<ul>
<li>hledáme správné <strong>úhly komunikace</strong> (problém → řešení, emoce, rácio, USP),</li>
<li>píšeme <strong>prodejní texty</strong> (headline, benefity, CTA),</li>
<li>tvoříme <strong>výkonnostní bannery a videa</strong> tak, aby dávaly smysl z pohledu Meta/PPC výkonu,</li>
<li>připravujeme <strong>více konceptů a hooků</strong>, které lze testovat a škálovat.</li>
</ul>
<p>Klient <strong>nemusí řešit, jak produkt komunikovat ani co má být napsáno na banneru / ve videu</strong>.</p>
<p>Dodá cíle, základní informace a podklady – <strong>texty, úhly komunikace i vizuální zpracování vymýšlíme a připravujeme my</strong>.</p>
<p>Creative Boost funguje na <strong>kreditovém systému</strong>. Klient má každý měsíc k dispozici předem domluvený rámec kreditů, které využíváme na tvorbu klíčových kreativ pro výkonnostní reklamy – Meta Ads bannery, videa a PPC bannery – se <strong>standardním zpracováním do 72 hodin</strong> a možností <strong>expresního dodání do 48 hodin</strong>.</p>
<ul>
<li><strong>1 kredit = 400 Kč bez DPH.</strong></li>
</ul>
<hr>
<h2>Pravidla služby</h2>
<ul>
<li><p><strong>Hodnota kreditu</strong></p>
<p>  1 kredit má pevnou hodnotu <strong>400 Kč bez DPH (platí pro klienty přidané v roce 2026)</strong>. Každý typ výstupu (bannery, videa, úpravy, překlady) má jasně danou kreditovou hodnotu.</p>
</li>
<li><p><strong>Domluvený rámec a fakturace reality</strong></p>
<p>  Na začátku měsíce si s klientem domluvíme <strong>orientační nebo maximální počet kreditů</strong> (např. 40–60 kreditů).</p>
<p>  Na konci měsíce <strong>fakturujeme skutečně vyčerpané kredity</strong>.</p>
</li>
<li><p><strong>Nepřenosnost kreditů</strong></p>
<p>  Kredity jsou <strong>nepřenosné do dalšího měsíce</strong>, což motivuje klienta využít plánovaný objem práce v daném období.</p>
</li>
<li><p><strong>Revize</strong></p>
<p>  Každý výstup (pack bannerů / video pack) obsahuje <strong>1 revizní kolo zdarma</strong>.</p>
<p>  <strong>Každé další revizní kolo se účtuje jako 1 kredit</strong> (bez ohledu na typ výstupu).</p>
</li>
<li><p><strong>Rychlost zpracování</strong></p>
<ul>
<li><p><strong>Standardní režim:</strong> zpracování bannerů a videí do <strong>72 hodin</strong> od kompletního zadání.</p>
</li>
<li><p><strong>Expresní režim:</strong> garantované dodání do <strong>48 hodin</strong> – účtujeme <strong>+50 % kreditů navíc</strong> za daný výstup (zaokrouhlit nahoru).</p>
<p>  Expres VŽDY musí být <strong>předem odsouhlasen klientem</strong> (ideálně písemně ve Freelu / e-mailu).</p>
</li>
</ul>
</li>
<li><p><strong>Komunikace s klientem</strong></p>
<p>  S klientem komunikuje <strong>pouze projektový manažer</strong>, ne grafik / editor.</p>
</li>
<li><p><strong>Změna počtu kreditů</strong></p>
<p>  Pokud klientovi dlouhodobě přebývá hodně kreditů nebo jich naopak nestačí, <strong>projekťák navrhne úpravu balíčku</strong> (navýšení/snížení rámce kreditů).</p>
</li>
<li><p><strong>Video podklady</strong></p>
<ul>
<li>Primárně by měl <strong>dodávat video/foto podklady klient</strong> (produkty, použití, sklad, tým, UGC…).</li>
<li>U varianty <strong>AI b-roll</strong> je možné výrazně pomoci AI scénami a b-rolly, i když klient nemá dost vlastních záběrů.</li>
</ul>
</li>
</ul>
<hr>
<h2>Co vše Creative Boost zahrnuje</h2>
<h3>👉 Tvorbu bannerů pro Meta Ads a PPC</h3>
<ol>
<li><p><strong>Výběr produktů a úhlů komunikace</strong></p>
<p> Pomůžeme vybrat vhodné produkty / služby a <strong>úhel komunikace</strong>, který dává výkonově smysl.</p>
</li>
<li><p><strong>Texty pro bannery</strong></p>
<p> Vytváříme <strong>prodejní texty</strong> – headline, benefity, USP, CTA – tak, aby byly jasné, krátké a výkonnostní.</p>
</li>
<li><p><strong>Návrh a vytvoření grafiky</strong></p>
<p> Navrhujeme a tvoříme <strong>profesionální grafiku</strong> pro bannery (Meta Ads, PPC) v souladu se značkou, ale s důrazem na výkon.</p>
</li>
<li><p><strong>Revize</strong></p>
<p> Každý banner pack obsahuje <strong>1 kolo revizí</strong> (doladění textů, barev, layoutu). Další revize = <strong>1 kredit / kolo</strong>.</p>
</li>
</ol>
<hr>
<h3>👉 Tvorbu krátkých vertikálních videí (Reels, Stories, Shorts)</h3>
<ol>
<li><p><strong>Návrh konceptu a scénáře (script)</strong></p>
<p> Vytvoříme <strong>koncept videa</strong> (hook → problém → řešení → CTA) v souladu s cílem kampaně (akvizice / remarketing / promo konkrétní nabídky).</p>
</li>
<li><p><strong>Texty pro voiceover a přelepky</strong></p>
<p> Připravíme <strong>script pro voiceover</strong> i texty pro <strong>overlays</strong> (titulky, claimy, CTA).</p>
</li>
<li><p><strong>Generování voiceoveru (AI nebo reálný)</strong></p>
<p> Zajistíme nahrání nebo <strong>AI generování voiceoveru</strong>.</p>
</li>
<li><p><strong>Editace videa</strong></p>
<p> Kompletní střih: řazení záběrů, b-rolly (podle varianty), hudba, titulky, efekty.</p>
</li>
<li><p><strong>Výstup</strong></p>
<ul>
<li>Formát <strong>9:16</strong>, délka typicky <strong>15–30 s</strong>.</li>
<li>Každý koncept = <strong>3 různé hooky = 3 samostatná videa</strong> pro A/B testy.</li>
</ul>
</li>
<li><p><strong>Revize</strong></p>
<p> Každý video pack (1 koncept / 3 videa) obsahuje <strong>1 kolo revizí</strong>, další revize = <strong>1 kredit / kolo</strong>.</p>
</li>
</ol>
<hr>
<h2>Hodnota jednotlivých výstupů</h2>
<h3>👉 Bannery</h3>
<ul>
<li><p><strong>Brand kit (úvodní návrh na začátku spolupráce)</strong></p>
<p>  4–6 kreditů (dle kvality vstupů od klienta a náročnosti)</p>
</li>
<li><p><strong>Rámeček pro katalogové Meta Ads kampaně</strong></p>
<p>  1 kredit</p>
</li>
<li><p><strong>Meta Ads bannery ve 2 rozměrech (1080 × 1080 a 1080 × 1920)</strong></p>
<p>  4 kredity / pack</p>
</li>
<li><p><strong>Překlad Meta Ads bannerů do jiného jazyka</strong></p>
<p>  1 kredit</p>
</li>
<li><p><strong>Set PPC bannerů (6–10 rozměrů)</strong></p>
<p>  1 kredit / rozměr</p>
</li>
<li><p><strong>Překlad PPC banneru (1 rozměr)</strong></p>
<p>  0,5 kreditu</p>
</li>
<li><p><strong>Vytvoření produktové fotky přes AI</strong></p>
<p>  2 kredity</p>
</li>
<li><p><strong>Úprava již vytvořených Meta Ads bannerů</strong></p>
<p>  (jiný text, přelepka, výměna fotky) ve 2 rozměrech (1080 × 1080 a 1080 × 1920):</p>
<p>  1 kredit</p>
</li>
<li><p><strong>Příprava bannerů na homepage / do newsletteru</strong></p>
<p>  (z již vytvořené kreativy pro naše kampaně):</p>
<p>  2 kredity</p>
</li>
</ul>
<blockquote>
<p>U všech bannerových výstupů:</p>
<p><strong>1 revizní kolo je v ceně</strong>, každé další = <strong>1 kredit</strong>.</p>
</blockquote>
<hr>
<h3>👉 Videa (Video Boost v rámci Creative Boost)</h3>
<blockquote>
<p>Každá video zakázka se účtuje v kreditech (v rámci Creative Boost).</p>
<p>1 kredit = 400 Kč bez DPH.</p>
</blockquote>
<h3>🎥 Výkonnostní video – Standard</h3>
<p><em>(záběry klienta + AI hooky, bez rozsáhlých AI b-rollů)</em></p>
<ul>
<li>1 výkonnostní <strong>koncept videa</strong></li>
<li><strong>3 různé hooky</strong> = <strong>3 finální videa</strong> (3 samostatné soubory)</li>
<li>AI voiceover + AI titulky</li>
<li>Práce primárně s klientskými záběry</li>
</ul>
<p><strong>Hodnota:</strong></p>
<ul>
<li><strong>12 kreditů</strong> / 1 koncept (3 videa)</li>
</ul>
<hr>
<h3>🎥 Výkonnostní video – AI b-roll</h3>
<p><em>(záběry klienta + rozšířené AI scény a AI b-rolly)</em></p>
<ul>
<li>1 výkonnostní <strong>koncept videa</strong></li>
<li><strong>3 různé hooky</strong> = <strong>3 finální videa</strong></li>
<li>AI voiceover + AI titulky</li>
<li>Rozšířené <strong>AI b-rolly a AI scény</strong> (vhodné, pokud klient nemá mnoho vlastních záběrů)</li>
</ul>
<p><strong>Hodnota:</strong></p>
<ul>
<li><strong>17 kreditů</strong> / 1 koncept (3 videa)</li>
</ul>
<hr>
<h3>Další video služby</h3>
<ul>
<li><p><strong>Další alternativní hook navíc</strong> (nad základní 3, tj. +1 nové video)</p>
<p>  2 kredity</p>
</li>
<li><p><strong>Menší úprava videa</strong></p>
<p>  (úprava textů, vystřižení nebo vložení záběru):</p>
<p>  2 kredity</p>
</li>
<li><p><strong>Překlad videa (titulky / voiceover)</strong></p>
<p>  2 kredity</p>
</li>
</ul>
<blockquote>
<p>U všech video výstupů:</p>
<p><strong>1 revizní kolo je v ceně</strong>, každé další = <strong>1 kredit</strong>.</p>
</blockquote>
<hr>
<h2>🗺️ Postup doručení služby (interní proces)</h2>
<ol>
<li><p><strong>Stanovení počtu kreditů na měsíc</strong></p>
<ul>
<li>Projekťák s klientem domluví <strong>rámec kreditů</strong> (např. 40–60 / měsíc).</li>
<li>Vysvětlí, že fakturace probíhá dle <strong>reálně vyčerpaných kreditů</strong>.</li>
</ul>
</li>
<li><p><strong>Nasdílení podkladů od klienta</strong></p>
<p> Do klientské složky na Google Drive si necháme nahrát:</p>
<ul>
<li>Brand manuál (nebo alespoň logo, fonty, barvy),</li>
<li>Historické bannery / vizuály, pokud mají konzistentní grafickou linku,</li>
<li>Foto a video podklady, které lze využít (produkty, people, sklad, UGC…).</li>
</ul>
</li>
<li><p><strong>Rozdělení práce mezi specialisty</strong></p>
<ul>
<li>Projekťák domlouvá grafika / editora podle vytížení a typu klienta.</li>
<li>U větších klientů preferujeme <strong>konzistentní tým</strong> (stejný grafik/editor).</li>
</ul>
</li>
<li><p><strong>Evidence kreditů</strong></p>
<ul>
<li><p>Kredity evidujeme v Google Sheets – <strong>záložka = měsíc</strong>.</p>
</li>
<li><p>Odpovědnost za správnost: <strong>projektový manažer</strong>.</p>
</li>
<li><p>Vzorová tabulka:</p>
<p>  <a href="https://drive.google.com/drive/folders/1wjRWdrB4Q2jTxFr8NIXE2KHda2wI00ta?usp=sharing">https://drive.google.com/drive/folders/1wjRWdrB4Q2jTxFr8NIXE2KHda2wI00ta?usp=sharing</a></p>
</li>
<li><p>Tabulku přesuneme do složky konkrétního klienta na Drive.</p>
</li>
</ul>
</li>
<li><p><strong>Nastavení práce ve Freelu</strong></p>
<ul>
<li><p>Ve Freelu vytvoříme <strong>to-do list pro Creative Boost</strong>.</p>
<p>  <a href="https://app.freelo.io/public/shared-link-view/?a=3be38e24641a776ee192b11c89297812&b=855c9973c652300b4e08bce3ab8c219a">https://app.freelo.io/public/shared-link-view/?a=3be38e24641a776ee192b11c89297812&amp;b=855c9973c652300b4e08bce3ab8c219a</a></p>
</li>
<li><p>Do připnuté poznámky k to-do listu přidáme:</p>
<ul>
<li>Grafička:</li>
<li>Editor:</li>
<li>Počet kreditů / měsíc:</li>
<li>Odkaz na Google Sheets pro evidenci kreditů.</li>
</ul>
</li>
<li><p>Úkol = <strong>měsíc</strong> (např. „Creative Boost – 10/2025“).</p>
</li>
<li><p>Podúkol = <strong>konkrétní zadání pro grafika / editora</strong>.</p>
</li>
<li><p>V názvu podúkolu musí být uvedena <strong>kreditová hodnota výstupu</strong> (např. „Meta bannery – říjnová akce (4 kredity)“).</p>
</li>
</ul>
</li>
<li><p><strong>Zadávání práce specialistům</strong></p>
<ul>
<li><p>Zadání vždy dává <strong>projektový manažer</strong>, ne klient.</p>
</li>
<li><p>Zadání musí obsahovat:</p>
<ul>
<li>Cíl (akce, novinka, evergreen, remarketing…),</li>
<li>Produkt / kategorie,</li>
<li>USP / benefity,</li>
<li>Deadline (standard / expres),</li>
<li>Požadovaný typ výstupu + kreditová hodnota.</li>
</ul>
</li>
<li><p>Je k dispozici detailní guideline:</p>
<p>  <strong>Postup zadání grafiky – bannerů + videí (Creative Boost)</strong></p>
<p>  <a href="Postup%20zad%C3%A1n%C3%AD%20grafiky%20-%20banner%C5%AF%20+%20vide%C3%AD%20(Creative%20%20c5bb5fd3b523425a890c5e31c8a8042a.md">https://www.notion.so/Postup-zad-n-grafiky-banner-vide-Creative-Boost-c5bb5fd3b523425a890c5e31c8a8042a?pvs=21</a></p>
</li>
</ul>
</li>
<li><p><strong>První měsíc spolupráce</strong></p>
<ul>
<li>Doporučení: v prvním měsíci by mělo jít <strong>cca 25 kreditů</strong> do tvorby statické grafiky (brand kit, základní bannery).</li>
<li>Cíl: vytvořit <strong>grafický směr</strong>, který klient odsouhlasí, a nastavit systém složek na Google Drive.</li>
<li>Pokud má klient základní balíček kreditů, <strong>v prvním měsíci typicky neděláme videa</strong>, dokud není jasný vizuální směr.</li>
</ul>
</li>
<li><p><strong>Evidence kreditů ze strany specialistů</strong></p>
<ul>
<li>Grafik / editor <strong>dopisuji vyčerpané kredity</strong> do Google Sheets (po dokončení každého výstupu).</li>
<li>Je to v jejich zájmu – z kreditů se odvíjí jejich odměna.</li>
</ul>
</li>
<li><p><strong>Doručení výstupů</strong></p>
<ul>
<li>Grafické a video výstupy nahráváme na Google Drive do složky klienta.</li>
<li>Každý měsíc má <strong>vlastní složku</strong> (např. „2025-10 – Creative Boost“).</li>
<li>Odkaz na výstupy dává projekťák klientovi (Freelo / e-mail) + případně poznámky k testování (jaké koncepty/úhly zkusit).</li>
</ul>
</li>
<li><p><strong>Vyhodnocení a úprava balíčku</strong></p>
</li>
</ol>
<ul>
<li>Průběžně (min. 1× za kvartál) projekťák zkontroluje:<ul>
<li>kolik kreditů se typicky využívá,</li>
<li>jestli dává rámec kreditů smysl vzhledem k potřebám klienta.</li>
</ul>
</li>
<li>Pokud dlouhodobě zůstávají kredity nevyčerpané / naopak chybí, <strong>navrhne úpravu rámce</strong>.</li>
</ul>
',
'Služba Creative Boost není jen “grafika do kampaní”. Je to systém prodeje pomocí výkonnostní strategické kreativy. Řešíme komunikaci produktu/služby do hloubky – ne jen vzhled banneru nebo videa: hledáme správné úhly komunikace (problém → řešení, emoce, rácio, USP), píšeme prodejní texty (headline, benefity, CTA), tvoříme výkonnostní bannery a videa tak, aby dávaly smysl z pohledu Meta/PPC výkonu, připravujeme více konceptů a hooků, které lze testovat a škálovat. Klient nemusí řešit, jak produkt komunikovat ani co má být napsáno na banneru / ve videu. Dodá cíle, základní informace a podklady – texty, úhly komunikace i vizuální zpracování vymýšlíme a připravujeme my. Creative Boost funguje na kreditovém systému. Klient má každý měsíc k dispozici předem domluvený rámec kreditů, které využíváme na tvorbu klíčových kreativ pro výkonnostní reklamy – Meta Ads bannery, videa a PPC bannery – se standardním zpracováním do 72 hodin a možností expresního dodání do 48 hodin. 1 kredit = 400 Kč bez DPH. --Pravidla služby Hodnota kreditu 1 kredit má pevnou hodnotu 400 Kč bez DPH (platí pro klienty přidané v roce 2026). Každý typ výstupu (bannery, videa, úpravy, překlady) má jasně danou kreditovou hodnotu. Domluvený rámec a fakturace reality Na začátku měsíce si s klientem domluvíme orientační nebo maximální počet kreditů (např. 40–60 kreditů). Na konci měsíce fakturujeme skutečně vyčerpané kredity. Nepřenosnost kreditů Kredity jsou nepřenosné do dalšího měsíce, což motivuje klienta využít plánovaný objem práce v daném období. Revize Každý výstup (pack bannerů / video pack) obsahuje 1 revizní kolo zdarma. Každé další revizní kolo se účtuje jako 1 kredit (bez ohledu na typ výstupu). Rychlost zpracování Standardní režim: zpracování bannerů a videí do 72 hodin od kompletního zadání. Expresní režim: garantované dodání do 48 hodin – účtujeme +50 % kreditů navíc za daný výstup (zaokrouhlit nahoru). Expres VŽDY musí být předem odsouhlasen klientem (ideálně písemně ve Freelu / e-mailu). Komunikace s klientem S klientem komunikuje pouze projektový manažer, ne grafik / editor. Změna počtu kreditů Pokud klientovi dlouhodobě přebývá hodně kreditů nebo jich naopak nestačí, projekťák navrhne úpravu balíčku (navýšení/snížení rámce kreditů). Video podklady Primárně by měl dodávat video/foto podklady klient (produkty, použití, sklad, tým, UGC…). U varianty AI b-roll je možné výrazně pomoci AI scénami a b-rolly, i když klient nemá dost vlastních záběrů. --Co vše Creative Boost zahrnuje 👉 Tvorbu bannerů pro Meta Ads a PPC Výběr produktů a úhlů komunikace Pomůžeme vybrat vhodné produkty / služby a úhel komunikace, který dává výkonově smysl. Texty pro bannery Vytváříme prodejní texty – headline, benefity, USP, CTA – tak, aby byly jasné, krátké a výkonnostní. Návrh a vytvoření grafiky Navrhujeme a tvoříme profesionální grafiku pro bannery (Meta Ads, PPC) v souladu se značkou, ale s důrazem na výkon. Revize Každý banner pack obsahuje 1 kolo revizí (doladění textů, barev, layoutu). Další revize = 1 kredit / kolo. --👉 Tvorbu krátkých vertikálních videí (Reels, Stories, Shorts) Návrh konceptu a scénáře (script) Vytvoříme koncept videa (hook → problém → řešení → CTA) v souladu s cílem kampaně (akvizice / remarketing / promo konkrétní nabídky). Texty pro voiceover a přelepky Připravíme script pro voiceover i texty pro overlays (titulky, claimy, CTA). Generování voiceoveru (AI nebo reálný) Zajistíme nahrání nebo AI generování voiceoveru. Editace videa Kompletní střih: řazení záběrů, b-rolly (podle varianty), hudba, titulky, efekty. Výstup Formát 9:16, délka typicky 15–30 s. Každý koncept = 3 různé hooky = 3 samostatná videa pro A/B testy. Revize Každý video pack (1 koncept / 3 videa) obsahuje 1 kolo revizí, další revize = 1 kredit / kolo. --Hodnota jednotlivých výstupů 👉 Bannery Brand kit (úvodní návrh na začátku spolupráce) 4–6 kreditů (dle kvality vstupů od klienta a náročnosti) Rámeček pro katalogové Meta Ads kampaně 1 kredit Meta Ads bannery ve 2 rozměrech (1080 × 1080 a 1080 × 1920) 4 kredity / pack Překlad Meta Ads bannerů do jiného jazyka 1 kredit Set PPC bannerů (6–10 rozměrů) 1 kredit / rozměr Překlad PPC banneru (1 rozměr) 0,5 kreditu Vytvoření produktové fotky přes AI 2 kredity Úprava již vytvořených Meta Ads bannerů (jiný text, přelepka, výměna fotky) ve 2 rozměrech (1080 × 1080 a 1080 × 1920): 1 kredit Příprava bannerů na homepage / do newsletteru (z již vytvořené kreativy pro naše kampaně): 2 kredity U všech bannerových výstupů: 1 revizní kolo je v ceně, každé další = 1 kredit. --👉 Videa (Video Boost v rámci Creative Boost) Každá video zakázka se účtuje v kreditech (v rámci Creative Boost). 1 kredit = 400 Kč bez DPH. 🎥 Výkonnostní video – Standard (záběry klienta + AI hooky, bez rozsáhlých AI b-rollů) 1 výkonnostní koncept videa 3 různé hooky = 3 finální videa (3 samostatné soubory) AI voiceover + AI titulky Práce primárně s klientskými záběry Hodnota: 12 kreditů / 1 koncept (3 videa) --🎥 Výkonnostní video – AI b-roll (záběry klien',
5,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'f62bbbcb-933b-439e-9495-8a7bd760efd9',
'11111111-1111-1111-1111-111111111104',
'Doručení služby: Správa Meta Ads, Google Ads a S-kliku (Performance Boost)',
'<h1>🎯 <strong>Cíl služby Performance Boost</strong></h1>
<p><strong>Hlavním cílem služby Performance Boost je jednoduchý:</strong></p>
<blockquote>
<p>Vydělat klientovi peníze.</p>
</blockquote>
<hr>
<p>Nejdůležitější otázka při každém rozhodování zní:</p>
<blockquote>
<p>👉 &quot;Pomůže tento krok klientovi zvýšit tržby, zisk nebo návratnost investice?&quot;</p>
</blockquote>
<p>Pokud odpověď není jasné <strong>ano</strong>, pak:</p>
<ul>
<li><strong>Krok upravit</strong> tak, aby přinášel reálnou hodnotu.</li>
<li><strong>Nebo ho vůbec nedělat.</strong></li>
</ul>
<h1>🧭 <strong>Jak se podle toho rozhodujeme v praxi:</strong></h1>
<ul>
<li><strong>Neoptimalizujeme pro hezčí čísla v reportu</strong>, ale pro <strong>více peněz na účtu klienta</strong>.</li>
<li><strong>Neřešíme zbytečnosti</strong>, které nemají reálný dopad na výkon.</li>
<li><strong>Soustředíme se na akce</strong>, které klientovi vydělávají (škálování funkčních kampaní, nové prodejní kreativy, zlepšení nabídky).</li>
<li><strong>Prioritou je výkon</strong>, ne perfekcionismus.</li>
</ul>
<hr>
<h1>📌 <strong>Zapamatuj si:</strong></h1>
<blockquote>
<p>Performance Boost = Výsledky. Peníze. Růst.<br>Ne &quot;kampaně pro kampaně&quot;, ale reálný byznysový efekt pro klienta.</p>
</blockquote>
<h1><strong>🚀 Kompas pro řízení kampaní a prioritizaci úkolů</strong></h1>
<p>Naším <strong>hlavním úkolem</strong> je <strong>zajistit, že každá investovaná koruna do placené reklamy</strong> (Meta Ads, Google Ads, Sklik) <strong>přináší maximální hodnotu</strong> – tedy <strong>nejvyšší možné tržby</strong> za <strong>nejlepší možný ROAS / PNO / CPA</strong>.</p>
<h3><strong>Co to znamená v praxi?</strong></h3>
<h3>✅ Soustředit se na výkonnost</h3>
<ul>
<li>Každé rozhodnutí (škálování, úpravy, testování nových kreativit nebo klíčových slov) musí mít <strong>jasný cíl</strong>: <strong>zlepšit výsledky a zvýšit tržby klienta</strong>.</li>
<li>Nesnižovat se k úpravám „pro úpravy“ – vždy chceme <strong>reálně zvýšit výkon</strong>.</li>
</ul>
<h3>✅ Nedělat změny bez přidané hodnoty</h3>
<ul>
<li>Pokud v Meta Ads, Google Ads nebo Skliku <strong>nevidíš reálný přínos</strong> (lepší ROAS, více objednávek…), <strong>neplýtvej časem ani rozpočtem</strong>.</li>
</ul>
<h3>✅ Zaměřit se na to, co funguje</h3>
<ul>
<li>Když určité kampaně nebo produkty <strong>stabilně přinášejí výsledky</strong>, snaž se je <strong>škálovat</strong> a <strong>zdokonalovat</strong>.</li>
<li>Nepřekombinovávat úspěšné kampaně mikromanagementem – zbytečně by se ztrácel výkon.</li>
</ul>
<h3>✅ Neustále testovat a inovovat</h3>
<ul>
<li><strong>Kreativita a testování</strong> jsou hnacím motorem růstu, ale musí být <strong>datově a výkonnostně podložené</strong>.</li>
<li>Ověřuj hypotézy (A/B testy), používej malé experimenty v obou platformách (Meta + PPC).</li>
</ul>
<h3>✅ Správně vyhodnocovat kampaně</h3>
<ul>
<li>Výkon Meta Ads, Google Ads a Skliku <strong>analyzuj v kontextu celého marketingového mixu</strong> (SEO, e-mailing, direct traffic…).</li>
<li>Pokud vidíš růst nákladů, ale neodpovídá mu růst tržeb, <strong>hledej příčinu</strong> (landing page, feed, konkurence…).</li>
</ul>
<h3>✅ Pracovat s nabídkou a produktem</h3>
<ul>
<li>I <strong>nejlépe nastavené kampaně</strong> nedokážou uspět, pokud je <strong>nabídka slabá</strong> nebo je problém v UX e-shopu (pomalu se načítá, nedůvěryhodně působí…).</li>
<li>Aktivně navrhuj klientovi <strong>úpravy produktu / nabídky</strong>, když kampaně nenesou očekávané výsledky.</li>
</ul>
<h3><strong>Hlavní otázka při každém rozhodnutí:</strong></h3>
<blockquote>
<p>„Bude tahle změna / úprava / test reálně zvyšovat tržby a pomáhat k lepšímu ROAS / PNO?“</p>
</blockquote>
<p>Pokud ne, <strong>zaměř se raději na aktivity</strong>, které <strong>mají potenciál reálně posunout výkon</strong> v Meta Ads, Google Ads nebo Skliku.</p>
<h1><strong>⚙️ Úvodní nastavení (Setup) služby Performance Boost (Meta Ads + PPC)</strong></h1>
<p>Tato část popisuje <strong>všechny kroky potřebné pro úvodní nastavení kampaní</strong> tak, aby byla služba Socials Boost správně spuštěna a efektivně fungovala v kanálech <strong>Meta Ads</strong> a <strong>PPC</strong> (Google Ads, Sklik).</p>
<hr>
<h2>🚀 <strong>5 Klíčových bodů pro Start služby Performance Boost</strong></h2>
<blockquote>
<p>Cíl fáze: Zajistit kompletní technické prostředí, jasnou strategii a připravené kampaně pro rychlé škálování výkonu.</p>
</blockquote>
<hr>
<h3>1. <strong>Přístupy a funkční měření</strong></h3>
<blockquote>
<p>Přístupy: Meta Business Manager, Google Ads, Sklik, Merchant Center, GA4, e-shop administrace.</p>
<p>Měření: Meta Pixel + CAPI, GA4 eventy, Google Ads tagy, Sklik konverzní kód.</p>
</blockquote>
<p><strong>→ Bez kompletních přístupů a ověřeného měření kampaň nespustíme. Absolutní priorita.</strong></p>
<hr>
<h3>2. <strong>Definované KPI a cíle kampaní</strong></h3>
<blockquote>
<p>Dohodnutá hlavní KPI: PNO, ROAS, CPA, objem objednávek, tržby.</p>
</blockquote>
<p><strong>→ Bez cílů nelze nastavit správnou strukturu kampaní ani optimalizaci.</strong></p>
<hr>
<h3>3. <strong>Rozpočet a produktové priority</strong></h3>
<blockquote>
<p>Rozdělení rozpočtu mezi Meta a PPC kanály.</p>
<p>Výběr TOP produktů a prioritních kategorií pro propagaci.</p>
</blockquote>
<p><strong>→ Rozpočet + produktové priority = správné rozložení a strategie kampaní.</strong></p>
<hr>
<h3>4. <strong>Kreativy a schvalovací proces</strong></h3>
<blockquote>
<p>Jasně dohodnutý způsob schvalování kreativ (grafika, texty, videa).</p>
<p>Definované brandové standardy a tone of voice.</p>
</blockquote>
<p><strong>→ Musíme mít jasno, abychom neztráceli týdny čekáním na schválení.</strong></p>
<hr>
<h3>5. <strong>Reporting a reálná data z e-shopu</strong></h3>
<blockquote>
<p>Všechna data (Meta, Google Ads, Sklik, GA4) napojená do Looker Studia.</p>
<p>Zajištěný přístup k reálným číslům z e-shopu:</p>
<ul>
<li><strong>Shoptet</strong> → automatické propojení.</li>
<li><strong>Custom e-shop</strong> → klient musí posílat čísla nebo zajistit přístup do administrace.</li>
</ul>
</blockquote>
<p><strong>→ Potřebujeme vidět celý výkonnostní ekosystém, ne jen reklamní data.</strong></p>
<hr>
<h2><strong>1️⃣ Cíl služby a odpovědnosti</strong></h2>
<h3><strong>🎯 Cíl úvodního nastavení</strong></h3>
<ul>
<li><strong>Technicky správně připravit</strong> Meta Business Manager, Google Ads, Sklik a Merchant Center.</li>
<li><strong>Zajistit kompletní měření konverzí</strong> (GA4, Pixel/CAPI, Google Ads, Sklik).</li>
<li><strong>Definovat správnou strukturu kampaní</strong> (Meta Ads, Google Ads, Sklik) dle cílů a rozpočtu.</li>
<li><strong>Plánovat a zadávat kreativní podklady</strong> podle výkonu kampaní (bannery, videa, texty).</li>
<li><strong>Zajistit reporting a analytiku</strong> napříč všemi marketingovými kanály (Looker Studio).</li>
</ul>
<h3><strong>🧑‍💻 Odpovědnost za úvodní nastavení</strong></h3>
<ul>
<li><strong>Meta Ads specialista &amp; Consultant</strong><ul>
<li>Nastavení kampaní v Meta (strukturace účtu, strategie).</li>
<li>Komunikace s klientem ohledně cílů a priorit.</li>
</ul>
</li>
<li><strong>PPC specialista</strong><ul>
<li>Nastavení účtů v Google Ads, Sklik, Merchant Center.</li>
<li>Implementace konverzních kódů, strategie kampaní (Search, PMax, remarketing).</li>
</ul>
</li>
<li><strong>Analytik (pokud je potřeba)</strong><ul>
<li>Ověření měření, propojení GA4, Looker Studia a vyhodnocování dat.</li>
</ul>
</li>
</ul>
<p><strong>Výstup:</strong></p>
<p>Po dokončení tohoto procesu má klient <strong>plně připravené reklamní účty</strong> (Meta + PPC), funkční analytiku a <strong>nastavenou strategii</strong> pro obě platformy.</p>
<hr>
<h2><strong>2️⃣ Úvodní call a sběr dat od klienta</strong></h2>
<ul>
<li><strong>Účel:</strong> Získat od klienta klíčové informace pro <strong>správné nastavení Meta Ads i PPC kampaní</strong> a očekávání spolupráce.</li>
<li><strong>Délka:</strong> cca 60 minut</li>
<li><strong>Účastníci:</strong> Projektový manažer, Meta Ads specialista, PPC specialista (dle dohody), klient</li>
</ul>
<h3>Otázky na Onboarding call</h3>
<blockquote>
<p>Cíl onboarding callu:</p>
<p>Získat všechny klíčové informace pro vytvoření strategie, která klientovi co nejrychleji vydělá více peněz díky výkonnostní reklamě.</p>
<p>Neřešíme kosmetiku. Řešíme růst tržeb, zisku a reálných výsledků.</p>
</blockquote>
<p>Projdi si s klientem tento formulář a na callu ho spolu vyplňte:</p>
<hr>
<h2><strong>3️⃣ Audit a nastavení účtu</strong></h2>
<h3><strong>1) Audit Meta Business Manageru</strong></h3>
<p><strong>Cíl:</strong> Zajistit funkčnost BM pro reklamy.</p>
<ul>
<li>Nechat se přidat jako admina do BM klienta provést audit</li>
<li>Kontrola přidělení stránek (FB, IG) k BM, reklamních účtů, katalogů, dvoufázové ověření.</li>
<li>Přiřazení agentury do BM + řešení případného nasazení CAPI (pokud e-shop podporuje).</li>
</ul>
<p><strong>Výstup:</strong></p>
<ul>
<li><strong>BM připraven</strong> na správu reklam (pixel + katalog v pořádku).</li>
</ul>
<h3><strong>2) Audit GA4 a měření výkonu</strong></h3>
<p><strong>Cíl:</strong> Ověřit, že <strong>GA4 správně měří klíčové konverze</strong>.</p>
<ul>
<li>Zda je funkční měření nákupů, ATC, atd.</li>
<li>Porovnat data z GA4 a e-shopu kvůli odchylce.</li>
</ul>
<p><strong>Výstup:</strong></p>
<ul>
<li>GA4 měří správně a je možné jej použít pro Meta i Google Ads / Sklik.</li>
</ul>
<h3><strong>3) Audit Google Ads, Sklik a Merchant Center</strong></h3>
<p><strong>Cíl:</strong> Zajistit, že <strong>PPC účty</strong> jsou nastaveny, mají funkční měření a jsou propojeny s e-shopem.</p>
<ul>
<li><strong>Merchant Center</strong>: Ověřit feed, stav produktů, propojení s Google Ads.</li>
<li><strong>Google Ads</strong>: Zkontrolovat fakturační údaje, propojení s GA4, konverzní tagy.</li>
<li><strong>Sklik</strong>: Přidat konverzní kód (Sklik Pixel), ověřit přístupy a funkčnost.</li>
</ul>
<p><strong>Výstup:</strong></p>
<ul>
<li><strong>Google Ads a Sklik</strong> mají funkční měření, feed je v pořádku (žádné zamítnuté produkty), vše připraveno ke spuštění kampaní.</li>
</ul>
<hr>
<h2><strong>4️⃣ Kreativa: Plánování a nasazování nových reklam</strong></h2>
<ul>
<li>Máme odpovědnost udržet <strong>aktuální a kvalitní kreativy</strong> (bannery, videa, texty) jak pro Meta, tak i <strong>pro Display/Remarketing v Google Ads a Sklik</strong>.</li>
<li>Podle potřeby je zpracovává interní kreativní tým nebo tým klienta.</li>
</ul>
<p><strong>Postup zadání grafiky:</strong></p>
<p><a href="Postup%20zad%C3%A1n%C3%AD%20grafiky%20-%20banner%C5%AF%20+%20vide%C3%AD%20(Creative%20%20c5bb5fd3b523425a890c5e31c8a8042a.md">Postup zadání grafiky - bannerů + videí (Creative Boost)</a></p>
<hr>
<h2><strong>5️⃣ Nastavení prvních kampaní</strong></h2>
<h3><strong>1) Klíčové principy</strong></h3>
<ul>
<li><strong>Méně je více</strong>: Pro začátek držíme co nejjednodušší strukturu.</li>
<li><strong>Nezasahovat do funkčních kampaní</strong>: Pokud klient již má něco, co přináší výsledky, nejdříve otestujeme nové nastavení bokem.</li>
<li><strong>Správná segmentace</strong>: Akvizice vs. Remarketing (Meta: Advantage+ / DRTG, Google: PMax / Search, Sklik: Vyhledávací / DPA).</li>
</ul>
<h3><strong>2) Doporučená základní struktura kampaní</strong></h3>
<h3><strong>Meta Ads</strong></h3>
<ol>
<li><strong>Akviziční kampaň</strong> (Advantage+ katalogovka, pokud 100+ produktů).</li>
<li><strong>Dynamický remarketing (DRTG)</strong> – návštěvníci webu.</li>
<li><strong>Flash akce</strong> (časově omezené promo), zvláštní kampaň.</li>
</ol>
<h3><strong>Google Ads</strong></h3>
<ol>
<li><strong>Performance Max (Shopping)</strong> – pro e-shop s validním feedem.</li>
<li><strong>Search</strong> (Brand + obecná klíčová slova).</li>
<li><strong>Remarketing</strong> (Display, dynamické bannery).</li>
</ol>
<h3><strong>Sklik</strong></h3>
<ol>
<li><strong>Vyhledávací kampaň</strong> (brand + obecné dotazy).</li>
<li><strong>Dynamické produktové reklamy (DPA)</strong> v obsahové síti Seznamu.</li>
<li><strong>Retargeting</strong> (návštěvníci webu, košíku).</li>
</ol>
<p><strong>Výstup</strong>:</p>
<ul>
<li>Všechny kampaně jsou nastaveny v testovací verzi a připraveny ke spuštění.</li>
<li><strong>Před spuštěním</strong> vždy odsouhlasit (pokud to klient vyžaduje).</li>
</ul>
<hr>
<h2><strong>6️⃣ Nastavení reportingu a Looker Studio šablony</strong></h2>
<p><strong>Cíl:</strong></p>
<ul>
<li><strong>Vytvořit přehledný reporting</strong> napříč Meta Ads, Google Ads, Sklik + GA4 a e-shopem.</li>
<li><strong>Napojit</strong> relevantní data (rozpočty, konverze, tržby).</li>
<li>Zajistit, že klient <strong>vidí výkon všech kanálů</strong> na jednom místě.</li>
</ul>
<ol>
<li><strong>Data pro Looker Studio</strong><ul>
<li><strong>Meta Ads</strong>, Google Ads a Sklik skrz konektory (nebo ruční import).</li>
<li><strong>GA4</strong> a e-shop administrace (pokud lze).</li>
</ul>
</li>
<li><strong>Předpřipravená e-commerce šablona</strong><ul>
<li>Vidíme <strong>PNO, ROAS, CPA, CPC, CTR, konverze</strong> z různých zdrojů.</li>
<li>Analytik (pokud je potřeba) doladí detailní nastavení.</li>
</ul>
</li>
<li><strong>Reporting pro klienta</strong><ul>
<li>Klient obdrží <strong>odkaz + přístupy</strong>.</li>
<li>Každý měsíc <strong>Loom video</strong> nebo písemný výstup.</li>
</ul>
</li>
</ol>
<hr>
<h2><strong>7️⃣ 📩 Informování klienta o dokončení nastavení</strong></h2>
<ul>
<li><strong>Po dokončení</strong> setupu (Meta Ads + PPC) zašleme krátké shrnutí (Freelo / e-mail):<ul>
<li>Co bylo <strong>nastaveno</strong>.</li>
<li>Jaké <strong>přístupy</strong> byly upraveny.</li>
<li>Katalog, Merchant Center (pokud relevantní).</li>
<li><strong>Struktura kampaní</strong> a jejich cíle.</li>
<li><strong>Způsob vyhodnocování výsledků</strong> (Looker Studio, GA4).</li>
</ul>
</li>
</ul>
<hr>
<h2><strong>Časový plán implementace (max. 10 pracovních dnů)</strong></h2>
<ol>
<li><strong>Den 1</strong> → Úvodní call s klientem.</li>
<li><strong>Den 2–3</strong> → Kontrola přístupů, audit Meta BM, GA4, Google Ads, Sklik.</li>
<li><strong>Den 4–5</strong> → Implementace měření, tvorba marketingových person.</li>
<li><strong>Den 6–7</strong> → Nastavení kampaní (Meta + PPC) a reklamních textací.</li>
<li><strong>Den 8–9</strong> → Finalizace, testování, příprava reportingu.</li>
<li><strong>Den 10</strong> → Informování klienta o provedených úpravách.</li>
</ol>
<h3><strong>Výstup</strong>:</h3>
<ul>
<li><strong>Plně nastavené účty</strong> (Meta, Google Ads, Sklik) včetně měření a reportingu.</li>
<li>Klient má <strong>jasnou informaci</strong> o všech provedených úpravách a dalším postupu.</li>
</ul>
<hr>
<blockquote>
<p>Tímto je úvodní nastavení pro službu Performance Boost (Meta Ads + PPC) dokončeno, klient může začít těžit z optimálně připravených kampaní a my se můžeme zaměřit na aktivní správu a další škálování výkonu.</p>
</blockquote>
<h1>📈 Průběžná správa Performance Boost (Meta Ads + PPC)</h1>
<p>Níže najdete <strong>zjednodušený „kompas pro řízení a prioritizaci úkolů“</strong> pro <strong>průběžnou správu</strong> služby <strong>Performance Boost (Meta + PPC)</strong>. Stejně jako u Socials Boost se i zde zaměřujeme na <strong>co nejvyšší tržby za co nejlepší PNO / ROAS</strong>, ale tentokrát napříč <strong>Meta Ads, Google Ads a Sklik</strong>.</p>
<hr>
<h2><strong>1️⃣ Úvod a cíl procesu</strong></h2>
<p>Tento SOP popisuje <strong>detailní postup pro průběžnou správu a optimalizaci Meta Ads, Google Ads a Sklik kampaní</strong> v rámci služby <strong>Performance Boost PRO</strong>.</p>
<h3><strong>Hlavní cíle průběžné správy:</strong></h3>
<ol>
<li><strong>Pravidelně sledovat a optimalizovat kampaně</strong> pro dosažení maximální návratnosti investic (ROAS, PNO, CPA).</li>
<li><strong>Flexibilně reagovat na tržní situaci</strong> (např. sezónnost, konkurenci, změny v chování zákazníků).</li>
<li><strong>Testovat nové strategie, kreativy i cílení</strong> pro neustálé zlepšování výsledků.</li>
<li><strong>Pravidelně analyzovat web klienta</strong> a navrhovat úpravy pro zlepšení konverzí.</li>
<li><strong>Transparentně reportovat</strong> veškeré aktivity a komunikovat s klientem.</li>
</ol>
<hr>
<h2><strong>2️⃣ Role a odpovědnosti</strong></h2>
<h3><strong>Meta Ads specialista</strong></h3>
<ul>
<li><strong>Denně</strong> sleduje a vyhodnocuje výkon Meta Ads kampaní (PNO, ROAS, CPA atd.).</li>
<li>Pravidelně je <strong>optimalizuje</strong> (škálování, vypínání neefektivních reklam).</li>
<li>Vytváří <strong>nové reklamy</strong> a testuje různé strategie (např. Advantage+ vs. manuální akvizice).</li>
<li><strong>1x měsíčně kontroluje katalog produktů</strong> (pokud jej klient používá) a řeší případné chyby či zamítnuté produkty.</li>
</ul>
<h3><strong>PPC specialista (Google Ads &amp; Sklik)</strong></h3>
<ul>
<li><strong>Denně</strong> (nebo dle potřeby) sleduje výkon kampaní v Google Ads a Skliku.</li>
<li>Pravidelně <strong>optimalizuje</strong> strukturu kampaní (Performance Max, Search, remarketing, Sklik DPA) a strategie nabídek (Max Conversions/ROAS).</li>
<li>Kontroluje stav <strong>produktového feedu</strong> (Google Merchant Center, Sklik feed), řeší zamítnuté či problematické produkty.</li>
<li>Každý měsíc navrhuje <strong>vylepšení klíčových slov</strong>, negativní vyhledávací dotazy a změny v kampaních na základě dat.</li>
</ul>
<h3><strong>Analytik (jen při problémech s reportingem)</strong></h3>
<ul>
<li>Řeší případné <strong>technické chyby v měření</strong> (GA4, konverzní kódy, Looker Studio).</li>
<li>Pomáhá, pokud je nutné <strong>dolaďovat data a reporty</strong>.</li>
</ul>
<hr>
<h2><strong>3️⃣ Pravidelná správa a optimalizace Meta Ads kampaní</strong></h2>
<h3><strong>3.1 Denní kontrola výkonu (Meta Ads specialista)</strong></h3>
<p><strong>Cíl</strong>: Ujistit se, že kampaně běží správně a že nedochází ke zbytečnému plýtvání rozpočtem.</p>
<p><strong>Kontrolní body</strong> (denně nebo obden):</p>
<ol>
<li><strong>Stav kampaní</strong>: nejsou zamítnuté, omezené rozpočtem, nebo v porušení zásad?</li>
<li><strong>Klíčové metriky</strong>: PNO, ROAS, CPA, CTR, CPC – zda se výrazně nemění oproti předchozím dnům.</li>
<li><strong>Výdaje</strong>: neproběhla příliš rychlá spotřeba rozpočtu nebo výrazná podfinancovanost?</li>
<li><strong>Výkyvy</strong>: prudký pokles konverzí, zvýšené CPC, cokoliv mimo normu.</li>
</ol>
<p><strong>Výstup</strong>:</p>
<ul>
<li>Kampaně jsou v pořádku, nedochází k plýtvání.</li>
<li>Případné problémy (např. zamítnuté reklamy) se <strong>ihned řeší</strong> a zaznamenají do Freela.</li>
</ul>
<hr>
<h3><strong>3.2 Týdenní / pravidelná optimalizace (Meta Ads specialista)</strong></h3>
<p><strong>Cíl</strong>: Zvyšovat efektivitu kampaní dlouhodobě, testovat a nasazovat novou kreativu.</p>
<p><strong>Hlavní činnosti</strong> (obvykle 1–2× týdně):</p>
<ol>
<li><strong>Vypínání neefektivních reklam</strong>: Reklamy, které nesplňují KPI, se vypínají nebo upravují (kreativa, textace).</li>
<li><strong>Škálování úspěšných sestav/kampaní</strong>: Postupné navyšování rozpočtu (~10–20 %) tam, kde je vysoký ROAS.</li>
<li><strong>Úprava cílení</strong>: Analýza výkonu cílových skupin (lookalike, remarketing, apod.).</li>
<li><strong>Testování kreativy</strong>: Nejdéle po 1–2 týdnech nasazujeme novou kreativu, pokud je k dispozici.</li>
<li><strong>Vyhodnocení testů</strong>: Pokud probíhají A/B testy (např. dvě různé strategie / odlišné texty), vítězné varianty zavádíme do praxe.</li>
</ol>
<p><strong>Výstup</strong>:</p>
<ul>
<li><strong>Průběžně vylepšené kampaně</strong> a vyšší návratnost investic.</li>
<li>Změny a testy jsou <strong>zapsány ve Freelu</strong> (kvůli přehledu i pro komunikaci s klientem).</li>
</ul>
<hr>
<h3><strong>3.3 Měsíční kontrola katalogu produktů (pokud využíváme DPA / Advantage+)</strong></h3>
<p><strong>Kontrola 1× měsíčně</strong>:</p>
<ol>
<li><strong>Zablokované produkty</strong>: Zjistit, zda Meta nějaké produkty neodmítá (neúplné informace, nevhodný obsah).</li>
<li><strong>Kvalita údajů</strong>: Název, popis, cena, obrázky – případné chyby řešit (Mergado, feed, e-shop).</li>
<li><strong>Správná synchronizace</strong>: Ověřit, že se nové produkty zobrazují ve feedu a vyřazené jsou skryté.</li>
</ol>
<p><strong>Výstup</strong>:</p>
<ul>
<li><strong>Aktuální katalog bez chyb</strong> a zamítnutých produktů, optimální funkčnost dynamického remarketingu.</li>
</ul>
<hr>
<h2><strong>4️⃣ Pravidelná správa a optimalizace Google Ads a Sklik kampaní</strong></h2>
<h3><strong>4.1 Pravidelná kontrola výkonu (PPC specialista)</strong></h3>
<p><strong>Cíl</strong>: Zajistit, aby všechny kampaně v Google Ads i Skliku běžely bez technických či rozpočtových omezení.</p>
<p><strong>Kontrolní body</strong> (denně / obden):</p>
<ol>
<li><strong>Stav kampaní a reklam</strong>: nejsou zamítnuté či omezené rozpočtem, platí i pro Shopping / PMax / Sklik DPA.</li>
<li><strong>Klíčové metriky</strong>: ROAS, CPA, CTR, CPC, Impression Share.</li>
<li><strong>Rozpočty</strong>: Nejsou kampaně výrazně podfinancované nebo naopak?</li>
<li><strong>Reklamy/produkty schválené?</strong>: V Merchant Centeru ani v Sklik feedu nejsou produkty zamítnuté?</li>
</ol>
<p><strong>Výstup</strong>:</p>
<ul>
<li>Kampaně jsou <strong>aktivní a funkční</strong>, případné potíže se ihned řeší (zapsány ve Freelu).</li>
</ul>
<hr>
<h3><strong>4.2 Týdenní / pravidelná optimalizace kampaní (PPC specialista)</strong></h3>
<p><strong>Cíl</strong>: Dlouhodobě zvyšovat efektivitu a testovat nové přístupy.</p>
<p><strong>Hlavní činnosti</strong> (1–2× týdně):</p>
<ol>
<li><strong>Vypínání neefektivních reklam / sestav</strong>: Sledujeme KPI (CPA, ROAS), co nejde pod požadovaný výkon, vypneme nebo upravíme.</li>
<li><strong>Škálování</strong>: Navyšování rozpočtu u kampaní s nadprůměrným výkonem (PMax, Search, Sklik DPA).</li>
<li><strong>Úprava strategií nabídek</strong>: Max Conversions, Target ROAS / CPA. Prověřujeme, zda strategie fungují dle očekávání.</li>
<li><strong>Analýza vyhledávacích dotazů</strong>: Přidávání negativních slov, přidávání nových KW.</li>
<li><strong>Testování nových inzerátů a rozšíření</strong>: Bannery, texty, popisky, odkazy na podstránky (sitelinks).</li>
<li><strong>Vyhodnocení A/B testů</strong>: Pokud probíhají experimenty (např. různé landing pages), implementujeme vítěznou variantu.</li>
</ol>
<p><strong>Výstup</strong>:</p>
<ul>
<li><strong>Optimalizované kampaně</strong> (výkon ↑, zbytečné náklady ↓).</li>
<li>Postupné navyšování objemu konverzí při zachování požadované rentability.</li>
</ul>
<hr>
<h3><strong>4.3 Měsíční kontrola produktového feedu (GMC / Sklik)</strong></h3>
<p><strong>Kontrola 1× měsíčně</strong>:</p>
<ol>
<li><strong>Stav produktů v GMC a Skliku</strong>: Žádné zamítnuté produkty? Nejsou chyby (chybějící atributy)?</li>
<li><strong>Aktualizace feedu</strong>: Ceny, dostupnost, obrázky. Vše musí být v souladu s e-shopem.</li>
<li><strong>Odstranění neefektivních produktů</strong>: Pokud dlouhodobě generují vysoké náklady bez výsledku, můžeme je v kampaních omezit.</li>
<li><strong>Řešení chyb</strong>: Pokud feed obsahuje problémy, řeší to PPC specialista (přes Mergado nebo jiný nástroj), popř. s e-shopem.</li>
</ol>
<p><strong>Výstup</strong>:</p>
<ul>
<li><strong>Validní a aktuální produktový feed</strong> pro Google Ads i Sklik, bez zamítnutých produktů.</li>
<li>Zapsání úprav do Freela (informace pro klienta / interní tým).</li>
</ul>
<hr>
<h2><strong>5️⃣ Měsíční analýza webu klienta a návrhy inovací (PM / konzultant)</strong></h2>
<ol>
<li><strong>Analýza webu</strong>: Pravidelně projít e-shop, ověřit UX, viditelnost klíčových produktů, funkčnost košíku.</li>
<li><strong>Identifikace bariér</strong>: Pomalé načítání stránek, nejasné popisky, chybějící recenze, atd.</li>
<li><strong>Doporučení pro zvýšení konverzí</strong>: Dárky k nákupu, časově omezené akce, pop-upy, vylepšení popisků.</li>
<li><strong>Zápis do Freela</strong> a předání klientovi – včetně prioritizace “rychlé winy” vs. větší úpravy.</li>
</ol>
<p><strong>Výstup</strong>:</p>
<ul>
<li><strong>Seznam doporučení</strong>, který je zohledněn v měsíčním reportu.</li>
<li>Vyšší spokojenost návštěvníků a lepší konverzní poměr, pokud klient navržené úpravy zrealizuje.</li>
</ul>
<hr>
<h2><strong>6️⃣ Reporting a komunikace s klientem</strong></h2>
<h3><strong>6.1 Měsíční reporting (Loom video + Freelo)</strong></h3>
<ul>
<li><strong>Meta Ads specialista</strong> natočí <strong>stručné video</strong> (10–15 minut) s komentářem k výkonu Meta kampaní, provedeným změnám a navrženým dalším krokům.</li>
<li><strong>PPC specialista</strong> (Google Ads &amp; Sklik) připojí buď samostatné video, nebo doplní komentář ve stejném videu, kde zhodnotí kampaně a navrhne optimalizace.</li>
<li><strong>Projektový manažer / konzultant</strong> shrne doporučení ze <strong>sekce webové analýzy</strong>.</li>
<li>Vše se nahraje do <strong>Freela</strong> → klientovi se pošle odkaz na Loom a krátký textový briefing.</li>
</ul>
<h3><strong>6.2 Pravidelné konzultace / cally</strong></h3>
<ul>
<li>Podle potřeby si s klientem <strong>domluvíme call</strong> (Google Meet / Zoom), abychom probrali strategičtější změny (např. větší škálování, novou sezónu, rebranding atd.).</li>
<li>Cally nejsou nutné každý měsíc, záleží na domluvě s klientem a aktuálním vývoji kampaní.</li>
</ul>
<p><strong>Výstup</strong>:</p>
<ul>
<li>Klient má každý měsíc <strong>jasný přehled</strong> o výsledcích (Meta Ads + PPC), provedených krocích a dalších doporučeních.</li>
<li>Otevřená a <strong>transparentní komunikace</strong> → klient ví, co se v kampaních děje a proč.</li>
</ul>
<hr>
<h1><strong>Závěrečné shrnutí průběžné správy</strong></h1>
<ol>
<li><strong>Denní/týdenní kontroly</strong> zajišťují rychlou reakci na výkyvy a potíže.</li>
<li><strong>Pravidelné optimalizace</strong> (min. 1–2× týdně) drží kampaně v top výkonu.</li>
<li><strong>Měsíční kontroly</strong> katalogů a feedů zabraňují chybám v propagaci produktů.</li>
<li><strong>Měsíční analýza webu</strong> pomáhá nacházet další příležitosti pro zvýšení prodejů.</li>
<li><strong>Transparentní reporting</strong> (Loom video, Freelo) drží klienta v obraze a umožňuje společné plánování kroků vpřed.</li>
</ol>
<blockquote>
<p>Díky tomuto postupu dokážeme kampaně udržovat dlouhodobě ziskové a škálovatelné, klient získává jasný přehled o investicích a výkonech, a my máme systém pro efektivní práci s daty.</p>
</blockquote>
<h1>💰 Rozsah služby dle balíčků</h1>
<p>Každý e-shop má jiné potřeby a jinou velikost reklamního rozpočtu. Proto nabízíme <strong>tři úrovně služeb</strong>, které odpovídají výši spendu do reklamy a poskytují adekvátní podporu pro růst vašeho e-shopu.</p>
<p><strong>Jak to funguje?</strong></p>
<ul>
<li>Klient si vybírá <strong>jeden z balíčků</strong> na základě svého měsíčního rozpočtu na reklamu.</li>
<li>Každý balíček obsahuje <strong>předem definovaný rozsah služeb</strong>, který zajišťuje optimální řízení a růst kampaní.</li>
<li>Čím vyšší je balíček, tím <strong>intenzivnější</strong> je správa kampaní a strategická podpora.</li>
</ul>
<p>Díky tomuto modelu dostáváte službu přizpůsobenou vaší investici do reklamy a maximalizujeme efektivitu správy kampaní. 🚀</p>
<h3><strong>Balíček GROWTH (rozpočet cca do 400 000 Kč / měsíc)</strong></h3>
<ul>
<li><strong>Co zahrnuje (cca):</strong><ul>
<li>Denní kontrola kampaní.</li>
<li>Optimalizace kampaní 1–2x týdně.</li>
<li>Tvorba nových reklam 1-2x týdně</li>
<li>Projektové řízení</li>
<li>Měsíční reporting formou videa nebo textového souhrnu.</li>
<li>Přístup do Looker Studio reportu 24/7.</li>
<li>Možnost pravidelného telefonátu pro strategické plánování.</li>
</ul>
</li>
</ul>
<p><em>Uvedený rozsah služeb se může lišit na základě sezónnosti, rozpočtu a aktuálních potřeb vašeho e-shopu.</em></p>
<hr>
<h3><strong>Balíček PRO (rozpočet cca 400 001–800 000 Kč / měsíc)</strong></h3>
<ul>
<li><strong>Co zahrnuje (cca):</strong><ul>
<li>Denní kontrola kampaní.</li>
<li>Optimalizace kampaní 2–3x týdně.</li>
<li>Tvorba nových reklam 2-3x týdně</li>
<li>Projektové řízení</li>
<li>Měsíční reporting formou videa nebo textového souhrnu.</li>
<li>Přístup do Looker Studio reportu 24/7.</li>
<li>Možnost pravidelného telefonátu pro strategické plánování.</li>
</ul>
</li>
</ul>
<p><em>Uvedený rozsah služeb se může lišit na základě sezónnosti, rozpočtu a aktuálních potřeb vašeho e-shopu.</em></p>
<hr>
<h3><strong>Balíček EXPERT (rozpočet nad 800 000 Kč / měsíc)</strong></h3>
<ul>
<li><strong>Co zahrnuje (cca):</strong><ul>
<li>Denní kontrola kampaní.</li>
<li>Optimalizace kampaní 3–4x týdně.</li>
<li>Tvorba nových reklam 2-3x týdně</li>
<li>Projektové řízení</li>
<li>Měsíční reporting formou videa nebo textového souhrnu.</li>
<li>Přístup do Looker Studio reportu 24/7.</li>
<li>Možnost pravidelného telefonátu pro strategické plánování.</li>
</ul>
</li>
</ul>
<p><em>Uvedený rozsah služeb se může lišit na základě sezónnosti, rozpočtu a aktuálních potřeb vašeho e-shopu.</em></p>
<h1><strong>❓</strong> <strong>Často kladené otázky</strong>  FAQ</h1>
<h3><strong>🔹 Co když klient pravidelně přesahuje svůj balíček?</strong></h3>
<p>Pokud klient dlouhodobě využívá služby nad rámec svého balíčku (např. jeho rozpočet na reklamu je vyšší než limit balíčku, nebo požaduje více optimalizací a kreativy, než je standardní rozsah), je potřeba s ním situaci komunikovat:</p>
<ol>
<li><strong>Průběžně sleduj rozsah práce</strong> – pokud se jedná o jednorázové navýšení (například v sezóně), není nutné okamžitě balíček měnit.</li>
<li><strong>Pokud se to děje opakovaně</strong>, je nutné klienta informovat o tom, že jeho požadavky již nespadají do stávajícího balíčku a doporučit <strong>navýšení na vyšší úroveň služby</strong>.</li>
<li><strong>Vysvětli výhody vyššího balíčku</strong> – klient získá častější optimalizace, více nových reklam a intenzivnější podporu.</li>
<li><strong>Pokud klient s navýšením nesouhlasí</strong>, je nutné jasně definovat, jaké služby v rámci současného balíčku dostává, a případné dodatečné požadavky účtovat jako vícepráce dle hodinové sazby.</li>
</ol>
<p>📌 <strong>Důležité:</strong> Situaci vždy řešit předem, aby se předešlo nedorozumění a nevznikaly neuhrazené vícepráce.</p>
<hr>
<h3><strong>🔹 Jak často se kontrolují kampaně v jednotlivých balíčcích?</strong></h3>
<p>Každý balíček má <strong>předem definovanou frekvenci optimalizací</strong>:</p>
<ul>
<li><strong>GROWTH:</strong> 1–2x týdně</li>
<li><strong>PRO:</strong> 2–3x týdně</li>
<li><strong>EXPERT:</strong> 3–4x týdně</li>
</ul>
<p>Tento harmonogram odpovídá velikosti rozpočtu a umožňuje maximální efektivitu kampaní. Pokud klient požaduje častější úpravy nebo urgentní zásahy mimo tento rámec, řeší se to jako <strong>vícepráce</strong>.</p>
<hr>
<h3><strong>🔹 Jak často dostává klient nové reklamy a kreativy?</strong></h3>
<p>Počet nových reklam (bannery, videa, texty) odpovídá úrovni balíčku:</p>
<ul>
<li><strong>GROWTH:</strong> 1x týdně</li>
<li><strong>PRO:</strong> 2x týdně</li>
<li><strong>EXPERT:</strong> 3x týdně</li>
</ul>
<p>Pokud klient potřebuje více kreativy, než kolik zahrnuje jeho balíček, můžeme je dodat v rámci služby <strong>Creative Boost</strong> nebo účtovat jako vícepráce dle hodinové sazby.</p>
<hr>
<h3><strong>🔹 Jak se rozděluje rozpočet mezi Meta Ads a PPC (Google Ads, Sklik)?</strong></h3>
<p>Rozdělení rozpočtu mezi jednotlivé kanály se řídí několika faktory:</p>
<ol>
<li><strong>Historická data klienta</strong> – Pokud některý z kanálů historicky přináší lepší výsledky (nižší CPA, vyšší ROAS), dostává větší podíl rozpočtu.</li>
<li><strong>Fáze spolupráce</strong> – Na začátku spolupráce testujeme oba kanály a zjišťujeme, kde má klient největší potenciál.</li>
<li><strong>Sezónní strategie</strong> – Například během svátků může Google Shopping (PMax) mít vyšší návratnost, zatímco v jiném období může lépe fungovat Meta Ads.</li>
<li><strong>Dohoda s klientem</strong> – Někteří klienti mají preferenci pro konkrétní kanál, což bereme v úvahu.</li>
</ol>
<p>📌 <strong>Standardní poměr</strong> v případě nejasné dominance jednoho kanálu: <strong>60 % Google Ads + Sklik / 40 % Meta Ads</strong>. Tento poměr ale může být individuálně upraven podle výsledků a strategie.</p>
<hr>
<h3><strong>🔹 Co když klient očekává jiné KPI, než je reálně dosažitelné?</strong></h3>
<p>V rámci úvodního callu s klientem vždy nastavujeme <strong>reálná očekávání</strong> na základě dat a našich zkušeností. Pokud klient očekává extrémně nízké CPA nebo vysoké ROAS, je důležité:</p>
<ol>
<li><strong>Vysvětlit, na jakých metrikách bude kampaň reálně vyhodnocována</strong>.</li>
<li><strong>Ukázat mu historická data podobných projektů</strong>, aby měl lepší představu o dosažitelných výsledcích.</li>
<li><strong>Pokud se KPI nepodaří splnit</strong>, analyzovat důvody (např. konkurence, nabídka, ceny produktů) a navrhnout změny v kampaních nebo strategii.</li>
</ol>
<p>📌 <strong>Důležité:</strong> KPI musí být vždy realistická a vyhodnocovaná v kontextu celého marketingového mixu, ne jen jednoho kanálu.</p>
<hr>
<h3><strong>🔹 Jak probíhá reporting a komunikace s klientem?</strong></h3>
<p>Každý měsíc klient dostává <strong>video-report</strong> přes Loom s přehledem výsledků a návrhy na optimalizaci. Zároveň má <strong>nonstop přístup k Looker Studio reportu</strong>, kde vidí aktuální data.</p>
<p>Pokud klient vyžaduje častější aktualizace nebo strategické konzultace nad rámec balíčku, řešíme to individuálně formou víceprací nebo doporučíme vyšší balíček, který již zahrnuje pravidelné strategické cally.</p>
<hr>
<h3><strong>🔹 Co když klient chce úpravy kampaní mimo standardní pracovní dobu?</strong></h3>
<p>Standardní správa kampaní probíhá <strong>v pracovní dny</strong>. Pokud klient vyžaduje urgentní úpravy večer, o víkendech nebo během svátků, řeší se to jako <strong>expresní služba</strong>, která je účtována jako vícepráce s příplatkem za urgentní zpracování.</p>
<p>📌 <strong>Doporučení:</strong> Pokud klient často potřebuje rychlé úpravy mimo pracovní dobu, lze mu nabídnout SLA s garantovanou rychlostí reakce.</p>
<hr>
<h3><strong>🔹 Co když klient nedodá potřebné podklady nebo přístupy?</strong></h3>
<p>Bez přístupu k Business Manageru, analytickým nástrojům a podkladům pro reklamy není možné kampaně efektivně spravovat.</p>
<ol>
<li><strong>Pokud klient nedodá podklady</strong>, informujeme ho o tom e-mailem a ve Freelu.</li>
<li><strong>Po 7 dnech bez reakce</strong> posíláme <strong>poslední výzvu</strong> a upozornění, že bez podkladů se spolupráce pozastaví.</li>
<li><strong>Pokud ani poté klient nereaguje</strong>, práce na kampaních se pozastaví do doby, než budou podklady dodány.</li>
</ol>
<p>📌 <strong>Tip:</strong> Pokud se jedná o častý problém, doporučujeme s klientem nastavit <strong>jasný harmonogram dodání podkladů</strong> v úvodním callu.</p>
<hr>
<h3><strong>🔹 Jaké nástroje používáme pro správu kampaní a reporting?</strong></h3>
<p>Pro správu a optimalizaci kampaní využíváme:</p>
<ul>
<li><strong>Meta Business Manager</strong> – správa kampaní.</li>
<li><strong>Google Ads &amp; Sklik</strong> – PPC kampaně.</li>
<li><strong>Google Looker Studio</strong> – přehledný reporting pro klienty.</li>
<li><strong>GA4 + CRM data</strong> – pokročilá analytika.</li>
<li><strong>Freelo</strong> – interní projektové řízení.</li>
<li><strong>Loom</strong> – měsíční video-reporty.</li>
</ul>
<p>📌 <strong>Díky těmto nástrojům má klient neustálý přehled o výkonu kampaní a jejich dopadu na e-shop.</strong></p>
',
'🎯 Cíl služby Performance Boost Hlavním cílem služby Performance Boost je jednoduchý: Vydělat klientovi peníze. --Nejdůležitější otázka při každém rozhodování zní: 👉 "Pomůže tento krok klientovi zvýšit tržby, zisk nebo návratnost investice?" Pokud odpověď není jasné ano, pak: Krok upravit tak, aby přinášel reálnou hodnotu. Nebo ho vůbec nedělat. 🧭 Jak se podle toho rozhodujeme v praxi: Neoptimalizujeme pro hezčí čísla v reportu, ale pro více peněz na účtu klienta. Neřešíme zbytečnosti, které nemají reálný dopad na výkon. Soustředíme se na akce, které klientovi vydělávají (škálování funkčních kampaní, nové prodejní kreativy, zlepšení nabídky). Prioritou je výkon, ne perfekcionismus. --📌 Zapamatuj si: Performance Boost = Výsledky. Peníze. Růst. Ne "kampaně pro kampaně", ale reálný byznysový efekt pro klienta. 🚀 Kompas pro řízení kampaní a prioritizaci úkolů Naším hlavním úkolem je zajistit, že každá investovaná koruna do placené reklamy (Meta Ads, Google Ads, Sklik) přináší maximální hodnotu – tedy nejvyšší možné tržby za nejlepší možný ROAS / PNO / CPA. Co to znamená v praxi? ✅ Soustředit se na výkonnost Každé rozhodnutí (škálování, úpravy, testování nových kreativit nebo klíčových slov) musí mít jasný cíl: zlepšit výsledky a zvýšit tržby klienta. Nesnižovat se k úpravám „pro úpravy“ – vždy chceme reálně zvýšit výkon. ✅ Nedělat změny bez přidané hodnoty Pokud v Meta Ads, Google Ads nebo Skliku nevidíš reálný přínos (lepší ROAS, více objednávek…), neplýtvej časem ani rozpočtem. ✅ Zaměřit se na to, co funguje Když určité kampaně nebo produkty stabilně přinášejí výsledky, snaž se je škálovat a zdokonalovat. Nepřekombinovávat úspěšné kampaně mikromanagementem – zbytečně by se ztrácel výkon. ✅ Neustále testovat a inovovat Kreativita a testování jsou hnacím motorem růstu, ale musí být datově a výkonnostně podložené. Ověřuj hypotézy (A/B testy), používej malé experimenty v obou platformách (Meta + PPC). ✅ Správně vyhodnocovat kampaně Výkon Meta Ads, Google Ads a Skliku analyzuj v kontextu celého marketingového mixu (SEO, e-mailing, direct traffic…). Pokud vidíš růst nákladů, ale neodpovídá mu růst tržeb, hledej příčinu (landing page, feed, konkurence…). ✅ Pracovat s nabídkou a produktem I nejlépe nastavené kampaně nedokážou uspět, pokud je nabídka slabá nebo je problém v UX e-shopu (pomalu se načítá, nedůvěryhodně působí…). Aktivně navrhuj klientovi úpravy produktu / nabídky, když kampaně nenesou očekávané výsledky. Hlavní otázka při každém rozhodnutí: „Bude tahle změna / úprava / test reálně zvyšovat tržby a pomáhat k lepšímu ROAS / PNO?“ Pokud ne, zaměř se raději na aktivity, které mají potenciál reálně posunout výkon v Meta Ads, Google Ads nebo Skliku. ⚙️ Úvodní nastavení (Setup) služby Performance Boost (Meta Ads + PPC) Tato část popisuje všechny kroky potřebné pro úvodní nastavení kampaní tak, aby byla služba Socials Boost správně spuštěna a efektivně fungovala v kanálech Meta Ads a PPC (Google Ads, Sklik). --🚀 5 Klíčových bodů pro Start služby Performance Boost Cíl fáze: Zajistit kompletní technické prostředí, jasnou strategii a připravené kampaně pro rychlé škálování výkonu. --Přístupy a funkční měření Přístupy: Meta Business Manager, Google Ads, Sklik, Merchant Center, GA4, e-shop administrace. Měření: Meta Pixel + CAPI, GA4 eventy, Google Ads tagy, Sklik konverzní kód. → Bez kompletních přístupů a ověřeného měření kampaň nespustíme. Absolutní priorita. --Definované KPI a cíle kampaní Dohodnutá hlavní KPI: PNO, ROAS, CPA, objem objednávek, tržby. → Bez cílů nelze nastavit správnou strukturu kampaní ani optimalizaci. --Rozpočet a produktové priority Rozdělení rozpočtu mezi Meta a PPC kanály. Výběr TOP produktů a prioritních kategorií pro propagaci. → Rozpočet + produktové priority = správné rozložení a strategie kampaní. --Kreativy a schvalovací proces Jasně dohodnutý způsob schvalování kreativ (grafika, texty, videa). Definované brandové standardy a tone of voice. → Musíme mít jasno, abychom neztráceli týdny čekáním na schválení. --Reporting a reálná data z e-shopu Všechna data (Meta, Google Ads, Sklik, GA4) napojená do Looker Studia. Zajištěný přístup k reálným číslům z e-shopu: Shoptet → automatické propojení. Custom e-shop → klient musí posílat čísla nebo zajistit přístup do administrace. → Potřebujeme vidět celý výkonnostní ekosystém, ne jen reklamní data. --1️⃣ Cíl služby a odpovědnosti 🎯 Cíl úvodního nastavení Technicky správně připravit Meta Business Manager, Google Ads, Sklik a Merchant Center. Zajistit kompletní měření konverzí (GA4, Pixel/CAPI, Google Ads, Sklik). Definovat správnou strukturu kampaní (Meta Ads, Google Ads, Sklik) dle cílů a rozpočtu. Plánovat a zadávat kreativní podklady podle výkonu kampaní (bannery, videa, texty). Zajistit reporting a analytiku napříč všemi marketingovými kanály (Looker Studio). 🧑‍💻 Odpovědnost za úvodní nastavení Meta Ads specialista & Consultant Nastavení kampaní v Meta (strukturace účtu, strategie). Komunikace s klientem ohledně cílů a priorit. PPC sp',
6,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'd2ef660f-1e62-4df0-ab3b-13980ebdf7bf',
'11111111-1111-1111-1111-111111111110',
'Doručení služby Video Boost: Tvorba prodejních videí do Meta Ads / TikTok Ads',
'<p>Tento SOP popisuje, <strong>jak má projekťák zadávat tvorbu výkonnostních videí</strong> pro klienty v rámci služby <strong>Video Boost / Creative Boost</strong>.</p>
<p>Cílem je, aby:</p>
<ul>
<li>každé video mělo <strong>jasný účel, strukturu a prodejní message</strong>,</li>
<li>vznikalo <strong>na základě schváleného scénáře (voiceover + hooky)</strong>,</li>
<li>videoeditor vždy dostal <strong>kompletní a přehledné zadání</strong> bez dohledávání ve Freelu nebo e-mailech,</li>
<li>videa byla <strong>optimalizovaná na výkon (konverze)</strong> pro Meta Ads a TikTok – ne brandové spoty.</li>
</ul>
<p>👉 Tento SOP je <strong>závazný</strong> pro všechny projekťáky u jakékoliv zakázky na tvorbu videí.</p>
<h3>1) Domluva s klientem – účel a rámec videa</h3>
<p>Projekťák si nejdřív s klientem ujasní:</p>
<ol>
<li><strong>Co se komunikuje</strong><ul>
<li>sleva / akce / dárek / novinka / produktový benefit / retence…</li>
<li>účel videa: akvizice / remarketing / podpora konkrétní kampaně / launch</li>
</ul>
</li>
<li><strong>Produkty / URL</strong><ul>
<li>konkrétní produkty/služby + <strong>URL</strong>, které budou ve videu</li>
<li>případně hlavní produkt vs. doplňkové</li>
</ul>
</li>
<li><strong>Tone &amp; brand</strong><ul>
<li>styl: zábavné / seriózní / prémiové / “low cost &amp; simple” apod.</li>
<li>co má být hlavní message / benefit</li>
</ul>
</li>
</ol>
<p>👉 Výstup: krátké shrnutí v bodech – slouží jako vstup pro GPT asistenta.</p>
<hr>
<h3>2) GPT asistent – VOICEOVER &amp; CREATIVE (povinný krok)</h3>
<p>Projekťák použije <strong>GPT asistenta pro přípravu voiceoveru a hooků</strong></p>
<p><em>(dummy link:</em> <a href="https://chatgpt.com/g/g-69328d5afce08191b0238643b5925227-video-boost-tvorba-prodejnich-videi">https://chatgpt.com/g/g-69328d5afce08191b0238643b5925227-video-boost-tvorba-prodejnich-videi</a> <em>)</em></p>
<p>Do asistenta zadá:</p>
<ul>
<li>účel videa</li>
<li>co se komunikuje</li>
<li>cílovou skupinu</li>
<li>produkty + URL</li>
<li>tone of voice / brand kontext</li>
</ul>
<p>Asistent vygeneruje:</p>
<ol>
<li><strong>Kreativní směr videa</strong><ul>
<li>1–2 krátké varianty, jak video pojmout (např. “dárek pro manželku”, “rychlé řešení pro lenochy v kuchyni”).</li>
</ul>
</li>
<li><strong>Voiceover script</strong> (kompletní text)<ul>
<li>přehledná struktura:<ul>
<li>HOOK 1</li>
<li>HOOK 2</li>
<li>HOOK 3</li>
<li>MAIN část</li>
<li>CTA</li>
</ul>
</li>
</ul>
</li>
<li><strong>Poznámky k vizuálům (volitelné)</strong><ul>
<li>nápady na záběry / situace, které se hodí k textu.</li>
</ul>
</li>
</ol>
<p>👉 <strong>Tento výstup projekťák pošle klientovi ke schválení.</strong></p>
<p>Bez schváleného voiceoveru + kreativního směru se video <strong>NEzadává</strong>.</p>
<hr>
<h3>3) GPT asistent – ZADÁNÍ PRO VIDEO EDITORA</h3>
<p>Po schválení ze strany klienta pošli zadání editorovi které bude obsahovat:</p>
<ul>
<li>schválený voiceover + hooky</li>
<li>info od klienta (účel, produkty, tone)</li>
<li>jaké podklady má k dispozici (záběry, UGC, fotky atd.)</li>
<li>typ videa: <strong>Standard / AI b-roll</strong></li>
<li>Brand identita (logo, barvy, fonty)</li>
</ul>
<p>Asistent vygeneruje <strong>finální strukturované zadání</strong> ve formátu:</p>
<ol>
<li><p><strong>Základní info</strong></p>
<ul>
<li>Klient:</li>
<li>Název videa / kampaně:</li>
<li>Typ videa: Standard / AI b-roll</li>
<li>Účel videa (co má člověk udělat):</li>
</ul>
</li>
<li><p><strong>Co se komunikuje</strong></p>
<ul>
<li>sleva / akce / dárek / klíčový benefit</li>
<li>kontext (sezóna, promo, remarketing…)</li>
</ul>
</li>
<li><p><strong>Produkty</strong></p>
<ul>
<li>seznam produktů + <strong>URL</strong></li>
<li>hlavní produkt (hero) / doplňkové</li>
</ul>
</li>
<li><p><strong>Voiceover &amp; hooky</strong></p>
<ul>
<li><p>HOOK 1, HOOK 2, HOOK 3</p>
</li>
<li><p>MAIN text</p>
</li>
<li><p>CTA</p>
<p>  <em>(vše SCHVÁLENÉ klientem)</em></p>
</li>
</ul>
</li>
<li><p><strong>Vizuální podklady</strong></p>
<ul>
<li>odkazy na záběry (Drive / Dropbox / interní úložiště)</li>
<li>typy materiálu: produkt detail, lifestyle, sklad, UGC…</li>
</ul>
</li>
<li><p><strong>Brand identita</strong></p>
<ul>
<li>logo (odkaz na soubor)</li>
<li>fonty (název / soubory / náhrada)</li>
<li>barvy (HEX kódy)</li>
<li>případně brand manuál (link)</li>
</ul>
</li>
<li><p><strong>Technické parametry</strong></p>
<ul>
<li>formát: 9:16</li>
<li>délka: 15–30 s</li>
<li>platformy: Meta / IG Reels / TikTok / YT Shorts</li>
<li>export: H.264, 1080x1920 (dle interního standardu)</li>
</ul>
</li>
<li><p><strong>Revize &amp; deadline</strong></p>
<ul>
<li>deadline první verze</li>
<li>připomínka: <strong>klient má 1 kolo revizí v ceně</strong></li>
<li>každé další kolo revizí je účtováno jako vícepráce dle hodinové sazby videoeditora - viz SOP: .</li>
</ul>
</li>
</ol>
<hr>
<h3>4) Jak funguje 1 kolo revizí</h3>
<p><strong>1 kolo revizí = jedna sada připomínek najednou.</strong></p>
<ul>
<li>Klient pošle <strong>všechny změny najednou</strong> (ideálně v bodech ve Freelu):<ul>
<li>např. změna textu v titulku, výměna jednoho záběru, úprava barvy, drobné posuny střihu apod.</li>
</ul>
</li>
<li>Editor zapracuje připomínky a pošle <strong>verzi 2</strong>.</li>
</ul>
<p>Co <strong>už není</strong> v rámci jednoho kola revizí:</p>
<ul>
<li>když klient:<ul>
<li>nejdřív pošle jednu část připomínek, pak za hodinu další, pak po schválení “ještě mě napadlo…”</li>
<li>chce úplně změnit kreativní směr, strukturu videa nebo sdělení, které už předtím schválil ve voiceoveru</li>
</ul>
</li>
</ul>
<p>➡️ to se vždy řeší jako <strong>další kolo revizí</strong> → vícepráce podle kreditů nebo hodinové sazby videoeditora.</p>
<p><a href="Jak%20nacenit%20a%20evidovat%20v%C3%ADcepr%C3%A1ce%20u%20klient%C5%AF%2010551ff3df5780cb8696eafe95953cbd.md">Jak nacenit a evidovat vícepráce u klientů</a></p>
<p>Projekťák klientovi jasně vysvětlí:</p>
<blockquote>
<p>“V ceně videa je jedno kolo revizí – jedna ucelená sada připomínek. Další změny už jsou jako vícepráce dle hodinové sazby.”</p>
</blockquote>
<hr>
<h3>5) Předání editorovi</h3>
<p>Projekťák vloží do Freela / interního nástroje:</p>
<ul>
<li>kompletní <strong>vygenerované zadání z GPT</strong> (copy-paste)</li>
<li>odkaz na všechny podklady (video/foto, logo, fonty, brand)</li>
<li>info Standard / AI b-roll</li>
<li>deadline</li>
<li>info: <strong>1 kolo revizí v ceně, další přes vícepráce</strong></li>
</ul>
<p>Editor má všechno na jednom místě a nemusí nic lovit v historii komunikace.</p>
<hr>
<h3>6) Co když se klientovi video nelíbí a nechce ho</h3>
<p>Může se stát, že i přes schválený scénář / voiceover klient řekne:</p>
<blockquote>
<p>“To video se mi nelíbí, nechci ho používat, nechci ho platit.”</p>
</blockquote>
<p>Postup:</p>
<ol>
<li><strong>Video klientovi nefakturujeme.</strong><ul>
<li>V rámci udržení dobrých vztahů <strong>dané video neúčtujeme</strong>.</li>
<li>Bereme to jako výjimečný “goodwill” krok.</li>
</ul>
</li>
<li><strong>Do budoucna mu aktivně nenabízíme další video služby.</strong><ul>
<li><p>Projekťák zapíše interní poznámku u klienta:</p>
<blockquote>
<p>“Videoprodukci / Video Boost klientovi nenabízet – odmítnuté hotové video.”</p>
</blockquote>
</li>
</ul>
</li>
<li><strong>Videoeditor dostane normálně zaplaceno.</strong><ul>
<li>Editor si čas na toto video <strong>standardně zapíše do výkazu</strong>.</li>
<li>Náklad nese Socials – editor není ten, kdo to odnese.</li>
</ul>
</li>
<li><strong>Projekťák informuje finance / vedení.</strong><ul>
<li>Aby bylo jasné, že video nebylo fakturováno, ale interně se zaplatí editorovi.</li>
<li>Evidujeme to jako interní náklad, ne jako klientskou položku.</li>
</ul>
</li>
</ol>
<hr>
<h3>7) Využití Creative Boost kreditů pro videa</h3>
<ul>
<li>Pokud má klient aktivní <strong>Creative Boost</strong> a má v něm <strong>nevyužité kredity</strong>, může tyto kredity <strong>použít i na tvorbu videí</strong> (dle interní tabulky – kolik kreditů odpovídá 1 videu / úpravě videa).</li>
<li>Projekťák při plánování videí vždy zkontroluje:<ol>
<li>zda má klient aktivní Creative Boost,</li>
<li>kolik kreditů má ještě volných,</li>
<li>kolik videí dává smysl pokrýt z kreditů a co půjde jako samostatně fakturovaný <strong>Video Boost</strong>.</li>
</ol>
</li>
<li><strong>Kombinace je OK a běžná:</strong><ul>
<li>klient může mít <strong>Creative Boost</strong></li>
<li>a zároveň platit <strong>Video Boost</strong> (balíčky výkonnostních videí se strukturou, hooky, voiceoverem atd.).</li>
<li>Projekťák to klientovi vysvětlí tak, že:<ul>
<li>Creative Boost = průběžná kreativní “kapacita” na celý měsíc</li>
<li>Video Boost = konkrétní výkonnostní video balíčky nad rámec běžného kreativního objemu.</li>
</ul>
</li>
</ul>
</li>
<li>U každého videa musí být ve Freelu / Notionu <strong>jasně označeno</strong>:<ul>
<li>jestli bylo <strong>uhrazeno z kreditů Creative Boost</strong>, nebo</li>
<li>jestli je součástí <strong>balíčku Video Boost</strong> (fakturovat zvlášť).</li>
</ul>
</li>
</ul>
<hr>
<h3>8) Základní pravidlo + odměna projekťáka</h3>
<h3>Základní pravidlo</h3>
<blockquote>
<p>Projekťák nikdy NEzadává video tím, že přepošle komunikaci s klientem nebo jen link na Freelo thread.</p>
<p>Každé zadání musí být ve formátu popsaném v tomto SOP, ideálně vygenerované přes GPT asistenty.</p>
</blockquote>
<p>Cokoliv jiného = nekompletní zadání, se kterým se nemá začínat práce.</p>
<h3>Odměna projekťáka</h3>
<p>Abychom reflektovali navýšení práce na straně projekťáka (komunikace s klientem, příprava briefu, práce s GPT, koordinace), má <strong>projekťák z každé zakázky na tvorbu videí 10 % odměnu z fakturované částky</strong> – dle interního SOP: </p>
<p><a href="Evidence%20a%20schvalov%C3%A1n%C3%AD%20Upsell%C5%AF%20u%20st%C3%A1vaj%C3%ADc%C3%ADch%20klien%2022751ff3df5780649289eeea436992df.md"><strong>Evidence a schvalování Upsellů u stávajících klientů (10 % provize)</strong>
</a></p>
',
'Tento SOP popisuje, jak má projekťák zadávat tvorbu výkonnostních videí pro klienty v rámci služby Video Boost / Creative Boost. Cílem je, aby: každé video mělo jasný účel, strukturu a prodejní message, vznikalo na základě schváleného scénáře (voiceover + hooky), videoeditor vždy dostal kompletní a přehledné zadání bez dohledávání ve Freelu nebo e-mailech, videa byla optimalizovaná na výkon (konverze) pro Meta Ads a TikTok – ne brandové spoty. 👉 Tento SOP je závazný pro všechny projekťáky u jakékoliv zakázky na tvorbu videí. 1) Domluva s klientem – účel a rámec videa Projekťák si nejdřív s klientem ujasní: Co se komunikuje sleva / akce / dárek / novinka / produktový benefit / retence… účel videa: akvizice / remarketing / podpora konkrétní kampaně / launch Produkty / URL konkrétní produkty/služby + URL, které budou ve videu případně hlavní produkt vs. doplňkové Tone & brand styl: zábavné / seriózní / prémiové / “low cost & simple” apod. co má být hlavní message / benefit 👉 Výstup: krátké shrnutí v bodech – slouží jako vstup pro GPT asistenta. --2) GPT asistent – VOICEOVER & CREATIVE (povinný krok) Projekťák použije GPT asistenta pro přípravu voiceoveru a hooků (dummy link: https://chatgpt.com/g/g-69328d5afce08191b0238643b5925227-video-boost-tvorba-prodejnich-videi ) Do asistenta zadá: účel videa co se komunikuje cílovou skupinu produkty + URL tone of voice / brand kontext Asistent vygeneruje: Kreativní směr videa 1–2 krátké varianty, jak video pojmout (např. “dárek pro manželku”, “rychlé řešení pro lenochy v kuchyni”). Voiceover script (kompletní text) přehledná struktura: HOOK 1 HOOK 2 HOOK 3 MAIN část CTA Poznámky k vizuálům (volitelné) nápady na záběry / situace, které se hodí k textu. 👉 Tento výstup projekťák pošle klientovi ke schválení. Bez schváleného voiceoveru + kreativního směru se video NEzadává. --3) GPT asistent – ZADÁNÍ PRO VIDEO EDITORA Po schválení ze strany klienta pošli zadání editorovi které bude obsahovat: schválený voiceover + hooky info od klienta (účel, produkty, tone) jaké podklady má k dispozici (záběry, UGC, fotky atd.) typ videa: Standard / AI b-roll Brand identita (logo, barvy, fonty) Asistent vygeneruje finální strukturované zadání ve formátu: Základní info Klient: Název videa / kampaně: Typ videa: Standard / AI b-roll Účel videa (co má člověk udělat): Co se komunikuje sleva / akce / dárek / klíčový benefit kontext (sezóna, promo, remarketing…) Produkty seznam produktů + URL hlavní produkt (hero) / doplňkové Voiceover & hooky HOOK 1, HOOK 2, HOOK 3 MAIN text CTA (vše SCHVÁLENÉ klientem) Vizuální podklady odkazy na záběry (Drive / Dropbox / interní úložiště) typy materiálu: produkt detail, lifestyle, sklad, UGC… Brand identita logo (odkaz na soubor) fonty (název / soubory / náhrada) barvy (HEX kódy) případně brand manuál (link) Technické parametry formát: 9:16 délka: 15–30 s platformy: Meta / IG Reels / TikTok / YT Shorts export: H.264, 1080x1920 (dle interního standardu) Revize & deadline deadline první verze připomínka: klient má 1 kolo revizí v ceně každé další kolo revizí je účtováno jako vícepráce dle hodinové sazby videoeditora viz SOP: . --4) Jak funguje 1 kolo revizí 1 kolo revizí = jedna sada připomínek najednou. Klient pošle všechny změny najednou (ideálně v bodech ve Freelu): např. změna textu v titulku, výměna jednoho záběru, úprava barvy, drobné posuny střihu apod. Editor zapracuje připomínky a pošle verzi Co už není v rámci jednoho kola revizí: když klient: nejdřív pošle jednu část připomínek, pak za hodinu další, pak po schválení “ještě mě napadlo…” chce úplně změnit kreativní směr, strukturu videa nebo sdělení, které už předtím schválil ve voiceoveru ➡️ to se vždy řeší jako další kolo revizí → vícepráce podle kreditů nebo hodinové sazby videoeditora. Jak nacenit a evidovat vícepráce u klientů Projekťák klientovi jasně vysvětlí: “V ceně videa je jedno kolo revizí – jedna ucelená sada připomínek. Další změny už jsou jako vícepráce dle hodinové sazby.” --5) Předání editorovi Projekťák vloží do Freela / interního nástroje: kompletní vygenerované zadání z GPT (copy-paste) odkaz na všechny podklady (video/foto, logo, fonty, brand) info Standard / AI b-roll deadline info: 1 kolo revizí v ceně, další přes vícepráce Editor má všechno na jednom místě a nemusí nic lovit v historii komunikace. --6) Co když se klientovi video nelíbí a nechce ho Může se stát, že i přes schválený scénář / voiceover klient řekne: “To video se mi nelíbí, nechci ho používat, nechci ho platit.” Postup: Video klientovi nefakturujeme. V rámci udržení dobrých vztahů dané video neúčtujeme. Bereme to jako výjimečný “goodwill” krok. Do budoucna mu aktivně nenabízíme další video služby. Projekťák zapíše interní poznámku u klienta: “Videoprodukci / Video Boost klientovi nenabízet – odmítnuté hotové video.” Videoeditor dostane normálně zaplaceno. Editor si čas na toto video standardně zapíše do výkazu. Náklad nese Socials – editor není ten, kdo to odnese. Projekťák informuje finance / vedení. Aby bylo jasn',
7,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'6541fff5-a113-417e-9e6c-9e7f8888e615',
'11111111-1111-1111-1111-111111111101',
'Evidence a schvalování Upsellů u stávajících klientů (10 % provize)',
'<h3>💡 Co je upsell</h3>
<p>Za <strong>upsell</strong> se považuje jakékoliv rozšíření spolupráce s klientem, které přináší agentuře dodatečný příjem.</p>
<p>Konkrétně to může být:</p>
<ul>
<li><strong>Navýšení tarifu</strong> (např. z 30 000 Kč → 50 000 Kč),</li>
<li><strong>Přidání nové služby</strong> (např. další platforma, jiná země, e-mail marketing, video produkce apod.),</li>
<li><strong>Domluvení víceprací</strong> (např. ad-hoc kampaň, landing page, audit apod.).</li>
</ul>
<hr>
<h3>💰 Odměna za upsell</h3>
<ul>
<li><strong>10 % z první platby klienta (bez DPH)</strong></li>
<li>Vyplácí se <strong>po zaplacení faktury klientem</strong>.</li>
<li>Odměnu si <strong>eviduješ sám/sama</strong> do interní tabulky.</li>
<li>Vyplácení probíhá po schválení odpovědnou osobou (viz níže).</li>
</ul>
<hr>
<h3>✅ Podmínky pro nárok na odměnu</h3>
<p>Abys měl/a nárok na vyplacení:</p>
<ol>
<li><strong>Ty jsi upsell domluvil/a</strong> (aktivně jsi komunikoval/a s klientem a uzavřel/a dohodu).</li>
<li><strong>Klient novou službu nebo tarif zaplatil.</strong></li>
<li><strong>Upsell je evidován</strong> v tabulce s kompletními údaji (viz níže).</li>
<li><strong>Existuje důkaz</strong>, že jsi upsell zajistil/a – např. e-mail, zápis z callu nebo zpráva ve Freelu.</li>
</ol>
<hr>
<h3>🗂️ Jak upsell evidovat</h3>
<p>👉 <strong>Zapiš se do tabulky:</strong></p>
<p>📄 <a href="https://docs.google.com/spreadsheets/d/1F7c2zQGD9ZiZOiq4WUatUHHC4mNu4mfvFCVESUfcwX8/edit?usp=sharing">Evidence Upsellů – Google Sheet</a></p>
<hr>
<h3>🧾 Schvalovací proces</h3>
<ol>
<li>Po vyplnění tabulky upsell zkontroluje <strong>vedoucí projektu</strong> nebo <strong>CEO (Daniel)</strong>.</li>
<li>Po potvrzení, že klient platbu skutečně provedl, se odměna přidá do seznamu k výplatě.</li>
<li>Odměny se vyplácí <strong>spolu s měsíčními odměnami</strong> (obvykle do 10. dne následujícího měsíce).</li>
</ol>
',
'💡 Co je upsell Za upsell se považuje jakékoliv rozšíření spolupráce s klientem, které přináší agentuře dodatečný příjem. Konkrétně to může být: Navýšení tarifu (např. z 30 000 Kč → 50 000 Kč), Přidání nové služby (např. další platforma, jiná země, e-mail marketing, video produkce apod.), Domluvení víceprací (např. ad-hoc kampaň, landing page, audit apod.). --💰 Odměna za upsell 10 % z první platby klienta (bez DPH) Vyplácí se po zaplacení faktury klientem. Odměnu si eviduješ sám/sama do interní tabulky. Vyplácení probíhá po schválení odpovědnou osobou (viz níže). --✅ Podmínky pro nárok na odměnu Abys měl/a nárok na vyplacení: Ty jsi upsell domluvil/a (aktivně jsi komunikoval/a s klientem a uzavřel/a dohodu). Klient novou službu nebo tarif zaplatil. Upsell je evidován v tabulce s kompletními údaji (viz níže). Existuje důkaz, že jsi upsell zajistil/a – např. e-mail, zápis z callu nebo zpráva ve Freelu. --🗂️ Jak upsell evidovat 👉 Zapiš se do tabulky: 📄 Evidence Upsellů – Google Sheet --🧾 Schvalovací proces Po vyplnění tabulky upsell zkontroluje vedoucí projektu nebo CEO (Daniel). Po potvrzení, že klient platbu skutečně provedl, se odměna přidá do seznamu k výplatě. Odměny se vyplácí spolu s měsíčními odměnami (obvykle do dne následujícího měsíce).',
8,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'85924fff-a088-4ec5-8a85-5760fd96edbb',
'11111111-1111-1111-1111-111111111102',
'Faktury po splatnosti',
'<h3><strong>1. Cíl SOP</strong></h3>
<p>Tento SOP stanovuje jasný proces pro řešení faktur po splatnosti, minimalizaci problémů s neplatiči a udržení dobrých vztahů s klienty. Cílem je zajistit efektivní správu cash flow a snížit počet dlouhodobých dlužníků.</p>
<hr>
<h2><strong>2. Proces řešení faktur po splatnosti</strong></h2>
<h3><strong>Fáze 1: Automatizované upomínky (0–14 dní po splatnosti)</strong></h3>
<p>✅ <strong>1. den po splatnosti</strong></p>
<ul>
<li>📩 <strong>Odeslat e-mail #1</strong> (automatizovaný, přátelský tón)<ul>
<li>Předmět: „Připomenutí platby – Faktura [číslo faktury]“</li>
<li>Text: „Možná jste přehlédli fakturu, zde je odkaz na platbu.“</li>
</ul>
</li>
<li>🔄 Automatizace přes Fakturoid</li>
</ul>
<p>✅ <strong>7. den po splatnosti</strong></p>
<ul>
<li>📩 <strong>Odeslat e-mail #2</strong> (formální, ale stále přátelský)<ul>
<li>Předmět: „Faktura po splatnosti – prosíme o úhradu“</li>
<li>Text: „Faktura je nyní X dní po splatnosti, prosíme o úhradu co nejdříve.“</li>
</ul>
</li>
<li>🔄 Automatizace přes Make</li>
</ul>
<p>✅ <strong>14. den po splatnosti</strong></p>
<ul>
<li>📩 <strong>Odeslat e-mail #3</strong> (formální, ale stále přátelský)<ul>
<li>Předmět: „Faktura po splatnosti – prosíme o úhradu“</li>
<li>Text: „Faktura je nyní X dní po splatnosti, prosíme o úhradu co nejdříve.“</li>
</ul>
</li>
<li>🔄 Automatizace přes Make</li>
<li>📩 <strong>Odeslat e-mail interně</strong><ul>
<li>Předmět: „Klient má fakturu 14 dní po splatnosti – nutná eskalace“</li>
<li><strong>Příjemci:</strong> Projektový manažer + jednatelé</li>
<li>Text: „Klient [NÁZEV] má fakturu [ČÍSLO] po splatnosti 14 dní. Prosíme o informaci, zda jsou s klientem nějaké problémy, případně o koordinaci dalšího postupu.“</li>
<li>🔄 Automatizace přes Make</li>
</ul>
</li>
<li>📞 <strong>Telefonický kontakt s klientem</strong><ul>
<li>Asistent volá klientovi a zjišťuje důvod opožděné platby.</li>
<li>Pokud je problém s cash flow, nabídne možnost splátkového kalendáře.</li>
</ul>
</li>
</ul>
<hr>
<h3><strong>Fáze 2: Eskalace (15–30 dní po splatnosti)</strong></h3>
<p>✅ <strong>21. den po splatnosti</strong></p>
<ul>
<li>📩 <strong>Odeslat e-mail + SMS klientovi</strong><ul>
<li>Předmět: „Poslední výzva k úhradě před omezením služeb“</li>
<li>Text: „Pokud nebude faktura uhrazena do X dní, dojde k omezení spolupráce.“</li>
</ul>
</li>
</ul>
<p>✅ <strong>30. den po splatnosti</strong></p>
<ul>
<li>📩 **Odeslat e-mail o <strong>pozastavení spolupráce</strong><ul>
<li>Předmět: „Pozastavení služeb kvůli neuhrazené faktuře“</li>
<li>Text: „Vzhledem k neuhrazení faktury [číslo faktury] pozastavujeme veškeré služby. Po přijetí platby budou služby opět obnoveny.“</li>
</ul>
</li>
<li>🛑 <strong>Pozastavení služeb / blokace přístupu</strong> (PPC kampaně, správa účtů, další služby).</li>
<li>📞 <strong>Závěrečný telefonát klientovi</strong> – informování o pozastavení služeb.</li>
</ul>
<hr>
<h3><strong>Fáze 3: Ukončení spolupráce a právní kroky (35+ dní po splatnosti)</strong></h3>
<p>✅ <strong>35. den po splatnosti</strong></p>
<ul>
<li>📩 <strong>Odeslat finální upozornění</strong><ul>
<li>Předmět: „Faktura stále neuhrazena – předání pohledávky“</li>
<li>Text: „Pokud faktura nebude uhrazena do 5 pracovních dní, pohledávku předáváme k právnímu vymáhání.“</li>
</ul>
</li>
</ul>
<p>✅ 40**+ dní po splatnosti**</p>
<ul>
<li>📩 <strong>Odeslat poslední upozornění a oznámení o předání pohledávky</strong><ul>
<li>Předmět: „Poslední varování – faktura bude předána inkasní agentuře“</li>
<li>Text: Pokud nebude uhrazeno do X dní, pohledávka bude vymáhána právní cestou.</li>
</ul>
</li>
<li>📜 <strong>Předání pohledávky inkasní agentuře nebo právníkovi</strong>.</li>
</ul>
',
'Cíl SOP Tento SOP stanovuje jasný proces pro řešení faktur po splatnosti, minimalizaci problémů s neplatiči a udržení dobrých vztahů s klienty. Cílem je zajistit efektivní správu cash flow a snížit počet dlouhodobých dlužníků. --Proces řešení faktur po splatnosti Fáze 1: Automatizované upomínky (0–14 dní po splatnosti) ✅ den po splatnosti 📩 Odeslat e-mail #1 (automatizovaný, přátelský tón) Předmět: „Připomenutí platby – Faktura [číslo faktury]“ Text: „Možná jste přehlédli fakturu, zde je odkaz na platbu.“ 🔄 Automatizace přes Fakturoid ✅ den po splatnosti 📩 Odeslat e-mail #2 (formální, ale stále přátelský) Předmět: „Faktura po splatnosti – prosíme o úhradu“ Text: „Faktura je nyní X dní po splatnosti, prosíme o úhradu co nejdříve.“ 🔄 Automatizace přes Make ✅ den po splatnosti 📩 Odeslat e-mail #3 (formální, ale stále přátelský) Předmět: „Faktura po splatnosti – prosíme o úhradu“ Text: „Faktura je nyní X dní po splatnosti, prosíme o úhradu co nejdříve.“ 🔄 Automatizace přes Make 📩 Odeslat e-mail interně Předmět: „Klient má fakturu 14 dní po splatnosti – nutná eskalace“ Příjemci: Projektový manažer + jednatelé Text: „Klient [NÁZEV] má fakturu [ČÍSLO] po splatnosti 14 dní. Prosíme o informaci, zda jsou s klientem nějaké problémy, případně o koordinaci dalšího postupu.“ 🔄 Automatizace přes Make 📞 Telefonický kontakt s klientem Asistent volá klientovi a zjišťuje důvod opožděné platby. Pokud je problém s cash flow, nabídne možnost splátkového kalendáře. --Fáze 2: Eskalace (15–30 dní po splatnosti) ✅ den po splatnosti 📩 Odeslat e-mail + SMS klientovi Předmět: „Poslední výzva k úhradě před omezením služeb“ Text: „Pokud nebude faktura uhrazena do X dní, dojde k omezení spolupráce.“ ✅ den po splatnosti 📩 Odeslat e-mail o pozastavení spolupráce Předmět: „Pozastavení služeb kvůli neuhrazené faktuře“ Text: „Vzhledem k neuhrazení faktury [číslo faktury] pozastavujeme veškeré služby. Po přijetí platby budou služby opět obnoveny.“ 🛑 Pozastavení služeb / blokace přístupu (PPC kampaně, správa účtů, další služby). 📞 Závěrečný telefonát klientovi – informování o pozastavení služeb. --Fáze 3: Ukončení spolupráce a právní kroky (35+ dní po splatnosti) ✅ den po splatnosti 📩 Odeslat finální upozornění Předmět: „Faktura stále neuhrazena – předání pohledávky“ Text: „Pokud faktura nebude uhrazena do 5 pracovních dní, pohledávku předáváme k právnímu vymáhání.“ ✅ 40+ dní po splatnosti 📩 Odeslat poslední upozornění a oznámení o předání pohledávky Předmět: „Poslední varování – faktura bude předána inkasní agentuře“ Text: Pokud nebude uhrazeno do X dní, pohledávka bude vymáhána právní cestou. 📜 Předání pohledávky inkasní agentuře nebo právníkovi**.',
9,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'45c7ff02-d2b3-44b5-8202-0334ef1a3039',
'11111111-1111-1111-1111-111111111109',
'Jak dělat (přemýšlet) nad tvorbou obsahu',
'<h1>Pro koho je tento dokument</h1>
<p>Tento dokument slouží k pochopení <strong>způsobu přemýšlení nad obsahem v Socials</strong>, ne jako návod „co dnes publikovat“.</p>
<p>Je určen primárně pro:</p>
<ul>
<li>Content Managera</li>
<li>kohokoliv, kdo pracuje s obsahem (copy, video, grafika)</li>
</ul>
<p>Cílem je:</p>
<ul>
<li>snížit závislost na schvalování</li>
<li>sjednotit uvažování nad obsahem</li>
<li>zajistit, že každý výstup odpovídá Project Black</li>
</ul>
<h1>Základní princip</h1>
<p>Obsah v Socials <strong>nevzniká z formátu</strong>.</p>
<p>Obsah vzniká z <strong>myšlenky</strong>, která má <strong>konkrétního příjemce (personu)</strong>.</p>
<p>Formát (reel, carousel, stories…) <strong>a zvolené kanály</strong> jsou až <strong>sekundární rozhodnutí</strong>, která přichází teprve poté, co je jasné:</p>
<ul>
<li><em>komu</em> obsah patří (Founder Tomáš nebo CMO Lucie)</li>
<li><em>co</em> má obsah změnit v jeho přemýšlení</li>
<li><em>proč</em> je pro něj obsah relevantní právě teď</li>
</ul>
<h1>Jak se na obsah dívat (mentální model)</h1>
<p>Obsah má vždy tento řetězec:</p>
<p>VSTUP → FILTR → MYŠLENKA → INTERPRETACE PRO PERSONU → FORMÁTY → DISTRIBUCE</p>
<p>Pokud některý krok chybí, obsah je:</p>
<ul>
<li>povrchní</li>
<li>nečitelný</li>
<li>nebo závislý na ručním zásahu Content Managera (CM) nebo CMO</li>
</ul>
<h1>1️⃣ Vstupy (kde obsah vzniká)</h1>
<p>Za vstup považujeme <strong>jakýkoliv zdroj know-how nebo zkušenosti</strong>, např.:</p>
<ul>
<li>podcast</li>
<li>webinar / workshop</li>
<li>článek / case study</li>
<li>interní diskuse (Slack, meetingy)</li>
<li>zkušenosti z klientských projektů<ul>
<li>Slack Wins</li>
<li>Scls talks</li>
<li>One on one interní meetingy</li>
<li>Offline konverzace (teambuilding, atp.)</li>
</ul>
</li>
</ul>
<p>⚠️ Vstup <strong>není hotový obsah</strong>. Je to surovina.</p>
<h1>2️⃣ Project Black jako filtr</h1>
<blockquote>
<p>➡️ Má to jít ven?</p>
</blockquote>
<p>Project Black je <strong>filtr rozhodování</strong>, který určuje:</p>
<ul>
<li>komu obsah patří (Tomášovi nebo Lucii)</li>
<li>co má a nemá jít ven (výsledky vs. proces krok za krokem)</li>
<li>jak hluboko jdeme (jak detailně to vysvětlíme)</li>
<li>co už je mimo fokus (např. content jako 5 tipů, jak nastavit Meta Ads..)</li>
</ul>
<p>Každý obsah si musí projít otázkou:</p>
<blockquote>
<p>„Je tahle informace relevantní pro naše klíčové persony a jejich rozhodování?“</p>
</blockquote>
<p>Pokud ne → obsah se <strong>neřeší dál nebo se musí najít lepší způsob.</strong></p>
<h1>3️⃣ Rozhodnutí o personě (klíčový krok)</h1>
<blockquote>
<p>➡️ <em>Komu to patří?</em></p>
</blockquote>
<p>⚠️ Každý obsah <strong>musí mít primární personu</strong>. Nikdy nesmíme mluvit ke dvěma zároveň!</p>
<h3>Persona A: Founder Tomáš</h3>
<ul>
<li>řeší výsledky, návratnost investice, ušetření peněz a času, růst a přežití</li>
<li>přemýšlí v dopadech a rozhodnutích</li>
<li>nechce operativní detaily</li>
</ul>
<p>Očekává:</p>
<ul>
<li>jasný závěr</li>
<li>kontext „co to znamená pro mě“</li>
<li>a znovu: úsporu času, peněz, energie</li>
</ul>
<h3>Persona B: CMO Lucie</h3>
<ul>
<li>řeší exekuci a spolupráci</li>
<li>přemýšlí v procesech a aplikaci</li>
<li>chce vědět „jak informaci použít v praxi“</li>
</ul>
<p>Očekává:</p>
<ul>
<li>lessons learned</li>
<li>praktické využití</li>
<li>návody a rámce</li>
</ul>
<p>⚠️ Jeden obsah <strong>nemá mluvit na obě persony zároveň</strong>. Pokud se to stane, je to signál špatného rozhodnutí na začátku a je nutné obsah upravit, případně myšlenky rozdělit zvlášť pro <em>foundera</em> a zvlášť pro CMO.</p>
<h3>3️⃣.1️⃣ <strong>Jak hluboko jdeme (vědomé rozhodnutí)</strong></h3>
<blockquote>
<p>➡️ <em>Jak moc detailně to vysvětlíme?</em></p>
</blockquote>
<p>Hloubka obsahu je <strong>vědomé rozhodnutí</strong>, které vychází z persony.</p>
<p>Cílem není říct všechno, co víme.</p>
<p>Cílem je říct <strong>přesně tolik</strong>, aby to příjemci:</p>
<ul>
<li>pomohlo lépe se rozhodnout (Founder)</li>
<li>nebo lépe pracovat (CMO)</li>
</ul>
<p>Pokud detail (informace):</p>
<ul>
<li>nepomáhá rozhodnutí</li>
<li>ani exekuci</li>
</ul>
<p>→ do veřejného obsahu <strong>nepatří</strong>.</p>
<h1>4️⃣ Obsahová myšlenka (Core Insight)</h1>
<p>Z každého vstupu se nejdřív vytahuje <strong>jedna hlavní myšlenka</strong>.</p>
<p>Core Insight:</p>
<ul>
<li>je jedna věta</li>
<li>jeden názor</li>
<li>jeden posun v uvažování</li>
</ul>
<p>Ne:</p>
<ul>
<li>shrnutí</li>
<li>výčet</li>
<li>„co jsme řešili v podcastu“</li>
</ul>
<p>Ano:</p>
<ul>
<li>jasné stanovisko</li>
<li>nebo konkrétní aha moment</li>
</ul>
<p>Příklad 1 z podcastu s Ruslanem:</p>
<blockquote>
<p>Největší brzdou růstu e-shopu není marketing, ale neschopnost majitele dělat nepohodlná rozhodnutí. &gt; persona founder</p>
</blockquote>
<p>Příklad 2 z podcastu s Ruslanem:</p>
<blockquote>
<p>Když firma roste, roste i cena špatných rozhodnutí. To, co odpustíš při obratu 20 mil., tě zničí při 100 mil.“ &gt; persona founder</p>
</blockquote>
<p>Příklad 3 z podcastu s Davidem Duc:</p>
<blockquote>
<p>Krátké video není jedno video. Je to sada testů. &gt; persona CMO</p>
</blockquote>
<p>Příklad 4 z podcastu s Davidem Duc:</p>
<blockquote>
<p>Testování šetří rozpočet. Nezvyšuje ho. &gt; persona Founder Tomáš</p>
</blockquote>
<p>Příklad 5 z interního slacku &gt; Radka poslala screenshot pochvaly od Davida z Konopného táty</p>
<blockquote>
<p>„Akce byla parádní, včera rekord. Poprvé přes 1000 objednávek za den (tržba přes 1 mil). Expedice i výroba zátěžový ‘test’ zvládla skvěle.“</p>
<p><strong>CO Z TOHO VYPLÝVÁ ZA CORE INSIGHT?</strong></p>
<ol>
<li><strong>Špičkový den není marketingový výsledek. Je to provozní zkouška firmy =</strong> Kampaň „funguje“ teprve ve chvíli, kdy ji ustojí výroba + sklad + expedice. &gt; Founder Tomáš</li>
<li><strong>Marketing má mít KPI i mimo Ads Manager: expedice, rychlost odeslání, chybovost, vratky =</strong> Jinak optimalizuješ „výkon kampaní“, ale rozbíjíš CX a dlouhodobý růst. &gt; <strong>Persona:</strong> CMO Lucie</li>
<li><strong>Akce má být plánovaný „zátěžový test“, ne improvizace =</strong> Předem sladit nabídku, budget, kreativu, skladové zásoby, směny a cut-off časy.) &gt; <strong>Persona:</strong> CMO Lucie</li>
</ol>
</blockquote>
<h1>5️⃣ Interpretace myšlenky podle persony</h1>
<p>Stejná myšlenka se <strong>jinak vysvětluje</strong>:</p>
<h3>Pro Foundera</h3>
<ul>
<li>co to znamená pro rozhodování</li>
<li>jaký má dopad na byznys</li>
<li>čemu se vyhnout / co změnit</li>
</ul>
<h3>Pro CMO</h3>
<ul>
<li>jak to použít v praxi</li>
<li>co změnit v týmu</li>
<li>jak to komunikovat nahoru / dolů</li>
</ul>
<h1>6️⃣ Až teď přichází formát</h1>
<p>Formát je jen:</p>
<ul>
<li>obal</li>
<li>nosič</li>
<li>adaptace na platformu</li>
</ul>
<p>Jedna myšlenka může existovat jako:</p>
<ul>
<li>reel</li>
<li>carousel</li>
<li>stories</li>
<li>banner</li>
<li>launch post</li>
</ul>
<p>Formát <strong>nikdy neurčuje myšlenku</strong>.</p>
<p>Myšlenka určuje formát.</p>
<h1>7️⃣ Distribuce a návratnost</h1>
<p>Obsah není jednorázový výstřel.</p>
<p>Silná myšlenka:</p>
<ul>
<li>se vrací</li>
<li>má více úhlů</li>
<li>žije delší dobu</li>
</ul>
<p>Distribuce probíhá:</p>
<ul>
<li><p>přes sociální sítě</p>
</li>
<li><p>přes lidi (sdílení, reakce)</p>
</li>
<li><p>přes lidi a jejich unikátní úhly pohledu, příklady:</p>
<blockquote>
<p>Přes víkend jsme vytvořili přes 250 kreativ pro 7 zemí.</p>
</blockquote>
<p>  Oťas: Vyzdvihne tým za vytvoření a Meta Ads specialistu za nasazení a škálování kampaní</p>
<p>  Meta Ads specialista: popíše, jak vytvořil úhly komunikace, co kampaně přinesly a proč je kreativní diverzifikace důležitá</p>
<p>  Grafička: jaký nástroj použila a kolik času ji to zabralo a jak si vyhodnotí, co fungovalo…</p>
</li>
<li><p>opakovaně v čase</p>
</li>
</ul>
<p>Cílem není:</p>
<ul>
<li>„hodně obsahu“</li>
</ul>
<p>Cílem je:</p>
<ul>
<li><strong>zapamatovatelný obsah</strong></li>
</ul>
<h1>🔥 Jak poznáš, že je obsah v souladu s Project Black</h1>
<p>Obsah je správně, pokud:</p>
<ul>
<li>víš, pro koho je vytvořen</li>
<li>dokážeš jednou větou říct (obhájit), co je hlavní myšlenka</li>
<li>víš, proč je relevantní právě teď</li>
<li>nepotřebuješ CMO k vysvětlení „co tím myslíme“</li>
</ul>
<hr>
<h1><strong>🔧 AI PROMPTY PRO PRÁCI S OBSAHEM (Project Black) - PŘÍKLADY</strong></h1>
<h2>🔥 <strong>START HERE</strong></h2>
<p>Než začneš s jakýmkoliv promptem, <strong>vždy si v ChatGPT vytvoř projekt</strong> a <strong>nahraj do něj tyto zdroje</strong>:</p>
<ul>
<li><p><strong>„Ready Doc – Project Black“</strong></p>
<p>  (strategický rámec, cílové skupiny, kontext Socials)</p>
</li>
<li><p><strong>Toto SOP: „Jak dělat (přemýšlet) nad tvorbou obsahu“</strong></p>
<p>  (způsob uvažování, práce s personami, hloubka, fokus)</p>
</li>
</ul>
<p>Tyto dokumenty slouží jako:</p>
<ul>
<li>jednotný kontext</li>
<li>myšlenkový filtr</li>
<li>společný jazyk</li>
</ul>
<p>Bez těchto zdrojů <strong>AI nepoužívej</strong> – výstupy nebudou odpovídat Project Black ani stylu Socials.</p>
<blockquote>
<p>AI má postupovat <strong>explicitně podle posloupnosti myšlení v SOP</strong> a používat Project Black jako filtr relevance, hloubky a stylu.</p>
</blockquote>
<h2>1️⃣ Univerzální prompt</h2>
<p><strong>Použití, když máš:</strong></p>
<ul>
<li>screenshot zpětné vazby</li>
<li>interní zpráva například ve slacku Socials wins</li>
<li>transkript podcastu</li>
<li>článek</li>
<li>případovou studii</li>
<li>interní poznámky</li>
</ul>
<aside>
📎

<p>Jsi content stratég agentury Socials.</p>
<p>Pracuj striktně podle:</p>
<ul>
<li>Ready Doc – Project Black</li>
<li>SOP: Jak dělat (přemýšlet) nad tvorbou obsahu</li>
</ul>
<p>Postupuj krok za krokem podle této posloupnosti<br>(a jednotlivé kroky si interně odděl):</p>
<p>1️⃣ VSTUP</p>
<p>Zpracuj přiložený vstup (transkript / zpětnou vazbu / text / popis screenshotu).<br>Vstup ber jako surovinu, ne jako hotový obsah.</p>
<p>2️⃣ CORE INSIGHTS</p>
<p>Z přiloženého vstupu vytáhni 5 core insights:</p>
<ul>
<li>každé jako jednu jasnou větu</li>
<li>musí jít o názor, postoj nebo posun v přemýšlení</li>
<li>nevytvářej shrnutí</li>
<li>nevytvářej obecné rady</li>
<li>zaměř se na to, co má hodnotu pro rozhodování nebo praxi</li>
</ul>
<p>3️⃣ PERSONA</p>
<p>Ke každému insightu:</p>
<ul>
<li>urči jednu primární personu:<ul>
<li>Founder Tomáš</li>
<li>nebo CMO Lucie</li>
</ul>
</li>
<li>krátce vysvětli, proč insight mluví právě k této personě</li>
<li>rozhodnutí o personě ber jako klíčové (nemluv na obě zároveň)</li>
</ul>
<p>4️⃣ HLOUBKA</p>
<p>U každého insightu implicitně zvol hloubku odpovídající personě:</p>
<ul>
<li>Founder: strategická, rozhodovací, dopadová</li>
<li>CMO: praktická, exekuční, procesní<br>Nevysvětluj technické detaily, pokud nejsou nutné.</li>
</ul>
<p>5️⃣ VÝSTUP</p>
<p>Pro každý insight vytvoř jeden obsahový příspěvek:</p>
<ul>
<li>mluv výhradně k určené personě</li>
<li>drž se jedné hlavní myšlenky</li>
<li>zaujmi jasný postoj nebo nabídni konkrétní rámec</li>
<li>styl: lidský, konkrétní, bez buzzwordů</li>
<li>neřeš formát (reel / carousel / kanál)</li>
</ul>
<p>Dodrž Project Black:</p>
<ul>
<li>fokus na relevance</li>
<li>správnou hloubku</li>
<li>žádné technické know-how bez kontextu</li>
</ul>
<p>⚠️ Vstup: nezapomeň vložit<br>[TEXT / TRANSKRIPT / ZPĚTNOU VAZBU / POPIS SCREENSHOTU]</p>
</aside>

<h2>2️⃣ VARIANTA A: Podcast / dlouhý transkript nebo dlouhý článek (případovka, atp.)</h2>
<p>Níže je transkript [podcastové epizody, případové studie, nebo blogového článku].<br>Zaměř se na:</p>
<ul>
<li>silné myšlenky</li>
<li>opakující se motivy</li>
<li>momenty, kde se mění pohled na věc</li>
<li>věty, které by si Founder nebo CMO „podtrhli“</li>
</ul>
<p>Pak postupuj podle celého SOP Jak dělat (přemýšlet) nad tvorbou obsahu.</p>
',
'Pro koho je tento dokument Tento dokument slouží k pochopení způsobu přemýšlení nad obsahem v Socials, ne jako návod „co dnes publikovat“. Je určen primárně pro: Content Managera kohokoliv, kdo pracuje s obsahem (copy, video, grafika) Cílem je: snížit závislost na schvalování sjednotit uvažování nad obsahem zajistit, že každý výstup odpovídá Project Black Základní princip Obsah v Socials nevzniká z formátu. Obsah vzniká z myšlenky, která má konkrétního příjemce (personu). Formát (reel, carousel, stories…) a zvolené kanály jsou až sekundární rozhodnutí, která přichází teprve poté, co je jasné: komu obsah patří (Founder Tomáš nebo CMO Lucie) co má obsah změnit v jeho přemýšlení proč je pro něj obsah relevantní právě teď Jak se na obsah dívat (mentální model) Obsah má vždy tento řetězec: VSTUP → FILTR → MYŠLENKA → INTERPRETACE PRO PERSONU → FORMÁTY → DISTRIBUCE Pokud některý krok chybí, obsah je: povrchní nečitelný nebo závislý na ručním zásahu Content Managera (CM) nebo CMO 1️⃣ Vstupy (kde obsah vzniká) Za vstup považujeme jakýkoliv zdroj know-how nebo zkušenosti, např.: podcast webinar / workshop článek / case study interní diskuse (Slack, meetingy) zkušenosti z klientských projektů Slack Wins Scls talks One on one interní meetingy Offline konverzace (teambuilding, atp.) ⚠️ Vstup není hotový obsah. Je to surovina. 2️⃣ Project Black jako filtr ➡️ Má to jít ven? Project Black je filtr rozhodování, který určuje: komu obsah patří (Tomášovi nebo Lucii) co má a nemá jít ven (výsledky vs. proces krok za krokem) jak hluboko jdeme (jak detailně to vysvětlíme) co už je mimo fokus (např. content jako 5 tipů, jak nastavit Meta Ads..) Každý obsah si musí projít otázkou: „Je tahle informace relevantní pro naše klíčové persony a jejich rozhodování?“ Pokud ne → obsah se neřeší dál nebo se musí najít lepší způsob. 3️⃣ Rozhodnutí o personě (klíčový krok) ➡️ Komu to patří? ⚠️ Každý obsah musí mít primární personu. Nikdy nesmíme mluvit ke dvěma zároveň! Persona A: Founder Tomáš řeší výsledky, návratnost investice, ušetření peněz a času, růst a přežití přemýšlí v dopadech a rozhodnutích nechce operativní detaily Očekává: jasný závěr kontext „co to znamená pro mě“ a znovu: úsporu času, peněz, energie Persona B: CMO Lucie řeší exekuci a spolupráci přemýšlí v procesech a aplikaci chce vědět „jak informaci použít v praxi“ Očekává: lessons learned praktické využití návody a rámce ⚠️ Jeden obsah nemá mluvit na obě persony zároveň. Pokud se to stane, je to signál špatného rozhodnutí na začátku a je nutné obsah upravit, případně myšlenky rozdělit zvlášť pro foundera a zvlášť pro CMO. 3️⃣.1️⃣ Jak hluboko jdeme (vědomé rozhodnutí) ➡️ Jak moc detailně to vysvětlíme? Hloubka obsahu je vědomé rozhodnutí, které vychází z persony. Cílem není říct všechno, co víme. Cílem je říct přesně tolik, aby to příjemci: pomohlo lépe se rozhodnout (Founder) nebo lépe pracovat (CMO) Pokud detail (informace): nepomáhá rozhodnutí ani exekuci → do veřejného obsahu nepatří. 4️⃣ Obsahová myšlenka (Core Insight) Z každého vstupu se nejdřív vytahuje jedna hlavní myšlenka. Core Insight: je jedna věta jeden názor jeden posun v uvažování Ne: shrnutí výčet „co jsme řešili v podcastu“ Ano: jasné stanovisko nebo konkrétní aha moment Příklad 1 z podcastu s Ruslanem: Největší brzdou růstu e-shopu není marketing, ale neschopnost majitele dělat nepohodlná rozhodnutí. persona founder Příklad 2 z podcastu s Ruslanem: Když firma roste, roste i cena špatných rozhodnutí. To, co odpustíš při obratu 20 mil., tě zničí při 100 mil.“ persona founder Příklad 3 z podcastu s Davidem Duc: Krátké video není jedno video. Je to sada testů. persona CMO Příklad 4 z podcastu s Davidem Duc: Testování šetří rozpočet. Nezvyšuje ho. persona Founder Tomáš Příklad 5 z interního slacku Radka poslala screenshot pochvaly od Davida z Konopného táty „Akce byla parádní, včera rekord. Poprvé přes 1000 objednávek za den (tržba přes 1 mil). Expedice i výroba zátěžový ‘test’ zvládla skvěle.“ CO Z TOHO VYPLÝVÁ ZA CORE INSIGHT? Špičkový den není marketingový výsledek. Je to provozní zkouška firmy = Kampaň „funguje“ teprve ve chvíli, kdy ji ustojí výroba + sklad + expedice. Founder Tomáš Marketing má mít KPI i mimo Ads Manager: expedice, rychlost odeslání, chybovost, vratky = Jinak optimalizuješ „výkon kampaní“, ale rozbíjíš CX a dlouhodobý růst. Persona: CMO Lucie Akce má být plánovaný „zátěžový test“, ne improvizace = Předem sladit nabídku, budget, kreativu, skladové zásoby, směny a cut-off časy.) Persona: CMO Lucie 5️⃣ Interpretace myšlenky podle persony Stejná myšlenka se jinak vysvětluje: Pro Foundera co to znamená pro rozhodování jaký má dopad na byznys čemu se vyhnout / co změnit Pro CMO jak to použít v praxi co změnit v týmu jak to komunikovat nahoru / dolů 6️⃣ Až teď přichází formát Formát je jen: obal nosič adaptace na platformu Jedna myšlenka může existovat jako: reel carousel stories banner launch post Formát nikdy neurčuje myšlenku. Myšlenka určuje formát. 7️⃣ Distribuce a návratnost Obsah není jedn',
10,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'afb92c0f-3e83-43ed-8c62-a6f5ef7d0353',
'11111111-1111-1111-1111-111111111106',
'Jak dělat audity zdarma',
'<h2>🎯 <strong>Cíl auditu</strong></h2>
<p>Cílem bezplatného auditu je:</p>
<ul>
<li>Získat důvěru potenciálního klienta.</li>
<li>Ukázat naši expertízu na datech z jeho účtu.</li>
<li>Identifikovat slabá místa a navrhnout zlepšení.</li>
<li>V ideálním případě navázat <strong>dlouhodobou spolupráci</strong>.</li>
</ul>
<p>Audit není masová služba, ale <strong>výběrový nástroj</strong>, který má přitáhnout kvalitní klienty se smysluplným rozpočtem.</p>
<hr>
<h2>👥 <strong>Kdo audit vykonává</strong></h2>
<p>Audit zpracovává vždy <strong>Sales Manager</strong>:</p>
<ul>
<li><strong>David</strong></li>
<li><strong>Danny</strong></li>
<li><strong>Otas</strong></li>
</ul>
<p>Každý z nich zodpovídá za kompletní proces:</p>
<p>→ komunikaci, přípravu auditu i následný call s klientem.</p>
<hr>
<h2>🔄 <strong>Postup auditu krok za krokem</strong></h2>
<h3>1. PŘÍCHOZÍ POPTÁVKA</h3>
<ul>
<li>Přichází přes <strong>Typeform</strong></li>
<li>Propisuje se do <strong>Raynet CRM</strong></li>
<li>Info přijde e-mailem</li>
</ul>
<p>✅ Zkontroluj ve formuláři:</p>
<ul>
<li>Kontaktní údaje</li>
<li>Informace o firmě</li>
<li>Především <strong>měsíční rozpočet na reklamu (spend)</strong></li>
</ul>
<hr>
<h3>2. KLIENT S ROZPOČTEM POD 50 000 Kč / měsíc</h3>
<ul>
<li>Audit <strong>neprováděj</strong></li>
<li>Oslov slušným e-mailem a požádej o screenshot spendu</li>
</ul>
<h3>📧 <em>Email šablona – malý rozpočet</em></h3>
<blockquote>
<p>Předmět: Audit kampaní – rychlé upřesnění</p>
<p>Hezký den,</p>
<p>děkujeme za zájem o audit kampaní.</p>
<p>Aby pro Vás měl audit skutečnou hodnotu, věnujeme se především projektům s rozpočtem alespoň <strong>50 000 Kč měsíčně</strong>.</p>
<p>Pokud máte aktuálně menší rozpočet, pošlete nám prosím screenshot z reklamního účtu (Meta nebo Google), kde bude vidět spend za posledních 30 dní – poté ověříme, zda pro Vás můžeme připravit hodnotný výstup.</p>
<p>Děkujeme za pochopení a těšíme se případně na budoucí spolupráci.</p>
<p>S pozdravem,</p>
<p>Tým Socials</p>
</blockquote>
<hr>
<h3>3. KLIENT S ROZPOČTEM NAD 50 000 Kč / měsíc</h3>
<ul>
<li>Pokračuj v auditu</li>
<li>Označ v <strong>Raynetu</strong> stav: „audit rozpracovaný“</li>
<li>Pošli onboarding e-mail:</li>
</ul>
<h3>📧 <em>Email šablona – onboarding k auditu</em></h3>
<blockquote>
<p>Předmět: Audit kampaní – další postup</p>
<p>Hezký den,</p>
<p>děkuji za Váš zájem o audit kampaní. Rádi se na ně podíváme a zjistíme, co by šlo zlepšit.</p>
<p>Navrhuji tento postup:</p>
<ol>
<li><p>Nasdílejte nám přístup primárně do <strong>Meta Ads</strong> (Google Ads je doplňkový).</p>
</li>
<li><p>Pokud máte správná data v <strong>Google Analytics 4</strong> (např. tržby, objednávky), nasdílejte také.</p>
</li>
<li><p>Domluvme si <strong>call na příští týden</strong> – potřebujeme cca 2–3 dny na analýzu kampaní.</p>
<p> 👉 [vlož odkaz na kalendář]</p>
</li>
</ol>
<p>Na callu projdeme výsledky a případné dotazy z auditu.</p>
<p>🔐 Sdílení přístupů:</p>
<ul>
<li><strong>GA4</strong> – přístup „Čtení“ ➝ <a href="mailto:analytics@socials.cz">analytics@socials.cz</a></li>
<li><strong>Meta Business Manager</strong> – ID: 1196977750459552 (nejnižší přístup k reklamnímu účtu, katalogu, pixelu a stránce)</li>
<li><strong>Google Ads</strong> – zašlete ID účtu, my pošleme žádost o přístup</li>
</ul>
<p>📘 Návod ke sdílení přístupů:</p>
<p><a href="N%C3%A1vod%20na%20sd%C3%ADlen%C3%AD%20p%C5%99%C3%ADstup%C5%AF%20-%20Socials%2018251ff3df5780089bd8f894ba3fe09f.md">https://socials.notion.site/N-vod-na-sd-len-p-stup-Socials-18251ff3df5780089bd8f894ba3fe09f?pvs=4</a></p>
<p>Děkuji a těším se na spolupráci,</p>
<p>[Tvé jméno]</p>
<p>Socials</p>
</blockquote>
<hr>
<h3>4. INTERNÍ AUDIT</h3>
<p>Po získání přístupů:</p>
<ul>
<li>Projdi <strong>Meta Ads</strong> – struktura, výkonnost, optimalizace</li>
<li>Zkontroluj <strong>web</strong> – UX, CTA, funkčnost, potenciální chyby</li>
<li>Zhodnoť <strong>GA4</strong> – spolehlivost dat, konverze, revenue</li>
<li>Sepiš <strong>3–5 konkrétních zjištění + návrhy na zlepšení</strong></li>
</ul>
<p>Použij interní šablonu nebo Notion template pro zápis.</p>
<hr>
<h3>5. CALL S KLIENTEM</h3>
<ul>
<li>V domluveném termínu proveď videohovor</li>
<li>Sdílej výsledky a doporučení</li>
<li>Zeptej se na další kontext</li>
<li>Pokud audit dopadl dobře, <strong>nabídni možnosti spolupráce</strong></li>
</ul>
<p>V <strong>Raynetu</strong> nastav:</p>
<ul>
<li>„Audit hotový – [úspěšný / bez zájmu]“</li>
</ul>
<hr>
<h2>✅ Interní checklist</h2>
<ul>
<li><input disabled="" type="checkbox"> Přišla poptávka přes Typeform → propsaná do Raynetu?</li>
<li><input disabled="" type="checkbox"> Zkontroloval/a jsi výši spendu?</li>
<li><input disabled="" type="checkbox"> Poslal/a jsi správný e-mail podle rozpočtu?</li>
<li><input disabled="" type="checkbox"> Obdržel/a jsi všechny potřebné přístupy?</li>
<li><input disabled="" type="checkbox"> Prošel/a jsi kampaně, web a analytiku?</li>
<li><input disabled="" type="checkbox"> Sepisuješ výstup do šablony?</li>
<li><input disabled="" type="checkbox"> Proběhl call a byl zaznamenán v Raynetu?</li>
<li><input disabled="" type="checkbox"> Nabídl/a jsi možnosti spolupráce?</li>
</ul>
<hr>
<p>Mám ti k tomu rovnou připravit i šablonu v <strong>Notion</strong> nebo <strong>Google Docs</strong> pro výstupní zprávu z auditu?</p>
',
'🎯 Cíl auditu Cílem bezplatného auditu je: Získat důvěru potenciálního klienta. Ukázat naši expertízu na datech z jeho účtu. Identifikovat slabá místa a navrhnout zlepšení. V ideálním případě navázat dlouhodobou spolupráci. Audit není masová služba, ale výběrový nástroj, který má přitáhnout kvalitní klienty se smysluplným rozpočtem. --👥 Kdo audit vykonává Audit zpracovává vždy Sales Manager: David Danny Otas Každý z nich zodpovídá za kompletní proces: → komunikaci, přípravu auditu i následný call s klientem. --🔄 Postup auditu krok za krokem PŘÍCHOZÍ POPTÁVKA Přichází přes Typeform Propisuje se do Raynet CRM Info přijde e-mailem ✅ Zkontroluj ve formuláři: Kontaktní údaje Informace o firmě Především měsíční rozpočet na reklamu (spend) --KLIENT S ROZPOČTEM POD 50 000 Kč / měsíc Audit neprováděj Oslov slušným e-mailem a požádej o screenshot spendu 📧 Email šablona – malý rozpočet Předmět: Audit kampaní – rychlé upřesnění Hezký den, děkujeme za zájem o audit kampaní. Aby pro Vás měl audit skutečnou hodnotu, věnujeme se především projektům s rozpočtem alespoň 50 000 Kč měsíčně. Pokud máte aktuálně menší rozpočet, pošlete nám prosím screenshot z reklamního účtu (Meta nebo Google), kde bude vidět spend za posledních 30 dní – poté ověříme, zda pro Vás můžeme připravit hodnotný výstup. Děkujeme za pochopení a těšíme se případně na budoucí spolupráci. S pozdravem, Tým Socials --KLIENT S ROZPOČTEM NAD 50 000 Kč / měsíc Pokračuj v auditu Označ v Raynetu stav: „audit rozpracovaný“ Pošli onboarding e-mail: 📧 Email šablona – onboarding k auditu Předmět: Audit kampaní – další postup Hezký den, děkuji za Váš zájem o audit kampaní. Rádi se na ně podíváme a zjistíme, co by šlo zlepšit. Navrhuji tento postup: Nasdílejte nám přístup primárně do Meta Ads (Google Ads je doplňkový). Pokud máte správná data v Google Analytics 4 (např. tržby, objednávky), nasdílejte také. Domluvme si call na příští týden – potřebujeme cca 2–3 dny na analýzu kampaní. 👉 [vlož odkaz na kalendář] Na callu projdeme výsledky a případné dotazy z auditu. 🔐 Sdílení přístupů: GA4 – přístup „Čtení“ ➝ analytics@socials.cz Meta Business Manager – ID: 1196977750459552 (nejnižší přístup k reklamnímu účtu, katalogu, pixelu a stránce) Google Ads – zašlete ID účtu, my pošleme žádost o přístup 📘 Návod ke sdílení přístupů: https://socials.notion.site/N-vod-na-sd-len-p-stup-Socials-18251ff3df5780089bd8f894ba3fe09f?pvs=4 Děkuji a těším se na spolupráci, [Tvé jméno] Socials --INTERNÍ AUDIT Po získání přístupů: Projdi Meta Ads – struktura, výkonnost, optimalizace Zkontroluj web – UX, CTA, funkčnost, potenciální chyby Zhodnoť GA4 – spolehlivost dat, konverze, revenue Sepiš 3–5 konkrétních zjištění + návrhy na zlepšení Použij interní šablonu nebo Notion template pro zápis. --CALL S KLIENTEM V domluveném termínu proveď videohovor Sdílej výsledky a doporučení Zeptej se na další kontext Pokud audit dopadl dobře, nabídni možnosti spolupráce V Raynetu nastav: „Audit hotový – [úspěšný / bez zájmu]“ --✅ Interní checklist [ ] Přišla poptávka přes Typeform → propsaná do Raynetu? [ ] Zkontroloval/a jsi výši spendu? [ ] Poslal/a jsi správný e-mail podle rozpočtu? [ ] Obdržel/a jsi všechny potřebné přístupy? [ ] Prošel/a jsi kampaně, web a analytiku? [ ] Sepisuješ výstup do šablony? [ ] Proběhl call a byl zaznamenán v Raynetu? [ ] Nabídl/a jsi možnosti spolupráce? --Mám ti k tomu rovnou připravit i šablonu v Notion nebo Google Docs pro výstupní zprávu z auditu?',
11,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'fd722016-65c1-4306-b679-77a8b79e902f',
'11111111-1111-1111-1111-111111111103',
'Jak na ještě lepší komunikaci s klientem',
'<h1>Příklad 1: Z naší nevýhody udělejme výhodu</h1>
<p><strong>Background:</strong> Klient si chystá vše sám pro akci. Úkolem projekťáka je klienta nabriefovat a zajistit vše pro specialisty. V tomto případě se zapomnělo na dodání textů. Meta Ads specialista využil textace z minulého roku ze stejné akce, jen poupravil data a procentuální slevu.</p>
<p><strong>Reálná situace:</strong></p>
<p><img src="Jak%20na%20je%C5%A1t%C4%9B%20lep%C5%A1%C3%AD%20komunikaci%20s%20klientem/Snimek_obrazovky_2024-09-18_v_16.23.19.png" alt="Snímek obrazovky 2024-09-18 v 16.23.19.png"></p>
<p><strong>❌ Popis situace ❌</strong><br>Klient se dozvídá v den spuštění akce, že zapomněl ještě dodat texty, přičemž copywriter je na dovolené.<br>Klient není naštvaný na sebe, klient je naštvaný na Socials, protože agentura si měla vyžádat vše potřebné.</p>
<p><strong>Preferovaná komunikace</strong></p>
<p>Vím, že jsem jako projektový manažer udělal chybu, ale využiju to ve svůj prospěch.<br>Udělám si printscreen běžících reklam.<br>Klientovi komunikuji následující:</p>
<blockquote>
<p>Dobrý den, kampaně běží dle domluvy. 😊<br>Stejná akce běžela také minulý rok, takže jsme si říkali, že vám ušetříme čas psaním textů a jen jsme oprášili texty z minulého roku. </p>
</blockquote>
<p>Posílám screenshot reklamy:<br><strong>[vložené printscreeny reklam]</strong></p>
<p>Můžeme takto ponechat? Pokud ne, klidně mi ještě pošlete své texty a dnes reklamy aktualizujeme.<br>Děkuji moc za spolupráci.</p>
<blockquote>
</blockquote>
<h1>Příklad 2: Inspirujme</h1>
<p><strong>Background:</strong> Klienta nám tvoří bannery (to už se v budoucnu snad moc dít nebude). Není profesionální grafička a navíc nemá času nazbyt. </p>
<p><strong>Reálná situace:</strong></p>
<p><img src="Jak%20na%20je%C5%A1t%C4%9B%20lep%C5%A1%C3%AD%20komunikaci%20s%20klientem/Snimek_obrazovky_2024-09-18_v_16.40.42.png" alt="Snímek obrazovky 2024-09-18 v 16.40.42.png"></p>
<p><strong>❌ Popis situace ❌</strong></p>
<p>Klientka nemá čas a není grafik.</p>
<p>Klientka má v jednom komentáři za úkol vytvořit “nějaký takový” banner.  Klienta nezná z hlavy rozměry bannerů. </p>
<p>Správně od nás klientka dostává seznam produktů, ale je jich moc najednou.</p>
<p>Potřeba návrh více rozpracovat a dát ji konkrétní tip, co na banneru má být. Stejně jako to děláme u našich grafiků.</p>
<p><strong>Preferovaná situace</strong></p>
<blockquote>
<p>Dobrý den, rádi bychom vás poprosili o vytvoření obecných bannerů, které dáme do dlouhodobých prodejních kampaní.<br>Začal bych nejprodávanějším produktem za posledních 30 dní podle administrace – <strong>jméno produktu.</strong><br>Na banneru by mělo (například) zaznít:</p>
</blockquote>
<ol>
<li>Název produktu</li>
<li>Bestseller</li>
<li>Cena před a po </li>
<li>Objednejte nyní<br>Zde posílám ukázku od klienta, kterému jsme připravovali podobný banner, tak se můžete inspirovat.<br><strong>[poslat printscreen reklamy, kterou jsme dělali my 👉🏻 inspirace + prodáváme své služby)</strong></li>
</ol>
<blockquote>
</blockquote>
<h1>Příklad 3: [budu doplňovat]</h1>
<p><strong>Background:</strong> </p>
<p><strong>❌ Popis situace ❌</strong></p>
<p><strong>Preferovaná situace</strong></p>
',
'Příklad 1: Z naší nevýhody udělejme výhodu Background: Klient si chystá vše sám pro akci. Úkolem projekťáka je klienta nabriefovat a zajistit vše pro specialisty. V tomto případě se zapomnělo na dodání textů. Meta Ads specialista využil textace z minulého roku ze stejné akce, jen poupravil data a procentuální slevu. Reálná situace: !Snímek obrazovky 2024-09-18 v 16.23.19.png ❌ Popis situace ❌ Klient se dozvídá v den spuštění akce, že zapomněl ještě dodat texty, přičemž copywriter je na dovolené. Klient není naštvaný na sebe, klient je naštvaný na Socials, protože agentura si měla vyžádat vše potřebné. Preferovaná komunikace Vím, že jsem jako projektový manažer udělal chybu, ale využiju to ve svůj prospěch. Udělám si printscreen běžících reklam. Klientovi komunikuji následující: Dobrý den, kampaně běží dle domluvy. 😊 Stejná akce běžela také minulý rok, takže jsme si říkali, že vám ušetříme čas psaním textů a jen jsme oprášili texty z minulého roku. Posílám screenshot reklamy: [vložené printscreeny reklam] Můžeme takto ponechat? Pokud ne, klidně mi ještě pošlete své texty a dnes reklamy aktualizujeme. Děkuji moc za spolupráci. Příklad 2: Inspirujme Background: Klienta nám tvoří bannery (to už se v budoucnu snad moc dít nebude). Není profesionální grafička a navíc nemá času nazbyt. Reálná situace: !Snímek obrazovky 2024-09-18 v 16.40.42.png ❌ Popis situace ❌ Klientka nemá čas a není grafik. Klientka má v jednom komentáři za úkol vytvořit “nějaký takový” banner. Klienta nezná z hlavy rozměry bannerů. Správně od nás klientka dostává seznam produktů, ale je jich moc najednou. Potřeba návrh více rozpracovat a dát ji konkrétní tip, co na banneru má být. Stejně jako to děláme u našich grafiků. Preferovaná situace Dobrý den, rádi bychom vás poprosili o vytvoření obecných bannerů, které dáme do dlouhodobých prodejních kampaní. Začal bych nejprodávanějším produktem za posledních 30 dní podle administrace – jméno produktu. Na banneru by mělo (například) zaznít: Název produktu Bestseller Cena před a po Objednejte nyní Zde posílám ukázku od klienta, kterému jsme připravovali podobný banner, tak se můžete inspirovat. [poslat printscreen reklamy, kterou jsme dělali my 👉🏻 inspirace + prodáváme své služby) Příklad 3: [budu doplňovat] Background: ❌ Popis situace ❌ Preferovaná situace',
12,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'57255976-114f-4f2d-b6de-08ab4b8eb2ae',
'11111111-1111-1111-1111-111111111101',
'Jak nacenit a evidovat vícepráce u klientů',
'<h3><strong>Definice Vícepráce</strong></h3>
<p>Vícepráce je jednorázová služba, která není součástí fixní ceny za správu nebo základního balíčku.</p>
<h2><strong>Postup pro realizaci víceprací</strong></h2>
<h3><strong>1. Identifikace potřeby u klienta</strong></h3>
<ul>
<li><strong>Zodpovědná osoba</strong>: Projekťák.</li>
<li>Projekťák identifikuje potřebu vícepráce u klienta.</li>
<li>Požádá specialistu o <strong>časový odhad</strong>, který se následně vynásobí hodinovou sazbou pro danou pozici.</li>
</ul>
<table>
<thead>
<tr>
<th><strong>Pozice</strong></th>
<th><strong>Hodinovka (baseline)</strong></th>
</tr>
</thead>
<tbody><tr>
<td><strong>Meta Ads</strong></td>
<td><strong>1 700 Kč</strong></td>
</tr>
<tr>
<td><strong>PPC</strong></td>
<td><strong>1 700 Kč</strong></td>
</tr>
<tr>
<td><strong>Analytika</strong></td>
<td><strong>1 900 Kč</strong></td>
</tr>
<tr>
<td><strong>Grafika / video</strong></td>
<td><strong>1 500 Kč</strong></td>
</tr>
<tr>
<td><strong>SEO</strong></td>
<td><strong>1 500 Kč</strong></td>
</tr>
<tr>
<td><strong>Tvorba landing pages pomocí AI</strong></td>
<td><strong>2 500 Kč</strong></td>
</tr>
<tr>
<td><strong>AI SEO</strong></td>
<td><strong>1 800 Kč</strong></td>
</tr>
</tbody></table>
<h3><strong>2. Nacenění vícepráce</strong></h3>
<ul>
<li><strong>Zodpovědná osoba</strong>: Projekťák.</li>
<li>Vícepráce se <strong>vždy naceňuje hodinovou sazbou</strong>, nikdy není součástí ceníku jako Flat Fee.</li>
<li><strong>Do 20 000 Kč</strong> → Projekťák může vícepráci schválit a nacenit samostatně.</li>
<li><strong>Nad 20 000 Kč</strong> → Projekťák zašle odhad <strong>Danielu Bauerovi</strong> ke schválení.</li>
<li>Nacenění probíhá takto:<ol>
<li>Projekťák získá od specialisty <strong>časový odhad</strong>.</li>
<li>Násobí se hodinovou sazbou dle role specialisty.</li>
<li>Připravenou nabídku projekťák prezentuje klientovi k odsouhlasení.</li>
</ol>
</li>
</ul>
<hr>
<h3><strong>3. Schválení vícepráce klientem</strong></h3>
<ul>
<li><strong>Zodpovědná osoba</strong>: Projekťák.</li>
<li>Projekťák prezentuje nacenění klientovi a získá <strong>písemné schválení</strong> (Freelo, e-mail, Slack).</li>
<li><strong>Důležité</strong>: Dokud klient vícepráci neodsouhlasí, práce nezačne.</li>
<li>Po schválení zašle projekťák podrobnosti do <strong>Freela</strong>, kde eviduje zadání a přidělí odpovědnou osobu.</li>
</ul>
<hr>
<h3><strong>4. Evidence a fakturace vícepráce</strong></h3>
<ul>
<li><strong>Zodpovědná osoba</strong>: Projekťák.</li>
<li><strong>Všechny vícepráce musí být evidovány ve Freelu</strong> – včetně schválené ceny, specialisty a termínu dokončení.</li>
<li>Vícepráce se fakturuje <strong>po dokončení</strong> na základě evidence ve Freelu.</li>
<li><strong>Fixed Fee produkty se do Freela neevidují, ale přidávají se do Raynetu</strong> pro měsíční fakturaci.</li>
<li>Projekťák zašle shrnutí vícepráce <strong>Daně Bauerové</strong> do Slacku, pokud jde o Fixed Fee.</li>
</ul>
<h2><strong>Postup evidence ve Freelu</strong></h2>
<ol>
<li><p>Vícepráce musí mít svůj vlastní úkol ve Freelu. Pokud se vícepráce domluví s klientem na meetingu a nebo v jiném vlákně ve Freelu, musí projekťák založit nový úkol v to-do listu “<em>Vícepráce</em>” a pojmenovat ho podle vícepráce, tzn. například: “<em>Nastavení Google Tag Manager”.</em> </p>
</li>
<li><p>Ve chvíli odsouhlasení se musí přidat v úkolu ve Freelu štítek “<em>Vícepráce - odsouhlaseno</em>” a zapíše se celková domluvená částka.</p>
<p> <img src="Jak%20nacenit%20a%20evidovat%20v%C3%ADcepr%C3%A1ce%20u%20klient%C5%AF/Screenshot_2025-02-25_at_20.20.35.png" alt="Screenshot 2025-02-25 at 20.20.35.png"></p>
</li>
<li><p>Po dokončení práce se musí dát label “Vícepráce dokončena” a zavřít úkol, aby došlo k jeho automatickému vyfakturování.</p>
<p> <img src="Jak%20nacenit%20a%20evidovat%20v%C3%ADcepr%C3%A1ce%20u%20klient%C5%AF/Screenshot_2025-02-25_at_20.21.21.png" alt="Screenshot 2025-02-25 at 20.21.21.png"></p>
</li>
</ol>
<p><a href="https://www.loom.com/share/5a54f8df205644a6b94eaa38031647e0?sid=35bc1aa3-bbf7-4e79-bd4a-5d396c601804">https://www.loom.com/share/5a54f8df205644a6b94eaa38031647e0?sid=35bc1aa3-bbf7-4e79-bd4a-5d396c601804</a></p>
<h2>Evidence víceprací (Specialista)</h2>
<p>Specialista si dopíše vícepráci do svého výkazu včetně počtu hodin (pokud bylo hodinově) a částky.</p>
<h2>Nejčastější dotazy ohledně víceprací</h2>
<h3>FAQ: Evidence víceprací</h3>
<hr>
<h3><strong>1. Co je vícepráce?</strong></h3>
<p>Vícepráce je jednorázová služba, která není zahrnuta v základním balíčku služeb nebo fixní ceně za správu. Příklady: příprava reklamních videí, SEO audit, nastavení analytiky.</p>
<hr>
<h3><strong>2. Jak poznám, že se jedná o vícepráci?</strong></h3>
<p>Jedná se o vícepráci, pokud:</p>
<ul>
<li>Klient službu neobjednal jako součást základní správy.</li>
<li>Služba je jednorázová nebo nad rámec běžných úkolů.</li>
</ul>
<hr>
<h3><strong>3. Kdo je zodpovědný za nacenění vícepráce?</strong></h3>
<p>Za nacenění vícepráce odpovídá Sales Manager (aktuálně <strong>Daniel Bauer</strong>). Projekťák pouze identifikuje potřebu vícepráce a předává ji k nacenění.</p>
<hr>
<h3><strong>4. Jaké kroky musím udělat, když identifikuji vícepráci?</strong></h3>
<ol>
<li>Založ úkol ve Freelu v to-do listu <strong>&quot;Vícepráce&quot;</strong>.</li>
<li>Pošli požadavek na nacenění Sales Managerovi.</li>
<li>Po schválení klientem přidej štítek <strong>“Vícepráce - odsouhlaseno”</strong>.</li>
</ol>
<hr>
<h3><strong>5. Jak postupovat, když je vícepráce schválena?</strong></h3>
<ul>
<li>Přidej do úkolu ve Freelu štítek <strong>&quot;Vícepráce - odsouhlaseno&quot;</strong>.</li>
<li>Po dokončení práce zapiš finální čas a cenu do výkazu ve Freelu a označ úkol ja ko dokončený.</li>
</ul>
<hr>
<h3><strong>7. Co když je potřeba vyřešit interní problém v rámci vícepráce?</strong></h3>
<ul>
<li>Pokud je úkol ve Freelu viditelný pro klienta, interní diskuzi veď mimo tento úkol (např. v Slacku nebo v odděleném úkolu).</li>
</ul>
<hr>
<h3><strong>8. Jak se vícepráce účtuje?</strong></h3>
<p>Vícepráce může být účtována:</p>
<ul>
<li><strong>Flat fee</strong>, pokud je položka v ceníku.</li>
<li><strong>Hodinovou sazbou</strong>, pokud položka není v ceníku. V tomto případě se používá časový odhad od specialisty.</li>
</ul>
<hr>
<h3><strong>9. Kdo zadává vícepráci specialistovi?</strong></h3>
<p>Po schválení klientem zadává vícepráci specialistovi přímo projekťák. Specialistu informuje o časovém odhadu a požadovaném termínu.</p>
<hr>
<h3><strong>10. Co má udělat specialista po dokončení vícepráce?</strong></h3>
<ul>
<li>Doplnit počet hodin do svého výkazu a do úkolu ve Freelu.</li>
</ul>
<hr>
<h3><strong>11. Co dělat, když klient vícepráci neschválí?</strong></h3>
<ul>
<li>Pokud klient vícepráci odmítne, práci nezahajuj.</li>
<li>O této skutečnosti zaznamenej poznámku v úkolu ve Freelu a uzavři jej bez dalších kroků.</li>
</ul>
<hr>
<h3><strong>12. Jak často je potřeba kontrolovat vícepráce?</strong></h3>
<ul>
<li>Projekťák by měl kontrolovat vícepráce při pravidelném reportování projektů (např. na týdenní nebo měsíční bázi).</li>
</ul>
<hr>
<h3><strong>13. Co dělat, pokud se vícepráce týká většího týmu?</strong></h3>
<ul>
<li>Ve Freelu vytvoř podrobný popis úkolu, aby každý člen týmu měl jasno, co má dělat.</li>
<li>Sdílej veškeré důležité informace, odkazy a podklady přímo v úkolu.</li>
</ul>
<hr>
<h3><strong>14. Kde najdu všechny vícepráce pro daného klienta?</strong></h3>
<ul>
<li>Ve Freelu v to-do listu <strong>&quot;Vícepráce&quot;</strong> pro konkrétní projekt.</li>
</ul>
<hr>
<p>Pokud máš další dotazy, ozvi se přímo na @Daniel Bauer nebo svůj dotaz napiš do vlákna v rámci úkolu ve Freelu. 😊</p>
<h2>Záznam školení o evidenci víceprací</h2>
<p><a href="https://tldv.io/app/meetings/691341647ed558001310c1be/">https://tldv.io/app/meetings/691341647ed558001310c1be/</a></p>
',
'Definice Vícepráce Vícepráce je jednorázová služba, která není součástí fixní ceny za správu nebo základního balíčku. Postup pro realizaci víceprací Identifikace potřeby u klienta Zodpovědná osoba: Projekťák. Projekťák identifikuje potřebu vícepráce u klienta. Požádá specialistu o časový odhad, který se následně vynásobí hodinovou sazbou pro danou pozici. | Pozice | Hodinovka (baseline) | | --| --| | Meta Ads | 1 700 Kč | | PPC | 1 700 Kč | | Analytika | 1 900 Kč | | Grafika / video | 1 500 Kč | | SEO | 1 500 Kč | | Tvorba landing pages pomocí AI | 2 500 Kč | | AI SEO | 1 800 Kč | Nacenění vícepráce Zodpovědná osoba: Projekťák. Vícepráce se vždy naceňuje hodinovou sazbou, nikdy není součástí ceníku jako Flat Fee. Do 20 000 Kč → Projekťák může vícepráci schválit a nacenit samostatně. Nad 20 000 Kč → Projekťák zašle odhad Danielu Bauerovi ke schválení. Nacenění probíhá takto: Projekťák získá od specialisty časový odhad. Násobí se hodinovou sazbou dle role specialisty. Připravenou nabídku projekťák prezentuje klientovi k odsouhlasení. --Schválení vícepráce klientem Zodpovědná osoba: Projekťák. Projekťák prezentuje nacenění klientovi a získá písemné schválení (Freelo, e-mail, Slack). Důležité: Dokud klient vícepráci neodsouhlasí, práce nezačne. Po schválení zašle projekťák podrobnosti do Freela, kde eviduje zadání a přidělí odpovědnou osobu. --Evidence a fakturace vícepráce Zodpovědná osoba: Projekťák. Všechny vícepráce musí být evidovány ve Freelu – včetně schválené ceny, specialisty a termínu dokončení. Vícepráce se fakturuje po dokončení na základě evidence ve Freelu. Fixed Fee produkty se do Freela neevidují, ale přidávají se do Raynetu pro měsíční fakturaci. Projekťák zašle shrnutí vícepráce Daně Bauerové do Slacku, pokud jde o Fixed Fee. Postup evidence ve Freelu Vícepráce musí mít svůj vlastní úkol ve Freelu. Pokud se vícepráce domluví s klientem na meetingu a nebo v jiném vlákně ve Freelu, musí projekťák založit nový úkol v to-do listu “Vícepráce” a pojmenovat ho podle vícepráce, tzn. například: “Nastavení Google Tag Manager”. Ve chvíli odsouhlasení se musí přidat v úkolu ve Freelu štítek “Vícepráce odsouhlaseno” a zapíše se celková domluvená částka. !Screenshot 2025-02-25 at 20.20.35.png Po dokončení práce se musí dát label “Vícepráce dokončena” a zavřít úkol, aby došlo k jeho automatickému vyfakturování. !Screenshot 2025-02-25 at 20.21.21.png https://www.loom.com/share/5a54f8df205644a6b94eaa38031647e0?sid=35bc1aa3-bbf7-4e79-bd4a-5d396c601804 Evidence víceprací (Specialista) Specialista si dopíše vícepráci do svého výkazu včetně počtu hodin (pokud bylo hodinově) a částky. Nejčastější dotazy ohledně víceprací FAQ: Evidence víceprací --Co je vícepráce? Vícepráce je jednorázová služba, která není zahrnuta v základním balíčku služeb nebo fixní ceně za správu. Příklady: příprava reklamních videí, SEO audit, nastavení analytiky. --Jak poznám, že se jedná o vícepráci? Jedná se o vícepráci, pokud: Klient službu neobjednal jako součást základní správy. Služba je jednorázová nebo nad rámec běžných úkolů. --Kdo je zodpovědný za nacenění vícepráce? Za nacenění vícepráce odpovídá Sales Manager (aktuálně Daniel Bauer). Projekťák pouze identifikuje potřebu vícepráce a předává ji k nacenění. --Jaké kroky musím udělat, když identifikuji vícepráci? Založ úkol ve Freelu v to-do listu "Vícepráce". Pošli požadavek na nacenění Sales Managerovi. Po schválení klientem přidej štítek “Vícepráce odsouhlaseno”. --Jak postupovat, když je vícepráce schválena? Přidej do úkolu ve Freelu štítek "Vícepráce odsouhlaseno". Po dokončení práce zapiš finální čas a cenu do výkazu ve Freelu a označ úkol ja ko dokončený. --Co když je potřeba vyřešit interní problém v rámci vícepráce? Pokud je úkol ve Freelu viditelný pro klienta, interní diskuzi veď mimo tento úkol (např. v Slacku nebo v odděleném úkolu). --Jak se vícepráce účtuje? Vícepráce může být účtována: Flat fee, pokud je položka v ceníku. Hodinovou sazbou, pokud položka není v ceníku. V tomto případě se používá časový odhad od specialisty. --Kdo zadává vícepráci specialistovi? Po schválení klientem zadává vícepráci specialistovi přímo projekťák. Specialistu informuje o časovém odhadu a požadovaném termínu. --Co má udělat specialista po dokončení vícepráce? Doplnit počet hodin do svého výkazu a do úkolu ve Freelu. --Co dělat, když klient vícepráci neschválí? Pokud klient vícepráci odmítne, práci nezahajuj. O této skutečnosti zaznamenej poznámku v úkolu ve Freelu a uzavři jej bez dalších kroků. --Jak často je potřeba kontrolovat vícepráce? Projekťák by měl kontrolovat vícepráce při pravidelném reportování projektů (např. na týdenní nebo měsíční bázi). --Co dělat, pokud se vícepráce týká většího týmu? Ve Freelu vytvoř podrobný popis úkolu, aby každý člen týmu měl jasno, co má dělat. Sdílej veškeré důležité informace, odkazy a podklady přímo v úkolu. --Kde najdu všechny vícepráce pro daného klienta? Ve Freelu v to-do listu "Vícepráce" pro konkrétní projekt. --Pokud máš další dotazy, ozvi s',
13,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'2557d970-2963-468b-a274-4c2f47ed9632',
'11111111-1111-1111-1111-111111111103',
'Jak reportovat klientovi?',
'<hr>
<h2>SOP: Jak vést reportovací meeting s klientem</h2>
<h1>Cíl meetingu</h1>
<ul>
<li>Vyhodnotit výsledky a splněné aktivity.</li>
<li>Sladit si pohled na data.</li>
<li>Domluvit konkrétní kroky do dalšího období.</li>
<li>Zajistit spolupráci na klíčových úkolech.</li>
</ul>
<hr>
<h1>1. Před meetingem</h1>
<ul>
<li>Odešli report do Freela min. 1 den před meetingem.</li>
<li>Připrav si agendu a klíčové poznámky. Sdílej s klientem min. 1 den před.</li>
<li>Ujisti se, že znáš aktuální stav úkolů, posledně domluvené KPI a očekávání klienta.</li>
</ul>
<hr>
<h1>2. Průběh meetingu</h1>
<h3>Úvod (max. 5 minut)</h3>
<ul>
<li>Stanov jasně cíl schůzky (např. “Dnes se podíváme na výsledky za březen, porovnáme je s našimi cíli a naplánujeme hlavní aktivity na duben.”).</li>
<li>Zeptej se klienta na jeho pohled na uplynulé období: “Jaké máte z minulého měsíce dojmy vy?”</li>
</ul>
<h3>Validace dat</h3>
<ul>
<li>Potvrď si, že data v reportu sedí s realitou klienta.</li>
</ul>
<h3>Shrnutí klíčových aktivit</h3>
<ul>
<li>Pokud proběhly větší akce (bannery, testy, zásadní změny v kampaních, technické zásahy), stručně shrň výsledek a poučení.<ul>
<li>Vyvaruj se detailní rekapitulace v optimalizacích kampaní, tzn. soustřeď se jen na fakta, výsledky, dopady.</li>
</ul>
</li>
</ul>
<h3>Fokus na budoucnost</h3>
<ul>
<li>Řekni konkrétně, co se bude dít dál. Např.:<ul>
<li>“V dubnu spouštíme novou sadu kreativ na Meta Ads – termín: 10. 4.”</li>
<li>“Zkusíme povolit PNO z 20 na 25 % a otestovat si vliv povolení na obrat – termín vyhodnocení: 20.4.”</li>
<li>“Testujeme nový bidding v Google Ads – test poběží do 18. 4.”</li>
</ul>
</li>
<li>Projdi otevřené úkoly, které čekají na klienta. Požádej o spolupráci:<ul>
<li>“Potřebujeme dodat podklady ke kampani XY – termín odevzdání: 5. 4.”</li>
</ul>
</li>
</ul>
<h3>Zpětná vazba</h3>
<ul>
<li>Požádej o stručné zhodnocení spolupráce:<ul>
<li>“Je něco, co vám na naší spolupráci chybí, nebo co můžeme zlepšit?”</li>
<li>“Plníme to, co od spolupráce očekáváte?”</li>
</ul>
</li>
</ul>
<hr>
<h1>3. Po meetingu</h1>
<ul>
<li>Zapiš klíčové body do Freela (úkol nebo komentář).</li>
<li><strong>🔥 V každém zápisu explicitně uveď: jaké bylo domluvené PNO, cílový obrat, zdali plníme či neplníme, naše doporučení, případná rizika a další kroky, které uděláme.</strong></li>
<li>Vytvoř úkoly s pevnými termíny – i pro klienta.</li>
<li>🔥 <strong>Pošli zápis klientovi ke schválení.</strong></li>
<li>Sleduj follow-up úkoly.</li>
</ul>
<hr>
<h1>Standardizovaná šablona</h1>
<p>Dobrý den [jméno klienta],</p>
<p>posílám stručný slovní souhrn výsledků za [doplnit období].</p>
<p><strong>SHRNUTÍ VÝSLEDKŮ ZA [např. 04/2025]</strong></p>
<p><strong>Klíčové metriky:</strong></p>
<ul>
<li>Cílové PNO:</li>
<li>Výsledné PNO:</li>
<li>Cílový obrat:</li>
<li>Výsledný obrat:</li>
</ul>
<p><strong>Hlavní zjištění:</strong></p>
<ul>
<li><p><strong>[HLAVNÍ INSIGHT 1]</strong> - [STRUČNÝ POPIS A INTERPRETACE]</p>
<p>  Např.:<br>  Produktové kategorie “Sportovní vybavení” generuje nejlepší PNO 12,3 %. Doporučujeme připravit prodejní videa na tuto kategorii.</p>
</li>
<li><p><strong>[HLAVNÍ INSIGHT 2]</strong> - [STRUČNÝ POPIS A INTERPRETACE]</p>
<p>  Akce na Black Friday se vydařila – investovali jsme 100,000 Kč, splnili PNO do 20 % a překonali historický rekord na e-shopu. </p>
</li>
<li><p><strong>[HLAVNÍ INSIGHT 3]</strong> - [STRUČNÝ POPIS A INTERPRETACE]</p>
<p>  Zavedené UX úpravy na produktových stránkách bestsellerů se začínají projevovat do efektivity kampaní, s předchozím měsícem vidíme nárůst konverzního poměru o 10 %.</p>
</li>
</ul>
<p><strong>Plán na další období:</strong></p>
<ul>
<li>Cílový obrat: <em>[pokud není stanoveno, nutno si od klienta vyžádat]</em></li>
<li>Cílové PNO: <em>[pokud není stanoveno, nutno si od klienta vyžádat]</em></li>
<li>Stručný popis našich doporučení / rizik, atp.</li>
<li>Návrh na úpravu rozpočtu – popis, důvod, možný dopad (<em>pokud relevantní</em>):</li>
</ul>
<h2>Další</h2>
<p><em>Pokud relevantní, stačí případně zkopírovat url adresy na konkrétní úkoly ve Freelo.</em></p>
<p>Co potřebujeme od vás pro úspěšnou realizaci plánu:</p>
<h2>Zpětná vazba od klienta</h2>
<p>Stručný popis zpětné vazby.</p>
<p>Naše reakce a případný plán řešení.</p>
<h2>Potvrzení zápisu</h2>
<p>Prosíme o potvrzení zápisu a dohodnutých kroků do [DATUM].</p>
<hr>
<h2>Důležité zásady</h2>
<ul>
<li>Mluv 20 %, naslouchej 80 %.</li>
<li>Minulost řeš jen stručně a kvůli ponaučení.</li>
<li>Věnuj 70 % času plánování dalších kroků.</li>
<li>Žádná domněnkologie, svá tvrzení podkládej čísly.</li>
<li>Meeting zakonči včas, bez řešení operativních problémů – ty patří na separátní schůzku.</li>
</ul>
',
'--SOP: Jak vést reportovací meeting s klientem Cíl meetingu Vyhodnotit výsledky a splněné aktivity. Sladit si pohled na data. Domluvit konkrétní kroky do dalšího období. Zajistit spolupráci na klíčových úkolech. --Před meetingem Odešli report do Freela min. 1 den před meetingem. Připrav si agendu a klíčové poznámky. Sdílej s klientem min. 1 den před. Ujisti se, že znáš aktuální stav úkolů, posledně domluvené KPI a očekávání klienta. --Průběh meetingu Úvod (max. 5 minut) Stanov jasně cíl schůzky (např. “Dnes se podíváme na výsledky za březen, porovnáme je s našimi cíli a naplánujeme hlavní aktivity na duben.”). Zeptej se klienta na jeho pohled na uplynulé období: “Jaké máte z minulého měsíce dojmy vy?” Validace dat Potvrď si, že data v reportu sedí s realitou klienta. Shrnutí klíčových aktivit Pokud proběhly větší akce (bannery, testy, zásadní změny v kampaních, technické zásahy), stručně shrň výsledek a poučení. Vyvaruj se detailní rekapitulace v optimalizacích kampaní, tzn. soustřeď se jen na fakta, výsledky, dopady. Fokus na budoucnost Řekni konkrétně, co se bude dít dál. Např.: “V dubnu spouštíme novou sadu kreativ na Meta Ads – termín: 4.” “Zkusíme povolit PNO z 20 na 25 % a otestovat si vliv povolení na obrat – termín vyhodnocení: 20.4.” “Testujeme nový bidding v Google Ads – test poběží do 4.” Projdi otevřené úkoly, které čekají na klienta. Požádej o spolupráci: “Potřebujeme dodat podklady ke kampani XY – termín odevzdání: 4.” Zpětná vazba Požádej o stručné zhodnocení spolupráce: “Je něco, co vám na naší spolupráci chybí, nebo co můžeme zlepšit?” “Plníme to, co od spolupráce očekáváte?” --Po meetingu Zapiš klíčové body do Freela (úkol nebo komentář). 🔥 V každém zápisu explicitně uveď: jaké bylo domluvené PNO, cílový obrat, zdali plníme či neplníme, naše doporučení, případná rizika a další kroky, které uděláme. Vytvoř úkoly s pevnými termíny – i pro klienta. 🔥 Pošli zápis klientovi ke schválení. Sleduj follow-up úkoly. --Standardizovaná šablona Dobrý den [jméno klienta], posílám stručný slovní souhrn výsledků za [doplnit období]. SHRNUTÍ VÝSLEDKŮ ZA [např. 04/2025] Klíčové metriky: Cílové PNO: Výsledné PNO: Cílový obrat: Výsledný obrat: Hlavní zjištění: [HLAVNÍ INSIGHT 1] [STRUČNÝ POPIS A INTERPRETACE] Např.: Produktové kategorie “Sportovní vybavení” generuje nejlepší PNO 12,3 %. Doporučujeme připravit prodejní videa na tuto kategorii. [HLAVNÍ INSIGHT 2] [STRUČNÝ POPIS A INTERPRETACE] Akce na Black Friday se vydařila – investovali jsme 100,000 Kč, splnili PNO do 20 % a překonali historický rekord na e-shopu. [HLAVNÍ INSIGHT 3] [STRUČNÝ POPIS A INTERPRETACE] Zavedené UX úpravy na produktových stránkách bestsellerů se začínají projevovat do efektivity kampaní, s předchozím měsícem vidíme nárůst konverzního poměru o 10 %. Plán na další období: Cílový obrat: [pokud není stanoveno, nutno si od klienta vyžádat] Cílové PNO: [pokud není stanoveno, nutno si od klienta vyžádat] Stručný popis našich doporučení / rizik, atp. Návrh na úpravu rozpočtu – popis, důvod, možný dopad (pokud relevantní): Další Pokud relevantní, stačí případně zkopírovat url adresy na konkrétní úkoly ve Freelo. Co potřebujeme od vás pro úspěšnou realizaci plánu: Zpětná vazba od klienta Stručný popis zpětné vazby. Naše reakce a případný plán řešení. Potvrzení zápisu Prosíme o potvrzení zápisu a dohodnutých kroků do [DATUM]. --Důležité zásady Mluv 20 %, naslouchej 80 %. Minulost řeš jen stručně a kvůli ponaučení. Věnuj 70 % času plánování dalších kroků. Žádná domněnkologie, svá tvrzení podkládej čísly. Meeting zakonči včas, bez řešení operativních problémů – ty patří na separátní schůzku.',
14,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'72fa23b3-cc05-4dfe-adf1-1ad54ec7bd02',
'11111111-1111-1111-1111-111111111101',
'Jak sdílíme know-how v Socials',
'<h3><strong>Úvod</strong></h3>
<p>V Socials je sdílení know-how o procesech a zásadních změnách klíčovým prvkem efektivního fungování firmy. Tento dokument popisuje současný způsob, jakým sdílíme informace, aby byly dostupné všem členům týmu.</p>
<hr>
<h3><strong>Způsoby sdílení know-how</strong></h3>
<h3><strong>1. Vše dokumentujeme v rámci SOP</strong></h3>
<ul>
<li><strong>Co to je?</strong><ul>
<li>SOPs (Standard Operating Procedures) jsou centrální dokumenty, které popisují jednotlivé procesy v Socials.</li>
</ul>
</li>
<li><strong>Kde je najdeš?</strong><ul>
<li>SOPs jsou uloženy v centrální databázi na <strong>Notion</strong> (nebo jiné platformě, pokud používáme jiný systém).</li>
</ul>
</li>
<li><strong>Jak se aktualizují?</strong><ul>
<li>Při každé významné změně procesu je aktualizována příslušná SOP. O této změně se tým dozví prostřednictvím Slack kanálu (viz níže).</li>
</ul>
</li>
<li><strong>Jak se k nim dostaneš?</strong><ul>
<li>Každý člen týmu má přístup k SOPs, které se týkají jeho role, a může je využívat při své práci.</li>
</ul>
</li>
</ul>
<hr>
<h3><strong>2. Slack kanál pro sdílení know-how</strong></h3>
<ul>
<li><strong>Co to je?</strong><ul>
<li>Slack kanál <strong>#know-how-updates</strong> slouží k asynchronnímu sdílení informací o novinkách a změnách v procesech.</li>
</ul>
</li>
<li><strong>Jak to funguje?</strong><ul>
<li>Každá aktualizace procesů nebo novinka je oznámena v tomto kanálu.</li>
<li>Oznámení obsahuje:<ul>
<li>Popis změny.</li>
<li>Důvod změny.</li>
<li>Odkaz na aktualizovaný dokument (např. SOP v Notion).</li>
</ul>
</li>
<li>Kanál je otevřený pro všechny členy týmu, kteří mohou komentovat a dávat zpětnou vazbu.</li>
</ul>
</li>
</ul>
<hr>
<h3><strong>3. Společné měsíční call-y</strong></h3>
<ul>
<li><strong>Co to je?</strong><ul>
<li>Pravidelné měsíční hovory, během kterých se tým seznamuje se zásadními změnami, novými procesy a zajímavými use cases.</li>
</ul>
</li>
<li><strong>Jak to funguje?</strong><ul>
<li><strong>Frekvence</strong>: Jednou měsíčně, pevný termín.</li>
<li><strong>Agenda callu</strong>:<ol>
<li>Shrnutí zásadních změn v procesech.</li>
<li>Diskuze nad zpětnou vazbou od týmu.</li>
<li>Prezentace zajímavých projektových případů (use cases) členy týmu.</li>
</ol>
</li>
<li><strong>Výstup</strong>: Zápis z callu se sdílí v kanálu <strong>#know-how-updates</strong>.</li>
</ul>
</li>
</ul>
<hr>
<h3><strong>Shrnutí workflow sdílení know-how</strong></h3>
<ol>
<li><strong>Změna procesu</strong>:<ul>
<li>Aktualizuj příslušný SOP dokument.</li>
<li>Oznámení o změně sdílej v Slack kanálu <strong>#know-how-updates</strong>.</li>
</ul>
</li>
<li><strong>Diskuze a zpětná vazba</strong>:<ul>
<li>Odpověz na případné dotazy nebo návrhy v kanálu.</li>
</ul>
</li>
<li><strong>Měsíční synchronizace</strong>:<ul>
<li>Během společného callu seznám tým se změnami a zajisti, že jsou procesy jasné.</li>
</ul>
</li>
<li><strong>Pravidelná kontrola</strong>:<ul>
<li>Udržuj SOPs aktuální a přístupné.</li>
</ul>
</li>
</ol>
<hr>
<h3><strong>Přínosy tohoto přístupu</strong></h3>
<ul>
<li>Transparentní komunikace mezi členy týmu.</li>
<li>Snadný přístup k aktuálním informacím a postupům.</li>
<li>Možnost kontinuálního zlepšování na základě zpětné vazby.</li>
<li>Minimalizace chyb způsobených nedorozuměním.</li>
</ul>
<hr>
<p>Je tento postup srozumitelný? Pokud potřebuješ další úpravy nebo rozšíření, dej vědět.</p>
',
'Úvod V Socials je sdílení know-how o procesech a zásadních změnách klíčovým prvkem efektivního fungování firmy. Tento dokument popisuje současný způsob, jakým sdílíme informace, aby byly dostupné všem členům týmu. --Způsoby sdílení know-how Vše dokumentujeme v rámci SOP Co to je? SOPs (Standard Operating Procedures) jsou centrální dokumenty, které popisují jednotlivé procesy v Socials. Kde je najdeš? SOPs jsou uloženy v centrální databázi na Notion (nebo jiné platformě, pokud používáme jiný systém). Jak se aktualizují? Při každé významné změně procesu je aktualizována příslušná SOP. O této změně se tým dozví prostřednictvím Slack kanálu (viz níže). Jak se k nim dostaneš? Každý člen týmu má přístup k SOPs, které se týkají jeho role, a může je využívat při své práci. --Slack kanál pro sdílení know-how Co to je? Slack kanál #know-how-updates slouží k asynchronnímu sdílení informací o novinkách a změnách v procesech. Jak to funguje? Každá aktualizace procesů nebo novinka je oznámena v tomto kanálu. Oznámení obsahuje: Popis změny. Důvod změny. Odkaz na aktualizovaný dokument (např. SOP v Notion). Kanál je otevřený pro všechny členy týmu, kteří mohou komentovat a dávat zpětnou vazbu. --Společné měsíční call-y Co to je? Pravidelné měsíční hovory, během kterých se tým seznamuje se zásadními změnami, novými procesy a zajímavými use cases. Jak to funguje? Frekvence: Jednou měsíčně, pevný termín. Agenda callu: Shrnutí zásadních změn v procesech. Diskuze nad zpětnou vazbou od týmu. Prezentace zajímavých projektových případů (use cases) členy týmu. Výstup: Zápis z callu se sdílí v kanálu #know-how-updates. --Shrnutí workflow sdílení know-how Změna procesu: Aktualizuj příslušný SOP dokument. Oznámení o změně sdílej v Slack kanálu #know-how-updates. Diskuze a zpětná vazba: Odpověz na případné dotazy nebo návrhy v kanálu. Měsíční synchronizace: Během společného callu seznám tým se změnami a zajisti, že jsou procesy jasné. Pravidelná kontrola: Udržuj SOPs aktuální a přístupné. --Přínosy tohoto přístupu Transparentní komunikace mezi členy týmu. Snadný přístup k aktuálním informacím a postupům. Možnost kontinuálního zlepšování na základě zpětné vazby. Minimalizace chyb způsobených nedorozuměním. --Je tento postup srozumitelný? Pokud potřebuješ další úpravy nebo rozšíření, dej vědět.',
15,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'ccb90c84-51f1-416a-a469-4c9e299d3d3c',
'11111111-1111-1111-1111-111111111101',
'Jak vyplňovat výkazy práce',
'<p>Video návod jak vyplňovat výkazy práce zde:</p>
<p><a href="https://www.loom.com/share/243bae5ee04946839028880a3da7e343?sid=4a486cda-9175-48fe-9fe3-28cabb55a78f">https://www.loom.com/share/243bae5ee04946839028880a3da7e343?sid=4a486cda-9175-48fe-9fe3-28cabb55a78f</a></p>
',
'Video návod jak vyplňovat výkazy práce zde: https://www.loom.com/share/243bae5ee04946839028880a3da7e343?sid=4a486cda-9175-48fe-9fe3-28cabb55a78f',
16,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'7b842485-ccdd-4b04-8897-4e028a33e3ce',
'11111111-1111-1111-1111-111111111102',
'Jak vystavovat faktury za práci pro Socials (pro kolegy)',
'<p>Cílem tohoto SOP je zajistit přehledné, konzistentní a správné vystavování faktur tak, aby bylo vždy jasné:</p>
<ul>
<li>za co fakturujete</li>
<li>pro jakého klienta nebo středisko fakturujete</li>
<li>do jaké kategorie práce daná činnost patří</li>
</ul>
<p>Správné členění položek je zásadní pro reporting, vyhodnocování marží a řízení firmy.</p>
<hr>
<h2>Povinné členění položek na faktuře</h2>
<p>Každá položka na faktuře musí vždy začínat jednou z těchto kategorií:</p>
<ul>
<li>Marketing</li>
<li>Přímé služby</li>
<li>Režijní služby</li>
</ul>
<p>Kategorie musí být uvedena na začátku názvu položky. Položky bez tohoto označení nejsou akceptovatelné.</p>
<hr>
<h2>Přímé služby</h2>
<p>Přímé služby jsou všechny činnosti, které jsou přímo spojené s prací na konkrétním klientovi.</p>
<p>Do přímých služeb patří:</p>
<ul>
<li>veškerá práce na klientech</li>
<li>operativa a správa kampaní</li>
<li>konzultace</li>
<li>kreativní práce</li>
<li>vícepráce na klientovi</li>
</ul>
<p>Formát položky musí být vždy:</p>
<p>Přímé služby – název střediska - činnost</p>
<p>Příklady:</p>
<p><strong>Přímé služby – Grada Publishing - Správa kampaní</strong></p>
<p><strong>Přímé služby – BeeWood - Tvorba grafiky</strong></p>
<p>U přímých služeb je povinné vždy uvést správné středisko. Střediska vybírejte výhradně ze seznamu klientů v tabulce:</p>
<p><a href="https://docs.google.com/spreadsheets/d/1SHc2myzqbO1nubcWRO6RvPSoNpPr9Cem/edit">https://docs.google.com/spreadsheets/d/1SHc2myzqbO1nubcWRO6RvPSoNpPr9Cem/edit</a></p>
<p>Někteří klienti mají jiný název střediska než název projektu. V tabulce je vždy uvedeno vysvětlení, aby bylo jasné, jaké středisko použít.</p>
<hr>
<h2>Marketing</h2>
<p>Marketing zahrnuje všechny činnosti, které děláte pro Socials a které souvisí s marketingem Socials, ale nejsou přímým doručením práce klientovi.</p>
<p>Typické příklady:</p>
<ul>
<li>správa contentu Socials</li>
<li>tvorba videí</li>
<li>podcasty</li>
<li>webináře</li>
<li>marketingové a brandové aktivity</li>
</ul>
<p>Formát položky:</p>
<p>Marketing – popis činnosti</p>
<p>Příklad:</p>
<p>Marketing – tvorba video obsahu</p>
<p>Marketing – správa contentu Socials</p>
<hr>
<h2>Režijní služby</h2>
<p>Režijní služby jsou činnosti, které děláte pro Socials, ale:</p>
<ul>
<li>nesouvisí s marketingem</li>
<li>ani s přímou prací na klientech</li>
</ul>
<p>Typické příklady:</p>
<ul>
<li>interní vývoj (např. reportingové šablony)</li>
<li>sales aktivity</li>
<li>interní procesy a systémy</li>
<li>administrativa</li>
<li>automatizace a optimalizace interních nástrojů</li>
</ul>
<p>Formát položky:</p>
<p>Režijní služby – popis činnosti</p>
<p>Příklad:</p>
<p>Režijní služby – interní reportingová šablona</p>
<p>Režijní služby – sales aktivity</p>
<hr>
<h2>⚠️ Kontrola a schvalování faktur</h2>
<p>Každá faktura musí splňovat všechny výše uvedené náležitosti.</p>
<p>Pokud faktura:</p>
<ul>
<li>nemá správně označené položky</li>
<li>neobsahuje kategorii (Marketing / Přímé služby / Režijní služby)</li>
<li>neobsahuje správné středisko u přímých služeb</li>
<li>nebo není v souladu s tímto postupem</li>
</ul>
<p><strong>nebude proplacena a bude vrácena k přepracování.</strong></p>
<p>Odpovědnost za správnost faktury nese osoba, která fakturu vystavila.</p>
',
'Cílem tohoto SOP je zajistit přehledné, konzistentní a správné vystavování faktur tak, aby bylo vždy jasné: za co fakturujete pro jakého klienta nebo středisko fakturujete do jaké kategorie práce daná činnost patří Správné členění položek je zásadní pro reporting, vyhodnocování marží a řízení firmy. --Povinné členění položek na faktuře Každá položka na faktuře musí vždy začínat jednou z těchto kategorií: Marketing Přímé služby Režijní služby Kategorie musí být uvedena na začátku názvu položky. Položky bez tohoto označení nejsou akceptovatelné. --Přímé služby Přímé služby jsou všechny činnosti, které jsou přímo spojené s prací na konkrétním klientovi. Do přímých služeb patří: veškerá práce na klientech operativa a správa kampaní konzultace kreativní práce vícepráce na klientovi Formát položky musí být vždy: Přímé služby – název střediska činnost Příklady: Přímé služby – Grada Publishing Správa kampaní Přímé služby – BeeWood Tvorba grafiky U přímých služeb je povinné vždy uvést správné středisko. Střediska vybírejte výhradně ze seznamu klientů v tabulce: https://docs.google.com/spreadsheets/d/1SHc2myzqbO1nubcWRO6RvPSoNpPr9Cem/edit Někteří klienti mají jiný název střediska než název projektu. V tabulce je vždy uvedeno vysvětlení, aby bylo jasné, jaké středisko použít. --Marketing Marketing zahrnuje všechny činnosti, které děláte pro Socials a které souvisí s marketingem Socials, ale nejsou přímým doručením práce klientovi. Typické příklady: správa contentu Socials tvorba videí podcasty webináře marketingové a brandové aktivity Formát položky: Marketing – popis činnosti Příklad: Marketing – tvorba video obsahu Marketing – správa contentu Socials --Režijní služby Režijní služby jsou činnosti, které děláte pro Socials, ale: nesouvisí s marketingem ani s přímou prací na klientech Typické příklady: interní vývoj (např. reportingové šablony) sales aktivity interní procesy a systémy administrativa automatizace a optimalizace interních nástrojů Formát položky: Režijní služby – popis činnosti Příklad: Režijní služby – interní reportingová šablona Režijní služby – sales aktivity --⚠️ Kontrola a schvalování faktur Každá faktura musí splňovat všechny výše uvedené náležitosti. Pokud faktura: nemá správně označené položky neobsahuje kategorii (Marketing / Přímé služby / Režijní služby) neobsahuje správné středisko u přímých služeb nebo není v souladu s tímto postupem nebude proplacena a bude vrácena k přepracování. Odpovědnost za správnost faktury nese osoba, která fakturu vystavila.',
17,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'78f9cbad-0fd4-4410-aa35-864648757df8',
'11111111-1111-1111-1111-111111111114',
'Jak vytvořit vlastní GPTs asistenty',
'<p><a href="https://www.loom.com/share/ed824ed50b7f469e8035bbc8dfb2c1c9?sid=16a973de-d1c8-4ce1-9d72-f9677745d668">https://www.loom.com/share/ed824ed50b7f469e8035bbc8dfb2c1c9?sid=16a973de-d1c8-4ce1-9d72-f9677745d668</a></p>
',
'https://www.loom.com/share/ed824ed50b7f469e8035bbc8dfb2c1c9?sid=16a973de-d1c8-4ce1-9d72-f9677745d668',
18,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'7df7da45-8e17-4b4e-a08f-d3a50428515b',
'11111111-1111-1111-1111-111111111111',
'Krizová komunikace: Co dělat, když klient ukončuje spolupráci a tvrdí, že jsme selhali?',
'<h1>🔺 Spustí se, když:</h1>
<p>Klient ukončí spolupráci (nebo chce) <strong>s odvoláním na chybu z naší strany</strong>, typicky kvůli:</p>
<ul>
<li>neplnění cíle (PNO, ROAS, tržby),</li>
<li>špatné komunikaci, nedostatečné péči, nedodržení domluvy.</li>
</ul>
<h1>🧩 Okamžité kroky</h1>
<h2><strong>Projektový manažer musí do 24 hodin dodat výstup pro Oťase a Dana, který obsahuje:</strong></h2>
<ul>
<li>Shrnutí výhrad klienta – fakticky, věcně a podloženo materiály.</li>
<li>Popis toho, co bylo z naší strany uděláno (včetně kdy a kým).</li>
<li>Odkazy na konkrétní úkoly ve Freelu / komentáře / zápisy potvrzující náš úhel pohledu.</li>
<li>Přímé odkazy na nahrané meetingy nebo printscreeny důkazů.</li>
<li>Výpočet skutečných výsledků (PNO, ROAS, tržby).</li>
<li>Komentář: Byly výsledky reálně dosažené? Jaký byl kontext?</li>
<li>Vlastní sebereflexe, co mohlo být uděláno lépe.</li>
</ul>
<h2><strong>Zpětná vazba se sdílí s Oťas + Dan, kteří rozhodnou:</strong></h2>
<ul>
<li>Zda komunikaci s klientem přebírá Danny nebo Oťas,</li>
<li>Zda máme prostor pro případné vyrovnání nebo návrh korektního ukončení.</li>
</ul>
<h2>Ponaučení z této situace (Lessons Learned)</h2>
<h3>⚠️ Například</h3>
<ul>
<li><strong>Chybný reporting PNO</strong> – zahrnovaly se pouze ad spendy, ne celkové náklady.</li>
<li><strong>Nedokumentovaná komunikace</strong> – návrhy a dohody nebyly zapsány ani potvrzeny klientem.</li>
<li><strong>Chybějící eskalace</strong> – když bylo jasné, že cíle nejsou realistické, neproběhlo upozornění klienta, ani nedošlo k včasnému upozornění Oťase nebo Dannyho.</li>
</ul>
',
'🔺 Spustí se, když: Klient ukončí spolupráci (nebo chce) s odvoláním na chybu z naší strany, typicky kvůli: neplnění cíle (PNO, ROAS, tržby), špatné komunikaci, nedostatečné péči, nedodržení domluvy. 🧩 Okamžité kroky Projektový manažer musí do 24 hodin dodat výstup pro Oťase a Dana, který obsahuje: Shrnutí výhrad klienta – fakticky, věcně a podloženo materiály. Popis toho, co bylo z naší strany uděláno (včetně kdy a kým). Odkazy na konkrétní úkoly ve Freelu / komentáře / zápisy potvrzující náš úhel pohledu. Přímé odkazy na nahrané meetingy nebo printscreeny důkazů. Výpočet skutečných výsledků (PNO, ROAS, tržby). Komentář: Byly výsledky reálně dosažené? Jaký byl kontext? Vlastní sebereflexe, co mohlo být uděláno lépe. Zpětná vazba se sdílí s Oťas + Dan, kteří rozhodnou: Zda komunikaci s klientem přebírá Danny nebo Oťas, Zda máme prostor pro případné vyrovnání nebo návrh korektního ukončení. Ponaučení z této situace (Lessons Learned) ⚠️ Například Chybný reporting PNO – zahrnovaly se pouze ad spendy, ne celkové náklady. Nedokumentovaná komunikace – návrhy a dohody nebyly zapsány ani potvrzeny klientem. Chybějící eskalace – když bylo jasné, že cíle nejsou realistické, neproběhlo upozornění klienta, ani nedošlo k včasnému upozornění Oťase nebo Dannyho.',
19,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'c2d913de-80ff-48f1-95dc-9b29732cad22',
'11111111-1111-1111-1111-111111111101',
'Lead generation',
'<h1>Lead Generation (beta) – Socials</h1>
<h2>1) Executive summary (co prodáváme)</h2>
<p>Klientům dodáváme <strong>předvídatelný přísun poptávek</strong> + <strong>systém zpracování leadů</strong>, aby se poptávky reálně měnily na <strong>obchodní příležitosti a zákazníky</strong>.</p>
<p>Služba je modulární:</p>
<ul>
<li>klient začíná přes <strong>LEAD START</strong> (základ, který dává smysl téměř každému)</li>
<li>následně si vybírá <strong>ADD-ON moduly</strong> podle potřeby (kvalita, škálování, více kanálů, automatizace, kreativa)</li>
</ul>
<p><strong>Výsledek pro klienta:</strong></p>
<ul>
<li>více relevantních kontaktů (leads)</li>
<li>rychlejší a konzistentní follow-up (vyšší konverze na obchod)</li>
<li>přehled nad tím, co se s leady děje (transparentnost, zodpovědnost, škálování)</li>
</ul>
<hr>
<h1>2) Struktura nabídky (produkty + logika upsellu)</h1>
<h2>Základní balíček</h2>
<h3><strong>LEAD START (25 000 Kč / měs.)</strong></h3>
<p>„Rozjedeme získávání poptávek přes Meta Ads (on-Facebook + web) a nastavíme automatický přenos leadů do tabulky i na e-mail, aby se žádná poptávka neztratila.“</p>
<h2>ADD-ON moduly</h2>
<ul>
<li><strong>LEAD PERFORMANCE (Landing Pages + Quality System)</strong></li>
<li><strong>Google Ads Lead Generation</strong></li>
<li><strong>Creative Boost (bannery / grafika / video)</strong></li>
<li><strong>CRM integrace (pipeline + statusy + reporting)</strong></li>
<li><strong>Booking automatizace (Calendly / rezervace schůzek)</strong></li>
</ul>
<hr>
<h1>3) LEAD START – obsah, výstupy, pravidla</h1>
<h2>🔹 LEAD START (ZÁKLAD) – 25 000 Kč / měs.</h2>
<p><strong>Positioning (1 věta):</strong></p>
<p>„Zajistíme stabilní přísun leadů přes Meta (on-Facebook + web) a nastavíme automatizaci (Sheets + e-mail), aby sales reagoval rychle a konzistentně.“</p>
<h3>Co balíček obsahuje</h3>
<h3>A) Kampaně (Meta Ads)</h3>
<ul>
<li><strong>On-Facebook lead kampaně</strong> (Instant Form / Lead Ads) – rychlý objem, nízká frikce</li>
<li><strong>Website lead kampaně</strong> – sběr leadů přes web / formulář (pokud má klient funkční web a formulář)</li>
</ul>
<h3>B) Automatizace leadů (v ceně)</h3>
<ul>
<li><strong>Zapier integrace</strong>: automatické odesílání leadů<ul>
<li>do <strong>tabulky (Google Sheets / Excel)</strong></li>
<li>zároveň do <strong>e-mailu</strong> (sales tým / konkrétní osoba)</li>
</ul>
</li>
</ul>
<h3>C) Základní Sales SOP (aby lead „nezahníval“)</h3>
<ul>
<li><p>kdo kontaktuje lead</p>
</li>
<li><p>do jakého času</p>
</li>
<li><p>doporučený první kontakt (call / e-mail + šablona)</p>
</li>
<li><p>minimální pravidlo: <strong>kontaktovat lead co nejdříve (ideálně do několika minut)</strong></p>
<p>  → při rychlé reakci („speed-to-lead“) dramaticky roste šance na kvalifikaci oproti čekání 30 minut a více</p>
</li>
</ul>
<h3>Výstup pro klienta</h3>
<p>👉 „Chodí mi leady z Meta i z webu, mám je v tabulce i v e-mailu a umíme je okamžitě zpracovat.“</p>
<hr>
<h1>4) ADD-ON služby (menu)</h1>
<h2>✅ ADD-ON: LEAD PERFORMANCE (Landing Pages + Quality System)</h2>
<p><strong>Kdy dává smysl:</strong></p>
<p>Když klient chce <strong>vyšší kvalitu leadů</strong>, lepší konverzi a škálování (ne jen objem).</p>
<p><strong>Nutný brief od klienta</strong>, abychom mohli landing pages vytvořit.</p>
<h3>Co obsahuje</h3>
<ul>
<li><strong>Dedikované landing pages (1–3 varianty)</strong> – tvorba přes Lovable</li>
<li><strong>A/B testování landing pages</strong> (vítěz = levnější lead / vyšší kvalita)</li>
<li><strong>Kvalitnější website lead gen kampaně na Metě</strong> (optimalizace na kvalitu, ne jen CPL)</li>
<li>rozšířený Sales SOP (kvalifikace, follow-up logika, práce s jednoduchými námitkami)</li>
</ul>
<p><strong>Positioning (1 věta):</strong></p>
<p>„LEAD START dodá leady. LEAD PERFORMANCE řeší, kolik z nich se skutečně promění v zákazníky.“</p>
<ul>
<li><p><em><strong>Ako vytvárať landing pages?</strong></em></p>
<p>  <strong>V chatpgt vytvoriť agenta, kde zadám brief a on vypluje prompt pre LOVABLE</strong></p>
<p>  1️⃣ Visual Hierarchy Layer</p>
<p>  → Offer above the fold: Instantly communicates value proposition</p>
<p>  → Short lead with social proof: Builds immediate credibility</p>
<p>  → Google Reviews section: Third-party validation at the perfect moment</p>
<p>  2️⃣ Persuasion Layer</p>
<p>  → Reason-why benefit bullets: Transforms features into compelling outcomes</p>
<p>  → Dramatic testimonial video: Shows real transformation stories</p>
<p>  → How it works section: Removes uncertainty from the process</p>
<p>  3️⃣ Qualification Layer</p>
<p>  → Strategic customer callout: Pre-filters ideal prospects</p>
<p>  → FAQs: Remove roadblocks, while asking for action</p>
<p>  → Final CTA placement: Creates urgency after building maximum value</p>
<p>  <img src="Lead%20generation/1756692707453.jpeg" alt="1756692707453.jpeg"></p>
</li>
</ul>
<hr>
<h2>✅ ADD-ON: Google Ads Lead Generation</h2>
<p><strong>Kdy dává smysl:</strong></p>
<p>Když klientovi funguje poptávka ze <strong>Search / YouTube / Performance Max</strong>, nebo chce pokrýt publikum s vysokým nákupním záměrem („high intent“).</p>
<h3>Možné přístupy</h3>
<ul>
<li><strong>Lead form assets</strong> (lead formulář přímo v Google reklamě)</li>
<li>nebo přesměrování na web / landing page (ideálně v kombinaci s LEAD PERFORMANCE)</li>
</ul>
<p><strong>Positioning (1 věta):</strong></p>
<p>„Zachytáváme poptávku ve chvíli, kdy lidé aktivně hledají řešení.“</p>
<hr>
<h2>✅ ADD-ON: Creative Boost (klíčové hlavně pro LEAD START)</h2>
<p>Tohle bych komunikoval jako <strong>silnou konkurenční výhodu</strong>.</p>
<p><strong>Proč je Creative Boost důležitý hlavně u LEAD START:</strong></p>
<p>Pokud nepoužíváme dedikované landing pages, <strong>kreativa dělá velkou část práce za web</strong> – vysvětluje nabídku, buduje důvěru a filtruje nerelevantní zájemce.</p>
<h3>Co obsahuje</h3>
<ul>
<li>bannery (statika) + jednoduché motion varianty</li>
<li>rychlá testovací matice (úhly, hooky, benefity, CTA)</li>
<li>iterace podle výkonu</li>
<li>volitelně UGC brief / tvůrci / jednoduchá videa</li>
</ul>
<p><strong>Positioning (1 věta):</strong></p>
<p>„Dodáváme kreativu, která zrychlí učení algoritmu a zvýší kvalitu leadů i bez landing pages.“</p>
<hr>
<h2>✅ ADD-ON: CRM integrace (pipeline + vlastnictví + reporting)</h2>
<ul>
<li>napojení leadů do CRM</li>
<li>pipeline + statusy (New / Contacted / Qualified / Won)</li>
<li>vlastnictví leadů (kdo je za co zodpovědný)</li>
<li>základní reporting</li>
</ul>
<p><strong>Positioning (1 věta):</strong></p>
<p>„Pokud chcete mít v leadech pořádek a jasnou odpovědnost, CRM je další logický krok.“</p>
<hr>
<h2>✅ ADD-ON: Booking automatizace (Calendly / rezervace schůzek)</h2>
<p>Ideální hlavně pro B2B – cílem není jen lead, ale <strong>schůzka</strong>.</p>
<ul>
<li>po odeslání formuláře dostane lead výzvu k rezervaci termínu</li>
<li>výsledek = <strong>naplánovaná schůzka</strong></li>
</ul>
<p><strong>Positioning (1 věta):</strong></p>
<p>„Z leadu rovnou děláme schůzku – méně odpadu, vyšší closing.“</p>
<hr>
<h2>✅ ADD-ON: B2B: - SCRAPE WEBU</h2>
<p>Vyscrapujeme relevantné weby a dodáme  <strong>zoznam kontaktov</strong> (e-maily, prípadne ďalšie verejne dostupné údaje), ktoré môžete cielene osloviť cez e-mailing.</p>
<p>Tento modul sa hodí najmä pre segmenty, kde firmy riešia nákup <strong>periodicky</strong> (napr. teambuildingy, školenia, firemné akcie) — často to odkladajú na poslednú chvíľu. V praxi to znamená, že keď sa to začne „horieť“, budú radi, ak v inboxe nájdu <strong>konkrétne riešenie</strong> a môžu sa rýchlo rozhodnúť.</p>
',
'Lead Generation (beta) – Socials 1) Executive summary (co prodáváme) Klientům dodáváme předvídatelný přísun poptávek + systém zpracování leadů, aby se poptávky reálně měnily na obchodní příležitosti a zákazníky. Služba je modulární: klient začíná přes LEAD START (základ, který dává smysl téměř každému) následně si vybírá ADD-ON moduly podle potřeby (kvalita, škálování, více kanálů, automatizace, kreativa) Výsledek pro klienta: více relevantních kontaktů (leads) rychlejší a konzistentní follow-up (vyšší konverze na obchod) přehled nad tím, co se s leady děje (transparentnost, zodpovědnost, škálování) --2) Struktura nabídky (produkty + logika upsellu) Základní balíček LEAD START (25 000 Kč / měs.) „Rozjedeme získávání poptávek přes Meta Ads (on-Facebook + web) a nastavíme automatický přenos leadů do tabulky i na e-mail, aby se žádná poptávka neztratila.“ ADD-ON moduly LEAD PERFORMANCE (Landing Pages + Quality System) Google Ads Lead Generation Creative Boost (bannery / grafika / video) CRM integrace (pipeline + statusy + reporting) Booking automatizace (Calendly / rezervace schůzek) --3) LEAD START – obsah, výstupy, pravidla 🔹 LEAD START (ZÁKLAD) – 25 000 Kč / měs. Positioning (1 věta): „Zajistíme stabilní přísun leadů přes Meta (on-Facebook + web) a nastavíme automatizaci (Sheets + e-mail), aby sales reagoval rychle a konzistentně.“ Co balíček obsahuje A) Kampaně (Meta Ads) On-Facebook lead kampaně (Instant Form / Lead Ads) – rychlý objem, nízká frikce Website lead kampaně – sběr leadů přes web / formulář (pokud má klient funkční web a formulář) B) Automatizace leadů (v ceně) Zapier integrace: automatické odesílání leadů do tabulky (Google Sheets / Excel) zároveň do e-mailu (sales tým / konkrétní osoba) C) Základní Sales SOP (aby lead „nezahníval“) kdo kontaktuje lead do jakého času doporučený první kontakt (call / e-mail + šablona) minimální pravidlo: kontaktovat lead co nejdříve (ideálně do několika minut) → při rychlé reakci („speed-to-lead“) dramaticky roste šance na kvalifikaci oproti čekání 30 minut a více Výstup pro klienta 👉 „Chodí mi leady z Meta i z webu, mám je v tabulce i v e-mailu a umíme je okamžitě zpracovat.“ --4) ADD-ON služby (menu) ✅ ADD-ON: LEAD PERFORMANCE (Landing Pages + Quality System) Kdy dává smysl: Když klient chce vyšší kvalitu leadů, lepší konverzi a škálování (ne jen objem). Nutný brief od klienta, abychom mohli landing pages vytvořit. Co obsahuje Dedikované landing pages (1–3 varianty) – tvorba přes Lovable A/B testování landing pages (vítěz = levnější lead / vyšší kvalita) Kvalitnější website lead gen kampaně na Metě (optimalizace na kvalitu, ne jen CPL) rozšířený Sales SOP (kvalifikace, follow-up logika, práce s jednoduchými námitkami) Positioning (1 věta): „LEAD START dodá leady. LEAD PERFORMANCE řeší, kolik z nich se skutečně promění v zákazníky.“ Ako vytvárať landing pages? V chatpgt vytvoriť agenta, kde zadám brief a on vypluje prompt pre LOVABLE 1️⃣ Visual Hierarchy Layer → Offer above the fold: Instantly communicates value proposition → Short lead with social proof: Builds immediate credibility → Google Reviews section: Third-party validation at the perfect moment 2️⃣ Persuasion Layer → Reason-why benefit bullets: Transforms features into compelling outcomes → Dramatic testimonial video: Shows real transformation stories → How it works section: Removes uncertainty from the process 3️⃣ Qualification Layer → Strategic customer callout: Pre-filters ideal prospects → FAQs: Remove roadblocks, while asking for action → Final CTA placement: Creates urgency after building maximum value !1756692707453.jpeg --✅ ADD-ON: Google Ads Lead Generation Kdy dává smysl: Když klientovi funguje poptávka ze Search / YouTube / Performance Max, nebo chce pokrýt publikum s vysokým nákupním záměrem („high intent“). Možné přístupy Lead form assets (lead formulář přímo v Google reklamě) nebo přesměrování na web / landing page (ideálně v kombinaci s LEAD PERFORMANCE) Positioning (1 věta): „Zachytáváme poptávku ve chvíli, kdy lidé aktivně hledají řešení.“ --✅ ADD-ON: Creative Boost (klíčové hlavně pro LEAD START) Tohle bych komunikoval jako silnou konkurenční výhodu. Proč je Creative Boost důležitý hlavně u LEAD START: Pokud nepoužíváme dedikované landing pages, kreativa dělá velkou část práce za web – vysvětluje nabídku, buduje důvěru a filtruje nerelevantní zájemce. Co obsahuje bannery (statika) + jednoduché motion varianty rychlá testovací matice (úhly, hooky, benefity, CTA) iterace podle výkonu volitelně UGC brief / tvůrci / jednoduchá videa Positioning (1 věta): „Dodáváme kreativu, která zrychlí učení algoritmu a zvýší kvalitu leadů i bez landing pages.“ --✅ ADD-ON: CRM integrace (pipeline + vlastnictví + reporting) napojení leadů do CRM pipeline + statusy (New / Contacted / Qualified / Won) vlastnictví leadů (kdo je za co zodpovědný) základní reporting Positioning (1 věta): „Pokud chcete mít v leadech pořádek a jasnou odpovědnost, CRM je další logický krok.“ --✅ ADD-ON: Booking automatizace ',
20,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'04ff31c4-4b80-4a65-a8db-01eab3baaf72',
'11111111-1111-1111-1111-111111111113',
'MEET 1: Spätná väzba na klienta',
'<hr>
<h1>MEETING 1 – Spätná väzba na klienta</h1>
<p>Tento meeting bude prebiehať <strong>raz mesačne, vždy v 2. týždni v mesiaci</strong>, v <strong>stredu o 15:00</strong> (termín sa môže upraviť po dohode).</p>
<h2>🎯 <strong>Cieľ meetingu:</strong></h2>
<p>Každý Meta Ads špecialista si pripraví <strong>jedného klienta</strong>, ktorého chce <strong>spoločne s tímom rozobrať</strong> – získať spätnú väzbu, nové nápady, pohľad zvonka alebo pomoc pri riešení problémov.</p>
<p>👉 Ak práve nemáš klienta, s ktorým potrebuješ poradiť, <strong>nemusíš nasilu niekoho vybrať</strong> – môžeš dať priestor kolegom a zároveň sa <strong>naplno pripraviť na spätnú väzbu pre nich</strong>.</p>
<p><strong>Klient: (príprava briefu pre kolegov)</strong></p>
<p><strong>Klient Jarda: <a href="https://www.gobyeurope.com/cz/">Gobyeurope</a></strong></p>
<p>Predaj topánok, tenisiek, sandálov (podľa sezónnosti), ktoré majú unikátny štýl a dizajn. Cieľové PNO klienta je 15 % za celý e-shop. Pravidelne sme pod 20 %. Riešime Meta ads a aj Google ads. Kreatívu robí klient interne. Snažíme sa zapájať aj akcie, sú plánované balíčky a zlepšenie ponuky. Klient je často out of stock a menia sa produkty, ktoré chceme propagovať, taktiež hrá veľkú rolu aj sezónnosť. Pre klienta riešime 5 krajín. CZ, DE, FR, IT, ES. </p>
<p><strong>PAINS:</strong> </p>
<ul>
<li>produkty out of stock</li>
<li>klient znižuje PNO, ktoré sa veľmi ťažko dosahuje</li>
<li>nedokážeme vymyslieť atraktívnu ponuku</li>
</ul>
<h2><strong>How to make a brief:</strong></h2>
<ul>
<li><p>💡 Ako na popis klienta?</p>
<p>  <strong>1. Kto je klient?</strong></p>
<p>  Dve stručné vety:</p>
<p>  → Aké odvetvie?</p>
<p>  → Aký typ produktov/služieb ponúka?</p>
<p>  <strong>2. Aké má klient KPI?</strong></p>
<p>  → Napr. PNO, ROAS, počet objednávok, CPL…</p>
<p>  → Pripomeň, aké je ideálne KPI z pohľadu klienta.</p>
<p>  <strong>3. Aké kanály u nás využíva?</strong></p>
<p>  → Meta Ads, Google Ads, e-mailing?</p>
<p>  <strong>4. Plní sa KPI alebo nie?</strong></p>
<p>  → Krátke zhrnutie: áno/nie/prečo.</p>
<p>  → Aké sú aktuálne výzvy alebo úspechy?</p>
<p>  <strong>5. Tvoje 3 hlavné postrehy / takeaways:</strong></p>
<p>  → Čo si z toho vie tím zobrať?</p>
<p>  → Môže ísť o chyby, úspešné hacky, kreatívy, alebo stratégické rozhodnutia.</p>
<p>  → Môžu to byť aj otázky pre tím – kde chceš získať pohľad ostatných.</p>
</li>
</ul>
<hr>
<h3>📝 <strong>‼️ Dôležité:</strong></h3>
<p>V každom briefe ku klientovi musí byť <strong>jasne definované, s čím konkrétne potrebuješ pomôcť.</strong></p>
<p>Len tak vie tím reagovať presne a prínosne.</p>
<h3>🔍 Príklady otázok alebo problémov:</h3>
<ul>
<li>Nedokážem napísať dobré copy do reklám</li>
<li>Nie som si istý, aká štruktúra kampaní je najvhodnejšia</li>
<li>Potrebujem poradiť, ako by som mohol klienta škálovať</li>
<li>Neviem, ktoré produkty alebo kategórie mám tlačiť v kampani</li>
<li>Skúsil som všetko a výsledky sú stále slabé</li>
<li>Ako by som mohol zlepšiť ponuku alebo komunikáciu pre klienta?</li>
</ul>
<h3><strong>Úlohy: (príprava pred meetingom):</strong></h3>
<ul>
<li>🔗 <strong>Prepojte si účet cez partnerský Business Manager.</strong></li>
<li>📊 <strong>Pozrite si report v Looker Studiu</strong> – výsledky, trendy, prehľad výkonu.</li>
<li>🔍 <strong>Prejdite si aktuálne kampane a reklamy.</strong></li>
<li>🛠️ <strong>Identifikujte prípadné chyby</strong> v nastaveniach alebo štruktúre.</li>
<li>🧠 <strong>Navrhnite alternatívnu štruktúru kampaní</strong>, ak by ste robili účet od nuly.</li>
<li>🎨 <strong>Zhodnoťte kreatívy a textácie</strong> – čo by sa dalo zlepšiť?</li>
<li>🎯 <strong>Navrhnite nový angle</strong> – ako by ste klienta uchopili vy?</li>
</ul>
<hr>
<p>Cieľom je poskytnúť čerstvú perspektívu a zdieľať nápady, ktoré môžu prispieť k lepšej výkonnosti účtu. Niekedy pomôže len nový pohľad – a práve to je účel.</p>
',
'--MEETING 1 – Spätná väzba na klienta Tento meeting bude prebiehať raz mesačne, vždy v týždni v mesiaci, v stredu o 15:00 (termín sa môže upraviť po dohode). 🎯 Cieľ meetingu: Každý Meta Ads špecialista si pripraví jedného klienta, ktorého chce spoločne s tímom rozobrať – získať spätnú väzbu, nové nápady, pohľad zvonka alebo pomoc pri riešení problémov. 👉 Ak práve nemáš klienta, s ktorým potrebuješ poradiť, nemusíš nasilu niekoho vybrať – môžeš dať priestor kolegom a zároveň sa naplno pripraviť na spätnú väzbu pre nich. Klient: (príprava briefu pre kolegov) Klient Jarda: Gobyeurope Predaj topánok, tenisiek, sandálov (podľa sezónnosti), ktoré majú unikátny štýl a dizajn. Cieľové PNO klienta je 15 % za celý e-shop. Pravidelne sme pod 20 %. Riešime Meta ads a aj Google ads. Kreatívu robí klient interne. Snažíme sa zapájať aj akcie, sú plánované balíčky a zlepšenie ponuky. Klient je často out of stock a menia sa produkty, ktoré chceme propagovať, taktiež hrá veľkú rolu aj sezónnosť. Pre klienta riešime 5 krajín. CZ, DE, FR, IT, ES. PAINS: produkty out of stock klient znižuje PNO, ktoré sa veľmi ťažko dosahuje nedokážeme vymyslieť atraktívnu ponuku How to make a brief: 💡 Ako na popis klienta? Kto je klient? Dve stručné vety: → Aké odvetvie? → Aký typ produktov/služieb ponúka? Aké má klient KPI? → Napr. PNO, ROAS, počet objednávok, CPL… → Pripomeň, aké je ideálne KPI z pohľadu klienta. Aké kanály u nás využíva? → Meta Ads, Google Ads, e-mailing? Plní sa KPI alebo nie? → Krátke zhrnutie: áno/nie/prečo. → Aké sú aktuálne výzvy alebo úspechy? Tvoje 3 hlavné postrehy / takeaways: → Čo si z toho vie tím zobrať? → Môže ísť o chyby, úspešné hacky, kreatívy, alebo stratégické rozhodnutia. → Môžu to byť aj otázky pre tím – kde chceš získať pohľad ostatných. --📝 ‼️ Dôležité: V každom briefe ku klientovi musí byť jasne definované, s čím konkrétne potrebuješ pomôcť. Len tak vie tím reagovať presne a prínosne. 🔍 Príklady otázok alebo problémov: Nedokážem napísať dobré copy do reklám Nie som si istý, aká štruktúra kampaní je najvhodnejšia Potrebujem poradiť, ako by som mohol klienta škálovať Neviem, ktoré produkty alebo kategórie mám tlačiť v kampani Skúsil som všetko a výsledky sú stále slabé Ako by som mohol zlepšiť ponuku alebo komunikáciu pre klienta? Úlohy: (príprava pred meetingom): 🔗 Prepojte si účet cez partnerský Business Manager. 📊 Pozrite si report v Looker Studiu – výsledky, trendy, prehľad výkonu. 🔍 Prejdite si aktuálne kampane a reklamy. 🛠️ Identifikujte prípadné chyby v nastaveniach alebo štruktúre. 🧠 Navrhnite alternatívnu štruktúru kampaní, ak by ste robili účet od nuly. 🎨 Zhodnoťte kreatívy a textácie – čo by sa dalo zlepšiť? 🎯 Navrhnite nový angle – ako by ste klienta uchopili vy? --Cieľom je poskytnúť čerstvú perspektívu a zdieľať nápady, ktoré môžu prispieť k lepšej výkonnosti účtu. Niekedy pomôže len nový pohľad – a práve to je účel.',
21,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'8b6512b7-71a0-4969-a39d-13ae75e0a827',
'11111111-1111-1111-1111-111111111113',
'MEET 2: News, best practises, how to',
'<hr>
<h1>MEETING 2 – Novinky, best practises &amp; how to</h1>
<p>Tento meeting bude prebiehať <strong>raz mesačne, vždy v 4. týždni v mesiaci</strong>, v <strong>stredu o 15:00</strong> (termín sa môže upraviť po dohode).</p>
<h2>🎯 <strong>Cieľ meetingu:</strong></h2>
<p>Vytvoriť priestor pre zdieľanie noviniek, skúseností z praxe a diskusiu, z ktorej vzniknú nové interné postupy a zlepšenia. Tento meeting má za cieľ <strong>zjednocovať know-how</strong>, zlepšovať konzistenciu práce a posúvať tím dopredu.</p>
<ul>
<li><p><strong>1️⃣ Novinky v meta ads</strong></p>
<p>  V tejto časti si v krátkosti predstavíme <strong>aktuálne novinky z Meta Ads</strong>, ktoré majú reálny dopad na našu každodennú prácu a výsledky klientov.</p>
<p>  Všetky novinky budeme priebežne dopĺňať do <strong>dlhodobej prezentácie v Canve</strong>, ktorá bude rozdelená <strong>podľa mesiacov</strong>. Vďaka tomu sa k nim vieme kedykoľvek spätne vrátiť, či už pri diskusii, testovaní alebo vyhodnocovaní.</p>
<p>  – Predstavenie nových funkcií alebo zmien</p>
<p>  – Ako ich vieme využiť v praxi</p>
<p>  – Nápady na testovanie alebo implementáciu</p>
<p>  <strong>Prezka</strong>: <a href="https://www.canva.com/design/DAGlSuSpwO0/7pHqkhmvVmqA90ckiTiqFg/edit?utm_content=DAGlSuSpwO0&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton">https://www.canva.com/design/DAGlSuSpwO0/7pHqkhmvVmqA90ckiTiqFg/edit?utm_content=DAGlSuSpwO0&amp;utm_campaign=designshare&amp;utm_medium=link2&amp;utm_source=sharebutton</a></p>
</li>
<li><p>2️⃣ <strong>Good Case – Úspešný klient a jeho výsledky</strong></p>
<h3>🎯 <strong>Cieľ tohto bodu:</strong></h3>
<p>  Inšpirovať sa úspešnou kampaňou – čo fungovalo, prečo to fungovalo a aké ponaučenia vieme preniesť aj na iných klientov.</p>
<ul>
<li><strong>Stručný prehľad výsledkov</strong> – čo sa podarilo, aké boli KPIs, medziročné porovnanie, vývoj PNO, ROAS.</li>
<li><strong>Čo fungovalo najviac?</strong> (typ kampane, štruktúra, kreatíva, text, ponuka)</li>
<li><strong>Aké boli textácie a kreatívy?</strong> (ukážka kreatív a copy)</li>
<li><strong>Prečo si myslíš, že to zafungovalo?</strong> (doplnenie kontextu, ponuka, sezónnosť..)</li>
<li><strong>Aké poučenie si z toho vieme zobrať ako tím?</strong></li>
</ul>
<p>  Pointou je zdieľať know-how – čo vieme replikovať aj na iných klientoch. Každý dobrý case nás môže posunúť v stratégii aj kreatíve.</p>
<p>  Všetky good cases budeme priebežne dopĺňať do <strong>dlhodobej prezentácie v Canve</strong>, ktorá bude rozdelená <strong>podľa mesiacov</strong>. Vďaka tomu sa k nim vieme kedykoľvek spätne vrátiť, či už pri diskusii, testovaní alebo vyhodnocovaní.</p>
<p>  <strong>Prezka:</strong> <a href="https://www.canva.com/design/DAGlSnM-5ao/Kzcvm4_t5No8oo2PeoMcpA/edit?utm_content=DAGlSnM-5ao&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton">https://www.canva.com/design/DAGjSRyfR0U/XzT1t9N6F71Wzrua7ftZZQ/edit?utm_content=DAGjSRyfR0U&amp;utm_campaign=designshare&amp;utm_medium=link2&amp;utm_source=sharebutton</a>
  </p>
</li>
<li><p>3️⃣ <strong>Voľná téma podľa dohody</strong></p>
<h3>💬 <strong>Voľná téma – podľa toho, čo aktuálne riešime</strong></h3>
<p>  V rámci každého druhého meetingu budeme mať priestor na <strong>diskusiu k voľne zvolenej téme</strong>, ktorá bude vychádzať z toho, <strong>čo aktuálne riešime, čo nás trápi alebo kde cítime priestor na zlepšenie</strong>.</p>
<p>  Tému si budeme <strong>vyberať spoločne vopred</strong> – podľa toho, čo je práve najviac aktuálne (napr. ako robiť audity, ako lepšie škálovať, ako nastavovať budgety, reporting, komunikácia s klientom a pod.).</p>
<p>  Cieľom je otvoriť diskusiu, zdieľať pohľady a spoločne vytvoriť návrh na <strong>nový alebo vylepšený SOP</strong>, ktorý nám uľahčí prácu.</p>
</li>
<li><p>4️⃣ PRIKLAD:  <strong>Vyhodnocovanie Meta Ads kampaní</strong></p>
<h3>🎯 <strong>Cieľ tohto bodu:</strong></h3>
<p>  Zistiť, <strong>ako každý z nás vyhodnocuje kampane</strong>, aké metriky sledujeme, čo považujeme za úspech a <strong>kde máme rozdiely alebo nejasnosti</strong>. Na základe tejto diskusie vytvoríme spoločné štandardy (SOP), aby sme boli ako tím konzistentní.</p>
<h3>Otázky k brainstormingu:</h3>
<ul>
<li><strong>Ako vy osobne pristupujete k vyhodnocovaniu kampaní?</strong></li>
<li><strong>Ktoré metriky sú pre vás najdôležitejšie?</strong> (napr. PNO, ROAS, CTR, CPC, počet objednávok, frekvencia…)</li>
<li><strong>Aké časové obdobie zvyčajne sledujete?</strong></li>
<li><strong>Používate Looker Studio, Ads Manager alebo niečo iné?</strong></li>
<li><strong>Kedy si poviete, že kampaň je úspešná?</strong></li>
<li><strong>Čo robíte, keď výsledky klesajú? Ako identifikujete problém?</strong></li>
<li><strong>Máte priestor, kde si zapisujete pozorovania alebo závery?</strong></li>
</ul>
<p>  Cieľom je neporovnávať kto čo robí lepšie, ale zmapovať realitu tímu a na základe toho pripraviť návrh SOP pre vyhodnocovanie kampaní. Spoločné štandardy nám pomôžu v efektivite, zdieľaní výsledkov aj pri delegovaní.</p>
</li>
</ul>
<hr>
<p>Každý meeting by mal priniesť <strong>minimálne jeden nápad</strong>, ktorý posunieme do <strong>návrhu SOP</strong>, alebo odporúčania pre tím. Tie budeme následne testovať a dokumentovať.</p>
',
'--MEETING 2 – Novinky, best practises & how to Tento meeting bude prebiehať raz mesačne, vždy v týždni v mesiaci, v stredu o 15:00 (termín sa môže upraviť po dohode). 🎯 Cieľ meetingu: Vytvoriť priestor pre zdieľanie noviniek, skúseností z praxe a diskusiu, z ktorej vzniknú nové interné postupy a zlepšenia. Tento meeting má za cieľ zjednocovať know-how, zlepšovať konzistenciu práce a posúvať tím dopredu. 1️⃣ Novinky v meta ads V tejto časti si v krátkosti predstavíme aktuálne novinky z Meta Ads, ktoré majú reálny dopad na našu každodennú prácu a výsledky klientov. Všetky novinky budeme priebežne dopĺňať do dlhodobej prezentácie v Canve, ktorá bude rozdelená podľa mesiacov. Vďaka tomu sa k nim vieme kedykoľvek spätne vrátiť, či už pri diskusii, testovaní alebo vyhodnocovaní. – Predstavenie nových funkcií alebo zmien – Ako ich vieme využiť v praxi – Nápady na testovanie alebo implementáciu Prezka: https://www.canva.com/design/DAGlSuSpwO0/7pHqkhmvVmqA90ckiTiqFg/edit?utm_content=DAGlSuSpwO0&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton 2️⃣ Good Case – Úspešný klient a jeho výsledky 🎯 Cieľ tohto bodu: Inšpirovať sa úspešnou kampaňou – čo fungovalo, prečo to fungovalo a aké ponaučenia vieme preniesť aj na iných klientov. Stručný prehľad výsledkov – čo sa podarilo, aké boli KPIs, medziročné porovnanie, vývoj PNO, ROAS. Čo fungovalo najviac? (typ kampane, štruktúra, kreatíva, text, ponuka) Aké boli textácie a kreatívy? (ukážka kreatív a copy) Prečo si myslíš, že to zafungovalo? (doplnenie kontextu, ponuka, sezónnosť..) Aké poučenie si z toho vieme zobrať ako tím? Pointou je zdieľať know-how – čo vieme replikovať aj na iných klientoch. Každý dobrý case nás môže posunúť v stratégii aj kreatíve. Všetky good cases budeme priebežne dopĺňať do dlhodobej prezentácie v Canve, ktorá bude rozdelená podľa mesiacov. Vďaka tomu sa k nim vieme kedykoľvek spätne vrátiť, či už pri diskusii, testovaní alebo vyhodnocovaní. Prezka: https://www.canva.com/design/DAGjSRyfR0U/XzT1t9N6F71Wzrua7ftZZQ/edit?utm_content=DAGjSRyfR0U&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton 3️⃣ Voľná téma podľa dohody 💬 Voľná téma – podľa toho, čo aktuálne riešime V rámci každého druhého meetingu budeme mať priestor na diskusiu k voľne zvolenej téme, ktorá bude vychádzať z toho, čo aktuálne riešime, čo nás trápi alebo kde cítime priestor na zlepšenie. Tému si budeme vyberať spoločne vopred – podľa toho, čo je práve najviac aktuálne (napr. ako robiť audity, ako lepšie škálovať, ako nastavovať budgety, reporting, komunikácia s klientom a pod.). Cieľom je otvoriť diskusiu, zdieľať pohľady a spoločne vytvoriť návrh na nový alebo vylepšený SOP, ktorý nám uľahčí prácu. 4️⃣ PRIKLAD: Vyhodnocovanie Meta Ads kampaní 🎯 Cieľ tohto bodu: Zistiť, ako každý z nás vyhodnocuje kampane, aké metriky sledujeme, čo považujeme za úspech a kde máme rozdiely alebo nejasnosti. Na základe tejto diskusie vytvoríme spoločné štandardy (SOP), aby sme boli ako tím konzistentní. Otázky k brainstormingu: Ako vy osobne pristupujete k vyhodnocovaniu kampaní? Ktoré metriky sú pre vás najdôležitejšie? (napr. PNO, ROAS, CTR, CPC, počet objednávok, frekvencia…) Aké časové obdobie zvyčajne sledujete? Používate Looker Studio, Ads Manager alebo niečo iné? Kedy si poviete, že kampaň je úspešná? Čo robíte, keď výsledky klesajú? Ako identifikujete problém? Máte priestor, kde si zapisujete pozorovania alebo závery? Cieľom je neporovnávať kto čo robí lepšie, ale zmapovať realitu tímu a na základe toho pripraviť návrh SOP pre vyhodnocovanie kampaní. Spoločné štandardy nám pomôžu v efektivite, zdieľaní výsledkov aj pri delegovaní. --Každý meeting by mal priniesť minimálne jeden nápad, ktorý posunieme do návrhu SOP, alebo odporúčania pre tím. Tie budeme následne testovať a dokumentovať.',
22,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'4d88a882-9900-4456-97d7-c0bdb49bb8cf',
'11111111-1111-1111-1111-111111111104',
'Meta Ads - Kampaně těsně před a po Vánocích',
'<h1>Standardy</h1>
<p>Toto SOP slouží k tomu, abychom se sjednotili v přístupu ke klientovi po Vánocích. </p>
<h1>Těsně před Vánoci potřebujete</h1>
<ul>
<li><p><strong>kontaktovat klienta (Freelo)</strong><br>Zeptejte se, jak stíhá a zdali je ještě prostor trošku přitlačit do ads.</p>
</li>
<li><p><strong>zjistit garanci doručení do Vánoc</strong><br>Informaci nechte dát klienta na e-shop (banner na HP a informační lištu)</p>
<ul>
<li>připravte bannery – poslední CTA před koncem Vánoc, můžete tím ještě boostnout lehce prodeje.</li>
</ul>
</li>
<li><p><strong>povánoční výprodej</strong><br>Dopředu si zjistěte, jestli klient neplánuje nějakou povánoční výprodej, pro kterou byste potřebovali bannery od grafiků nebo klienta.</p>
<p>  Pokud klient výprodej neplánuje, zkontrolujte, zdali na webu nemá dlouhodobě kategorii se zlevněným zbožím, pro tuto kategorii byste mohli vytvořit katalogovky.</p>
</li>
</ul>
<h1>Po Vánocích</h1>
<ol>
<li>Pokud klient nestanoví jinak, <strong>kampaně nedoporučujeme pozastavit, ale pouze snížit rozpočty</strong> na minimum.</li>
<li><strong>Vypněte všechny reklamy s vánoční tématikou a copy.</strong> Nezapomeňte na katalogové reklamy s vánočním rámečkem.</li>
<li><strong>Komunikujte s klientem a plánujte povánoční kampaně s předstihem</strong>, ať nejste překvapení a můžete si připravit vše dostatečně dopředu (náplň akce, copy, grafika). </li>
<li><strong>Doporučte klientovi</strong> například:<ol>
<li>Povánoční výprodej – slevy až XY %!</li>
<li>Lednové slevy</li>
<li>Zbavujeme se zásob – poslední šance na tyto produkty za výhodné ceny!</li>
<li>Detox po svátcích – produkty pro zdravější start do nového roku.</li>
<li>Vyzkoušejte něco nového – objevte naše nové kolekce!</li>
<li>Nejprodávanější produkty roku – kupte je teď se slevou!!</li>
<li>Zlevněné bestsellery 2024.</li>
<li>Vybavení na nový semestr – vše, co potřebujete do školy nebo práce.</li>
<li>Možnost promovat povánoční příspěvky v sales kampani, nebo reengagement kampani.</li>
</ol>
</li>
<li><strong>Dopředu si připravte obecné reklamy, které mohou běžet hned po Vánocích.</strong><ul>
<li>Obecná nabídka = ta, která běží standardně</li>
</ul>
</li>
<li><strong>Během Vánoc pravidelně kontrolujte kampaně</strong> (podle velikosti účtu 1x za 2 dny), zdali se kampaně doručují a nenastal žádný fuck up (př. nedoručování reklam, vyčerpání rozpočtu, zamítnutí reklam, atp.)</li>
<li>Odpočívejte a nežerte moc cukroví. 😛</li>
</ol>
<h1>Po Novém roce</h1>
<p>- </p>
<ul>
<li>Domluvte si meeting – shrňte loňský rok a diskutujte nad novoročními cíli klienta.</li>
<li>Začněte s klientem plánovat první kvartál roku.</li>
</ul>
',
'Standardy Toto SOP slouží k tomu, abychom se sjednotili v přístupu ke klientovi po Vánocích. Těsně před Vánoci potřebujete kontaktovat klienta (Freelo) Zeptejte se, jak stíhá a zdali je ještě prostor trošku přitlačit do ads. zjistit garanci doručení do Vánoc Informaci nechte dát klienta na e-shop (banner na HP a informační lištu) připravte bannery – poslední CTA před koncem Vánoc, můžete tím ještě boostnout lehce prodeje. povánoční výprodej Dopředu si zjistěte, jestli klient neplánuje nějakou povánoční výprodej, pro kterou byste potřebovali bannery od grafiků nebo klienta. Pokud klient výprodej neplánuje, zkontrolujte, zdali na webu nemá dlouhodobě kategorii se zlevněným zbožím, pro tuto kategorii byste mohli vytvořit katalogovky. Po Vánocích Pokud klient nestanoví jinak, kampaně nedoporučujeme pozastavit, ale pouze snížit rozpočty na minimum. Vypněte všechny reklamy s vánoční tématikou a copy. Nezapomeňte na katalogové reklamy s vánočním rámečkem. Komunikujte s klientem a plánujte povánoční kampaně s předstihem, ať nejste překvapení a můžete si připravit vše dostatečně dopředu (náplň akce, copy, grafika). Doporučte klientovi například: Povánoční výprodej – slevy až XY %! Lednové slevy Zbavujeme se zásob – poslední šance na tyto produkty za výhodné ceny! Detox po svátcích – produkty pro zdravější start do nového roku. Vyzkoušejte něco nového – objevte naše nové kolekce! Nejprodávanější produkty roku – kupte je teď se slevou!! Zlevněné bestsellery Vybavení na nový semestr – vše, co potřebujete do školy nebo práce. Možnost promovat povánoční příspěvky v sales kampani, nebo reengagement kampani. Dopředu si připravte obecné reklamy, které mohou běžet hned po Vánocích. Obecná nabídka = ta, která běží standardně Během Vánoc pravidelně kontrolujte kampaně (podle velikosti účtu 1x za 2 dny), zdali se kampaně doručují a nenastal žádný fuck up (př. nedoručování reklam, vyčerpání rozpočtu, zamítnutí reklam, atp.) Odpočívejte a nežerte moc cukroví. 😛 Po Novém roce Domluvte si meeting – shrňte loňský rok a diskutujte nad novoročními cíli klienta. Začněte s klientem plánovat první kvartál roku.',
23,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'1b415540-b41b-41a0-a0da-e6b2d3a713d3',
'11111111-1111-1111-1111-111111111104',
'Meta Ads - Pokročilé optimalizace a rozvoj účtu',
'<p>Zde evidujeme všechny možné nápady na rozvoj Meta Ads účtů. Jsou rozdělené dle kategorií. </p>
<h2>Katalog produktů</h2>
<ol>
<li>feed image editor - vylepšiť vizuál carouselu z katalógu, umiestnenie produktu, vizuálna identita, benefity, pracovanie s cenou</li>
<li>optimalizácia produktov v katalógu / setoch - zistiť, ktoré produkty sa najviac zobrazujú a či sa aj skutočne predávajú, následne ich vyradiť alebo viac propragovať (kombinácia dát z Meta ads + GA4)</li>
<li>externý nástroj / skript, ktorý rozkategorizuje produkty, podľa toho či sa predávajú, nepredávajú, zobrazujú a predávajú alebo naopak..... (aktuálne riešim, ak budem mať viac info a vyskúšané, môžem predstaviť)</li>
</ol>
<h2>Bannery a videa</h2>
<ol>
<li>Ak klient netvorí bannery ani videá, tak ďalší rozvoj je ten, aby ich začal tvoriť (tuto službu můžeme zajistit sami, nebo ji outsourcovat agentuře Social Mind.</li>
<li>Ak ich tvorí ale nemajú výsledky, navrhnime klientovi naše balíčky na tvorbu bannerov a videí</li>
<li>Pre videá, testujme rôzne hooky pre jedno video</li>
<li>U bannerů zkusme pracovat s různými nadpisy a variantami obrázků</li>
</ol>
<h2>Content</h2>
<ol>
<li>Nabádzajme klienta aby tvoril obsah</li>
<li>Definujme klientovi, aby nám pripravil organické predajné príspevky, ktoré budeme využívať v reklamách</li>
<li>Zapojenie UGC videí</li>
<li>Zapojenie Influencerov</li>
<li>Opět možný outsourcing agentuře Social Mind</li>
</ol>
<h2>Textace reklam</h2>
<ol>
<li><p>Písať lepšie texty pre reklamy, zamerať sa na problém, ktorý zákazník rieši (používej asistenta <a href="https://chatgpt.com/g/g-6mxYFJVxz-meta-ads-copy-creator">https://chatgpt.com/g/g-6mxYFJVxz-meta-ads-copy-creator</a>)</p>
</li>
<li><p>Můžeš vyzkoušet různé frameworky textů - <a href="https://jdmeier.com/copywriting-frameworks/">https://jdmeier.com/copywriting-frameworks/</a></p>
</li>
<li><p>spísať tabuľku aké všetky reklamy môžeme pripravovať</p>
</li>
<li><p>testovať rovnakú reklamu s iným textom</p>
</li>
<li><p>testovať rôzne formáty (statika / dynamika)</p>
</li>
<li><p>testovať advantage + vylepšenia v reklame</p>
</li>
</ol>
',
'Zde evidujeme všechny možné nápady na rozvoj Meta Ads účtů. Jsou rozdělené dle kategorií. Katalog produktů feed image editor vylepšiť vizuál carouselu z katalógu, umiestnenie produktu, vizuálna identita, benefity, pracovanie s cenou optimalizácia produktov v katalógu / setoch zistiť, ktoré produkty sa najviac zobrazujú a či sa aj skutočne predávajú, následne ich vyradiť alebo viac propragovať (kombinácia dát z Meta ads + GA4) externý nástroj / skript, ktorý rozkategorizuje produkty, podľa toho či sa predávajú, nepredávajú, zobrazujú a predávajú alebo naopak..... (aktuálne riešim, ak budem mať viac info a vyskúšané, môžem predstaviť) Bannery a videa Ak klient netvorí bannery ani videá, tak ďalší rozvoj je ten, aby ich začal tvoriť (tuto službu můžeme zajistit sami, nebo ji outsourcovat agentuře Social Mind. Ak ich tvorí ale nemajú výsledky, navrhnime klientovi naše balíčky na tvorbu bannerov a videí Pre videá, testujme rôzne hooky pre jedno video U bannerů zkusme pracovat s různými nadpisy a variantami obrázků Content Nabádzajme klienta aby tvoril obsah Definujme klientovi, aby nám pripravil organické predajné príspevky, ktoré budeme využívať v reklamách Zapojenie UGC videí Zapojenie Influencerov Opět možný outsourcing agentuře Social Mind Textace reklam Písať lepšie texty pre reklamy, zamerať sa na problém, ktorý zákazník rieši (používej asistenta https://chatgpt.com/g/g-6mxYFJVxz-meta-ads-copy-creator) Můžeš vyzkoušet různé frameworky textů https://jdmeier.com/copywriting-frameworks/ spísať tabuľku aké všetky reklamy môžeme pripravovať testovať rovnakú reklamu s iným textom testovať rôzne formáty (statika / dynamika) testovať advantage + vylepšenia v reklame',
24,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'b99b27ca-b551-4f6f-beaa-6f614504fd21',
'11111111-1111-1111-1111-111111111104',
'Meta Ads - názvosloví kampaní',
'<h2>Základní pravidla názvosloví:</h2>
<ul>
<li>Konzistentnost - snaž se být konzistentní s názvoslovím na úrovni účtu, aby se v něm dokázal rychle vyznat člověk, který v něm je poprvé.</li>
<li>Do názvů kampaní, sestav a reklam dávej datum, kdy bylo spuštěno - výrazně to zvýší přehlednost v účtu</li>
<li>Rozlišuj, jestli se jedná od Advantage kampaň a nebo manuální (stačí do názvu kampaně napsat “adv”</li>
<li>Pokud se jedná o sales kampaň (konverzní), nemusíš to psát do názvu. Pokud ale se jedná o reach nebo traffic, napiš to do názvu</li>
<li>Pokud optimalizuješ na něco jiného než purchase, napiš to do názvu kampaně nebo sestavy.</li>
</ul>
<p>Příklady a vysvětlení:</p>
<h3>1) Dlouhodobé kampaně</h3>
<table>
<thead>
<tr>
<th>Kampaň</th>
<th>Účel</th>
</tr>
</thead>
<tbody><tr>
<td>20/1/22-daba</td>
<td>Dynamická reklama z kalatalogu produktů zaměřená na nové zákazníky.</td>
</tr>
<tr>
<td>20/1/24-adv-daba</td>
<td>Advantage+ katalogovka</td>
</tr>
<tr>
<td>20/1/22-daba-rng</td>
<td>Dynamická reklama z kalatalogu produktů zaměřená na lidi, kteří nás již znají. (rng = reengagement)</td>
</tr>
<tr>
<td>20/1/22-drtg</td>
<td>Dynamický remarketing z katalogu produktů.</td>
</tr>
<tr>
<td>20/1/22-akv</td>
<td>Dlouhodobá akvizice nových potenciálních zákazníků (bannery / videa).</td>
</tr>
<tr>
<td>20/1/22-rtg</td>
<td>Dlouhodobý remarketing návštěvníků webu a social interakcí.</td>
</tr>
</tbody></table>
<h3>2) Krátkodobé kampaně (Flash akce, např. Black Friday)</h3>
<table>
<thead>
<tr>
<th>Kampaň</th>
<th>Účel</th>
</tr>
</thead>
<tbody><tr>
<td>20/1/22-Black Friday-(conv/traffic/reach)</td>
<td></td>
</tr>
<tr>
<td>20/1/22-Black Friday-conv</td>
<td>Cílíme na nové zákazníky. Typ cílení může být konverze, návštěvnost, dosah.</td>
</tr>
</tbody></table>
<h3>3) Názvosloví reklamních sestav</h3>
<table>
<thead>
<tr>
<th>Kampaň</th>
<th>Účel</th>
</tr>
</thead>
<tbody><tr>
<td>20/1/2022-open-all-value*</td>
<td>Otevřené cílení na lidi žijící v Čr, muži + ženy starší 18 let, optimalizace na hodnotu objednávky</td>
</tr>
<tr>
<td>20/1/2022-interests-SK-W-25-35-purchase</td>
<td>Cílení na zájmy na lidi žijící v SK, ženy 25-35 let, optimalizace na nákup</td>
</tr>
<tr>
<td>20/1/2022-Lookalike10%purchase-CZ+SK-18+-ATC</td>
<td>10% lookalike zákazníků žijící v CZ a SK, ženy 18+, optimalizace na přidání do košíku</td>
</tr>
<tr>
<td>20/1/2022-web visitors-30-CZ-18+-purchase</td>
<td>Remarketing všech návštěvníků webu za 30 dní.</td>
</tr>
<tr>
<td>20/1/2022-RTG Social-30-all-purchase</td>
<td>Remarketing social interakcí za 30 dní.</td>
</tr>
<tr>
<td>20/1/2022-RTG Max-all-purchase</td>
<td>Remarketing všech návštěvníků webu za 180 dní a všech social interakcí za 365 dní.</td>
</tr>
</tbody></table>
<p>*Optimalizace může být value, purchase, ATC (add to cart), IC (initiate checkout), AP (add payment info), LP (landig page views), click (kliknutí na reklamu). Nejčastěji budeš použivat value, purchase, ATC.</p>
<h3>3) Názvosloví reklam</h3>
<table>
<thead>
<tr>
<th>Kampaň</th>
<th>Účel</th>
</tr>
</thead>
<tbody><tr>
<td>20/1/2022-carousel/image/video/collection-popis reklamy</td>
<td>Vždy píšeme datum, typ kreativy a nějaké její rozlišení. Může být třeba “image-1”</td>
</tr>
</tbody></table>
',
'Základní pravidla názvosloví: Konzistentnost snaž se být konzistentní s názvoslovím na úrovni účtu, aby se v něm dokázal rychle vyznat člověk, který v něm je poprvé. Do názvů kampaní, sestav a reklam dávej datum, kdy bylo spuštěno výrazně to zvýší přehlednost v účtu Rozlišuj, jestli se jedná od Advantage kampaň a nebo manuální (stačí do názvu kampaně napsat “adv” Pokud se jedná o sales kampaň (konverzní), nemusíš to psát do názvu. Pokud ale se jedná o reach nebo traffic, napiš to do názvu Pokud optimalizuješ na něco jiného než purchase, napiš to do názvu kampaně nebo sestavy. Příklady a vysvětlení: 1) Dlouhodobé kampaně | Kampaň | Účel | | --| --| | 20/1/22-daba | Dynamická reklama z kalatalogu produktů zaměřená na nové zákazníky. | | 20/1/24-adv-daba | Advantage+ katalogovka | | 20/1/22-daba-rng | Dynamická reklama z kalatalogu produktů zaměřená na lidi, kteří nás již znají. (rng = reengagement) | | 20/1/22-drtg | Dynamický remarketing z katalogu produktů. | | 20/1/22-akv | Dlouhodobá akvizice nových potenciálních zákazníků (bannery / videa). | | 20/1/22-rtg | Dlouhodobý remarketing návštěvníků webu a social interakcí. | 2) Krátkodobé kampaně (Flash akce, např. Black Friday) | Kampaň | Účel | | --| --| | 20/1/22-Black Friday-(conv/traffic/reach) 20/1/22-Black Friday-conv | Cílíme na nové zákazníky. Typ cílení může být konverze, návštěvnost, dosah. | 3) Názvosloví reklamních sestav | Kampaň | Účel | | --| --| | 20/1/2022-open-all-value | Otevřené cílení na lidi žijící v Čr, muži + ženy starší 18 let, optimalizace na hodnotu objednávky | | 20/1/2022-interests-SK-W-25-35-purchase | Cílení na zájmy na lidi žijící v SK, ženy 25-35 let, optimalizace na nákup | | 20/1/2022-Lookalike10%purchase-CZ+SK-18+-ATC | 10% lookalike zákazníků žijící v CZ a SK, ženy 18+, optimalizace na přidání do košíku | | 20/1/2022-web visitors-30-CZ-18+-purchase | Remarketing všech návštěvníků webu za 30 dní. | | 20/1/2022-RTG Social-30-all-purchase | Remarketing social interakcí za 30 dní. | | 20/1/2022-RTG Max-all-purchase | Remarketing všech návštěvníků webu za 180 dní a všech social interakcí za 365 dní. | Optimalizace může být value, purchase, ATC (add to cart), IC (initiate checkout), AP (add payment info), LP (landig page views), click (kliknutí na reklamu). Nejčastěji budeš použivat value, purchase, ATC. 3) Názvosloví reklam | Kampaň | Účel | | --| --| | 20/1/2022-carousel/image/video/collection-popis reklamy | Vždy píšeme datum, typ kreativy a nějaké její rozlišení. Může být třeba “image-1” |',
25,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'fc496b6a-6de1-4e8f-b4a8-012453bc8b98',
'11111111-1111-1111-1111-111111111104',
'Meta Ads: Jak dělat krátké (flash) akce',
'<p>Tento SOP je určen pro interní potřeby týmu spravujícího kampaně na platformě Meta Ads. Cílem je zajistit efektivní přípravu, správu a optimalizaci kampaní během krátkodobých Flash akcí. Tyto akce vyžadují rychlou reakci, precizní nastavení kampaní a správné vyhodnocování výsledků, aby byly maximálně využity dostupné rozpočty a dosaženy co nejlepší výsledky.</p>
<p>Následující kroky poskytují jasný a strukturovaný postup pro plánování, realizaci a vyhodnocení Meta Ads kampaní, s důrazem na využití historických dat, optimalizaci rozpočtů a správné cílení. Dokument rovněž zahrnuje doporučení pro práci s kreativními prvky a přizpůsobení strategií konkrétním potřebám klienta.</p>
<h3><strong>1. Příprava kampaní</strong></h3>
<ol>
<li><strong>Nevypínejte dlouhodobé kampaně</strong>:<ul>
<li>Dlouhodobé kampaně mají nasbíraná historická data a během Flash akce mohou přinést lepší výsledky.</li>
<li>Místo vypnutí zvažte <strong>dočasné navýšení rozpočtu</strong> těchto kampaní (zohledněte aktuální výsledky).</li>
</ul>
</li>
<li><strong>Vytvoření prodejní kampaně (Sales)</strong>:<ul>
<li>Nastavte <strong>Advantage+ Sales Campaign</strong>.</li>
<li>V kampani mějte alespoň <strong>3 různé kreativy,</strong> například:<ul>
<li><strong>Banner</strong>: Statický vizuál s informací o Flash akci.</li>
<li><strong>Video</strong>: Krátké video prezentující akci nebo produkty.</li>
<li><strong>Dynamický carousel produktů</strong>: Použijte, pokud to odpovídá potřebám klienta (vhodné pro e-shopy s více produkty).</li>
<li>nebo příklad 2: katalog s rámečkem, collection a banner.</li>
</ul>
</li>
</ul>
</li>
<li><strong>Last call kampaň</strong> <ul>
<li>Zvažte spuštění samostatné advantage+ kampaně s kreativou obsahující last cally</li>
</ul>
</li>
</ol>
<p><strong>Příklad struktury kampaní</strong></p>
<table>
<thead>
<tr>
<th>Kampaň</th>
<th>Optimalizace</th>
<th>Cílení (sestavy)</th>
<th>Kreativy</th>
</tr>
</thead>
<tbody><tr>
<td>Adv+</td>
<td>Purchase</td>
<td>1x - Open</td>
<td>Banner, Video, DPA (carousel, frame)</td>
</tr>
<tr>
<td></td>
<td></td>
<td></td>
<td></td>
</tr>
</tbody></table>
<h3><strong>2. Optimalizace kampaní</strong></h3>
<ol>
<li><strong>Monitorování a vyhodnocování</strong>:<ul>
<li>Vyhodnocujte kampaně <strong>na základě dat z administrace e-shopu klienta</strong> – ta ukazují prodeje téměř v reálném čase.</li>
<li>Sledujte <strong>PNO (podíl nákladů na obratu)</strong>.</li>
<li>Při důležité akci kontaktujte klienta a zeptejte se, jak akci v průběhu hodnotí.<br> <strong>Kvůli škálování budgetů a kontrole výsledků by z naší strany během akce měla proběhnout alespoň 1 zpráva o tom, jak se situace vyvíjí a jak hodnotí akci klient.</strong></li>
<li>Data z Meta Ads mohou mít zpoždění (až několik dní) a GA4 zobrazuje konverze nejdříve následující den.</li>
</ul>
</li>
<li><strong>Řízení podle historických dat</strong>:<ul>
<li>Pokud je akce velmi krátká (1-3 dny), spoléhejte více na historická data a data přímo z webu než na platformy třetích stran.</li>
</ul>
</li>
</ol>
<hr>
<h3><strong>3. Doporučení pro kreativní obsah</strong></h3>
<ol>
<li><strong>Zaměřte se na vizuální prvky Flash akce</strong>:<ul>
<li>Upozorněte na časovou omezenost (např. odpočet času).</li>
<li>Komunikujte jasné výhody, jako jsou slevy, doprava zdarma nebo exkluzivní produkty.</li>
</ul>
</li>
<li><strong>Konzistence mezi kampaněmi</strong>:<ul>
<li>Použijte jednotný vizuální styl a sdělení napříč všemi kampaněmi (prodejní, remarketingovou i na dosah).</li>
</ul>
</li>
</ol>
<hr>
<h3><strong>4. Další doporučení</strong></h3>
<ol>
<li><strong>Rozpočet a přizpůsobení</strong>:<ul>
<li>Přizpůsobte strategie velikosti klienta a rozpočtu. Menší klienti mohou spustit pouze jednu nebo dvě kampaně, které budou nejefektivnější.</li>
</ul>
</li>
<li><strong>Testování</strong>:<ul>
<li>Pokud je čas, otestujte různé kreativy nebo cílení před hlavní akcí (například krátkou pilotní kampaní).</li>
<li>Pokud akce běží déle než 3 dny, buďte připravení na aktualizaci bannerů podle dosavadních winnerů. Případně testování dalších formátů reklam.</li>
</ul>
</li>
</ol>
<hr>
<p>Tento postup vám zajistí efektivní přípravu a správu kampaní na Meta Ads pro krátkodobé Flash akce, přičemž se zaměřuje na optimalizaci výkonu a správné vyhodnocování.</p>
',
'Tento SOP je určen pro interní potřeby týmu spravujícího kampaně na platformě Meta Ads. Cílem je zajistit efektivní přípravu, správu a optimalizaci kampaní během krátkodobých Flash akcí. Tyto akce vyžadují rychlou reakci, precizní nastavení kampaní a správné vyhodnocování výsledků, aby byly maximálně využity dostupné rozpočty a dosaženy co nejlepší výsledky. Následující kroky poskytují jasný a strukturovaný postup pro plánování, realizaci a vyhodnocení Meta Ads kampaní, s důrazem na využití historických dat, optimalizaci rozpočtů a správné cílení. Dokument rovněž zahrnuje doporučení pro práci s kreativními prvky a přizpůsobení strategií konkrétním potřebám klienta. Příprava kampaní Nevypínejte dlouhodobé kampaně: Dlouhodobé kampaně mají nasbíraná historická data a během Flash akce mohou přinést lepší výsledky. Místo vypnutí zvažte dočasné navýšení rozpočtu těchto kampaní (zohledněte aktuální výsledky). Vytvoření prodejní kampaně (Sales): Nastavte Advantage+ Sales Campaign. V kampani mějte alespoň 3 různé kreativy, například: Banner: Statický vizuál s informací o Flash akci. Video: Krátké video prezentující akci nebo produkty. Dynamický carousel produktů: Použijte, pokud to odpovídá potřebám klienta (vhodné pro e-shopy s více produkty). nebo příklad 2: katalog s rámečkem, collection a banner. Last call kampaň Zvažte spuštění samostatné advantage+ kampaně s kreativou obsahující last cally Příklad struktury kampaní | Kampaň | Optimalizace | Cílení (sestavy) | Kreativy | | --| --| --| --| | Adv+ | Purchase | 1x Open | Banner, Video, DPA (carousel, frame) | | | | | | Optimalizace kampaní Monitorování a vyhodnocování: Vyhodnocujte kampaně na základě dat z administrace e-shopu klienta – ta ukazují prodeje téměř v reálném čase. Sledujte PNO (podíl nákladů na obratu). Při důležité akci kontaktujte klienta a zeptejte se, jak akci v průběhu hodnotí. Kvůli škálování budgetů a kontrole výsledků by z naší strany během akce měla proběhnout alespoň 1 zpráva o tom, jak se situace vyvíjí a jak hodnotí akci klient. Data z Meta Ads mohou mít zpoždění (až několik dní) a GA4 zobrazuje konverze nejdříve následující den. Řízení podle historických dat: Pokud je akce velmi krátká (1-3 dny), spoléhejte více na historická data a data přímo z webu než na platformy třetích stran. --Doporučení pro kreativní obsah Zaměřte se na vizuální prvky Flash akce: Upozorněte na časovou omezenost (např. odpočet času). Komunikujte jasné výhody, jako jsou slevy, doprava zdarma nebo exkluzivní produkty. Konzistence mezi kampaněmi: Použijte jednotný vizuální styl a sdělení napříč všemi kampaněmi (prodejní, remarketingovou i na dosah). --Další doporučení Rozpočet a přizpůsobení: Přizpůsobte strategie velikosti klienta a rozpočtu. Menší klienti mohou spustit pouze jednu nebo dvě kampaně, které budou nejefektivnější. Testování: Pokud je čas, otestujte různé kreativy nebo cílení před hlavní akcí (například krátkou pilotní kampaní). Pokud akce běží déle než 3 dny, buďte připravení na aktualizaci bannerů podle dosavadních winnerů. Případně testování dalších formátů reklam. --Tento postup vám zajistí efektivní přípravu a správu kampaní na Meta Ads pro krátkodobé Flash akce, přičemž se zaměřuje na optimalizaci výkonu a správné vyhodnocování.',
26,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'bbb3b1c0-0099-48f0-b93c-ffbc60dc8c9c',
'11111111-1111-1111-1111-111111111105',
'Meta creative inspiration',
'<h3>🌟 <strong>Cieľ</strong></h3>
<p>Vytvoriť a udržiavať zdieľaný priečinok s inšpiratívnymi statickými bannermi z top e-commerce segmentov. Slúži na internú inšpiráciu alebo ako vizuálne nápady pre klientov. Cieľom je mať rýchly prístup k dobrým nápadom bez potreby analyzovať výkonnostné dáta. Má to uľahčiť prácu nášmu internému tímu, grafikom aj klientom pri tvorbe kreatív.</p>
<h3>📁 <strong>Štruktúra priečinkov</strong></h3>
<ul>
<li><strong>Hlavný priečinok</strong>: <a href="https://drive.google.com/drive/folders/1rluLoCmTWpBAKxLRrCGG8cu2g2907CZZ?usp=drive_link">1rluLoCmTWpBAKxLRrCGG8cu2g2907CZZ</a><ul>
<li>Podpriečinky podľa segmentu:<ul>
<li>Fashion &amp; Apparel (napr. legíny, bundy, mikiny, plavky)</li>
<li>Beauty &amp; Cosmetics (napr. rúže, sérum, masky, make-up štetce)</li>
<li>Health &amp; Supplements (napr. proteíny, vitamíny, spaľovače, kolagén)</li>
<li>Fitness &amp; Sports Gear (napr. tenisky, podložky, rukavice, švihadlá)</li>
<li>Home &amp; Decor (napr. sviečky, prikrývky, dekorácie, nábytok)</li>
<li>Electronics &amp; Gadgets (napr. smart hodinky, slúchadlá, powerbanky, LED svetlá)</li>
<li>Pets (napr. granule, pelechy, obojky, hračky)</li>
<li>Baby &amp; Kids (napr. oblečenie, hračky, plienky, dojčenské fľaše)</li>
<li>Food &amp; Beverage (napr. káva, snacky, proteínové tyčinky, smoothie)</li>
<li>Luxury &amp; Jewelry (napr. hodinky, náušnice, náramky, šperky)</li>
</ul>
</li>
</ul>
</li>
</ul>
<h3>🖼️ <strong>Názvoslovie súborov</strong></h3>
<p>Formát: <code>ZNAČKA_PRODUKT_FORMÁT</code></p>
<p><strong>Príklady:</strong></p>
<ul>
<li><code>Gymshark_Leggings_UGC.jpg</code></li>
<li><code>OuraRing_SleepTracker_BeforeAfter.jpg</code></li>
<li><code>TheOrdinary_Serum_Promo.jpg</code></li>
</ul>
<p><strong>Používané formáty:</strong></p>
<ul>
<li><code>UGC</code> – používateľský obsah (selfie, reálni ľudia)</li>
<li><code>BeforeAfter</code> – premeny pred/po</li>
<li><code>Promo</code> – akcie, zľavy</li>
<li><code>ProductShot</code> – produkt na čistom pozadí</li>
<li><code>CarouselSlide</code> – vizuál ako zo slideshow</li>
<li><code>Testimonial</code> – citát zákazníka, recenzia</li>
<li><code>Lifestyle</code> – produkt v reálnom použití</li>
<li><code>Comparison</code> – porovnanie s konkurenciou</li>
<li><code>Minimal</code> – čistý dizajn + CTA</li>
<li><code>Quote</code> – slogan alebo silný text</li>
</ul>
<h3>🧬 <strong>Kritériá pre výber kreatív</strong></h3>
<ul>
<li><strong>Typ</strong>: Len statický banner (screenshot alebo export) - zatiaľ bez video formátu</li>
<li><strong>Zdroj</strong>: Meta Ad Library, feed, konkurencia, interné kampane</li>
<li><strong>Účel</strong>: Inšpirácia formátom, layoutom, textom, vizuálom</li>
<li><strong>Vybrať</strong>: Všetko, čo vizuálne funguje alebo je pekne spracované, ideálne ak máme aj dáta, že to skutočne má dobrý performance</li>
</ul>
<h3>🗓️ <strong>Proces</strong></h3>
<ol>
<li><strong>Zber kreatív</strong><ul>
<li>Sleduj feed, konkurenciu, Ad Library, interné vizuály</li>
<li>Vytvor screenshot alebo stiahni banner</li>
<li>Premenuj podľa formátu (viď vyššie)</li>
</ul>
</li>
<li><strong>Nahrávanie</strong><ul>
<li>Nahraj do správneho podpriečinka podľa segmentu</li>
<li>Skontroluj názov a vyhni sa duplikátom</li>
</ul>
</li>
</ol>
<h3>🔧 <strong>Poznámky</strong></h3>
<ul>
<li>Nezahŕň videá zatiaľ. Keď bude pripravená nová etapa, SOP sa rozšíri.</li>
<li><strong>Tento systém je aktuálne dobrovoľný – nie je povinnosťou plniť priečinok pravidelne alebo v konkrétnom objeme. Je však na každom z nás, aby sme ho udržiavali živý a prínosný.</strong></li>
<li><strong>Ak chceme, aby nám priečinok slúžil dobre, je potrebné ho priebežne dopĺňať. Čím viac kvalitných kreatív pridáme, tým jednoduchšie budeme tvoriť kampane pre klientov aj pre seba.</strong></li>
<li>Inšpiračný priečinok má byť často aktualizovaný, jednoducho použiteľný a dostupný celému tímu.</li>
</ul>
<hr>
',
'🌟 Cieľ Vytvoriť a udržiavať zdieľaný priečinok s inšpiratívnymi statickými bannermi z top e-commerce segmentov. Slúži na internú inšpiráciu alebo ako vizuálne nápady pre klientov. Cieľom je mať rýchly prístup k dobrým nápadom bez potreby analyzovať výkonnostné dáta. Má to uľahčiť prácu nášmu internému tímu, grafikom aj klientom pri tvorbe kreatív. 📁 Štruktúra priečinkov Hlavný priečinok: 1rluLoCmTWpBAKxLRrCGG8cu2g2907CZZ Podpriečinky podľa segmentu: Fashion & Apparel (napr. legíny, bundy, mikiny, plavky) Beauty & Cosmetics (napr. rúže, sérum, masky, make-up štetce) Health & Supplements (napr. proteíny, vitamíny, spaľovače, kolagén) Fitness & Sports Gear (napr. tenisky, podložky, rukavice, švihadlá) Home & Decor (napr. sviečky, prikrývky, dekorácie, nábytok) Electronics & Gadgets (napr. smart hodinky, slúchadlá, powerbanky, LED svetlá) Pets (napr. granule, pelechy, obojky, hračky) Baby & Kids (napr. oblečenie, hračky, plienky, dojčenské fľaše) Food & Beverage (napr. káva, snacky, proteínové tyčinky, smoothie) Luxury & Jewelry (napr. hodinky, náušnice, náramky, šperky) 🖼️ Názvoslovie súborov Formát: ZNAČKA_PRODUKT_FORMÁT Príklady: Gymshark_Leggings_UGC.jpg OuraRing_SleepTracker_BeforeAfter.jpg TheOrdinary_Serum_Promo.jpg Používané formáty: UGC – používateľský obsah (selfie, reálni ľudia) BeforeAfter – premeny pred/po Promo – akcie, zľavy ProductShot – produkt na čistom pozadí CarouselSlide – vizuál ako zo slideshow Testimonial – citát zákazníka, recenzia Lifestyle – produkt v reálnom použití Comparison – porovnanie s konkurenciou Minimal – čistý dizajn + CTA Quote – slogan alebo silný text 🧬 Kritériá pre výber kreatív Typ: Len statický banner (screenshot alebo export) zatiaľ bez video formátu Zdroj: Meta Ad Library, feed, konkurencia, interné kampane Účel: Inšpirácia formátom, layoutom, textom, vizuálom Vybrať: Všetko, čo vizuálne funguje alebo je pekne spracované, ideálne ak máme aj dáta, že to skutočne má dobrý performance 🗓️ Proces Zber kreatív Sleduj feed, konkurenciu, Ad Library, interné vizuály Vytvor screenshot alebo stiahni banner Premenuj podľa formátu (viď vyššie) Nahrávanie Nahraj do správneho podpriečinka podľa segmentu Skontroluj názov a vyhni sa duplikátom 🔧 Poznámky Nezahŕň videá zatiaľ. Keď bude pripravená nová etapa, SOP sa rozšíri. Tento systém je aktuálne dobrovoľný – nie je povinnosťou plniť priečinok pravidelne alebo v konkrétnom objeme. Je však na každom z nás, aby sme ho udržiavali živý a prínosný. Ak chceme, aby nám priečinok slúžil dobre, je potrebné ho priebežne dopĺňať. Čím viac kvalitných kreatív pridáme, tým jednoduchšie budeme tvoriť kampane pre klientov aj pre seba. Inšpiračný priečinok má byť často aktualizovaný, jednoducho použiteľný a dostupný celému tímu. ---',
27,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'f246a558-09b7-4788-b076-8d0bbf5e476f',
'11111111-1111-1111-1111-111111111106',
'Nacenění rozšíření správy kampaní na další zemi (např. CZ → SK)',
'<p><em>Poslední aktualizace: 29. 7. 2025</em></p>
<h2>🧩 Účel</h2>
<p>Tento dokument definuje standardní postup při rozšíření výkonové správy kampaní (např. Meta Ads) do další země u stávajícího klienta. Cílem je zajistit spravedlivé a efektivní nacenění práce, jasný reporting a správnou interní odměnu.</p>
<hr>
<h2>🔁 Standardní postup</h2>
<h3>1. <strong>Zadání požadavku</strong></h3>
<ul>
<li><p><strong>Projektový manažer</strong> vytváří úkol ve <strong>Freelu</strong> a zadává požadavek na rozšíření spolupráce.</p>
</li>
<li><p>Úkol je třeba <strong>vložit do této složky ve Freelu:</strong></p>
<p>  👉 <a href="https://app.freelo.io/tasklist/1471620?layout=rows">https://app.freelo.io/tasklist/1471620?layout=rows</a></p>
</li>
<li><p>Do úkolu uveď:</p>
<ul>
<li>Pro jakou zemi má být rozšíření</li>
<li>Stav reklamních účtů a analytiky</li>
<li>Cíl (např. spuštění brand kampaní, akvizice, výkonnostní růst)</li>
<li><strong>Očekávaný počet hodin na setup (rozpad na analytiku, účty, technické věci)</strong></li>
<li>Požadovaný termín spuštění</li>
</ul>
</li>
</ul>
<h3>2. <strong>Příprava nabídky</strong></h3>
<ul>
<li><strong>Sales manager</strong> připraví na základě zadání <strong>nabídku v Notionu</strong>.</li>
<li>Po schválení jednoduše <strong>pošle odkaz projkeťákovi, aby poslal klientovi</strong>.</li>
</ul>
<h3>3. <strong>Úvodní setup – účtováno jako vícepráce</strong></h3>
<p>Veškeré přípravné práce před samotným spuštěním kampaní v nové zemi se účtují hodinově v režimu víceprací.</p>
<h3>Typické aktivity v rámci víceprací:</h3>
<table>
<thead>
<tr>
<th>Aktivita</th>
<th>Časový odhad</th>
</tr>
</thead>
<tbody><tr>
<td>Kontrola a nastavení analytiky, propojení dat, Looker Studio</td>
<td>2–5 hodin</td>
</tr>
<tr>
<td>Založení a nastavení reklamních účtů, propojení, katalogy, domény</td>
<td>3–8 hodin (dle stavu účtů)</td>
</tr>
</tbody></table>
<h3>4. <strong>Navýšení ceny za správu</strong></h3>
<ul>
<li><strong>Navýšení o +50 %</strong> z měsíční ceny za správu v hlavní zemi.</li>
<li>Účtuje se od momentu, <strong>kdy dojde ke spuštění kampaní v nové zemi a jejich aktivní správě.</strong></li>
</ul>
<blockquote>
<p>🎯 Poznámka: Klientovi je vždy potřeba dopředu zaslat časový odhad spolu s popisem prací. Vše se schvaluje předem jako vícepráce.</p>
</blockquote>
<hr>
<h2>👥 Odměňování týmu</h2>
<h3>1. <strong>Fáze setupu (vícepráce)</strong></h3>
<ul>
<li>Všichni členové týmu, kteří na setupu pracují, si <strong>trackují hodiny</strong> jako vícepráce a <strong>fakturují je dle hodinové sazby.</strong></li>
</ul>
<h3>2. <strong>Fáze aktivní správy</strong></h3>
<ul>
<li>Komu je svěřena správa kampaní v nové zemi, tomu se <strong>navýší měsíční odměna o +50 %</strong> proti správě hlavní země.</li>
<li>Interní rozdělení odpovědnosti probíhá vždy podle domluvy s projekťákem / hlavním specialistou.</li>
</ul>
<hr>
<h2>⚠️ Výjimky a schvalování</h2>
<ul>
<li>Pokud je spolupráce nastavena formou <strong>success fee</strong> nebo <strong>provize ze zisku</strong>, bude se rozšíření řešit <strong>individuálně.</strong></li>
<li><strong>Úpravu spolupráce vždy musí schválit Daniel Bauer.</strong></li>
</ul>
',
'Poslední aktualizace: 2025 🧩 Účel Tento dokument definuje standardní postup při rozšíření výkonové správy kampaní (např. Meta Ads) do další země u stávajícího klienta. Cílem je zajistit spravedlivé a efektivní nacenění práce, jasný reporting a správnou interní odměnu. --🔁 Standardní postup Zadání požadavku Projektový manažer vytváří úkol ve Freelu a zadává požadavek na rozšíření spolupráce. Úkol je třeba vložit do této složky ve Freelu: 👉 https://app.freelo.io/tasklist/1471620?layout=rows Do úkolu uveď: Pro jakou zemi má být rozšíření Stav reklamních účtů a analytiky Cíl (např. spuštění brand kampaní, akvizice, výkonnostní růst) Očekávaný počet hodin na setup (rozpad na analytiku, účty, technické věci) Požadovaný termín spuštění Příprava nabídky Sales manager připraví na základě zadání nabídku v Notionu. Po schválení jednoduše pošle odkaz projkeťákovi, aby poslal klientovi. Úvodní setup – účtováno jako vícepráce Veškeré přípravné práce před samotným spuštěním kampaní v nové zemi se účtují hodinově v režimu víceprací. Typické aktivity v rámci víceprací: | Aktivita | Časový odhad | | --| --| | Kontrola a nastavení analytiky, propojení dat, Looker Studio | 2–5 hodin | | Založení a nastavení reklamních účtů, propojení, katalogy, domény | 3–8 hodin (dle stavu účtů) | Navýšení ceny za správu Navýšení o +50 % z měsíční ceny za správu v hlavní zemi. Účtuje se od momentu, kdy dojde ke spuštění kampaní v nové zemi a jejich aktivní správě. 🎯 Poznámka: Klientovi je vždy potřeba dopředu zaslat časový odhad spolu s popisem prací. Vše se schvaluje předem jako vícepráce. --👥 Odměňování týmu Fáze setupu (vícepráce) Všichni členové týmu, kteří na setupu pracují, si trackují hodiny jako vícepráce a fakturují je dle hodinové sazby. Fáze aktivní správy Komu je svěřena správa kampaní v nové zemi, tomu se navýší měsíční odměna o +50 % proti správě hlavní země. Interní rozdělení odpovědnosti probíhá vždy podle domluvy s projekťákem / hlavním specialistou. --⚠️ Výjimky a schvalování Pokud je spolupráce nastavena formou success fee nebo provize ze zisku, bude se rozšíření řešit individuálně. Úpravu spolupráce vždy musí schválit Daniel Bauer.',
28,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'4e5c81e0-9f6c-493a-aa7f-0b34e339b3c5',
'11111111-1111-1111-1111-111111111103',
'Naceňování rozšíření spolupráce u stávajících klientů',
'<h3>Kdy použít:</h3>
<p>Klient, kterému už spravujeme nějakou službu (např. Meta Ads), nás požádá o další spolupráci (např. PPC, expanze do nové země, další sítě apod.).</p>
<hr>
<h3>📌 Postup krok za krokem:</h3>
<ol>
<li><p><strong>Zjisti od klienta, co přesně potřebuje</strong></p>
<p> → Jakou službu, proč, v jakém rozsahu, kdy chce začít.</p>
</li>
<li><p><strong>Přejdi do projektu <em>Socials – Interní</em> ve Freelu</strong></p>
<p> → Sekce: <em>To-Do list „Nabídky – stávající klienti“</em></p>
<p> → Odkaz: <a href="https://app.freelo.io/tasklist/1471620?layout=rows">https://app.freelo.io/tasklist/1471620?layout=rows</a></p>
</li>
<li><p><strong>Založ nový úkol</strong></p>
<p> Název úkolu: <code>Nabídka – [název klienta] – [stručně co chce]</code></p>
<p> Příklad: <code>Nabídka – SportX – správa Google Ads</code></p>
</li>
<li><p><strong>Do popisu úkolu napiš tyto informace:</strong></p>
<pre><code>🧩 Klient: [název klienta]
📌 Co potřebuje: [např. Google Ads, expanze, TikTok]
🎯 Důvod / kontext: [např. vstup na nový trh, navýšení výkonu]
📅 Požadovaný termín spuštění: [např. 1. 7. 2025]
👤 Kdo by to realizoval: [např. náš PPC tým, externista]
📍 Doplňující informace: [rozsah, specifika, omezení, rozpočet, cíle apod.]
</code></pre>
</li>
<li><p><strong>Přiřaď úkol Danielu Bauerovi</strong></p>
</li>
<li><p><strong>Hotovo.</strong></p>
<p> Daniel připraví nabídku a pošle ji tobě.</p>
<p> → <strong>Ty pak komunikuješ s klientem.</strong></p>
</li>
</ol>
',
'Kdy použít: Klient, kterému už spravujeme nějakou službu (např. Meta Ads), nás požádá o další spolupráci (např. PPC, expanze do nové země, další sítě apod.). --📌 Postup krok za krokem: Zjisti od klienta, co přesně potřebuje → Jakou službu, proč, v jakém rozsahu, kdy chce začít. *Přejdi do projektu Socials – Interní ve Freelu → Sekce: To-Do list „Nabídky – stávající klienti“→ Odkaz: https://app.freelo.io/tasklist/1471620?layout=rows Založ nový úkol Název úkolu: Nabídka – [název klienta] – [stručně co chce] Příklad: Nabídka – SportX – správa Google Ads Do popisu úkolu napiš tyto informace: `` 🧩 Klient: [název klienta] 📌 Co potřebuje: [např. Google Ads, expanze, TikTok] 🎯 Důvod / kontext: [např. vstup na nový trh, navýšení výkonu] 📅 Požadovaný termín spuštění: [např. 2025] 👤 Kdo by to realizoval: [např. náš PPC tým, externista] 📍 Doplňující informace: [rozsah, specifika, omezení, rozpočet, cíle apod.] `` Přiřaď úkol Danielu Bauerovi Hotovo. Daniel připraví nabídku a pošle ji tobě. → Ty pak komunikuješ s klientem.',
29,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'06257ddf-6dbd-424a-ae9a-31795a9dc23f',
'11111111-1111-1111-1111-111111111106',
'Navýšení paušálu u stávajícího klienta při změně rozsahu spolupráce',
'<p><em>Poslední aktualizace: 29. 7. 2025</em></p>
<hr>
<h2>🧩 Účel</h2>
<p>Tento SOP definuje, jak postupovat ve chvíli, kdy se u stávajícího klienta <strong>výrazně zvýší objem práce</strong> (např. větší rozpočet, více kampaní, častější úpravy) a je potřeba navrhnout <strong>navýšení fixní měsíční odměny</strong> za správu kampaní.</p>
<hr>
<h2>🧩 Kdy spustit tento proces</h2>
<p>Projektový manažer vyhodnotí, že rozsah práce se výrazně změnil oproti původní dohodě, například:</p>
<ul>
<li>📈 Výrazně vyšší měsíční rozpočet na kampaně (např. z 200k → 500k+)</li>
<li>🎯 Nárůst v počtu kampaní, reklamních sad nebo testování</li>
<li>⏱️ Častější komunikace, změny briefů, úpravy strategií</li>
<li>📊 Přibyly nové služby nebo kanály, které původně nebyly v rozsahu</li>
</ul>
<hr>
<h2>✅ Postup krok za krokem</h2>
<h3>1. Projekták zadá úkol ve Freelu</h3>
<ul>
<li><p><strong>Místo:</strong></p>
<p>  👉 <a href="https://app.freelo.io/tasklist/1471620?layout=rows">Freelo – Nabídky – stávající klienti</a></p>
</li>
<li><p><strong>Název úkolu:</strong></p>
<p>  <code>Navýšení paušálu – [Jméno klienta]</code></p>
</li>
<li><p><strong>Obsah úkolu:</strong></p>
<ul>
<li>Stručně popiš, jak se změnil rozsah práce (viz příklady níže).</li>
<li>Přidej info o zvýšení rozpočtu nebo workloadu.</li>
<li>Uveď, zda už to bylo s klientem předběžně řešeno.</li>
</ul>
</li>
</ul>
<p><strong>Příklad popisu:</strong></p>
<blockquote>
<p>Za poslední 2 měsíce klient navýšil měsíční spend z 250k na 600k.</p>
<p>Spouštíme 2–3× více reklamních sad než dříve.</p>
<p>Každý týden přichází nový brief nebo změny strategie.</p>
<p>Komunikace probíhá na denní bázi, workload je dvojnásobný oproti původnímu nastavení.</p>
<p>Navrhuji přepočítat paušál.</p>
</blockquote>
<hr>
<h3>2. Sales manager připraví návrh a text</h3>
<ul>
<li>Připraví text, kterým projekták komunikuje změnu s klientem.</li>
<li>Součástí bude rovnou <strong>konkrétní částka nového paušálu</strong>.</li>
<li>Text vloží do komentáře ve Freelu nebo do Notion nabídky.</li>
</ul>
<hr>
<h2>✉️ Šablona zprávy pro klienta (připravuje sales manager)</h2>
<blockquote>
<p>Dobrý den [jméno],</p>
<p>rád bych s Vámi otevřel téma nastavení měsíční správy kampaní. V posledních týdnech došlo k výraznému rozšíření spolupráce oproti původní dohodě – konkrétně:</p>
<ul>
<li>[např. Navýšení měsíčního rozpočtu z 250 000 Kč na 600 000 Kč]</li>
<li>[např. Nárůst počtu reklamních sad, testovacích variant a změn strategií]</li>
<li>[např. Intenzivnější komunikace a častější operativní zásahy]</li>
</ul>
<p>Abychom mohli i nadále poskytovat kvalitní servis a reflektovali aktuální rozsah prací, navrhujeme upravit měsíční paušál na <strong>[nová částka] Kč/měsíc</strong>.</p>
<p>V případě dotazů Vám vše rád představím i na krátkém callu.</p>
<p>Děkuji a těším se na Vaši zpětnou vazbu.</p>
</blockquote>
<hr>
<h2>💼 Úpravy v Raynetu</h2>
<p>Jakmile klient navýšení schválí, je nutné provést následující:</p>
<h3>1. <strong>Úprava fakturační částky klientovi</strong></h3>
<ul>
<li>V Raynetu upravit měsíční výši fakturace.</li>
<li>Nastavit od <strong>konkrétního měsíce</strong>, kdy změna platí.</li>
</ul>
<h3>2. <strong>Úprava interních odměn specialistům</strong></h3>
<ul>
<li>Specialistům, kteří spravují klienta, se <strong>navyšuje odměna poměrově</strong> podle navýšení paušálu.</li>
<li>Úprava se zapíše do Raynetu (karta klienta / rozpis odměn).</li>
<li>Pokud se správa dělí mezi více lidí, dohodne se konkrétní poměr mezi nimi.</li>
</ul>
<hr>
<h2>🔒 Poznámka</h2>
<ul>
<li>Každý návrh na navýšení paušálu <strong>musí projít přes Sales Managera</strong>.</li>
<li>U strategických klientů nebo v případech s provizním modelem je potřeba konzultace s Dannym.</li>
</ul>
',
'Poslední aktualizace: 2025 --🧩 Účel Tento SOP definuje, jak postupovat ve chvíli, kdy se u stávajícího klienta výrazně zvýší objem práce (např. větší rozpočet, více kampaní, častější úpravy) a je potřeba navrhnout navýšení fixní měsíční odměny za správu kampaní. --🧩 Kdy spustit tento proces Projektový manažer vyhodnotí, že rozsah práce se výrazně změnil oproti původní dohodě, například: 📈 Výrazně vyšší měsíční rozpočet na kampaně (např. z 200k → 500k+) 🎯 Nárůst v počtu kampaní, reklamních sad nebo testování ⏱️ Častější komunikace, změny briefů, úpravy strategií 📊 Přibyly nové služby nebo kanály, které původně nebyly v rozsahu --✅ Postup krok za krokem Projekták zadá úkol ve Freelu Místo: 👉 Freelo – Nabídky – stávající klienti Název úkolu: Navýšení paušálu – [Jméno klienta] Obsah úkolu: Stručně popiš, jak se změnil rozsah práce (viz příklady níže). Přidej info o zvýšení rozpočtu nebo workloadu. Uveď, zda už to bylo s klientem předběžně řešeno. Příklad popisu: Za poslední 2 měsíce klient navýšil měsíční spend z 250k na 600k. Spouštíme 2–3× více reklamních sad než dříve. Každý týden přichází nový brief nebo změny strategie. Komunikace probíhá na denní bázi, workload je dvojnásobný oproti původnímu nastavení. Navrhuji přepočítat paušál. --Sales manager připraví návrh a text Připraví text, kterým projekták komunikuje změnu s klientem. Součástí bude rovnou konkrétní částka nového paušálu. Text vloží do komentáře ve Freelu nebo do Notion nabídky. --✉️ Šablona zprávy pro klienta (připravuje sales manager) Dobrý den [jméno], rád bych s Vámi otevřel téma nastavení měsíční správy kampaní. V posledních týdnech došlo k výraznému rozšíření spolupráce oproti původní dohodě – konkrétně: [např. Navýšení měsíčního rozpočtu z 250 000 Kč na 600 000 Kč] [např. Nárůst počtu reklamních sad, testovacích variant a změn strategií] [např. Intenzivnější komunikace a častější operativní zásahy] Abychom mohli i nadále poskytovat kvalitní servis a reflektovali aktuální rozsah prací, navrhujeme upravit měsíční paušál na [nová částka] Kč/měsíc. V případě dotazů Vám vše rád představím i na krátkém callu. Děkuji a těším se na Vaši zpětnou vazbu. --💼 Úpravy v Raynetu Jakmile klient navýšení schválí, je nutné provést následující: Úprava fakturační částky klientovi V Raynetu upravit měsíční výši fakturace. Nastavit od konkrétního měsíce, kdy změna platí. Úprava interních odměn specialistům Specialistům, kteří spravují klienta, se navyšuje odměna poměrově podle navýšení paušálu. Úprava se zapíše do Raynetu (karta klienta / rozpis odměn). Pokud se správa dělí mezi více lidí, dohodne se konkrétní poměr mezi nimi. --🔒 Poznámka Každý návrh na navýšení paušálu musí projít přes Sales Managera. U strategických klientů nebo v případech s provizním modelem je potřeba konzultace s Dannym.',
30,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'6d631827-485f-4585-82cf-141600fc824b',
'11111111-1111-1111-1111-111111111103',
'Návod na sdílení přístupů - Socials',
'<h3><strong>1) Google Analytics 4</strong></h3>
<p>Přístup nasdílejte na e-maily <a href="mailto:socials@socials.cz">socials@socials.cz</a> a <a href="mailto:analytics@socials.cz">analytics@socials.cz</a></p>
<p>Úroveň přístupu: Marketer</p>
<p><a href="https://www.loom.com/share/edf982b384d54a0c822391650b2fd6b5?sid=266f439e-6696-4928-82a2-00846943a646">Video návod</a></p>
<h3><strong>2) Meta Business Manager</strong></h3>
<p>Udělte nám partnerský přístup ke všem položkám, které máte svoji značku vytvořené. Primárně se bude jednat o:</p>
<ul>
<li>Firemní stránka na Facebooku</li>
<li>Instagramový profil</li>
<li>Meta Ads Manager (správce reklam)</li>
<li>Meta Pixel</li>
<li>Katalog produktů</li>
</ul>
<p>ID našeho Facebook Business Manager: <strong>1196977750459552</strong></p>
<p><a href="https://www.loom.com/share/9dc11883f19b4c53b18b7ba4919ceed5?sid=609b3523-ec1a-4b02-8257-71ba62d13acb">Video návod</a></p>
<h3><strong>3) Google Ads</strong></h3>
<p>Pošlete nám ID reklamního účtu. Pozvánku pošleme z našeho MCC reklamního účtu a žádost přijde do e-mailu, na který máte vedený svůj Google Ads účet.</p>
<h3><strong>4) Google Search Console</strong></h3>
<p>Přístup nasdílejte na <a href="mailto:analytics@socials.cz">analytics@socials.cz</a></p>
<p>Úroveň přístupu: Omezený / Plný</p>
<p><a href="https://www.loom.com/share/92172ae2d403491dbe30f6b3056b77c9?sid=a6e2ea94-cc3c-4adf-8650-a1893c09db25">Video návod</a></p>
<h3><strong>5) Google Tag Manager</strong></h3>
<p>Přístup nasdílejte na e-mail <a href="mailto:analytics@socials.cz">analytics@socials.cz</a></p>
<p>Úroveň přístupu: Zveřejňovat / Administrátor</p>
<p><a href="https://www.loom.com/share/66d51a01893f434f8a46313af521bdf2?sid=b1e2b14d-9e53-4adc-857d-da969c0a74d5">Video návod</a></p>
<h3><strong>6) Google Merchant Center</strong></h3>
<p>Přístup nasdílejte na e-maily <a href="mailto:socials@socials.cz">socials@socials.cz</a> a <a href="mailto:analytics@socials.cz">analytics@socials.cz</a></p>
<p><a href="https://www.loom.com/share/63cd8e1ff5d14a4387dd466b7ea6dcc0?sid=54019cde-4905-41fd-a4c8-035e0c7c5f93">Video návod</a></p>
<h3><strong>7) Moje firma na Google</strong></h3>
<p>Přístup nasdílejte na e-maily <a href="mailto:socials@socials.cz">socials@socials.cz</a> a <a href="mailto:analytics@socials.cz">analytics@socials.cz</a></p>
<p>Úroveň přístupu: Správce</p>
<p><a href="https://www.youtube.com/watch?v=yGV4XeknnDA">Video návod</a></p>
<h3><strong>8) Seznam S-klik</strong></h3>
<p>Přístup nasdílejte na email <a href="mailto:mysocials@seznam.cz">mysocials@seznam.cz</a>.</p>
<p>Úroveň přístupu: Správce kampaní nebo Administrátor účtu</p>
<p><a href="https://www.youtube.com/watch?v=riFOLsQOK9E">Video návod</a></p>
<h3><strong>9) Firmy.cz</strong></h3>
<p>Přístup nasdílejte na email <a href="mailto:mysocials@seznam.cz">mysocials@seznam.cz</a>. Mělo by být možné udělit přístup v nastavení, ale může se stát, že budete muset napsat na podporu Firmy.cz, aby nám přístup přidali oni.</p>
<h3><strong>10) Heuréka.cz</strong></h3>
<p>Potřebujeme vaše přihlašovací údaje. Bohužel do Heuréky není možné přidat přístup jiným uživatelům.</p>
<h3><strong>11) Zboží.cz</strong></h3>
<p>Přístup nasdílejte na email <a href="mailto:mysocials@seznam.cz">mysocials@seznam.cz</a>.</p>
<p>Úroveň přístupu: Správce</p>
<p><a href="https://www.youtube.com/watch?v=y-kda_nWmxM">Video návod</a></p>
<h3>12) Favi</h3>
<p>Potřebujeme vaše přihlašovací údaje. </p>
<h3>13) Glami</h3>
<p>Potřebujeme vaše přihlašovací údaje.</p>
<h3><strong>14) Mergado.cz</strong></h3>
<p>Přístup nasdílejte na email <a href="mailto:socials@socials.cz">socials@socials.cz</a></p>
<p>Úroveň přístupu: Zápis</p>
<p><a href="https://www.youtube.com/watch?v=kndo31wVAFY">Video návod</a></p>
',
'1) Google Analytics 4 Přístup nasdílejte na e-maily socials@socials.cz a analytics@socials.cz Úroveň přístupu: Marketer Video návod 2) Meta Business Manager Udělte nám partnerský přístup ke všem položkám, které máte svoji značku vytvořené. Primárně se bude jednat o: Firemní stránka na Facebooku Instagramový profil Meta Ads Manager (správce reklam) Meta Pixel Katalog produktů ID našeho Facebook Business Manager: 1196977750459552 Video návod 3) Google Ads Pošlete nám ID reklamního účtu. Pozvánku pošleme z našeho MCC reklamního účtu a žádost přijde do e-mailu, na který máte vedený svůj Google Ads účet. 4) Google Search Console Přístup nasdílejte na analytics@socials.cz Úroveň přístupu: Omezený / Plný Video návod 5) Google Tag Manager Přístup nasdílejte na e-mail analytics@socials.cz Úroveň přístupu: Zveřejňovat / Administrátor Video návod 6) Google Merchant Center Přístup nasdílejte na e-maily socials@socials.cz a analytics@socials.cz Video návod 7) Moje firma na Google Přístup nasdílejte na e-maily socials@socials.cz a analytics@socials.cz Úroveň přístupu: Správce Video návod 8) Seznam S-klik Přístup nasdílejte na email mysocials@seznam.cz. Úroveň přístupu: Správce kampaní nebo Administrátor účtu Video návod 9) Firmy.cz Přístup nasdílejte na email mysocials@seznam.cz. Mělo by být možné udělit přístup v nastavení, ale může se stát, že budete muset napsat na podporu Firmy.cz, aby nám přístup přidali oni. 10) Heuréka.cz Potřebujeme vaše přihlašovací údaje. Bohužel do Heuréky není možné přidat přístup jiným uživatelům. 11) Zboží.cz Přístup nasdílejte na email mysocials@seznam.cz. Úroveň přístupu: Správce Video návod 12) Favi Potřebujeme vaše přihlašovací údaje. 13) Glami Potřebujeme vaše přihlašovací údaje. 14) Mergado.cz Přístup nasdílejte na email socials@socials.cz Úroveň přístupu: Zápis Video návod',
31,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'39885744-148b-4a57-83bc-5a608b4cbd78',
'11111111-1111-1111-1111-111111111104',
'Nový proces',
'',
'',
32,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'384b76ec-0ec1-4274-b4b3-849c6d6b3385',
'11111111-1111-1111-1111-111111111104',
'Nový proces',
'',
'',
33,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'4a921f26-cf7f-4869-99d1-e200b04c06ae',
'11111111-1111-1111-1111-111111111108',
'Onboarding nového kolegy',
'<h2>Papírovačky @Otakar Lucák</h2>
<ul>
<li><p>Zaslat e-mail s onboarding form - <a href="https://forms.gle/R9WeBTnBj6hxEqqz6">https://forms.gle/R9WeBTnBj6hxEqqz6</a> (po vyplnění formu dojde k zápisu do Airtable databáze) @Otakar Lucák</p>
<p>  <a href="Onboarding%20nov%C3%A9ho%20kolegy/Pre-onboarding%20e-mail%20pro%20nov%C3%A9ho%20kolegu%20f0ceb8a2258944afb7d8dc4c169df826.md">Pre-onboarding e-mail pro nového kolegu</a></p>
</li>
<li><p>Připravit a nechat podepsat smlouvu o spolupráci přes DigiSign @Dana Bauerová</p>
</li>
<li><p>Připravit a nechat podepsat GDPR písemný souhlas o zpracování údajů @Dana Bauerová</p>
<ul>
<li><p>Odeslat Welcome e-mail @Otakar Lucák</p>
<p>  <a href="Onboarding%20nov%C3%A9ho%20kolegy/Welcome%20e-mail%20pro%20nov%C3%A9%20kolegy%201478e29993e14463aa810708ee029408.md">Welcome e-mail pro nové kolegy</a></p>
</li>
</ul>
</li>
</ul>
<h2>Fáze 1.0 - Přístupy @Daniel Bauer</h2>
<p>Vytvořit Gsuite účet (křestní jmé<a href="mailto:no@socials.cz">no@socials.cz</a>)</p>
<ul>
<li><p>Přidat do Slacku</p>
</li>
<li><p>Přidat přístup do Notion Socials Hub</p>
</li>
<li><p>V Notion vytvořit osobní složku (zápis do databáze), kde budou tyto informace. Nasdílíme jen konkrétní zápis v databázi.</p>
<p>  Ve složce bude:</p>
<ul>
<li>Odkaz na Socials Hub</li>
<li>Projekty, které má ve správě + odměny</li>
<li>Video, jak Notion funguje a co kde najde</li>
</ul>
</li>
<li><p>Přidat do projektů ve Freelum, Slacku a Business Manager (pokud už má nový kolega nějaké přidělené)</p>
</li>
<li><p>Domluvit call / meeting a projít si společně všechny přístupy a nástroje. První call bude s Danem.</p>
<ul>
<li>Projít přístupy do jednotlivých nástrojů (Google, BM atd.)</li>
</ul>
</li>
</ul>
<h2>Fáze 1.1 - Technikálie a start spolupráce @Otakar Lucák</h2>
<ul>
<li>Odeslat Welcome package na adresu uvedenou ve formuláři</li>
<li>Domluvit si termín callu s předáním nových klientů, kde si projdeme:<ul>
<li>Naše vize, cíle a hodnoty</li>
<li>Připomeneme si raději ještě jednou nástroje, které využíváme</li>
<li>Představit kolegy, se kterýma bude v kontaktu</li>
<li>Domluvit postup zaškolení - přístupy do kurzů atd.</li>
<li>Předat první klienty</li>
</ul>
</li>
<li>Seznámit s týmem - poslat zprávu ve Slack channelu &quot;scls_talk&quot; - ideálně když by nový kolega/kolegyně natočil/a krátké video, kde se představí.</li>
<li>Přidat medailonek na web</li>
</ul>
<h2>Fáze 2 - Zaškolení</h2>
<p>Každý nový kolega bude mít ve své Notion složce postup zaškolení. Školení by mělo mít dva primární bloky:</p>
<ul>
<li>General - zde budou všechny obecné informace o Socials, které by měl znát každý</li>
<li>Specific - tato část bude specifická dle pracovní pozice</li>
</ul>
<p>Školení bude kombinace videí, textu a osobních setkání, kde se bude moci nový kolega na vše blíže doptat. Nahrané školící materiály by neměly být až moc konkrétní ale měly vy to být spíše general guidelines, abychom nemuseli videa každých pár měsíců přetáčet.</p>
',
'Papírovačky @Otakar Lucák Zaslat e-mail s onboarding form https://forms.gle/R9WeBTnBj6hxEqqz6 (po vyplnění formu dojde k zápisu do Airtable databáze) @Otakar Lucák Pre-onboarding e-mail pro nového kolegu Připravit a nechat podepsat smlouvu o spolupráci přes DigiSign @Dana Bauerová Připravit a nechat podepsat GDPR písemný souhlas o zpracování údajů @Dana Bauerová Odeslat Welcome e-mail @Otakar Lucák Welcome e-mail pro nové kolegy Fáze 1.0 Přístupy @Daniel Bauer Vytvořit Gsuite účet (křestní jméno@socials.cz) Přidat do Slacku Přidat přístup do Notion Socials Hub V Notion vytvořit osobní složku (zápis do databáze), kde budou tyto informace. Nasdílíme jen konkrétní zápis v databázi. Ve složce bude: Odkaz na Socials Hub Projekty, které má ve správě + odměny Video, jak Notion funguje a co kde najde Přidat do projektů ve Freelum, Slacku a Business Manager (pokud už má nový kolega nějaké přidělené) Domluvit call / meeting a projít si společně všechny přístupy a nástroje. První call bude s Danem. Projít přístupy do jednotlivých nástrojů (Google, BM atd.) Fáze 1.1 Technikálie a start spolupráce @Otakar Lucák Odeslat Welcome package na adresu uvedenou ve formuláři Domluvit si termín callu s předáním nových klientů, kde si projdeme: Naše vize, cíle a hodnoty Připomeneme si raději ještě jednou nástroje, které využíváme Představit kolegy, se kterýma bude v kontaktu Domluvit postup zaškolení přístupy do kurzů atd. Předat první klienty Seznámit s týmem poslat zprávu ve Slack channelu "scls_talk" ideálně když by nový kolega/kolegyně natočil/a krátké video, kde se představí. Přidat medailonek na web Fáze 2 Zaškolení Každý nový kolega bude mít ve své Notion složce postup zaškolení. Školení by mělo mít dva primární bloky: General zde budou všechny obecné informace o Socials, které by měl znát každý Specific tato část bude specifická dle pracovní pozice Školení bude kombinace videí, textu a osobních setkání, kde se bude moci nový kolega na vše blíže doptat. Nahrané školící materiály by neměly být až moc konkrétní ale měly vy to být spíše general guidelines, abychom nemuseli videa každých pár měsíců přetáčet.',
34,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'c8ea0141-4bb9-4819-bafb-0931256fc641',
'11111111-1111-1111-1111-111111111101',
'PÁTEŘNÍ NÁSTROJE, PŘÍSTUPY A ODPOVĚDNOSTI V SOCIALS (KOMPLETNÍ DOKUMENT)',
'<p>Tento dokument vysvětluje, na jakých nástrojích firma běží, kdo má jaké přístupy, jak fungují procesy a kdo za co odpovídá.</p>
<hr>
<h1><strong>1) Google Workspace (základ firmy)</strong></h1>
<p>Firma běží kompletně na Google Workspace.</p>
<p><strong>Hlavní firemní účet:</strong></p>
<ul>
<li><strong><a href="mailto:socials@socials.cz">socials@socials.cz</a></strong> – využívá se pro většinu firemních nástrojů<ul>
<li>Přístupy: <strong>Dan</strong>, <strong>Otas</strong>, <strong>Onlyhans</strong></li>
</ul>
</li>
</ul>
<p><strong>Co Workspace zahrnuje:</strong></p>
<ul>
<li>e-maily všech kolegů</li>
<li>Google Drive</li>
<li>Docs, Sheets, Slides</li>
<li>Meet</li>
<li>Kalendáře</li>
<li>Firemní správa nástrojů (billing, security)</li>
</ul>
<p><strong>Admin:</strong> Dan / Onlyhans</p>
<hr>
<h1><strong>2) Finanční nástroje &amp; účetnictví</strong></h1>
<h3><strong>Fakturoid (výnosové faktury)</strong></h3>
<ul>
<li>Přístupy: <strong>Dan</strong>, <strong>Otas</strong>, <strong>Dana Bauerová</strong></li>
<li>Napojený na Raynet – automatizované fakturace klientů</li>
<li>Víceslužby (vícepráce) se fakturují podle zápisů ve Freelo</li>
</ul>
<h3><strong>Wflow (nákladové faktury)</strong></h3>
<ul>
<li>Přístupy: <strong>Dan</strong>, <strong>Otas</strong>, <strong>Dana Bauerová</strong></li>
<li>Faktury se posílají na: <strong><a href="mailto:fakturace-socials-lumalis@wflowmail.com">fakturace-socials-lumalis@wflowmail.com</a></strong></li>
<li>Kolegové mají povinnost poslat faktury <strong>do 3. dne v měsíci</strong></li>
<li>Standardní proplacení <strong>do 14 dní</strong> (cíl: do 7 dní)</li>
</ul>
<h3><strong>Proces proplácení nákladů</strong></h3>
<ol>
<li>Kolega pošle fakturu do Wflow</li>
<li><strong>Dan</strong> schvaluje všechny faktury</li>
<li>Účetní firma (Lumalis) kontroluje každý <strong>úterý</strong></li>
<li><strong>Dana Bauerová</strong> provádí proplacení <strong>každou středu</strong></li>
</ol>
<h3><strong>Bankovní účet</strong></h3>
<ul>
<li><strong>Raiffeisenbank</strong></li>
<li>Číslo: <strong>66699336/5500</strong></li>
<li>IBAN: <strong>CZ7155000000000066699336</strong></li>
</ul>
<h3><strong>Účetní tým</strong></h3>
<ul>
<li>Běžná agenda: <strong>Hana Vojtajová – <a href="mailto:hana.vojtajova@lumalis.cz">hana.vojtajova@lumalis.cz</a></strong></li>
<li>Daňové poradenství: <strong>Lukáš Sokol – <a href="mailto:lukas.sokol@lumalis.cz">lukas.sokol@lumalis.cz</a></strong></li>
<li>Faktury &amp; proplácení: <strong>Dana Bauerová</strong> (komunikace s účetní firmou)</li>
</ul>
<h3><strong>Smlouvy</strong></h3>
<ul>
<li>Podepisujeme přes <strong>Digisign</strong></li>
<li>Přístupy: <strong>Dan</strong>, <strong>Otas</strong>, <strong>Dana Bauerová</strong></li>
<li>Login vedený na: <strong><a href="mailto:danny@socials.cz">danny@socials.cz</a></strong></li>
</ul>
<hr>
<h1><strong>3) Automatizace, data a technické věci</strong></h1>
<h3><strong>Make.com (hlavní automatizační platforma)</strong></h3>
<ul>
<li>Přístup přes <strong><a href="mailto:socials@socials.cz">socials@socials.cz</a></strong></li>
<li>Používáme pro většinu interních automatizací, tracking, reporting</li>
</ul>
<h3><strong>Zapier</strong></h3>
<ul>
<li>Používáme jen u některých klientů (výjimky)</li>
</ul>
<h3><strong>Airtable (páteřní firemní databáze)</strong></h3>
<ul>
<li>Účet: <strong><a href="mailto:socials@socials.cz">socials@socials.cz</a></strong></li>
<li>Uchovává tok firemních dat, napojená na Make</li>
</ul>
<h3><strong>Technický/automation support</strong></h3>
<ul>
<li><strong>Lukáš Baier – <a href="mailto:lukas@chorizolab.cz">lukas@chorizolab.cz</a> / 775 678 749</strong></li>
</ul>
<hr>
<h1><strong>4) Projektové řízení &amp; interní komunikace</strong></h1>
<h3><strong>Freelo (hlavní nástroj pro řízení projektů)</strong></h3>
<ul>
<li>Přístup: <strong><a href="mailto:socials@socials.cz">socials@socials.cz</a></strong></li>
<li>Všechny klientské úkoly, komunikace, schvalování, procesy</li>
<li>Používá se i pro evidenci víceslužeb</li>
</ul>
<h3><strong>Slack (interní komunikace)</strong></h3>
<ul>
<li>Admin: <strong><a href="mailto:danny@socials.cz">danny@socials.cz</a></strong></li>
<li>Kanály pro týmy</li>
<li>Integrace s Typeform/Make pro upozornění</li>
</ul>
<h3><strong>Google Drive (složky klientů)</strong></h3>
<ul>
<li>Přístup: <strong><a href="mailto:analytics@socials.cz">analytics@socials.cz</a></strong></li>
<li>Zde jsou vedeny všechny klientské složky, data, výstupy, analýzy</li>
</ul>
<hr>
<h1><strong>5) Reklamní platformy a marketingové nástroje</strong></h1>
<h3><strong>Meta Business Manager</strong></h3>
<ul>
<li>Admin: <strong>všichni Meta Ads specialisté</strong></li>
<li>Obsahuje: FB stránky, IG profily, reklamní účty, pixel, CAPI, katalogy</li>
</ul>
<h3><strong>Google účty</strong></h3>
<p>Vše vedené na <strong><a href="mailto:socials@socials.cz">socials@socials.cz</a></strong></p>
<ul>
<li>Google Ads</li>
<li>Google Analytics 4</li>
<li>Google Tag Manager</li>
<li>Merchant Center</li>
</ul>
<h3><strong>Sklik</strong></h3>
<ul>
<li>Účet: <strong><a href="mailto:mysocials@seznam.cz">mysocials@seznam.cz</a></strong></li>
<li>Přístupy: <strong>PPC specialisté</strong>, <strong>Dan</strong>, <strong>Otas</strong></li>
</ul>
<hr>
<h1><strong>6) CRM &amp; sběr poptávek</strong></h1>
<h3><strong>Raynet CRM</strong></h3>
<ul>
<li>Přístupy: <strong>Dan</strong>, <strong>Otas</strong>, <strong>Dana Bauerová</strong></li>
<li>Správa poptávek, dealflow, obchodní proces</li>
</ul>
<h3><strong>Typeform</strong></h3>
<ul>
<li>Klientské poptávky</li>
<li>HR formuláře</li>
<li>Registrace na live akce</li>
<li>Vstupní dotazníky</li>
</ul>
<hr>
<h1><strong>7) Kreativa a firemní obsah</strong></h1>
<h3><strong>Canva</strong></h3>
<ul>
<li>Účet: <strong><a href="mailto:socials@socials.cz">socials@socials.cz</a></strong></li>
</ul>
<h3><strong>Notion</strong></h3>
<ul>
<li>Firemní dokumentace, SOPs, onboarding, playbooky</li>
</ul>
<h3><strong>Loom</strong></h3>
<ul>
<li>Interní videonávody, tréninky, procesní vysvětlení</li>
</ul>
<hr>
<h1><strong>8) AI nástroje</strong></h1>
<ul>
<li><strong>ChatGPT</strong></li>
<li><strong>Claude</strong></li>
<li><strong>Lovable</strong></li>
</ul>
<p>Používáme je pro texty, analýzy, prototypy, kreativu, technické generování, SOPs a dokumentaci.</p>
<hr>
<h1><strong>9) Správa hesel</strong></h1>
<h3><strong>NordPass</strong></h3>
<ul>
<li>Admin login: <strong><a href="mailto:danny@socials.cz">danny@socials.cz</a></strong></li>
<li>Hesla jsou roztříděná ve složkách</li>
<li>Přístupy pro všechny členy týmu jsou přes účet <strong><a href="mailto:analytics@socials.cz">analytics@socials.cz</a></strong></li>
</ul>
<hr>
<h1><strong>10) Pravidla přístupů &amp; rozhodovací kompetence</strong></h1>
<h3><strong>Přidávání nových členů do nástrojů</strong></h3>
<ul>
<li>Může: <strong>Dan</strong>, <strong>Otas</strong>, <strong>Onlyhans</strong></li>
</ul>
<h3><strong>Schvalování obchodů</strong></h3>
<ul>
<li><strong>Balíčky Growth:</strong> může schválit <strong>David Hála</strong></li>
<li><strong>Add-on služby:</strong> může schválit <strong>David Hála</strong></li>
<li><strong>Vyšší balíčky &amp; custom nabídky:</strong> schvaluje <strong>Dan</strong></li>
</ul>
<h3><strong>Bezpečnost</strong></h3>
<ul>
<li>Doporučený 2FA nástroj: <strong>Google Authenticator</strong></li>
</ul>
<h2>Hlavní role a odpovědnosti</h2>
<table>
<thead>
<tr>
<th><strong>Jméno</strong></th>
<th><strong>Role</strong></th>
<th><strong>Kontakt</strong></th>
<th><strong>Zodpovědnosti / Oblasti</strong></th>
</tr>
</thead>
<tbody><tr>
<td><strong>Dan Bauer</strong></td>
<td>CEO</td>
<td>Slack</td>
<td>- Strategie a rozvoj služeb  - Klíčoví klienti a obchodní rozhodnutí  - Automatizace, AI  - Technologie a nástroje  - <strong>Finance</strong> (rozpočty, pricing, cashflow)  - <strong>Finální schválení všech cenových nabídek a plateb ve firmě</strong></td>
</tr>
<tr>
<td><strong>Otakar Lucák</strong></td>
<td>COO</td>
<td>Slack</td>
<td>- Marketing značky Socials  - HR (nábor, týmová péče)  - Projektové vedení  - Klientská péče  - Podpora při obchodních jednáních</td>
</tr>
<tr>
<td><strong>David Hála</strong></td>
<td>Sales Specialist</td>
<td>Slack</td>
<td>- Úvodní cally s novými klienty  - Zpracování poptávek  - Nacenění zakázek (nutné schválení od Dana)  - Audity kampaní a strategií  - Přepojení větších klientů na Dana</td>
</tr>
<tr>
<td><strong>Jaroslav Bobák</strong></td>
<td>Meta Ads Team Leader</td>
<td>Slack</td>
<td>- Vedení Meta Ads týmu  - Strategie a správa kampaní  - Školení kolegů v oblasti Meta Ads  - Eskalace a konzultace u složitých klientů</td>
</tr>
<tr>
<td><strong>Dana Bauerová</strong></td>
<td>Asistentka vedení</td>
<td>Slack / <a href="mailto:dana.bauerova@socials.cz">dana.bauerova@socials.cz</a></td>
<td>- Faktury, smlouvy, DPP  - Administrativní podpora týmu  - Organizace schůzek, rešerše, zápisy</td>
</tr>
<tr>
<td><strong>Jan Březovský</strong></td>
<td>Reporting &amp; analytika</td>
<td>Slack</td>
<td>- Reporting (Looker Studio, GA4, Meta, Google Ads)  - Měření a datová analytika (GTM, konverze)  - Vizualizace a interpretace dat</td>
</tr>
</tbody></table>
<ul>
<li>Google Workspace management |</li>
</ul>
',
'Tento dokument vysvětluje, na jakých nástrojích firma běží, kdo má jaké přístupy, jak fungují procesy a kdo za co odpovídá. --1) Google Workspace (základ firmy) Firma běží kompletně na Google Workspace. Hlavní firemní účet: socials@socials.cz – využívá se pro většinu firemních nástrojů Přístupy: Dan, Otas, Onlyhans Co Workspace zahrnuje: e-maily všech kolegů Google Drive Docs, Sheets, Slides Meet Kalendáře Firemní správa nástrojů (billing, security) Admin: Dan / Onlyhans --2) Finanční nástroje & účetnictví Fakturoid (výnosové faktury) Přístupy: Dan, Otas, Dana Bauerová Napojený na Raynet – automatizované fakturace klientů Víceslužby (vícepráce) se fakturují podle zápisů ve Freelo Wflow (nákladové faktury) Přístupy: Dan, Otas, Dana Bauerová Faktury se posílají na: fakturace-socials-lumalis@wflowmail.com Kolegové mají povinnost poslat faktury do dne v měsíci Standardní proplacení do 14 dní (cíl: do 7 dní) Proces proplácení nákladů Kolega pošle fakturu do Wflow Dan schvaluje všechny faktury Účetní firma (Lumalis) kontroluje každý úterý Dana Bauerová provádí proplacení každou středu Bankovní účet Raiffeisenbank Číslo: 66699336/5500 IBAN: CZ7155000000000066699336 Účetní tým Běžná agenda: Hana Vojtajová – hana.vojtajova@lumalis.cz Daňové poradenství: Lukáš Sokol – lukas.sokol@lumalis.cz Faktury & proplácení: Dana Bauerová (komunikace s účetní firmou) Smlouvy Podepisujeme přes Digisign Přístupy: Dan, Otas, Dana Bauerová Login vedený na: danny@socials.cz --3) Automatizace, data a technické věci Make.com (hlavní automatizační platforma) Přístup přes socials@socials.cz Používáme pro většinu interních automatizací, tracking, reporting Zapier Používáme jen u některých klientů (výjimky) Airtable (páteřní firemní databáze) Účet: socials@socials.cz Uchovává tok firemních dat, napojená na Make Technický/automation support Lukáš Baier – lukas@chorizolab.cz / 775 678 749 --4) Projektové řízení & interní komunikace Freelo (hlavní nástroj pro řízení projektů) Přístup: socials@socials.cz Všechny klientské úkoly, komunikace, schvalování, procesy Používá se i pro evidenci víceslužeb Slack (interní komunikace) Admin: danny@socials.cz Kanály pro týmy Integrace s Typeform/Make pro upozornění Google Drive (složky klientů) Přístup: analytics@socials.cz Zde jsou vedeny všechny klientské složky, data, výstupy, analýzy --5) Reklamní platformy a marketingové nástroje Meta Business Manager Admin: všichni Meta Ads specialisté Obsahuje: FB stránky, IG profily, reklamní účty, pixel, CAPI, katalogy Google účty Vše vedené na socials@socials.cz Google Ads Google Analytics 4 Google Tag Manager Merchant Center Sklik Účet: mysocials@seznam.cz Přístupy: PPC specialisté, Dan, Otas --6) CRM & sběr poptávek Raynet CRM Přístupy: Dan, Otas, Dana Bauerová Správa poptávek, dealflow, obchodní proces Typeform Klientské poptávky HR formuláře Registrace na live akce Vstupní dotazníky --7) Kreativa a firemní obsah Canva Účet: socials@socials.cz Notion Firemní dokumentace, SOPs, onboarding, playbooky Loom Interní videonávody, tréninky, procesní vysvětlení --8) AI nástroje ChatGPT Claude Lovable Používáme je pro texty, analýzy, prototypy, kreativu, technické generování, SOPs a dokumentaci. --9) Správa hesel NordPass Admin login: danny@socials.cz Hesla jsou roztříděná ve složkách Přístupy pro všechny členy týmu jsou přes účet analytics@socials.cz --10) Pravidla přístupů & rozhodovací kompetence Přidávání nových členů do nástrojů Může: Dan, Otas, Onlyhans Schvalování obchodů Balíčky Growth: může schválit David Hála Add-on služby: může schválit David Hála Vyšší balíčky & custom nabídky: schvaluje Dan Bezpečnost Doporučený 2FA nástroj: Google Authenticator Hlavní role a odpovědnosti | Jméno | Role | Kontakt | Zodpovědnosti / Oblasti | | --| --| --| --| | Dan Bauer | CEO | Slack | Strategie a rozvoj služeb Klíčoví klienti a obchodní rozhodnutí Automatizace, AI Technologie a nástroje Finance (rozpočty, pricing, cashflow) Finální schválení všech cenových nabídek a plateb ve firmě | | Otakar Lucák | COO | Slack | Marketing značky Socials HR (nábor, týmová péče) Projektové vedení Klientská péče Podpora při obchodních jednáních | | David Hála | Sales Specialist | Slack | Úvodní cally s novými klienty Zpracování poptávek Nacenění zakázek (nutné schválení od Dana) Audity kampaní a strategií Přepojení větších klientů na Dana | | Jaroslav Bobák | Meta Ads Team Leader | Slack | Vedení Meta Ads týmu Strategie a správa kampaní Školení kolegů v oblasti Meta Ads Eskalace a konzultace u složitých klientů | | Dana Bauerová | Asistentka vedení | Slack / dana.bauerova@socials.cz | Faktury, smlouvy, DPP Administrativní podpora týmu Organizace schůzek, rešerše, zápisy | | Jan Březovský | Reporting & analytika | Slack | Reporting (Looker Studio, GA4, Meta, Google Ads) Měření a datová analytika (GTM, konverze) Vizualizace a interpretace dat Google Workspace management |',
35,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'c47413ea-303e-418c-a473-baf11fff8bb4',
'11111111-1111-1111-1111-111111111105',
'Postup zadání grafiky - bannerů + videí (Creative Boost)',
'<p>Pokud nevíš, jak funguje Creative Boost, podívej se sem: </p>
<p><a href="Doporu%C4%8Den%C3%AD%20slu%C5%BEby%20Creative%20Boost%20-%20Tvorba%20grafiky%20%20fc512f3ea5754496beeded814d858552.md">Doporučení služby: Creative Boost - Tvorba grafiky do reklam</a></p>
<h2>⚠️ Důležité, čti!</h2>
<ul>
<li>Čerpání kreditů v rámci Creative Boost evidujeme v této tabulce: <a href="https://docs.google.com/spreadsheets/d/1FjnRX3tnWW-FHe_VBx68y52PXl9GcZaz/edit?gid=2022813599#gid=2022813599">https://docs.google.com/spreadsheets/d/1FjnRX3tnWW-FHe_VBx68y52PXl9GcZaz/edit?gid=2022813599#gid=2022813599</a></li>
<li>Meta Ads specialista / projekťák zadává kreativci přípravu bannerů nebo videí po domluvě s klientem.</li>
<li>Grafik udělá 1. Kolo návrhů (3-5 variant) a zasílá ke kontrole specialistovi, který zašle klientovi (Canva Link nebo PDF z PS) → Stačí pouze rozměr 1080x1080 - Feed</li>
<li>Klient má 1. Kolo připomínek, které píše ideálně do Canvy nebo Freela</li>
<li>Videa i bannery by se nahrávají na Google Drive do složky klienta</li>
</ul>
<hr>
<h3><strong>1.0) Zadání pro grafika pro úvodní balíček</strong></h3>
<p>Zadání připravuje Meta Ads specialista a na začátku projektu je vždy třeba dodat:</p>
<ul>
<li>URL produktů nebo kategorií, na které se dělají reklamy (3-5) <strong>⚠️ Úvodní balíček se dělá na produkty a kategorie, které se reálně použijí v reklamách!</strong></li>
<li>Odkaz na Google Drive, kde Grafik nalezne podklad od klienta</li>
<li>Logo</li>
<li>Font</li>
<li>Barvy</li>
<li>Brandmanual (pokud je)</li>
<li>Historické bannery, pokud mají konzistentní grafickou linku</li>
<li>Představu o bannerech (pokud specialista nebo projekťák mají)</li>
<li>Doporučení pro relevantní nálepky a info o slevové politice klienta (jestli dělá slevy a jaké)</li>
<li>Texty, které by měly být na banneru (můžeš použít GPT asistenta <a href="https://chatgpt.com/g/g-6mxYFJVxz-meta-ads-copy-creator">https://chatgpt.com/g/g-6mxYFJVxz-meta-ads-copy-creator</a>)</li>
</ul>
<p>Balíček by měl obsahovat (nejedná se o dogma)</p>
<p>👉 Variantu pro single produkt s bílým pozadím</p>
<p>👉 Variantu s fotkou</p>
<p>👉 Variantu přelepky (bestseller, novinka…) </p>
<p>👉 Variantu přelepky s cenou nebo slevou → <em>Info, jestli klient vůbec slevy dělá</em></p>
<p>👉 Rámeček do katalogové reklamy (pokud je pro klienta relevantní)</p>
<h3><strong>1.1) Zadání pro grafika pro průběžné úpravy</strong></h3>
<p>Následná grafika by měla vycházet z předpřipravených šablon. Projekťák nebo specialista zadává grafikovi přípravu nových bannerů a zadání obsahuje:</p>
<ul>
<li>URL produktu / kategorie</li>
<li>Obrázky, které chce do reklam vložit</li>
<li>Info o akci, ceně, slevě, dobu trvání akce…</li>
<li>Texty na banner</li>
<li>Jakou chce přelepku</li>
</ul>
<p>🚨 Oba, grafik i projekťák, jsou proaktivní a společně komunikují o tom, jaké bannery jsou úspěšné. Grafik by měl být schopen rozvíjet úspěšné bannery i sám, když mu dá projekťák info o výsledcích.</p>
<hr>
<h3><strong>2.0) Zadání pro video editora</strong></h3>
<ul>
<li>URL produktů nebo kategorií, na které se dělají reklamy (3-5) <strong>⚠️ Úvodní balíček se dělá na produkty a kategorie, které se reálně použijí v reklamách!</strong></li>
<li>Odkaz na Google Drive, kde Grafik nalezne podklad od klienta</li>
<li>Logo</li>
<li>Font</li>
<li>Barvy</li>
<li>Brandmanual (pokud je)</li>
<li>Historické bannery + videa, pokud mají konzistentní grafickou linku</li>
<li>Představu o videích (pokud specialista nebo projekťák mají)</li>
<li>Doporučení pro relevantní nálepky a info o slevové politice klienta (jestli dělá slevy a jaké)</li>
<li>Texty, které by měly být na banneru (můžeš použít GPT asistenta <a href="https://chatgpt.com/g/g-6mxYFJVxz-meta-ads-copy-creator">https://chatgpt.com/g/g-6mxYFJVxz-meta-ads-copy-creator</a>)</li>
</ul>
',
'Pokud nevíš, jak funguje Creative Boost, podívej se sem: Doporučení služby: Creative Boost Tvorba grafiky do reklam ⚠️ Důležité, čti! Čerpání kreditů v rámci Creative Boost evidujeme v této tabulce: https://docs.google.com/spreadsheets/d/1FjnRX3tnWW-FHe_VBx68y52PXl9GcZaz/edit?gid=2022813599#gid=2022813599 Meta Ads specialista / projekťák zadává kreativci přípravu bannerů nebo videí po domluvě s klientem. Grafik udělá Kolo návrhů (3-5 variant) a zasílá ke kontrole specialistovi, který zašle klientovi (Canva Link nebo PDF z PS) → Stačí pouze rozměr 1080x1080 Feed Klient má Kolo připomínek, které píše ideálně do Canvy nebo Freela Videa i bannery by se nahrávají na Google Drive do složky klienta --1.0) Zadání pro grafika pro úvodní balíček Zadání připravuje Meta Ads specialista a na začátku projektu je vždy třeba dodat: URL produktů nebo kategorií, na které se dělají reklamy (3-5) ⚠️ Úvodní balíček se dělá na produkty a kategorie, které se reálně použijí v reklamách! Odkaz na Google Drive, kde Grafik nalezne podklad od klienta Logo Font Barvy Brandmanual (pokud je) Historické bannery, pokud mají konzistentní grafickou linku Představu o bannerech (pokud specialista nebo projekťák mají) Doporučení pro relevantní nálepky a info o slevové politice klienta (jestli dělá slevy a jaké) Texty, které by měly být na banneru (můžeš použít GPT asistenta https://chatgpt.com/g/g-6mxYFJVxz-meta-ads-copy-creator) Balíček by měl obsahovat (nejedná se o dogma) 👉 Variantu pro single produkt s bílým pozadím 👉 Variantu s fotkou 👉 Variantu přelepky (bestseller, novinka…) 👉 Variantu přelepky s cenou nebo slevou → Info, jestli klient vůbec slevy dělá 👉 Rámeček do katalogové reklamy (pokud je pro klienta relevantní) 1.1) Zadání pro grafika pro průběžné úpravy Následná grafika by měla vycházet z předpřipravených šablon. Projekťák nebo specialista zadává grafikovi přípravu nových bannerů a zadání obsahuje: URL produktu / kategorie Obrázky, které chce do reklam vložit Info o akci, ceně, slevě, dobu trvání akce… Texty na banner Jakou chce přelepku 🚨 Oba, grafik i projekťák, jsou proaktivní a společně komunikují o tom, jaké bannery jsou úspěšné. Grafik by měl být schopen rozvíjet úspěšné bannery i sám, když mu dá projekťák info o výsledcích. --2.0) Zadání pro video editora URL produktů nebo kategorií, na které se dělají reklamy (3-5) ⚠️ Úvodní balíček se dělá na produkty a kategorie, které se reálně použijí v reklamách! Odkaz na Google Drive, kde Grafik nalezne podklad od klienta Logo Font Barvy Brandmanual (pokud je) Historické bannery + videa, pokud mají konzistentní grafickou linku Představu o videích (pokud specialista nebo projekťák mají) Doporučení pro relevantní nálepky a info o slevové politice klienta (jestli dělá slevy a jaké) Texty, které by měly být na banneru (můžeš použít GPT asistenta https://chatgpt.com/g/g-6mxYFJVxz-meta-ads-copy-creator)',
36,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'08d91a33-edf8-4572-bea6-1995a6f571fa',
'11111111-1111-1111-1111-111111111103',
'Pravidelné vyhodnocování spokojenosti klienta',
'<h1>Začátek spolupráce</h1>
<p>Při onboarding callu se klienta ptáme na řadu otázek, které nám naznačí, co je pro klienta důležité.</p>
<p>Mezi některé z nich například patří:</p>
<ul>
<li><strong>Jaké jsou vaše obchodní cíle pro následující období?</strong><br>To nám pomůže zjistit, jestli klient upřednostňuje růst prodejů, zefektivnění alokace rozpočtu, lepší komunikaci s marketingovou agenturou, zlepšení bannerů, atp.</li>
<li><strong>Jaké jsou klíčové metriky, které jsou pro vás důležité?</strong><br>PNO není jediný faktor. Majiteli z 99 % záleží na zisku, nikoliv na počtu objednávek nebo výši obratu. Dávejte si například bacha, abyste nereportovali skvělé výsledky z Mety a pak zpětně zjistili, že klient je po měsíci v mínusu.</li>
<li><strong>Jaký rozsah komunikace a reporting upřednostňujete?</strong><br>Představíme naše způsoby – meetingy, loom či zápisy ve Freelo. Co je pro něj lepší a jak často?</li>
<li><strong>Má stanovené konkrétní milníky nebo termíny, které jsou pro něj důležité?</strong> Sezónnost, novinky, atp.</li>
</ul>
<h1>Pravidelné vyhodnocování spokojenosti klienta</h1>
<h3>🗣️ <strong>Otázky k zavolání nebo poslané ve Freelo při reportingu :</strong></h3>
<ol>
<li><p><strong>Jak moc jste spokojený se spoluprací s námi na škále od 1 do 10, kde 1 je katastrofa a 10 je naprostá špička?</strong></p>
</li>
<li><p><strong>Co nám podle vás chybí k tomu, abychom to dotáhli na desítku?</strong></p>
</li>
<li><p><strong>Je něco, co vám poslední měsíc / kvartál udělalo radost, nebo vás naopak štvalo?</strong></p>
<p> <em>(volitelná otázka navíc – přidáš emoční rovinu, může být i formou “co tě potěšilo / nas</em>alo?” pokud máš s klientem neformální vztah)*</p>
</li>
</ol>
<h1>Pro majitele agentury</h1>
<ul>
<li>1x za kvartál by měl Oťas nebo Danny zavolat majiteli e-shopu a zeptat se, zdali je vše v pořádku. Neřešit detaily spolupráce, ale celkové očekávání, atp.</li>
</ul>
',
'Začátek spolupráce Při onboarding callu se klienta ptáme na řadu otázek, které nám naznačí, co je pro klienta důležité. Mezi některé z nich například patří: Jaké jsou vaše obchodní cíle pro následující období? To nám pomůže zjistit, jestli klient upřednostňuje růst prodejů, zefektivnění alokace rozpočtu, lepší komunikaci s marketingovou agenturou, zlepšení bannerů, atp. Jaké jsou klíčové metriky, které jsou pro vás důležité? PNO není jediný faktor. Majiteli z 99 % záleží na zisku, nikoliv na počtu objednávek nebo výši obratu. Dávejte si například bacha, abyste nereportovali skvělé výsledky z Mety a pak zpětně zjistili, že klient je po měsíci v mínusu. Jaký rozsah komunikace a reporting upřednostňujete? Představíme naše způsoby – meetingy, loom či zápisy ve Freelo. Co je pro něj lepší a jak často? Má stanovené konkrétní milníky nebo termíny, které jsou pro něj důležité? Sezónnost, novinky, atp. Pravidelné vyhodnocování spokojenosti klienta 🗣️ Otázky k zavolání nebo poslané ve Freelo při reportingu : Jak moc jste spokojený se spoluprací s námi na škále od 1 do 10, kde 1 je katastrofa a 10 je naprostá špička? Co nám podle vás chybí k tomu, abychom to dotáhli na desítku? Je něco, co vám poslední měsíc / kvartál udělalo radost, nebo vás naopak štvalo? (volitelná otázka navíc – přidáš emoční rovinu, může být i formou “co tě potěšilo / nasalo?” pokud máš s klientem neformální vztah)Pro majitele agentury 1x za kvartál by měl Oťas nebo Danny zavolat majiteli e-shopu a zeptat se, zdali je vše v pořádku. Neřešit detaily spolupráce, ale celkové očekávání, atp.',
37,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'ae8d7580-d388-4f53-8869-eb3ff9c56d72',
'11111111-1111-1111-1111-111111111107',
'Pravidelný průzkum klientské spokojenosti',
'<h1>Popis SOP</h1>
<p>Jednou za 2-3 měsíce zavolat klientům a zeptat se na zpětnou vazbu, ideálně Oťas, Dan nebo obchoďák.</p>
<h1>Frekvence</h1>
<p>Jednou za 2-3 měsíce.</p>
<h1>Odpovědi psát do Raynetu</h1>
<p>Do obchodního případu &gt; Historie &gt; + &gt; Telefonát &gt; Nadpis: Získávání zpětné vazby &gt; datum a čas jakékoliv &gt; doplnit hlavní bodový zápisek </p>
<h1>Skript</h1>
<p>[pokud klienta neznám, představím se a zmíním svou pozici ve firmě]<br>Dobrý den, jmenuji se Otakar Lucák, jsem spolumajitelem Socials.<br>Nechci vás dlouho zdržovat, mám na vás jen 2 otázky:</p>
<ol>
<li>Jak jste se spoluprací se Socials spokojení nebo nespokojení na škále 1-10, kde 1=katastrofa, 10=dokonalost?</li>
<li>Co nám chybí do 10?</li>
</ol>
<p><strong>Vysvětlení:</strong><br>Takhle získáš víc než informaci jedna (spoko) nebo nula (nespoko). Dostaneš relativně širokej benchmark, abys věděl, jestli se v čase zlepšujete, zhoršujete nebo je to konstantní výkon. A zároveň i velmi konkrétní zpětnou vazbu ke spolupráci, aniž bys implikoval, že se v něčem musíte zlepšovat.</p>
',
'Popis SOP Jednou za 2-3 měsíce zavolat klientům a zeptat se na zpětnou vazbu, ideálně Oťas, Dan nebo obchoďák. Frekvence Jednou za 2-3 měsíce. Odpovědi psát do Raynetu Do obchodního případu Historie + Telefonát Nadpis: Získávání zpětné vazby datum a čas jakékoliv doplnit hlavní bodový zápisek Skript [pokud klienta neznám, představím se a zmíním svou pozici ve firmě] Dobrý den, jmenuji se Otakar Lucák, jsem spolumajitelem Socials. Nechci vás dlouho zdržovat, mám na vás jen 2 otázky: Jak jste se spoluprací se Socials spokojení nebo nespokojení na škále 1-10, kde 1=katastrofa, 10=dokonalost? Co nám chybí do 10? Vysvětlení: Takhle získáš víc než informaci jedna (spoko) nebo nula (nespoko). Dostaneš relativně širokej benchmark, abys věděl, jestli se v čase zlepšujete, zhoršujete nebo je to konstantní výkon. A zároveň i velmi konkrétní zpětnou vazbu ke spolupráci, aniž bys implikoval, že se v něčem musíte zlepšovat.',
38,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'b1244f89-234a-4764-9d92-2c90309f507b',
'11111111-1111-1111-1111-111111111111',
'Pravidla komunikace ve Slacku a Freelu',
'<h3>Proč je důležité rozdělovat komunikaci?</h3>
<p>Správné rozdělení komunikace mezi Slack a Freelo je klíčové pro efektivní fungování firmy a udržení pořádku v projektech. Slack nám umožňuje rychlou a neformální interní komunikaci, zatímco Freelo slouží k přehlednému řízení klientských projektů a úkolů.</p>
<p>Důležité je také chránit naši interní komunikaci – klient by neměl mít přístup k interním diskuzím nebo řešení problémů. Přehledné rozdělení zajišťuje, že všichni víme, kde informace hledat, a snižuje riziko chyb nebo nejasností.</p>
<p>Dodržování těchto pravidel pomáhá:</p>
<ul>
<li><strong>Zlepšit spolupráci mezi týmy.</strong></li>
<li><strong>Zajistit dohledatelnost klíčových informací.</strong></li>
<li><strong>Minimalizovat zmatek v komunikaci.</strong></li>
</ul>
<p>Níže najdeš pravidla pro použití Slacku a Freela. 👇</p>
<h3><strong>Slack: Interní komunikace, celofiremní sdělení a zábava</strong></h3>
<p>Slack je primárním nástrojem pro rychlou interní komunikaci a sdílení informací v rámci týmu.</p>
<h3><strong>Pravidla pro Slack:</strong></h3>
<ol>
<li><strong>Použití</strong>:<ul>
<li>Interní komunikace, která není přímo vázaná na konkrétní klientský úkol.</li>
<li>Celofiremní oznámení (např. změny procesů, novinky).</li>
<li>Rychlá komunikace mezi členy týmu.</li>
<li>Prostor pro neformální interakce a zábavu.</li>
</ul>
</li>
<li><strong>Kanály</strong>:<ul>
<li><strong>#scls_</strong>: Interní firemní kanály.</li>
<li><strong>c_klient –&gt; Projektové kanály</strong>: Slouží ke koordinaci projektů, ale důležité informace patří do Freela.</li>
</ul>
</li>
<li><strong>Zásadní pravidlo</strong>:<ul>
<li>Pokud komunikace zahrnuje odkaz na práci nebo má dopad na více lidí, přesuňte diskusi do Freela.</li>
</ul>
</li>
</ol>
<hr>
<h3><strong>Freelo: Řízení klientských projektů a úkolů</strong></h3>
<p>Freelo je nástrojem pro správu úkolů, klientských projektů a koordinaci práce.</p>
<h3><strong>Pravidla pro Freelo:</strong></h3>
<ol>
<li><strong>Použití</strong>:<ul>
<li>Řešení všech úkolů a projektů spojených s klienty.</li>
<li>Diskuze, které zahrnují více lidí nebo obsahují odkazy (např. grafiku, dokumenty), by měly být vedeny přímo v úkolu.</li>
</ul>
</li>
<li><strong>Komunikace v úkolech</strong>:<ul>
<li>Pokud existuje úkol, <strong>řešme komunikaci primárně v rámci Freela</strong>.</li>
<li>Ujisti se, že všechny důležité detaily jsou zaznamenány v úkolu.</li>
</ul>
</li>
<li><strong>Interní problémy v úkolech</strong>:<ul>
<li>Pokud je v úkolu klient a je třeba vyřešit interní problém, využij Slack nebo vytvoř oddělený interní úkol ve Freelu, aby klient neměl přístup k interní komunikaci.</li>
</ul>
</li>
</ol>
<h3>Pravidla pro komunikaci ve Freelu</h3>
<ol>
<li><p><strong>Jeden úkol = jedno téma</strong></p>
<p> Úkol vždy pojmenuj konkrétně a řeší se v něm jen jedna věc. Pokud máš nové téma, vytvoř nový úkol.</p>
</li>
<li><p><strong>Složitější úkol = rozděl na podúkoly</strong></p>
<p> Když je úkol komplexní, rozepiš ho do podúkolů, aby bylo jasné, kdo a kdy má udělat jednotlivé kroky.</p>
</li>
<li><p><strong>Všechny důležité informace patří do úkolu</strong></p>
<p> Komentáře, odkazy, soubory i rozhodnutí zapisuj přímo do daného úkolu, ať jsou vždy dohledatelné.</p>
</li>
<li><p><strong>Úkol má vždy svého řešitele</strong></p>
<p>Úkol musí mít vždy přiřazeného odpovědného člověka a termín dokončení.</p>
</li>
<li><p><strong>Diskuze k úkolu vedeme ve Freelu, ne ve Slacku</strong></p>
<p> Pokud už existuje úkol, komunikace k němu probíhá tam, ne ve Slacku.</p>
</li>
<li><p><strong>Rozlišuj interní vs. klientskou komunikaci</strong></p>
<ul>
<li>Pokud je v projektu klient, interní poznámky zapisuj do samostatného interního úkolu nebo řeš ve Slacku.</li>
<li>Nikdy nepiš interní záležitosti do vlákna, které vidí klient.</li>
</ul>
</li>
<li><p><strong>Aktualizuj stav úkolů</strong></p>
<p> Po dokončení nebo změně vždy aktualizuj status, termín nebo popis úkolu. Nedokončené úkoly nesmí „viset“.</p>
</li>
<li><p><strong>Jednoduchost a přehlednost</strong></p>
<p> Piš stručně, jasně a bez zbytečností. Úkol má být pochopitelný i pro někoho, kdo ho uvidí poprvé.</p>
</li>
</ol>
<hr>
<h3><strong>Obecné zásady</strong></h3>
<ol>
<li><strong>Správné rozdělení komunikace</strong>:<ul>
<li><strong>Slack</strong>: Interní rychlá komunikace, celofiremní informace, zábava.</li>
<li><strong>Freelo</strong>: Řízení projektů, sdílení odkazů a řešení úkolů.</li>
</ul>
</li>
<li><strong>Transparentnost</strong>:<ul>
<li>Veškeré podklady, které mají dopad na více lidí, musí být sdíleny ve Freelu, aby byly snadno dohledatelné.</li>
</ul>
</li>
<li><strong>Ochrana interní komunikace</strong>:<ul>
<li>Interní problémy nebo diskuze, které by neměl vidět klient, řeš výhradně mimo viditelné úkoly (Slack nebo oddělený úkol).</li>
</ul>
</li>
</ol>
<hr>
<p>Tato pravidla mají zajistit efektivní komunikaci a lepší koordinaci práce. Pokud máš otázky nebo návrhy na zlepšení, dej vědět! 😊</p>
',
'Proč je důležité rozdělovat komunikaci? Správné rozdělení komunikace mezi Slack a Freelo je klíčové pro efektivní fungování firmy a udržení pořádku v projektech. Slack nám umožňuje rychlou a neformální interní komunikaci, zatímco Freelo slouží k přehlednému řízení klientských projektů a úkolů. Důležité je také chránit naši interní komunikaci – klient by neměl mít přístup k interním diskuzím nebo řešení problémů. Přehledné rozdělení zajišťuje, že všichni víme, kde informace hledat, a snižuje riziko chyb nebo nejasností. Dodržování těchto pravidel pomáhá: Zlepšit spolupráci mezi týmy. Zajistit dohledatelnost klíčových informací. Minimalizovat zmatek v komunikaci. Níže najdeš pravidla pro použití Slacku a Freela. 👇 Slack: Interní komunikace, celofiremní sdělení a zábava Slack je primárním nástrojem pro rychlou interní komunikaci a sdílení informací v rámci týmu. Pravidla pro Slack: Použití: Interní komunikace, která není přímo vázaná na konkrétní klientský úkol. Celofiremní oznámení (např. změny procesů, novinky). Rychlá komunikace mezi členy týmu. Prostor pro neformální interakce a zábavu. Kanály: #scls_: Interní firemní kanály. c_klient –Projektové kanály: Slouží ke koordinaci projektů, ale důležité informace patří do Freela. Zásadní pravidlo: Pokud komunikace zahrnuje odkaz na práci nebo má dopad na více lidí, přesuňte diskusi do Freela. --Freelo: Řízení klientských projektů a úkolů Freelo je nástrojem pro správu úkolů, klientských projektů a koordinaci práce. Pravidla pro Freelo: Použití: Řešení všech úkolů a projektů spojených s klienty. Diskuze, které zahrnují více lidí nebo obsahují odkazy (např. grafiku, dokumenty), by měly být vedeny přímo v úkolu. Komunikace v úkolech: Pokud existuje úkol, řešme komunikaci primárně v rámci Freela. Ujisti se, že všechny důležité detaily jsou zaznamenány v úkolu. Interní problémy v úkolech: Pokud je v úkolu klient a je třeba vyřešit interní problém, využij Slack nebo vytvoř oddělený interní úkol ve Freelu, aby klient neměl přístup k interní komunikaci. Pravidla pro komunikaci ve Freelu Jeden úkol = jedno téma Úkol vždy pojmenuj konkrétně a řeší se v něm jen jedna věc. Pokud máš nové téma, vytvoř nový úkol. Složitější úkol = rozděl na podúkoly Když je úkol komplexní, rozepiš ho do podúkolů, aby bylo jasné, kdo a kdy má udělat jednotlivé kroky. Všechny důležité informace patří do úkolu Komentáře, odkazy, soubory i rozhodnutí zapisuj přímo do daného úkolu, ať jsou vždy dohledatelné. Úkol má vždy svého řešitele Úkol musí mít vždy přiřazeného odpovědného člověka a termín dokončení. Diskuze k úkolu vedeme ve Freelu, ne ve Slacku Pokud už existuje úkol, komunikace k němu probíhá tam, ne ve Slacku. Rozlišuj interní vs. klientskou komunikaci Pokud je v projektu klient, interní poznámky zapisuj do samostatného interního úkolu nebo řeš ve Slacku. Nikdy nepiš interní záležitosti do vlákna, které vidí klient. Aktualizuj stav úkolů Po dokončení nebo změně vždy aktualizuj status, termín nebo popis úkolu. Nedokončené úkoly nesmí „viset“. Jednoduchost a přehlednost Piš stručně, jasně a bez zbytečností. Úkol má být pochopitelný i pro někoho, kdo ho uvidí poprvé. --Obecné zásady Správné rozdělení komunikace: Slack: Interní rychlá komunikace, celofiremní informace, zábava. Freelo: Řízení projektů, sdílení odkazů a řešení úkolů. Transparentnost: Veškeré podklady, které mají dopad na více lidí, musí být sdíleny ve Freelu, aby byly snadno dohledatelné. Ochrana interní komunikace: Interní problémy nebo diskuze, které by neměl vidět klient, řeš výhradně mimo viditelné úkoly (Slack nebo oddělený úkol). --Tato pravidla mají zajistit efektivní komunikaci a lepší koordinaci práce. Pokud máš otázky nebo návrhy na zlepšení, dej vědět! 😊',
39,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'eadf3d88-16d4-4c02-a886-831345acf6a8',
'11111111-1111-1111-1111-111111111113',
'Princípy meetingov',
'<hr>
<h1><strong>📅 Meta Ads tímové meetingy – ako to bude fungovať</strong></h1>
<p>Každý mesiac sa budeme stretávať na <strong>dvoch tímových meetingoch</strong>, vždy <strong>v 2. a 4. týždni mesiaca, v stredu o 15:00</strong>.</p>
<h1>💡Prečo to robíme?</h1>
<p>Ahojte,</p>
<p>pripravil som pre nás spoločnú poradu Meta Ads tímu. Bude to priestor, kde môžeme lepšie komunikovať, podeliť sa o skúsenosti, navzájom si pomôcť a spoločne vymýšľať nové nápady.</p>
<p>Pripravil som pár bodov, aby sme vedeli, prečo sa stretávame, čo nás čaká a čo si z toho môžeme odniesť. Verím, že nám to pomôže posunúť sa všetkým zas o kus ďalej. 🙂</p>
<ul>
<li><p><strong>🤔 Prečo sa stretávame? (Účel)</strong></p>
<p>  Chceme zlepšiť komunikáciu v tíme, zdieľať skúsenosti, navzájom si pomáhať a aktívne brainstormovať riešenia pre klientov. Porady nám pomôžu mať väčší prehľad o práci kolegov a posúvať sa ako tím.</p>
</li>
<li><p><strong>🎯 Čo chceme dosiahnuť? (Cieľ)</strong></p>
<ul>
<li>Vytvoriť priestor pre výmenu vedomostí a praxe.</li>
<li>Spoločne zlepšovať výsledky klientov.</li>
<li>Inšpirovať sa úspešnými príkladmi.</li>
<li>Riešiť problematické účty spoločne.</li>
<li>Stanoviť si jasné úlohy a výstupy do ďalšej porady.</li>
</ul>
</li>
<li><p><strong>📌 Čo musíme urobiť, aby sme to dosiahli?</strong></p>
<ul>
<li>Pripraviť si podklady pred poradou (napr. pre konkrétnych klientov).</li>
<li>Otvorene a konštruktívne diskutovať.</li>
<li>Pracovať s konkrétnymi dátami a skúsenosťami.</li>
<li>Rozdeliť si zodpovednosti a úlohy.</li>
<li>Zapísať si výstupy a sledovať ich naplnenie.</li>
</ul>
</li>
<li><p>✍️<strong>Ako budeme postupovať? (Agenda)</strong></p>
<ol>
<li><strong>Novinky z Meta Ads</strong><ul>
<li>Predstavenie aktuálnych noviniek</li>
<li>Ako ich implementovať v praxi</li>
<li>Návrhy na meranie a vyhodnotenie</li>
</ul>
</li>
<li><strong>Spätná väzba na vybraného klienta (BUF)</strong><ul>
<li>Vytipujeme klienta, každý si následne prejde účet</li>
<li>Každý člen porady poskytne svoj pohľad</li>
<li>Brainstorming návrhov na zlepšenie</li>
</ul>
</li>
<li><strong>Zdieľanie úspešného prípadu (good case)</strong><ul>
<li>Prezentácia klienta s výbornými výsledkami</li>
<li>Čo fungovalo, prečo a aké ponaučenie si vieme zobrať</li>
</ul>
</li>
<li><strong>Riešenie problémového klienta (bad case)</strong><ul>
<li>Spoločné hľadanie riešení</li>
<li>Návrhy, čo zapracovať alebo zmeniť</li>
</ul>
</li>
<li><strong>Záver – úlohy a výstupy</strong><ul>
<li>Rozdelenie úloh</li>
<li>Stanovenie deadlineov</li>
<li>Dohodnutie spôsobu implementácie a kontroly</li>
</ul>
</li>
</ol>
</li>
<li><p><strong>🤝 Aké sú pravidlá spolupráce?</strong></p>
<ul>
<li>Aktívne počúvať a rešpektovať sa</li>
<li>Byť konštruktívny a vecný</li>
<li>Pripraviť sa pred poradou</li>
<li>Otvorene zdieľať úspechy aj neúspechy</li>
<li>Dodržiavať časový rámec</li>
</ul>
</li>
<li><p><strong>🧑‍💻 Aké roly budeme mať?</strong></p>
<ul>
<li><strong>Moderátor:</strong> Jarda (pripravujem agendu, vediem stretnutie, sledujem čas a dynamiku)</li>
<li><strong>Účastníci:</strong> členovia Meta Ads tímu (pripravia si vstupy, zapájajú sa) Radka, Helen, David, AI OŤAS? DANDROID?</li>
<li><strong>Zapisovateľ (voliteľne):</strong> niekto, kto zapisuje kľúčové body a výstupy (dohodneme)</li>
</ul>
</li>
<li><p><strong>✅ Ako zistíme, že sme boli úspešní?</strong></p>
<ul>
<li>Boli novinky zrozumiteľne vysvetlené a pochopené</li>
<li>Bola poskytnutá kvalitná spätná väzba na klientov</li>
<li>Vznikli konkrétne návrhy a akčné kroky</li>
<li>Každý vie, čo má spraviť a do kedy</li>
<li>Tím bol zapojený a diskusia bola živá a prínosná</li>
</ul>
</li>
<li><p>🔜 <strong>Ako zabezpečíme follow-up?</strong></p>
<ul>
<li>Výstupy a úlohy budú spísané po porade</li>
<li>Jarda, sleduje ich plnenie a posúva ich na ďalšej porade</li>
<li>Na ďalšej porade začneme krátkym check-inom: čo sa implementovalo, čo fungovalo</li>
</ul>
</li>
</ul>
<p>Teším sa na vás a verím, že si z toho všetci niečo vezmeme. Bude to hlavne o nás a pre nás. ✌️</p>
<h2>🧑‍💻 MEETING 1 – Spätná väzba na klientov</h2>
<p>Zameriame sa na konkrétnych klientov – čo funguje, čo nie, čo vieme zlepšiť a ako si vieme navzájom pomôcť iným pohľadom.</p>
<p>📄 Viac info a štruktúru nájdeš tu: <a href="MEET%201%20Sp%C3%A4tn%C3%A1%20v%C3%A4zba%20na%20klienta%201dc51ff3df5780248261c884307a30d4.md">MEET 1: Spätná väzba na klienta</a> </p>
<h2>👩‍💻 MEETING 2 - Novinky, best practises &amp; how to</h2>
<p>Diskusia o novinkách, osvedčených postupoch, nápadoch a zlepšeniach. Cieľom je vytvárať si spoločné štandardy (SOP), ktoré nám uľahčia prácu.</p>
<p>V rámci každého druhého meetingu budeme mať priestor na <strong>diskusiu k voľne zvolenej téme</strong>, ktorá bude vychádzať z toho, <strong>čo aktuálne riešime, čo nás trápi alebo kde cítime priestor na zlepšenie</strong>.</p>
<p>📄 Viac info tu: <a href="MEET%202%20News,%20best%20practises,%20how%20to%201dc51ff3df5780908a59fceb0e786286.md">MEET 2: News, best practises, how to</a> </p>
<h3>🧰 <strong>Príprava a zadania</strong></h3>
<p>Agenda každého meetingu bude dopredu naplánovaná, s dostatočným predstihom na prípravu. 🎯</p>
<p><strong>Príprava bude vždy zadaná vo Freelo:</strong> <a href="https://app.freelo.io/tasklist/1426512">https://app.freelo.io/tasklist/1426512?</a></p>
<p>‼️ Meetingy sú tímová priorita a je <strong>dôležité, aby sa ich zúčastnil každý člen tímu</strong>. Zároveň budeme udržiavať priateľskú, otvorenú a podporujúcu atmosféru.</p>
<p>Ak máš akékoľvek otázky alebo návrhy, pokojne mi napíš. ✌️</p>
',
'--📅 Meta Ads tímové meetingy – ako to bude fungovať Každý mesiac sa budeme stretávať na dvoch tímových meetingoch, vždy v a týždni mesiaca, v stredu o 15:💡Prečo to robíme? Ahojte, pripravil som pre nás spoločnú poradu Meta Ads tímu. Bude to priestor, kde môžeme lepšie komunikovať, podeliť sa o skúsenosti, navzájom si pomôcť a spoločne vymýšľať nové nápady. Pripravil som pár bodov, aby sme vedeli, prečo sa stretávame, čo nás čaká a čo si z toho môžeme odniesť. Verím, že nám to pomôže posunúť sa všetkým zas o kus ďalej. 🙂 🤔 Prečo sa stretávame? (Účel) Chceme zlepšiť komunikáciu v tíme, zdieľať skúsenosti, navzájom si pomáhať a aktívne brainstormovať riešenia pre klientov. Porady nám pomôžu mať väčší prehľad o práci kolegov a posúvať sa ako tím. 🎯 Čo chceme dosiahnuť? (Cieľ) Vytvoriť priestor pre výmenu vedomostí a praxe. Spoločne zlepšovať výsledky klientov. Inšpirovať sa úspešnými príkladmi. Riešiť problematické účty spoločne. Stanoviť si jasné úlohy a výstupy do ďalšej porady. 📌 Čo musíme urobiť, aby sme to dosiahli? Pripraviť si podklady pred poradou (napr. pre konkrétnych klientov). Otvorene a konštruktívne diskutovať. Pracovať s konkrétnymi dátami a skúsenosťami. Rozdeliť si zodpovednosti a úlohy. Zapísať si výstupy a sledovať ich naplnenie. ✍️Ako budeme postupovať? (Agenda) Novinky z Meta Ads Predstavenie aktuálnych noviniek Ako ich implementovať v praxi Návrhy na meranie a vyhodnotenie Spätná väzba na vybraného klienta (BUF) Vytipujeme klienta, každý si následne prejde účet Každý člen porady poskytne svoj pohľad Brainstorming návrhov na zlepšenie Zdieľanie úspešného prípadu (good case) Prezentácia klienta s výbornými výsledkami Čo fungovalo, prečo a aké ponaučenie si vieme zobrať Riešenie problémového klienta (bad case) Spoločné hľadanie riešení Návrhy, čo zapracovať alebo zmeniť Záver – úlohy a výstupy Rozdelenie úloh Stanovenie deadlineov Dohodnutie spôsobu implementácie a kontroly 🤝 Aké sú pravidlá spolupráce? Aktívne počúvať a rešpektovať sa Byť konštruktívny a vecný Pripraviť sa pred poradou Otvorene zdieľať úspechy aj neúspechy Dodržiavať časový rámec 🧑‍💻 Aké roly budeme mať? Moderátor: Jarda (pripravujem agendu, vediem stretnutie, sledujem čas a dynamiku) Účastníci: členovia Meta Ads tímu (pripravia si vstupy, zapájajú sa) Radka, Helen, David, AI OŤAS? DANDROID? Zapisovateľ (voliteľne): niekto, kto zapisuje kľúčové body a výstupy (dohodneme) ✅ Ako zistíme, že sme boli úspešní? Boli novinky zrozumiteľne vysvetlené a pochopené Bola poskytnutá kvalitná spätná väzba na klientov Vznikli konkrétne návrhy a akčné kroky Každý vie, čo má spraviť a do kedy Tím bol zapojený a diskusia bola živá a prínosná 🔜 Ako zabezpečíme follow-up? Výstupy a úlohy budú spísané po porade Jarda, sleduje ich plnenie a posúva ich na ďalšej porade Na ďalšej porade začneme krátkym check-inom: čo sa implementovalo, čo fungovalo Teším sa na vás a verím, že si z toho všetci niečo vezmeme. Bude to hlavne o nás a pre nás. ✌️ 🧑‍💻 MEETING 1 – Spätná väzba na klientov Zameriame sa na konkrétnych klientov – čo funguje, čo nie, čo vieme zlepšiť a ako si vieme navzájom pomôcť iným pohľadom. 📄 Viac info a štruktúru nájdeš tu: MEET 1: Spätná väzba na klienta 👩‍💻 MEETING 2 Novinky, best practises & how to Diskusia o novinkách, osvedčených postupoch, nápadoch a zlepšeniach. Cieľom je vytvárať si spoločné štandardy (SOP), ktoré nám uľahčia prácu. V rámci každého druhého meetingu budeme mať priestor na diskusiu k voľne zvolenej téme, ktorá bude vychádzať z toho, čo aktuálne riešime, čo nás trápi alebo kde cítime priestor na zlepšenie. 📄 Viac info tu: MEET 2: News, best practises, how to 🧰 Príprava a zadania Agenda každého meetingu bude dopredu naplánovaná, s dostatočným predstihom na prípravu. 🎯 Príprava bude vždy zadaná vo Freelo: https://app.freelo.io/tasklist/1426512? ‼️ Meetingy sú tímová priorita a je dôležité, aby sa ich zúčastnil každý člen tímu. Zároveň budeme udržiavať priateľskú, otvorenú a podporujúcu atmosféru. Ak máš akékoľvek otázky alebo návrhy, pokojne mi napíš. ✌️',
40,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'24180ae2-be0f-4dd8-b12b-0092489a4176',
'11111111-1111-1111-1111-111111111107',
'Pro klienta: Jak přemýšlet nad Meta Ads',
'<p>Cíl: na úvodu spolupráce ukázat klientovi, jak nad tím přemýšlíme, co je a není důležité. Obzvlášť pro ty klienty, kteří si dělají reklamy sami. </p>
<p>Viz Konopný táta: <a href="https://docs.google.com/presentation/d/10ESO6dMYtsi5_WHV8v0K7tDrQ3noqqeK/edit?usp=sharing&ouid=117341827001405182253&rtpof=true&sd=true">https://docs.google.com/presentation/d/10ESO6dMYtsi5_WHV8v0K7tDrQ3noqqeK/edit?usp=sharing&amp;ouid=117341827001405182253&amp;rtpof=true&amp;sd=true</a></p>
<p>podobné i pro Gradu: </p>
<p><a href="https://docs.google.com/presentation/d/1B09oynTdmjvNx7kEHUpucN7wKH-7t07p/edit?usp=sharing&ouid=117341827001405182253&rtpof=true&sd=true">https://docs.google.com/presentation/d/1B09oynTdmjvNx7kEHUpucN7wKH-7t07p/edit?usp=sharing&amp;ouid=117341827001405182253&amp;rtpof=true&amp;sd=true</a></p>
',
'Cíl: na úvodu spolupráce ukázat klientovi, jak nad tím přemýšlíme, co je a není důležité. Obzvlášť pro ty klienty, kteří si dělají reklamy sami. Viz Konopný táta: https://docs.google.com/presentation/d/10ESO6dMYtsi5_WHV8v0K7tDrQ3noqqeK/edit?usp=sharing&ouid=117341827001405182253&rtpof=true&sd=true podobné i pro Gradu: https://docs.google.com/presentation/d/1B09oynTdmjvNx7kEHUpucN7wKH-7t07p/edit?usp=sharing&ouid=117341827001405182253&rtpof=true&sd=true',
41,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'2b594e50-8bf2-43a8-89f6-691e75db2258',
'11111111-1111-1111-1111-111111111103',
'Proaktivita',
'<h1>🧨 Katalog „wow momentů“ pro výkonnostní marketing</h1>
<blockquote>
<p>Cíl: Přinášet pravidelně přidanou hodnotu klientům bez nutnosti ad hoc vymýšlení.</p>
<p><strong>Použití:</strong> Projekták si každý 2-3 měsíce vybere 1 wow aktivitu pro top klienty.</p>
</blockquote>
<hr>
<h3>🎯 Společné „wow“ momenty pro všechny klienty</h3>
<ol>
<li><p><strong>Audit konkurence + mystery shopping</strong></p>
<blockquote>
<p><strong>Cílem je odhalit slabiny.</strong> Rychlý pohled na top 3 konkurenty prodávající stejné bestsellery nebo best kategorie – UX, cenotvorba, doprava/platba a zákaznická péče.</p>
</blockquote>
</li>
<li><p><strong>Analýza produktového portfolia</strong></p>
<blockquote>
<p>Zjisti, které produkty táhnou, které brzdí. Navrhni strategii pro škálování a optimalizaci.</p>
</blockquote>
</li>
<li><p><strong>Revize kampaní dle maržovosti produktů (primárně katalogovky)</strong></p>
<blockquote>
<p>Překryj data z kampaní s daty o maržích – navrhni úpravy budgetů a priorit.</p>
</blockquote>
</li>
<li><p><strong>Návrh akční kampaně</strong></p>
<blockquote>
<p>Např. bundle, sezónní motiv, dny dopravy zdarma, limitovaná nabídka. Včetně headline + struktury.</p>
</blockquote>
</li>
<li><p><strong>Loom video s komentářem</strong></p>
<blockquote>
<p>Rychlý záznam s naším pohledem na výkon, UX nebo strategii kampaní.</p>
</blockquote>
</li>
<li><p><strong>Revize nákupního procesu</strong></p>
<blockquote>
<p>Od reklamy po thank-you page – najdi úzká hrdla a dej návrhy zlepšení.</p>
</blockquote>
</li>
<li><p><strong>Vyhodnocení wow momentu konkurence</strong></p>
<blockquote>
<p>Co konkurence udělala skvěle? Jak to může klient využít?</p>
</blockquote>
</li>
<li><p><strong>Reklamy, které letí v oboru nebo obecně v e-commerce</strong></p>
<blockquote>
<p>Ukázky 3–5 výborných kampaní z trhu + inspirace, co z toho můžeme převzít.</p>
</blockquote>
</li>
<li><p><strong>Kreativní koncept měsíce</strong></p>
<blockquote>
<p>Jeden návrh vizuálního a textového přístupu k produktu ve stylu “natočení produktu za pomocí AI” nebo “Vytvoření reklamy s recenzemi”.</p>
</blockquote>
</li>
<li><p><strong>Zpětná vazba na brand / tone of voice</strong></p>
<blockquote>
<p>Připomínky ke konzistenci značky napříč webem, socials, e-maily.</p>
</blockquote>
</li>
</ol>
<hr>
<h3>🧩 Doplňující wow momenty, které máme již ve Freelo:</h3>
<h3>🟡 Vyladit katalog produktů</h3>
<ul>
<li><strong>Analýza napojení katalogu na kampaně</strong> – co chybí v feedu, jaký vliv mají parametry</li>
<li><strong>Zpětná vazba na názvy a popisky</strong> – nejen kvůli SEO, ale i konverzím</li>
</ul>
<h3>🟡 Bannery &amp; videa &amp; testování</h3>
<ul>
<li><strong>Test headline variant na bannerech</strong></li>
<li><strong>A/B test kreativy</strong> – co lépe táhne, jaký prvek tvoří rozdíl</li>
</ul>
<h3>🟡 Content</h3>
<ul>
<li><strong>Návrh postů / reels pro remarketing</strong></li>
<li><strong>Vizuální doporučení pro homepage nebo produktové stránky</strong></li>
</ul>
<h3>🟡 Meta Ads</h3>
<ul>
<li><strong>Analýza struktury kampaní</strong> – je optimalizovaná na konverze nebo jen na zobrazení?</li>
<li><strong>Využití Advantage+ nebo CAPI?</strong> – máme doporučení na technická zlepšení</li>
</ul>
<h3>🟡 Copywriting</h3>
<ul>
<li><strong>Revize textů na webu / kampaních</strong> – headline, claimy, popisky</li>
<li><strong>Překlad do “zákaznické řeči”</strong> – jak to říct jednodušeji, chytřeji, příměji</li>
</ul>
<h3>🟡 UX &amp; SEO</h3>
<ul>
<li><strong>UX komentář k mobilní verzi e-shopu</strong></li>
<li><strong>Mini SEO audit (title, H1, struktura)</strong></li>
</ul>
<h3>🟡 Doplňky Shoptet &amp; nástroje</h3>
<ul>
<li><strong>Doporučení na konkrétní doplněk, který zvýší konverzi nebo usnadní správu</strong></li>
<li><strong>Analýza využití stávajících doplňků a automatizací</strong></li>
</ul>
',
'🧨 Katalog „wow momentů“ pro výkonnostní marketing Cíl: Přinášet pravidelně přidanou hodnotu klientům bez nutnosti ad hoc vymýšlení. Použití: Projekták si každý 2-3 měsíce vybere 1 wow aktivitu pro top klienty. --🎯 Společné „wow“ momenty pro všechny klienty Audit konkurence + mystery shopping Cílem je odhalit slabiny. Rychlý pohled na top 3 konkurenty prodávající stejné bestsellery nebo best kategorie – UX, cenotvorba, doprava/platba a zákaznická péče. Analýza produktového portfolia Zjisti, které produkty táhnou, které brzdí. Navrhni strategii pro škálování a optimalizaci. Revize kampaní dle maržovosti produktů (primárně katalogovky) Překryj data z kampaní s daty o maržích – navrhni úpravy budgetů a priorit. Návrh akční kampaně Např. bundle, sezónní motiv, dny dopravy zdarma, limitovaná nabídka. Včetně headline + struktury. Loom video s komentářem Rychlý záznam s naším pohledem na výkon, UX nebo strategii kampaní. Revize nákupního procesu Od reklamy po thank-you page – najdi úzká hrdla a dej návrhy zlepšení. Vyhodnocení wow momentu konkurence Co konkurence udělala skvěle? Jak to může klient využít? Reklamy, které letí v oboru nebo obecně v e-commerce Ukázky 3–5 výborných kampaní z trhu + inspirace, co z toho můžeme převzít. Kreativní koncept měsíce Jeden návrh vizuálního a textového přístupu k produktu ve stylu “natočení produktu za pomocí AI” nebo “Vytvoření reklamy s recenzemi”. Zpětná vazba na brand / tone of voice Připomínky ke konzistenci značky napříč webem, socials, e-maily. --🧩 Doplňující wow momenty, které máme již ve Freelo: 🟡 Vyladit katalog produktů Analýza napojení katalogu na kampaně – co chybí v feedu, jaký vliv mají parametry Zpětná vazba na názvy a popisky – nejen kvůli SEO, ale i konverzím 🟡 Bannery & videa & testování Test headline variant na bannerech A/B test kreativy – co lépe táhne, jaký prvek tvoří rozdíl 🟡 Content Návrh postů / reels pro remarketing Vizuální doporučení pro homepage nebo produktové stránky 🟡 Meta Ads Analýza struktury kampaní – je optimalizovaná na konverze nebo jen na zobrazení? Využití Advantage+ nebo CAPI? – máme doporučení na technická zlepšení 🟡 Copywriting Revize textů na webu / kampaních – headline, claimy, popisky Překlad do “zákaznické řeči” – jak to říct jednodušeji, chytřeji, příměji 🟡 UX & SEO UX komentář k mobilní verzi e-shopu Mini SEO audit (title, H1, struktura) 🟡 Doplňky Shoptet & nástroje Doporučení na konkrétní doplněk, který zvýší konverzi nebo usnadní správu Analýza využití stávajících doplňků a automatizací',
42,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'fcab63e9-e019-47cb-b316-eef2f8fffe28',
'11111111-1111-1111-1111-111111111102',
'Proces schvalování proplácení přijatých faktur (nákladů) ve Wflow',
'<p><strong>Schvalovatel:</strong> Daniel Bauer</p>
<p><strong>Odpovědná osoba za úhrady:</strong> Dana Bauerová</p>
<p><strong>Účetní firma:</strong> Lumalis</p>
<hr>
<h2>🎯 <strong>Cíl SOP:</strong></h2>
<p>Zajistit, že budou včas a správně proplaceny pouze ty faktury, které:</p>
<p>✅ jsou určeny k úhradě bankovním převodem</p>
<p>✅ prošly interním schválením</p>
<p>✅ byly účetně zkontrolovány firmou Lumalis</p>
<p>✅ jsou ve stavu <strong>„Schválené k proplacení“</strong></p>
<hr>
<h2>🧩 <strong>Proces krok za krokem</strong></h2>
<h3>1. <strong>Příjem faktur do Wflow</strong></h3>
<ul>
<li>Faktury se do Wflow dostávají:<ul>
<li><p>Automaticky z napojených nástrojů (např. Google, Meta),</p>
</li>
<li><p>Nebo <strong>ručně e-mailem</strong> – pošli fakturu jako přílohu na:</p>
<p>  <code>fakturace-socials-lumalis@wflowmail.com</code></p>
</li>
</ul>
</li>
</ul>
<hr>
<h3>2. <strong>První schválení – Daniel Bauer</strong></h3>
<ul>
<li><strong>Dan Bauer</strong> je první, kdo faktury schvaluje.</li>
<li>Všechny přijaté faktury projde a u každé zkontroluje:<ul>
<li>částku, splatnost, variabilní symbol, dodavatele, náležitosti.</li>
</ul>
</li>
<li>Pokud je vše v pořádku, označí fakturu jako <strong>„Schváleno“</strong>.</li>
<li><strong>Bez tohoto kroku ji účetní firma dále nezpracovává.</strong></li>
</ul>
<hr>
<h3>3. <strong>Kontrola účetní firmou Lumalis (úterý)</strong></h3>
<ul>
<li>Po schválení Danem provádí Lumalis každé <strong>úterý</strong> účetní kontrolu:<ul>
<li>ověření formálních náležitostí, sazeb DPH, zaúčtování,</li>
<li>případně přidají <strong>komentář</strong>, pokud je potřeba něco upravit.</li>
</ul>
</li>
<li>Faktury bez připomínek přejdou do stavu <strong>„Schválené k proplacení“</strong>.</li>
</ul>
<h3>✉️ Kontaktní osoby v Lumalis:</h3>
<ul>
<li><p><strong>Běžná agenda a komentáře ve Wflow:</strong></p>
<p>  🧑‍💼 <em>Hana Vojtajová</em> – <a href="mailto:hana.vojtajova@lumalis.cz">hana.vojtajova@lumalis.cz</a></p>
</li>
<li><p><strong>Pokročilé účetní nebo daňové dotazy:</strong></p>
<p>  🧑‍💼 <em>Lukáš Sokol (daňový poradce)</em> – <a href="mailto:lukas.sokol@lumalis.cz">lukas.sokol@lumalis.cz</a></p>
</li>
</ul>
<hr>
<h3>4. <strong>Úhrada faktur (středa – Dana Bauerová)</strong></h3>
<ul>
<li>Dana Bauerová kontroluje složku / stav <strong>„Schválené k proplacení“</strong>.</li>
<li>U každé faktury zkontroluje:<ul>
<li>že je schválena Danem,</li>
<li>že <strong>neobsahuje komentář od Lumalis</strong>.</li>
</ul>
</li>
<li>Pokud je vše v pořádku:<ul>
<li>provede úhradu dle údajů na faktuře (částka, VS, IBAN),</li>
<li>označí fakturu jako <strong>„Zaplaceno“</strong>.</li>
</ul>
</li>
<li>Pokud je přidán komentář od účetní firmy:<ul>
<li>řeší ho <strong>primárně Dana Bauerová</strong>,</li>
<li>pokud nestačí, eskaluje na <strong>Daniela Bauera</strong>.</li>
</ul>
</li>
</ul>
<hr>
<h2>📎 Shrnutí odpovědností</h2>
<table>
<thead>
<tr>
<th>Krok</th>
<th>Odpovědná osoba</th>
</tr>
</thead>
<tbody><tr>
<td>Odeslání faktur do Wflow</td>
<td>Kdokoli z týmu</td>
</tr>
<tr>
<td>Schválení faktur</td>
<td><strong>Daniel Bauer</strong></td>
</tr>
<tr>
<td>Účetní kontrola</td>
<td>Lumalis (Hana Vojtajová)</td>
</tr>
<tr>
<td>Řešení připomínek</td>
<td>Dana Bauerová → Daniel Bauer</td>
</tr>
<tr>
<td>Úhrada faktur</td>
<td>Dana Bauerová</td>
</tr>
<tr>
<td>Označení jako „Zaplaceno“</td>
<td>Dana Bauerová</td>
</tr>
</tbody></table>
<hr>
<h2>🛑 Důležitá pravidla</h2>
<ul>
<li><strong>Faktury se neproplácí bez předchozího schválení Danielem Bauerem.</strong></li>
<li>Proplatit lze pouze faktury ve stavu <strong>„Schválené k proplacení“</strong>.</li>
<li>Faktury s komentářem od Lumalis musí být před úhradou vyřešeny.</li>
<li>Platby se standardně provádějí <strong>ve středu</strong>, po kontrolním dni <strong>v úterý</strong>.</li>
</ul>
',
'Schvalovatel: Daniel Bauer Odpovědná osoba za úhrady: Dana Bauerová Účetní firma: Lumalis --🎯 Cíl SOP: Zajistit, že budou včas a správně proplaceny pouze ty faktury, které: ✅ jsou určeny k úhradě bankovním převodem ✅ prošly interním schválením ✅ byly účetně zkontrolovány firmou Lumalis ✅ jsou ve stavu „Schválené k proplacení“ --🧩 Proces krok za krokem Příjem faktur do Wflow Faktury se do Wflow dostávají: Automaticky z napojených nástrojů (např. Google, Meta), Nebo ručně e-mailem – pošli fakturu jako přílohu na: fakturace-socials-lumalis@wflowmail.com --První schválení – Daniel Bauer Dan Bauer je první, kdo faktury schvaluje. Všechny přijaté faktury projde a u každé zkontroluje: částku, splatnost, variabilní symbol, dodavatele, náležitosti. Pokud je vše v pořádku, označí fakturu jako „Schváleno“. Bez tohoto kroku ji účetní firma dále nezpracovává. --Kontrola účetní firmou Lumalis (úterý) Po schválení Danem provádí Lumalis každé úterý účetní kontrolu: ověření formálních náležitostí, sazeb DPH, zaúčtování, případně přidají komentář, pokud je potřeba něco upravit. Faktury bez připomínek přejdou do stavu „Schválené k proplacení“. ✉️ Kontaktní osoby v Lumalis: Běžná agenda a komentáře ve Wflow: 🧑‍💼 Hana Vojtajová – hana.vojtajova@lumalis.cz Pokročilé účetní nebo daňové dotazy: 🧑‍💼 Lukáš Sokol (daňový poradce) – lukas.sokol@lumalis.cz --Úhrada faktur (středa – Dana Bauerová) Dana Bauerová kontroluje složku / stav „Schválené k proplacení“. U každé faktury zkontroluje: že je schválena Danem, že neobsahuje komentář od Lumalis. Pokud je vše v pořádku: provede úhradu dle údajů na faktuře (částka, VS, IBAN), označí fakturu jako „Zaplaceno“. Pokud je přidán komentář od účetní firmy: řeší ho primárně Dana Bauerová, pokud nestačí, eskaluje na Daniela Bauera. --📎 Shrnutí odpovědností | Krok | Odpovědná osoba | | --| --| | Odeslání faktur do Wflow | Kdokoli z týmu | | Schválení faktur | Daniel Bauer | | Účetní kontrola | Lumalis (Hana Vojtajová) | | Řešení připomínek | Dana Bauerová → Daniel Bauer | | Úhrada faktur | Dana Bauerová | | Označení jako „Zaplaceno“ | Dana Bauerová | --🛑 Důležitá pravidla Faktury se neproplácí bez předchozího schválení Danielem Bauerem. Proplatit lze pouze faktury ve stavu „Schválené k proplacení“. Faktury s komentářem od Lumalis musí být před úhradou vyřešeny. Platby se standardně provádějí ve středu, po kontrolním dni v úterý.',
43,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'e40aac6f-1c6a-4354-bf5e-4db5918f1445',
'11111111-1111-1111-1111-111111111107',
'Přehled reklamních akcí pro e-shopy',
'<h1>🔎 Účel SOP</h1>
<p>👉🏻 Kompletní přehled efektivních reklamních akcí a strategií pro e-shopy. </p>
<p>👉🏻 Referenční materiál pro rychlou orientaci a konzultace s klienty.</p>
<h1>📆 Kalendář svátků a marketingových příležitostí</h1>
<table>
<thead>
<tr>
<th><strong>Měsíc</strong></th>
<th><strong>Akce</strong></th>
<th><strong>Datum</strong></th>
<th><strong>Další informace</strong></th>
</tr>
</thead>
<tbody><tr>
<td><strong>Leden</strong></td>
<td>Výprodeje po Vánocích</td>
<td>První týden v lednu</td>
<td></td>
</tr>
<tr>
<td></td>
<td>Novoroční restart pleti</td>
<td>Libovolné</td>
<td></td>
</tr>
<tr>
<td><strong>Únor</strong></td>
<td>Valentýn</td>
<td>14. února</td>
<td></td>
</tr>
<tr>
<td><strong>Březen</strong></td>
<td>Mezinárodní den žen</td>
<td>8. března</td>
<td></td>
</tr>
<tr>
<td><strong>Duben</strong></td>
<td>Velikonoce</td>
<td>Pohyblivé datum (březen/duben)</td>
<td></td>
</tr>
<tr>
<td></td>
<td>Den Země</td>
<td>22. dubna</td>
<td></td>
</tr>
<tr>
<td></td>
<td>Jarní Dny Marianne</td>
<td>Duben (víkendová akce)</td>
<td>Klienti se nemusí účastnit napřímo, ale mohou dát své vlastní “Dny [název e-shopu]</td>
</tr>
<tr>
<td><strong>Květen</strong></td>
<td>Den matek</td>
<td>2. neděle v květnu</td>
<td></td>
</tr>
<tr>
<td></td>
<td>Jarní Nákupy Ona Dnes</td>
<td>Květen (týdenní akce)</td>
<td></td>
</tr>
<tr>
<td><strong>Červen</strong></td>
<td>Den dětí</td>
<td>1. června</td>
<td></td>
</tr>
<tr>
<td></td>
<td>Den otců</td>
<td>3. neděle v červnu</td>
<td></td>
</tr>
<tr>
<td><strong>Červenec</strong></td>
<td>Letní výprodeje (sezónní slevy)</td>
<td>Červenec–srpen</td>
<td></td>
</tr>
<tr>
<td><strong>Srpen</strong></td>
<td>Back to School (zpátky do školy)</td>
<td>Konec srpna / začátek září</td>
<td></td>
</tr>
<tr>
<td><strong>Září</strong></td>
<td>Mezinárodní den krásy</td>
<td>9. září</td>
<td></td>
</tr>
<tr>
<td></td>
<td>První školní den (Den učitelů)</td>
<td>1. září</td>
<td></td>
</tr>
<tr>
<td></td>
<td>Podzimní Dny Marianne</td>
<td>Polovina září (víkend)</td>
<td></td>
</tr>
<tr>
<td><strong>Říjen</strong></td>
<td>Halloween</td>
<td>31. října</td>
<td></td>
</tr>
<tr>
<td></td>
<td>Podzimní Nákupy Ona Dnes</td>
<td>Říjen (týdenní akce)</td>
<td>Klienti se nemusí účastnit napřímo; očekávat snížené prodeje pokud se neúčastní</td>
</tr>
<tr>
<td><strong>Listopad</strong></td>
<td>Singles&#39; Day (Den nezadaných)</td>
<td>11. listopadu</td>
<td></td>
</tr>
<tr>
<td></td>
<td>Black Friday</td>
<td>Poslední pátek v listopadu (mění se)</td>
<td></td>
</tr>
<tr>
<td></td>
<td>Cyber Monday</td>
<td>Pondělí po Black Friday (mění se)</td>
<td></td>
</tr>
<tr>
<td></td>
<td>Dny dopravy zdarma (Heureka)</td>
<td>Listopad (obvykle polovina měsíce)</td>
<td></td>
</tr>
<tr>
<td><strong>Prosinec</strong></td>
<td>Mikuláš</td>
<td>5. prosince</td>
<td></td>
</tr>
<tr>
<td></td>
<td>Vánoce</td>
<td>24.–26. prosince</td>
<td></td>
</tr>
<tr>
<td></td>
<td>Giving Tuesday</td>
<td>Úterý po Black Friday (mění se)</td>
<td></td>
</tr>
<tr>
<td></td>
<td>Silvestr</td>
<td>31. prosince</td>
<td></td>
</tr>
<tr>
<td><strong>Narozeniny</strong></td>
<td>Narozeniny klienta</td>
<td>Dle založení e-shopu</td>
<td></td>
</tr>
</tbody></table>
<h1>📖 Katalog slevových a promo strategií</h1>
<table>
<thead>
<tr>
<th>Strategie</th>
<th>Popis a variace</th>
</tr>
</thead>
<tbody><tr>
<td>**Bestsellery</td>
<td></td>
</tr>
<tr>
<td>Top kategorie**</td>
<td>- Produkty s vysokou poptávkou, <strong>bez nutnosti snižovat marži</strong></td>
</tr>
</tbody></table>
<ul>
<li>Musíme je s klientem najít a aktivně hledat</li>
<li>Není potřeba žádná sleva, musíme je správně odkomunikovat</li>
<li>Průběžně kontrolovat: s klientem, Looker Studio, či admin e-shopu</li>
<li>Proaktivně tlačíme klienta do vylepšování vstupních stránek a nové grafiky</li>
<li>Vytvořte si <em>custom label</em> pro katalogové reklamy s top produkty za posledních XY dní |<br>| <strong>Produktové sety</strong> | Kombinace 2+ bestsellerů 👉🏻 zvyšuje AOV  |<br>| <strong>Výhodné balíčky (bundling)</strong> | - Nabídka více produktů jako balíčku za zvýhodněnou cenu. </li>
<li>Zákazník koupí set produktů levněji, než kdyby je kupoval jednotlivě. </li>
<li>Využití napříč sortimentem: dárková sada kosmetiky (šampon + kondicionér + maska jako celek levněji), set elektroniky (notebook + brašna + myš), kombinace příbuzných produktů (fotoaparát + objektiv + pouzdro). </li>
<li>Balíčky mohou být tematické (např. „výbava pro miminko“ z více položek).<br><strong>👉🏻 zvyšuje AOV a pomáhá prodat i produkty, které by samostatně tolik netáhly.</strong> |<br>| <strong>Recenze a testimonialy</strong> | - Nový zákazník nezná tvou značku → hledá <strong>důkaz důvěryhodnosti</strong>.</li>
<li>Kdy použít a kde? V akvizičních kampaních, na webu, přímo v reklamních vizuálech a videích |<br>| <strong>Novinky a limitky</strong> | - Vytváří <em>FOMO</em> (strach z promeškání) → motivace k rychlému nákupu</li>
<li>Chceme, aby nás klient informoval o nových produktech v sortimentu |<br>| <strong>Dárky k nákupu / vzorky zdarma</strong> | - Psychologický trigger 👉🏻 zvlášť účinné pro nové zákazníky.</li>
<li>Např. při nákupu nad 1000 Kč nebo při koupi konkrétního produktu |<br>| <strong>Množstevní akce (X+1 zdarma)</strong> | - Zvýhodnění při koupi více kusů </li>
<li>př.: 2+1 zdarma </li>
<li>Alternativně může sleva narůstat s počtem kusů (např. 5% sleva při koupi 2 ks, 10% při 3 ks). </li>
<li>Funguje dobře u drobnějšího zboží: např. kosmetika a parfemy (2+1 na výrobky), potraviny a nápoje, potřeby pro domácnost či módu (např. trička, ponožky). </li>
<li>Zvyšuje AOV |<br>| <strong>Doprava zdarma</strong><br>(varianty) | - na celou objednávku</li>
<li>při nákupu nad určitou částku 👉🏻 zvyšuje AOV</li>
<li>doprava zdarma do [časově omezit]</li>
<li>doprava zdarma a při nákupu nad XY Kč dárek zdarma 👉🏻 zvyšuje AOV |<br>| <strong>Slevové kupóny</strong> | - Zákazník získá slevu po zadání speciálního kódu. </li>
<li>Sleva může být procentuální (např. 10%) </li>
<li>nebo pevná částka (např. 200 Kč). </li>
<li>Využívá se pro časově omezené akce či exkluzivní nabídky, př. kódy v newsletteru, od influencerů nebo v rámci kampaní typu „BACK2SCHOOL10“. </li>
<li><strong>Umožňuje snadno měřit efekt konkrétní kampaně.</strong> |<br>| <strong>Okamžitá sleva (bez kódu)</strong> | - Sleva aplikovaná automaticky na vybrané zboží nebo celý sortiment, </li>
<li>př.: plošná (víkendová 20% sleva na vše),</li>
<li>nebo sleva na určitý segment (např. 30% na zimní bundy). </li>
<li>typické pro výprodeje a akce typu Black Friday. |<br>| <strong>Sleva na další nákup</strong> | - fashion či elektronika</li>
<li>Motivace k opětovnému nákupu v budoucnu. </li>
<li>vhodné i pro e-mailing</li>
<li>Po dokončení objednávky získá zákazník slevový kupón nebo kredit na příští nákup. </li>
<li>Př.: „Získejte 200 Kč na další nákup při útratě nad 1000 Kč“  |<br>| <strong>Nákup na splátky bez navýšení</strong> | - Možnost pořídit si zboží na splátky s 0% úrokem (bez navýšení ceny). </li>
<li>Zákazník zaplatí postupně, aniž by přeplatil – obchodník či partner financuje úrok. </li>
<li>atraktivní zejména u dražšího zboží</li>
<li>Akce bývá časově omezena (např. „jen tento měsíc splátky bez navýšení“) a může být vázána na minimum nákupu.  |<br>| <strong>Časově omezená sleva (Flash sale)</strong> | - Trvá jen několik hodin (tzv. „happy hours“) nebo pár dnů.<br>Vytváří pocit naléhavosti a FOMO </li>
<li>Příklady: bleskový jednodenní výprodej elektroniky s 15% slevou;<br>odpolední happy hour, během níž je kosmetika se slevou 25 %; nebo víkendová akce na módní kolekci platná pouze do neděle.  |<br>| <strong>Soutěž pro zákazníky</strong> | - Propagační soutěž spojená s nákupem. </li>
<li>Zákazníci, kteří v daném období nakoupí, se mohou zúčastnit losování nebo soutěže o ceny. </li>
<li>Příklad: Každý, kdo nakoupí během měsíce, získá šanci vyhrát hodnotnou cenu (např. elektroniku, poukaz na dovolenou, nákup zdarma). </li>
<li>Jiné varianty: prvních X zákazníků získá bonus, nebo soutěž o nejlepší recenzi produktu zakoupeného v akci. </li>
<li><strong>Je oblíbená například v předvánočních kampaních nebo u uvedení nových produktů.</strong> |<br>| <strong>Omezené množství</strong> | - U <strong>novinek</strong>, limitovaných edicí, <strong>sezónních</strong> produktů nebo zboží, které se rychle vyprodává.</li>
<li>Když chceš <strong>podpořit rychlý nákup</strong> – např. v kampani s krátkým trváním. |<br>| <strong>Výprodeje</strong> | - Pocit výhodného nákupu</li>
<li>Časově omezená příležitost</li>
<li>Možnost získat kvalitní produkt za méně peněz</li>
<li><strong>kdy použít:</strong> doprodej zásob, po sezóně (např. po Vánocích, Valentýnu, Black Friday), produktové kolekce, <strong>pro získání</strong> <strong>cash flow,</strong> „uvolnění skladu“ |</li>
</ul>
<hr>
',
'🔎 Účel SOP 👉🏻 Kompletní přehled efektivních reklamních akcí a strategií pro e-shopy. 👉🏻 Referenční materiál pro rychlou orientaci a konzultace s klienty. 📆 Kalendář svátků a marketingových příležitostí | Měsíc | Akce | Datum | Další informace | | --| --| --| --| | Leden | Výprodeje po Vánocích | První týden v lednu | | | | Novoroční restart pleti | Libovolné | | | Únor | Valentýn | února | | | Březen | Mezinárodní den žen | března | | | Duben | Velikonoce | Pohyblivé datum (březen/duben) | | | | Den Země | dubna | | | | Jarní Dny Marianne | Duben (víkendová akce) | Klienti se nemusí účastnit napřímo, ale mohou dát své vlastní “Dny [název e-shopu] | | Květen | Den matek | neděle v květnu | | | | Jarní Nákupy Ona Dnes | Květen (týdenní akce) | | | Červen | Den dětí | června | | | | Den otců | neděle v červnu | | | Červenec | Letní výprodeje (sezónní slevy) | Červenec–srpen | | | Srpen | Back to School (zpátky do školy) | Konec srpna / začátek září | | | Září | Mezinárodní den krásy | září | | | | První školní den (Den učitelů) | září | | | | Podzimní Dny Marianne | Polovina září (víkend) | | | Říjen | Halloween | října | | | | Podzimní Nákupy Ona Dnes | Říjen (týdenní akce) | Klienti se nemusí účastnit napřímo; očekávat snížené prodeje pokud se neúčastní | | Listopad | Singles'' Day (Den nezadaných) | listopadu | | | | Black Friday | Poslední pátek v listopadu (mění se) | | | | Cyber Monday | Pondělí po Black Friday (mění se) | | | | Dny dopravy zdarma (Heureka) | Listopad (obvykle polovina měsíce) | | | Prosinec | Mikuláš | prosince | | | | Vánoce | 24.–prosince | | | | Giving Tuesday | Úterý po Black Friday (mění se) | | | | Silvestr | prosince | | | Narozeniny | Narozeniny klienta | Dle založení e-shopu | | 📖 Katalog slevových a promo strategií | Strategie | Popis a variace | | --| --| | Bestsellery Top kategorie | Produkty s vysokou poptávkou, bez nutnosti snižovat marži Musíme je s klientem najít a aktivně hledat Není potřeba žádná sleva, musíme je správně odkomunikovat Průběžně kontrolovat: s klientem, Looker Studio, či admin e-shopu Proaktivně tlačíme klienta do vylepšování vstupních stránek a nové grafiky Vytvořte si custom label pro katalogové reklamy s top produkty za posledních XY dní | | Produktové sety | Kombinace 2+ bestsellerů 👉🏻 zvyšuje AOV | | Výhodné balíčky (bundling) | Nabídka více produktů jako balíčku za zvýhodněnou cenu. Zákazník koupí set produktů levněji, než kdyby je kupoval jednotlivě. Využití napříč sortimentem: dárková sada kosmetiky (šampon + kondicionér + maska jako celek levněji), set elektroniky (notebook + brašna + myš), kombinace příbuzných produktů (fotoaparát + objektiv + pouzdro). Balíčky mohou být tematické (např. „výbava pro miminko“ z více položek). 👉🏻 zvyšuje AOV a pomáhá prodat i produkty, které by samostatně tolik netáhly. | | Recenze a testimonialy | Nový zákazník nezná tvou značku → hledá důkaz důvěryhodnosti. Kdy použít a kde? V akvizičních kampaních, na webu, přímo v reklamních vizuálech a videích | | Novinky a limitky | Vytváří FOMO (strach z promeškání) → motivace k rychlému nákupu Chceme, aby nás klient informoval o nových produktech v sortimentu | | Dárky k nákupu / vzorky zdarma | Psychologický trigger 👉🏻 zvlášť účinné pro nové zákazníky. Např. při nákupu nad 1000 Kč nebo při koupi konkrétního produktu | | Množstevní akce (X+1 zdarma) | Zvýhodnění při koupi více kusů př.: 2+1 zdarma Alternativně může sleva narůstat s počtem kusů (např. 5% sleva při koupi 2 ks, 10% při 3 ks). Funguje dobře u drobnějšího zboží: např. kosmetika a parfemy (2+1 na výrobky), potraviny a nápoje, potřeby pro domácnost či módu (např. trička, ponožky). Zvyšuje AOV | | Doprava zdarma (varianty) | na celou objednávku při nákupu nad určitou částku 👉🏻 zvyšuje AOV doprava zdarma do [časově omezit] doprava zdarma a při nákupu nad XY Kč dárek zdarma 👉🏻 zvyšuje AOV | | Slevové kupóny | Zákazník získá slevu po zadání speciálního kódu. Sleva může být procentuální (např. 10%) nebo pevná částka (např. 200 Kč). Využívá se pro časově omezené akce či exkluzivní nabídky, př. kódy v newsletteru, od influencerů nebo v rámci kampaní typu „BACK2SCHOOL10“. Umožňuje snadno měřit efekt konkrétní kampaně. | | Okamžitá sleva (bez kódu) | Sleva aplikovaná automaticky na vybrané zboží nebo celý sortiment, př.: plošná (víkendová 20% sleva na vše), nebo sleva na určitý segment (např. 30% na zimní bundy). typické pro výprodeje a akce typu Black Friday. | | Sleva na další nákup | fashion či elektronika Motivace k opětovnému nákupu v budoucnu. vhodné i pro e-mailing Po dokončení objednávky získá zákazník slevový kupón nebo kredit na příští nákup. Př.: „Získejte 200 Kč na další nákup při útratě nad 1000 Kč“ | | Nákup na splátky bez navýšení | Možnost pořídit si zboží na splátky s 0% úrokem (bez navýšení ceny). Zákazník zaplatí postupně, aniž by přeplatil – obchodník či partner financuje úrok. atraktivní zejména u dražšího zboží Akce bývá časově omezena (např. „jen tento měsíc splátky bez navýšení“) a',
44,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'29841360-fe45-4fe3-9916-e1ecf7c295e4',
'11111111-1111-1111-1111-111111111114',
'Přihlašování do správce hesel NordPass',
'<h3>Co je NordPass a proč ho používáme?</h3>
<p>NordPass je správce hesel, který slouží k bezpečnému ukládání a sdílení hesel v týmu. Používáme ho proto, aby všechny důležité přihlašovací údaje (např. do srovnávačů zboží, e-shopů apod.) byly na jednom místě, snadno dostupné a zároveň bezpečně chráněné. To nám umožňuje efektivní spolupráci v rámci týmu a minimalizuje riziko ztráty nebo zneužití hesel.</p>
<blockquote>
<p><strong>Společný účet:</strong></p>
<p><strong>E-mail:</strong> <a href="mailto:analytics@socials.cz">analytics@socials.cz</a></p>
<p><strong>Heslo:</strong> PQDht#97w!P4nSEBxA3r</p>
</blockquote>
<hr>
<h3><strong>Postup přihlášení do NordPass</strong></h3>
<ol>
<li><p><strong>Přejdi na web NordPass:</strong></p>
<p> Otevři prohlížeč a přejdi na stránku <a href="https://nordpass.com/">https://nordpass.com/</a>.</p>
</li>
<li><p><strong>Přihlas se:</strong></p>
<ul>
<li>Klikni na tlačítko <strong>Login</strong> v pravém horním rohu stránky.</li>
<li>Zadej společné přihlašovací údaje:<ul>
<li><strong>E-mail:</strong> <a href="mailto:analytics@socials.cz">analytics@socials.cz</a></li>
<li><strong>Heslo:</strong> PQDht#97w!P4nSEBxA3r</li>
</ul>
</li>
</ul>
</li>
<li><p><strong>Stáhni rozšíření NordPass do Google Chrome:</strong></p>
<ul>
<li>Otevři obchod s rozšířeními Google Chrome a vyhledej &quot;NordPass&quot;.</li>
<li>Nebo použij tento odkaz: <a href="https://nordpass.com/download/chrome/">https://nordpass.com/download/chrome/</a></li>
<li>Klikni na <strong>Přidat do Chromu</strong> a dokonči instalaci.</li>
</ul>
</li>
</ol>
<hr>
<h3><strong>Pravidla používání NordPass</strong></h3>
<ol>
<li><strong>Ukládání hesel:</strong><ul>
<li>Pokud ti klient poskytne nějaké heslo (např. přístupy do srovnávačů zboží, e-shopů nebo jiných nástrojů), ulož ho do NordPass.</li>
<li>Vždy ulož heslo pod jasným a srozumitelným názvem, aby ostatní mohli snadno pochopit, k čemu přístup slouží.</li>
</ul>
</li>
<li><strong>Sdílení přístupu:</strong><ul>
<li>Uložená hesla jsou přístupná celému týmu, aby všichni mohli pracovat efektivně.</li>
</ul>
</li>
<li><strong>Osobní hesla neukládej:</strong><ul>
<li>Do NordPassu nikdy neukládej své osobní hesla nebo přihlašovací údaje, které nejsou relevantní pro práci.</li>
</ul>
</li>
</ol>
<hr>
<h3><strong>Checklist pro implementaci</strong></h3>
<p>✅ Přihlas se pomocí společných přihlašovacích údajů.</p>
<p>✅ Nastav dvoufázové ověření (dle návodu výše).</p>
<p>✅ Stáhni a nainstaluj rozšíření NordPass do Google Chrome.</p>
<p>✅ Ukládej všechny pracovní hesla týkající se klientů a projektů do NordPass.</p>
<p>✅ Dodržuj pravidla používání a neukládej osobní hesla.</p>
<hr>
<p><strong>Poznámka:</strong> V případě problémů s přihlášením nebo používáním NordPassu kontaktuj @Daniel Bauer</p>
',
'Co je NordPass a proč ho používáme? NordPass je správce hesel, který slouží k bezpečnému ukládání a sdílení hesel v týmu. Používáme ho proto, aby všechny důležité přihlašovací údaje (např. do srovnávačů zboží, e-shopů apod.) byly na jednom místě, snadno dostupné a zároveň bezpečně chráněné. To nám umožňuje efektivní spolupráci v rámci týmu a minimalizuje riziko ztráty nebo zneužití hesel. Společný účet: E-mail: analytics@socials.cz Heslo: PQDht#97w!P4nSEBxA3r --Postup přihlášení do NordPass Přejdi na web NordPass: Otevři prohlížeč a přejdi na stránku https://nordpass.com/. Přihlas se: Klikni na tlačítko Login v pravém horním rohu stránky. Zadej společné přihlašovací údaje: E-mail: analytics@socials.cz Heslo: PQDht#97w!P4nSEBxA3r Stáhni rozšíření NordPass do Google Chrome: Otevři obchod s rozšířeními Google Chrome a vyhledej "NordPass". Nebo použij tento odkaz: https://nordpass.com/download/chrome/ Klikni na Přidat do Chromu a dokonči instalaci. --Pravidla používání NordPass Ukládání hesel: Pokud ti klient poskytne nějaké heslo (např. přístupy do srovnávačů zboží, e-shopů nebo jiných nástrojů), ulož ho do NordPass. Vždy ulož heslo pod jasným a srozumitelným názvem, aby ostatní mohli snadno pochopit, k čemu přístup slouží. Sdílení přístupu: Uložená hesla jsou přístupná celému týmu, aby všichni mohli pracovat efektivně. Osobní hesla neukládej: Do NordPassu nikdy neukládej své osobní hesla nebo přihlašovací údaje, které nejsou relevantní pro práci. --Checklist pro implementaci ✅ Přihlas se pomocí společných přihlašovacích údajů. ✅ Nastav dvoufázové ověření (dle návodu výše). ✅ Stáhni a nainstaluj rozšíření NordPass do Google Chrome. ✅ Ukládej všechny pracovní hesla týkající se klientů a projektů do NordPass. ✅ Dodržuj pravidla používání a neukládej osobní hesla. --Poznámka: V případě problémů s přihlášením nebo používáním NordPassu kontaktuj @Daniel Bauer',
45,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'910e33f6-b7e9-4ad4-ad1e-3815f2247491',
'11111111-1111-1111-1111-111111111107',
'Příprava na krátkou (flash akci)',
'<p>Flash akce jsou skvělým způsobem, jak rychle zvýšit prodeje a upoutat pozornost zákazníků. Aby však měly maximální efekt, je důležité zajistit, že budou dobře komunikované na všech klíčových kanálech – od webu, přes reklamy na Meta a Google platformách, až po zbožové srovnávače. Tento dokument Vám přináší přehled základních kroků, které je třeba provést v rámci e-shopu, rozdělených na <strong>nezbytné minimum (Must have)</strong> a <strong>doporučená vylepšení (Nice to have)</strong>.</p>
<p>Díky těmto krokům zajistíte, že Vaše akce osloví co nejvíce potenciálních zákazníků a přinese požadované výsledky.</p>
<h1>Před akcí</h1>
<p>Mělo by být v našem zájmu, že je klient vždy řádně připraven a v zájmu každého člena týmu je, že si vše pohlídá. 🚨Ale na konci dne za vše odpovídá projekťák. </p>
<h3><strong>🚀 Must have</strong></h3>
<p><strong>PRO SOCIALS</strong></p>
<ol>
<li>Tvorbu bannerů, videí a textací včas. 💡 <strong>TIP:</strong> Zkontrolujte předchozí rok a ukažte klientovi printscreem reklam, kterým se dařilo lépe, pokud běželo více alternativ bannerů.</li>
<li>Připravujeme kampaně minimálně 24 hodin předem, čti zásady: <a href="Meta%20Ads%20Jak%20d%C4%9Blat%20kr%C3%A1tk%C3%A9%20(flash)%20akce%2014951ff3df57809a8590e93ae0a03b33.md">Meta Ads: Jak dělat krátké (flash) akce  </a> </li>
<li>‼️Se spuštěním akce informujeme klienta do úkolu ve Freelo, že jsme z naší strany připraveni.</li>
</ol>
<p><strong>JAKÉ BANNERY NECHAT PŘIPRAVIT?</strong></p>
<p>Pro PPC čti 👉🏻 <a href="Rozm%C4%9Bry%20PPC%20banner%C5%AF%20pro%20Google%20Ads%20a%20S-klik%2013b2a46219194b43a800e4acb4531a29.md">Rozměry PPC bannerů pro Google Ads a S-klik</a> </p>
<p>Pro Metu: varianty 4:5 a 9:16, 1 variantu <em>last call (např. Jen dnes!)</em></p>
<p>Pro e-shop pro mobil: 800x625 [Shoptet]</p>
<p><strong>PRO KLIENTA</strong></p>
<ol>
<li><p><strong>Upozornění o akci na celém webu</strong>:</p>
<ul>
<li>Umístěte upozorňovací lištu do hlavičky webu, která bude viditelná na všech stránkách, včetně blogových článků, kategorií a produktových stránek.</li>
<li>Pokud je akce časově omezená, zobrazte v liště odpočet, aby návštěvníci viděli zbývající čas do ukončení akce.</li>
</ul>
<p> 💡 <strong>Informační proužek v záhlaví Shoptet e-shopu najdete:</strong> V administraci Shoptetu přejděte do sekce <em>Vzhled a obsah</em> &gt; <em>Editor</em> &gt; <em>Další nastavení</em> a zde nastavte informační proužek.
 </p>
</li>
<li><p><strong>Informace o akci na produktových stránkách</strong>:</p>
<ul>
<li>U produktů zahrnutých do akce zřetelně označte slevu a zobrazte její výši přímo na produktové stránce.</li>
<li>V případě slevového kuponu zajistěte jeho zobrazení na produktové stránce a umožněte snadné kopírování kódu.</li>
</ul>
</li>
<li><p><strong>Vytvoření akční landing page</strong>:</p>
<ul>
<li>Připravte speciální stránku s přehledem všech produktů zahrnutých do akce, která bude snadno dostupná z hlavního menu či upozorňovací lišty.</li>
<li>Zajistěte jednoduchou navigaci, filtrování produktů a přehlednost stránky.</li>
</ul>
</li>
<li><p><strong>Testování funkčnosti</strong>:</p>
<ul>
<li>Ověřte, že web zvládne zvýšený počet návštěvníků během akce.</li>
<li>Zkontrolujte funkčnost slevových kuponů a celého procesu objednávky včetně platební brány.</li>
</ul>
</li>
<li><p><strong>Mobilní přístupnost</strong>:</p>
<ul>
<li>Ujistěte se, že všechny prvky akce (lišta, pop-up, odpočet) fungují správně na mobilních zařízeních.</li>
</ul>
</li>
</ol>
<hr>
<h3><strong>👀 Nice to have</strong></h3>
<ol>
<li><strong>Pop-up s upozorněním na akci</strong>:<ul>
<li>Přidejte pop-up, který se zobrazí například 10 sekund po návštěvě webu, aby upoutal pozornost návštěvníků.</li>
<li>Pop-up by měl být snadno zavíratelný a nenarušovat uživatelskou zkušenost.</li>
</ul>
</li>
<li><strong>Grafická úprava stránek</strong>:<ul>
<li>Přidejte vizuální prvky akce (například bannery nebo speciální ikonky u zlevněných produktů) pro zvýšení atraktivity nabídky.</li>
</ul>
</li>
<li><strong>Dynamické odpočty</strong>:<ul>
<li>Na produktových stránkách zobrazených v rámci akce implementujte odpočty do konce slevy. Tyto prvky mohou zvýšit pocit naléhavosti a podpořit rychlejší rozhodování zákazníků.</li>
</ul>
</li>
<li><strong>SEO optimalizace pro akci</strong>:<ul>
<li>Vytvořte specifické meta popisky a nadpisy zaměřené na klíčová slova spojená s akcí, aby byla dohledatelná ve vyhledávačích.</li>
</ul>
</li>
<li><strong>E-mailová a SMS komunikace</strong>:<ul>
<li>Pokud je to možné, informujte o akci registrované zákazníky prostřednictvím e-mailu nebo SMS kampaně.</li>
<li>Zahrňte odkaz přímo na akční stránku.</li>
</ul>
</li>
</ol>
<h2>Shoptet doplňky, které by se mohly hodit.</h2>
<p><a href="https://doplnky.shoptet.cz/slevove-kupony">https://doplnky.shoptet.cz/slevove-kupony</a></p>
<p><a href="https://doplnky.shoptet.cz/odpocet-casu-u-akcni-ceny">https://doplnky.shoptet.cz/odpocet-casu-u-akcni-ceny</a></p>
<p><a href="https://doplnky.shoptet.cz/stitek-akce">https://doplnky.shoptet.cz/stitek-akce</a></p>
',
'Flash akce jsou skvělým způsobem, jak rychle zvýšit prodeje a upoutat pozornost zákazníků. Aby však měly maximální efekt, je důležité zajistit, že budou dobře komunikované na všech klíčových kanálech – od webu, přes reklamy na Meta a Google platformách, až po zbožové srovnávače. Tento dokument Vám přináší přehled základních kroků, které je třeba provést v rámci e-shopu, rozdělených na nezbytné minimum (Must have) a doporučená vylepšení (Nice to have). Díky těmto krokům zajistíte, že Vaše akce osloví co nejvíce potenciálních zákazníků a přinese požadované výsledky. Před akcí Mělo by být v našem zájmu, že je klient vždy řádně připraven a v zájmu každého člena týmu je, že si vše pohlídá. 🚨Ale na konci dne za vše odpovídá projekťák. 🚀 Must have PRO SOCIALS Tvorbu bannerů, videí a textací včas. 💡 TIP: Zkontrolujte předchozí rok a ukažte klientovi printscreem reklam, kterým se dařilo lépe, pokud běželo více alternativ bannerů. Připravujeme kampaně minimálně 24 hodin předem, čti zásady: Meta Ads: Jak dělat krátké (flash) akce %20akce%2014951ff3df57809a8590e93ae0a03b33.md) ‼️Se spuštěním akce informujeme klienta do úkolu ve Freelo, že jsme z naší strany připraveni. JAKÉ BANNERY NECHAT PŘIPRAVIT? Pro PPC čti 👉🏻 Rozměry PPC bannerů pro Google Ads a S-klik Pro Metu: varianty 4:5 a 9:16, 1 variantu last call (např. Jen dnes!) Pro e-shop pro mobil: 800x625 [Shoptet] PRO KLIENTA Upozornění o akci na celém webu: Umístěte upozorňovací lištu do hlavičky webu, která bude viditelná na všech stránkách, včetně blogových článků, kategorií a produktových stránek. Pokud je akce časově omezená, zobrazte v liště odpočet, aby návštěvníci viděli zbývající čas do ukončení akce. 💡 Informační proužek v záhlaví Shoptet e-shopu najdete: V administraci Shoptetu přejděte do sekce Vzhled a obsah Editor Další nastavení a zde nastavte informační proužek. Informace o akci na produktových stránkách: U produktů zahrnutých do akce zřetelně označte slevu a zobrazte její výši přímo na produktové stránce. V případě slevového kuponu zajistěte jeho zobrazení na produktové stránce a umožněte snadné kopírování kódu. Vytvoření akční landing page: Připravte speciální stránku s přehledem všech produktů zahrnutých do akce, která bude snadno dostupná z hlavního menu či upozorňovací lišty. Zajistěte jednoduchou navigaci, filtrování produktů a přehlednost stránky. Testování funkčnosti: Ověřte, že web zvládne zvýšený počet návštěvníků během akce. Zkontrolujte funkčnost slevových kuponů a celého procesu objednávky včetně platební brány. Mobilní přístupnost: Ujistěte se, že všechny prvky akce (lišta, pop-up, odpočet) fungují správně na mobilních zařízeních. --👀 Nice to have Pop-up s upozorněním na akci: Přidejte pop-up, který se zobrazí například 10 sekund po návštěvě webu, aby upoutal pozornost návštěvníků. Pop-up by měl být snadno zavíratelný a nenarušovat uživatelskou zkušenost. Grafická úprava stránek: Přidejte vizuální prvky akce (například bannery nebo speciální ikonky u zlevněných produktů) pro zvýšení atraktivity nabídky. Dynamické odpočty: Na produktových stránkách zobrazených v rámci akce implementujte odpočty do konce slevy. Tyto prvky mohou zvýšit pocit naléhavosti a podpořit rychlejší rozhodování zákazníků. SEO optimalizace pro akci: Vytvořte specifické meta popisky a nadpisy zaměřené na klíčová slova spojená s akcí, aby byla dohledatelná ve vyhledávačích. E-mailová a SMS komunikace: Pokud je to možné, informujte o akci registrované zákazníky prostřednictvím e-mailu nebo SMS kampaně. Zahrňte odkaz přímo na akční stránku. Shoptet doplňky, které by se mohly hodit. https://doplnky.shoptet.cz/slevove-kupony https://doplnky.shoptet.cz/odpocet-casu-u-akcni-ceny https://doplnky.shoptet.cz/stitek-akce',
46,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'a5221066-72a8-4aad-95e8-b3c0dcfa733b',
'11111111-1111-1111-1111-111111111101',
'Příprava smluv pro klienty',
'<h2>✍️ Příprava a podpis smlouvy s novým klientem</h2>
<ol>
<li><p><strong>Klient vyplní onboardingový formulář:</strong></p>
<p> <a href="https://kr3cjcjdmo4.typeform.com/to/nfI026GF">https://kr3cjcjdmo4.typeform.com/to/nfI026GF</a></p>
</li>
<li><p><strong>Na základě formuláře se automaticky vygeneruje návrh smlouvy.</strong></p>
</li>
<li><p><strong>Návrh smlouvy se odešle Daně Bauerové</strong> ke kontrole formálních náležitostí.</p>
</li>
<li><p><strong>Po kontrole Dana Bauerová odešle smlouvu k podpisu</strong> přes Digisign:</p>
<ul>
<li>Danielu Bauerovi (interní podpis),</li>
<li>Klientovi (na e-mail uvedený ve formuláři).</li>
</ul>
</li>
<li><p>Po podpisu obou stran je smlouva právně platná a může pokračovat onboarding (založení projektu, přidání do nástrojů atd.).</p>
</li>
</ol>
',
'✍️ Příprava a podpis smlouvy s novým klientem Klient vyplní onboardingový formulář: https://kr3cjcjdmo4.typeform.com/to/nfI026GF Na základě formuláře se automaticky vygeneruje návrh smlouvy. Návrh smlouvy se odešle Daně Bauerové ke kontrole formálních náležitostí. Po kontrole Dana Bauerová odešle smlouvu k podpisu přes Digisign: Danielu Bauerovi (interní podpis), Klientovi (na e-mail uvedený ve formuláři). Po podpisu obou stran je smlouva právně platná a může pokračovat onboarding (založení projektu, přidání do nástrojů atd.).',
47,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'4ac57b4d-9740-4bfb-9e19-ce3fd9a39309',
'11111111-1111-1111-1111-111111111101',
'Příprava smluv pro kolegy (IČO, DPP)',
'<hr>
<h2>Smlouvy na IČO</h2>
<ol>
<li><p>Novému kolegovi zašleme Google Formulář (<a href="https://kr3cjcjdmo4.typeform.com/to/kQQ4xGnO">https://kr3cjcjdmo4.typeform.com/to/kQQ4xGnO</a>) , který vyplní a je na něj navázaná automatizace která vytvoří:</p>
<ol>
<li>Smlouvu o spolupráci</li>
<li>GDPR smlouvu</li>
</ol>
<p> Automatizace duplikuje vzor smlouvy do složky <a href="https://drive.google.com/drive/folders/16LdqN6tglAcK3CDLqBmpCBqraK3eObF6?usp=sharing">K podpisu</a>, namapuje údaje a následně pošle oznámení na tyto e-maily, že došlo k vytvoření smlouvy: <a href="mailto:danny@socials.cz">danny@socials.cz</a>, <a href="mailto:otas@socials.cz">otas@socials.cz</a>, <a href="mailto:dana.bauerova@socials.cz">dana.bauerova@socials.cz</a>
 </p>
</li>
<li><p>Je třeba smlouvy zkontrolovat (především fakturační údaje nového kolegy v nástroji <a href="https://www.merk.cz/">Merk</a>). Doplníme informace, které se případně ve smlouvě nedoplnily - pravděpodobně to bude domluvená odměna. Tuto informaci by měl dodat člověk, který nového kolegu nabírá.</p>
</li>
<li><p>Smlouvu odesíláme k podpisu přes DigiSign - podepisující je vždy jednatel, tzn. Dan nebo Oťas, + nový kolega. První by měla jít smlouva na nového kolegu a následně na jednatele.</p>
</li>
<li><p>Po podpisu smlouvu stáhneme a uložíme na Google Drive do <a href="https://drive.google.com/drive/folders/1mxB8yIu9YCKWb80E_AU9to6TLMVOPseA?usp=drive_link">této složy</a>.</p>
</li>
</ol>
<hr>
<h2>Smlouvy DPP</h2>
<ol>
<li>Novému kolegovi zašleme Google Formulář (<a href="https://kr3cjcjdmo4.typeform.com/to/kQQ4xGnO">https://kr3cjcjdmo4.typeform.com/to/kQQ4xGnO</a>), který vyplní a je na něj navázaná automatizace která vytvoří:<ol>
<li>Smlouvu pro DPP</li>
<li>GDPR smlouvu</li>
</ol>
</li>
</ol>
<p>Automatizace duplikuje vzor smlouvy do složky <a href="https://drive.google.com/drive/folders/1dzpO0NMCfJ29DE8bOqEdE60QcjRFd6mG?usp=drive_link">K podpisu</a>, namapuje údaje a následně pošle oznámení na tyto e-maily, že došlo k vytvoření smlouvy: <a href="mailto:danny@socials.cz">danny@socials.cz</a>, <a href="mailto:otas@socials.cz">otas@socials.cz</a>, <a href="mailto:dana.bauerova@socials.cz">dana.bauerova@socials.cz</a></p>
<ol>
<li>Po vyplnění formuláře se novému kolegovi automaticky odešle <a href="https://drive.google.com/drive/folders/13_uhW6G2UDz2Tqc0Pp5w6mozKet7QXnC?usp=drive_link">vstupní dotazník</a> a <a href="https://drive.google.com/drive/folders/1ozLZsYv9V7Xg-R-Xg8HC7ACK8gvrZJs3?usp=drive_link">růžové prohlášení</a>, které musí vyplnit a poslat zpět podepsané (namapoval bych v Digisign, aby to mohl v klidu vyplnit na mobilu a podepsat).</li>
<li>Vytvoření smlouvy DPP a GDPR je třeba zkontrolovat. Doplníme informace, které se případně ve smlouvě nedoplnily - pravděpodobně to bude domluvená odměna a rozsah služeb. Tuto informaci by měl dodat člověk, který nového kolegu nabírá.</li>
<li>Smlouvu odesíláme k podpisu přes DigiSign - podepisující je vždy jednatel, tzn. Dan nebo Oťas, + nový kolega. První by měla jít smlouva na nového kolegu a následně na jednatele.</li>
<li>Po podpisu všech smluv, dotazníků a prohlášení je musíme odeslat účetnímu pro mzdy.</li>
<li>Vše stáhneme a uložíme na drive do <a href="https://drive.google.com/drive/folders/1E9SIkaNcYfcPBmo94w9JOwuZASTQ_Xji?usp=drive_link">podepsaných DPP</a>.</li>
</ol>
',
'--Smlouvy na IČO Novému kolegovi zašleme Google Formulář (https://kr3cjcjdmo4.typeform.com/to/kQQ4xGnO) , který vyplní a je na něj navázaná automatizace která vytvoří: Smlouvu o spolupráci GDPR smlouvu Automatizace duplikuje vzor smlouvy do složky K podpisu, namapuje údaje a následně pošle oznámení na tyto e-maily, že došlo k vytvoření smlouvy: danny@socials.cz, otas@socials.cz, dana.bauerova@socials.cz Je třeba smlouvy zkontrolovat (především fakturační údaje nového kolegy v nástroji Merk). Doplníme informace, které se případně ve smlouvě nedoplnily pravděpodobně to bude domluvená odměna. Tuto informaci by měl dodat člověk, který nového kolegu nabírá. Smlouvu odesíláme k podpisu přes DigiSign podepisující je vždy jednatel, tzn. Dan nebo Oťas, + nový kolega. První by měla jít smlouva na nového kolegu a následně na jednatele. Po podpisu smlouvu stáhneme a uložíme na Google Drive do této složy. --Smlouvy DPP Novému kolegovi zašleme Google Formulář (https://kr3cjcjdmo4.typeform.com/to/kQQ4xGnO), který vyplní a je na něj navázaná automatizace která vytvoří: Smlouvu pro DPP GDPR smlouvu Automatizace duplikuje vzor smlouvy do složky K podpisu, namapuje údaje a následně pošle oznámení na tyto e-maily, že došlo k vytvoření smlouvy: danny@socials.cz, otas@socials.cz, dana.bauerova@socials.cz Po vyplnění formuláře se novému kolegovi automaticky odešle vstupní dotazník a růžové prohlášení, které musí vyplnit a poslat zpět podepsané (namapoval bych v Digisign, aby to mohl v klidu vyplnit na mobilu a podepsat). Vytvoření smlouvy DPP a GDPR je třeba zkontrolovat. Doplníme informace, které se případně ve smlouvě nedoplnily pravděpodobně to bude domluvená odměna a rozsah služeb. Tuto informaci by měl dodat člověk, který nového kolegu nabírá. Smlouvu odesíláme k podpisu přes DigiSign podepisující je vždy jednatel, tzn. Dan nebo Oťas, + nový kolega. První by měla jít smlouva na nového kolegu a následně na jednatele. Po podpisu všech smluv, dotazníků a prohlášení je musíme odeslat účetnímu pro mzdy. Vše stáhneme a uložíme na drive do podepsaných DPP.',
48,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'9b8ca703-a426-4dea-b446-38c11048199c',
'11111111-1111-1111-1111-111111111108',
'Příprava smluv pro nové kolegy',
'<p>🙋‍♂️ Hlavní decision maker: Daniel Bauer</p>
<p>Smlouvy připravuje: Asistentka</p>
<p>Cil: Vytvořit smlouvu pro nového kolegu </p>
<p><a href="https://www.loom.com/share/bb93e79ec25a438996ee4ebbf4444ef1?sid=f1d3872d-057e-4d72-a220-2a524f585f79">https://www.loom.com/share/bb93e79ec25a438996ee4ebbf4444ef1?sid=f1d3872d-057e-4d72-a220-2a524f585f79</a></p>
<h3>Key Steps</h3>
<p><strong>1. Získání informací o novém kolegovi</strong> <a href="https://loom.com/share/bb93e79ec25a438996ee4ebbf4444ef1?t=20">0:20</a></p>
<p><img src="https://cdn.loom.com/sessions/picture-in-scripture/bb93e79ec25a438996ee4ebbf4444ef1-20.jpg?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9jZG4ubG9vbS5jb20vc2Vzc2lvbnMvcGljdHVyZS1pbi1zY3JpcHR1cmUvYmI5M2U3OWVjMjVhNDM4OTk2ZWU0ZWJiZjQ0NDRlZjEtMjAuanBnIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzQ4NjgwMDYyfX19XX0_&Key-Pair-Id=KQOSYIR44AIC0&Signature=myVI4wznl3WB3Rfn-xHWuTymzGuadxdEf7coYdLHM8Xk9qBWDIfzINEhPF-NL7CBifNbJ0eL2hELbtjDLleXGsx5A2kMAauV0MG3OAmfHzAjg329Ebpi2bcM31gGFUSnvjBZwYtbFbtTCpXtplpppXl1bPVpoPGTctYq2n3xGwVFabfotUtoDWPJI6BKVpc8CT4kdiLUa7T62NAts7-C3wbHrcoRsBytriA55vp6pZMph29szvklIYoTRcng%7ES3n8nApCeWWrbO01IP0Pf4uHKzbDJ5ccp7Zmjdviidya1pKKDKquGmvr9nQ-OT1u%7EiRNkLRnumVwczvy7--7pcuIw__" alt=""></p>
<ul>
<li>Zkontrolujte e-mail, kde obdržíte odkaz na vytvořenou smlouvu.</li>
<li>Všechny informace o nových kolezích jsou shromážděny v Google formuláři, který vyplní noví kolegové.</li>
</ul>
<p><strong>2. Kontrola informací v nástroji Merck</strong> <a href="https://loom.com/share/bb93e79ec25a438996ee4ebbf4444ef1?t=168">2:48</a></p>
<p><img src="https://cdn.loom.com/sessions/picture-in-scripture/bb93e79ec25a438996ee4ebbf4444ef1-168.jpg?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9jZG4ubG9vbS5jb20vc2Vzc2lvbnMvcGljdHVyZS1pbi1zY3JpcHR1cmUvYmI5M2U3OWVjMjVhNDM4OTk2ZWU0ZWJiZjQ0NDRlZjEtMTY4LmpwZyIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc0ODY4MDA2Mn19fV19&Key-Pair-Id=KQOSYIR44AIC0&Signature=QlFHzER4KpAGiG7TB%7E8KoaXUCm5TB0FTeDQl5XS25DttEYGP8IFdWImbGNSNvAm0Uk-F5zbMQVKvowNvaHnBj4UvU8GIdUHqdbT-qgj7UZ9JUaUonEU42M00i7AlJCUxIf0X2xR7tCxG-ObudRRkV9cZzOYOaUw4rqpW7LA-hZ19Es7uP9JxVDySrXV-J1gak8w9MS5-85tYqUvmOB0LgoHaxrjFPNi6ywFtAE9ZqEE4wvUM%7E5nt5DN0nuWx9Y8IiewtVUpavkqcJnyc7SFyNf6wAP6HXgVyloKhAR0-Bz7M-8YE2XrbrY8Zbh4T4pnunrLFgFRd2GDS5h1Jac5bxg__" alt=""></p>
<ul>
<li>Přihlaste se do nástroje Merck (<a href="http://www.merk.cz">www.merk.cz</a>).</li>
<li>Vyhledejte nového kolegu podle IČa nebo názvu subjektu.</li>
<li>Zkontrolujte správnost adresy a dalších informací.</li>
</ul>
<p><strong>3. Příprava smlouvy</strong> <a href="https://loom.com/share/bb93e79ec25a438996ee4ebbf4444ef1?t=276">4:36</a></p>
<p><img src="https://cdn.loom.com/sessions/picture-in-scripture/bb93e79ec25a438996ee4ebbf4444ef1-276.jpg?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9jZG4ubG9vbS5jb20vc2Vzc2lvbnMvcGljdHVyZS1pbi1zY3JpcHR1cmUvYmI5M2U3OWVjMjVhNDM4OTk2ZWU0ZWJiZjQ0NDRlZjEtMjc2LmpwZyIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc0ODY4MDA2Mn19fV19&Key-Pair-Id=KQOSYIR44AIC0&Signature=K6YC%7EIV5F7hRnqqHSFnkR9UGu%7EE6Ev2vtffisjs-CM8Zvjo4aGxJsn47M739mtFmjYFOX-nP71u8BzUfPo95w7IB8dr%7EJP2aScoaR%7EqhVbJw72JNfXfo8RY%7EijE0vgOjg9B489YDRR7pif32k2N%7EPycSXPUZviO-PBDbK1mbZ98b6VQO81-Qasry5ldXA1mIPq7bRUDJDVDObUgZLEETDLgShjmqR2MpmOL9eXYsYVE2vuc0eRtBdubOk-bGs1AykU2STk0POUyvGTd8XlLzD3s5kOiEMZq%7EHUdMuWMSF2Qqd6X2D4V8qtGff2WA61NSo2ISeLJBJTi4vZM6a8UAPQ__" alt=""></p>
<ul>
<li>Otevřete šablonu smlouvy o spolupráci a GDPR.</li>
<li>Zkontrolujte, zda jsou všechny informace správně vyplněny.</li>
<li>Doplňte předmět smlouvy.</li>
</ul>
<p><strong>4. Stáhnout smlouvu</strong> <a href="https://loom.com/share/bb93e79ec25a438996ee4ebbf4444ef1?t=397">6:37</a></p>
<p><img src="https://cdn.loom.com/sessions/picture-in-scripture/bb93e79ec25a438996ee4ebbf4444ef1-397.jpg?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9jZG4ubG9vbS5jb20vc2Vzc2lvbnMvcGljdHVyZS1pbi1zY3JpcHR1cmUvYmI5M2U3OWVjMjVhNDM4OTk2ZWU0ZWJiZjQ0NDRlZjEtMzk3LmpwZyIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc0ODY4MDA2Mn19fV19&Key-Pair-Id=KQOSYIR44AIC0&Signature=lSAjo3Nu8RCTKbhlSc07x-YTTP7A2Li6b60Fvb0gtAZN96xMEg%7EiPCCszzH2cHsGgXt-abJS5y2S1UKAl5Y-BZlSK4OvD-f94b9UOXOFt2fv0YKRvigDSNR39YQV64a%7Ew8bhjjXbCRtgODLU4GEOl5fRYD0bWN9fwqA4RTvuK0nNQu9O4i3M%7E8iJf5A9sOGV%7EN4iAVkjEQhxQuQ-3Pmz5jG7PYcsC%7EN5JR1FkL-H1DcIZP4hmGEkZ4mtTFYs-jcvLu1h3XqgCr1AOy9Qizi7QAkpadrDxNZT2VgUA8720Sk1jMKGGsu4v2h0%7EoWE--sSkyt0c5VJAYC6-nDw34tzPA__" alt=""></p>
<ul>
<li>Po dokončení úprav smlouvy klikněte na &#39;Soubor&#39; a vyberte &#39;Stáhnout jako PDF&#39;.</li>
<li>Uložte dokument na vhodné místo.</li>
</ul>
<p><strong>5. Vytvoření obálky v DigiSign</strong> <a href="https://loom.com/share/bb93e79ec25a438996ee4ebbf4444ef1?t=426">7:06</a></p>
<p><img src="https://cdn.loom.com/sessions/picture-in-scripture/bb93e79ec25a438996ee4ebbf4444ef1-426.jpg?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9jZG4ubG9vbS5jb20vc2Vzc2lvbnMvcGljdHVyZS1pbi1zY3JpcHR1cmUvYmI5M2U3OWVjMjVhNDM4OTk2ZWU0ZWJiZjQ0NDRlZjEtNDI2LmpwZyIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc0ODY4MDA2Mn19fV19&Key-Pair-Id=KQOSYIR44AIC0&Signature=jlUte7i2td89yms1MCzl0XPVstoBlGNaj9XLHlp6wJW0epad27u5ZG0OBTWURQinjl9EVCPW5jrG8xnw5bz9ZaEHi9I5Tcg%7EzltnsNqLHw%7ETtV15KGvozLPJQOeUY1F%7ERMtnUEBIjEZeJLEvL0ZxL8oVXQZBIOWrlW1Z8Cwxnfs5Aa4tdB4i6ZrS2Z7P6AEzvacQ7cQgasPpbp7TB4FjaGn3U5p5AtDuUDIlDYtOiq74%7Eg4T9wxwyAcQgXJFbB1R8kx1d7u1Iffm-0P6Se9aWM6Ae8NDx7sWyLtoo7umHpASAzryA8JI24LNacMX0-mJzNrUIyXT3HLGt0sPBoen8w__" alt=""></p>
<ul>
<li>Přihlaste se do nástroje DigiSign.</li>
<li>Založte novou obálku a pojmenujte ji (např. &#39;Smlouva o spolupráci Helena Píšová&#39;).</li>
<li>Přetáhněte staženou smlouvu do obálky.</li>
</ul>
<p><strong>6. Nastavení pořadí podpisů</strong> <a href="https://loom.com/share/bb93e79ec25a438996ee4ebbf4444ef1?t=495">8:15</a></p>
<p><img src="https://cdn.loom.com/sessions/picture-in-scripture/bb93e79ec25a438996ee4ebbf4444ef1-495.jpg?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9jZG4ubG9vbS5jb20vc2Vzc2lvbnMvcGljdHVyZS1pbi1zY3JpcHR1cmUvYmI5M2U3OWVjMjVhNDM4OTk2ZWU0ZWJiZjQ0NDRlZjEtNDk1LmpwZyIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc0ODY4MDA2Mn19fV19&Key-Pair-Id=KQOSYIR44AIC0&Signature=ndAhH3%7EEbNZZ9q8Tscq78s3v88OFzbpJRVSEO%7E3gQhqz8pK0osvIozHXmrL6pRZ9SAv1cY6%7EayI4qs1HG1b139r8tQOov5trzH7jrazUhLO07rk-VFUJhj3QNBKaqVOG7pnBuofcnyvmFCJXC2XVrGTqnDUh%7Em1qoGx66zme%7EaawFI36qdk5vzyH--r0x17xXx44hZO6-EgpWMSZ6su-%7E9rQj3uvQNidUmyMhWw6wb-Mhtir-dAfQCbSVnVinILLaNOWa0zOxoP9-5ZhHPjl6aC-zozKzn8BdlyV5IXN199Dyc66j5xWJq4AdZvCtkMo2ZYCf0RUVsai-sQ-RkPsTA__" alt=""></p>
<ul>
<li>Přidejte příjemce, kteří budou smlouvu podepisovat (nejprve kolega, poté vy).</li>
<li>Ujistěte se, že pořadí podpisů je správné.</li>
</ul>
<p><strong>7. Přidání podpisových archů</strong> <a href="https://loom.com/share/bb93e79ec25a438996ee4ebbf4444ef1?t=624">10:24</a></p>
<p><img src="https://cdn.loom.com/sessions/picture-in-scripture/bb93e79ec25a438996ee4ebbf4444ef1-624.jpg?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9jZG4ubG9vbS5jb20vc2Vzc2lvbnMvcGljdHVyZS1pbi1zY3JpcHR1cmUvYmI5M2U3OWVjMjVhNDM4OTk2ZWU0ZWJiZjQ0NDRlZjEtNjI0LmpwZyIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc0ODY4MDA2Mn19fV19&Key-Pair-Id=KQOSYIR44AIC0&Signature=IkrdEc-b1aPQURG5KGCOPSCjCUpFzlqaT6GueJEHaHaNkPzjx2Jyc9PC8uDEk8YG76VZX1HJFc%7EHpPR0YYiW4LIzwYlmQqUTGPFSlXn48luhCv%7EQzp0%7EHxIXoiQJigNtDD16Xms5QfyQbDmISI-iPteIJHu1va2mJ5cvF65wkiZFJUyq7FX869Ny0fZkFPp3fMNScrqtp1LloImSx0fzq107FZC%7EGUCmCRJSUL0oVoa7-Z5g4EBaSrAiVQoUkTJCBwhTCUTG5xe0q1jsQWTuK7ucX8uCmXNDmhabwWuQgIhc4d5kTDKTFWjAaIQlkvAQp5Y6NQg%7EXlhE9W-3RARAOw__" alt=""></p>
<ul>
<li>Přetáhněte podpisové archy do smlouvy.</li>
<li>Zkontrolujte, že jsou správně přiřazeni k jednotlivým osobám.</li>
</ul>
<p><strong>8. Odeslání smlouvy k podpisu</strong> <a href="https://loom.com/share/bb93e79ec25a438996ee4ebbf4444ef1?t=728">12:08</a></p>
<p><img src="https://cdn.loom.com/sessions/picture-in-scripture/bb93e79ec25a438996ee4ebbf4444ef1-728.jpg?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9jZG4ubG9vbS5jb20vc2Vzc2lvbnMvcGljdHVyZS1pbi1zY3JpcHR1cmUvYmI5M2U3OWVjMjVhNDM4OTk2ZWU0ZWJiZjQ0NDRlZjEtNzI4LmpwZyIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc0ODY4MDA2Mn19fV19&Key-Pair-Id=KQOSYIR44AIC0&Signature=E-VbtaG12tbtzxUwlinHA1KcmTQFEJVCCxtcjqIlOAhnkBPvdF94Zj%7EdSCZkHNTe7wVDgbof4t%7EeXOW0jFPY7zLkAb6IByUvcjriSA6LaoGK%7EGxemAtw%7EqZCIJE8RB5vkC9WvAdQISy0HKILzuJlflgF0HcGeVYzlm3hzMdE5LxQSfgcJpnR8wZHcz1-hf9ThCiulo7Ebr44VmxbGScn89hRYgZdAMXWjGFY1KXehDkJl7Vxrx%7EXhtHA1vr%7EtQNP167mX2Q49YJ9f1AOIVl680yldRJy-ejft-bsH7YpWIJoJQ4B9s2f7Xdqp-anaxa5q%7Eo2pM6IQ16geBarbnC4bw__" alt=""></p>
<ul>
<li>Po dokončení všech úprav a přidání podpisů odešlete smlouvu k podpisu kolegovi.</li>
</ul>
<h3>Cautionary Notes</h3>
<ul>
<li>Ujistěte se, že všechny informace jsou správné, aby se předešlo chybám v smlouvě.</li>
<li>Dbejte na to, aby byly dodrženy všechny právní požadavky při vytváření smlouvy.</li>
</ul>
<h3>Tips for Efficiency</h3>
<ul>
<li>Vytvořte si šablony pro smlouvy, abyste ušetřili čas při jejich přípravě.</li>
<li>Používejte nástroje jako Merck a DigiSign pro rychlejší a efektivnější procesy.</li>
</ul>
<p><a href="https://loom.com/share/bb93e79ec25a438996ee4ebbf4444ef1">https://loom.com/share/bb93e79ec25a438996ee4ebbf4444ef1</a></p>
',
'🙋‍♂️ Hlavní decision maker: Daniel Bauer Smlouvy připravuje: Asistentka Cil: Vytvořit smlouvu pro nového kolegu https://www.loom.com/share/bb93e79ec25a438996ee4ebbf4444ef1?sid=f1d3872d-057e-4d72-a220-2a524f585f79 Key Steps Získání informací o novém kolegovi 0:20 ![](https://cdn.loom.com/sessions/picture-in-scripture/bb93e79ec25a438996ee4ebbf4444ef1-20.jpg?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9jZG4ubG9vbS5jb20vc2Vzc2lvbnMvcGljdHVyZS1pbi1zY3JpcHR1cmUvYmI5M2U3OWVjMjVhNDM4OTk2ZWU0ZWJiZjQ0NDRlZjEtMjAuanBnIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzQ4NjgwMDYyfX19XX0_&Key-Pair-Id=KQOSYIR44AIC0&Signature=myVI4wznl3WB3Rfn-xHWuTymzGuadxdEf7coYdLHM8Xk9qBWDIfzINEhPF-NL7CBifNbJ0eL2hELbtjDLleXGsx5A2kMAauV0MG3OAmfHzAjg329Ebpi2bcM31gGFUSnvjBZwYtbFbtTCpXtplpppXl1bPVpoPGTctYq2n3xGwVFabfotUtoDWPJI6BKVpc8CT4kdiLUa7T62NAts7-C3wbHrcoRsBytriA55vp6pZMph29szvklIYoTRcng%7ES3n8nApCeWWrbO01IP0Pf4uHKzbDJ5ccp7Zmjdviidya1pKKDKquGmvr9nQ-OT1u%7EiRNkLRnumVwczvy7--7pcuIw__) Zkontrolujte e-mail, kde obdržíte odkaz na vytvořenou smlouvu. Všechny informace o nových kolezích jsou shromážděny v Google formuláři, který vyplní noví kolegové. Kontrola informací v nástroji Merck 2:48 ![](https://cdn.loom.com/sessions/picture-in-scripture/bb93e79ec25a438996ee4ebbf4444ef1-168.jpg?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9jZG4ubG9vbS5jb20vc2Vzc2lvbnMvcGljdHVyZS1pbi1zY3JpcHR1cmUvYmI5M2U3OWVjMjVhNDM4OTk2ZWU0ZWJiZjQ0NDRlZjEtMTY4LmpwZyIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc0ODY4MDA2Mn19fV19&Key-Pair-Id=KQOSYIR44AIC0&Signature=QlFHzER4KpAGiG7TB%7E8KoaXUCm5TB0FTeDQl5XS25DttEYGP8IFdWImbGNSNvAm0Uk-F5zbMQVKvowNvaHnBj4UvU8GIdUHqdbT-qgj7UZ9JUaUonEU42M00i7AlJCUxIf0X2xR7tCxG-ObudRRkV9cZzOYOaUw4rqpW7LA-hZ19Es7uP9JxVDySrXV-J1gak8w9MS5-85tYqUvmOB0LgoHaxrjFPNi6ywFtAE9ZqEE4wvUM%7E5nt5DN0nuWx9Y8IiewtVUpavkqcJnyc7SFyNf6wAP6HXgVyloKhAR0-Bz7M-8YE2XrbrY8Zbh4T4pnunrLFgFRd2GDS5h1Jac5bxg__) Přihlaste se do nástroje Merck (www.merk.cz). Vyhledejte nového kolegu podle IČa nebo názvu subjektu. Zkontrolujte správnost adresy a dalších informací. Příprava smlouvy 4:36 ![](https://cdn.loom.com/sessions/picture-in-scripture/bb93e79ec25a438996ee4ebbf4444ef1-276.jpg?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9jZG4ubG9vbS5jb20vc2Vzc2lvbnMvcGljdHVyZS1pbi1zY3JpcHR1cmUvYmI5M2U3OWVjMjVhNDM4OTk2ZWU0ZWJiZjQ0NDRlZjEtMjc2LmpwZyIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc0ODY4MDA2Mn19fV19&Key-Pair-Id=KQOSYIR44AIC0&Signature=K6YC%7EIV5F7hRnqqHSFnkR9UGu%7EE6Ev2vtffisjs-CM8Zvjo4aGxJsn47M739mtFmjYFOX-nP71u8BzUfPo95w7IB8dr%7EJP2aScoaR%7EqhVbJw72JNfXfo8RY%7EijE0vgOjg9B489YDRR7pif32k2N%7EPycSXPUZviO-PBDbK1mbZ98b6VQO81-Qasry5ldXA1mIPq7bRUDJDVDObUgZLEETDLgShjmqR2MpmOL9eXYsYVE2vuc0eRtBdubOk-bGs1AykU2STk0POUyvGTd8XlLzD3s5kOiEMZq%7EHUdMuWMSF2Qqd6X2D4V8qtGff2WA61NSo2ISeLJBJTi4vZM6a8UAPQ__) Otevřete šablonu smlouvy o spolupráci a GDPR. Zkontrolujte, zda jsou všechny informace správně vyplněny. Doplňte předmět smlouvy. Stáhnout smlouvu 6:37 ![](https://cdn.loom.com/sessions/picture-in-scripture/bb93e79ec25a438996ee4ebbf4444ef1-397.jpg?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9jZG4ubG9vbS5jb20vc2Vzc2lvbnMvcGljdHVyZS1pbi1zY3JpcHR1cmUvYmI5M2U3OWVjMjVhNDM4OTk2ZWU0ZWJiZjQ0NDRlZjEtMzk3LmpwZyIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc0ODY4MDA2Mn19fV19&Key-Pair-Id=KQOSYIR44AIC0&Signature=lSAjo3Nu8RCTKbhlSc07x-YTTP7A2Li6b60Fvb0gtAZN96xMEg%7EiPCCszzH2cHsGgXt-abJS5y2S1UKAl5Y-BZlSK4OvD-f94b9UOXOFt2fv0YKRvigDSNR39YQV64a%7Ew8bhjjXbCRtgODLU4GEOl5fRYD0bWN9fwqA4RTvuK0nNQu9O4i3M%7E8iJf5A9sOGV%7EN4iAVkjEQhxQuQ-3Pmz5jG7PYcsC%7EN5JR1FkL-H1DcIZP4hmGEkZ4mtTFYs-jcvLu1h3XqgCr1AOy9Qizi7QAkpadrDxNZT2VgUA8720Sk1jMKGGsu4v2h0%7EoWE--sSkyt0c5VJAYC6-nDw34tzPA__) Po dokončení úprav smlouvy klikněte na ''Soubor'' a vyberte ''Stáhnout jako PDF''. Uložte dokument na vhodné místo. Vytvoření obálky v DigiSign 7:06 ![](https://cdn.loom.com/sessions/picture-in-scripture/bb93e79ec25a438996ee4ebbf4444ef1-426.jpg?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9jZG4ubG9vbS5jb20vc2Vzc2lvbnMvcGljdHVyZS1pbi1zY3JpcHR1cmUvYmI5M2U3OWVjMjVhNDM4OTk2ZWU0ZWJiZjQ0NDRlZjEtNDI2LmpwZyIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc0ODY4MDA2Mn19fV19&Key-Pair-Id=KQOSYIR44AIC0&Signature=jlUte7i2td89yms1MCzl0XPVstoBlGNaj9XLHlp6wJW0epad27u5ZG0OBTWURQinjl9EVCPW5jrG8xnw5bz9ZaEHi9I5Tcg%7EzltnsNqLHw%7ETtV15KGvozLPJQOeUY1F%7ERMtnUEBIjEZeJLEvL0ZxL8oVXQZBIOWrlW1Z8Cwxnfs5Aa4tdB4i6ZrS2Z7P6AEzvacQ7cQgasPpbp7TB4FjaGn3U5p5AtDuUDIlDYtOiq74%7Eg4T9wxwyAcQgXJFbB1R8kx1d7u1Iffm-0P6Se9aWM6Ae8NDx7sWyLtoo7umHpASAzryA8JI24LNacMX0-mJzNrUIyXT3HLGt0sPBoen8w__) Přihlaste se do nástroje DigiSign. Založte novou obálku a pojmenujte ji (např. ''Smlouva o spolupráci Helena Píšová''). Přetáhněte staženou smlouvu do obálky. Nastavení pořadí podpisů 8:15 ![](https://cdn.loom.com/sessions/picture-in-scripture/bb93e79ec25a438996ee4ebbf4444ef1-495.jpg?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9jZG4ubG9vbS5jb20vc2Vzc2lvbnMvcGljdHVyZS1pbi1zY3JpcH',
49,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'59b9c61f-71d6-469a-80ea-863d928736f9',
'11111111-1111-1111-1111-111111111109',
'Publikování článků',
'<hr>
<p>Všechny články píše autor v Notion. Ve výjimečných případech v Google Docs, ale následně prosím o překopírování do Notion. ¨</p>
<p>Ve Freelu vždy plánujeme články 2 měsíce dopředu. V to-do listu &quot;Content&quot; vytvoříš ze šablony nový úkol a přidáš jednotlivé řešitele a termíny. </p>
<p>1**) Vytvoření nového příspěvku v <a href="https://www.socials.cz/wp-admin/">administraci wordpress</a> (příspěvky - vytvořit příspěvek) (**<a href="https://www.loom.com/share/f2cc6e7952a34355920b6d7ef7e7e35c">https://www.loom.com/share/f2cc6e7952a34355920b6d7ef7e7e35c</a>) Video</p>
<p>2**) Úprava textu**  </p>
<ul>
<li>H1 nepoužíváme</li>
<li>Nikdy nemůže být H3 před H2 atd</li>
<li>H2 vždy uděláme tučně - H2 se propisuje jako obsah článku</li>
<li>H3 nikdy není tučně</li>
<li>Nechceme mít moc dlouhé odstavce – špatně se na webu čtou – kde je to možné, dáme na další řádek</li>
</ul>
<p>3**) Přídání obrázků do textu**</p>
<ul>
<li>Nezapomeneme zmenšit obrázky přes <a href="https://tinypng.com/"><strong>tinypng.com</strong></a></li>
<li>Je třeba vždy odstranit URL odkaz na obrázek v Notion a místo něj přidat daný obrázek přes +</li>
<li>Vyplníme &quot;Alt&quot; popis obrázků</li>
<li>Doplníme zdroj obrázku, pokud bude třeba</li>
</ul>
<p>4**) Nastavení dokumentu**</p>
<ul>
<li>Nastavíme datum a čas publikování (ideálně v 7:00)</li>
<li>Viditelnost necháme &quot;Veřejná&quot;</li>
<li>Vybereme autora</li>
<li>Zvolíme příslušnou rubriku</li>
<li>Zakážeme komentáře</li>
<li>Pokud je URL moc dlouhá, vytvoříme vlastní ideálně s klíčovým slovem</li>
</ul>
<p>9**) Přidáme Featured Image (Hlavní obrázek článku)**</p>
<ul>
<li><a href="https://www.canva.com/design/DAEKxN23WvI/KeA6_7N06JAlubsgxKbAOw/edit">Template v Canvě</a></li>
<li>Obrázek zmenšíme přes <a href="https://tinypng.com/">tinypng.com</a></li>
<li>Vyplníme &quot;Alt&quot; popis</li>
</ul>
<p>10**) Stukturovaná data (pod článkem &quot;Configure Rich Snippet&quot;)**</p>
<ul>
<li>Vybereme &quot;Article&quot;</li>
<li>Přidáme Featured image</li>
<li>Vyplníme všechna pole</li>
<li>Publisher: Socials.cz</li>
<li>Publisher logo: Favicon</li>
</ul>
<p>11**) YOAST SEO**</p>
<ul>
<li>Vyplníme Title (formát: Jak začít s obsahovým marketingem na sociálních sítích | Socials)</li>
<li>Vyplníme description</li>
<li>Zkontrolujeme délku title a description v náhledu</li>
</ul>
<p>12**) Interní prolinkování**</p>
<ul>
<li>Můžeme přidat odkazy na jiné články?</li>
<li>Můžeme přidat do jiných článků odkazy na nový článek?</li>
</ul>
<p><strong>13) Publikování na sociální sítě</strong></p>
<ul>
<li>Publikování článku na Facebook (1080x1080)</li>
<li>Publikování článku na LinkedIn (1080x1080)</li>
<li>Publikování článku na Instagram (1080x1350)</li>
<li>Publikování stories (1080x1920)</li>
</ul>
<p><strong>14) Rozesílka newsletter</strong></p>
<ul>
<li>Doporučuji duplikovat již odeslanou kampaň a pouze předělat</li>
<li>Vždy uvádět datum a název rozesílky</li>
<li>Posíláme na celý seznam</li>
<li>V informaci o kampani upravíme: Název kampaně, předmět e-mailu, UTM campaign</li>
<li>Obsah e-mailu upravime - jiný text + odkaz do CallToCaton tlačítka na daný článek</li>
</ul>
',
'--Všechny články píše autor v Notion. Ve výjimečných případech v Google Docs, ale následně prosím o překopírování do Notion. ¨ Ve Freelu vždy plánujeme články 2 měsíce dopředu. V to-do listu "Content" vytvoříš ze šablony nový úkol a přidáš jednotlivé řešitele a termíny. 1) Vytvoření nového příspěvku v administraci wordpress (příspěvky vytvořit příspěvek) (https://www.loom.com/share/f2cc6e7952a34355920b6d7ef7e7e35c) Video 2) Úprava textu H1 nepoužíváme Nikdy nemůže být H3 před H2 atd H2 vždy uděláme tučně H2 se propisuje jako obsah článku H3 nikdy není tučně Nechceme mít moc dlouhé odstavce – špatně se na webu čtou – kde je to možné, dáme na další řádek 3) Přídání obrázků do textu Nezapomeneme zmenšit obrázky přes tinypng.com Je třeba vždy odstranit URL odkaz na obrázek v Notion a místo něj přidat daný obrázek přes + Vyplníme "Alt" popis obrázků Doplníme zdroj obrázku, pokud bude třeba 4) Nastavení dokumentu Nastavíme datum a čas publikování (ideálně v 7:00) Viditelnost necháme "Veřejná" Vybereme autora Zvolíme příslušnou rubriku Zakážeme komentáře Pokud je URL moc dlouhá, vytvoříme vlastní ideálně s klíčovým slovem 9) Přidáme Featured Image (Hlavní obrázek článku) Template v Canvě Obrázek zmenšíme přes tinypng.com Vyplníme "Alt" popis 10) Stukturovaná data (pod článkem "Configure Rich Snippet") Vybereme "Article" Přidáme Featured image Vyplníme všechna pole Publisher: Socials.cz Publisher logo: Favicon 11) YOAST SEO Vyplníme Title (formát: Jak začít s obsahovým marketingem na sociálních sítích | Socials) Vyplníme description Zkontrolujeme délku title a description v náhledu 12) Interní prolinkování Můžeme přidat odkazy na jiné články? Můžeme přidat do jiných článků odkazy na nový článek? 13) Publikování na sociální sítě Publikování článku na Facebook (1080x1080) Publikování článku na LinkedIn (1080x1080) Publikování článku na Instagram (1080x1350) Publikování stories (1080x1920) 14) Rozesílka newsletter Doporučuji duplikovat již odeslanou kampaň a pouze předělat Vždy uvádět datum a název rozesílky Posíláme na celý seznam V informaci o kampani upravíme: Název kampaně, předmět e-mailu, UTM campaign Obsah e-mailu upravime jiný text + odkaz do CallToCaton tlačítka na daný článek',
50,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'6521fe7b-54bb-451b-8220-f333afecfc0f',
'11111111-1111-1111-1111-111111111103',
'Reporting - jak reportovat klientovi',
'<h3>SOP: Reporting pro klienty s primárním využitím Loom</h3>
<p>Každý klient by měl mít jasný přehled o výsledcích a aktivitách, a to s ohledem na jeho preference. Naším standardním přístupem je <strong>domluvit si Google Meet</strong> (záleží klient od klienta). Pokud klient preferuje, nebo situace vyžaduje, můžete si domluvit alternativní způsoby (Loom video nebo zápis do Freelo.</p>
<p>Ať už se s klientem domluvíte na jakékoliv variantě, **vždy musí být každý měsíc shrnut ve Freelo pro budoucí dohledání (**nikdo si už nepamatuje, co bylo před 6 měsíci).</p>
<h3><strong>Postup pro reporting</strong></h3>
<ul>
<li><strong>1. Google Meet (Primární způsob)</strong><ul>
<li><strong>Kdy meeting domlouvat?</strong><ul>
<li>Pokud klient preferuje osobnější přístup nebo je potřeba něco specifického projednat.</li>
<li>Není nutné pořádat meeting každý měsíc – záleží na klientovi.</li>
<li>Google Meet domlouvat vždy, když se klient ve Freelo pokládá komplexní otázky, na které by vám zabralo hromadu času odpovídat. I přes to nezapomeňte po meetingu na zápis klíčových bodů.</li>
</ul>
</li>
<li><strong>Postup při meetingu</strong>:<ol>
<li>Přečti si <a href="Jak%20reportovat%20klientovi%20671496a3aaaa47a99d11472a6025a087.md">Jak reportovat klientovi? </a> </li>
<li>Po meetingu vytvořte zápis, který nasdílíte do Freela:<ul>
<li><strong>Zápis dáváte do úkolu [Reporty] &gt; příslušný podúkol (např. 08/2024, 09/2024)</strong>.</li>
</ul>
</li>
<li>Všechny důležité body převeďte na konkrétní úkoly ve Freelu.</li>
<li>Vše najdete tady 👉🏻 <a href="Jak%20reportovat%20klientovi%20671496a3aaaa47a99d11472a6025a087.md">Jak reportovat klientovi? </a></li>
</ol>
</li>
</ul>
</li>
<li><strong>2. Video reporting přes Loom (Sekundárdní způsob)</strong><ul>
<li><strong>Termín</strong>: Loom report posílejte nejpozději do 5. dne v měsíci.</li>
<li><strong>Obsah videa</strong>:<ol>
<li>Hlavní KPI klienta (celkový přehled i dle marketingových kanálů).</li>
<li>Meziroční srovnání výsledků.</li>
<li>Přehled aktivit za minulý měsíc (např. tvorba bannerů, UX vylepšení, řešení technických potíží).</li>
<li>Informace o úkolech čekajících na spolupráci klienta.</li>
<li>Plán na příští měsíc (případně odkaz na relevantní úkoly ve Freelu).</li>
<li>Dotazy na klienta (plánují akce, launch novinek atd.).</li>
<li>Žádost o zpětnou vazbu na naši práci.</li>
</ol>
</li>
<li><strong>Sdílení Loom videa</strong>:<ul>
<li>Odkaz na video vložte do úkolu ve Freelu: <strong>[Reporty] &gt; příslušný podúkol (např. 08/2024, 09/2024)</strong>.</li>
</ul>
</li>
</ul>
</li>
</ul>
<hr>
<ul>
<li><strong>3. Zápis aktivit (Alternativa nebo doplněk)</strong><ul>
<li>Pokud klient nepotřebuje Loom nebo meeting, připravte <strong>stručný zápis aktivit do Freela</strong>:<ul>
<li><strong>Kam zápis patří?</strong> Úkol <strong>[Reporty] &gt; příslušný podúkol (např. 08/2024, 09/2024)</strong>.</li>
<li><strong>Obsah zápisu</strong>:<ol>
<li>Hlavní KPI klienta (celkový přehled i dle marketingových kanálů).</li>
<li>Meziroční srovnání výsledků.</li>
<li>Přehled aktivit za minulý měsíc.</li>
<li>Úkoly čekající na spolupráci klienta.</li>
<li>Plán na příští měsíc a odkazy na relevantní úkoly.</li>
<li>Dotazy na klienta a zpětná vazba.</li>
</ol>
</li>
</ul>
</li>
</ul>
</li>
</ul>
<hr>
<ul>
<li><strong>Co musí obsahovat každý reporting ?</strong><ol>
<li>shrnutí hlavních KPI pro daného klienta v rámci celého e-shopu</li>
<li>hlavní KPI dle marketingových kanálů</li>
<li>meziroční srovnání výsledků</li>
<li><strong>☝🏻 porovnat výsledky z Looker Studia, platforem a GA4 s reálnými zůstatky na účtě klienta</strong></li>
<li>co se v tom měsíci událo z naší strany (byla nějaká akce, tvořili jsme bannery, videa, řešili jsme UX, nějaké technické potíže, atp.)</li>
<li>poprosíme klienta o spolupráci v úkolech, kde čekáme na odpovědi klienta</li>
<li>stručně v bodech řekneme, co nás čeká v příštím měsíci (pokud dopředu známe akce, které se chystají, dejme odkaz na daný úkol ve Freelo, atp.)</li>
<li>zeptáme se, jestli plánují nějakou akci, launch novinky, atp. </li>
<li>poprosíme je o zpětnou vazbu na naši práci a plníme-li očekávání (u větších klientů rovněž nabídneme možnost domluvení si meetingu, když budou chtít), čti 👉🏻 <a href="Pravideln%C3%A9%20vyhodnocov%C3%A1n%C3%AD%20spokojenosti%20klienta%208c1be0a99ca7492e82d438aa445799d3.md">Pravidelné vyhodnocování spokojenosti klienta</a></li>
</ol>
</li>
</ul>
<hr>
<ul>
<li><strong>Jak by měl vypadat zápis?</strong><ol>
<li>Zápis dáváte do úkolu [Reporty] &gt; příslušný podúkol, např. [01/2025, 02/2025], Zápis obsahuje:</li>
<li>hlavní KPI pro daného klienta v rámci celého e-shopu</li>
<li>hlavní KPI dle marketingových kanálů</li>
<li>porovnat si meziroční srovnání výsledků</li>
<li><strong>porovnat výsledky z Looker Studia, platforem a GA4 s reálnými zůstatky na účtě klienta</strong></li>
<li>co se v tom měsíci událo z naší strany (byla nějaká akce, tvořili jsme bannery, videa, řešili jsme UX, nějaké technické potíže, atp.)</li>
<li>poprosíme klienta o spolupráci v úkolech, kde čekáme na odpovědi klienta</li>
<li>stručně v bodech řekneme, co nás čeká v příštím měsíci (pokud dopředu známe akce, které se chystají, dejme odkaz na daný úkol ve Freelo, atp.)</li>
<li>zeptáme se, jestli plánují nějakou akci, launch novinky, atp. </li>
<li>poprosíme je o zpětnou vazbu na naši práci a plníme-li očekávání (u větších klientů rovněž nabídneme možnost domluvení si meetingu, když budou chtít), čti 👉🏻</li>
</ol>
</li>
</ul>
<p> </p>
<hr>
<h1><strong>Shrnutí workflow</strong></h1>
<ol>
<li><strong>Primární</strong>: Ať už si s klientem domluvíte reporting přes Loom, Google Meet nebo psaný report ve Freelo, vždy musí proběhnout zápis, který uložíte do příslušného měsíce ve Freelo. Reporting by měl být hotový ideálně do 5. dne v měsíci (pokud se s klientem nedomluvíte jinak).</li>
<li><strong>Po meetingu</strong>: klíčové body ze zápisu převeďte na jednotlivé úkoly ve Freelo.</li>
<li><strong>Pokračujte 👉🏻 <a href="Jak%20reportovat%20klientovi%20671496a3aaaa47a99d11472a6025a087.md">Jak reportovat klientovi? </a></strong></li>
</ol>
<hr>
<p>Dodržování tohoto SOP zajistí efektivní reporting, spokojenost klientů a přehled o aktivitách. 😊</p>
',
'SOP: Reporting pro klienty s primárním využitím Loom Každý klient by měl mít jasný přehled o výsledcích a aktivitách, a to s ohledem na jeho preference. Naším standardním přístupem je domluvit si Google Meet (záleží klient od klienta). Pokud klient preferuje, nebo situace vyžaduje, můžete si domluvit alternativní způsoby (Loom video nebo zápis do Freelo. Ať už se s klientem domluvíte na jakékoliv variantě, vždy musí být každý měsíc shrnut ve Freelo pro budoucí dohledání (nikdo si už nepamatuje, co bylo před 6 měsíci). Postup pro reporting Google Meet (Primární způsob) Kdy meeting domlouvat? Pokud klient preferuje osobnější přístup nebo je potřeba něco specifického projednat. Není nutné pořádat meeting každý měsíc – záleží na klientovi. Google Meet domlouvat vždy, když se klient ve Freelo pokládá komplexní otázky, na které by vám zabralo hromadu času odpovídat. I přes to nezapomeňte po meetingu na zápis klíčových bodů. Postup při meetingu: Přečti si Jak reportovat klientovi? Po meetingu vytvořte zápis, který nasdílíte do Freela: Zápis dáváte do úkolu [Reporty] příslušný podúkol (např. 08/2024, 09/2024). Všechny důležité body převeďte na konkrétní úkoly ve Freelu. Vše najdete tady 👉🏻 Jak reportovat klientovi? Video reporting přes Loom (Sekundárdní způsob) Termín: Loom report posílejte nejpozději do dne v měsíci. Obsah videa: Hlavní KPI klienta (celkový přehled i dle marketingových kanálů). Meziroční srovnání výsledků. Přehled aktivit za minulý měsíc (např. tvorba bannerů, UX vylepšení, řešení technických potíží). Informace o úkolech čekajících na spolupráci klienta. Plán na příští měsíc (případně odkaz na relevantní úkoly ve Freelu). Dotazy na klienta (plánují akce, launch novinek atd.). Žádost o zpětnou vazbu na naši práci. Sdílení Loom videa: Odkaz na video vložte do úkolu ve Freelu: [Reporty] příslušný podúkol (např. 08/2024, 09/2024). --Zápis aktivit (Alternativa nebo doplněk) Pokud klient nepotřebuje Loom nebo meeting, připravte stručný zápis aktivit do Freela: Kam zápis patří? Úkol [Reporty] příslušný podúkol (např. 08/2024, 09/2024). Obsah zápisu: Hlavní KPI klienta (celkový přehled i dle marketingových kanálů). Meziroční srovnání výsledků. Přehled aktivit za minulý měsíc. Úkoly čekající na spolupráci klienta. Plán na příští měsíc a odkazy na relevantní úkoly. Dotazy na klienta a zpětná vazba. --Co musí obsahovat každý reporting ? shrnutí hlavních KPI pro daného klienta v rámci celého e-shopu hlavní KPI dle marketingových kanálů meziroční srovnání výsledků ☝🏻 porovnat výsledky z Looker Studia, platforem a GA4 s reálnými zůstatky na účtě klienta co se v tom měsíci událo z naší strany (byla nějaká akce, tvořili jsme bannery, videa, řešili jsme UX, nějaké technické potíže, atp.) poprosíme klienta o spolupráci v úkolech, kde čekáme na odpovědi klienta stručně v bodech řekneme, co nás čeká v příštím měsíci (pokud dopředu známe akce, které se chystají, dejme odkaz na daný úkol ve Freelo, atp.) zeptáme se, jestli plánují nějakou akci, launch novinky, atp. poprosíme je o zpětnou vazbu na naši práci a plníme-li očekávání (u větších klientů rovněž nabídneme možnost domluvení si meetingu, když budou chtít), čti 👉🏻 Pravidelné vyhodnocování spokojenosti klienta --Jak by měl vypadat zápis? Zápis dáváte do úkolu [Reporty] příslušný podúkol, např. [01/2025, 02/2025], Zápis obsahuje: hlavní KPI pro daného klienta v rámci celého e-shopu hlavní KPI dle marketingových kanálů porovnat si meziroční srovnání výsledků porovnat výsledky z Looker Studia, platforem a GA4 s reálnými zůstatky na účtě klienta co se v tom měsíci událo z naší strany (byla nějaká akce, tvořili jsme bannery, videa, řešili jsme UX, nějaké technické potíže, atp.) poprosíme klienta o spolupráci v úkolech, kde čekáme na odpovědi klienta stručně v bodech řekneme, co nás čeká v příštím měsíci (pokud dopředu známe akce, které se chystají, dejme odkaz na daný úkol ve Freelo, atp.) zeptáme se, jestli plánují nějakou akci, launch novinky, atp. poprosíme je o zpětnou vazbu na naši práci a plníme-li očekávání (u větších klientů rovněž nabídneme možnost domluvení si meetingu, když budou chtít), čti 👉🏻 --Shrnutí workflow Primární: Ať už si s klientem domluvíte reporting přes Loom, Google Meet nebo psaný report ve Freelo, vždy musí proběhnout zápis, který uložíte do příslušného měsíce ve Freelo. Reporting by měl být hotový ideálně do dne v měsíci (pokud se s klientem nedomluvíte jinak). Po meetingu: klíčové body ze zápisu převeďte na jednotlivé úkoly ve Freelo. Pokračujte 👉🏻 Jak reportovat klientovi? --Dodržování tohoto SOP zajistí efektivní reporting, spokojenost klientů a přehled o aktivitách. 😊',
51,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'3f949a74-a807-433f-bd26-6c17a2a6e68c',
'11111111-1111-1111-1111-111111111105',
'Rozměry PPC bannerů pro Google Ads a S-klik',
'<p>Prosíme o přípravu klasických a responzivních / kombinovaných bannerů pro PPC kampaně.</p>
<h1>🚨 Pravidla pro tvorbu bannerů</h1>
<ul>
<li>pokud probíhá akce déle než 48 hodin, zpravidla se připravuje celý set bannerů o těch cca 12 rozměrech. V těchto bannerech má být logo, akční tlačítko, text.</li>
<li>v případě, že akce probíhá déle než 48 hodin, ale z nějakého důvodu nemáte kapacitu připravovat všech 12 rozměrů (akce na poslední chvíli, atp.), připravují se bannery v rozměrech: 160x600, 300x600, 300x250, 320x100, 728x90, 480x480</li>
<li>pokud je akce pouze 24 hodin, nemá smysl dělat bannery s texty, logem a akčním tlačítkem. Stačí pouze maximálně 5 variant čistých „bannerů“, tzn. bez loga, textu a tlačítka, v rozměrech 1200x1200 a 1200x628.</li>
</ul>
<h3>1) Specifikace pro klasické bannery</h3>
<ul>
<li><strong>Podporované formáty:</strong> JPEG, PNG, GIF</li>
<li><strong>Maximální datová velikost:</strong> 150 kB</li>
</ul>
<h3>Rozměry klasických bannerů</h3>
<ul>
<li><strong>160×600 px</strong></li>
<li><strong>300×600 px</strong></li>
<li><strong>300×250 px</strong></li>
<li><strong>320×100 px</strong></li>
<li><strong>728×90 px</strong></li>
<li><strong>300×300 px</strong></li>
<li><strong>480×300 px</strong></li>
<li><strong>480×480 px</strong></li>
<li><strong>336×280 px</strong></li>
<li><strong>300×1050 px</strong></li>
<li><strong>250×250 px</strong></li>
</ul>
<h2>2) Specifikace pro responzivní / kombinovanou reklamu</h2>
<p>⚠️ Na bannerech pro kombinovanou reklamu <strong>nesmí být žádný uměle vložený text</strong>. Může být klidně jen fotka.</p>
<ul>
<li><strong>Podporované formáty obrázků:</strong> JPEG, PNG, GIF</li>
<li><strong>Maximální datová velikost:</strong> 1 MB</li>
</ul>
<h3>Společné formáty obrázků:</h3>
<ul>
<li><strong>Obdélník (1,91:1)</strong>: Doporučený rozměr 1200×628 px, minimální rozměr 600×314 px</li>
<li><strong>Čtverec (1:1)</strong>: Doporučený rozměr 1200×1200 px, minimální rozměr 300×300 px</li>
</ul>
<h3>Loga:</h3>
<ul>
<li><strong>Obdélníkové logo (4:1):</strong> Doporučený rozměr 1200×300 px, minimální rozměr 512×128 px</li>
<li><strong>Čtvercové logo (1:1):</strong> Doporučený rozměr 1200×1200 px, minimální rozměr 128×128 px</li>
</ul>
<h2>❓Informace o formátech od Google a Seznamu</h2>
<table>
<thead>
<tr>
<th>S-klik</th>
<th>Google Ads</th>
</tr>
</thead>
<tbody><tr>
<td><a href="https://napoveda.sklik.cz/pravidla/bannery/">Klasické</a></td>
<td><a href="https://support.google.com/google-ads/answer/1722096?sjid=7990254638773772269-EU#zippy=%2Canimated-and-non-animated-image-ads">Klasické</a></td>
</tr>
<tr>
<td><a href="https://napoveda.sklik.cz/pravidla/kombinovana-reklama/">Kombinované</a></td>
<td><a href="https://support.google.com/google-ads/answer/6363750?sjid=7990254638773772269-EU">Responzivní</a></td>
</tr>
<tr>
<td><a href="https://napoveda.sklik.cz/pravidla/branding/">Branding</a></td>
<td></td>
</tr>
</tbody></table>
',
'Prosíme o přípravu klasických a responzivních / kombinovaných bannerů pro PPC kampaně. 🚨 Pravidla pro tvorbu bannerů pokud probíhá akce déle než 48 hodin, zpravidla se připravuje celý set bannerů o těch cca 12 rozměrech. V těchto bannerech má být logo, akční tlačítko, text. v případě, že akce probíhá déle než 48 hodin, ale z nějakého důvodu nemáte kapacitu připravovat všech 12 rozměrů (akce na poslední chvíli, atp.), připravují se bannery v rozměrech: 160x600, 300x600, 300x250, 320x100, 728x90, 480x480 pokud je akce pouze 24 hodin, nemá smysl dělat bannery s texty, logem a akčním tlačítkem. Stačí pouze maximálně 5 variant čistých „bannerů“, tzn. bez loga, textu a tlačítka, v rozměrech 1200x1200 a 1200x1) Specifikace pro klasické bannery Podporované formáty: JPEG, PNG, GIF Maximální datová velikost: 150 kB Rozměry klasických bannerů 160×600 px 300×600 px 300×250 px 320×100 px 728×90 px 300×300 px 480×300 px 480×480 px 336×280 px 300×1050 px 250×250 px 2) Specifikace pro responzivní / kombinovanou reklamu ⚠️ Na bannerech pro kombinovanou reklamu nesmí být žádný uměle vložený text. Může být klidně jen fotka. Podporované formáty obrázků: JPEG, PNG, GIF Maximální datová velikost: 1 MB Společné formáty obrázků: Obdélník (1,91:1): Doporučený rozměr 1200×628 px, minimální rozměr 600×314 px Čtverec (1:1): Doporučený rozměr 1200×1200 px, minimální rozměr 300×300 px Loga: Obdélníkové logo (4:1): Doporučený rozměr 1200×300 px, minimální rozměr 512×128 px Čtvercové logo (1:1): Doporučený rozměr 1200×1200 px, minimální rozměr 128×128 px ❓Informace o formátech od Google a Seznamu | S-klik | Google Ads | | --| --| | Klasické | Klasické | | Kombinované | Responzivní | | Branding | |',
52,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'e5d4c8a5-2345-444f-a5da-469a2f35f462',
'11111111-1111-1111-1111-111111111111',
'Řešení neplatičů & ukončení spolupráce',
'<p>Tento SOP definuje jednotný postup, jak Socials postupuje v případě, kdy klient neproplácí faktury po splatnosti. Cílem je férová, přátelská, ale konzistentní komunikace a ochrana firmy.</p>
<hr>
<h1><strong>1) Automatické upomínky ve Fakturoidu</strong></h1>
<p>Fakturoid posílá klientovi automatické upozornění:</p>
<ol>
<li><strong>3 dny po splatnosti</strong></li>
<li><strong>7 dní po splatnosti</strong></li>
<li><strong>14 dní po splatnosti</strong></li>
</ol>
<p>Pokud klient zaplatí – proces končí.</p>
<p>Pokud <strong>nezaplatí</strong> → přechází se na manuální kroky.</p>
<hr>
<h1><strong>2) První manuální upozornění – posílá Dana Bauerová</strong></h1>
<p><strong>Kdy:</strong></p>
<p>→ pokud je faktura více než <strong>14 dní po splatnosti</strong> a klient nereagoval na automatické upomínky.</p>
<p><strong>Odesílatel:</strong></p>
<ul>
<li>Dana Bauerová</li>
<li>v kopii: <strong>Otas</strong>, <strong>Dan</strong></li>
</ul>
<hr>
<h3><strong>E-mail #1 (Dana – přátelský tón)</strong></h3>
<p><strong>Předmět:</strong> Připomenutí faktur po splatnosti</p>
<p>Dobrý den,</p>
<p>ráda bych Vás upozornila, že u Vás aktuálně evidujeme fakturu po splatnosti. Chápeme, že se to může stát, a proto bych Vás chtěla poprosit o informaci, kdy můžeme očekávat úhradu faktury.</p>
<p>Přikládám odkaz na fakturu níže.</p>
<p><a href="https://app.fakturoid.cz/socialsadvertising/p/MWspMptGtg/20250362">(odkaz)</a></p>
<p>Budu ráda za rychlou zprávu, ať víme, jak s tím dále pracovat.</p>
<p>Předem moc děkuji.</p>
<hr>
<h1><strong>3) Druhé upozornění – posílá Otas (spolumajitel)</strong></h1>
<p><strong>Kdy:</strong></p>
<p>→ pokud klient nereaguje na Dany e-mail do <strong>7 dnů</strong>.</p>
<p><strong>Tón:</strong></p>
<p>přátelský, ale už asertivní a „z pozice leadershipu“.</p>
<hr>
<h3><strong>E-mail #2 (Otas – poslední výzva před ukončením)</strong></h3>
<p><strong>Předmět:</strong> Urgentní – stále neuhrazené faktury</p>
<p>Dobrý den,</p>
<p>navazuji na e-mail od Dany ohledně neuhrazené faktur.</p>
<p>Aktuálně je po splatnosti již více než [xx] dní a stále jsme od Vás neobdrželi žádnou reakci.</p>
<p>Rád bych Vás poprosil o potvrzení, kdy můžeme očekávat úhradu.</p>
<p>Potřebujeme to vědět kvůli interním procesům a plynulému pokračování spolupráce.</p>
<p>Pokud se nám neozvete ani tentokrát, budeme bohužel nuceni přistoupit k dalším krokům.</p>
<p>Děkuji za rychlou odpověď.</p>
<p>S pozdravem,</p>
<p><strong>Otas Lucák</strong></p>
<p>Co-lead Socials</p>
<hr>
<h1><strong>4) Ukončení spolupráce – posílá Otas</strong></h1>
<p><strong>Kdy:</strong></p>
<p>→ pokud klient nereaguje ani na druhé upozornění</p>
<p>→ nebo se opakovaně vyhýbá platbě</p>
<p>→ nebo je po splatnosti přes 30+ dní bez kontaktu</p>
<p><strong>Akce:</strong></p>
<ul>
<li>okamžitě se ukončuje smlouva o propagaci</li>
<li>pauzují se kampaně</li>
<li>Socials ukončuje přístup do všech nástrojů</li>
<li>klient dostává finální pokyn k úhradě</li>
<li>pokud neproplatí = jde to právníkovi</li>
</ul>
<hr>
<h3><strong>E-mail #3 (Otas – ukončení spolupráce)</strong></h3>
<p><strong>Předmět:</strong> Ukončení spolupráce + poslední výzva k úhradě</p>
<p>Dobrý den,</p>
<p>jelikož jsme od Vás ani po opakovaných upozorněních neobdrželi úhradu faktur ani žádnou zpětnou vazbu, jsme nuceni k dnešnímu dni ukončit naši spolupráci a pozastavit správu reklamních kampaní a všech souvisejících služeb.</p>
<p>Prosím o úhradu všech neuhrazených faktur nejpozději (dopiš datum).</p>
<p>Pokud nebudou do tohoto termínu uhrazeny, budeme nuceni věc předat našemu právnímu zástupci k dalšímu postupu včetně vymáhání pohledávek.</p>
<p>V případě jakýchkoli dotazů jsme připraveni je společně vyřešit.</p>
<p>S pozdravem,</p>
<p><strong>Otas Lucák</strong></p>
<hr>
<h1><strong>5) Interní proces po ukončení spolupráce</strong></h1>
<ol>
<li><p><strong>Pauznout kampaně</strong></p>
<p> – Meta Ads, Google Ads, Sklik, případně další platformy.</p>
</li>
<li><p><strong>Odebrat přístupy</strong></p>
<p> – BM, Google Ads, GA4, Tag Manager, Drive, Slack, Freelo.</p>
</li>
<li><p><strong>Zapsat ukončení do Raynetu</strong></p>
</li>
<li><p><strong>Informovat celý tým</strong> na Slacku</p>
<p> → stručné vysvětlení + potvrzení, že spolupráce končí kvůli neplacení.</p>
</li>
<li><p><strong>Připravit soubor pro právníka</strong>, pokud nebude úhrada:</p>
<ul>
<li>smlouva</li>
<li>faktury</li>
<li>komunikace</li>
</ul>
</li>
</ol>
<hr>
<h1><strong>6) Poznámka pro tým</strong></h1>
<p>Tento SOP je závazný.</p>
<p>Cílem je udržet profesionální, konzistentní a spravedlivý přístup ke všem klientům i k našemu týmu.</p>
<hr>
<p>Pokud chceš, přidám k SOP i:</p>
<p>✔ checklist kroků k ukončení ve Freelo</p>
<p>✔ tagy pro označení klienta v Airtable</p>
<p>✔ stručnou verzi SOP přímo pro Slack jako pinned message</p>
<p>Stačí říct.</p>
',
'Tento SOP definuje jednotný postup, jak Socials postupuje v případě, kdy klient neproplácí faktury po splatnosti. Cílem je férová, přátelská, ale konzistentní komunikace a ochrana firmy. --1) Automatické upomínky ve Fakturoidu Fakturoid posílá klientovi automatické upozornění: 3 dny po splatnosti 7 dní po splatnosti 14 dní po splatnosti Pokud klient zaplatí – proces končí. Pokud nezaplatí → přechází se na manuální kroky. --2) První manuální upozornění – posílá Dana Bauerová Kdy: → pokud je faktura více než 14 dní po splatnosti a klient nereagoval na automatické upomínky. Odesílatel: Dana Bauerová v kopii: Otas, Dan --E-mail #1 (Dana – přátelský tón) Předmět: Připomenutí faktur po splatnosti Dobrý den, ráda bych Vás upozornila, že u Vás aktuálně evidujeme fakturu po splatnosti. Chápeme, že se to může stát, a proto bych Vás chtěla poprosit o informaci, kdy můžeme očekávat úhradu faktury. Přikládám odkaz na fakturu níže. (odkaz) Budu ráda za rychlou zprávu, ať víme, jak s tím dále pracovat. Předem moc děkuji. --3) Druhé upozornění – posílá Otas (spolumajitel) Kdy: → pokud klient nereaguje na Dany e-mail do 7 dnů. Tón: přátelský, ale už asertivní a „z pozice leadershipu“. --E-mail #2 (Otas – poslední výzva před ukončením) Předmět: Urgentní – stále neuhrazené faktury Dobrý den, navazuji na e-mail od Dany ohledně neuhrazené faktur. Aktuálně je po splatnosti již více než [xx] dní a stále jsme od Vás neobdrželi žádnou reakci. Rád bych Vás poprosil o potvrzení, kdy můžeme očekávat úhradu. Potřebujeme to vědět kvůli interním procesům a plynulému pokračování spolupráce. Pokud se nám neozvete ani tentokrát, budeme bohužel nuceni přistoupit k dalším krokům. Děkuji za rychlou odpověď. S pozdravem, Otas Lucák Co-lead Socials --4) Ukončení spolupráce – posílá Otas Kdy: → pokud klient nereaguje ani na druhé upozornění → nebo se opakovaně vyhýbá platbě → nebo je po splatnosti přes 30+ dní bez kontaktu Akce: okamžitě se ukončuje smlouva o propagaci pauzují se kampaně Socials ukončuje přístup do všech nástrojů klient dostává finální pokyn k úhradě pokud neproplatí = jde to právníkovi --E-mail #3 (Otas – ukončení spolupráce) Předmět: Ukončení spolupráce + poslední výzva k úhradě Dobrý den, jelikož jsme od Vás ani po opakovaných upozorněních neobdrželi úhradu faktur ani žádnou zpětnou vazbu, jsme nuceni k dnešnímu dni ukončit naši spolupráci a pozastavit správu reklamních kampaní a všech souvisejících služeb. Prosím o úhradu všech neuhrazených faktur nejpozději (dopiš datum). Pokud nebudou do tohoto termínu uhrazeny, budeme nuceni věc předat našemu právnímu zástupci k dalšímu postupu včetně vymáhání pohledávek. V případě jakýchkoli dotazů jsme připraveni je společně vyřešit. S pozdravem, Otas Lucák --5) Interní proces po ukončení spolupráce Pauznout kampaně – Meta Ads, Google Ads, Sklik, případně další platformy. Odebrat přístupy – BM, Google Ads, GA4, Tag Manager, Drive, Slack, Freelo. Zapsat ukončení do Raynetu Informovat celý tým na Slacku → stručné vysvětlení + potvrzení, že spolupráce končí kvůli neplacení. Připravit soubor pro právníka, pokud nebude úhrada: smlouva faktury komunikace --6) Poznámka pro tým Tento SOP je závazný. Cílem je udržet profesionální, konzistentní a spravedlivý přístup ke všem klientům i k našemu týmu. --Pokud chceš, přidám k SOP i: ✔ checklist kroků k ukončení ve Freelo ✔ tagy pro označení klienta v Airtable ✔ stručnou verzi SOP přímo pro Slack jako pinned message Stačí říct.',
53,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'af87dbc6-fda8-4f6e-8572-ec14121185d1',
'11111111-1111-1111-1111-111111111109',
'SOP – Střih podcastových Reels',
'<p><a href="https://podcast.adobe.com/en">https://podcast.adobe.com/en</a><br><a href="https://web.descript.com/">https://web.descript.com/</a><br><a href="https://captions.ai/">https://captions.ai/</a></p>
<p>🤖 Chat GPT Asistenti, které můžeme použít:   </p>
<p>Účel</p>
<p>Vytvářet krátká vertikální videa (Reels / TikTok / Shorts) z podcastů tak, aby:</p>
<ul>
<li>udržela pozornost diváka</li>
<li>měla vysoký watch time</li>
<li>byla srozumitelná i bez zvuku</li>
</ul>
<hr>
<h2>Základní pravidla</h2>
<ul>
<li>Jedno reelsko = <strong>jedna myšlenka</strong></li>
<li>Z 1–2 minut klidně použít <strong>20–30 sekund</strong></li>
<li>Pokud něco nezvyšuje pozornost nebo pochopení → <strong>pryč</strong></li>
<li>Žádné intro, žádné vysvětlování navíc ((Okecávání))</li>
</ul>
<hr>
<h2>1. Výběr pasáže</h2>
<p>Vybírat pouze pasáže, které:</p>
<ul>
<li>dávají smysl <strong>bez kontextu</strong></li>
<li>obsahují jasnou pointu / tvrzení / emoci</li>
<li>mají potenciál zaujmout do <strong>2 sekund (e-commerce tempo)</strong></li>
</ul>
<p>❌ Nevybírat:</p>
<ul>
<li>rozjezd myšlenky</li>
<li>vysvětlování pozadí</li>
<li>dlouhé příběhy bez pointy</li>
</ul>
<p>někdy to nejde, jasně 🙂</p>
<hr>
<h2>2. Střih řeči <strong>(NEJDŮLEŽITĚJŠÍ)</strong></h2>
<h3>Povinně odstranit:</h3>
<ul>
<li>výplňová slova:<ul>
<li>„jakoby“, „prostě“, „vlastně“, „jako“, „víš co“, „že“, apod.</li>
</ul>
</li>
<li>zbytečné okecávání</li>
<li>náběhy vět („já bych chtěl říct…“)</li>
</ul>
<h3>Zkracování:</h3>
<ul>
<li><strong>Nebát se agresivně zkracovat řeč</strong></li>
<li>Pokud zůstane zachovaná myšlenka, je zkrácení vždy správně</li>
</ul>
<h3>Ticho:</h3>
<ul>
<li>žádná hluchá místa</li>
<li>pauzy &gt; <strong>0,3–0,5 s</strong> vždy odstranit</li>
<li>delší pauza pouze pokud je <strong>záměr (hook / emoce)</strong></li>
</ul>
<p>👉 Nesmí vzniknout moment, kdy má divák čas přestat sledovat.</p>
<p>Takhle bych to osekal já… Zbytečně moc navíc slov.<br>Nebát se, vystřihnout některá slova. Udělat to svižné, rychlé…</p>
<p><a href="SOP%20%E2%80%93%20St%C5%99ih%20podcastov%C3%BDch%20Reels/reels_1.mp4">reels_1.mp4</a></p>
<p><a href="SOP%20%E2%80%93%20St%C5%99ih%20podcastov%C3%BDch%20Reels/UGC__influencer.A_pokud_ten_rozdil_neresite_velmi_casto_zbytecne_palite_rozpocet.dave.duc_v_e.mp4">UGC ≠ influencer.A pokud ten rozdíl neřešíte, velmi často zbytečně pálíte rozpočet.@dave.duc v e.mp4</a></p>
<hr>
<h2>3. Rytmus střihu</h2>
<ul>
<li>žádný záběr delší než <strong>3–4 s</strong> bez změny (cut / zoom / text)</li>
<li>pokud mluvčí zpomalí → <strong>střih zrychlit</strong></li>
<li>tempo musí udržovat pozornost</li>
</ul>
<hr>
<h2>4. Jump cuts</h2>
<ul>
<li>povolené a žádoucí</li>
<li><strong>NE</strong>: měnit framing tak, že „poskočí hlava“</li>
<li>pokud nelze framing udržet 100 %, <strong>minimalizovat rozdíl na maximum</strong></li>
<li><strong>ANO</strong>: držet stejnou velikost obličeje a osu očí</li>
</ul>
<hr>
<h2>5. Zoomy &amp; framing</h2>
<h3>Zoomy:</h3>
<ul>
<li>používat jemně</li>
<li>max <strong>1 změna zoomu za 2–3 s</strong></li>
<li>zoom musí podporovat pointu</li>
</ul>
<p>❌ Zakázáno:</p>
<ul>
<li><p>chaotické zoomování</p>
</li>
<li><p>zoomy bez důvodu</p>
</li>
<li><p>nekonzistentní rytmus zoomů</p>
</li>
</ul>
<h2>Tohle je špatný zoom 👉🏼</h2>
<p><img src="SOP%20%E2%80%93%20St%C5%99ih%20podcastov%C3%BDch%20Reels/Snimek_obrazovky_2026-01-27_v_15.01.02.png" alt="Snímek obrazovky 2026-01-27 v 15.01.02.png"></p>
<hr>
<h3>Oči &amp; pozice hlavy:</h3>
<ul>
<li>oči musí být <strong>vždy ve stejné horizontální rovině</strong></li>
<li>doporučeno nastavit <strong>guides / linie</strong> v editačním programu</li>
<li>při jump cutech:<ul>
<li>upravit zoom</li>
<li><strong>NE</strong> posouvat hlavu nahoru/dolů</li>
</ul>
</li>
<li>povolený rozdíl max <strong>±5 %</strong></li>
</ul>
<p><img src="SOP%20%E2%80%93%20St%C5%99ih%20podcastov%C3%BDch%20Reels/1.jpg" alt="1.jpg"></p>
<p><img src="SOP%20%E2%80%93%20St%C5%99ih%20podcastov%C3%BDch%20Reels/Frame_1.png" alt="Frame 1.png"></p>
<p><img src="SOP%20%E2%80%93%20St%C5%99ih%20podcastov%C3%BDch%20Reels/Snimek_obrazovky_2026-01-27_v_15.00.47.png" alt="Snímek obrazovky 2026-01-27 v 15.00.47.png"></p>
<hr>
<h2>6. Titulky (Subtitles) - řeší Týnka momentálně</h2>
<h3>Povinné:</h3>
<ul>
<li>každé reelsko MUSÍ mít titulky</li>
</ul>
<h3>Umístění:</h3>
<ul>
<li>pod hlavou / pod bradou</li>
<li>co nejblíž mluvčímu</li>
<li>nikdy přes obličej nebo oči</li>
</ul>
<h3>Styl:</h3>
<ul>
<li>1–2 řádky</li>
<li>max <strong>5–7 slov na řádek</strong></li>
<li>titulky nejsou doslovný přepis - nechám na Týnce</li>
<li>zvýrazňovat klíčová slova (čísla, emoce, negace)</li>
</ul>
<p>👉 Divák musí vnímat <strong>obličej i titulky zároveň</strong>.</p>
<hr>
<h2>7. Hook &amp; struktura</h2>
<h3>Hook:</h3>
<ul>
<li>musí fungovat <strong>i bez zvuku</strong></li>
<li>žádné intro, žádné „ahoj“</li>
<li>rovnou:<ul>
<li>problém</li>
<li>tvrzení</li>
<li>otázka</li>
</ul>
</li>
</ul>
<h3>Pokročilá technika (občas):</h3>
<ul>
<li>nejsilnější věta z prostředku videa → dát na začátek</li>
<li>lze doplnit:<ul>
<li>sound effect (rise / whoosh)</li>
<li>tvrdý střih</li>
</ul>
</li>
</ul>
<hr>
<h2>8. Loop videa (testovat)</h2>
<ul>
<li>konec bez jasného zakončení</li>
<li>plynulý přechod zpět na začátek</li>
<li>vhodné hlavně pro:<ul>
<li>myšlenky</li>
<li>tipy</li>
<li>kontroverze</li>
</ul>
</li>
</ul>
<hr>
<h2>9. Zvuk</h2>
<ul>
<li><p>audio nesmí být pouze v jednom kanálu (L / R) - Kluci jsou na to experti 😀</p>
</li>
<li><p>hlas má vždy prioritu</p>
</li>
<li><p>hlas musí být:</p>
<ul>
<li>čistý</li>
<li>konzistentní</li>
</ul>
</li>
<li><p>hudba:</p>
<ul>
<li>velmi potichu</li>
<li>pouze pokud podporuje rytmus</li>
</ul>
</li>
<li><p>sound effects:</p>
<ul>
<li>max <strong>1–2 na video</strong></li>
<li>jen na hook / přechod</li>
</ul>
<p>  špatný zvuk - <a href="https://podcast.adobe.com/en">https://podcast.adobe.com/en</a> několikrát mě zachránil</p>
</li>
</ul>
<hr>
<h2>10. Barvy &amp; obraz</h2>
<ul>
<li><p>lehce zvednout expozici (video má „svítit“)</p>
</li>
<li><p>kontrast &gt; saturace</p>
</li>
<li><p>sjednotit white balance</p>
</li>
<li><p>pozor na:</p>
<ul>
<li>přepaly pleti</li>
<li>barevné skoky mezi střihy</li>
</ul>
</li>
<li><p><strong>Curves:</strong> lehké „S“ (doporučeno)</p>
</li>
</ul>
<p><img src="SOP%20%E2%80%93%20St%C5%99ih%20podcastov%C3%BDch%20Reels/Snimek_obrazovky_2026-01-27_v_14.56.22.png" alt="Snímek obrazovky 2026-01-27 v 14.56.22.png"></p>
<hr>
<h2>11. Obsahová kontrola (VOLITELNÉ, DOPORUČENO)</h2>
<p>Pokud si editor není jistý, zda výrazně zkrácené video stále dává smysl:</p>
<ol>
<li>exportovat finální zvuk (MP3)</li>
<li>nahrát do <strong>Descriptu -</strong> <a href="https://web.descript.com/">https://web.descript.com/</a></li>
<li>získat textový přepis</li>
<li>vložit do ChatGPT s dotazem:</li>
</ol>
<blockquote>
<p>„Dává tahle myšlenka obsahově smysl i po výrazném zkrácení?<br>Je sdělení pochopitelné bez kontextu?“</p>
</blockquote>
<p>Pokud <strong>NE</strong> → vrátit se do střihu.</p>
<hr>
<h2>12. Kontrolní checklist (POVINNÉ)</h2>
<p>Před exportem:</p>
<ul>
<li>☐ nulové ticho</li>
<li>☐ oči ve stejné rovině</li>
<li>☐ titulky blízko hlavy</li>
<li>☐ jedna myšlenka</li>
<li>☐ dává smysl bez zvuku</li>
</ul>
<p>Pokud je odpověď <strong>NE</strong> → vrátit do střihu.</p>
<hr>
<h2>Závěrečná kontrolní otázka</h2>
<blockquote>
<p>„Udrželo by to mou pozornost, kdybych to viděl poprvé bez zvuku?“</p>
</blockquote>
',
'https://podcast.adobe.com/en https://web.descript.com/ https://captions.ai/ 🤖 Chat GPT Asistenti, které můžeme použít: Účel Vytvářet krátká vertikální videa (Reels / TikTok / Shorts) z podcastů tak, aby: udržela pozornost diváka měla vysoký watch time byla srozumitelná i bez zvuku --Základní pravidla Jedno reelsko = jedna myšlenka Z 1–2 minut klidně použít 20–30 sekund Pokud něco nezvyšuje pozornost nebo pochopení → pryč Žádné intro, žádné vysvětlování navíc ((Okecávání)) --Výběr pasáže Vybírat pouze pasáže, které: dávají smysl bez kontextu obsahují jasnou pointu / tvrzení / emoci mají potenciál zaujmout do 2 sekund (e-commerce tempo) ❌ Nevybírat: rozjezd myšlenky vysvětlování pozadí dlouhé příběhy bez pointy někdy to nejde, jasně 🙂 --Střih řeči (NEJDŮLEŽITĚJŠÍ) Povinně odstranit: výplňová slova: „jakoby“, „prostě“, „vlastně“, „jako“, „víš co“, „že“, apod. zbytečné okecávání náběhy vět („já bych chtěl říct…“) Zkracování: Nebát se agresivně zkracovat řeč Pokud zůstane zachovaná myšlenka, je zkrácení vždy správně Ticho: žádná hluchá místa pauzy 0,3–0,5 s vždy odstranit delší pauza pouze pokud je záměr (hook / emoce) 👉 Nesmí vzniknout moment, kdy má divák čas přestat sledovat. Takhle bych to osekal já… Zbytečně moc navíc slov. Nebát se, vystřihnout některá slova. Udělat to svižné, rychlé… reels_1.mp4 UGC ≠ influencer.A pokud ten rozdíl neřešíte, velmi často zbytečně pálíte rozpočet.@dave.duc v e.mp4 --Rytmus střihu žádný záběr delší než 3–4 s bez změny (cut / zoom / text) pokud mluvčí zpomalí → střih zrychlit tempo musí udržovat pozornost --Jump cuts povolené a žádoucí NE: měnit framing tak, že „poskočí hlava“ pokud nelze framing udržet 100 %, minimalizovat rozdíl na maximum ANO: držet stejnou velikost obličeje a osu očí --Zoomy & framing Zoomy: používat jemně max 1 změna zoomu za 2–3 s zoom musí podporovat pointu ❌ Zakázáno: chaotické zoomování zoomy bez důvodu nekonzistentní rytmus zoomů Tohle je špatný zoom 👉🏼 !Snímek obrazovky 2026-01-27 v 15.01.02.png --Oči & pozice hlavy: oči musí být vždy ve stejné horizontální rovině doporučeno nastavit guides / linie v editačním programu při jump cutech: upravit zoom NE posouvat hlavu nahoru/dolů povolený rozdíl max ±5 % !1.jpg !Frame 1.png !Snímek obrazovky 2026-01-27 v 15.00.47.png --Titulky (Subtitles) řeší Týnka momentálně Povinné: každé reelsko MUSÍ mít titulky Umístění: pod hlavou / pod bradou co nejblíž mluvčímu nikdy přes obličej nebo oči Styl: 1–2 řádky max 5–7 slov na řádek titulky nejsou doslovný přepis nechám na Týnce zvýrazňovat klíčová slova (čísla, emoce, negace) 👉 Divák musí vnímat obličej i titulky zároveň. --Hook & struktura Hook: musí fungovat i bez zvuku žádné intro, žádné „ahoj“ rovnou: problém tvrzení otázka Pokročilá technika (občas): nejsilnější věta z prostředku videa → dát na začátek lze doplnit: sound effect (rise / whoosh) tvrdý střih --Loop videa (testovat) konec bez jasného zakončení plynulý přechod zpět na začátek vhodné hlavně pro: myšlenky tipy kontroverze --Zvuk audio nesmí být pouze v jednom kanálu (L / R) Kluci jsou na to experti 😀 hlas má vždy prioritu hlas musí být: čistý konzistentní hudba: velmi potichu pouze pokud podporuje rytmus sound effects: max 1–2 na video jen na hook / přechod špatný zvuk https://podcast.adobe.com/en několikrát mě zachránil --Barvy & obraz lehce zvednout expozici (video má „svítit“) kontrast saturace sjednotit white balance pozor na: přepaly pleti barevné skoky mezi střihy Curves: lehké „S“ (doporučeno) !Snímek obrazovky 2026-01-27 v 14.56.22.png --Obsahová kontrola (VOLITELNÉ, DOPORUČENO) Pokud si editor není jistý, zda výrazně zkrácené video stále dává smysl: exportovat finální zvuk (MP3) nahrát do Descriptu https://web.descript.com/ získat textový přepis vložit do ChatGPT s dotazem: „Dává tahle myšlenka obsahově smysl i po výrazném zkrácení? Je sdělení pochopitelné bez kontextu?“ Pokud NE → vrátit se do střihu. --Kontrolní checklist (POVINNÉ) Před exportem: ☐ nulové ticho ☐ oči ve stejné rovině ☐ titulky blízko hlavy ☐ jedna myšlenka ☐ dává smysl bez zvuku Pokud je odpověď NE → vrátit do střihu. --Závěrečná kontrolní otázka „Udrželo by to mou pozornost, kdybych to viděl poprvé bez zvuku?“ >',
54,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'a3ebf0b0-70a6-4acd-b165-8eb3667d0025',
'11111111-1111-1111-1111-111111111106',
'Sales proces náboru nového klienta - od Leadu po podepsání smlouvy',
'<p>Prirmární odpovědnost má Sales manager.</p>
<h3>1. <strong>Příjem poptávky</strong></h3>
<p>A) Klient si sjedná meeting <strong>přes Calendly</strong>, které je napojené na Google Calendar + Raynet.</p>
<p>B) Klient odešle poptávku z Konverzky, propíše se do Raynetu</p>
<p>C) Klient napíše na email <a href="mailto:hello@socials.cz">hello@socials.cz</a></p>
<p>Pozn. nejčastěji se bude jednat o Google Meet, případně o klasický telefonát.</p>
<h3>2. Před callem</h3>
<ul>
<li>Zkontrolu, že jsou v Raynetu doplněné informace o firmě</li>
<li>Projdi si web klienta</li>
<li>Podívej se do <a href="https://www.facebook.com/ads/library/?active_status=active&ad_type=political_and_issue_ads&country=US&is_targeted_country=false&media_type=all">knihovny reklam na FB</a></li>
<li>Podívej se do <a href="https://adstransparency.google.com/">Google Ads transparency</a></li>
<li>Připrav si otázky na úvodní call viz níže.</li>
</ul>
<h3>2. <strong>Sales Call</strong></h3>
<p>Cílem úvodního hovoru je zjistit, zda je naše služba pro klienta vhodná, jaké jsou jeho potřeby a jaký balíček mu můžeme doporučit. Zároveň získáme přehled o jeho aktuální strategii, kapacitě a očekáváních.</p>
<ul>
<li><p>Identifikuj typ projektu:</p>
<ul>
<li>E-commerce</li>
<li>Lead generation</li>
</ul>
</li>
<li><p>Ověř, že klient:</p>
<ul>
<li>Má rozpočet –&gt; Zeptej se, kolik klient investuje do výkonnostní reklamy a klidně mu řekni, že minimum kolik spravujeme je 30 000 Kč / měsíc.</li>
<li>Můžeme klientovi pomoci dosáhnout jeho výsledků (pokud potřebuje 3x tržby se stejným PNO, pravděpodobně to nebude reálné apod.)</li>
</ul>
</li>
<li><p>Doporučené otázky</p>
<ul>
<li><p>Pro Lead generation</p>
<h3>1. <strong>Můžete mi ve zkratce představit vaši firmu a jaké služby/produkty nabízíte?</strong></h3>
<p>  → <em>(Je dobré rovnou navést odpověď na produkty/služby a cílové zákazníky – ne každý to automaticky zmíní.)</em></p>
<hr>
<h3>2. <strong>Jak aktuálně získáváte nové poptávky?</strong></h3>
<p>  → <em>(Doporučuji rovnou dodat: „Z jakých kanálů vám reálně chodí leady?“ – ať ti neříkají „děláme SEO“, ale nechodí z něj nic.)</em></p>
<hr>
<h3>3. <strong>Kolik kvalitních poptávek měsíčně nyní přichází?</strong></h3>
<p>  → <em>(Zvaž doplnit: „Co považujete za kvalitní poptávku?“ – ať si vyjasníte definici.)</em></p>
<hr>
<h3>4. <strong>Kolik z těch poptávek se reálně promění v platící klienty?</strong></h3>
<p>  → <em>(Zjednodušená verze původní otázky – zároveň cílí přímo na konverzi.)</em></p>
<hr>
<h3>5. <strong>Jak vypadá váš ideální zákazník?</strong></h3>
<p>  → <em>(Perfektní otázka – můžeš doplnit: „Máte to někde definované?“, pokud chceš zjistit, jak moc to mají zpracované.)</em></p>
<hr>
<h3>6. <strong>Jaká je přibližná cena za získání jednoho zákazníka (CAC)?</strong></h3>
<p>  → <em>(Super, jen doporučuji formulaci „přibližná“ – méně stresuje klienta, pokud to přesně nesleduje.)</em></p>
<hr>
<h3>7. <strong>Jak zpracováváte nové poptávky? Máte nastavený obchodní proces nebo CRM?</strong></h3>
<p>  → <em>(Tím zjistíš, jestli má kdo řešit nové leady – často úzké hrdlo.)</em></p>
<hr>
<h3>8. <strong>Jaké marketingové aktivity aktuálně běží?</strong></h3>
<p>  → <em>(Doporučuji dodat: „Co reálně běží – ne jen co plánujete :)“ – friendly tón a více pravdy.)</em></p>
<hr>
<h3>9. <strong>Jaký máte měsíční rozpočet na výkonnostní marketing (např. PPC, Meta Ads)?</strong></h3>
<p>  → <em>(Upřesni „výkonnostní“ – nepočítat do toho branding, PR apod.)</em></p>
<hr>
<h3>10. <strong>Kolik nových zakázek byste měsíčně zvládli bez omezení kvality služby?</strong></h3>
<p>  → <em>(Přesnější formulace „kapacity růstu“ – míříš na reálný výkon firmy.)</em></p>
<hr>
<h3>11. <strong>Co je pro vás nejdůležitější – objem poptávek, jejich kvalita nebo předvídatelnost?</strong></h3>
<p>  → <em>(Výborná otázka, doporučuji zachovat beze změny.)</em></p>
</li>
<li><p>Pro Ecommerce</p>
<h3><strong>1. Můžete mi ve zkratce představit váš e-shop? Co prodáváte a komu?</strong></h3>
<p>  (<em>Základní kontext – produkty, zákazníci, kategorie.</em>)</p>
<hr>
<h3><strong>2. Co vás aktuálně nejvíc trápí v oblasti online marketingu?</strong></h3>
<p>  (<em>Zachytíš skutečný pain – např. nízký ROAS, drahé kliky, nízké konverze, nepřesné měření.</em>)</p>
<hr>
<h3><strong>3. Jaké máte aktuálně tržby a kolik objednávek odbavíte měsíčně?</strong></h3>
<p>  (<em>Zorientuješ se ve velikosti a škálovatelnosti e-shopu.</em>)</p>
<hr>
<h3><strong>4. Jaké jsou vaše hlavní marketingové kanály a co vám přináší nejvíc tržeb?</strong></h3>
<p>  (<em>Získáš přehled o strategii a efektivitě jednotlivých kanálů.</em>)</p>
<hr>
<h3><strong>5. Jaké metriky sledujete pro vyhodnocování výkonnostní reklamy?</strong></h3>
<p>  (<em>Zaměřuje se na to, jestli umí číst ROAS, PNO, CAC, CLV nebo jen “objednávky”.</em>)</p>
<hr>
<h3><strong>6. Jaké je vaše očekávání od spolupráce?</strong></h3>
<p>  (<em>Navýšení tržeb, snížení PNO, lepší škálování, nová strategie... – rovnou ladíš na výsledek.</em>)</p>
<hr>
<h3><strong>7. Jaké marketingové rozpočty aktuálně investujete měsíčně?</strong></h3>
<p>  (<em>Zjišťuješ, jestli to odpovídá potenciálu a návratnosti.</em>)</p>
<hr>
<h3><strong>8. Máte aktivní kampaně na Meta Ads a Google Ads? Jaký je aktuální výkon?</strong></h3>
<p>  (<em>Základní přehled – můžeš navázat auditem.</em>)</p>
<hr>
<h3><strong>9. Do čeho dalšího investujete? Influencery, obsah, emailing...?</strong></h3>
<p>  (<em>Odhalíš, jestli mají komplexní strategii, nebo jen výkon.</em>)</p>
<hr>
<h3><strong>10. Sledujete nějakou dlouhodobou strategii / růstový plán?</strong></h3>
<p>  (<em>Získáš kontext – třeba plán expanze, vývoj brandu, nové produkty apod.</em>)</p>
<hr>
<h3><strong>11. Jaké je technické řešení vašeho e-shopu (Shoptet, Shopify, vlastní)?</strong></h3>
<p>  (<em>Důležité pro napojení, přístup k datům, měření a výkonnost.</em>)</p>
<hr>
<h3><strong>12. Máte nastavené měření – GA4, Meta Pixel, CAPI, konverze?</strong></h3>
<p>  (<em>Bez správného měření nemá smysl výkon – ověříš technický základ.</em>)</p>
<hr>
<h3><strong>13. Jaká je vaše kapacita – zvládnete více objednávek, pokud vše bude fungovat?</strong></h3>
<p>  (<em>Ujistíš se, že kampaně nepošlou firmu „do kolen“.</em>)</p>
</li>
</ul>
</li>
<li><p>Zakončení telefonátu</p>
<ul>
<li><p>Varianta A - Klient má aktivní kampaně</p>
<blockquote>
<p>➡️ Za mě je takto všechno, děkuju moc za sdílené informace. Co teď navrhnu jako další krok:</p>
<p>👀 <strong>Podíváme se na vaše stávající kampaně</strong> – Zkontrolujeme jejich strukturu, výkon a prostor pro zlepšení.</p>
<p>🛠️ <strong>Uděláme si malý audit</strong> – Ten nám pomůže přesně navrhnout, jak bychom vám mohli pomoct, co by dávalo největší smysl, a jaké služby by přinesly nejvyšší návratnost.</p>
<p>📩 <strong>Potom vám pošleme návrh spolupráce e-mailem</strong> – Bude obsahovat konkrétní doporučení, rozsah, orientační výsledky a cenu.</p>
<p>📞 <strong>Navazující call je samozřejmě možný</strong>, pokud bude potřeba něco doladit. A jakmile si vše odsouhlasíme, pustíme se do toho!</p>
<p><strong>Máte na mě ještě nějaké dotazy?</strong></p>
</blockquote>
</li>
<li><p>Varianta B - Klient nemá aktivní kampaně</p>
<blockquote>
<p>➡️ Super, díky za informace, mám vše potřebné. Co navrhnu jako další krok:</p>
<p>✅ <strong>Připravíme nabídku</strong> – Přímo na míru vašemu byznysu, cílům a možnostem. Navrhneme ideální strukturu služeb pro generování poptávek s důrazem na návratnost.</p>
<p>📩 <strong>Pošlu vám nabídku e-mailem</strong> – Najdete v ní doporučení kanálů, rozpočet, očekávané výsledky a postup spolupráce.</p>
<p>📞 <strong>Když bude potřeba něco upravit</strong>, domluvíme si krátký follow-up call.</p>
<p><strong>Máte na mě ještě nějaké dotazy?</strong></p>
</blockquote>
</li>
</ul>
</li>
</ul>
<h3>3. <strong>Po callu – kvalifikace klienta</strong></h3>
<p>Zde video k sekci: <a href="https://www.loom.com/share/2c851183f67a4c9e89b4726a9697d17c?sid=d0754629-3412-4f60-acab-46b538015cb2">https://www.loom.com/share/2c851183f67a4c9e89b4726a9697d17c?sid=d0754629-3412-4f60-acab-46b538015cb2</a></p>
<ul>
<li>Doplň informace z callu do poznámky k Leadu v Raynetu</li>
<li>Pokud má klient potenciál, pošli mu <strong>automatizovaný e-mail s žádostí o přístupy</strong> - automatizace v Raynetu</li>
<li>V raynetu převeď Lead na Obchodní případ</li>
<li>Automaticky se vytvoří šablona nabídky</li>
<li>Vytvoří se úkol ve Freelu pro koordinaci auditu s kolegy</li>
</ul>
<p><a href="https://app.freelo.io/tasklist/1334716">https://app.freelo.io/tasklist/1334716</a> </p>
<h3>4. <strong>Audit účtů + příprava nabídky</strong></h3>
<ul>
<li>Po nasdílení přístupů udělej základní audit Meta Ads + zadej audit PPC (pokud se bude u klienta řešit)</li>
<li>Email pro nasdílení přístupů (nech jen relevatní tooly)</li>
</ul>
<aside>
💬

<p>Dobrý den,</p>
<p>Na základě našeho telefonátu Vás prosíme o nasdílení přístupů do níže uvedených marketingových nástrojů. Uděláme audit a připravíme pro vás nabídku na případnou spolupráci.</p>
<ul>
<li><strong>Google Analytics 4</strong> - Přístup na úrovni celého účtu s oprávněním “Čtení” pošlete na e-mail <a href="mailto:analytics@socials.cz">analytics@socials.cz</a></li>
<li><strong>Facebook Business Manager</strong> - Přidejte nás jako partnery (ID našeho účtu: 1196977750459552) s nejnižší úrovní přístupů k těmto položkám: Reklamní účet, Katalog produktů, Meta Pixel (Datový set), FB stránka.</li>
<li><strong>Google Ads</strong> - Zašlete nám ID reklamního účtu. Zašleme žádost o přístup která dorazí na e-mail, na který máte Google Ads účet vedený.</li>
<li><strong>S-klik</strong> - Nasdílejte na e-mail <a href="mailto:mysocials@seznam.cz">mysocials@seznam.cz</a></li>
</ul>
<p>Pokud si nebudete vědět rady, zde naleznete <a href="N%C3%A1vod%20na%20sd%C3%ADlen%C3%AD%20p%C5%99%C3%ADstup%C5%AF%20-%20Socials%2018251ff3df5780089bd8f894ba3fe09f.md">návod</a>. Případně klidně napište a pomůžu :)</p>
</aside>

<h3>5. <strong>Zaslání nabídky</strong></h3>
<ul>
<li>Nabídku vypracuješ v Notion:</li>
<li>Mustr pro zaslání nabídky (pokud se dělal audit)</li>
</ul>
<aside>
💬

<p>Dobrý den,</p>
<p>prošli jsme Vaše výkonnostní kampaně a připravili krátký audit, který Vám pomůže lépe pochopit aktuální stav a potenciální možnosti zlepšení. Na základě auditu jsem pro Vás také připravil nabídku správy kampaní, která obsahuje rozpis našich služeb a cenu.</p>
<p>Odkaz na nabídku a audit naleznete zde: Doplnit nabídku</p>
<p>Pokud budete chtít, můžeme si audit a nabídku projít společně přes Google Meet.</p>
<p>Pokud máte jakékoliv dotazy nebo potřebujete další informace, neváhejte mě kontaktovat.</p>
</aside>

<h3>6. Follow-up</h3>
<ul>
<li>Nastav si připomínku na follow-up (např. 3 dny po odeslání).</li>
</ul>
<h3>7. Argumentace na nejčastější dotazy</h3>
<ol>
<li><p><strong>„Je to pro nás drahé.“</strong></p>
<p> 👉 <em>„Rozumím – ale v auditu jsme jasně ukázali, kde vám aktuálně unikají příležitosti. I malá změna v těchto oblastech může mít výrazný vliv na výkon. Investice se nepočítá jen podle ceny, ale podle toho, co vám uniká, když se nic nezmění.“</em></p>
</li>
<li><p><strong>„Nechceme fixní měsíční poplatek, raději bychom odměnu podle výsledků.“</strong></p>
<p> 👉 <em>„Výsledky závisí na víc faktorech než jen na reklamě – produkt, web, konkurence, ceny… Proto nenastavujeme spolupráci podle výsledků, které nemáme pod plnou kontrolou. Pokud ale máte návrh na kombinovaný model, rádi se na něj podíváme.“</em></p>
</li>
<li><p><strong>„Co když se výsledky nedostaví?“</strong></p>
<p> 👉 <em>„Právě proto vám neslibujeme konkrétní čísla. Místo toho jsme ukázali, co konkrétně nefunguje a kde jsou příležitosti ke zlepšení. Pokud je využijeme, výsledky většinou přicházejí přirozeně – a pokud ne, máte možnost spolupráci rychle ukončit.“</em></p>
</li>
<li><p><strong>„Nemáme teď interně kapacitu se tomu věnovat.“</strong></p>
<p> 👉 <em>„Chápu – a právě proto to dává smysl delegovat. Po úvodním předání informací pracujeme samostatně, posíláme vám reporty a doporučení. Spolupráce vám ušetří čas, ne ho přidělá.“</em></p>
</li>
<li><p><strong>„Chceme si to ještě promyslet / porovnat s dalšími nabídkami.“</strong></p>
<p> 👉 <em>„Úplně v pořádku. Jen doporučuji porovnávat nejen cenu, ale co konkrétně v nabídce najdete. My jsme se zaměřili na reálné problémy, které ovlivňují výkon – ne na sliby. Pokud budete chtít projít rozdíly, rád vám s tím pomůžu.“</em></p>
</li>
<li><p><strong>„Máme špatné zkušenosti s agenturami – slibují hory doly a pak nic.“</strong></p>
<p> 👉 <em>„Právě proto nic neslibujeme. Neříkáme, že uděláme zázraky – místo toho jsme vám konkrétně ukázali, co nefunguje a proč, a navrhli, jak to změnit. To je náš přístup – žádné vzdušné zámky, ale práce s realitou.“</em></p>
</li>
<li><p><strong>„Nechceme být vázaní smlouvou.“</strong></p>
<p> 👉 <em>„Smlouva je jen měsíční, výpověď začíná od 1. dne následujícího měsíce. Je to férový rámec pro obě strany – dává prostor na spolupráci, ale i možnost odejít, pokud to nebude fungovat.“</em></p>
</li>
<li><p><strong>„Můžeme začít jen s něčím menším / testovacím?“</strong></p>
<p> 👉 <em>„Ano – často dává smysl začít omezeně a zaměřit se na konkrétní část, kde má zlepšení největší dopad. Pomůže vám to ověřit, jestli vám náš přístup sedí, než se pustíme do širší spolupráce.“</em></p>
</li>
<li><p><strong>„Nevíme, jestli to bude fungovat v našem segmentu.“</strong></p>
<p> 👉 <em>„I proto jsme udělali audit – abychom neřešili domněnky, ale realitu. Nesázíme na obecné strategie – vycházíme z dat a specifik vašeho byznysu. Pokud by nedávalo smysl něco z návrhu realizovat, otevřeně to řekneme.“</em></p>
</li>
<li><p><strong>„Máme vlastní marketingový tým – nevíme, jestli to není zbytečné.“</strong></p>
<p>👉 <em>„To je v pořádku – často fungujeme jako doplněk interního týmu, přinášíme nový pohled a know-how v oblastech, kde interní tým nemá kapacitu nebo specializaci. Není to buď–anebo, ale spíš posílení.“</em></p>
</li>
</ol>
<h3>8. Stav výhra</h3>
<ul>
<li>Posíláš klientovi tento email, do kopie dáváš <a href="mailto:danny@socials.cz">danny@socials.cz</a> a <a href="mailto:otas@socials.cz">otas@socials.cz</a></li>
</ul>
<p>Dobrý den,</p>
<p>děkujeme za důvěru a těšíme se na spolupráci! ☺️ Zde jsou následující kroky, které nás čekají:</p>
<p>1️⃣ <strong>Formulář pro přípravu projektu a smlouvy</strong> – Pokud jste tak ještě neučinili, tak Vás prosím o vyplnění <a href="https://kr3cjcjdmo4.typeform.com/to/nfI026GF">onboarding formuláře</a>. Připravíme dle něj projekt a zašleme k podpisu smlouvu o propagaci a GDPR. </p>
<p>2️⃣ <strong>Projekt ve Freelu</strong> – Vytvoříme pro vás projekt v nástroji na projektové řízení - Freelo - a přidáme přístupy na e-maily, které jste uvedli ve formuláři.</p>
<p>3️⃣ <strong>Komunikace přes Freelo</strong> – Veškerá komunikace probíhá ve Freelu, abychom měli všechny informace přehledně na jednom místě. Doporučujeme si stáhnout mobilní aplikaci: 👉 <a href="https://apps.apple.com/cz/app/freelo/id1229578306">Freelo pro iOS</a> | <a href="https://play.google.com/store/apps/details?id=cz.freelo">Freelo pro Android</a></p>
<p>4️⃣ <strong>Projektový manažer</strong> – Ve Freelu vás brzy osloví váš projektový manažer, který doladí přístupy a domluví úvodní telefonát. </p>
<p>Naší prioritou jsou skvělé výsledky a vaše spokojenost! Chceme, aby naše spolupráce přinášela co nejlepší výsledky a byla pro vás maximálně přínosná. Pokud kdykoliv ucítíte, že něco můžeme zlepšit, neváhejte nám to říct.</p>
<p>Dle domluvy počítáme s tím že spolupráce začíná od xxxxxxxx</p>
<p>Těším se na spolupráci! 😊</p>
<ul>
<li>V Raynetu vyplníš datum začátku spolupráce (volitelná pole)</li>
<li>Zkontroluješ že jsou správně vyplněné produkty v OP</li>
<li>Doplníš kolegy, kteří projekt řeší</li>
<li>Doplníš odměny, které kolegové za projekt mají</li>
<li>Změníš stav na “Výhra”</li>
</ul>
<p>viz SOP: </p>
<p><a href="Zalo%C5%BEen%C3%AD%20nov%C3%A9ho%20projektu%20(onboarding)%201ff51ff3df5780d3834adb6da768afad.md">Založení nového projektu (onboarding)</a></p>
',
'Prirmární odpovědnost má Sales manager. Příjem poptávky A) Klient si sjedná meeting přes Calendly, které je napojené na Google Calendar + Raynet. B) Klient odešle poptávku z Konverzky, propíše se do Raynetu C) Klient napíše na email hello@socials.cz Pozn. nejčastěji se bude jednat o Google Meet, případně o klasický telefonát. Před callem Zkontrolu, že jsou v Raynetu doplněné informace o firmě Projdi si web klienta Podívej se do knihovny reklam na FB Podívej se do Google Ads transparency Připrav si otázky na úvodní call viz níže. Sales Call Cílem úvodního hovoru je zjistit, zda je naše služba pro klienta vhodná, jaké jsou jeho potřeby a jaký balíček mu můžeme doporučit. Zároveň získáme přehled o jeho aktuální strategii, kapacitě a očekáváních. Identifikuj typ projektu: E-commerce Lead generation Ověř, že klient: Má rozpočet –Zeptej se, kolik klient investuje do výkonnostní reklamy a klidně mu řekni, že minimum kolik spravujeme je 30 000 Kč / měsíc. Můžeme klientovi pomoci dosáhnout jeho výsledků (pokud potřebuje 3x tržby se stejným PNO, pravděpodobně to nebude reálné apod.) Doporučené otázky Pro Lead generation Můžete mi ve zkratce představit vaši firmu a jaké služby/produkty nabízíte? → (Je dobré rovnou navést odpověď na produkty/služby a cílové zákazníky – ne každý to automaticky zmíní.) --Jak aktuálně získáváte nové poptávky? → (Doporučuji rovnou dodat: „Z jakých kanálů vám reálně chodí leady?“ – ať ti neříkají „děláme SEO“, ale nechodí z něj nic.) --Kolik kvalitních poptávek měsíčně nyní přichází? → (Zvaž doplnit: „Co považujete za kvalitní poptávku?“ – ať si vyjasníte definici.) --Kolik z těch poptávek se reálně promění v platící klienty? → (Zjednodušená verze původní otázky – zároveň cílí přímo na konverzi.) --Jak vypadá váš ideální zákazník? → (Perfektní otázka – můžeš doplnit: „Máte to někde definované?“, pokud chceš zjistit, jak moc to mají zpracované.) --Jaká je přibližná cena za získání jednoho zákazníka (CAC)? → (Super, jen doporučuji formulaci „přibližná“ – méně stresuje klienta, pokud to přesně nesleduje.) --Jak zpracováváte nové poptávky? Máte nastavený obchodní proces nebo CRM? → (Tím zjistíš, jestli má kdo řešit nové leady – často úzké hrdlo.) --Jaké marketingové aktivity aktuálně běží? → (Doporučuji dodat: „Co reálně běží – ne jen co plánujete :)“ – friendly tón a více pravdy.) --Jaký máte měsíční rozpočet na výkonnostní marketing (např. PPC, Meta Ads)? → (Upřesni „výkonnostní“ – nepočítat do toho branding, PR apod.) --Kolik nových zakázek byste měsíčně zvládli bez omezení kvality služby? → (Přesnější formulace „kapacity růstu“ – míříš na reálný výkon firmy.) --Co je pro vás nejdůležitější – objem poptávek, jejich kvalita nebo předvídatelnost? → (Výborná otázka, doporučuji zachovat beze změny.) Pro Ecommerce Můžete mi ve zkratce představit váš e-shop? Co prodáváte a komu? (Základní kontext – produkty, zákazníci, kategorie.) --Co vás aktuálně nejvíc trápí v oblasti online marketingu? (Zachytíš skutečný pain – např. nízký ROAS, drahé kliky, nízké konverze, nepřesné měření.) --Jaké máte aktuálně tržby a kolik objednávek odbavíte měsíčně? (Zorientuješ se ve velikosti a škálovatelnosti e-shopu.) --Jaké jsou vaše hlavní marketingové kanály a co vám přináší nejvíc tržeb? (Získáš přehled o strategii a efektivitě jednotlivých kanálů.) --Jaké metriky sledujete pro vyhodnocování výkonnostní reklamy? (Zaměřuje se na to, jestli umí číst ROAS, PNO, CAC, CLV nebo jen “objednávky”.) --Jaké je vaše očekávání od spolupráce? (Navýšení tržeb, snížení PNO, lepší škálování, nová strategie... – rovnou ladíš na výsledek.) --Jaké marketingové rozpočty aktuálně investujete měsíčně? (Zjišťuješ, jestli to odpovídá potenciálu a návratnosti.) --Máte aktivní kampaně na Meta Ads a Google Ads? Jaký je aktuální výkon? (Základní přehled – můžeš navázat auditem.) --Do čeho dalšího investujete? Influencery, obsah, emailing...? (Odhalíš, jestli mají komplexní strategii, nebo jen výkon.) --Sledujete nějakou dlouhodobou strategii / růstový plán? (Získáš kontext – třeba plán expanze, vývoj brandu, nové produkty apod.) --Jaké je technické řešení vašeho e-shopu (Shoptet, Shopify, vlastní)? (Důležité pro napojení, přístup k datům, měření a výkonnost.) --Máte nastavené měření – GA4, Meta Pixel, CAPI, konverze? (Bez správného měření nemá smysl výkon – ověříš technický základ.) --Jaká je vaše kapacita – zvládnete více objednávek, pokud vše bude fungovat? (Ujistíš se, že kampaně nepošlou firmu „do kolen“.) Zakončení telefonátu Varianta A Klient má aktivní kampaně ➡️ Za mě je takto všechno, děkuju moc za sdílené informace. Co teď navrhnu jako další krok: 👀 Podíváme se na vaše stávající kampaně – Zkontrolujeme jejich strukturu, výkon a prostor pro zlepšení. 🛠️ Uděláme si malý audit – Ten nám pomůže přesně navrhnout, jak bychom vám mohli pomoct, co by dávalo největší smysl, a jaké služby by přinesly nejvyšší návratnost. 📩 Potom vám pošleme návrh spolupráce e-mailem – Bude obsahovat konkrétní doporučení, rozsah, orientační výsledky a cenu',
55,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'ac3f3907-9b96-4dfa-8d1a-f66af30c68a8',
'11111111-1111-1111-1111-111111111107',
'Shoptet pluginy, které by měli klienti využívat',
'',
'',
56,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'030e0a92-4d8b-4d14-8c31-7f77b8537931',
'11111111-1111-1111-1111-111111111112',
'Služby Socials - Jak je prezentujeme klientům',
'<h3>📢 Socials Boost - Správa Meta Ads</h3>
<h3><strong>Co získáte v rámci služby Socials Boost?</strong></h3>
<ul>
<li><strong>Více zakázek a vyšší zisk</strong> – reklamy nastavíme tak, aby vám přinášely zákazníky, kteří nakupují.</li>
<li><strong>Méně starostí, více času na podnikání</strong> – postaráme se o celou správu výkonnostní reklamy, abyste se mohli věnovat růstu firmy.</li>
<li><strong>Partnera, který řeší výkon, ne jen reklamy</strong> – přemýšlíme nad vaším byznysem, ne jen nad reklamními účty.</li>
<li><strong>Kompletní správu Meta Ads</strong> - Od nastavení účtů po průběžnou optimalizaci</li>
</ul>
<p>📌 Detailní rozpis naší služby si můžete přečíst níže (Obsah rozbalíte kliknutím na trojúhelník před textem).</p>
<h3>⚙️ Úvodní nastavení projektu zahrnuje</h3>
<h3><strong>1) 📢 Nastavení Meta Business Suite</strong></h3>
<ul>
<li><strong>Meta Pixel</strong>: Kontrola a nastavení pro přesné měření klíčových událostí na webu, případně implementace Conversion API (CAPI).</li>
<li><strong>Katalog produktů</strong>: Kontrola propojení a konfigurace katalogu produktů pro dynamické reklamy (DPA).</li>
<li><strong>Reklamní účet</strong>: Ověření správnosti nastavení reklamního účtu, včetně platebních údajů a propojení s dalšími nástroji.</li>
<li><strong>Meta Business Suite</strong>: Detailní kontrola propojení všech nástrojů (reklamní účet, pixel, katalog, stránky) v rámci Business Suite.</li>
<li><strong>Struktura kampaní</strong>: Vytvoření základní struktury kampaní zaměřených na akvizici nových zákazníků a remarketing.</li>
<li><strong>Textace reklam</strong>: Tvorba poutavých textů přizpůsobených cílové skupině a obchodním cílům.</li>
</ul>
<h3><strong>2) 💹 Kontrola nastavení analytického měření</strong></h3>
<ul>
<li><strong>Účet a sledování</strong>: Kontrola a optimalizace měření klíčových událostí (nákupy, přidání do košíku, registrace) prostřednictvím modulů v Shoptetu, Upgates nebo Shopify.</li>
</ul>
<h3><strong>3) 📊 Tvorba dashboardu výsledků v Looker Studio</strong></h3>
<ul>
<li><strong>Reportovací šablona</strong>: Vytvoření přehledné šablony pro sledování výkonu kampaní.</li>
<li><strong>Propojení dat</strong>: Napojení Looker Studio na Google Ads, Meta Ads a Google Analytics.</li>
<li><strong>Vizualizace metrik</strong>: Přehledné zobrazení klíčových metrik, jako je CPC, CTR, ROAS, konverze, pro snadné vyhodnocení kampaní.</li>
<li><strong>Automatizace dat</strong>: Nastavení automatické aktualizace a sdílení reportů pro přístup 24/7.</li>
</ul>
<h3><strong>4) 🎯 Vylepšení nabídky</strong></h3>
<p>Aby reklamy přinášely maximální výsledky, nestačí jen technická optimalizace kampaní – klíčová je také atraktivita samotné nabídky. Proto se podíváme na váš web, produkty nebo služby a navrhneme zlepšení, která pomohou přesvědčit více zákazníků k nákupu či poptávce.</p>
<ul>
<li><strong>Návrh produktových balíčků (bundles)</strong> – kombinace produktů, které zvýší hodnotu objednávky a motivují zákazníky ke koupi.</li>
<li><strong>Doporučení slevových a akčních nabídek</strong> – strategické slevy, dárky k nákupu nebo limitované akce, které podpoří rychlejší rozhodnutí zákazníků.</li>
<li><strong>Zvýraznění unikátní hodnoty nabídky</strong> – jasně komunikujeme, proč si zákazník má vybrat právě vás (doprava zdarma, garance spokojenosti, prémiová kvalita apod.). Přizpůsobíme hlavní sdělení tak, aby oslovilo správnou cílovou skupinu a odlišilo vás od konkurence.</li>
<li><strong>Kontrola webu</strong> – identifikujeme bariéry v nákupním procesu (např. složitý checkout, nejasné informace) a doporučíme úpravy pro vyšší míru dokončení nákupů.</li>
</ul>
<h3><strong>📈</strong> Správa kampaní zahrnuje</h3>
<h3><strong>1) 📢 Správa Meta Ads</strong></h3>
<p>Meta Ads je klíčová platforma pro zvyšování povědomí o značce a získávání zákazníků na sociálních sítích. V rámci správy pro vás zajistíme:</p>
<ul>
<li><strong>Analýza výkonu:</strong> Pravidelně sledujeme výsledky kampaní a identifikujeme, které reklamy, sestavy nebo kampaně neplní cíle – ty pak upravujeme nebo vypínáme.</li>
<li><strong>Tvorba nových kampaní a reklam:</strong> Vytváříme nové kampaně, sestavy a reklamy na základě analýzy dat a aktuálních potřeb e-shopu.</li>
<li><strong>Škálování úspěšných kampaní:</strong> Kampaně, které přinášejí dobré výsledky, postupně navyšujeme, abychom maximalizovali jejich přínos.</li>
<li><strong>Spolupráce s grafiky:</strong> Pokud jsou potřeba nové vizuály, připravíme zadání pro grafiky nebo editory.</li>
<li><strong>Monitoring měření (Pixel/CAPI):</strong> Průběžně kontrolujeme, zda Pixel nebo Conversion API správně měří klíčové události na vašem webu.</li>
</ul>
<h3><strong>2) 💬 Reporting a komunikace</strong></h3>
<p>Transparentní a pravidelná komunikace je klíčem k úspěšné správě kampaní. Informujeme vás o výkonnosti kampaní, provedených změnách a plánovaných krocích prostřednictvím pravidelných reportů v dohodnuté formě.</p>
<ul>
<li><strong>Video / textový report:</strong> Každý měsíc připravíme video nebo text s přehledem fungování kampaní.</li>
<li><strong>Looker Studio report:</strong> Nepřetržitý přístup (24/7) k přehlednému reportu, kde můžete sledovat klíčové metriky kampaní.</li>
<li><strong>Pravidelné konzultace:</strong> Pokud je potřeba, nabízíme strategické hovory, kde s vámi diskutujeme vývoj kampaní a jejich další směřování.</li>
</ul>
<h2><strong>📦 Úrovně Socials Boost dle velikosti rozpočtu</strong></h2>
<p>Naše služba je rozdělena do balíčků dle výše spravovaného reklamního rozpočtu (spendu). Čím vyšší rozpočet na kampaně, tím rozsáhlejší správa, častější optimalizace a strategické škálování, aby bylo dosaženo maximálních obchodních výsledků.</p>
<p>Pokud se váš reklamní rozpočet v budoucnu zvýší, přizpůsobíme správu a doporučíme přechod na vyšší balíček, aby kampaně stále fungovaly co nejlépe.</p>
<p>🔹 <strong>Transparentní pricing</strong> – vždy víte, kolik za naše služby zaplatíte.</p>
<table>
<thead>
<tr>
<th><strong>📢 Socials Boost</strong></th>
<th><strong>🚀 GROWTH</strong></th>
<th><strong>💪 PRO</strong></th>
<th><strong>🏆 ELITE</strong></th>
</tr>
</thead>
<tbody><tr>
<td>Rozpočet (reklamní kredit)</td>
<td>do 400 000 Kč</td>
<td>400 000 - 800 000 Kč</td>
<td>nad 800 000 Kč</td>
</tr>
<tr>
<td>Platformy</td>
<td>Meta Ads (Facebook, Instagram, Messenger)</td>
<td>Meta Ads (Facebook, Instagram, Messenger)</td>
<td>Meta Ads (Facebook, Instagram, Messenger)</td>
</tr>
<tr>
<td>Základní setup:</td>
<td></td>
<td></td>
<td></td>
</tr>
</tbody></table>
<ul>
<li>Kontrola analytického měření</li>
<li>Napojení dat do Looker Studio</li>
<li>Optimalizace stávajících kampaní</li>
<li>Vytvoření nové struktury kampaní</li>
<li>Tvorba textů do reklam | Ano | Ano | Ano |<br>| Strategické vylepšování atraktivity vaší nabídky | Ano | Ano | Ano |<br>| Zadávání reklamních kreativ | Ano | Ano | Ano |<br>| Tvorba nových reklam | 1-2x týdně | 2-3x týdně | 2-3x týdně |<br>| Denní kontrola kampaní | Ano | Ano | Ano |<br>| Optimalizace kampaní pro zaručení maximální efektivity využití rozpočtu | 1–2x týdně | 2–3x týdně | 3–4x týdně |<br>| Psaní nových textů do reklam | Ano | Ano | Ano |<br>| Komunikace přes Freelo | Ano | Ano | Ano |<br>| 24/7 Looker studio report | Ano | Ano | Ano |<br>| Měsíční reporting | Video / text / telefonát (dle domluvy) | Video / text / telefonát (dle domluvy) | Video / text / telefonát (dle domluvy) |</li>
</ul>
<h3>📈 PPC Boost - Správa Google Ads a S-kliku</h3>
<h3><strong>Co získáte v rámci služby PPC Boost?</strong></h3>
<ul>
<li><strong>Více zakázek a vyšší zisk</strong> – reklamy nastavíme tak, aby vám přinášely zákazníky, kteří nakupují.</li>
<li><strong>Silnější nabídku, která prodává</strong> – pomůžeme vám vytvořit akce, balíčky a strategii, která osloví více potenciálních zákazníků.</li>
<li><strong>Méně starostí, více času na podnikání</strong> – postaráme se o celou správu výkonnostní reklamy, abyste se mohli věnovat růstu firmy.</li>
<li><strong>Partnera, který řeší výkon, ne jen reklamy</strong> – přemýšlíme nad vaším byznysem, ne jen nad reklamními účty.</li>
<li><strong>Kompletní správu Google Ads i S-kliku</strong> - Od nastavení účtů po průběžnou optimalizaci</li>
</ul>
<p>📌 Detailní rozpis naší služby si můžete přečíst níže (Obsah rozbalíte kliknutím na trojúhelník před textem).</p>
<h3>⚙️ Úvodní nastavení projektu zahrnuje</h3>
<h3><strong>1) 📈 Nastavení Google Ads a S-kliku</strong></h3>
<ul>
<li><strong>Reklamní účet</strong>: Kontrola a optimalizace nastavení reklamních účtů, včetně platebních údajů.</li>
<li><strong>Google Merchant Center</strong>: Kontrola propojení účtu a synchronizace produktového feedu.</li>
<li><strong>Produktový feed</strong>: Analýza a úprava feedu prostřednictvím nástroje Mergado (pokud bude potřeba).</li>
<li><strong>Struktura kampaní</strong>: Návrh a vytvoření struktury kampaní (vyhledávací, display, shopping, remarketing).</li>
<li><strong>Sledování konverzí</strong>: Nastavení sledování konverzí prostřednictvím předpřipravených modulů v Shoptetu.</li>
<li><strong>Propojení nástrojů</strong>: Synchronizace s Google Analytics a dalšími relevantními nástroji.</li>
<li><strong>Cílení</strong>: Optimalizace cílení podle lokality, demografie a zájmů.</li>
</ul>
<h3><strong>2) 💹 Kontrola nastavení analytického měření</strong></h3>
<ul>
<li><strong>Účet a sledování</strong>: Kontrola a optimalizace měření klíčových událostí (nákupy, přidání do košíku, registrace) prostřednictvím modulů v Shoptetu, Upgates nebo Shopify.</li>
<li><strong>Propojení s nástroji</strong>: Integrace GA4 s Google Ads, Looker Studio a dalšími systémy pro komplexní analýzu dat.</li>
</ul>
<h3><strong>3) 📊 Tvorba dashboardu výsledků v Looker Studio</strong></h3>
<ul>
<li><strong>Reportovací šablona</strong>: Vytvoření přehledné šablony pro sledování výkonu kampaní.</li>
<li><strong>Propojení dat</strong>: Napojení Looker Studio na Google Ads, Meta Ads a Google Analytics.</li>
<li><strong>Vizualizace metrik</strong>: Přehledné zobrazení klíčových metrik, jako je CPC, CTR, ROAS, konverze, pro snadné vyhodnocení kampaní.</li>
<li><strong>Automatizace dat</strong>: Nastavení automatické aktualizace a sdílení reportů pro přístup 24/7.</li>
</ul>
<h3><strong>📈</strong> Správa kampaní zahrnuje</h3>
<h3><strong>1) 💻 Správa Google Ads</strong></h3>
<p>Google Ads je nezbytný nástroj pro oslovování zákazníků, kteří aktivně hledají vaše produkty nebo služby. Zaměřujeme se na různé typy kampaní, abychom maximalizovali jejich dosah a výkon:</p>
<ul>
<li><strong>Google Shopping kampaně:</strong> Propagujeme vaše produkty pomocí Shopping kampaní, které oslovují zákazníky s vysokým potenciálem nákupu.</li>
<li><strong>DSA kampaně (Dynamic Search Ads):</strong> Dynamické reklamy cílí na relevantní vyhledávací dotazy, čímž zajišťují široký dosah a efektivitu.</li>
<li><strong>Performance Max kampaně (PMax):</strong> Optimalizujeme kampaně, které kombinují různé reklamní formáty a oslovují zákazníky napříč celým Google ekosystémem (vyhledávání, obsahová síť, YouTube a další).</li>
<li><strong>Kampaně ve vyhledávání:</strong> Spravujeme kampaně zaměřené na konkrétní klíčová slova, aby vaše reklamy byly na předních pozicích ve výsledcích vyhledávání.</li>
<li><strong>Display kampaně:</strong> Využíváme vizuální reklamy v obsahové síti, které budují povědomí o značce a pomáhají přilákat nové zákazníky.</li>
<li><strong>Remarketing:</strong> Znovu oslovujeme návštěvníky vašeho e-shopu pomocí personalizovaných reklam, které je motivují k dokončení nákupu.</li>
<li><strong>Úprava produktového feedu:</strong> Optimalizujeme váš produktový feed pomocí nástroje Mergado, aby byl vhodný pro Shopping a PMax kampaně a splňoval požadavky Google Merchant Center.</li>
<li><strong>Sledování konverzí:</strong> Nastavujeme a průběžně kontrolujeme měření konverzí, abychom zajistili přesné vyhodnocení výkonu kampaní.</li>
</ul>
<h3><strong>3) 🌐 Správa S-kliku</strong></h3>
<p>Sklik doplňuje Google Ads a pomáhá oslovit starší publikum, které využívá weby Seznamu.</p>
<ul>
<li><strong>Kampaně ve vyhledávání:</strong> Optimalizujeme kampaně zaměřené na vyhledávání relevantních klíčových slov, aby vaše reklamy oslovily ty správné zákazníky.</li>
<li><strong>Obsahová síť:</strong> Nastavujeme vizuální kampaně, které budují povědomí o značce a podporují remarketing.</li>
<li><strong>Remarketing:</strong> Oslovujeme uživatele, kteří již navštívili váš e-shop, a motivujeme je k dokončení nákupu.</li>
<li><strong>Správa klíčových slov:</strong> Přizpůsobujeme klíčová slova českému publiku a optimalizujeme je na základě výkonu.</li>
<li><strong>Optimalizace kampaní:</strong> Průběžně sledujeme výkon jednotlivých reklam, přizpůsobujeme rozpočty a testujeme nové strategie.</li>
</ul>
<h3><strong>4) 💬 Reporting a komunikace</strong></h3>
<p>Transparentní a pravidelná komunikace je klíčem k úspěšné správě kampaní. Informujeme vás o výkonnosti kampaní, provedených změnách a plánovaných krocích prostřednictvím pravidelných reportů v dohodnuté formě.</p>
<ul>
<li><strong>Video / textový report:</strong> Každý měsíc připravíme souhrn fungování kampaní formou videa nebo textu.</li>
<li><strong>Looker Studio report:</strong> Nepřetržitý přístup (24/7) k přehlednému reportu, kde můžete sledovat klíčové metriky kampaní.</li>
<li><strong>Pravidelné konzultace:</strong> Pokud je potřeba, nabízíme strategické hovory, kde s vámi diskutujeme vývoj kampaní a jejich další směřování.</li>
</ul>
<h2><strong>📦 Úrovně PPC Boost dle velikosti rozpočtu</strong></h2>
<p>Naše služba je rozdělena do balíčků dle výše spravovaného reklamního rozpočtu (spendu). Čím vyšší rozpočet na kampaně, tím rozsáhlejší správa, častější optimalizace a strategické škálování, aby bylo dosaženo maximálních obchodních výsledků.</p>
<p>Pokud se váš reklamní rozpočet v budoucnu zvýší, přizpůsobíme správu a doporučíme přechod na vyšší balíček, aby kampaně stále fungovaly co nejlépe.</p>
<table>
<thead>
<tr>
<th><strong>📈 PPC Boost</strong></th>
<th><strong>🚀 GROWTH</strong></th>
<th><strong>💪 PRO</strong></th>
<th><strong>🏆 ELITE</strong></th>
</tr>
</thead>
<tbody><tr>
<td>Rozpočet (reklamní kredit)</td>
<td>do 400 000 Kč</td>
<td>400 000 – 800 000 Kč</td>
<td>nad 800 000 Kč</td>
</tr>
<tr>
<td>Platformy</td>
<td>Google Ads, Sklik</td>
<td>Google Ads, Sklik</td>
<td>Google Ads, Sklik</td>
</tr>
<tr>
<td>Základní setup:</td>
<td></td>
<td></td>
<td></td>
</tr>
</tbody></table>
<ul>
<li>Kontrola analytického měření</li>
<li>Napojení dat do Looker Studio</li>
<li>Optimalizace stávajících kampaní</li>
<li>Vytvoření nové struktury kampaní</li>
<li>Tvorba textů do reklam | Ano | Ano | Ano |<br>| Denní kontrola kampaní | Ano | Ano | Ano |<br>| Optimalizace kampaní | 1–2x týdně | 2–3x týdně | 3–4x týdně |<br>| Tvorba nových reklam | Ano | Ano | Ano |<br>| Zadávání reklamních kreativ | Ano | Ano | Ano |<br>| Psaní nových textů do reklam | Ano | Ano | Ano |<br>| Úprava XML feedů přes Mergado | Ano | Ano | Ano |<br>| Strategické vylepšování atraktivity vaší nabídky | Ano | Ano | Ano |<br>| Komunikace přes Freelo (reakční doba do 48h) | Ano | Ano | Ano |<br>| 24/7 Looker studio report | Ano | Ano | Ano |<br>| Měsíční reporting | Video / text / telefonát | Video / text / telefonát | Video / text / telefonát |</li>
</ul>
<h3>🎨 Creative Boost - Příprava reklamních kreativ</h3>
<p>Creative Boost je systém, jak váš produkt nebo službu prodat pomocí strategické výkonnostní kreativy.</p>
<p>Neděláme jen hezké bannery a videa. Jdeme po tom, co přesvědčí zákazníka, aby kliknul, pochopil a nakoupil:</p>
<ul>
<li>hledáme správné úhly komunikace (problém → řešení, emoce, racionalita, USP),</li>
<li>navrhujeme jasné prodejní texty, které umí vysvětlit hodnotu v pár vteřinách,</li>
<li>tvoříme výkonnostní bannery a videa tak, aby dávala smysl z pohledu algoritmu,</li>
<li>připravujeme více konceptů a hooků, které se dají reálně testovat a škálovat.</li>
</ul>
<p>Nemusíte řešit, jak produkt komunikovat, co napsat na banner nebo do videa.</p>
<p>Vy dodáte pouze cíle, produkt a základní inputy. My dodáme prodejní myšlení, koncept a hotové výstupy – zkrátka naprostý základ úspěšných Meta Ads a výkonnostní reklamy obecně.</p>
<hr>
<h3>Jak funguje systém kreditů</h3>
<p>Aby byl systém co nejflexibilnější a zároveň přehledný, oceňujeme práci pomocí <strong>kreditů</strong>:</p>
<ul>
<li><strong>1 kredit = 400 Kč (bez DPH)</strong></li>
<li>Každý typ výstupu (bannery, videa, úpravy, překlady) má <strong>předem danou kreditovou hodnotu</strong>.</li>
<li><strong>Na začátku měsíce se domluvíme na orientačním nebo maximálním počtu kreditů</strong>, podle plánované práce.</li>
<li><strong>Na konci měsíce vám vyfakturujeme reálně vyčerpané kredity.</strong><ul>
<li>Pokud se např. domluvíme na 40–60 kreditech a skutečně využijete 47, fakturujeme <strong>47 kreditů</strong>.</li>
</ul>
</li>
</ul>
<p>Kredity tak fungují jako <strong>flexibilní rozpočet na kreativní výstupy</strong>, který se přizpůsobuje tomu, co v daný moment nejvíce pomáhá výkonu kampaní (bannery, videa, úpravy, nové koncepty).</p>
<h3>Hodnota jednotlivých výstupů</h3>
<h3>👉 Bannery</h3>
<ul>
<li><p><strong>Rámeček pro katalogové Meta Ads kampaně:</strong> 1 kredit</p>
</li>
<li><p><strong>Meta Ads bannery ve 2 rozměrech (1080 × 1080 a 1080 × 1920):</strong> 4 kredity / pack</p>
</li>
<li><p><strong>Překlad Meta Ads bannerů do jiného jazyka:</strong> 1 kredit</p>
</li>
<li><p><strong>Set PPC bannerů (6–10 rozměrů):</strong> 1 kredit / rozměr</p>
</li>
<li><p><strong>Překlad PPC banneru (1 rozměr):</strong> 0,5 kreditu</p>
</li>
<li><p><strong>Vytvoření produktové fotky přes AI:</strong> 2 kredity</p>
</li>
<li><p><strong>Úprava již vytvořených Meta Ads bannerů</strong></p>
<p>  (např. jiný text, přelepka, výměna fotky) ve 2 rozměrech (1080 × 1080 a 1080 × 1920): 1 kredit</p>
</li>
<li><p><strong>Příprava bannerů na homepage webu nebo do newsletteru</strong></p>
<p>  (z již vytvořené kreativy pro naše kampaně): 2 kredity</p>
</li>
</ul>
<blockquote>
<p>Revize bannerů</p>
<ul>
<li>Každý dodaný <strong>pack bannerů</strong> obsahuje <strong>1 revizní kolo zdarma</strong>.</li>
<li><strong>Každé další revizní kolo:</strong> 1 kredit / revize.</li>
</ul>
</blockquote>
<hr>
<h3>👉 Videa (výkonnostní krátká videa pro Reels / Stories / Shorts)</h3>
<p>Každá objednávka videa = <strong>1 koncept + 3 různé hooky = 3 finální videa</strong> připravená do kampaní.</p>
<p>Každý hook exportujeme jako samostatné video, takže můžete snadno A/B testovat výkon.</p>
<hr>
<h3>🎥 Výkonnostní video – Standard</h3>
<p><em>(záběry klienta + AI hooky, bez rozsáhlých AI b-rollů)</em></p>
<p><strong>Co dostanete:</strong></p>
<ul>
<li><p>1 výkonnostní <strong>koncept videa</strong></p>
<p>  (typicky struktura: hook → problém → řešení → CTA)</p>
</li>
<li><p><strong>3 různé hooky</strong> = <strong>3 finální videa</strong></p>
<p>  (3 verze začátku videa, každá jako samostatný soubor)</p>
</li>
<li><p>AI voiceover + AI titulky</p>
</li>
<li><p>Práce primárně s vašimi záběry</p>
</li>
</ul>
<p><strong>Kreditová hodnota (za celý pack 3 videí):</strong></p>
<ul>
<li><p><strong>Výkonnostní video – Standard (1 koncept / 3 videa): 12 kreditů</strong></p>
<p>  (≈ 4 800 Kč bez DPH)</p>
</li>
</ul>
<hr>
<h3>🎥 Výkonnostní video – AI b-roll</h3>
<p><em>(záběry klienta + rozšířené AI scény a AI b-rolly)</em></p>
<p><strong>Co dostanete:</strong></p>
<ul>
<li><p>1 výkonnostní <strong>koncept videa</strong></p>
</li>
<li><p><strong>3 různé hooky</strong> = <strong>3 finální videa</strong> (3 samostatné soubory pro testování výkonu)</p>
</li>
<li><p>AI voiceover + AI titulky</p>
</li>
<li><p>Rozšířené <strong>AI b-rolly a AI scény</strong> v průběhu videa</p>
<p>  (vhodné i v případě, že nemáte dost vlastních záběrů)</p>
</li>
</ul>
<p><strong>Kreditová hodnota (za celý pack 3 videí):</strong></p>
<ul>
<li><p><strong>Výkonnostní video – AI b-roll (1 koncept / 3 videa): 17 kreditů</strong></p>
<p>  (≈ 6 800 Kč bez DPH)</p>
</li>
</ul>
<hr>
<h3>Další video služby</h3>
<ul>
<li><p><strong>Další alternativní hook navíc</strong></p>
<p>  (nad základní 3 – tj. +1 nové video navíc): 2 kredity</p>
</li>
<li><p><strong>Menší úprava videa</strong></p>
<p>  (úprava textů, vystřižení nebo vložení záběru): 2 kredity</p>
</li>
<li><p><strong>Překlad videa (titulky / voiceover):</strong> 2 kredity</p>
</li>
</ul>
<blockquote>
<p>Revize videí</p>
<ul>
<li>Každý video výstup (pack = 1 koncept / 3 videa) obsahuje <strong>1 revizní kolo zdarma</strong>.</li>
<li><strong>Každé další revizní kolo:</strong> 1 kredit / revize.</li>
</ul>
</blockquote>
<h3>Expresní dodání (48 h)</h3>
<p>Standardně dodáváme bannery i videa <strong>do 72 hodin</strong> od zadání (3 pracovní dny).</p>
<p>Pokud potřebujete <strong>expresní dodání do 48 hodin</strong>, lze u vybraných výstupů využít <strong>expresní režim</strong>:</p>
<ul>
<li><p>Za expresní dodání konkrétního výstupu účtujeme</p>
<p>  <strong>+50 % kreditů navíc</strong>.</p>
<ul>
<li>Příklad: pack bannerů za 4 kredity → expresně za 6 kreditů.</li>
<li>Video Standard za 12 kreditů → expresně za 18 kreditů.</li>
</ul>
</li>
</ul>
<p>Expresní režim vždy předem odsouhlasíme, abyste měli plnou kontrolu nad rozpočtem.</p>
<h3>Pravidla využití kreditů – shrnutí</h3>
<ol>
<li><p><strong>Kreditní hodnota</strong></p>
<p> Každý kredit má pevnou hodnotu <strong>400 Kč bez DPH</strong>. U každého typu výstupu předem víte, kolik kreditů stojí.</p>
</li>
<li><p><strong>Domluvený rámec, fakturace reality</strong></p>
<p> Na začátku měsíce se domluvíme na <strong>orientačním nebo maximálním počtu kreditů</strong>.</p>
<p> Na konci měsíce <strong>fakturujeme skutečně vyčerpané kredity</strong>.</p>
</li>
<li><p><strong>Nepřenosnost kreditů</strong></p>
<p> Kredity jsou vázané na daný měsíc a <strong>nepřevádějí se do dalšího období</strong> – motivuje to k efektivnímu využití naplánovaného budgetu.</p>
</li>
<li><p><strong>Zadávání požadavků</strong></p>
<p> Pro zpracování služeb je ideální zadávat požadavky průběžně;</p>
<p> nejpozději však <strong>5 pracovních dnů před koncem měsíce</strong>, aby bylo možné kredity vyčerpat.</p>
</li>
<li><p><strong>Revize</strong></p>
<ul>
<li>Každý dodaný výstup (pack bannerů / video pack) obsahuje <strong>1 revizní kolo zdarma</strong>.</li>
<li>Další revizní kola: <strong>1 kredit / revize</strong>.</li>
</ul>
</li>
<li><p><strong>Rychlost zpracování</strong></p>
<ul>
<li>Standard: dodání bannerů a videí do <strong>72 hodin</strong> od zadání.</li>
<li>Expres: dodání do <strong>48 hodin</strong> za <strong>+50 % kreditů</strong> za daný výstup.</li>
</ul>
</li>
<li><p><strong>Autorská práva</strong></p>
<p> Klient může všechny dodané výstupy (bannery, grafické prvky, videa) volně využívat, avšak nesmí je bez předchozího písemného souhlasu upravovat, měnit či přizpůsobovat.</p>
<p> Autorská práva zůstávají naší agentuře v souladu s autorským zákonem č. 121/2000 Sb.</p>
</li>
</ol>
<h3>Co konkrétně vám Creative Boost dodá</h3>
<h3>👉 Tvorba výkonnostních bannerů pro Meta Ads a PPC</h3>
<ul>
<li>Pomůžeme vám <strong>vybrat produkty, úhly komunikace a messaging</strong>, které dávají výkonově smysl.</li>
<li>Připravíme <strong>prodejní texty</strong> – headline, benefity, USP, výzvy k akci.</li>
<li>Vytvoříme <strong>vizuály odpovídající značce</strong>, ale primárně zaměřené na výkon.</li>
<li>Součástí je <strong>1 kolo revizí</strong>, kde doladíme texty, barvy a detaily podle vašich připomínek.</li>
</ul>
<h3>👉 Krátká vertikální videa (Reels / Stories / Shorts)</h3>
<ul>
<li>Navrhneme <strong>koncept a strukturu videa</strong> (hook → problém → řešení → CTA).</li>
<li>Připravíme <strong>script</strong> pro voiceover a textové přelepky.</li>
<li>Zajistíme <strong>AI nebo reálný voiceover</strong>, titulky, střih a b-rolly podle zvolené varianty (Standard / AI b-roll).</li>
<li>Dodáme <strong>3 finální videa z jednoho konceptu</strong> (3 různé hooky pro A/B testování).</li>
<li>Každý video pack obsahuje <strong>1 kolo revizí</strong>, další revize jsou možné za 1 kredit / revize.</li>
</ul>
<h3>🎬 Video Boost – Výkonnostní videa pro Meta Ads / Tiktok Ads</h3>
<h3><strong>Co získáte v rámci služby Video Boost?</strong></h3>
<ul>
<li><strong>Videa, která prodávají, ne jen hezky vypadají</strong> – zaměřujeme se na jasnou nabídku, benefit a silné CTA.</li>
<li><strong>Rychlou produkci bez zbytečného natáčení</strong> – pracujeme primárně s vašimi záběry a doplňujeme je AI voiceoverem, titulky a případně AI b-rolly.</li>
<li><strong>Více variant z jednoho zadání</strong> – ke každému videu připravíme 3 různé hooky (začátky videí), takže získáte <strong>3 varianty videa</strong> pro A/B testování.</li>
</ul>
<blockquote>
<p>Pokud využíváte náš systém Creative Boost, můžeme službu Video Boost účtovat i formou kreditů</p>
<p>(1 kredit = 400 Kč bez DPH) místo fixní částky za video.</p>
</blockquote>
<hr>
<h3>⚙️ Jak služba probíhá</h3>
<h3><strong>1) 🎯 Účel videa a nabídka</strong></h3>
<p>Nejprve si ujasníme:</p>
<ul>
<li><strong>Co se má komunikovat</strong> – sleva, akce, dárek, novinka, hlavní benefit produktu/služby.</li>
<li><strong>Účel videa</strong> – akvizice nových zákazníků, remarketing, podpora konkrétní kampaně / landing page.</li>
<li><strong>Produkty</strong> – domluvíme, které konkrétní produkty/služby budou ve videu.</li>
</ul>
<p>Na základě toho připravíme krátký <strong>creative brief</strong>, ze kterého vychází scénář.</p>
<hr>
<h3><strong>2) 📝 Scénář a voiceover (3 hooky na koncept)</strong></h3>
<p>Připravíme:</p>
<ul>
<li><strong>Kreativní úhel videa</strong> – jak produkt/službu odprezentovat, aby byl pro cílovou skupinu co nejatraktivnější.</li>
<li><strong>Voiceover script</strong> – kompletní text k videu rozdělený na:<ul>
<li><strong>HOOK (3 varianty)</strong> – tři různé začátky videa,</li>
<li><strong>MAIN část</strong> – vysvětlení benefitu/nabídky,</li>
<li><strong>CTA</strong> – jasná výzva k akci.</li>
</ul>
</li>
</ul>
<p>Text následně <strong>schvalujete vy jako klient</strong> – teprve potom jdeme do střihu.</p>
<hr>
<h3><strong>3) 🎬 Střih videa a AI prvky</strong></h3>
<p>Podle zvolené varianty:</p>
<ul>
<li>Využijeme <strong>záběry, které dodáte</strong> (produkty, použití, sklad, tým, UGC…).</li>
<li>Doplníme <strong>AI voiceover</strong> – přirozeně působící hlas podle schváleného textu.</li>
<li>Přidáme <strong>AI titulky</strong> – dynamické, dobře čitelné i bez zvuku.</li>
<li>U rozšířené varianty také <strong>AI b-rolly a AI scény</strong>, které doplní prostředí a kontext.</li>
</ul>
<p>Výstupem je video ve formátu <strong>9:16</strong>, délka <strong>15–30 sekund</strong>, připravené rovnou do reklam.</p>
<p>Z jednoho konceptu vždy dostanete <strong>3 finální videa</strong> (3 různé hooky).</p>
<hr>
<h3><strong>4) ✅ Revize a finální export</strong></h3>
<ul>
<li>V ceně každého videa je <strong>1 kolo revizí</strong> (úprava textů, drobné změny střihu, záběrů, barev).</li>
<li>Každé další kolo revizí účtujeme dle času – <strong>1 700 Kč / hod</strong>.</li>
<li>Pokud využíváte <strong>Creative Boost</strong>, můžeme další revize účtovat i formou kreditů – <strong>1 kredit / kolo revizí</strong>.</li>
<li>Finální video dodáváme ve formátech vhodných pro Meta Ads a TikTok Ads.</li>
</ul>
<hr>
<h3>📦 Varianty služby a ceny</h3>
<p>Ceny jsou uvedeny <strong>bez DPH</strong>.</p>
<hr>
<h3>🎥 Varianta 1: Výkonnostní video – Standard</h3>
<p><em>(záběry klienta + AI hooky, bez rozsáhlých AI b-rollů)</em></p>
<ul>
<li>1 koncept videa</li>
<li><strong>3 různé hooky</strong> (3 verze začátku videa = 3 finální videa)</li>
<li>AI voiceover + AI titulky</li>
<li>Práce primárně s vašimi záběry</li>
</ul>
<p><strong>Ceník (bez Creative Boost):</strong></p>
<ul>
<li><p><strong>1 video balíček (1 koncept / 3 videa):</strong> 4 900 Kč</p>
</li>
<li><p><strong>Balíček 3 video konceptů (9 videí, sleva 10 %):</strong></p>
<p>  Celkem: <strong>13 230 Kč</strong> (4 410 Kč / koncept)</p>
</li>
</ul>
<p><strong>Pokud máte aktivní Creative Boost:</strong></p>
<ul>
<li><p><strong>Výkonnostní video – Standard (1 koncept / 3 videa): 12 kreditů</strong></p>
<p>  (1 kredit = 400 Kč bez DPH)</p>
</li>
</ul>
<hr>
<h3>🎥 Varianta 2: Výkonnostní video – AI b-roll</h3>
<p><em>(záběry klienta + rozšířené AI scény a AI b-rolly)</em></p>
<ul>
<li>1 koncept videa</li>
<li><strong>3 různé hooky</strong> (3 verze začátku videa = 3 finální videa)</li>
<li>AI voiceover + AI titulky</li>
<li>Rozšířené <strong>AI b-rolly a AI scény</strong> v průběhu videa (vizuálně bohatší výstup, vhodné i když klient nemá dost vlastních záběrů)</li>
</ul>
<p><strong>Ceník (bez Creative Boost):</strong></p>
<ul>
<li><p><strong>1 video balíček (1 koncept / 3 videa):</strong> 6 900 Kč</p>
</li>
<li><p><strong>Balíček 3 video konceptů (9 videí, sleva 10 %):</strong></p>
<p>  Celkem: <strong>18 630 Kč</strong> (6 210 Kč / koncept)</p>
</li>
</ul>
<p><strong>Pokud máte aktivní Creative Boost:</strong></p>
<ul>
<li><p><strong>Výkonnostní video – AI b-roll (1 koncept / 3 videa): 17 kreditů</strong></p>
<p>  (1 kredit = 400 Kč bez DPH)</p>
</li>
</ul>
<h3>🤖 AI SEO – měsíční optimalizace webu pro AI vyhledávání</h3>
<p>Stále více lidí dnes používá <strong>umělou inteligenci jako vyhledávač</strong> – místo klasického Googlu se ptají nástrojů jako ChatGPT, Google AI Overview nebo Perplexity.</p>
<p>Tyto nástroje už dnes:</p>
<ul>
<li>odpovídají na dotazy uživatelů,</li>
<li>doporučují konkrétní značky,</li>
<li>a nově dokonce <strong>nabízejí konkrétní produkty z e-shopů</strong> (např. OpenAI tuto funkci spustilo i v EU).</li>
</ul>
<p>Naším cílem je pomoci klientům, aby <strong>jejich produkty a služby měly šanci se v těchto AI nástrojích zobrazovat</strong> a oslovovat nové zákazníky právě v tomto prostředí.</p>
<hr>
<h3>Co v rámci služby řešíme</h3>
<p>Pracujeme na tom, aby byl váš web:</p>
<ul>
<li>srozumitelný pro AI nástroje,</li>
<li>tematicky silný a relevantní,</li>
<li>vnímaný jako odborný zdroj,</li>
<li>připravený na zobrazování produktů a služeb v AI odpovědích.</li>
</ul>
<p>Konkrétně:</p>
<ul>
<li>analyzujeme, jak AI váš web chápe a využívá,</li>
<li>navrhujeme úpravy struktury stránek a obsahu,</li>
<li>identifikujeme chybějící témata a příležitosti,</li>
<li>pomáháme budovat tematickou autoritu webu,</li>
<li>průběžně konzultujeme další kroky.</li>
</ul>
<p>Součástí služby je také <strong>komunikace a konzultace s naším SEO / AI specialistou</strong>.</p>
<p>Jedná se o <strong>průběžnou měsíční spolupráci</strong>, jejímž cílem je připravit váš web na fungování AI vyhledávání.</p>
<hr>
<h3>Rozsah a cena</h3>
<p>🕒 <strong>Odhadovaný rozsah: 10 hodin práce měsíčně</strong></p>
<p>⚠️ Jedná se o <strong>odhad</strong> – práce je <strong>fakturována dle reálně odpracovaných hodin</strong></p>
<p>💰 <strong>1 800 Kč / hod</strong></p>
<hr>
<h3>Jak probíhá zahájení spolupráce</h3>
<p>1️⃣ Po projevení zájmu si náš kolega <strong>nejprve projde váš web</strong></p>
<p>– posoudí, zda je služba pro vás vhodná,</p>
<p>– případně zda už nemáte tuto oblast vyřešenou systémově.</p>
<p>2️⃣ Pokud služba dává smysl:</p>
<ul>
<li>upřesníme <strong>reálný rozsah hodin</strong>,</li>
<li>doladíme potřebné přístupy,</li>
<li>a domluvíme konkrétní plán práce.</li>
</ul>
<p>3️⃣ Následně se pustíme do realizace.</p>
<p>Spolupráci <strong>doporučujeme minimálně na 6 měsíců</strong>, aby bylo možné:</p>
<ul>
<li>postupně implementovat všechny potřebné změny,</li>
<li>vyhodnotit jejich reálný dopad,</li>
<li>a nastavit dlouhodobě funkční řešení.</li>
</ul>
<h3>🛒 Správa Heuréky a Zboží.cz</h3>
<p><strong>Zahrnuje:</strong></p>
<ul>
<li><p><strong>Úvodní nastavení</strong></p>
<p>  ✅ <strong>Import XML feedu do Mergada</strong> – Kontrola a validace dat.</p>
<p>  ✅ <strong>Úpravy v Mergadu</strong> – Přemapování kategorií, úprava názvů, doplnění chybějících EAN kódů a parametrů.</p>
<p>  ✅ <strong>Testování výstupu</strong> – Ověření správného zpracování feedu v Heureka/Zboží.cz.</p>
</li>
<li><p><strong>Optimalizace XML feedu</strong></p>
<p>  ✅ <strong>Validace feedu</strong> – Ověřit správnost kategorií, názvů, obrázků, cen a dostupnosti.</p>
<p>  ✅ <strong>Optimalizace názvů produktů</strong> – Použití klíčových slov a přesného pojmenování pro správné spárování.</p>
<p>  ✅ <strong>Správné párování produktů</strong> – Ruční úpravy u nespárovaných položek.</p>
<p>  ✅ <strong>EAN kódy a parametry</strong> – Důležité pro spárování a lepší viditelnost ve filtrech.</p>
</li>
<li><p><strong>Bidding – řízení CPC pro maximální ziskovost</strong></p>
<p>  ✅ <strong>Segmentace produktů</strong> – Prioritizovat výkonné produkty s vysokou marží.</p>
<p>  ✅ <strong>Automatizovaný bidding</strong> – Možné použití nástrojů (Bidding Fox, Beed) pro udržení PNO pod kontrolou.</p>
<p>  ✅ <strong>Manuální úprava CPC</strong> – Zvýšení CPC pro klíčové produkty, omezení u těch se slabou návratností.</p>
<p>  ✅ <strong>Pravidelné vyhodnocení PNO/ROI</strong> – Zamezit plýtvání rozpočtu na neefektivní produkty.</p>
</li>
<li><p><strong>Recenze a důvěryhodnost</strong></p>
<p>  ✅ <strong>Podpora „Ověřeno zákazníky“</strong> – Aktivně sbírat recenze, odpovídat na negativní.</p>
<p>  ✅ <strong>Hodnocení produktů</strong> – Více recenzí = vyšší konverze.</p>
</li>
<li><p><strong>Analýza a reporting</strong></p>
<p>  ✅ <strong>Sledování výkonu kampaní (PNO, ROI, CTR, konverze)</strong> – Optimalizace na základě reálných dat.</p>
<p>  ✅ <strong>Pravidelný reporting</strong> – Vyhodnocení výsledků a iterativní zlepšování strategií.</p>
</li>
</ul>
<h3>👶🏻 Správa TikTok Ads</h3>
<p><strong>Co získáte v rámci služby TikTok Boost?</strong></p>
<ul>
<li><strong>Nový zdroj zákazníků z jedné z nejrychleji rostoucích platforem</strong> – TikTok vám pomůže zasáhnout publikum, na které se přes klasické kanály často nedostanete.</li>
<li><strong>Výkonnostní pohled, ne jen branding</strong> – Kampaně stavíme na datech, konverzích a reálném byznysovém dopadu.</li>
<li><strong>Kompletní správu TikTok Ads</strong> – od technického nastavení po průběžnou optimalizaci, testování a škálování úspěšných kampaní.</li>
</ul>
<h3>👗 Správa Glami</h3>
<p><strong>Zahrnuje:</strong></p>
<ul>
<li><p><strong>Úvodní nastavení</strong></p>
<p>  ✅ <strong>Import XML feedu do Mergada</strong> – Kontrola a validace dat.</p>
<p>  ✅ <strong>Úpravy v Mergadu</strong> – Přemapování kategorií, úprava názvů, doplnění chybějících EAN kódů a parametrů.</p>
<p>  ✅ <strong>Testování výstupu</strong> – Ověření správného zpracování feedu</p>
</li>
<li><p><strong>Optimalizace XML feedu</strong></p>
<p>  ✅ <strong>Validace feedu</strong> – Ověřit správnost kategorií, názvů, obrázků, cen a dostupnosti.</p>
<p>  ✅ <strong>Optimalizace názvů produktů</strong> – Použití klíčových slov a přesného pojmenování pro správné spárování.</p>
<p>  ✅ <strong>Správné párování produktů</strong> – Ruční úpravy u nespárovaných položek.</p>
<p>  ✅ <strong>EAN kódy a parametry</strong> – Důležité pro spárování a lepší viditelnost ve filtrech.</p>
</li>
<li><p><strong>Bidding – řízení CPC pro maximální ziskovost</strong></p>
<p>  ✅ <strong>Segmentace produktů</strong> – Prioritizovat výkonné produkty s vysokou marží.</p>
<p>  ✅ <strong>Automatizovaný bidding</strong> – Možné použití nástrojů (Bidding Fox, Beed) pro udržení PNO pod kontrolou.</p>
<p>  ✅ <strong>Manuální úprava CPC</strong> – Zvýšení CPC pro klíčové produkty, omezení u těch se slabou návratností.</p>
<p>  ✅ <strong>Pravidelné vyhodnocení PNO/ROI</strong> – Zamezit plýtvání rozpočtu na neefektivní produkty.</p>
</li>
<li><p><strong>Analýza a reporting</strong></p>
<p>  ✅ <strong>Sledování výkonu kampaní (PNO, ROI, CTR, konverze)</strong> – Optimalizace na základě reálných dat.</p>
<p>  ✅ <strong>Pravidelný reporting</strong> – Vyhodnocení výsledků a iterativní zlepšování strategií.</p>
</li>
</ul>
<h3>🪑 Správa Favi</h3>
<p><strong>Zahrnuje:</strong></p>
<ul>
<li><p><strong>Úvodní nastavení</strong></p>
<p>  ✅ <strong>Import XML feedu do Mergada</strong> – Kontrola a validace dat.</p>
<p>  ✅ <strong>Úpravy v Mergadu</strong> – Přemapování kategorií, úprava názvů, doplnění chybějících EAN kódů a parametrů.</p>
<p>  ✅ <strong>Testování výstupu</strong> – Ověření správného zpracování feedu</p>
</li>
<li><p><strong>Optimalizace XML feedu</strong></p>
<p>  ✅ <strong>Validace feedu</strong> – Ověřit správnost kategorií, názvů, obrázků, cen a dostupnosti.</p>
<p>  ✅ <strong>Optimalizace názvů produktů</strong> – Použití klíčových slov a přesného pojmenování pro správné spárování.</p>
<p>  ✅ <strong>Správné párování produktů</strong> – Ruční úpravy u nespárovaných položek.</p>
<p>  ✅ <strong>EAN kódy a parametry</strong> – Důležité pro spárování a lepší viditelnost ve filtrech.</p>
</li>
<li><p><strong>Bidding – řízení CPC pro maximální ziskovost</strong></p>
<p>  ✅ <strong>Segmentace produktů</strong> – Prioritizovat výkonné produkty s vysokou marží.</p>
<p>  ✅ <strong>Automatizovaný bidding</strong> – Možné použití nástrojů (Bidding Fox, Beed) pro udržení PNO pod kontrolou.</p>
<p>  ✅ <strong>Manuální úprava CPC</strong> – Zvýšení CPC pro klíčové produkty, omezení u těch se slabou návratností.</p>
<p>  ✅ <strong>Pravidelné vyhodnocení PNO/ROI</strong> – Zamezit plýtvání rozpočtu na neefektivní produkty.</p>
</li>
<li><p><strong>Analýza a reporting</strong></p>
<p>  ✅ <strong>Sledování výkonu kampaní (PNO, ROI, CTR, konverze)</strong> – Optimalizace na základě reálných dat.</p>
<p>  ✅ <strong>Pravidelný reporting</strong> – Vyhodnocení výsledků a iterativní zlepšování strategií.</p>
</li>
</ul>
',
'📢 Socials Boost Správa Meta Ads Co získáte v rámci služby Socials Boost? Více zakázek a vyšší zisk – reklamy nastavíme tak, aby vám přinášely zákazníky, kteří nakupují. Méně starostí, více času na podnikání – postaráme se o celou správu výkonnostní reklamy, abyste se mohli věnovat růstu firmy. Partnera, který řeší výkon, ne jen reklamy – přemýšlíme nad vaším byznysem, ne jen nad reklamními účty. Kompletní správu Meta Ads Od nastavení účtů po průběžnou optimalizaci 📌 Detailní rozpis naší služby si můžete přečíst níže (Obsah rozbalíte kliknutím na trojúhelník před textem). ⚙️ Úvodní nastavení projektu zahrnuje 1) 📢 Nastavení Meta Business Suite Meta Pixel: Kontrola a nastavení pro přesné měření klíčových událostí na webu, případně implementace Conversion API (CAPI). Katalog produktů: Kontrola propojení a konfigurace katalogu produktů pro dynamické reklamy (DPA). Reklamní účet: Ověření správnosti nastavení reklamního účtu, včetně platebních údajů a propojení s dalšími nástroji. Meta Business Suite: Detailní kontrola propojení všech nástrojů (reklamní účet, pixel, katalog, stránky) v rámci Business Suite. Struktura kampaní: Vytvoření základní struktury kampaní zaměřených na akvizici nových zákazníků a remarketing. Textace reklam: Tvorba poutavých textů přizpůsobených cílové skupině a obchodním cílům. 2) 💹 Kontrola nastavení analytického měření Účet a sledování: Kontrola a optimalizace měření klíčových událostí (nákupy, přidání do košíku, registrace) prostřednictvím modulů v Shoptetu, Upgates nebo Shopify. 3) 📊 Tvorba dashboardu výsledků v Looker Studio Reportovací šablona: Vytvoření přehledné šablony pro sledování výkonu kampaní. Propojení dat: Napojení Looker Studio na Google Ads, Meta Ads a Google Analytics. Vizualizace metrik: Přehledné zobrazení klíčových metrik, jako je CPC, CTR, ROAS, konverze, pro snadné vyhodnocení kampaní. Automatizace dat: Nastavení automatické aktualizace a sdílení reportů pro přístup 24/4) 🎯 Vylepšení nabídky Aby reklamy přinášely maximální výsledky, nestačí jen technická optimalizace kampaní – klíčová je také atraktivita samotné nabídky. Proto se podíváme na váš web, produkty nebo služby a navrhneme zlepšení, která pomohou přesvědčit více zákazníků k nákupu či poptávce. Návrh produktových balíčků (bundles) – kombinace produktů, které zvýší hodnotu objednávky a motivují zákazníky ke koupi. Doporučení slevových a akčních nabídek – strategické slevy, dárky k nákupu nebo limitované akce, které podpoří rychlejší rozhodnutí zákazníků. Zvýraznění unikátní hodnoty nabídky – jasně komunikujeme, proč si zákazník má vybrat právě vás (doprava zdarma, garance spokojenosti, prémiová kvalita apod.). Přizpůsobíme hlavní sdělení tak, aby oslovilo správnou cílovou skupinu a odlišilo vás od konkurence. Kontrola webu – identifikujeme bariéry v nákupním procesu (např. složitý checkout, nejasné informace) a doporučíme úpravy pro vyšší míru dokončení nákupů. 📈 Správa kampaní zahrnuje 1) 📢 Správa Meta Ads Meta Ads je klíčová platforma pro zvyšování povědomí o značce a získávání zákazníků na sociálních sítích. V rámci správy pro vás zajistíme: Analýza výkonu: Pravidelně sledujeme výsledky kampaní a identifikujeme, které reklamy, sestavy nebo kampaně neplní cíle – ty pak upravujeme nebo vypínáme. Tvorba nových kampaní a reklam: Vytváříme nové kampaně, sestavy a reklamy na základě analýzy dat a aktuálních potřeb e-shopu. Škálování úspěšných kampaní: Kampaně, které přinášejí dobré výsledky, postupně navyšujeme, abychom maximalizovali jejich přínos. Spolupráce s grafiky: Pokud jsou potřeba nové vizuály, připravíme zadání pro grafiky nebo editory. Monitoring měření (Pixel/CAPI): Průběžně kontrolujeme, zda Pixel nebo Conversion API správně měří klíčové události na vašem webu. 2) 💬 Reporting a komunikace Transparentní a pravidelná komunikace je klíčem k úspěšné správě kampaní. Informujeme vás o výkonnosti kampaní, provedených změnách a plánovaných krocích prostřednictvím pravidelných reportů v dohodnuté formě. Video / textový report: Každý měsíc připravíme video nebo text s přehledem fungování kampaní. Looker Studio report: Nepřetržitý přístup (24/7) k přehlednému reportu, kde můžete sledovat klíčové metriky kampaní. Pravidelné konzultace: Pokud je potřeba, nabízíme strategické hovory, kde s vámi diskutujeme vývoj kampaní a jejich další směřování. 📦 Úrovně Socials Boost dle velikosti rozpočtu Naše služba je rozdělena do balíčků dle výše spravovaného reklamního rozpočtu (spendu). Čím vyšší rozpočet na kampaně, tím rozsáhlejší správa, častější optimalizace a strategické škálování, aby bylo dosaženo maximálních obchodních výsledků. Pokud se váš reklamní rozpočet v budoucnu zvýší, přizpůsobíme správu a doporučíme přechod na vyšší balíček, aby kampaně stále fungovaly co nejlépe. 🔹 Transparentní pricing – vždy víte, kolik za naše služby zaplatíte. | 📢 Socials Boost | 🚀 GROWTH | 💪 PRO | 🏆 ELITE | | --| --| --| --| | Rozpočet (reklamní kredit) | do 400 000 Kč | 400 000 800 000 Kč | nad 800 000 Kč | | Platf',
57,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'805e1b27-d832-440b-9018-277bc2ee4bc2',
'11111111-1111-1111-1111-111111111112',
'Služby Socials - interní detailní informace a interní odměňování',
'<h3>1. Cíl dokumentu</h3>
<p>Tento dokument slouží k tomu, aby každý v týmu věděl:</p>
<ul>
<li>jaké <strong>balíčky služeb</strong> nabízíme (core + add-ons),</li>
<li>jaké <strong>platformy</strong> do nich spadají,</li>
<li>jaká je <strong>úroveň klienta podle spendu</strong> (GROWTH / PRO / ELITE),</li>
<li>jaká je <strong>interní odměna</strong> pro jednotlivé role za správu daného balíčku.</li>
</ul>
<p>Neuvádíme zde žádné klientské ceny – ty jsou jen v obchodních podkladech.</p>
<p>Tady řešíme pouze <strong>interní rozdělení odměn</strong>.</p>
<hr>
<h3>2. Core balíčky (výkonnostní správa)</h3>
<p>Core balíčky jsou základ naší spolupráce s klienty. <strong>Každý náš klient musí mít Core balíček</strong>. Liší se:</p>
<ul>
<li>podle <strong>spravovaných platforem</strong> a</li>
<li>podle <strong>výše měsíčního spendu</strong>.</li>
</ul>
<h3>2.1 Přehled core balíčků</h3>
<ul>
<li><strong>Socials Boost</strong> – správa <strong>Meta Ads</strong> (Facebook, Instagram)</li>
<li><strong>PPC Boost</strong> – správa <strong>Google Ads + Sklik</strong></li>
<li><strong>Performance Boost</strong> – kombinace <strong>Meta Ads + Google Ads + Sklik</strong> pod jednou strategií</li>
</ul>
<p>Každý z těchto balíčků má 3 úrovně podle měsíčního spendu:</p>
<ul>
<li><strong>GROWTH</strong> – klient spenduje cca do 400 000 Kč / měsíc</li>
<li><strong>PRO</strong> – klient spenduje cca 400 000 – 800 000 Kč / měsíc</li>
<li><strong>ELITE</strong> – klient spenduje 800 000 Kč+ / měsíc (individuální nastavení)</li>
</ul>
<h3><strong>2.2 Jak pracujeme s pricingem (důležité!)</strong></h3>
<p>Balíčky a úrovně spendu jsou naše „kostra“, která drží celý systém pohromadě — ale nejsou to dogmata. V praxi se může stát, že klient má nastavení, které do tabulek přesně nezapadá (více zemí, kombinace regionů, různé měnové účty, vysoké nároky na kreativitu, velké B2B účty, sezónní špičky, netypické rozložení spendu mezi platformami).</p>
<p><strong>V těchto případech vždy pracujeme s individuální kalkulací</strong>, aby:</p>
<ul>
<li>odměna odpovídala reálnému workloadu,</li>
<li>specialista nebyl v mínusu,</li>
<li>klient dostal adekvátní servis,</li>
<li>pricing zůstal férový a dlouhodobě udržitelný.</li>
</ul>
<p>Proto vždy dává smysl:</p>
<ol>
<li><strong>vyhodnotit složitost účtu</strong> (země, měny, platformy, feedy, jazykové mutace),</li>
<li><strong>zkontrolovat reálný předpoklad hodin</strong>,</li>
<li><strong>zvážit, zda klient zapadá do standardního balíčku</strong>,</li>
<li><strong>a pokud ne — navrhnout individuální úpravu ceny i odměny</strong>.</li>
</ol>
<p>Cílem není snažit se klienta „nacpat“ do šablony za každou cenu, ale mít systém, který je strukturovaný, předvídatelný a zároveň flexibilní všude tam, kde realita e-shopů nebo B2B projektů vyžaduje vlastní řešení.</p>
<hr>
<h3>3. Interní odměny za core balíčky</h3>
<p>Odměna se vždy váže na <strong>balíček + úroveň spendu + roli</strong>.</p>
<p>Konkrétní částky doplňujeme v Google Sheetu <code>Interní odměny – Socials</code>.</p>
<blockquote>
<p>📌 Princip:</p>
<ul>
<li>odměna je fixní <strong>měsíční částka za plný měsíc správy</strong>,</li>
<li>při zahájení/ukončení spolupráce v průběhu měsíce se odměna počítá <strong>poměrnou částí</strong>,</li>
<li>u ELITE a nestandardních případů se výše odměny řeší individuálně s Danem.</li>
</ul>
</blockquote>
<table>
<thead>
<tr>
<th>Služba</th>
<th>Zahrnuje</th>
<th>Očekávaný počet hodin Meta Ads</th>
<th>Odměna Meta Ads</th>
<th>Očekávaný počet hodin PPC</th>
<th>Odměna Google PPC</th>
</tr>
</thead>
<tbody><tr>
<td>📢 Socials Boost (GROWTH)</td>
<td>Meta Ads</td>
<td>13</td>
<td>Kč9,100</td>
<td>0</td>
<td>Kč0</td>
</tr>
<tr>
<td>📢 Socials Boost (PRO)</td>
<td>Meta Ads</td>
<td>17</td>
<td>Kč11,900</td>
<td>0</td>
<td>Kč0</td>
</tr>
<tr>
<td>📢 Socials Boost (ELITE)</td>
<td>Meta Ads</td>
<td>22</td>
<td>Kč15,400</td>
<td>0</td>
<td>Kč0</td>
</tr>
<tr>
<td>📈 PPC Boost (GROWTH)</td>
<td>Google Ads + S-klik</td>
<td>0</td>
<td>Kč0</td>
<td>10</td>
<td>Kč7,000</td>
</tr>
<tr>
<td>📈 PPC Boost (PRO)</td>
<td>Google Ads + S-klik</td>
<td>0</td>
<td>Kč0</td>
<td>15</td>
<td>Kč10,500</td>
</tr>
<tr>
<td>📈 PPC Boost (ELITE)</td>
<td>Google Ads + S-klik</td>
<td>0</td>
<td>Kč0</td>
<td>20</td>
<td>Kč14,000</td>
</tr>
<tr>
<td>🚀 Performance Boost (GROWTH)</td>
<td>Meta Ads, Google Ads, S-klik</td>
<td>13</td>
<td>Kč9,100</td>
<td>8</td>
<td>Kč5,600</td>
</tr>
<tr>
<td>🚀  Performance Boost (PRO)</td>
<td>Meta Ads, Google Ads, S-klik</td>
<td>17</td>
<td>Kč11,900</td>
<td>12</td>
<td>Kč8,400</td>
</tr>
<tr>
<td>🚀  Performance Boost (ELITE)</td>
<td>Meta Ads, Google Ads, S-klik</td>
<td>22</td>
<td>Kč15,400</td>
<td>16</td>
<td>Kč11,200</td>
</tr>
</tbody></table>
<p>⚠️ Poznámka: Odměna za PPC u balíčků <strong>Performance Boost</strong> je nižší než u samostatného <strong>PPC Boost</strong> balíčku, protože specialista zde <strong>neřeší plný rozsah reportingu a komunikace s klientem</strong>. Tyto části správy jsou v rámci Performance Boostu sdílené s Meta specialistou, takže práce na Google Ads není tak časově náročná jako u samostatné PPC správy, kde si specialista vše řeší kompletně sám.</p>
<hr>
<h3><strong>3. ADD-ON služby (doplněk ke core balíčku)</strong></h3>
<p>Add-on = <em>volitelná služba navíc, kterou si klient může přikoupit</em>, ale <strong>nikdy ji neposkytujeme samostatně bez core balíčku</strong>.</p>
<p>Add-ons rozšiřují výkon kampaní, pokrývají další kanály nebo technické oblasti.</p>
<p>Aktuální seznam add-onů:</p>
<table>
<thead>
<tr>
<th><strong>Služba</strong></th>
<th><strong>Popis</strong></th>
<th><strong>Hodiny</strong></th>
<th><strong>Odměna</strong></th>
</tr>
</thead>
<tbody><tr>
<td><strong>Creative Boost</strong></td>
<td>Odměna podle počtu kreditů (150 Kč / kredit).</td>
<td>x</td>
<td><strong>150 Kč / kredit</strong></td>
</tr>
<tr>
<td><strong>TikTok Ads – správa</strong></td>
<td>Kompletní správa TikTok kampaní, optimalizace, testování, reporting.</td>
<td>7</td>
<td><strong>4 900 Kč</strong></td>
</tr>
<tr>
<td><strong>Úvodní nastavení zbožových srovnávačů (Heureka / Zboží / Glami / Favi)</strong></td>
<td>Úvodní setup XML feedu, import do Mergada, validace, párování, úpravy kategorií, EANů, názvů, testování. Jednorázová práce.</td>
<td>od 4 hodin</td>
<td><strong>od 2 800 Kč</strong></td>
</tr>
<tr>
<td><strong>Heureka &amp; Zboží.cz – správa</strong></td>
<td>Kompletní správa produktových inzerátů – feed, bidding, optimalizace.</td>
<td>4</td>
<td><strong>2 800 Kč</strong></td>
</tr>
<tr>
<td><strong>Glami – správa</strong></td>
<td>Fashion srovnávač – feed, párování, bidding, optimalizace.</td>
<td>2</td>
<td><strong>1 400 Kč</strong></td>
</tr>
<tr>
<td><strong>Favi – správa</strong></td>
<td>Home &amp; Deco srovnávač – feed, párování, bidding, optimalizace.</td>
<td>2</td>
<td><strong>1 400 Kč</strong></td>
</tr>
<tr>
<td><strong>Analytické měření</strong></td>
<td>Nastavení GTM, GA4, Pixelu, konverzí apod. (účtuje se jako vícepráce).</td>
<td>dle rozsahu</td>
<td>hodinová odměna dle SOP</td>
</tr>
</tbody></table>
<h3><strong>📌 Poznámka k add-on službám (důležité!)</strong></h3>
<p>U všech add-on služeb platí, že uvedené <strong>hodiny i odměny jsou minimální orientační hodnoty</strong>.</p>
<p>Každý projekt je jiný — a proto je <strong>nutné se vždy individuálně domluvit se specialistou</strong>, který add-on řeší:</p>
<ul>
<li>zda uvedený rozsah odpovídá reálné práci,</li>
<li>zda je potřeba navýšit počet hodin,</li>
<li>zda je potřeba rozšířit odměnu,</li>
<li>nebo zda se jedná o atypický případ, kde bude třeba upravit i cenu pro klienta.</li>
</ul>
<p>Specialista má právo říct, že <strong>rozsah neodpovídá skutečné náročnosti</strong>, a spolu s Danem/Otasem nastavit férové podmínky.</p>
<p>Cílem je, aby:</p>
<ul>
<li><strong>klient měl odpovídající servis</strong>,</li>
<li><strong>specialista nebyl v mínusu na hodinách</strong>,</li>
<li><strong>odměna byla spravedlivá</strong> a reflektovala reálný workload.</li>
</ul>
<hr>
<h3>📝 Detailní popis služeb, které v Socials nabízíme a jak je prezentujeme klientům</h3>
<p><a href="Slu%C5%BEby%20Socials%20-%20Jak%20je%20prezentujeme%20klient%C5%AFm%202c251ff3df5780a4886bc14fe11c269c.md">Služby Socials - Jak je prezentujeme klientům</a></p>
<h3><strong>4. Jak pracovat s balíčky v praxi</strong></h3>
<p><strong>Balíčky jsou orientační, ne fixní.</strong></p>
<p>Slouží hlavně k tomu, aby:</p>
<ul>
<li>klienti viděli srozumitelnou nabídku,</li>
<li>my jsme měli jasnou interní strukturu a výši odměn,</li>
<li>vyhneme se chaosu v pricingu.</li>
</ul>
<p><strong>Kdy balíček upravujeme?</strong></p>
<ol>
<li><strong>Klient má netypický spend</strong> (např. 90k na Meta + 450k na Google → nemusí sedět žádný standardní balíček).</li>
<li><strong>Klient potřebuje specifické úpravy</strong> (např. více kreativ každý měsíc, mimořádné kampaně).</li>
<li><strong>Jde o sezónní nebo krátkodobé kampaně</strong>.</li>
<li><strong>Klient má výjimečně vysoký spend</strong> → vždy individuální kalkulace.</li>
<li><strong>Klient přechází mezi pásmy (Growth → Pro → Elite)</strong>.</li>
</ol>
<hr>
<h3><strong>4. Jak řešit přechod mezi pásmy (change of tier)</strong></h3>
<p>Pokud klient přejde jednorázově do vyššího pásma spendu –&gt; Tzn,. spenduje více než kolik je jeho balíček - (např. Growth → Pro), nic se nemění.</p>
<p>Pokud se to opakovaně děje, nebo očekáváme trvalé navýšení spendu:</p>
<p>➡️ <strong>Přesuneme klienta do vyššího cenového pásma.</strong></p>
<p>Vysvětlíme to takto:</p>
<aside>
💬

<p>Dobrý den,</p>
<p>rád bych Vás informoval o jedné důležité změně týkající se správy kampaní.</p>
<p>V posledních měsících vidíme stabilně vyšší investice do reklamy, díky kterým společně pracujeme s větším objemem dat a můžeme agresivněji škálovat výkon.</p>
<p>S vyšším rozpočtem se však zároveň zvyšuje i náročnost samotné správy – je potřeba častěji optimalizovat kampaně, připravovat nové kreativy, testovat různé varianty a kontrolovat měření napříč kanály.</p>
<p>Abychom udrželi kvalitu výstupů a dále posouvali výsledky správným směrem, je vhodné přejít do vyššího pásma správy.</p>
<p>Nově by tedy Vaše správa spadala do tarifu <strong>[název pásma]</strong>, který lépe odpovídá objemu práce i zodpovědnosti spojené s vyšším rozpočtem. Cena za správu by tak byla <strong>[nová cena] / měsíc</strong>.</p>
<p>Tato změna nám umožní věnovat kampaním odpovídající množství času a zajistit dlouhodobě stabilní růst výkonu.</p>
<p>Pokud budete mít jakékoliv dotazy nebo si to chcete společně projít na krátkém callu, dejte mi prosím vědět.</p>
<p>Děkuji</p>
</aside>

<p><strong>⚠️ Poznámka pro specialisty:</strong></p>
<p>Přechod klienta do vyššího pásma si vždy <strong>hlídá specialista</strong>, protože on nejlépe vidí reálný objem práce, který správa vyžaduje. Zároveň je to i <strong>v jeho vlastním zájmu</strong> — vyšší pásmo znamená <strong>vyšší odměnu</strong> a zároveň také <strong>více prostoru věnovat se klientovi</strong> bez toho, aby byl pod tlakem neadekvátního workloadu.</p>
<p>Specialista tedy pravidelně sleduje spend, vyhodnocuje opakované překročení limitů a navrhuje Account Managerovi/Otasovi úpravu pásma tam, kde je to potřeba.</p>
<hr>
<h3>5. <strong>Jak funguje odměňování</strong></h3>
<p>Každý balíček i add-on má:</p>
<ul>
<li><strong>očekávané hodiny,</strong></li>
<li><strong>stanovenou interní odměnu</strong> pro specialistu.</li>
</ul>
<p>Vždy postupujeme podle interní tabulky odměn (viz tvůj poslední výstup).</p>
<p>Odměna se <strong>nemění podle ceny, kterou platí klient</strong>, ale podle:</p>
<ul>
<li>náročnosti balíčku,</li>
<li>očekávané pravidelné práce,</li>
<li>typu služby.</li>
</ul>
<p>Tím je systém férový a stabilní.</p>
<hr>
<h3>6. <strong>Kdy klientům doporučujeme Add-ons</strong></h3>
<p>Add-ons doporučujeme pouze tam, kde dávají <strong>komerční smysl</strong> a přinesou výsledky.</p>
<p>Např.:</p>
<ul>
<li>Výrobce nábytku → Favi add-on.</li>
<li>Fashion e-shop → Glami add-on.</li>
<li>Brand, který chce škálovat short-video → TikTok Ads.</li>
<li>E-shop bez kvalitních kreativ → Creative Boost.</li>
<li>Špatné měření → analytické měření.</li>
</ul>
<h3><strong>7. Co dělat, když máš pocit, že tvoje odměna neodpovídá rozsahu práce pro klienta</strong></h3>
<p>Pokud máš dojem, že objem práce pro konkrétního klienta výrazně přesahuje to, co je běžné pro daný spend (například klient má nadstandardní množství požadavků, časté úpravy, neustálé změny, potřebuje mnohem více kreativy nebo intenzivnější komunikaci), je potřeba nám dát jasný a konkrétní podklad, abychom mohli cenu adekvátně upravit — a tím navýšit i tvoji odměnu.</p>
<ol>
<li><strong>Začni sledovat hodiny</strong>, které pro daného klienta trávíš (alespoň orientačně).</li>
<li><strong>Sepiš krátké zdůvodnění</strong>, proč si myslíš, že je potřeba navýšit cenu — konkrétní situace, typ práce, četnost úprav, workload.</li>
<li><strong>Předlož to Otasovi v rámci vašeho nejbližšího 1:1 callu</strong>, kde to společně projdete a případné navýšení ceny klientovi doporučíme.</li>
</ol>
<p>Cílem je férové nastavení pro všechny — klient platí za reálný rozsah práce, a ty dostáváš odpovídající odměnu.</p>
<hr>
<h3><strong>8. Finální poznámka</strong></h3>
<p>👉 Každý klient má jinou situaci.</p>
<p>👉 Balíčky jsou „kostra“, která drží systém funkční.</p>
<p>👉 Add-ons jsou posilovače výkonu.</p>
<p>👉 Interní odměny se řídí podle tabulek, ne podle ceny pro klienta.</p>
<p>Cílem SOP je:</p>
<p><strong>mít jasný a škálovatelný systém služeb, kterému rozumí klient i tým.</strong></p>
',
'Cíl dokumentu Tento dokument slouží k tomu, aby každý v týmu věděl: jaké balíčky služeb nabízíme (core + add-ons), jaké platformy do nich spadají, jaká je úroveň klienta podle spendu (GROWTH / PRO / ELITE), jaká je interní odměna pro jednotlivé role za správu daného balíčku. Neuvádíme zde žádné klientské ceny – ty jsou jen v obchodních podkladech. Tady řešíme pouze interní rozdělení odměn. --Core balíčky (výkonnostní správa) Core balíčky jsou základ naší spolupráce s klienty. Každý náš klient musí mít Core balíček. Liší se: podle spravovaných platforem a podle výše měsíčního spendu. 2.1 Přehled core balíčků Socials Boost – správa Meta Ads (Facebook, Instagram) PPC Boost – správa Google Ads + Sklik Performance Boost – kombinace Meta Ads + Google Ads + Sklik pod jednou strategií Každý z těchto balíčků má 3 úrovně podle měsíčního spendu: GROWTH – klient spenduje cca do 400 000 Kč / měsíc PRO – klient spenduje cca 400 000 – 800 000 Kč / měsíc ELITE – klient spenduje 800 000 Kč+ / měsíc (individuální nastavení) 2.2 Jak pracujeme s pricingem (důležité!) Balíčky a úrovně spendu jsou naše „kostra“, která drží celý systém pohromadě — ale nejsou to dogmata. V praxi se může stát, že klient má nastavení, které do tabulek přesně nezapadá (více zemí, kombinace regionů, různé měnové účty, vysoké nároky na kreativitu, velké B2B účty, sezónní špičky, netypické rozložení spendu mezi platformami). V těchto případech vždy pracujeme s individuální kalkulací, aby: odměna odpovídala reálnému workloadu, specialista nebyl v mínusu, klient dostal adekvátní servis, pricing zůstal férový a dlouhodobě udržitelný. Proto vždy dává smysl: vyhodnotit složitost účtu (země, měny, platformy, feedy, jazykové mutace), zkontrolovat reálný předpoklad hodin, zvážit, zda klient zapadá do standardního balíčku, a pokud ne — navrhnout individuální úpravu ceny i odměny. Cílem není snažit se klienta „nacpat“ do šablony za každou cenu, ale mít systém, který je strukturovaný, předvídatelný a zároveň flexibilní všude tam, kde realita e-shopů nebo B2B projektů vyžaduje vlastní řešení. --Interní odměny za core balíčky Odměna se vždy váže na balíček + úroveň spendu + roli. Konkrétní částky doplňujeme v Google Sheetu Interní odměny – Socials. 📌 Princip: odměna je fixní měsíční částka za plný měsíc správy, při zahájení/ukončení spolupráce v průběhu měsíce se odměna počítá poměrnou částí, u ELITE a nestandardních případů se výše odměny řeší individuálně s Danem. | Služba | Zahrnuje | Očekávaný počet hodin Meta Ads | Odměna Meta Ads | Očekávaný počet hodin PPC | Odměna Google PPC | | --| --| --| --| --| --| | 📢 Socials Boost (GROWTH) | Meta Ads | 13 | Kč9,100 | 0 | Kč0 | | 📢 Socials Boost (PRO) | Meta Ads | 17 | Kč11,900 | 0 | Kč0 | | 📢 Socials Boost (ELITE) | Meta Ads | 22 | Kč15,400 | 0 | Kč0 | | 📈 PPC Boost (GROWTH) | Google Ads + S-klik | 0 | Kč0 | 10 | Kč7,000 | | 📈 PPC Boost (PRO) | Google Ads + S-klik | 0 | Kč0 | 15 | Kč10,500 | | 📈 PPC Boost (ELITE) | Google Ads + S-klik | 0 | Kč0 | 20 | Kč14,000 | | 🚀 Performance Boost (GROWTH) | Meta Ads, Google Ads, S-klik | 13 | Kč9,100 | 8 | Kč5,600 | | 🚀 Performance Boost (PRO) | Meta Ads, Google Ads, S-klik | 17 | Kč11,900 | 12 | Kč8,400 | | 🚀 Performance Boost (ELITE) | Meta Ads, Google Ads, S-klik | 22 | Kč15,400 | 16 | Kč11,200 | ⚠️ Poznámka: Odměna za PPC u balíčků Performance Boost je nižší než u samostatného PPC Boost balíčku, protože specialista zde neřeší plný rozsah reportingu a komunikace s klientem. Tyto části správy jsou v rámci Performance Boostu sdílené s Meta specialistou, takže práce na Google Ads není tak časově náročná jako u samostatné PPC správy, kde si specialista vše řeší kompletně sám. --ADD-ON služby (doplněk ke core balíčku) Add-on = volitelná služba navíc, kterou si klient může přikoupit, ale nikdy ji neposkytujeme samostatně bez core balíčku. Add-ons rozšiřují výkon kampaní, pokrývají další kanály nebo technické oblasti. Aktuální seznam add-onů: | Služba | Popis | Hodiny | Odměna | | --| --| --| --| | Creative Boost | Odměna podle počtu kreditů (150 Kč / kredit). | x | 150 Kč / kredit | | TikTok Ads – správa | Kompletní správa TikTok kampaní, optimalizace, testování, reporting. | 7 | 4 900 Kč | | Úvodní nastavení zbožových srovnávačů (Heureka / Zboží / Glami / Favi) | Úvodní setup XML feedu, import do Mergada, validace, párování, úpravy kategorií, EANů, názvů, testování. Jednorázová práce. | od 4 hodin | od 2 800 Kč | | Heureka & Zboží.cz – správa | Kompletní správa produktových inzerátů – feed, bidding, optimalizace. | 4 | 2 800 Kč | | Glami – správa | Fashion srovnávač – feed, párování, bidding, optimalizace. | 2 | 1 400 Kč | | Favi – správa | Home & Deco srovnávač – feed, párování, bidding, optimalizace. | 2 | 1 400 Kč | | Analytické měření | Nastavení GTM, GA4, Pixelu, konverzí apod. (účtuje se jako vícepráce). | dle rozsahu | hodinová odměna dle SOP | 📌 Poznámka k add-on službám (důležité!) U všech add-on služeb platí, že uvedené hodiny i odměny jsou minimální orientační h',
58,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'560ac344-8c17-4d70-a8dc-bc1444834ae2',
'11111111-1111-1111-1111-111111111110',
'Střih a korektura Reels pro firemní sociální sítě',
'<h1><strong>Cíl SOP</strong></h1>
<p>Zajistit hladký proces přípravy a odevzdání kvalitních Reels na firemní sociální sítě, s důrazem na minimalizaci chyb a efektivní spolupráci.</p>
<h1><strong>1. Proces střihu a korektury Reels</strong></h1>
<h2><strong>1.1 Získání podkladů</strong></h2>
<ul>
<li>V aplikaci <strong>Zoomsphere</strong> zkontroluj plánovaný harmonogram Reels a podcastu.</li>
<li>Podklady (např. brief, video materiály) jsou dostupné v sekci <em>Interní komentáře</em> v Zoomsphere.<ul>
<li>Natočené video nahrané na Google Drive do své složky: <a href="https://drive.google.com/drive/folders/1D8S_q4x_wU4WWtE_asjvM_sZxv9n4w0p?usp=sharing">https://drive.google.com/drive/folders/1D8S_q4x_wU4WWtE_asjvM_sZxv9n4w0p?usp=sharing</a><ul>
<li>Složku pojmenovat ve formátu DD-MM-RRRR</li>
</ul>
</li>
<li><strong>Skripty</strong> k reelskům se používají jako popisek k vlastním reels, takže se musí taky nahrát na Google Drive ve wordu.<ul>
<li>Oťas: skripty nahrává rovnou k příspěvkům do ZS</li>
</ul>
</li>
</ul>
</li>
</ul>
<hr>
<h2><strong>1.2 Editace videa</strong></h2>
<ul>
<li>Vytvoř video podle briefu a harmonogramu v Zoomsphere:<ul>
<li>Dodrž strukturu a styl podle předešlých Reels.</li>
<li>Zkontroluj vizuální kontinuitu (barvy, přechody, loga, fonty).</li>
<li>Přidej captions podle schváleného stylu, bez gramatických chyb a špatného načasování.</li>
</ul>
</li>
<li>Reelska z podcastů z hosty<ul>
<li>Z každého podcastu vytvoř 2-3 videa.<ul>
<li>Vytvoř příspěvek v Zoomsphere</li>
<li>Nahraj finální reels na všechny platformy.</li>
<li>U jednoho z příspěvků označ Terku či Oťase.</li>
<li>Terka doplní texty.</li>
<li>Ivča připraví TN.</li>
<li>Terka nastaví k publikaci.</li>
</ul>
</li>
<li>Z každého podcastu při hlavní editaci rovnou nastříhej pár pasáží od 10 do 15 minut na YouTube.<ul>
<li>Nahraj na YouTube a dej vědět Oťasovi.</li>
</ul>
</li>
</ul>
</li>
</ul>
<hr>
<h2><strong>1.3 Samokontrola (korektura videa)</strong></h2>
<ul>
<li><strong>Kontrola captions:</strong><ul>
<li>Zkontroluj gramatiku a formát captions (např. délka řádků, správné rozdělení textu).</li>
</ul>
</li>
<li><strong>Kontrola videa:</strong><ul>
<li>Přehraj hotové video a zkontroluj:<ul>
<li>Plynulost střihů (žádné viditelné chyby).</li>
<li>Synchronizaci zvuku a obrazu.</li>
<li>Správné přidání efektů, hudby a textu.</li>
</ul>
</li>
</ul>
</li>
<li>Pokud objevíš chybu, oprav ji ihned.</li>
</ul>
<hr>
<h1><strong>2. Dodání hotového výstupu</strong></h1>
<h2><strong>2.1 Odevzdání videa</strong></h2>
<ul>
<li>Hotové video nahraj přímo do <strong>Zoomsphere</strong> k příslušnému příspěvku.<ul>
<li>Vždy nahraj video na <strong>všechny platformy</strong> (IG, FB, LI a YTB)</li>
<li>ZS ti někdy nedovolí nahrát do jednoho postu video na všechny platformy, proto musíš post zduplikovat přes tři tečky do příslušného dne a vybrat platformy, které ti v původním příspěvku nešly.</li>
</ul>
</li>
<li>Oznam dokončení Terce označením přes “@” přímo v Zoomsphere. Případně Oťase, či Ivču k doplnění TN.</li>
<li>Ivča přidává TN buď na základě označení v ZS nebo na základě statusu “ČEKÁ NA TN (GRAFIKU)”</li>
<li>Terka po nahrání finálního reels doplní finální texty.</li>
<li>Terka po kompletaci příspěvků naplánuje zveřejnění (primárně automatické)</li>
</ul>
<h2><strong>2.2 Finální zodpovědnost</strong></h2>
<ul>
<li>Za kvalitu odevzdaného výstupu jsi odpovědný ty. Video musí být připravené k publikaci bez dalších oprav.</li>
</ul>
<hr>
<h1><strong>3. Doplňkové instrukce</strong></h1>
<h3><strong>3.1 Pravidelný reporting</strong></h3>
<ul>
<li>Není potřeba týdenní meeting. Řiď se plánem v Zoomsphere.</li>
<li>Pokud se objeví nejasnosti, napiš přímo Terce nebo mně přes Slack.</li>
</ul>
<hr>
<h1><strong>4. Výstupy a metriky úspěchu</strong></h1>
<ul>
<li>100% bezchybná Reels při první odevzdávce.</li>
<li>Dodržení termínů podle Zoomsphere.</li>
<li>Minimalizace nutnosti zpětných oprav zadaných od Terky či Oťase</li>
</ul>
<h1>Video editor agenda</h1>
<ol>
<li><strong>Příprava</strong>:<ul>
<li>Zkontrolovat harmonogram Reels a podcastů v Zoomsphere.</li>
<li>Získat potřebné podklady (videomateriály, skripty, briefy).</li>
</ul>
</li>
<li><strong>Editace</strong>:<ul>
<li>Stříhat videa dle plánu v Zoomsphere.</li>
<li>Střih audio podcastu a teaser reels videa.</li>
</ul>
</li>
<li><strong>Korektura</strong>:<ul>
<li>Provést kontrolu captions a videa.</li>
<li>Opravit případné chyby před odevzdáním.</li>
</ul>
</li>
<li><strong>Nahrání a dokončení</strong>:<ul>
<li>Nahrát finální video na všechny platformy přes Zoomsphere.</li>
<li>Nahrát podcast na Podcasters a YouTube, včetně transkriptů.</li>
<li>Nahrát teaser video k podcastu do Zoomsphere na všechny platformy.</li>
</ul>
</li>
<li><strong>Reporting</strong>:<ul>
<li>Řídit se plánem v Zoomsphere.</li>
<li>Komunikovat nejasnosti přímo s Terkou nebo Oťasem přes Slack.</li>
</ul>
</li>
<li><strong>Pravidelné výstupy</strong>:<ul>
<li>Dodávat videa a podcasty bez chyb na první pokus.</li>
<li>Dodržovat termíny a minimalizovat nutnost zpětných oprav.</li>
</ul>
</li>
</ol>
<ul>
<li>vlastní reelska a podcasty stříhá podle plánu v Zoomsphere</li>
<li></li>
<li>Pokud je video delší než 60 vteřin, na Youtube a Instagram je nutné vytvořit samostatný příspěvek, který se musí publikovat ručně.</li>
</ul>
<h1>Příprava TN a grafiky</h1>
<ul>
<li>po označení chystá grafik TN nebo grafiku, kterou rovnou nahrává do ZS, nebo</li>
<li>si grafik sám průběžně ZS kontroluje a připravuje TN (grafiku) u příspěvků ve statusu “čeká na TN (grafiku)</li>
<li>pokud potřebuje odsouhlasení, označuje přes @ Terku nebo Oťase<ul>
<li>v případě TN rovnou nahrávat do ZS a přepínat status na “Připraveno (done)”</li>
</ul>
</li>
</ul>
',
'Cíl SOP Zajistit hladký proces přípravy a odevzdání kvalitních Reels na firemní sociální sítě, s důrazem na minimalizaci chyb a efektivní spolupráci. Proces střihu a korektury Reels 1.1 Získání podkladů V aplikaci Zoomsphere zkontroluj plánovaný harmonogram Reels a podcastu. Podklady (např. brief, video materiály) jsou dostupné v sekci Interní komentáře v Zoomsphere. Natočené video nahrané na Google Drive do své složky: https://drive.google.com/drive/folders/1D8S_q4x_wU4WWtE_asjvM_sZxv9n4w0p?usp=sharing Složku pojmenovat ve formátu DD-MM-RRRR Skripty k reelskům se používají jako popisek k vlastním reels, takže se musí taky nahrát na Google Drive ve wordu. Oťas: skripty nahrává rovnou k příspěvkům do ZS --1.2 Editace videa Vytvoř video podle briefu a harmonogramu v Zoomsphere: Dodrž strukturu a styl podle předešlých Reels. Zkontroluj vizuální kontinuitu (barvy, přechody, loga, fonty). Přidej captions podle schváleného stylu, bez gramatických chyb a špatného načasování. Reelska z podcastů z hosty Z každého podcastu vytvoř 2-3 videa. Vytvoř příspěvek v Zoomsphere Nahraj finální reels na všechny platformy. U jednoho z příspěvků označ Terku či Oťase. Terka doplní texty. Ivča připraví TN. Terka nastaví k publikaci. Z každého podcastu při hlavní editaci rovnou nastříhej pár pasáží od 10 do 15 minut na YouTube. Nahraj na YouTube a dej vědět Oťasovi. --1.3 Samokontrola (korektura videa) Kontrola captions: Zkontroluj gramatiku a formát captions (např. délka řádků, správné rozdělení textu). Kontrola videa: Přehraj hotové video a zkontroluj: Plynulost střihů (žádné viditelné chyby). Synchronizaci zvuku a obrazu. Správné přidání efektů, hudby a textu. Pokud objevíš chybu, oprav ji ihned. --Dodání hotového výstupu 2.1 Odevzdání videa Hotové video nahraj přímo do Zoomsphere k příslušnému příspěvku. Vždy nahraj video na všechny platformy (IG, FB, LI a YTB) ZS ti někdy nedovolí nahrát do jednoho postu video na všechny platformy, proto musíš post zduplikovat přes tři tečky do příslušného dne a vybrat platformy, které ti v původním příspěvku nešly. Oznam dokončení Terce označením přes “@” přímo v Zoomsphere. Případně Oťase, či Ivču k doplnění TN. Ivča přidává TN buď na základě označení v ZS nebo na základě statusu “ČEKÁ NA TN (GRAFIKU)” Terka po nahrání finálního reels doplní finální texty. Terka po kompletaci příspěvků naplánuje zveřejnění (primárně automatické) 2.2 Finální zodpovědnost Za kvalitu odevzdaného výstupu jsi odpovědný ty. Video musí být připravené k publikaci bez dalších oprav. --Doplňkové instrukce 3.1 Pravidelný reporting Není potřeba týdenní meeting. Řiď se plánem v Zoomsphere. Pokud se objeví nejasnosti, napiš přímo Terce nebo mně přes Slack. --Výstupy a metriky úspěchu 100% bezchybná Reels při první odevzdávce. Dodržení termínů podle Zoomsphere. Minimalizace nutnosti zpětných oprav zadaných od Terky či Oťase Video editor agenda Příprava: Zkontrolovat harmonogram Reels a podcastů v Zoomsphere. Získat potřebné podklady (videomateriály, skripty, briefy). Editace: Stříhat videa dle plánu v Zoomsphere. Střih audio podcastu a teaser reels videa. Korektura: Provést kontrolu captions a videa. Opravit případné chyby před odevzdáním. Nahrání a dokončení: Nahrát finální video na všechny platformy přes Zoomsphere. Nahrát podcast na Podcasters a YouTube, včetně transkriptů. Nahrát teaser video k podcastu do Zoomsphere na všechny platformy. Reporting: Řídit se plánem v Zoomsphere. Komunikovat nejasnosti přímo s Terkou nebo Oťasem přes Slack. Pravidelné výstupy: Dodávat videa a podcasty bez chyb na první pokus. Dodržovat termíny a minimalizovat nutnost zpětných oprav. vlastní reelska a podcasty stříhá podle plánu v Zoomsphere Pokud je video delší než 60 vteřin, na Youtube a Instagram je nutné vytvořit samostatný příspěvek, který se musí publikovat ručně. Příprava TN a grafiky po označení chystá grafik TN nebo grafiku, kterou rovnou nahrává do ZS, nebo si grafik sám průběžně ZS kontroluje a připravuje TN (grafiku) u příspěvků ve statusu “čeká na TN (grafiku) pokud potřebuje odsouhlasení, označuje přes @ Terku nebo Oťase v případě TN rovnou nahrávat do ZS a přepínat status na “Připraveno (done)”',
59,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'8e66291d-fb61-48c0-9cc9-62e34d1aa22f',
'11111111-1111-1111-1111-111111111106',
'Šablona email - odmítnutí',
'<p>Obsah e-mailu:</p>
<p>Dobrý den,<br>děkujeme za váš zájem o spolupráci, velmi si toho vážíme. Po zhodnocení vaší poptávky si myslíme, že by pro vás bylo efektivnější navázat spolupráci spíše s nějakým freelancerem. Naše agentura se specializuje na rozsáhlejší kampaně pro větší firmy s obchodním týmem.<br>Doporučujeme vám obrátit se na specialisty, kteří se věnují projektům podobného rozsahu. Skvělým místem k nalezení vhodného partnera je například Facebooková skupina Spravujeme sociální sítě, kde můžete snadno přidat poptávku a získat relevantní nabídky.<br>Věřím, že se vám podaří najít ideální řešení, které vám pomůže dosáhnout skvělých výsledků. Držím palce a přeji hodně úspěchů!</p>
',
'Obsah e-mailu: Dobrý den, děkujeme za váš zájem o spolupráci, velmi si toho vážíme. Po zhodnocení vaší poptávky si myslíme, že by pro vás bylo efektivnější navázat spolupráci spíše s nějakým freelancerem. Naše agentura se specializuje na rozsáhlejší kampaně pro větší firmy s obchodním týmem. Doporučujeme vám obrátit se na specialisty, kteří se věnují projektům podobného rozsahu. Skvělým místem k nalezení vhodného partnera je například Facebooková skupina Spravujeme sociální sítě, kde můžete snadno přidat poptávku a získat relevantní nabídky. Věřím, že se vám podaří najít ideální řešení, které vám pomůže dosáhnout skvělých výsledků. Držím palce a přeji hodně úspěchů!',
60,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'4e901caf-aee5-4251-97c0-aa5c9faa1f34',
'11111111-1111-1111-1111-111111111108',
'Team Leader pro Meta Ads',
'<ul>
<li><p><strong>Role a odpovědnosti team leadera 🫡</strong></p>
<ul>
<li>Nastavuje laťku standardů, jde příkladem.</li>
<li>Je přátelský, ale záleží mu na plnění standardů a kvalitě výstupů.</li>
<li>Zajišťuje dodržování interních standardů a SOP Meta Ads.</li>
<li>Provádí pravidelnou kontrolu práce specialistů (namátkově i systematicky).</li>
<li>Organizuje interní školení a workshopy pro tým.</li>
<li>Poskytuje zpětnou vazbu na výkon kampaní a procesy.</li>
<li>Sleduje trendy v Meta Ads a zajišťuje jejich komunikaci či implementaci.</li>
<li>Přichází s inovacemi (kreativy, strategie struktury kampaní pro konkrétní klienty, vytvoření nabídek do reklam, templates pro videa, nové SOP, atp.)</li>
<li>Nezasahuje přímo do kampaní, ale komunikuje nedostatky specialistům.</li>
<li>Hlídá proaktivitu specialistů, A/B testování a reporting.</li>
</ul>
</li>
<li><p><strong>Frekvence kontrol a činností 🔁</strong></p>
<ul>
<li><p><strong>Týdenní kontroly</strong> (minimálně 1x týdně, odhad 3 hodiny práce, 30 minut max na účet)</p>
<p>  Namátková kontrola alespoň <strong>2 účtů týdně od každého specialisty.</strong> </p>
<p>  Prioritně se zaměř na kontrolu klíčových metrik:</p>
<ol>
<li>Plnění KPI.</li>
<li>Plnění spendů.</li>
<li>Výsledků v účtu a v jednotlivých kampaních.</li>
<li>Přidávání nových reklam a vypínání nefunkčních.</li>
<li>Projdi si historii změn v účtu.</li>
<li>Zkontroluj Freelo – akce, nasazení bannerů.</li>
</ol>
<p>  Pokud narazíš na nedostatky, upozorni specialistu, navrhni zlepšení.</p>
<p>  V případě potřeby připomeň specialistovi <a href="https://www.notion.so/c2717e7a6f27491894bbfb64600f0c34?pvs=21">**SOP pro týdenní optimalizaci</a>.**</p>
<p>  Čti 👉🏻 <a href="Team%20Leader%20pro%20Meta%20Ads/Nam%C3%A1tkov%C3%A9%20t%C3%BDdenn%C3%AD%20kontroly%20aa7c9d13d26c4a12a887fafe0cc844fa.md">Namátkové týdenní kontroly</a> 
  </p>
</li>
<li><p><strong>Měsíční kontroly</strong> (1x měsíčně)<strong>:</strong></p>
<ul>
<li><p>Hloubková kontrola <strong>5 vybraných účtů</strong>.</p>
<p>  Zaměř se na kontrolu:</p>
<ul>
<li>1 Klienta s problémy (např. neplní KPI, problémy s výsledky).</li>
<li>2 Klientů s vysokými spendy, kde je riziko ztrát vyšší.</li>
<li>1 Klienta s průměrným či malým spendem</li>
</ul>
<p>  Prioritně zkontroluj:</p>
<ol>
<li>Splnění KPI a spendů.</li>
<li>Zdali bylo odreportováno klientovi a uskutečněn zápis.</li>
<li>Jestli bylo proaktivně navržené zlepšení.</li>
<li>Konala se akce? Bylo splněno 👉🏻 <a href="Meta%20Ads%20Jak%20d%C4%9Blat%20kr%C3%A1tk%C3%A9%20(flash)%20akce%2014951ff3df57809a8590e93ae0a03b33.md">Meta Ads: Jak dělat krátké (flash) akce  </a></li>
</ol>
</li>
<li><p>Odkaž specialistu na: <a href="https://www.notion.so/cf0e7413fe4548d180ca29091d97f531?pvs=21">**SOP pro měsíční optimalizaci</a>.**</p>
</li>
<li><p>Vyhodnocení technických nastavení účtu (Pixel, CAPI, katalog).</p>
</li>
<li><p><strong>Kreativy a testování</strong></p>
<p>  Zda specialisté pravidelně přidávají nové reklamy (včetně testování).</p>
<p>  Kvalita spolupráce s grafikem a klientem na přípravě bannerů/videí.</p>
<p>  Vyhodnocení testů kreativy – co fungovalo a co je potřeba zlepšit.</p>
</li>
<li><p><strong>Proaktivita a komunikace</strong></p>
<p>  Dochází ke zlepšování reklamního účtu? Nové kampaně, různé formáty reklam, testování kreativ, atp.</p>
<p>  Rychlost a kvalita komunikace v rámci týmu a s klienty.</p>
</li>
</ul>
</li>
<li><p><strong>Kontrola před akcemi</strong> (např. Valentýn, Black Friday)</p>
<ul>
<li>Maximálně 2 týdny před velkými e-commerce akcemi uspořádej interní meetup:<br>  <a href="P%C5%99%C3%ADprava%20na%20kr%C3%A1tkou%20(flash%20akci)%2014951ff3df57800e9f98d706330fc4d8.md">Příprava na krátkou (flash akci) </a><br>  <a href="Meta%20Ads%20Jak%20d%C4%9Blat%20kr%C3%A1tk%C3%A9%20(flash)%20akce%2014951ff3df57809a8590e93ae0a03b33.md">Meta Ads: Jak dělat krátké (flash) akce  </a></li>
<li>Pár dnů před akcí ověř přes Slack, zda-li:<ul>
<li>Mají specialisté vše, co potřebují.</li>
<li>Byly připraveny kampaně alespoň 24 hodin předem.</li>
<li>Jsou připravené všechny potřebné kreativy (statika, videa, katalogové reklamy).</li>
<li>Komunikace s klientem proběhla dle SOP.</li>
<li>Specialisté nastavili kampaně dle pravidel pro flash akce.</li>
</ul>
</li>
</ul>
</li>
</ul>
</li>
<li><p><strong>Postup při nalezení chyb ⛑️</strong></p>
<p>  <strong>Identifikace chyby</strong></p>
<ul>
<li>Zjisti, zda chyba vyplývá z nedodržení SOP, nebo z nedostatků v samotném SOP.</li>
<li>Pokud jde o chybu specialisty, zjisti důvod (např. nedostatek času, nepochopení postupu).</li>
<li>Pokud se chyba opakuje u více specialistů najednou, uspořádej interní meetup na dané téma.</li>
</ul>
<p>  <strong>Náprava chyby</strong></p>
<ul>
<li>Pokud chyba vychází z nejasného SOP, aktualizuj SOP a sděl to celému týmu.</li>
<li>Pokud specialista chybu opakuje, poskytni zpětnou vazbu a zajisti nápravu.</li>
</ul>
<p>  <strong>Eskalační postup</strong></p>
<ul>
<li>Opakované chyby specialisty, které vedou ke ztrátě výkonu klientských účtů, řeší team leader s vedením agentury.</li>
<li>Standardy jsou tady od toho, aby se plnily. Pokud se neplní, je třeba urgentně řešit, abychom předcházeli nespokojenosti na straně klienta.</li>
</ul>
</li>
<li><p><strong>Výstup kontroly 💼</strong></p>
<p>  <strong>Záznam kontrol</strong> </p>
<p>  U každé kontroly vytvoř krátký zápis (viz níže checklisty) s hlavními zjištěními:</p>
<ul>
<li>Co funguje dobře.</li>
<li>Co je třeba zlepšit.</li>
<li>Akční kroky pro specialistu nebo tým.</li>
</ul>
<p>  <strong>Zpětná vazba</strong></p>
<p>  Poskytni konstruktivní zpětnou vazbu specialistům pokud narazíš na něco urgentního.</p>
<p>  Opakované <em>nedostatky</em> napříč účty si znač a vytvoř pro ně téma na interní workshopy.</p>
<p>  <strong>Interní report 1-1</strong></p>
<p>  Jednou za měsíc Google Meet s Oťasem s cílem předat shrnutí o stavu účtů a návrhy na zlepšení procesů, SOP a probrat další termín a téma školení.
  </p>
</li>
<li><p><strong>Organizace interních meetupů 📆</strong></p>
<p>  Jedná se o:</p>
<p>  <strong>Interní školení a workshopy</strong> (1x měsíčně)</p>
<ul>
<li>Organizovat školení na témata jako optimalizace kampaní, novinky z Meta Ads, pokročilé testování. 👉🏻 Plán: ‣</li>
<li>Sdílet best practices z auditovaných účtů.</li>
</ul>
<p>  <strong>Retrospektivní meetingy</strong> (po velkých akcích)</p>
<ul>
<li>Shrnutí úspěchů a nedostatků z velkých e-commerce akcí (např. Black Friday).</li>
<li>Diskuze o zlepšení procesů a sdílení poznatků.</li>
</ul>
<p>  <strong>Křížové audity</strong> (1x za kvartál)</p>
<ul>
<li></li>
</ul>
</li>
</ul>
<hr>
<h1>Checklisty</h1>
<p><a href="Team%20Leader%20pro%20Meta%20Ads/Nam%C3%A1tkov%C3%A9%20t%C3%BDdenn%C3%AD%20kontroly%20aa7c9d13d26c4a12a887fafe0cc844fa.md">Namátkové týdenní kontroly</a></p>
<p><a href="Team%20Leader%20pro%20Meta%20Ads/Nam%C3%A1tkov%C3%A9%20m%C4%9Bs%C3%AD%C4%8Dn%C3%AD%20kontroly%20886aa25118ff44838efa143b3c64b5c9.md">Namátkové měsíční kontroly </a></p>
<p><a href="Team%20Leader%20pro%20Meta%20Ads/Mus%C3%AD%C5%A1%20zkontrolovat%2047bb4ff67ac44180bc29dfc61512eb0c.md">Musíš zkontrolovat</a></p>
',
'Role a odpovědnosti team leadera 🫡 Nastavuje laťku standardů, jde příkladem. Je přátelský, ale záleží mu na plnění standardů a kvalitě výstupů. Zajišťuje dodržování interních standardů a SOP Meta Ads. Provádí pravidelnou kontrolu práce specialistů (namátkově i systematicky). Organizuje interní školení a workshopy pro tým. Poskytuje zpětnou vazbu na výkon kampaní a procesy. Sleduje trendy v Meta Ads a zajišťuje jejich komunikaci či implementaci. Přichází s inovacemi (kreativy, strategie struktury kampaní pro konkrétní klienty, vytvoření nabídek do reklam, templates pro videa, nové SOP, atp.) Nezasahuje přímo do kampaní, ale komunikuje nedostatky specialistům. Hlídá proaktivitu specialistů, A/B testování a reporting. Frekvence kontrol a činností 🔁 Týdenní kontroly (minimálně 1x týdně, odhad 3 hodiny práce, 30 minut max na účet) Namátková kontrola alespoň 2 účtů týdně od každého specialisty. Prioritně se zaměř na kontrolu klíčových metrik: Plnění KPI. Plnění spendů. Výsledků v účtu a v jednotlivých kampaních. Přidávání nových reklam a vypínání nefunkčních. Projdi si historii změn v účtu. Zkontroluj Freelo – akce, nasazení bannerů. Pokud narazíš na nedostatky, upozorni specialistu, navrhni zlepšení. V případě potřeby připomeň specialistovi SOP pro týdenní optimalizaci. Čti 👉🏻 Namátkové týdenní kontroly Měsíční kontroly (1x měsíčně): Hloubková kontrola 5 vybraných účtů. Zaměř se na kontrolu: 1 Klienta s problémy (např. neplní KPI, problémy s výsledky). 2 Klientů s vysokými spendy, kde je riziko ztrát vyšší. 1 Klienta s průměrným či malým spendem Prioritně zkontroluj: Splnění KPI a spendů. Zdali bylo odreportováno klientovi a uskutečněn zápis. Jestli bylo proaktivně navržené zlepšení. Konala se akce? Bylo splněno 👉🏻 Meta Ads: Jak dělat krátké (flash) akce %20akce%2014951ff3df57809a8590e93ae0a03b33.md) Odkaž specialistu na: SOP pro měsíční optimalizaci. Vyhodnocení technických nastavení účtu (Pixel, CAPI, katalog). Kreativy a testování Zda specialisté pravidelně přidávají nové reklamy (včetně testování). Kvalita spolupráce s grafikem a klientem na přípravě bannerů/videí. Vyhodnocení testů kreativy – co fungovalo a co je potřeba zlepšit. Proaktivita a komunikace Dochází ke zlepšování reklamního účtu? Nové kampaně, různé formáty reklam, testování kreativ, atp. Rychlost a kvalita komunikace v rámci týmu a s klienty. Kontrola před akcemi (např. Valentýn, Black Friday) Maximálně 2 týdny před velkými e-commerce akcemi uspořádej interní meetup: Příprava na krátkou (flash akci) %2014951ff3df57800e9f98d706330fc4d8.md) Meta Ads: Jak dělat krátké (flash) akce %20akce%2014951ff3df57809a8590e93ae0a03b33.md) Pár dnů před akcí ověř přes Slack, zda-li: Mají specialisté vše, co potřebují. Byly připraveny kampaně alespoň 24 hodin předem. Jsou připravené všechny potřebné kreativy (statika, videa, katalogové reklamy). Komunikace s klientem proběhla dle SOP. Specialisté nastavili kampaně dle pravidel pro flash akce. Postup při nalezení chyb ⛑️ Identifikace chyby Zjisti, zda chyba vyplývá z nedodržení SOP, nebo z nedostatků v samotném SOP. Pokud jde o chybu specialisty, zjisti důvod (např. nedostatek času, nepochopení postupu). Pokud se chyba opakuje u více specialistů najednou, uspořádej interní meetup na dané téma. Náprava chyby Pokud chyba vychází z nejasného SOP, aktualizuj SOP a sděl to celému týmu. Pokud specialista chybu opakuje, poskytni zpětnou vazbu a zajisti nápravu. Eskalační postup Opakované chyby specialisty, které vedou ke ztrátě výkonu klientských účtů, řeší team leader s vedením agentury. Standardy jsou tady od toho, aby se plnily. Pokud se neplní, je třeba urgentně řešit, abychom předcházeli nespokojenosti na straně klienta. Výstup kontroly 💼 Záznam kontrol U každé kontroly vytvoř krátký zápis (viz níže checklisty) s hlavními zjištěními: Co funguje dobře. Co je třeba zlepšit. Akční kroky pro specialistu nebo tým. Zpětná vazba Poskytni konstruktivní zpětnou vazbu specialistům pokud narazíš na něco urgentního. Opakované nedostatky napříč účty si znač a vytvoř pro ně téma na interní workshopy. Interní report 1-1 Jednou za měsíc Google Meet s Oťasem s cílem předat shrnutí o stavu účtů a návrhy na zlepšení procesů, SOP a probrat další termín a téma školení. Organizace interních meetupů 📆 Jedná se o: Interní školení a workshopy (1x měsíčně) Organizovat školení na témata jako optimalizace kampaní, novinky z Meta Ads, pokročilé testování. 👉🏻 Plán: ‣ Sdílet best practices z auditovaných účtů. Retrospektivní meetingy (po velkých akcích) Shrnutí úspěchů a nedostatků z velkých e-commerce akcí (např. Black Friday). Diskuze o zlepšení procesů a sdílení poznatků. Křížové audity (1x za kvartál) --Checklisty Namátkové týdenní kontroly Namátkové měsíční kontroly Musíš zkontrolovat',
61,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'8a76237f-86b0-49f5-8a55-02ae6ea8cefc',
'11111111-1111-1111-1111-111111111109',
'Tvorba podcastu od A do Z',
'<p><a href="https://www.notion.so/Podcast-HUB-636700b26c974d1cb4b6897b27358dd1?pvs=21">Podcast HUB</a></p>
<p>🛠️ Tooly, které zde používáme: <a href="https://www.zoomsphere.com/">Zoomsphere</a>, <a href="https://app.submagic.co/">Submagic</a>, <a href="https://www.autopod.fm/">Autopod</a>, <a href="https://www.adobe.com/products/premiere.html">Adobe PremierePro</a></p>
<p>🤖 Chat GPT Asistenti, které můžeme použít: <a href="https://chatgpt.com/g/g-P7kth4XEW-podcast-guru">Generování textů pro propagaci epizody</a></p>
<h2>Před začátkem Podcastu</h2>
<ul>
<li>Výběr hosta a oslovení  @Otakar Lucák</li>
</ul>
<p><a href="https://www.notion.so/Host-kter-chceme-oslovit-c139259374e54fffbefc941dc0068a52?pvs=21">Hosté, které chceme oslovit</a></p>
<ul>
<li><p>Vytvoření stránky v Notion pro plánování epizody @Otas Lucak</p>
<p>  <a href="https://www.notion.so/Pl-nov-n-epizod-9fdfd8198984426ba0d11a9bf49962b1?pvs=21">Plánování epizod</a></p>
</li>
<li><p>Domluvení termínu se studiem a s Hostem + určit, kdo budou moderátoři –&gt; Poslat všem pozvánky do kalendáře (Může dělat @Dana Bauerová)</p>
</li>
<li><p>Příprava otázek na epizodu a následné nasdílení dokumentu z Notion (publish page –&gt; share link) hostovi @Otakar Lucák</p>
</li>
</ul>
<h2>Při podcastu</h2>
<ul>
<li>Jedeme dle stránky v Notion. Nezapomeňme na Fotky! ⚠️</li>
<li>Po skončení epizody nahrání Intra s představením hosta a témat</li>
</ul>
<h2>Postprodukce</h2>
<ul>
<li>Po skončení podcastu vytvoření složky na Dropbox, pojmenovat ji dle hosta nebo epizody, nahrát do ní výstupy ze studia (zkontrolovat názvosloví!) + fotky hosta  @Daniel Bauer (o nahrání epizody informuji Oťase)</li>
<li>Oťas v Notion aktualizuje natočenou epizodu a před zadáním do ZS připraví:<ul>
<li>Nadpis epizody</li>
<li>Přiřadí číslo epizody</li>
<li>Popis pro YTB a Podcasters</li>
</ul>
</li>
<li>Vytvoření nového příspěvku v Zoomsphere kde budou obsažené tyto informace k dané epizodě a označeni všichni, kterých se zadání týká. Post bude připravený na den kdy má podcast vyjít. @Tereza Lucáková<ul>
<li>Kdy epizoda vyjde (hlavní termín úkolu)</li>
<li>Název epizody na YouTube a Podcasters</li>
<li>Odkaz na epizodu + fotky hosta na Dropboxu</li>
<li>Jaké texty na Thumbnaily</li>
<li>Zadání thumbnailu</li>
</ul>
</li>
<li>Střih podcastu (Audio + video) @Jenda Bečvář</li>
<li>Příprava promo intro Reelska @Jenda Bečvář</li>
<li>Vložení 1-2 promo teaserů našich služeb do epizody @Jenda Bečvář</li>
<li>⚠️ Za epizodu a doručení kvality ručí @Jenda Bečvář</li>
</ul>
<h2>Kompletace a publikování</h2>
<ul>
<li>Nahrání epizody na YouTube channel a do Podcasters. @Jenda Bečvář</li>
<li>Doplnění popisků na YTB i Podcasters včetně vložení částí podcastu z descriptu @Jenda Bečvář</li>
<li>Vytvoření popisků na YouTube, Podcasters, SMM posty @Otakar Lucák</li>
<li>Příprava thumbnailů pro Reelsko (1080x1920) a YouTube (1280 x 720) @Iva Simko</li>
<li>Naplánování publikování epizody na YouTube a Podcasters @Tereza Lucáková</li>
</ul>
<h2>Marketing</h2>
<ul>
<li>Naplánování publikování SMM postů přes Zoomsphere @Tereza Lucáková</li>
<li>Naplánování odeslání Newsletteru @Tereza Lucáková</li>
<li>Publikování na web Socials do sekce “Podcast” @Tereza Lucáková</li>
<li>Promování IG postu @Daniel Bauer</li>
<li>Zadání vytvoření 3-5 Reelsek z podcastu  - vždy vyber editora, který má kapacitu. (@Tereza Lucáková) Publikování Reelsek probíhá dle playbooku</li>
</ul>
<p><a href="St%C5%99ih%20a%20korektura%20Reels%20pro%20firemn%C3%AD%20soci%C3%A1ln%C3%AD%20s%C3%ADt%C4%9B%2023424afed54d4c15ac940c9f07505ea1.md">Střih a korektura Reels pro firemní sociální sítě</a></p>
<p>Kvalita vystupu - vytvorit checklist</p>
',
'Podcast HUB 🛠️ Tooly, které zde používáme: Zoomsphere, Submagic, Autopod, Adobe PremierePro 🤖 Chat GPT Asistenti, které můžeme použít: Generování textů pro propagaci epizody Před začátkem Podcastu Výběr hosta a oslovení @Otakar Lucák Hosté, které chceme oslovit Vytvoření stránky v Notion pro plánování epizody @Otas Lucak Plánování epizod Domluvení termínu se studiem a s Hostem + určit, kdo budou moderátoři –Poslat všem pozvánky do kalendáře (Může dělat @Dana Bauerová) Příprava otázek na epizodu a následné nasdílení dokumentu z Notion (publish page –share link) hostovi @Otakar Lucák Při podcastu Jedeme dle stránky v Notion. Nezapomeňme na Fotky! ⚠️ Po skončení epizody nahrání Intra s představením hosta a témat Postprodukce Po skončení podcastu vytvoření složky na Dropbox, pojmenovat ji dle hosta nebo epizody, nahrát do ní výstupy ze studia (zkontrolovat názvosloví!) + fotky hosta @Daniel Bauer (o nahrání epizody informuji Oťase) Oťas v Notion aktualizuje natočenou epizodu a před zadáním do ZS připraví: Nadpis epizody Přiřadí číslo epizody Popis pro YTB a Podcasters Vytvoření nového příspěvku v Zoomsphere kde budou obsažené tyto informace k dané epizodě a označeni všichni, kterých se zadání týká. Post bude připravený na den kdy má podcast vyjít. @Tereza Lucáková Kdy epizoda vyjde (hlavní termín úkolu) Název epizody na YouTube a Podcasters Odkaz na epizodu + fotky hosta na Dropboxu Jaké texty na Thumbnaily Zadání thumbnailu Střih podcastu (Audio + video) @Jenda Bečvář Příprava promo intro Reelska @Jenda Bečvář Vložení 1-2 promo teaserů našich služeb do epizody @Jenda Bečvář ⚠️ Za epizodu a doručení kvality ručí @Jenda Bečvář Kompletace a publikování Nahrání epizody na YouTube channel a do Podcasters. @Jenda Bečvář Doplnění popisků na YTB i Podcasters včetně vložení částí podcastu z descriptu @Jenda Bečvář Vytvoření popisků na YouTube, Podcasters, SMM posty @Otakar Lucák Příprava thumbnailů pro Reelsko (1080x1920) a YouTube (1280 x 720) @Iva Simko Naplánování publikování epizody na YouTube a Podcasters @Tereza Lucáková Marketing Naplánování publikování SMM postů přes Zoomsphere @Tereza Lucáková Naplánování odeslání Newsletteru @Tereza Lucáková Publikování na web Socials do sekce “Podcast” @Tereza Lucáková Promování IG postu @Daniel Bauer Zadání vytvoření 3-5 Reelsek z podcastu vždy vyber editora, který má kapacitu. (@Tereza Lucáková) Publikování Reelsek probíhá dle playbooku Střih a korektura Reels pro firemní sociální sítě Kvalita vystupu vytvorit checklist',
62,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'01da7b01-4958-4b12-be6c-f0a428d7097e',
'11111111-1111-1111-1111-111111111107',
'Vyhodnocení akce (Meta Ads)',
'<h1>🔎 Cíl</h1>
<p>Získat rychlý a datově podložený přehled o dopadu promo akce na výkon reklam a celkové výsledky e-shopu.</p>
<h1>✅ <strong>Reklamní výkon (VŽDY!)</strong></h1>
<ul>
<li><input disabled="" type="checkbox"> Zaznamenat PNO během akce (porovnat s dlouhodobým průměrem)</li>
<li><input disabled="" type="checkbox"> Celkový spend + rozpad dle kanálů (Meta, Google, e-mail, atd.)</li>
</ul>
<h1><strong>💰Obchodní výsledek</strong></h1>
<p><strong>Must have</strong></p>
<ul>
<li><input disabled="" type="checkbox"> Celkový obrat v období akce</li>
</ul>
<p><strong>Nice to have</strong> </p>
<ul>
<li><input disabled="" type="checkbox"> Počet objednávek (vs. denní průměr za posledních 30 dní)</li>
<li><input disabled="" type="checkbox"> % nárůst objednávek v průběhu akce</li>
<li><input disabled="" type="checkbox"> AOV během akce vs. dlouhodobý AOV</li>
</ul>
<h1>📌 <strong>Podmínky vyhodnocování</strong></h1>
<p>Podmínky vyhodnocování obchodních výsledků:</p>
<ul>
<li>Stačí <strong>vyhodnotit stejný typ akce 2×</strong></li>
<li><strong>Třetí a další opakování stejné akce se nevyhodnocuje</strong>, pokud nenastane zásadní změna</li>
</ul>
<p>📍 <strong>Změna = nový prvek v nabídce</strong></p>
<p>Např.:</p>
<ul>
<li>místo &quot;Doprava zdarma&quot; → &quot;Doprava zdarma + dárek nad 900 Kč&quot;</li>
</ul>
<h1><strong>📄 Závěry + akční kroky</strong></h1>
<ul>
<li><input disabled="" type="checkbox"> Co fungovalo (nabídka, kreativa, formát, timing)</li>
<li><input disabled="" type="checkbox"> Co selhalo nebo bylo pod očekáváním</li>
<li><input disabled="" type="checkbox"> Doporučení pro další akci (škálovat, zopakovat, netestovat znovu)</li>
</ul>
',
'🔎 Cíl Získat rychlý a datově podložený přehled o dopadu promo akce na výkon reklam a celkové výsledky e-shopu. ✅ Reklamní výkon (VŽDY!) [ ] Zaznamenat PNO během akce (porovnat s dlouhodobým průměrem) [ ] Celkový spend + rozpad dle kanálů (Meta, Google, e-mail, atd.) 💰Obchodní výsledek Must have [ ] Celkový obrat v období akce Nice to have [ ] Počet objednávek (vs. denní průměr za posledních 30 dní) [ ] % nárůst objednávek v průběhu akce [ ] AOV během akce vs. dlouhodobý AOV 📌 Podmínky vyhodnocování Podmínky vyhodnocování obchodních výsledků: Stačí vyhodnotit stejný typ akce 2× Třetí a další opakování stejné akce se nevyhodnocuje, pokud nenastane zásadní změna 📍 Změna = nový prvek v nabídce Např.: místo "Doprava zdarma" → "Doprava zdarma + dárek nad 900 Kč" 📄 Závěry + akční kroky [ ] Co fungovalo (nabídka, kreativa, formát, timing) [ ] Co selhalo nebo bylo pod očekáváním [ ] Doporučení pro další akci (škálovat, zopakovat, netestovat znovu)',
63,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'44fc1128-f174-425a-969d-8389be77d24a',
'11111111-1111-1111-1111-111111111109',
'Webináře - Everwebinar',
'<p><a href="https://www.loom.com/share/2b21cd2e9e5d4dfab3299ca6bfb72da5?sid=fb1433bc-7b69-4ebe-a145-7de9dfd50a0f">https://www.loom.com/share/2b21cd2e9e5d4dfab3299ca6bfb72da5?sid=fb1433bc-7b69-4ebe-a145-7de9dfd50a0f</a></p>
<h1>SOP: Jak nahrát Vimeo video do WebinarJam</h1>
<h2>Účel</h2>
<p>Tento postup popisuje, jak správně nahrát &quot;unlisted&quot; video z Vimea do WebinarJamu pro evergreen webináře.</p>
<h2>Předpoklady</h2>
<ul>
<li>Nahraný webinář na Vimeo</li>
<li>Nastavení privacy na &quot;Unlisted&quot;</li>
<li>Přístup do WebinarJam</li>
</ul>
<h2>Postup</h2>
<h3>1. Získání správného odkazu z Vimea</h3>
<ol>
<li>Přejděte na vaše video na Vimeo</li>
<li>Klikněte na tři tečky (...) u videa</li>
<li>Vyberte &quot;Video file links&quot;</li>
<li>Najděte a zkopírujte link pro HD 1080p verzi</li>
</ol>
<h3>2. Nahrání do WebinarJam</h3>
<ol>
<li>V WebinarJam zvolte &quot;Source video&quot;</li>
<li>Vyberte &quot;An external video file&quot;</li>
<li>Do pole &quot;URL to your video file&quot; vložte zkopírovaný HD 1080p link</li>
<li>Vyplňte délku videa</li>
<li>Klikněte na &quot;Save&quot;</li>
</ol>
<h2>Důležité poznámky</h2>
<ul>
<li>Nepoužívejte klasický share link z Vimea</li>
<li>Video musí být minimálně v HD 1080p kvalitě</li>
<li>Nastavení &quot;Unlisted&quot; na Vimeu zajistí dostupnost pouze přes odkaz</li>
</ul>
<h2>Řešení problémů</h2>
<p>Pokud se zobrazí &quot;Invalid video URL&quot;:</p>
<ol>
<li>Ověřte, že používáte link z &quot;Video file links&quot;</li>
<li>Zkontrolujte, zda jste vybrali HD 1080p verzi</li>
<li>Zkuste video nejdřív přehrát přímo přes zkopírovaný link</li>
</ol>
',
'https://www.loom.com/share/2b21cd2e9e5d4dfab3299ca6bfb72da5?sid=fb1433bc-7b69-4ebe-a145-7de9dfd50a0f SOP: Jak nahrát Vimeo video do WebinarJam Účel Tento postup popisuje, jak správně nahrát "unlisted" video z Vimea do WebinarJamu pro evergreen webináře. Předpoklady Nahraný webinář na Vimeo Nastavení privacy na "Unlisted" Přístup do WebinarJam Postup Získání správného odkazu z Vimea Přejděte na vaše video na Vimeo Klikněte na tři tečky (...) u videa Vyberte "Video file links" Najděte a zkopírujte link pro HD 1080p verzi Nahrání do WebinarJam V WebinarJam zvolte "Source video" Vyberte "An external video file" Do pole "URL to your video file" vložte zkopírovaný HD 1080p link Vyplňte délku videa Klikněte na "Save" Důležité poznámky Nepoužívejte klasický share link z Vimea Video musí být minimálně v HD 1080p kvalitě Nastavení "Unlisted" na Vimeu zajistí dostupnost pouze přes odkaz Řešení problémů Pokud se zobrazí "Invalid video URL": Ověřte, že používáte link z "Video file links" Zkontrolujte, zda jste vybrali HD 1080p verzi Zkuste video nejdřív přehrát přímo přes zkopírovaný link',
64,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'ec8dd078-9099-4eba-9b72-a176271fdbd9',
'11111111-1111-1111-1111-111111111104',
'Zadání implementace Conversion API',
'<p><strong>Pixel ID:</strong></p>
<p><strong>API Token:</strong></p>
<p>Potřebujeme měřit tyto paramtery přes server:</p>
<p><strong>1. ViewContent</strong></p>
<ul>
<li><p>Spouštění: Při zobrazení stránky produktu</p>
</li>
<li><p>Parametry:</p>
</li>
<li><p><code>event_name</code>: ViewContent</p>
</li>
<li><p><code>content_type</code>: product</p>
</li>
<li><p><code>content_ids</code>: ID produktu</p>
</li>
<li><p><code>currency</code>: EUR</p>
</li>
<li><p><code>value</code>: Cena produktu (bez DPH)</p>
</li>
</ul>
<p><strong>2. AddToCart</strong></p>
<ul>
<li><p>Spouštění: Při přidání produktu do košíku</p>
</li>
<li><p>Parametry:</p>
</li>
<li><p><code>event_name</code>: AddToCart</p>
</li>
<li><p><code>content_type</code>: product</p>
</li>
<li><p><code>content_ids</code>: ID produktu</p>
</li>
<li><p><code>currency</code>: EUR</p>
</li>
<li><p><code>value</code>: Cena produktu (bez DPH)</p>
</li>
</ul>
<p><strong>3. InitiateCheckout</strong></p>
<ul>
<li><p>Spouštění: Při zahájení nákupu (tento event se nepouští ani v client pixelu takže tam se to musí taky donastavit)</p>
</li>
<li><p>Parametry:</p>
</li>
<li><p><code>event_name</code>: InitiateCheckout</p>
</li>
<li><p><code>content_type</code>: product</p>
</li>
<li><p><code>content_ids</code>: ID produktů v košíku</p>
</li>
<li><p><code>currency</code>: EUR</p>
</li>
<li><p><code>value</code>: Celková hodnota košíku (bez DPH)</p>
</li>
</ul>
<p><strong>4. AddPaymentInfo</strong></p>
<ul>
<li><p>Spouštění: Při zadání platebních údajů (tento event se nepouští ani v client pixelu takže tam se to musí taky donastavit)</p>
</li>
<li><p>Parametry:</p>
</li>
<li><p><code>event_name</code>: AddPaymentInfo</p>
</li>
<li><p><code>content_type</code>: product</p>
</li>
<li><p><code>content_ids</code>: ID produktů v košíku</p>
</li>
<li><p><code>currency</code>: EUR</p>
</li>
<li><p><code>value</code>: Celková hodnota košíku (bez DPH)</p>
</li>
</ul>
<p><strong>5. Purchase</strong></p>
<ul>
<li><p>Spouštění: Při dokončení nákupu</p>
</li>
<li><p>Parametry:</p>
</li>
<li><p><code>event_name</code>: Purchase</p>
</li>
<li><p><code>content_type</code>: product</p>
</li>
<li><p><code>content_ids</code>: ID zakoupených produktů</p>
</li>
<li><p><code>currency</code>: EUR</p>
</li>
<li><p><code>value</code>: Hodnota transakce (bez DPH)</p>
</li>
</ul>
<p>Je potřeba is také pohlídat, že se server a client události deduplikují.</p>
<p>Měl by to každopádně nasazovat někdo, kdo už to dělal. Jinak náš čekají velmi dlouhé chvíle, to mi věř :D Už jsem to párkrát zažil. Případně když by to programátoři ještě nedělali tak my to umíme nastavit přes již zmíněný Stape.io a GTM. Je to tak 1MD práce pokud je data layer webu ok.</p>
',
'Pixel ID: API Token: Potřebujeme měřit tyto paramtery přes server: ViewContent Spouštění: Při zobrazení stránky produktu Parametry: event_name: ViewContent content_type: product content_ids: ID produktu currency: EUR value: Cena produktu (bez DPH) AddToCart Spouštění: Při přidání produktu do košíku Parametry: event_name: AddToCart content_type: product content_ids: ID produktu currency: EUR value: Cena produktu (bez DPH) InitiateCheckout Spouštění: Při zahájení nákupu (tento event se nepouští ani v client pixelu takže tam se to musí taky donastavit) Parametry: event_name: InitiateCheckout content_type: product content_ids: ID produktů v košíku currency: EUR value: Celková hodnota košíku (bez DPH) AddPaymentInfo Spouštění: Při zadání platebních údajů (tento event se nepouští ani v client pixelu takže tam se to musí taky donastavit) Parametry: event_name: AddPaymentInfo content_type: product content_ids: ID produktů v košíku currency: EUR value: Celková hodnota košíku (bez DPH) Purchase Spouštění: Při dokončení nákupu Parametry: event_name: Purchase content_type: product content_ids: ID zakoupených produktů currency: EUR value: Hodnota transakce (bez DPH) Je potřeba is také pohlídat, že se server a client události deduplikují. Měl by to každopádně nasazovat někdo, kdo už to dělal. Jinak náš čekají velmi dlouhé chvíle, to mi věř :D Už jsem to párkrát zažil. Případně když by to programátoři ještě nedělali tak my to umíme nastavit přes již zmíněný Stape.io a GTM. Je to tak 1MD práce pokud je data layer webu ok.',
65,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'3ef50023-a7ed-48b0-b5ee-bd9f274d5b9a',
'11111111-1111-1111-1111-111111111106',
'Založení nového projektu (onboarding)',
'<p><strong>Odpovědná osoba za onboarding:</strong></p>
<p>Daniel Bauer <strong>nebo</strong> příslušný <strong>sales manager</strong>, který klienta získal</p>
<p><strong>Administrativní podpora:</strong> Dana Bauerová</p>
<p><strong>Smlouvy se podepisují přes:</strong> Digisign</p>
<p><strong>CRM systém:</strong> Raynet</p>
<p><strong>Založení nástrojů:</strong> automatizovaně z Raynetu</p>
<hr>
<h2>🎯 Cíl SOP:</h2>
<p>Zajistit hladký a profesionální onboarding nového klienta – od vyplnění formuláře až po založení všech nástrojů a předání projektu projektovému manažerovi.</p>
<hr>
<h2>🧩 Krok za krokem</h2>
<h3>1. <strong>Vyplnění vstupního formuláře klientem</strong></h3>
<ul>
<li>Klient vyplní <a href="Zalo%C5%BEen%C3%AD%20nov%C3%A9ho%20projektu%20(onboarding)%201ff51ff3df5780d3834adb6da768afad.md">onboardingový formulář</a>:</li>
<li>Z formuláře získáme:<ul>
<li>fakturační údaje</li>
<li>kontaktní e-maily</li>
<li>typ spolupráce, rozsah služeb</li>
<li>země, kampaně, požadavky</li>
</ul>
</li>
</ul>
<hr>
<h3>2. <strong>Generování a schválení smlouvy</strong></h3>
<ul>
<li>Na základě formuláře se <strong>automaticky vygeneruje smlouva</strong>.</li>
<li>Smlouva se posílá <strong>Daně Bauerové ke kontrole</strong>.</li>
<li>Dana Bauerová po kontrole odešle smlouvu přes <strong>Digisign</strong>:<ul>
<li><strong>Danielu Bauerovi</strong> (podpis interně),</li>
<li><strong>klientovi</strong> (e-mail z formuláře).</li>
</ul>
</li>
</ul>
<hr>
<h3>3. <strong>Založení obchodního případu v Raynetu</strong></h3>
<ul>
<li>Obchodní případ je založen už při vyplnění formuláře.</li>
<li>Odpovědná osoba (Daniel nebo sales manager) doplní v sekci <strong>„Volitelná pole“</strong>:<ul>
<li><strong>Kód projektu / řešitel</strong></li>
<li><strong>Model odměny</strong></li>
<li><strong>Země, které spravujeme</strong></li>
<li><strong>Datum začátku spolupráce</strong></li>
</ul>
</li>
</ul>
<hr>
<h3>4. <strong>Založení nástrojů přes Raynet (automaticky)</strong></h3>
<ul>
<li>Po doplnění údajů kliknout na tlačítko <strong>„Vytvořit projekt“</strong>.</li>
<li>Automaticky se založí:<ul>
<li><strong>Freelo projekt</strong></li>
<li><strong>Slack kanál</strong></li>
<li>Přidají se kolegové podle nastavení</li>
</ul>
</li>
</ul>
<h3>✅ Kontrola:</h3>
<ul>
<li>Zkontroluj, že byli <strong>všichni kolegové správně přidáni</strong> do Freela i Slacku.<ul>
<li>⚠️ Automatické přidání může selhat – v případě potřeby přidej ručně.</li>
</ul>
</li>
</ul>
<hr>
<h3>5. <strong>Přidání klienta do Freela</strong></h3>
<ul>
<li>Klient se přidá do Freela (To-do <strong>„Klient“</strong>).</li>
<li>Použij e-maily z formuláře.</li>
</ul>
<hr>
<h3>6. <strong>Předání informací o klientovi</strong></h3>
<ul>
<li>Sales manager, který klienta získal, vytvoří ve Freelu úkol <strong>„Info od sales rep.“</strong> s:<ul>
<li>poznámkami z callů,</li>
<li>očekáváním klienta,</li>
<li>specifiky spolupráce.</li>
</ul>
</li>
</ul>
<hr>
<h3>7. <strong>Předání projektovému manažerovi</strong></h3>
<ul>
<li>Po zadání všech informací a dokončení onboardingu si projekt přebírá <strong>projektový manažer</strong>:<ul>
<li>kontaktuje klienta,</li>
<li>navazuje spolupráci,</li>
<li>přebírá zodpovědnost za vedení projektu.</li>
</ul>
</li>
</ul>
<hr>
<h2>📎 Shrnutí odpovědností</h2>
<table>
<thead>
<tr>
<th>Krok</th>
<th>Odpovědná osoba</th>
</tr>
</thead>
<tbody><tr>
<td>Vyplnění formuláře klientem</td>
<td>Klient</td>
</tr>
<tr>
<td>Kontrola smlouvy</td>
<td>Dana Bauerová</td>
</tr>
<tr>
<td>Odeslání smlouvy k podpisu</td>
<td>Dana Bauerová</td>
</tr>
<tr>
<td>Interní podpis smlouvy</td>
<td>Daniel Bauer</td>
</tr>
<tr>
<td>Doplnění údajů do Raynetu</td>
<td>Daniel Bauer nebo Sales manager</td>
</tr>
<tr>
<td>Vytvoření nástrojů z Raynetu</td>
<td>Daniel Bauer nebo Sales manager</td>
</tr>
<tr>
<td>Kontrola přidání kolegů do Slacku/Freela</td>
<td>Daniel Bauer nebo Sales manager</td>
</tr>
<tr>
<td>Přidání klienta do Freela</td>
<td>Daniel Bauer nebo Sales manager</td>
</tr>
<tr>
<td>Zadání informací do „Info od sales rep.“</td>
<td>Sales manager</td>
</tr>
<tr>
<td>Předání a kontakt s klientem</td>
<td>Projektový manažer</td>
</tr>
</tbody></table>
<hr>
<h2>⏱ Doporučený časový rámec (SLA)</h2>
<table>
<thead>
<tr>
<th>Aktivita</th>
<th>Deadline od vyplnění formuláře</th>
</tr>
</thead>
<tbody><tr>
<td>Kontrola a podpis smlouvy</td>
<td>do 24 h</td>
</tr>
<tr>
<td>Založení nástrojů a přístupů</td>
<td>do 48 h</td>
</tr>
<tr>
<td>Předání klienta projektovému manažerovi</td>
<td>do 72 h</td>
</tr>
</tbody></table>
',
'Odpovědná osoba za onboarding: Daniel Bauer nebo příslušný sales manager, který klienta získal Administrativní podpora: Dana Bauerová Smlouvy se podepisují přes: Digisign CRM systém: Raynet Založení nástrojů: automatizovaně z Raynetu --🎯 Cíl SOP: Zajistit hladký a profesionální onboarding nového klienta – od vyplnění formuláře až po založení všech nástrojů a předání projektu projektovému manažerovi. --🧩 Krok za krokem Vyplnění vstupního formuláře klientem Klient vyplní onboardingový formulář%201ff51ff3df5780d3834adb6da768afad.md): Z formuláře získáme: fakturační údaje kontaktní e-maily typ spolupráce, rozsah služeb země, kampaně, požadavky --Generování a schválení smlouvy Na základě formuláře se automaticky vygeneruje smlouva. Smlouva se posílá Daně Bauerové ke kontrole. Dana Bauerová po kontrole odešle smlouvu přes Digisign: Danielu Bauerovi (podpis interně), klientovi (e-mail z formuláře). --Založení obchodního případu v Raynetu Obchodní případ je založen už při vyplnění formuláře. Odpovědná osoba (Daniel nebo sales manager) doplní v sekci „Volitelná pole“: Kód projektu / řešitel Model odměny Země, které spravujeme Datum začátku spolupráce --Založení nástrojů přes Raynet (automaticky) Po doplnění údajů kliknout na tlačítko „Vytvořit projekt“. Automaticky se založí: Freelo projekt Slack kanál Přidají se kolegové podle nastavení ✅ Kontrola: Zkontroluj, že byli všichni kolegové správně přidáni do Freela i Slacku. ⚠️ Automatické přidání může selhat – v případě potřeby přidej ručně. --Přidání klienta do Freela Klient se přidá do Freela (To-do „Klient“). Použij e-maily z formuláře. --Předání informací o klientovi Sales manager, který klienta získal, vytvoří ve Freelu úkol „Info od sales rep.“ s: poznámkami z callů, očekáváním klienta, specifiky spolupráce. --Předání projektovému manažerovi Po zadání všech informací a dokončení onboardingu si projekt přebírá projektový manažer: kontaktuje klienta, navazuje spolupráci, přebírá zodpovědnost za vedení projektu. --📎 Shrnutí odpovědností | Krok | Odpovědná osoba | | --| --| | Vyplnění formuláře klientem | Klient | | Kontrola smlouvy | Dana Bauerová | | Odeslání smlouvy k podpisu | Dana Bauerová | | Interní podpis smlouvy | Daniel Bauer | | Doplnění údajů do Raynetu | Daniel Bauer nebo Sales manager | | Vytvoření nástrojů z Raynetu | Daniel Bauer nebo Sales manager | | Kontrola přidání kolegů do Slacku/Freela | Daniel Bauer nebo Sales manager | | Přidání klienta do Freela | Daniel Bauer nebo Sales manager | | Zadání informací do „Info od sales rep.“ | Sales manager | | Předání a kontakt s klientem | Projektový manažer | --⏱ Doporučený časový rámec (SLA) | Aktivita | Deadline od vyplnění formuláře | | --| --| | Kontrola a podpis smlouvy | do 24 h | | Založení nástrojů a přístupů | do 48 h | | Předání klienta projektovému manažerovi | do 72 h |',
66,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'4db4c383-7259-45ef-9614-8668a097cf95',
'11111111-1111-1111-1111-111111111103',
'Zásady komunikace s klientem',
'<h1>Proč potřebujeme mít zásady komunikace?</h1>
<p>Správná komunikace zvyšuje šanci spokojenosti klienta. </p>
<p>Nespokojený klient nám odejde. </p>
<p><strong>💡 Udržení si stávajícího klienta nás vyjde o 70 % levněji než pracně získávat klienta nového. 🚨</strong></p>
<p><strong>👉🏻 Proto se vyplatí investovat čas a úsilí do budování pevných partnerských vztahů.</strong></p>
<p>Nyní se podíváme, jak na to.</p>
<h1><strong>1️⃣ Poznej očekávání svého klienta</strong></h1>
<p>Není nic horšího, když neznáme očekávání klienta. Jeho cíle jsou naše cíle. </p>
<p>Spravujete klienty delší dobu? Jeho očekávání se v čase mění. Čtěte 👉🏻 <a href="Pravideln%C3%A9%20vyhodnocov%C3%A1n%C3%AD%20spokojenosti%20klienta%208c1be0a99ca7492e82d438aa445799d3.md">Pravidelné vyhodnocování spokojenosti klienta</a> </p>
<h1>2️⃣ Jedenáctero komunikace s klientem</h1>
<ol>
<li><p><strong>Poznej zákazníka svého</strong> – viz bod 1️⃣</p>
</li>
<li><p><strong>Pozdravíme</strong> – při první zprávě nového dne vždy klienta pozdravíme.</p>
</li>
<li><p><strong>Zmíníme jméno klienta</strong> – při <strong>každé</strong> zprávě začneme tím, že zmíníme jméno. Vždycky! 😊 </p>
</li>
<li><p><strong>Prosíme a děkujeme</strong> – cokoliv chceme po klientovi, poprosíme. Cokoliv nám klient dodá, poděkujeme.</p>
</li>
<li><p><strong>Reagujeme rychle ve Freelo:</strong></p>
<ol>
<li><strong>Na složitý úkol,</strong> nad kterým se musíme zamyslet, reagujeme:<br> ,,<em>Dobrý den [jméno], úkol registruji. Zamyslím se a vrátím se s odpovědí nejpozději zítra odpoledne.”</em> </li>
<li><strong>Jednoduchý úkol</strong> – snažíme se odbavit co nejrychleji do max. 3 hodin.</li>
</ol>
</li>
<li><p><strong>Před zavřením úkolu končíme vždy naším komentářem</strong>, minimálně např.:<br>,,<em>Krásný den, [jméno], z úkolu máme vše hotové, pro přehlednost úkol zavírám. Mějte se pěkně.”</em></p>
</li>
<li><p><strong>Vysvětlujeme &amp; opakujeme jako začátečníkům &amp; jsme informativní</strong>, příklady:</p>
<ol>
<li>Chceme detaily na vánoční produkty, o kterých padla řeč na meetingu? Jsme konkrétní – O jakých titulech jsme se bavili, co konkrétně potřebujeme doplnit, posíláme ukázku co nám fungovalo u jiného klienta, posíláme inspiraci na reklamu, atp.</li>
<li>Nastavovali jsme katalogovky – stručně vysvětlete klientovi, jak fungují a pošlete náhled reklamy, jak vypadají.</li>
<li>Píšeme o technikáliích, např. o dynamickém remarketingu – znovu zopakujme klientovi, co dynamický remarketing znamená a jak funguje.</li>
<li>Testovali jsme s klientem nové video? Informujme ho iniciativně, jak se videu daří a pokud nedaří, co můžeme udělat pro to, aby to příště fungovalo lépe.</li>
<li>Ukončení úkolu pro flash akci – např.: k Black Friday máme vše připraveno a kampaně běží, klientovi napíšu:<br> <em>,,Dobrý den, [jméno klienta], hlásím, že kampaně běží. Úkol zavírám. Držím nám palce. Jsme v kontaktu během akce a výsledky si projdeme na pravidelné schůzce. Děkuji za spolupráci!”</em></li>
</ol>
</li>
<li><p><strong>Jsme proaktivní 1x za měsíc</strong></p>
<ol>
<li>Co můžeme zlepšit? Viz úkol v šabloně: <a href="https://app.freelo.io/task/14693806">https://app.freelo.io/task/14693806</a> </li>
<li>Bannery a videa – potřebujeme nové podklady pro tvorbu bannerů? Poproste ve Freelo a rovnou proaktivně dejte tip, jaké produkty/kategorie se podle Looker Studio nyní nejvíc prodávají a pošlete třeba ukázku našeho videa.</li>
</ol>
</li>
<li><p><strong>Chceme se prodávat jako agentura</strong></p>
<p> Nejen upselly, ale prodáváme se i v běžné komunikaci. </p>
<p> Podívejte se na příklady zde: <a href="Jak%20na%20je%C5%A1t%C4%9B%20lep%C5%A1%C3%AD%20komunikaci%20s%20klientem%20f7535b645575449ab54753ece41a7bc1.md">Jak na ještě lepší komunikaci s klientem</a> (příklady budu postupně doplňovat)</p>
</li>
<li><p><strong>Uznejme chybu</strong> – nezatloukáme.</p>
<ol>
<li>Diplomatická odpověď – pokud se nejedná o absolutně zřetelnou chybu, zkusme najít diplomatickou odpověď.</li>
<li>Můžeme situaci napravit? Domluvte se s klientem na postupu a pusťme se aktivně do toho.</li>
<li>Nemůžeme situaci napravit? Aktivně a s pokorou jdeme za klientem s lepším procesem, aby se to příště nestalo.</li>
</ol>
</li>
<li><p><strong>Klienti nejsou e-shopy ani reklamní účty, klienti jsou lidé.</strong></p>
<ol>
<li>Zkoušíme psát sms nebo volat – když nám klient nereaguje na 2-3 zprávy ve Freelo, napište mu sms nebo zkuste rychle zavolat a skutečně projevit zájem, jestli je u něj všechno v pořádku.<br><strong>Jen pokud je to nezbytné, nemělo by se příliš opakovat!!!</strong> Pokud se na callu s klientem na čemkoliv domluvíte, udělejte vždy zápis / úkol ve freelo.</li>
<li>Uděláme něco navíc – dáme mu konzultaci, poradíme, není klient v Praze, že bychom se setkali na rychlé kafe?</li>
<li>Oceníme náš společný postup – kde jsme byli předtím, co jsme společně dokázali a kam jdeme.</li>
<li>Víme od klienta, že je nemocný – napíšeme mu zprávu za pár dní, jestli se cítí lépe.</li>
<li>Víme, že se klient chystá na <em>offline</em> event – napíšeme mu zprávu, ať se mu akce vydaří.</li>
<li>Popřejeme na narozeniny či svátek.</li>
<li>Pogratulujeme k úspěchu, pochválíme za nějakou drobnost.</li>
</ol>
</li>
</ol>
<p><a href="Jak%20na%20je%C5%A1t%C4%9B%20lep%C5%A1%C3%AD%20komunikaci%20s%20klientem%20f7535b645575449ab54753ece41a7bc1.md">Jak na ještě lepší komunikaci s klientem</a> </p>
<h2>3️⃣ Cíle klienta – <strong>PNO, počet objednávek, obrat či kredit</strong></h2>
<p>V každé fázi si musíme být jistí, že rozumíme bodu číslo 1️⃣.</p>
<p>Jsme placení za doručení výsledků. <strong>Dlouhodobě a nejčastěji podle PNO.</strong> Během akcí dle obratu, počtu objednávek. </p>
<p>U některých klientů jsme omezení rozpočtem. <strong>Plnění výsledků a kontrola KPI je zodpovědností projekťáka.</strong></p>
<p>🚨 Pozor na situaci, kdy plníme stanovené PNO, ale klient si postěžuje, že mu to nevychází – ihned hledej důvod, kde je chyba. Nevíš? Poraď se v týmu.</p>
<h2>4️⃣ Pravidelný měsíční reporting</h2>
<p>Každý klient by měl mít přehled, jak se mu vede. </p>
<p>Víme, že každý klient je jiný a vyžaduje trošku odlišný přístup, ale suma sumárum bychom se vždy iniciativně měli dostat k těmto bodům:</p>
<ol>
<li><strong>Google Meet</strong></li>
<li><strong>Zápis aktivit.</strong></li>
<li><strong>Loom reporting – pokud klient chce.</strong></li>
</ol>
<p>Čti 👉🏻 <a href="Reporting%20-%20jak%20reportovat%20klientovi%2012d51ff3df57808aa8dcdbe208e1ba94.md">Reporting - jak reportovat klientovi</a> </p>
<h2>5️⃣ Připravujete s klientem pracně akci? Kroky: p<strong>řed / v průběhu / po akci.</strong></h2>
<p>Jak se připravit na akci? Čti 👉🏻 <a href="P%C5%99%C3%ADprava%20na%20kr%C3%A1tkou%20(flash%20akci)%2014951ff3df57800e9f98d706330fc4d8.md">Příprava na krátkou (flash akci) </a> </p>
<p>Jak připravit Meta Ads na flash akci? Čti 👉🏻 <a href="Meta%20Ads%20Jak%20d%C4%9Blat%20kr%C3%A1tk%C3%A9%20(flash)%20akce%2014951ff3df57809a8590e93ae0a03b33.md">Meta Ads: Jak dělat krátké (flash) akce  </a> </p>
<p>Nevíš, jestli a jaké bannery nechat připravit i pro PPC? Čti 👉🏻 <a href="Rozm%C4%9Bry%20PPC%20banner%C5%AF%20pro%20Google%20Ads%20a%20S-klik%2013b2a46219194b43a800e4acb4531a29.md">Rozměry PPC bannerů pro Google Ads a S-klik</a> </p>
<h2>6️⃣ <strong>Koordinace mezi specialisty</strong></h2>
<p>Projekťáci mají odpovědnost za Meta Ads a současně sledují práci specialistů na Google Ads, Sklik a zbožových srovnávačích, aby výsledky všech kanálů byly v souladu s celkovou strategií.</p>
<p>Současně – <strong>pokud nám klient oznámí nějakou novinu, nezapomínejme ji komunikovat do celého týmu, který na projektu pracuje. Jak?</strong></p>
<ul>
<li>ve Slacku,</li>
<li>nebo označení ve Freelo v konkrétním úkolu</li>
<li>a ideálně aktualizujte připnutou poznámku [Informace o klientovi] v interním to-do listu ve Freelo s notifikací pro všechny zapojené specialisty.</li>
</ul>
',
'Proč potřebujeme mít zásady komunikace? Správná komunikace zvyšuje šanci spokojenosti klienta. Nespokojený klient nám odejde. 💡 Udržení si stávajícího klienta nás vyjde o 70 % levněji než pracně získávat klienta nového. 🚨 👉🏻 Proto se vyplatí investovat čas a úsilí do budování pevných partnerských vztahů. Nyní se podíváme, jak na to. 1️⃣ Poznej očekávání svého klienta Není nic horšího, když neznáme očekávání klienta. Jeho cíle jsou naše cíle. Spravujete klienty delší dobu? Jeho očekávání se v čase mění. Čtěte 👉🏻 Pravidelné vyhodnocování spokojenosti klienta 2️⃣ Jedenáctero komunikace s klientem Poznej zákazníka svého – viz bod 1️⃣ Pozdravíme – při první zprávě nového dne vždy klienta pozdravíme. Zmíníme jméno klienta – při každé zprávě začneme tím, že zmíníme jméno. Vždycky! 😊 Prosíme a děkujeme – cokoliv chceme po klientovi, poprosíme. Cokoliv nám klient dodá, poděkujeme. Reagujeme rychle ve Freelo: Na složitý úkol, nad kterým se musíme zamyslet, reagujeme: ,,Dobrý den [jméno], úkol registruji. Zamyslím se a vrátím se s odpovědí nejpozději zítra odpoledne.” Jednoduchý úkol – snažíme se odbavit co nejrychleji do max. 3 hodin. Před zavřením úkolu končíme vždy naším komentářem, minimálně např.: ,,Krásný den, [jméno], z úkolu máme vše hotové, pro přehlednost úkol zavírám. Mějte se pěkně.” Vysvětlujeme & opakujeme jako začátečníkům & jsme informativní, příklady: Chceme detaily na vánoční produkty, o kterých padla řeč na meetingu? Jsme konkrétní – O jakých titulech jsme se bavili, co konkrétně potřebujeme doplnit, posíláme ukázku co nám fungovalo u jiného klienta, posíláme inspiraci na reklamu, atp. Nastavovali jsme katalogovky – stručně vysvětlete klientovi, jak fungují a pošlete náhled reklamy, jak vypadají. Píšeme o technikáliích, např. o dynamickém remarketingu – znovu zopakujme klientovi, co dynamický remarketing znamená a jak funguje. Testovali jsme s klientem nové video? Informujme ho iniciativně, jak se videu daří a pokud nedaří, co můžeme udělat pro to, aby to příště fungovalo lépe. Ukončení úkolu pro flash akci – např.: k Black Friday máme vše připraveno a kampaně běží, klientovi napíšu: ,,Dobrý den, [jméno klienta], hlásím, že kampaně běží. Úkol zavírám. Držím nám palce. Jsme v kontaktu během akce a výsledky si projdeme na pravidelné schůzce. Děkuji za spolupráci!” Jsme proaktivní 1x za měsíc Co můžeme zlepšit? Viz úkol v šabloně: https://app.freelo.io/task/14693806 Bannery a videa – potřebujeme nové podklady pro tvorbu bannerů? Poproste ve Freelo a rovnou proaktivně dejte tip, jaké produkty/kategorie se podle Looker Studio nyní nejvíc prodávají a pošlete třeba ukázku našeho videa. Chceme se prodávat jako agentura Nejen upselly, ale prodáváme se i v běžné komunikaci. Podívejte se na příklady zde: Jak na ještě lepší komunikaci s klientem (příklady budu postupně doplňovat) Uznejme chybu – nezatloukáme. Diplomatická odpověď – pokud se nejedná o absolutně zřetelnou chybu, zkusme najít diplomatickou odpověď. Můžeme situaci napravit? Domluvte se s klientem na postupu a pusťme se aktivně do toho. Nemůžeme situaci napravit? Aktivně a s pokorou jdeme za klientem s lepším procesem, aby se to příště nestalo. Klienti nejsou e-shopy ani reklamní účty, klienti jsou lidé. Zkoušíme psát sms nebo volat – když nám klient nereaguje na 2-3 zprávy ve Freelo, napište mu sms nebo zkuste rychle zavolat a skutečně projevit zájem, jestli je u něj všechno v pořádku. Jen pokud je to nezbytné, nemělo by se příliš opakovat!!! Pokud se na callu s klientem na čemkoliv domluvíte, udělejte vždy zápis / úkol ve freelo. Uděláme něco navíc – dáme mu konzultaci, poradíme, není klient v Praze, že bychom se setkali na rychlé kafe? Oceníme náš společný postup – kde jsme byli předtím, co jsme společně dokázali a kam jdeme. Víme od klienta, že je nemocný – napíšeme mu zprávu za pár dní, jestli se cítí lépe. Víme, že se klient chystá na offline event – napíšeme mu zprávu, ať se mu akce vydaří. Popřejeme na narozeniny či svátek. Pogratulujeme k úspěchu, pochválíme za nějakou drobnost. Jak na ještě lepší komunikaci s klientem 3️⃣ Cíle klienta – PNO, počet objednávek, obrat či kredit V každé fázi si musíme být jistí, že rozumíme bodu číslo 1️⃣. Jsme placení za doručení výsledků. Dlouhodobě a nejčastěji podle PNO. Během akcí dle obratu, počtu objednávek. U některých klientů jsme omezení rozpočtem. Plnění výsledků a kontrola KPI je zodpovědností projekťáka. 🚨 Pozor na situaci, kdy plníme stanovené PNO, ale klient si postěžuje, že mu to nevychází – ihned hledej důvod, kde je chyba. Nevíš? Poraď se v týmu. 4️⃣ Pravidelný měsíční reporting Každý klient by měl mít přehled, jak se mu vede. Víme, že každý klient je jiný a vyžaduje trošku odlišný přístup, ale suma sumárum bychom se vždy iniciativně měli dostat k těmto bodům: Google Meet Zápis aktivit. Loom reporting – pokud klient chce. Čti 👉🏻 Reporting jak reportovat klientovi 5️⃣ Připravujete s klientem pracně akci? Kroky: před / v průběhu / po akci. Jak se připravit na akci? Čti 👉🏻 Příprava n',
67,
true
);

INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'3fc14e14-d15d-4fa2-8836-16da71c997bd',
'11111111-1111-1111-1111-111111111106',
'Záznam školení - Evidence nového obchodního případu v Raynetu',
'<h1>Zadávání do Raynetu školení</h1>
<p><a href="https://tldv.io/app/meetings/690dee26f21ddf00123d512e/">https://tldv.io/app/meetings/690dee26f21ddf00123d512e/</a></p>
<h3><strong>Akční body pro zpracování leadů v Raynetu</strong></h3>
<ul>
<li>Lukáš pracuje na automatizaci zadávání firemních údajů a převodu leadů na obchodní případy v systému. <a href="https://tldv.io/app/meetings/690dee26f21ddf00123d512e?t=61">01:01</a></li>
<li>Vždy vytvořit kontakt u leadu, pokud ještě neexistuje. <a href="https://tldv.io/app/meetings/690dee26f21ddf00123d512e?t=144">02:24</a></li>
<li>Nutnost přiřadit konkrétní produkt, který bude klientovi prodán. <a href="https://tldv.io/app/meetings/690dee26f21ddf00123d512e?t=194">03:14</a></li>
<li>Základní odměna pro běžné klienty činí 8 000 Kč. <a href="https://tldv.io/app/meetings/690dee26f21ddf00123d512e?t=357">05:57</a></li>
</ul>
<h3><strong>Marketingové strategie a kampaně</strong></h3>
<ul>
<li>Daniel spustil nové reklamní kampaně na podcasty, které přivádějí zajímavější zájemce. <a href="https://tldv.io/app/meetings/690dee26f21ddf00123d512e?t=1242">20:42</a></li>
<li>Daniel přesměroval marketingový rozpočet a měl nadějný hovor s potenciálním klientem na Metu. <a href="https://tldv.io/app/meetings/690dee26f21ddf00123d512e?t=1275">21:15</a></li>
</ul>
<h3><strong>Obchodní principy a přístup k zákazníkům</strong></h3>
<ul>
<li>Preferovat kvalitní konzultaci před řešením pouze cenových nabídek. <a href="https://tldv.io/app/meetings/690dee26f21ddf00123d512e?t=1104">18:24</a></li>
<li>Cílem není získávat klienty orientované pouze na nejnižší cenu. <a href="https://tldv.io/app/meetings/690dee26f21ddf00123d512e?t=1161">19:21</a></li>
</ul>
<h3><strong>Projektové řízení a předávání zodpovědností</strong></h3>
<ul>
<li>David předává projekt do Freela, poté přebírá zodpovědnost Evča. <a href="https://tldv.io/app/meetings/690dee26f21ddf00123d512e?t=875">14:35</a></li>
<li>Artisan (Vito) má kapacity na hraně a pravděpodobně nestíhá plnit požadavky. <a href="https://tldv.io/app/meetings/690dee26f21ddf00123d512e?t=1326">22:06</a></li>
<li>Listopad do prvního týdne prosince bude mimořádně náročný, poté se situace stabilizuje. <a href="https://tldv.io/app/meetings/690dee26f21ddf00123d512e?t=1388">23:08</a></li>
</ul>
<h3><strong>Spolupráce a smluvní podmínky</strong></h3>
<ul>
<li>Rozdílné výpočetní tabulky způsobily komplikace v započítávání úspěšnosti projektů. <a href="https://tldv.io/app/meetings/690dee26f21ddf00123d512e?t=1423">23:43</a></li>
<li>Týmy se dohodly na úpravě spolupráce a zpřesnění smluvních podmínek pro budoucnost. <a href="https://tldv.io/app/meetings/690dee26f21ddf00123d512e?t=1481">24:41</a></li>
<li>Plánují flexibilní úpravu cílů výdajů podle aktuální situace v projektech. <a href="https://tldv.io/app/meetings/690dee26f21ddf00123d512e?t=1530">25:30</a></li>
</ul>
<h3><strong>Vedlejší poznámky</strong></h3>
<ul>
<li>Zahájení diskuse o zpracování nového leadu v systému Raynet. <a href="https://tldv.io/app/meetings/690dee26f21ddf00123d512e?t=9">00:09</a></li>
</ul>
',
'Zadávání do Raynetu školení https://tldv.io/app/meetings/690dee26f21ddf00123d512e/ Akční body pro zpracování leadů v Raynetu Lukáš pracuje na automatizaci zadávání firemních údajů a převodu leadů na obchodní případy v systému. 01:01 Vždy vytvořit kontakt u leadu, pokud ještě neexistuje. 02:24 Nutnost přiřadit konkrétní produkt, který bude klientovi prodán. 03:14 Základní odměna pro běžné klienty činí 8 000 Kč. 05:57 Marketingové strategie a kampaně Daniel spustil nové reklamní kampaně na podcasty, které přivádějí zajímavější zájemce. 20:42 Daniel přesměroval marketingový rozpočet a měl nadějný hovor s potenciálním klientem na Metu. 21:15 Obchodní principy a přístup k zákazníkům Preferovat kvalitní konzultaci před řešením pouze cenových nabídek. 18:24 Cílem není získávat klienty orientované pouze na nejnižší cenu. 19:21 Projektové řízení a předávání zodpovědností David předává projekt do Freela, poté přebírá zodpovědnost Evča. 14:35 Artisan (Vito) má kapacity na hraně a pravděpodobně nestíhá plnit požadavky. 22:06 Listopad do prvního týdne prosince bude mimořádně náročný, poté se situace stabilizuje. 23:08 Spolupráce a smluvní podmínky Rozdílné výpočetní tabulky způsobily komplikace v započítávání úspěšnosti projektů. 23:43 Týmy se dohodly na úpravě spolupráce a zpřesnění smluvních podmínek pro budoucnost. 24:41 Plánují flexibilní úpravu cílů výdajů podle aktuální situace v projektech. 25:30 Vedlejší poznámky Zahájení diskuse o zpracování nového leadu v systému Raynet. 00:09',
68,
true
);

