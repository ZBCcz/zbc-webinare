# Webináře Za bohatší Česko – pravidla projektu

Platí pro každou AI (Claude, Codex, ChatGPT) i člověka, který v tomhle repu pracuje.

## Co tu je
Statický web pro sérii online webinářů Za bohatší Česko (ZBČ), cílová adresa https://webinare.zabohatsicesko.cz.
- `web/` – jediná složka, která jde na internet (Netlify, viz `netlify.toml`). Žádný build, žádné frameworky.
- `web/index.html` – přehled: nadcházející webináře nahoře, proběhlé v sekci „Proběhlo“.
- `web/[slug]/index.html` + `web/[slug]/webinar.ics` – stránka jednoho webináře a událost do kalendáře.
- `web/assets/` – `styl.css`, `webinare.js`, logo a symbol (SVG vyjmuté z Logomanuálu ZBČ), písma (`fonty/`).
- `sablona/webinar.html` – výchozí bod pro každý nový webinář.
Netlify projekt: `zbc-webinare` (tým ZBČ). Do jiných Netlify projektů nic nenasazuj.

## Obsah – nejdůležitější pravidla
- Texty pozvánek přebírej doslova od zadavatelky. Smíš je rozdělit do sekcí a zvýraznit, ne přepisovat, zkracovat ani doplňovat.
- Nikdy nevymýšlej: přednášející, platformu, počet míst, bonusy, recenze, statistiky, odkazy. Co chybí, označ `<span class="doplnit">[DOPLNIT: …]</span>` a nahlas to.
- Tón: lidsky, srozumitelně, vstřícně, vykáme. Žádný nátlak, strach, odpočty, „poslední místa“, vykřičníky ani korporátní fráze.
- Čeština s diakritikou, české uvozovky „ “, rozsah času s pomlčkou bez mezer (18:00–19:00), datum „středa 2. 12. 2026“, nedělitelné mezery po jednopísmenných předložkách a v datech.

## Vzhled – Logomanuál ZBČ (4/2025), závazné
- Barvy: light black #232323 · dark white #e2dbd5 · gold #9d6219 · island blue #97a7a5 (+ bílá). Jiné nepoužívej.
- Kontrast: zlatý text jen na bílé, bílý text na zlaté (tlačítko). Na dark white a island blue jen light black. Malý text nikdy v island blue.
- Písma: RecifeDisplay (nadpisy, Book 400) a Satoshi (texty 400/500/700). Soubory jsou ve `web/assets/fonty/`, žádné externí fonty ani CDN.
- Logo: jen soubory `zbc-logo.svg` (světlé pozadí) a `zbc-logo-negativ.svg` (tmavé pozadí). Nepřekreslovat, nedeformovat, nepřebarvovat. Min. šířka 100 px, ochranná zóna 2× symbol „+“.
- Symbol „+“ (`zbc-symbol.svg`) smí být samostatně jako akcent.
- Styl: čistý, vzdušný, velká typografie, velké zaoblení jednoho rohu bloků (jako v logomanuálu). Žádná finanční klišé, žádné fotky lidí bez dodání.

## Stránka webináře – povinné prvky
Hlavička (logo → zabohatsicesko.cz, „Všechny webináře“), úvod (štítek ONLINE WEBINÁŘ, název, podtitul, termín, tlačítko k registraci, „Přidat do kalendáře“), obsah pozvánky, registrace, podcast, patička (text vázaného zástupce SIRIUS FINANCE – převzít beze změny z hlavního webu).
Meta: title, description, canonical, Open Graph (+ og:image 1920 × 1005 od grafika), favicon, schema.org Event.

## Formulář do LeadAgentu
- Registrace jdou do LeadAgentu (účet Moniky Koubkové). Kód napojení dodá Monika – vlož ho místo `action="#"` a uprav názvy polí podle něj.
- Pole: jméno, e-mail (povinné). Skrytá pole `webinar` (datum + název) a `zdroj` (z `utm_source`, výchozí „web“). Honeypot `web_adresa`.
- Pod tlačítkem věta o Zásadách zpracování osobních údajů s odkazem https://www.siriusfinance.cz/GDPR. Další souhlas (marketing) jen jako nepovinné nezaškrtnuté políčko se schváleným zněním.
- Nikdy nevkládej do stránky tajný klíč (API klíč, token). Kdyby ho LeadAgent vyžadoval, odesílání se přesune do Netlify Function a klíč do proměnné prostředí.
- Žádné měřicí kódy ani cookies bez výslovného schválení.

## Automatický stav podle data
`<html data-zacatek data-konec>` (ISO, Praha: zima +01:00, léto +02:00) a karty `<li data-webinar data-zacatek data-konec>` v přehledu.
`webinare.js` přepíná: nadcházející (formulář) → probíhá → proběhl (formulář zmizí, karta se přesune do „Proběhlo“).
Prvky pro jednotlivé stavy mají `data-pro-stav="nadchazejici|probiha|probehl"`.
Kontrola: přidej na konec adresy `?nahled-stavu=nadchazejici|probiha|probehl`.

## Nový webinář
1. Zkopíruj `sablona/webinar.html` → `web/[slug]/index.html` (slug krátký, bez diakritiky).
2. Vyměň všechny údaje (název, termín, `data-zacatek/konec`, texty, skryté pole `webinar`, meta, schema.org, název .ics).
3. Vytvoř `web/[slug]/webinar.ics` podle vzoru (časy v UTC).
4. Přidej kartu do `web/index.html`.
5. Stránky a adresy proběhlých webinářů neměň, kromě doplnění odkazu na záznam/materiály.

## Před zveřejněním (náhled → ostrý provoz)
- Odstranit `<div class="nahled-pruh">` a `<meta name="robots" content="noindex, nofollow">`.
- Formulář napojený a otestovaný (registrace dorazí do LeadAgentu se správným webinářem a zdrojem).
- Žádné `[DOPLNIT]` na stránce.

## Kontrola po každé změně
Mobil 360/390 px bez vodorovného posouvání, desktop 1440 px, všechny tři stavy, odkazy, konzole bez chyb, texty proti podkladům.
Na konci napiš: co se změnilo, co chybí ([DOPLNIT]), co je odhad.
