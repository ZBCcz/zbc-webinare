/* Webináře Za bohatší Česko
   1) Stav stránky podle data (nadcházející / probíhá / proběhl)
   2) Přehled: rozřazení karet do „Nadcházející“ a „Proběhlo“
   3) Registrační formulář (zdroj z utm_source, kontrola polí, odeslání)
   Kontrola stavu: přidej na konec adresy ?nahled-stavu=nadchazejici | probiha | probehl */
(function () {
  "use strict";

  var params = new URLSearchParams(window.location.search);
  var vynucenyStav = params.get("nahled-stavu");
  var povoleneStavy = ["nadchazejici", "probiha", "probehl"];
  if (povoleneStavy.indexOf(vynucenyStav) === -1) vynucenyStav = null;

  function stavPodleData(zacatek, konec) {
    if (vynucenyStav) return vynucenyStav;
    var ted = Date.now();
    var z = Date.parse(zacatek), k = Date.parse(konec);
    if (isNaN(z) || isNaN(k)) return "nadchazejici";
    if (ted < z) return "nadchazejici";
    if (ted < k) return "probiha";
    return "probehl";
  }

  /* 1) Stránka webináře */
  var html = document.documentElement;
  if (html.dataset.zacatek && html.dataset.konec) {
    html.dataset.stav = stavPodleData(html.dataset.zacatek, html.dataset.konec);
  }

  /* 2) Přehled webinářů */
  var nadchazejici = document.getElementById("seznam-nadchazejici");
  var probehle = document.getElementById("seznam-probehle");
  if (nadchazejici && probehle) {
    var karty = Array.prototype.slice.call(document.querySelectorAll("[data-webinar]"));
    karty.forEach(function (karta) {
      var stav = stavPodleData(karta.dataset.zacatek, karta.dataset.konec);
      karta.dataset.stav = stav;
      var stitek = karta.querySelector(".karta__stitek");
      var sipka = karta.querySelector(".karta__sipka");
      var odkaz = karta.querySelector("a.karta");
      if (stav === "probehl") {
        if (stitek) { stitek.textContent = "Proběhlo"; stitek.classList.remove("skryt"); }
        if (sipka) sipka.textContent = sipka.dataset.probehl || "Detail";
        if (odkaz) odkaz.classList.add("karta--probehl");
      } else if (stav === "probiha") {
        if (stitek) { stitek.textContent = "Právě probíhá"; stitek.classList.remove("skryt"); }
      }
    });
    var budouci = karty.filter(function (k) { return k.dataset.stav !== "probehl"; })
      .sort(function (a, b) { return Date.parse(a.dataset.zacatek) - Date.parse(b.dataset.zacatek); });
    var minule = karty.filter(function (k) { return k.dataset.stav === "probehl"; })
      .sort(function (a, b) { return Date.parse(b.dataset.zacatek) - Date.parse(a.dataset.zacatek); });
    budouci.forEach(function (k) { nadchazejici.appendChild(k); });
    minule.forEach(function (k) { probehle.appendChild(k); });
    var prazdneN = document.getElementById("prazdne-nadchazejici");
    var prazdneP = document.getElementById("prazdne-probehle");
    if (prazdneN) prazdneN.classList.toggle("skryt", budouci.length > 0);
    if (prazdneP) prazdneP.classList.toggle("skryt", minule.length > 0);
  }

  /* 3) Registrační formulář */
  var form = document.getElementById("registrace-formular");
  if (!form) return;

  var zdroj = params.get("utm_source") || "web";
  var poleZdroj = form.querySelector('[name="zdroj"]');
  if (poleZdroj) poleZdroj.value = zdroj.slice(0, 60);

  var chyba = document.getElementById("formular-chyba");
  var dekujeme = document.getElementById("dekujeme");
  var tlacitko = form.querySelector('button[type="submit"]');

  function zkontroluj(pole) {
    var ok = pole.checkValidity() && pole.value.trim() !== "";
    pole.setAttribute("aria-invalid", ok ? "false" : "true");
    return ok;
  }
  Array.prototype.forEach.call(form.querySelectorAll("input[required]"), function (pole) {
    pole.addEventListener("blur", function () { if (pole.value) zkontroluj(pole); });
    pole.addEventListener("input", function () { if (pole.getAttribute("aria-invalid") === "true") zkontroluj(pole); });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    chyba.classList.remove("je-videt");

    var vse = true;
    Array.prototype.forEach.call(form.querySelectorAll("input[required]"), function (pole) {
      if (!zkontroluj(pole)) vse = false;
    });
    if (!vse) { var prvni = form.querySelector('[aria-invalid="true"]'); if (prvni) prvni.focus(); return; }

    // Ochrana proti spamu: vyplněné skryté pole = robot
    var past = form.querySelector('[name="web_adresa"]');
    if (past && past.value) { ukazDekujeme(); return; }

    var cil = form.getAttribute("action");
    if (!cil || cil === "#") {
      // NÁHLED: formulář ještě není napojený na LeadAgent
      chyba.textContent = "Tohle je náhled. Formulář zatím není napojený na LeadAgent, registrace se neuložila.";
      chyba.classList.add("je-videt");
      return;
    }

    tlacitko.disabled = true;
    fetch(cil, { method: (form.getAttribute("method") || "POST").toUpperCase(), body: new FormData(form), mode: "no-cors" })
      .then(function () { ukazDekujeme(); })
      .catch(function () {
        chyba.innerHTML = 'Registraci se nepodařilo odeslat. Zkuste to prosím znovu, nebo nám napište na <a href="mailto:info@zabohatsicesko.cz">info@zabohatsicesko.cz</a>.';
        chyba.classList.add("je-videt");
        tlacitko.disabled = false;
      });
  });

  function ukazDekujeme() {
    form.classList.add("skryt");
    dekujeme.classList.remove("skryt");
    dekujeme.setAttribute("tabindex", "-1");
    dekujeme.focus();
  }
})();
