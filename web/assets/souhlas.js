/* Webináře Za bohatší Česko – souhlas s cookies a Google Analytics 4
   Basic Consent Mode: Google skript se načte až po souhlasu, nikdy dřív.
   Volba: localStorage této subdomény, klíč zbc_webinare_consent, platnost 6 měsíců.
   Ovládání z jiného skriptu: window.zbcSouhlas.otevritNastaveni(spoustec) */
(function () {
  "use strict";

  var GA_ID = "G-MXDRDK7MQN";
  var KLIC = "zbc_webinare_consent";
  var VERZE = 1;                      // zvýšit při změně textu/účelu → všichni dostanou lištu znovu
  var PLATNOST_MESICE = 6;
  var COOKIE_PREFIX = "zbc_webinare";
  var COOKIE_DOMENA = "webinare.zabohatsicesko.cz";
  var POVOLENE_PARAMETRY = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

  /* 1) dataLayer, gtag a výchozí stav souhlasu – vždy jako první, lokálně, bez Googlu */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  if (typeof window.gtag !== "function") window.gtag = gtag;
  gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied"
  });

  /* 2) Uložená volba */
  function pridejMesice(datum, pocet) {
    var d = new Date(datum.getTime());
    var den = d.getDate();
    d.setMonth(d.getMonth() + pocet);
    if (d.getDate() < den) d.setDate(0); // 31. 8. + 6 měsíců = 28./29. 2.
    return d;
  }

  function nactiVolbu() {
    var surova;
    try { surova = window.localStorage.getItem(KLIC); } catch (e) { return null; }
    if (!surova) return null;
    try {
      var v = JSON.parse(surova);
      if (!v || typeof v !== "object") return null;
      if (v.stav !== "povoleno" && v.stav !== "odmitnuto") return null;
      if (v.verze !== VERZE) return null;
      var cas = Date.parse(v.cas), platnost = Date.parse(v.platnost);
      if (isNaN(cas) || isNaN(platnost)) return null;
      var ted = Date.now();
      if (cas > ted + 864e5) return null;                                       // čas z budoucnosti
      if (platnost > pridejMesice(new Date(cas), PLATNOST_MESICE).getTime() + 864e5) return null;
      if (ted >= platnost) return null;                                         // prošlá volba
      return v.stav;
    } catch (e) { return null; }
  }

  function ulozVolbu(stav) {
    var ted = new Date();
    var zaznam = {
      stav: stav,
      cas: ted.toISOString(),
      platnost: pridejMesice(ted, PLATNOST_MESICE).toISOString(),
      verze: VERZE
    };
    try { window.localStorage.setItem(KLIC, JSON.stringify(zaznam)); return true; }
    catch (e) { return false; }                                                 // bez úložiště: volba platí jen pro tuto stránku
  }

  /* 3) Analytika – maximálně jednou na stránku */
  var analytikaSpustena = false;

  function cistaAdresa(href) {
    try {
      var u = new URL(href, window.location.href);
      var cista = new URL(u.origin + u.pathname);
      POVOLENE_PARAMETRY.forEach(function (p) {
        var hodnota = u.searchParams.get(p);
        if (hodnota) cista.searchParams.set(p, hodnota.slice(0, 100));
      });
      return cista.toString();
    } catch (e) { return undefined; }
  }

  function spustAnalytiku() {
    if (analytikaSpustena || window.__zbcAnalytikaSpustena) return;
    analytikaSpustena = window.__zbcAnalytikaSpustena = true;
    window["ga-disable-" + GA_ID] = false;

    gtag("consent", "update", { analytics_storage: "granted" });

    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(s);

    gtag("js", new Date());
    var nastaveni = {
      cookie_domain: COOKIE_DOMENA,
      cookie_prefix: COOKIE_PREFIX,
      cookie_expires: 15552000,
      cookie_update: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      // Do GA nejdou parametry adresy kromě utm_* ani #kotvy (ochrana před osobními údaji v URL)
      page_location: cistaAdresa(window.location.href)
    };
    if (document.referrer) nastaveni.page_referrer = cistaAdresa(document.referrer);
    gtag("config", GA_ID, nastaveni);
  }

  function smazAnalytickeCookies() {
    var nazvy = document.cookie.split(";").map(function (c) { return c.split("=")[0].trim(); })
      .filter(function (n) { return n.indexOf(COOKIE_PREFIX + "_ga") === 0; });
    var minule = "Thu, 01 Jan 1970 00:00:00 GMT";
    nazvy.forEach(function (n) {
      document.cookie = n + "=; expires=" + minule + "; path=/; domain=" + COOKIE_DOMENA;
      document.cookie = n + "=; expires=" + minule + "; path=/; domain=." + COOKIE_DOMENA;
      document.cookie = n + "=; expires=" + minule + "; path=/";
    });
  }

  function odvolejSouhlas() {
    window["ga-disable-" + GA_ID] = true;
    gtag("consent", "update", { analytics_storage: "denied" });
    ulozVolbu("odmitnuto");
    smazAnalytickeCookies();
    window.location.reload();
  }

  /* 4) Lišta a nastavení */
  var panel = null, spoustec = null, rezimNastaveni = false, aktualni = null;

  var TEXT_STAVU = {
    povoleno: "Měření návštěvnosti je povolené.",
    odmitnuto: "Měření návštěvnosti je odmítnuté.",
    zadna: "Zatím jste nevybrali."
  };

  function vytvorPanel() {
    if (panel) return panel;
    panel = document.createElement("div");
    panel.className = "souhlas";
    panel.id = "souhlas-cookies";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "false");
    panel.setAttribute("aria-labelledby", "souhlas-nadpis");
    panel.setAttribute("aria-describedby", "souhlas-text");
    panel.hidden = true;
    panel.innerHTML =
      '<button type="button" class="souhlas__zavrit" aria-label="Zavřít nastavení cookies" hidden>' +
        '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
      '</button>' +
      '<h2 class="souhlas__nadpis" id="souhlas-nadpis" tabindex="-1">Tento web používá cookies</h2>' +
      '<p class="souhlas__text" id="souhlas-text">Nezbytné cookies web potřebuje k fungování. Ostatní, pro měření návštěvnosti, použijeme jen s vaším souhlasem. Podrobnosti o nich naleznete v <a href="/cookies"><strong>Prohlášení o cookies</strong></a>.</p>' +
      '<p class="souhlas__stav" id="souhlas-stav" hidden></p>' +
      '<div class="souhlas__tlacitka">' +
        '<button type="button" class="souhlas__tlacitko" data-volba="odmitnuto">Odmítnout</button>' +
        '<button type="button" class="souhlas__tlacitko" data-volba="povoleno">Povolit</button>' +
      '</div>';
    document.body.insertBefore(panel, document.body.firstChild);

    panel.querySelectorAll("[data-volba]").forEach(function (b) {
      b.addEventListener("click", function () { zvol(b.getAttribute("data-volba")); });
    });
    panel.querySelector(".souhlas__zavrit").addEventListener("click", zavriNastaveni);
    document.addEventListener("keydown", function (e) {
      if ((e.key === "Escape" || e.key === "Esc") && rezimNastaveni && !panel.hidden) {
        e.preventDefault();
        zavriNastaveni();
      }
    });
    return panel;
  }

  function ukazListu() {
    vytvorPanel();
    rezimNastaveni = false;
    panel.classList.remove("souhlas--nastaveni");
    panel.querySelector(".souhlas__zavrit").hidden = true;
    panel.querySelector("#souhlas-stav").hidden = true;
    panel.hidden = false;
  }

  function otevritNastaveni(odkud) {
    vytvorPanel();
    spoustec = odkud || document.activeElement;
    rezimNastaveni = true;
    var stav = nactiVolbu() || aktualni;
    var stavEl = panel.querySelector("#souhlas-stav");
    stavEl.textContent = "Vaše současná volba: " + TEXT_STAVU[stav || "zadna"];
    stavEl.hidden = false;
    panel.querySelectorAll("[data-volba]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-volba") === stav));
    });
    panel.classList.add("souhlas--nastaveni");
    panel.querySelector(".souhlas__zavrit").hidden = false;
    panel.hidden = false;
    panel.querySelector("#souhlas-nadpis").focus();
  }

  function zavriNastaveni() {
    // Zavření beze změny volby. Pokud volba ještě neexistuje, lišta se ukáže znovu jako lišta (žádný souhlas).
    rezimNastaveni = false;
    panel.querySelectorAll("[data-volba]").forEach(function (b) { b.removeAttribute("aria-pressed"); });
    if (!nactiVolbu() && !aktualni) { ukazListu(); }
    else { panel.hidden = true; }
    if (spoustec && typeof spoustec.focus === "function") spoustec.focus();
    spoustec = null;
  }

  function zvol(stav) {
    var predtim = nactiVolbu() || aktualni;
    var bylNastaveni = rezimNastaveni;
    if (stav === "odmitnuto" && (predtim === "povoleno" || analytikaSpustena)) {
      aktualni = "odmitnuto";
      odvolejSouhlas();                // ukončí běžící měření a obnoví stránku
      return;
    }
    ulozVolbu(stav);
    aktualni = stav;
    if (stav === "povoleno") spustAnalytiku();
    rezimNastaveni = false;
    panel.hidden = true;
    panel.querySelectorAll("[data-volba]").forEach(function (b) { b.removeAttribute("aria-pressed"); });
    if (bylNastaveni && spoustec && typeof spoustec.focus === "function") spoustec.focus();
    spoustec = null;
    var info = document.getElementById("cookies-aktualni");
    if (info) info.textContent = TEXT_STAVU[stav];
  }

  /* 5) Start */
  function start() {
    var volba = nactiVolbu();
    aktualni = volba;
    if (volba === "povoleno") spustAnalytiku();
    else if (volba === null) ukazListu();

    var tlacitko = document.getElementById("zmenit-cookies");
    if (tlacitko) {
      tlacitko.hidden = false;
      tlacitko.addEventListener("click", function () { otevritNastaveni(tlacitko); });
    }
    var info = document.getElementById("cookies-aktualni");
    if (info) { info.textContent = TEXT_STAVU[volba || "zadna"]; if (info.parentNode) info.parentNode.hidden = false; }
  }

  window.zbcSouhlas = { otevritNastaveni: otevritNastaveni };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
