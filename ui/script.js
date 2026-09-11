(function () {
  const app = document.getElementById("app");

  const REFERENCE_WIDTH = 380;
  const REFERENCE_HEIGHT = 800;

  function applyResponsiveScale() {
    const container = app.parentElement || document.body;
    const availableWidth = container.clientWidth || window.innerWidth;
    const availableHeight = container.clientHeight || window.innerHeight;
    if (!availableWidth || !availableHeight) return;

    const scale = Math.min(availableWidth / REFERENCE_WIDTH, availableHeight / REFERENCE_HEIGHT);
    app.style.transform = "scale(" + scale + ")";
  }

  applyResponsiveScale();
  window.addEventListener("resize", applyResponsiveScale);
  if (typeof ResizeObserver !== "undefined" && app.parentElement) {
    new ResizeObserver(applyResponsiveScale).observe(app.parentElement);
  }

  async function callBackend(event, data) {
    if (typeof fetchNui !== "function") return null;
    try {
      return await fetchNui(event, data);
    } catch (err) {
      console.warn("MEOS backend call failed, using sample data ->", event, err);
      return null;
    }
  }

  let toastTimer = null;
  function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function notifyComingSoon() {
    showToast("Deze functie wordt later toegevoegd.");
  }

  function setFieldStatus(id, color, icon) {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = "digibon-field-status status-" + color;
    el.innerHTML =
      icon === "check"
        ? '<svg viewBox="0 0 24 24" class="status-icon-svg"><path d="M4 12l5 5 11-11"/></svg>'
        : '<span class="status-icon-text">' + icon + "</span>";
  }

  let currentDigibon = null;
  let currentMutatie = null;
  let currentCombibon = null;
  let feitContext = null;
  let pleeglocatieContext = null;

  function reloadFeitList() {
    const feitInput = document.getElementById("feitInput");
    if (feitInput) feitInput.value = "";
    currentFeitCategorie = null;
    updateFeitPageTitle();
  }

  function updateFeitPageTitle() {
    const titleEl = document.getElementById("feitPageTitle");
    if (!titleEl) return;
    titleEl.textContent = currentFeitCategorie ? "Feit - " + currentFeitCategorie : "Feit";
  }

  function resetDigibonState() {
    currentDigibon = {
      feitCode: null,
      feitOmschrijving: null,
      postcode: null,
      straat: null,
      redenWetenschap: null,
      verklaring: null,
      persoonIdentifier: null,
      voertuigPlate: null
    };
    document.getElementById("digibonFeitValue").textContent = "Selecteer feitcode";
    setFieldStatus("digibonFeitStatus", "orange", "!");
    document.getElementById("digibonPersoonValue").textContent = "Optioneel, maar persoon of voertuig verplicht";
    setFieldStatus("digibonPersoonStatus", "blue", "?");
    document.getElementById("digibonAdresValue").textContent = "Wordt automatisch opgehaald bij Persoon (indien bekend)";
    setFieldStatus("digibonAdresStatus", "blue", "?");
    document.getElementById("digibonPleeglocatieValue").textContent = "Selecteer pleeglocatie";
    setFieldStatus("digibonPleeglocatieStatus", "orange", "!");
    document.getElementById("digibonRedenValue").textContent = "Nog niet ingevuld";
    setFieldStatus("digibonRedenStatus", "orange", "!");
    document.getElementById("digibonVerklaringValue").textContent = "Checkboxes en verklaring invullen";
    setFieldStatus("digibonVerklaringStatus", "orange", "!");
  }

  function resetMutatieState() {
    currentMutatie = {
      situatie: null,
      postcode: null,
      straat: null,
      toelichting: null,
      persoonIdentifier: null,
      voertuigPlate: null
    };
    document.getElementById("mutatieSituatieValue").textContent = "Verplicht";
    setFieldStatus("mutatieSituatieStatus", "orange", "!");
    document.getElementById("mutatiePersoonValue").textContent = "Optioneel";
    setFieldStatus("mutatiePersoonStatus", "blue", "?");
    document.getElementById("mutatiePlaatsValue").textContent = "Verplicht";
    setFieldStatus("mutatiePlaatsStatus", "orange", "!");
    document.getElementById("mutatieToelichtingValue").textContent = "Verplicht";
    setFieldStatus("mutatieToelichtingStatus", "orange", "!");
  }

  function resetCombibonState() {
    currentCombibon = {
      soort: null,
      feitCode: null,
      feitOmschrijving: null,
      postcode: null,
      straat: null,
      persoonIdentifier: null,
      voertuigPlate: null
    };
    document.getElementById("combibonSoortValue").textContent = "Selecteer S / K / A / B";
    setFieldStatus("combibonSoortStatus", "orange", "!");
    document.getElementById("combibonFeitValue").textContent = "Selecteer feitcode";
    setFieldStatus("combibonFeitStatus", "orange", "!");
    document.getElementById("combibonPersoonValue").textContent = "Optioneel, maar persoon of voertuig verplicht";
    setFieldStatus("combibonPersoonStatus", "blue", "?");
    document.getElementById("combibonAdresValue").textContent = "Wordt automatisch opgehaald bij Persoon (indien bekend)";
    setFieldStatus("combibonAdresStatus", "blue", "?");
    document.getElementById("combibonLocatieValue").textContent = "Selecteer locatie";
    setFieldStatus("combibonLocatieStatus", "orange", "!");
  }

  resetDigibonState();
  resetMutatieState();
  resetCombibonState();

  document.querySelectorAll('.list-row[data-target="digibon"]').forEach((el) => el.addEventListener("click", resetDigibonState));
  document.querySelectorAll('.list-row[data-target="mutatie"]').forEach((el) => el.addEventListener("click", resetMutatieState));
  document.querySelectorAll('.list-row[data-target="combibon"]').forEach((el) => el.addEventListener("click", resetCombibonState));

  document.querySelector('#page-digibon [data-target="feit-categorieen"]')?.addEventListener("click", () => {
    feitContext = "digibon";
    reloadFeitList();
  });
  document.querySelector('#page-combibon [data-target="feit-categorieen"]')?.addEventListener("click", () => {
    feitContext = "combibon";
    reloadFeitList();
  });

  document.querySelectorAll(".list-row[data-klasse]").forEach((card) => {
    card.addEventListener("click", () => {
      currentFeitCategorie = card.dataset.klasse;
      const feitInput = document.getElementById("feitInput");
      if (feitInput) feitInput.value = "";
      updateFeitPageTitle();
      if (typeof runFeitSearch === "function") runFeitSearch("");
    });
  });

  document.querySelector('#page-digibon [data-target="pleeglocatie"]')?.addEventListener("click", () => (pleeglocatieContext = "digibon"));
  document.querySelector('#page-combibon [data-target="pleeglocatie"]')?.addEventListener("click", () => (pleeglocatieContext = "combibon"));

  function applyFeitSelection(code, omschrijving) {
    const label = code + " - " + omschrijving;
    if (feitContext === "combibon" && currentCombibon) {
      currentCombibon.feitCode = code;
      currentCombibon.feitOmschrijving = omschrijving;
      document.getElementById("combibonFeitValue").textContent = label;
      setFieldStatus("combibonFeitStatus", "green", "check");
    } else if (currentDigibon) {
      currentDigibon.feitCode = code;
      currentDigibon.feitOmschrijving = omschrijving;
      document.getElementById("digibonFeitValue").textContent = label;
      setFieldStatus("digibonFeitStatus", "green", "check");
    }
  }

  function applyLocatieSelection(postcode, straat) {
    const label = postcode + " - " + straat;
    if (pleeglocatieContext === "combibon" && currentCombibon) {
      currentCombibon.postcode = postcode;
      currentCombibon.straat = straat;
      document.getElementById("combibonLocatieValue").textContent = label;
      setFieldStatus("combibonLocatieStatus", "green", "check");
    } else if (currentDigibon) {
      currentDigibon.postcode = postcode;
      currentDigibon.straat = straat;
      document.getElementById("digibonPleeglocatieValue").textContent = label;
      setFieldStatus("digibonPleeglocatieStatus", "green", "check");
    }
  }

  let persoonAttachContext = null;

  document.getElementById("digibonPersoonRow")?.addEventListener("click", () => (persoonAttachContext = "digibon"));
  document.getElementById("mutatiePersoonRow")?.addEventListener("click", () => (persoonAttachContext = "mutatie"));
  document.getElementById("combibonPersoonRow")?.addEventListener("click", () => (persoonAttachContext = "combibon"));
  document.querySelector('#page-goed-detail [data-target="persoon"]')?.addEventListener("click", () => (persoonAttachContext = "goed"));
  document.querySelectorAll('.tile[data-target="persoon"], .drawer-item[data-section="persoon"]').forEach((el) =>
    el.addEventListener("click", () => (persoonAttachContext = null))
  );

  const attachTargetLabels = { digibon: "deze Digibon", mutatie: "deze Mutatie", combibon: "deze Combibon", goed: "dit Goed" };

  function formatPersoonKoppelLabel(naam, geboortedatum) {
    const parts = (naam || "").trim().split(" ");
    const voornaam = parts[0] || "";
    const achternaam = parts.slice(1).join(" ") || "-";
    const initiaal = voornaam.charAt(0).toUpperCase();
    return `${geboortedatum || "-"} ${achternaam}, ${initiaal} (${voornaam})`;
  }

  function koppelPersoonAanDocument() {
    if (!persoonAttachContext || !currentProfileIdentifier) return;
    const naam = document.getElementById("profielNaam").textContent;
    const geboortedatum = document.getElementById("profielGeboortedatum").textContent;
    const label = formatPersoonKoppelLabel(naam, geboortedatum);
    const adresRaw = document.getElementById("profielAdres").textContent;
    const adresText = !adresRaw || adresRaw === "-" ? "Geen woonadres bekend" : adresRaw;

    if (persoonAttachContext === "digibon" && currentDigibon) {
      currentDigibon.persoonIdentifier = currentProfileIdentifier;
      document.getElementById("digibonPersoonValue").textContent = label;
      setFieldStatus("digibonPersoonStatus", "green", "check");
      document.getElementById("digibonAdresValue").textContent = adresText;
      setFieldStatus("digibonAdresStatus", "green", "check");
      goBackToPage("page-digibon");
    } else if (persoonAttachContext === "mutatie" && currentMutatie) {
      currentMutatie.persoonIdentifier = currentProfileIdentifier;
      document.getElementById("mutatiePersoonValue").textContent = label;
      setFieldStatus("mutatiePersoonStatus", "green", "check");
      goBackToPage("page-mutatie");
    } else if (persoonAttachContext === "combibon" && currentCombibon) {
      currentCombibon.persoonIdentifier = currentProfileIdentifier;
      document.getElementById("combibonPersoonValue").textContent = label;
      setFieldStatus("combibonPersoonStatus", "green", "check");
      document.getElementById("combibonAdresValue").textContent = adresText;
      setFieldStatus("combibonAdresStatus", "green", "check");
      goBackToPage("page-combibon");
    } else if (persoonAttachContext === "goed") {
      const g = goederen.find((item) => item.id === currentGoedId);
      if (g) {
        g.persoon = label;
        document.getElementById("goedDetailPersoon").textContent = label;
        const statusEl = document.getElementById("goedDetailPersoonStatus");
        statusEl.className = "digibon-field-status status-green";
        statusEl.innerHTML = '<svg viewBox="0 0 24 24" class="status-icon-svg"><path d="M4 12l5 5 11-11"/></svg>';
      }
      goBackToPage("page-goed-detail");
    }

    showToast(naam + " gekoppeld aan " + attachTargetLabels[persoonAttachContext] + ".");
    persoonAttachContext = null;
  }

  document.getElementById("koppelPersoonBtn")?.addEventListener("click", koppelPersoonAanDocument);

  const drawer = document.getElementById("drawer");
  const drawerBackdrop = document.getElementById("drawerBackdrop");

  const personDetails = {
    "paspoort": {
      title: "Scan Paspoort",
      sub: "Richt de scanner op de paspoortpagina met de foto.",
      icon: '<svg viewBox="0 0 24 24"><rect x="7" y="3" width="10" height="18" rx="1.5"/><circle cx="12" cy="9" r="2"/><path d="M9.5 14.5h5M9.5 17h5"/></svg>'
    },
    "id-kaart": {
      title: "Scan ID kaart",
      sub: "Richt de scanner op de voorzijde van de ID-kaart.",
      icon: '<svg viewBox="0 0 24 24"><rect x="2.5" y="6" width="19" height="12" rx="1.5"/><circle cx="8" cy="12" r="2"/><path d="M12.5 10.5h6M12.5 13.5h4"/></svg>'
    },
    "rijbewijs": {
      title: "Scan Rijbewijs",
      sub: "Richt de scanner op de barcode van het rijbewijs.",
      icon: '<svg viewBox="0 0 24 24"><path d="M4 5v14M7 5v14M9.5 5v14M13 5v14M15 5v14M18 5v14M20 5v14" stroke-width="1.6"/></svg>'
    },
    "vingerafdruk": {
      title: "Scan Vingerafdruk",
      sub: "Plaats een vinger op de scanner om te vergelijken.",
      icon: '<svg viewBox="0 0 24 24"><path d="M12 3a7 7 0 0 1 7 7v2a9 9 0 0 1-2 5.6"/><path d="M12 3a7 7 0 0 0-7 7v3c0 1.4.3 2.7.8 3.9"/><path d="M9 10a3 3 0 0 1 6 0v3a10 10 0 0 1-1.4 5.1"/></svg>'
    },
    "obv-document": {
      title: "Handmatig obv document",
      sub: "Voer de gegevens over vanaf een fysiek document.",
      icon: '<svg viewBox="0 0 24 24"><rect x="2.5" y="6" width="19" height="12" rx="1.5"/><circle cx="8" cy="12" r="2"/><path d="M12.5 10.5h6M12.5 13.5h4"/></svg>'
    },
    "visum": {
      title: "Controleer Visum",
      sub: "Controleer de geldigheid van een visum.",
      icon: '<svg viewBox="0 0 24 24"><rect x="7" y="3" width="10" height="18" rx="1.5"/><circle cx="12" cy="9" r="2"/><path d="M9.5 14.5h5"/><path d="m15.5 17.5 1.4 1.4 2.6-2.6" stroke-width="2"/></svg>'
    },
    "kvk-nummer": {
      title: "Zoek op KVK-nummer",
      sub: "Voer een KVK-nummer in om de rechtspersoon op te zoeken.",
      icon: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="1.5"/><path d="M6 10.5h4M6 13.5h6"/><circle cx="17" cy="12" r="2.2"/></svg>'
    },
    "bedrijfsnaam": {
      title: "Zoek op bedrijfsnaam",
      sub: "Zoek een rechtspersoon op basis van de bedrijfsnaam.",
      icon: '<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="1.2"/><path d="M8 7h1.4M8 10.5h1.4M8 14h1.4M14.6 7H16M14.6 10.5H16M14.6 14H16"/></svg>'
    },
    "handmatig-rechtspersoon": {
      title: "Handmatig invoeren",
      sub: "Maak een nieuw rechtspersoondossier volledig handmatig aan.",
      icon: '<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="1.2"/><path d="m15.5 13.5 4.5-4.5 1.6 1.6-4.5 4.5-2 .4.4-2Z"/></svg>'
    }
  };

  const vehicleDetails = {
    "scan-kenteken": {
      title: "Scan Kenteken",
      sub: "Maak een foto van het kenteken om deze automatisch te herkennen.",
      icon: '<svg viewBox="0 0 24 24"><path d="M4 8V6a2 2 0 0 1 2-2h2M4 16v2a2 2 0 0 0 2 2h2M20 8V6a2 2 0 0 0-2-2h-2M20 16v2a2 2 0 0 1-2 2h-2"/><rect x="6" y="9" width="12" height="6" rx="1"/></svg>'
    },
    "kenteken": {
      title: "Zoek op kenteken",
      sub: "Voer een kenteken in om het voertuig op te zoeken.",
      icon: '<svg viewBox="0 0 24 24"><rect x="2.5" y="7" width="19" height="10" rx="1.5"/><path d="M6 12h6M6 14.5h3"/></svg>'
    },
    "nummer": {
      title: "Zoek op nummer",
      sub: "Voer een voertuignummer in om te zoeken.",
      icon: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="1.5"/><path d="M7 10h2M7 14h2M11 10h2M11 14h2M15 10h2M15 14h2"/></svg>'
    },
    "boot": {
      title: "Zoek op bootregistratienummer",
      sub: "Voer een bootregistratienummer in om te zoeken.",
      icon: '<svg viewBox="0 0 24 24"><path d="M3 15h18l-2 4.5H5L3 15Z"/><path d="M6 15V9h9l3 6"/><path d="M9 9V5h3v4"/></svg>'
    },
    "invoeren": {
      title: "Vervoermiddel invoeren",
      sub: "Maak een nieuw voertuigdossier volledig handmatig aan.",
      icon: '<svg viewBox="0 0 24 24"><path d="M3 16v-3.2c0-.5.2-1 .6-1.3L6 9.5l1.3-3A2 2 0 0 1 9.1 5.3h5.8c.8 0 1.6.5 1.9 1.2l1.3 3 2.4 1.9c.4.4.6.9.6 1.4V16"/><path d="M5 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm14 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/></svg>'
    }
  };

  let pageStack = ["page-main"];

  function currentPageId() {
    return pageStack[pageStack.length - 1];
  }

  function showPage(pageId) {
    document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
    const target = document.getElementById(pageId);
    if (!target) return;
    target.classList.add("active");

    if (pageId === "page-main") {
      app.classList.remove("on-sub");
    } else {
      app.classList.add("on-sub");
    }

    updateActiveDrawerItem(pageId);
  }

  function pushPage(pageId) {
    pageStack.push(pageId);
    showPage(pageId);
  }

  function goBack() {
    if (pageStack.length > 1) {
      pageStack.pop();
    }
    showPage(currentPageId());
  }

  function goBackToPage(pageId) {
    while (pageStack.length > 1 && pageStack[pageStack.length - 1] !== pageId) {
      pageStack.pop();
    }
    showPage(currentPageId());
  }

  function jumpToSection(sectionId) {
    const pageId = "page-" + sectionId;
    if (!document.getElementById(pageId)) return;
    pageStack = ["page-main", pageId];
    showPage(pageId);
    closeDrawer();
  }

  function updateActiveDrawerItem(pageId) {
    document.querySelectorAll(".drawer-item[data-section]").forEach((item) => {
      item.classList.toggle("active", "page-" + item.dataset.section === pageId);
    });
  }

  function openDrawer() {
    app.classList.add("drawer-open");
  }

  function closeDrawer() {
    app.classList.remove("drawer-open");
  }

  function toggleDrawer() {
    app.classList.toggle("drawer-open");
  }

  function openPersonDetail(detailKey) {
    const data = personDetails[detailKey];
    if (!data) return;
    document.getElementById("detailIconWrap").innerHTML = data.icon;
    document.getElementById("detailTitle").textContent = data.title;
    document.getElementById("detailSub").textContent = data.sub;
    document.getElementById("detailHeaderTitle").textContent = data.title;
    pushPage("page-persoon-detail");
    addPersonHistory(data.title);

    console.log("MEOS: Persoon detail opened ->", detailKey);
  }

  const DOCUMENT_TYPE_LABELS = {
    id_card: "ID-kaart",
    passport: "Paspoort",
    rijbewijs: "Rijbewijs",
    kentekenbewijs: "Kentekenbewijs"
  };

  async function scanDocument(expectedType) {
    const result = await callBackend("meos_scanDocument");
    if (!result || !result.success || !result.document) {
      showToast("Geen document momenteel getoond.");
      return;
    }
    const doc = result.document;

    if (expectedType && doc.documentType !== expectedType) {
      const expectedLabel = DOCUMENT_TYPE_LABELS[expectedType] || expectedType;
      const actualLabel = DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType || "een ander document";
      showToast("Er staat geen " + expectedLabel + " open (dit is een " + actualLabel + ").");
      return;
    }

    await renderScanResult(doc);
    pushPage("page-scan-document-resultaat");

    if (doc.documentType === "kentekenbewijs") {
      addVehicleHistory("Scan kentekenbewijs: " + (doc.kenteken || "?"));
    } else {
      addPersonHistory("Scan document: " + (doc.voornaam || "?") + " " + (doc.achternaam || "?"));
    }
  }

  function scanResultRow(label, value) {
    return `<div class="profile-info-row"><span class="profile-info-label">${label}</span><span class="profile-info-value">${value}</span></div>`;
  }

  function formatGeslacht(code) {
    return code === "M" ? "Man" : code === "V" ? "Vrouw" : code === "X" ? "Anders" : "Onbekend";
  }

  async function linkPersoonByBsn(bsn) {
    const openBtn = document.getElementById("scanResultOpenDossierBtn");
    const noneNote = document.getElementById("scanResultNoDossierNote");
    openBtn.style.display = "none";
    noneNote.style.display = "none";

    if (!bsn) {
      noneNote.textContent = "Geen BSN op dit document.";
      noneNote.style.display = "block";
      return;
    }

    const matches = await callBackend("meos_searchPersonen", { bsn });
    if (matches && matches.length) {
      currentPersonResults = matches;
      openBtn.textContent = "Bekijk persoonsdossier";
      openBtn.style.display = "flex";
      openBtn.onclick = () => openPersonProfile(matches[0].identifier);
    } else {
      noneNote.textContent = "Geen gekoppeld persoonsdossier gevonden op dit BSN.";
      noneNote.style.display = "block";
    }
  }

  async function checkVoertuigByKenteken(kenteken) {
    const noneNote = document.getElementById("scanResultNoDossierNote");
    document.getElementById("scanResultOpenDossierBtn").style.display = "none";
    noneNote.style.display = "block";

    if (!kenteken) {
      noneNote.textContent = "Geen kenteken op dit document.";
      return;
    }

    const matches = await callBackend("meos_searchVoertuigen", { plate: kenteken });
    if (matches && matches.length) {
      noneNote.textContent = "Kenteken bekend in het systeem.";
    } else {
      noneNote.textContent = "Kenteken niet gevonden in het systeem.";
    }
  }

  async function renderScanResult(doc) {
    const banner = document.getElementById("scanResultBanner");
    banner.textContent = doc.isOwnUse ? "Eigen document" : "Getoond door burger";
    banner.className = "status-badge " + (doc.isOwnUse ? "status-eigen" : "status-getoond");

    const fieldsEl = document.getElementById("scanResultFields");
    const titleEl = document.getElementById("scanResultTitle");

    if (doc.documentType === "id_card" || doc.documentType === "passport") {
      const typeLabel = doc.documentType === "passport" ? "Paspoort" : "ID-kaart";
      titleEl.textContent = typeLabel;
      fieldsEl.innerHTML = [
        scanResultRow("Type document", typeLabel),
        scanResultRow("Naam", (doc.voornaam || "?") + " " + (doc.achternaam || "?")),
        scanResultRow("Geslacht", formatGeslacht(doc.geslacht)),
        scanResultRow("Nationaliteit", doc.nationaliteit || "Onbekend"),
        scanResultRow("Geboortedatum", doc.geboortedatum || "-"),
        scanResultRow("BSN", doc.bsn || "-"),
        scanResultRow("Documentnummer", doc.documentNumber || "-"),
        scanResultRow("Uitgegeven op", doc.issuedAt || "-"),
        scanResultRow("Verloopt op", doc.expiresAt || "-")
      ].join("");
      await linkPersoonByBsn(doc.bsn);
    } else if (doc.documentType === "rijbewijs") {
      titleEl.textContent = "Rijbewijs";
      const categorieRows = (doc.categories || []).map((c) =>
        scanResultRow("Categorie " + c.category, "Geldig " + (c.issuedAt || "-") + " t/m " + (c.expiresAt || "-"))
      );
      fieldsEl.innerHTML = [
        scanResultRow("Type document", "Rijbewijs"),
        scanResultRow("Naam", (doc.voornaam || "?") + " " + (doc.achternaam || "?")),
        scanResultRow("Geboortedatum", doc.geboortedatum || "-"),
        scanResultRow("Geboorteplaats", doc.geboorteplaats || "-"),
        scanResultRow("BSN", doc.bsn || "-"),
        scanResultRow("Afgevende instantie", doc.issuingAuthority || "-"),
        ...categorieRows
      ].join("");
      await linkPersoonByBsn(doc.bsn);
    } else if (doc.documentType === "kentekenbewijs") {
      titleEl.textContent = "Kentekenbewijs";
      fieldsEl.innerHTML = [
        scanResultRow("Type document", "Kentekenbewijs"),
        scanResultRow("Kenteken", doc.kenteken || "-"),
        scanResultRow("Documentnummer", doc.documentNumber || "-"),
        scanResultRow("Merk", doc.merk || "-"),
        scanResultRow("Kleur", doc.kleur || "-"),
        scanResultRow("Tenaamgestelde", (doc.eigenaarVoornaam || "?") + " " + (doc.eigenaarAchternaam || "?")),
        scanResultRow("Geregistreerd op", doc.registeredAt || "-")
      ].join("");
      await checkVoertuigByKenteken(doc.kenteken);
    } else {
      titleEl.textContent = "Onbekend document";
      fieldsEl.innerHTML = scanResultRow("Type document", doc.documentType || "Onbekend");
      document.getElementById("scanResultOpenDossierBtn").style.display = "none";
      document.getElementById("scanResultNoDossierNote").style.display = "none";
    }
  }

  function openVehicleDetail(detailKey) {
    const data = vehicleDetails[detailKey];
    if (!data) return;
    document.getElementById("vehicleDetailIconWrap").innerHTML = data.icon;
    document.getElementById("vehicleDetailTitle").textContent = data.title;
    document.getElementById("vehicleDetailSub").textContent = data.sub;
    document.getElementById("vehicleDetailHeaderTitle").textContent = data.title;
    pushPage("page-voertuig-detail");
    addVehicleHistory(data.title);

    console.log("MEOS: Vervoermiddel detail opened ->", detailKey);
  }

  let currentPersonResults = [];

  function renderPersonResults(list, containerId, countId) {
    currentPersonResults = list;
    const container = document.getElementById(containerId || "zoekPersonenResults");
    const countEl = document.getElementById(countId || "zoekPersonenResultCount");
    if (!container || !countEl) return;
    countEl.textContent = `${list.length} persoon/personen`;
    container.innerHTML = list
      .map(
        (p) => `
        <button class="feit-card" data-person-id="${p.identifier}">
          <span class="feit-card-title">${p.naam}</span>
          <span class="feit-card-desc">${p.geboortedatum || "-"}${p.adres ? " - " + p.adres : ""}</span>
        </button>`
      )
      .join("");

    container.querySelectorAll(".feit-card").forEach((card) => {
      card.addEventListener("click", () => openPersonProfile(card.dataset.personId));
    });
  }

  const MIN_AUTOCOMPLETE_LENGTH = 3;
  function meetsMinLength(value) {
    return !!value && value.length >= MIN_AUTOCOMPLETE_LENGTH;
  }

  async function searchPersonen() {
    const naamRaw = document.getElementById("zoekNaamInput").value.trim();
    const geboortedatumRaw = document.getElementById("zoekGeboortedatumInput").value.trim();
    const adresRaw = document.getElementById("zoekAdresInput").value.trim();
    const bsnRaw = document.getElementById("zoekBsnInput").value.trim();
    const geslachtRow = document.querySelector('.radio-row[data-group="zoek-geslacht"].active');
    const geslacht = geslachtRow && geslachtRow.dataset.value !== "alle" ? geslachtRow.dataset.value : null;

    const naam = meetsMinLength(naamRaw) ? naamRaw : "";
    const geboortedatum = meetsMinLength(geboortedatumRaw) ? geboortedatumRaw : "";
    const adres = meetsMinLength(adresRaw) ? adresRaw : "";
    const bsn = meetsMinLength(bsnRaw) ? bsnRaw : "";

    if (!naam && !geboortedatum && !adres && !bsn && !geslacht) {
      renderPersonResults([]);
      return;
    }

    const results = await callBackend("meos_searchPersonen", { naam, geboortedatum, adres, bsn, geslacht });
    renderPersonResults(results || []);
  }

  ["zoekNaamInput", "zoekGeboortedatumInput", "zoekAdresInput", "zoekBsnInput"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", searchPersonen);
  });
  const zoekPersonenBtn = document.getElementById("zoekPersonenBtn");
  if (zoekPersonenBtn) zoekPersonenBtn.addEventListener("click", searchPersonen);

  const simpleSearchConfig = {
    naam: { title: "Zoek op Naam", label: "Naam", placeholder: "Voor- en/of achternaam" },
    bsn: { title: "Zoek op Persoonssleutel", label: "BSN", placeholder: "Bijv. 123456789" },
    persoonsnummer: { title: "Zoek Persoonsnummer", label: "ID-kaartnummer", placeholder: "Bijv. NLD1234567" }
  };

  let currentSimpleSearchField = null;

  async function runSimpleSearch() {
    const input = document.getElementById("simpelZoekInput");
    if (!input || !currentSimpleSearchField) return;
    const query = input.value.trim();

    if (!meetsMinLength(query)) {
      renderPersonResults([], "simpelZoekResults", "simpelZoekResultCount");
      return;
    }

    const filters = {};
    filters[currentSimpleSearchField] = query;
    const results = await callBackend("meos_searchPersonen", filters);
    renderPersonResults(results || [], "simpelZoekResults", "simpelZoekResultCount");
  }

  function openSimpleSearch(fieldKey) {
    const config = simpleSearchConfig[fieldKey];
    if (!config) return;
    currentSimpleSearchField = fieldKey;
    document.getElementById("simpelZoekTitle").textContent = config.title;
    document.getElementById("simpelZoekLabel").textContent = config.label;
    const input = document.getElementById("simpelZoekInput");
    input.placeholder = config.placeholder;
    input.value = "";
    renderPersonResults([], "simpelZoekResults", "simpelZoekResultCount");
    pushPage("page-persoon-zoek-simpel");
  }

  document.querySelectorAll("[data-simple-search]").forEach((el) => {
    el.addEventListener("click", () => openSimpleSearch(el.dataset.simpleSearch));
  });

  const simpelZoekInput = document.getElementById("simpelZoekInput");
  const simpelZoekBtn = document.getElementById("simpelZoekBtn");
  if (simpelZoekInput) simpelZoekInput.addEventListener("input", runSimpleSearch);
  if (simpelZoekBtn) simpelZoekBtn.addEventListener("click", runSimpleSearch);

  function renderWantedAndWapenvergunning(wanted, wantedReason, heeftVerlof, heeftWapenvergunning) {
    const banner = document.getElementById("wantedBanner");
    const bannerText = document.getElementById("wantedBannerText");
    if (wanted) {
      banner.style.display = "flex";
      bannerText.textContent = wantedReason ? "Gezocht - " + wantedReason : "Gezocht";
    } else {
      banner.style.display = "none";
    }

    const wapenRow = document.getElementById("profielWapenvergunningRow");
    const wapenValue = document.getElementById("profielWapenvergunning");
    if (heeftVerlof) {
      wapenRow.style.display = "flex";
      wapenValue.textContent = heeftWapenvergunning ? "Ja" : "Nee";
    } else {

      wapenRow.style.display = "none";
    }
  }

  function clearZakenMutatiesBekeuringen() {
    document.getElementById("profielStatZaken").textContent = "0";
    document.getElementById("profielStatMutaties").textContent = "0";
    document.getElementById("profielStatBekeuringen").textContent = "0";
    document.getElementById("profielZakenList").innerHTML = '<p class="empty-inline">Geen zaken bekend.</p>';
    document.getElementById("profielMutatiesList").innerHTML = '<p class="empty-inline">Geen mutaties bekend.</p>';
    document.getElementById("profielBekeuringenList").innerHTML = '<p class="empty-inline">Geen bekeuringen bekend.</p>';
  }

  let currentProfileIdentifier = null;

  function openPersonProfile(identifier) {
    currentProfileIdentifier = identifier;
    const cached = currentPersonResults.find((item) => item.identifier === identifier);
    const naam = cached ? cached.naam : "-";

    document.getElementById("profielHeaderTitle").textContent = naam;
    document.getElementById("profielNaam").textContent = naam;
    document.getElementById("profielGeboortedatum").textContent = cached ? cached.geboortedatum || "-" : "-";
    document.getElementById("profielAdres").textContent = (cached && cached.adres) || "-";
    document.getElementById("profielBsn").textContent = (cached && cached.bsn) || "-";
    document.getElementById("profielGeslacht").textContent = cached ? cached.geslacht || "-" : "-";
    document.getElementById("profielLengte").textContent = "-";
    document.getElementById("profielNationaliteit").textContent = "-";
    document.getElementById("profielStatVoertuigen").textContent = "0";

    const koppelBtn = document.getElementById("koppelPersoonBtn");
    if (koppelBtn) {
      if (persoonAttachContext) {
        koppelBtn.style.display = "flex";
        koppelBtn.textContent = "Koppel aan " + attachTargetLabels[persoonAttachContext];
      } else {
        koppelBtn.style.display = "none";
      }
    }
    renderWantedAndWapenvergunning(false, null, false, false);
    clearZakenMutatiesBekeuringen();

    pushPage("page-persoon-profiel");
    addPersonHistory("Zoek op Naam: " + naam, identifier);

    callBackend("meos_getPersoonProfiel", { identifier }).then((real) => {
      if (!real) return;
      document.getElementById("profielHeaderTitle").textContent = real.naam;
      document.getElementById("profielNaam").textContent = real.naam;
      document.getElementById("profielGeboortedatum").textContent = real.geboortedatum;
      document.getElementById("profielGeslacht").textContent = real.geslacht;
      document.getElementById("profielLengte").textContent = real.lengte ? real.lengte + " cm" : "Onbekend";
      document.getElementById("profielNationaliteit").textContent = real.nationaliteit || "Onbekend";
      document.getElementById("profielBsn").textContent = real.bsn || "Onbekend";
      document.getElementById("profielStatVoertuigen").textContent = real.voertuigen;
      renderWantedAndWapenvergunning(real.wanted, real.wantedReason, real.heeftVerlof, real.heeftWapenvergunning);

      const mutaties = real.mutaties || [];
      const bekeuringen = real.bekeuringen || [];
      document.getElementById("profielStatMutaties").textContent = mutaties.length;
      document.getElementById("profielStatBekeuringen").textContent = bekeuringen.length;

      const mutatiesList = document.getElementById("profielMutatiesList");
      mutatiesList.innerHTML = mutaties.length
        ? mutaties
            .map((m) => `<button class="hotspot-sub-card clickable" data-doc-type="${m.type}" data-doc-id="${m.id}"><span class="hotspot-sub-card-title">${m.omschrijving}</span><span class="hotspot-sub-card-meta">${m.datum}</span></button>`)
            .join("")
        : '<p class="empty-inline">Geen mutaties bekend.</p>';

      const bekeuringenList = document.getElementById("profielBekeuringenList");
      bekeuringenList.innerHTML = bekeuringen.length
        ? bekeuringen
            .map((b) => `<button class="hotspot-sub-card clickable" data-doc-type="${b.type}" data-doc-id="${b.id}"><span class="hotspot-sub-card-title">${b.type}: ${b.omschrijving}</span><span class="hotspot-sub-card-meta">${b.datum}</span></button>`)
            .join("")
        : '<p class="empty-inline">Geen bekeuringen bekend.</p>';

      document.querySelectorAll("#profielMutatiesList [data-doc-id], #profielBekeuringenList [data-doc-id]").forEach((btn) => {
        btn.addEventListener("click", () => openDocumentDetail(btn.dataset.docType, btn.dataset.docId));
      });
    });
  }

  const documentDetailFieldMap = {
    Digibon: [
      ["feit", "Feit"],
      ["persoon", "Persoon"],
      ["voertuig", "Voertuig"],
      ["locatie", "Locatie"],
      ["reden_wetenschap", "Reden van wetenschap"],
      ["verklaring", "Verklaring"],
      ["datum", "Datum"]
    ],
    Mutatie: [
      ["situatie", "Situatie"],
      ["persoon", "Persoon"],
      ["voertuig", "Voertuig"],
      ["locatie", "Locatie"],
      ["toelichting", "Toelichting"],
      ["datum", "Datum"]
    ],
    Combibon: [
      ["soort", "Soort combibon"],
      ["feit", "Feit"],
      ["persoon", "Persoon"],
      ["voertuig", "Voertuig"],
      ["locatie", "Locatie"],
      ["datum", "Datum"]
    ]
  };

  function documentFieldValue(doc, key) {
    switch (key) {
      case "feit":
        return doc.feit_code ? doc.feit_code + (doc.feit_omschrijving ? " - " + doc.feit_omschrijving : "") : "-";
      case "persoon":
        return doc.persoon_identifier || "Niet gekoppeld";
      case "voertuig":
        return doc.voertuig_plate || "Niet gekoppeld";
      case "locatie":
        return doc.postcode ? doc.postcode + (doc.straat ? " - " + doc.straat : "") : "-";
      case "datum":
        return doc.created_at || "-";
      default:
        return doc[key] || "-";
    }
  }

  function renderDocumentDetail(doc) {
    document.getElementById("documentDetailTitle").textContent = doc.type;
    const fields = documentDetailFieldMap[doc.type] || [];
    document.getElementById("documentDetailFields").innerHTML = fields
      .map(([key, label]) => `<div class="profile-info-row"><span class="profile-info-label">${label}</span><span class="profile-info-value">${documentFieldValue(doc, key)}</span></div>`)
      .join("");
  }

  function openDocumentDetail(type, id) {
    document.getElementById("documentDetailTitle").textContent = type;
    document.getElementById("documentDetailFields").innerHTML = '<p class="empty-inline">Laden...</p>';
    pushPage("page-document-detail");

    callBackend("meos_getDocumentDetail", { type, id }).then((doc) => {
      if (!doc) {
        document.getElementById("documentDetailFields").innerHTML = '<p class="empty-inline">Kon dit document niet laden.</p>';
        return;
      }
      renderDocumentDetail(doc);
    });
  }

  document.querySelectorAll("[data-target]").forEach((el) => {
    el.addEventListener("click", () => {
      const pageId = "page-" + el.dataset.target;
      pushPage(pageId);
    });
  });

  const SCAN_DOCUMENT_TYPE_MAP = {
    paspoort: "passport",
    "id-kaart": "id_card",
    rijbewijs: "rijbewijs"
  };
  document.querySelectorAll("[data-detail]").forEach((tile) => {
    tile.addEventListener("click", () => {
      const expectedType = SCAN_DOCUMENT_TYPE_MAP[tile.dataset.detail];
      if (expectedType) {
        scanDocument(expectedType);
      } else {
        openPersonDetail(tile.dataset.detail);
      }
    });
  });

  document.querySelectorAll(".list-row[data-vehicle-detail]").forEach((row) => {
    row.addEventListener("click", () => {
      if (row.dataset.vehicleDetail === "scan-kenteken") {
        scanDocument("kentekenbewijs");
      } else {
        openVehicleDetail(row.dataset.vehicleDetail);
      }
    });
  });

  document.querySelectorAll("[data-back]").forEach((btn) => {
    btn.addEventListener("click", goBack);
  });

  const HISTORY_LIMIT = 100;
  const personHistory = [];
  const vehicleHistory = [];

  function renderHistoryList(listEl, emptyEl, entries, clickable) {
    if (!listEl || !emptyEl) return;
    emptyEl.style.display = entries.length ? "none" : "block";
    listEl.innerHTML = entries
      .map((entry) => {
        const tag = clickable && entry.identifier ? "button" : "div";
        const idAttr = clickable && entry.identifier ? ` data-history-identifier="${entry.identifier}"` : "";
        const cls = clickable && entry.identifier ? "hotspot-sub-card clickable" : "hotspot-sub-card";
        return `
        <${tag} class="${cls}"${idAttr}>
          <span class="hotspot-sub-card-title">${entry.label}</span>
          <span class="hotspot-sub-card-meta">${entry.time}</span>
        </${tag}>`;
      })
      .join("");

    if (clickable) {
      listEl.querySelectorAll("[data-history-identifier]").forEach((btn) => {
        btn.addEventListener("click", () => openPersonProfile(btn.dataset.historyIdentifier));
      });
    }
  }

  function addPersonHistory(label, targetIdentifier) {
    personHistory.unshift({ label, time: formatAmsterdamDateTime(), identifier: targetIdentifier });
    if (personHistory.length > HISTORY_LIMIT) personHistory.length = HISTORY_LIMIT;
    renderHistoryList(document.getElementById("personHistoryList"), document.getElementById("personHistoryEmpty"), personHistory, true);
    callBackend("meos_logLookup", { type: "persoon", label, targetIdentifier });
  }

  function addVehicleHistory(label, targetIdentifier) {

    vehicleHistory.unshift({ label, time: formatAmsterdamDateTime() });
    if (vehicleHistory.length > HISTORY_LIMIT) vehicleHistory.length = HISTORY_LIMIT;
    renderHistoryList(document.getElementById("vehicleHistoryList"), document.getElementById("vehicleHistoryEmpty"), vehicleHistory, false);
    callBackend("meos_logLookup", { type: "voertuig", label, targetIdentifier });
  }

  renderHistoryList(document.getElementById("personHistoryList"), document.getElementById("personHistoryEmpty"), personHistory, true);
  renderHistoryList(document.getElementById("vehicleHistoryList"), document.getElementById("vehicleHistoryEmpty"), vehicleHistory, false);

  ["persoon", "voertuig"].forEach((type) => {
    callBackend("meos_getLookupHistory", { type }).then((rows) => {
      if (!rows) return;
      const isPersoon = type === "persoon";
      const entries = rows.map((r) => ({
        label: r.label,
        time: r.created_at,
        identifier: isPersoon ? r.target_identifier : undefined
      }));
      const listEl = document.getElementById(isPersoon ? "personHistoryList" : "vehicleHistoryList");
      const emptyEl = document.getElementById(isPersoon ? "personHistoryEmpty" : "vehicleHistoryEmpty");
      renderHistoryList(listEl, emptyEl, entries, isPersoon);
    });
  });

  document.querySelectorAll(".drawer-item[data-section]").forEach((item) => {
    item.addEventListener("click", () => jumpToSection(item.dataset.section));
  });

  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const themeToggleSwitch = document.getElementById("themeToggleSwitch");
  if (themeToggleBtn && themeToggleSwitch) {
    themeToggleBtn.addEventListener("click", () => {
      app.classList.toggle("light-theme");
      themeToggleSwitch.classList.toggle("active");
    });
  }

  const neemOverBtn = document.getElementById("neemOverBtn");
  if (neemOverBtn) {
    neemOverBtn.addEventListener("click", () => {
      closeDrawer();
      notifyComingSoon();
    });
  }

  function formatAmsterdamDateTime() {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("nl-NL", {
      timeZone: "Europe/Amsterdam",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).formatToParts(now);
    const get = (type) => parts.find((p) => p.type === type)?.value || "";
    return `${get("day")}-${get("month")}-${get("year")} om ${get("hour")}:${get("minute")} uur`;
  }

  function tickClocks() {
    const str = formatAmsterdamDateTime();
    const digibonEl = document.getElementById("digibonDateTime");
    if (digibonEl) digibonEl.textContent = str;
    const mutatieEl = document.getElementById("mutatieDateTime");
    if (mutatieEl) mutatieEl.textContent = str;
    const combibonEl = document.getElementById("combibonDateTime");
    if (combibonEl) combibonEl.textContent = str;
    const sightingEl = document.getElementById("sightingDateLabel");
    if (sightingEl) sightingEl.textContent = "Datum: " + str;
  }
  tickClocks();
  setInterval(tickClocks, 30000);

  async function getStraatByPostcode(postcode) {
    const result = await callBackend("meos_getStraatByPostcode", { postcode });
    return result ? result.straat : null;
  }

  const locatieDocumenten = [];

  function logLocatieDocument(postcode, straat) {
    if (!postcode) return;
    const parentPageId = pageStack[pageStack.length - 2];
    const parentLabel =
      { "page-digibon": "Digibon", "page-mutatie": "Mutatie", "page-combibon": "Combibon" }[parentPageId] || "Melding";
    locatieDocumenten.unshift({
      type: parentLabel,
      postcode,
      straat: straat || "Onbekende straat",
      tijdstip: formatAmsterdamDateTime()
    });
  }

  function wireLocatieFormField(postcodeId, straatId, autoBtnId, saveBtnId, onSave) {
    const postcodeInput = document.getElementById(postcodeId);
    const straatInput = document.getElementById(straatId);
    const autoBtn = document.getElementById(autoBtnId);
    const saveBtn = document.getElementById(saveBtnId);
    if (!postcodeInput || !straatInput) return;

    postcodeInput.addEventListener("input", async () => {
      const postcode = postcodeInput.value.trim();
      if (!postcode) return;
      const match = await getStraatByPostcode(postcode);
      if (match) straatInput.value = match;
    });

    if (autoBtn) {
      autoBtn.addEventListener("click", async () => {
        const nearest = await callBackend("meos_getNearestPostcode");

        if (nearest) {
          postcodeInput.value = nearest.postcode;
          straatInput.value = nearest.straat;
        } else {

          showToast("Locatie kon niet automatisch worden bepaald. Vul de postcode handmatig in.");
        }
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        const postcode = postcodeInput.value.trim();
        const straat = straatInput.value.trim();
        if (!postcode) {
          showToast("Vul eerst een postcode in.");
          return;
        }
        logLocatieDocument(postcode, straat);
        if (typeof onSave === "function") onSave(postcode, straat);
        goBack();
      });
    }
  }

  wireLocatieFormField("pleeglocatiePostcodeInput", "pleeglocatieStraatInput", "pleeglocatieAutoBtn", "pleeglocatieSaveBtn", (postcode, straat) =>
    applyLocatieSelection(postcode, straat)
  );
  wireLocatieFormField("plaatsVoorvalPostcodeInput", "plaatsVoorvalStraatInput", "plaatsVoorvalAutoBtn", "plaatsVoorvalSaveBtn", (postcode, straat) => {
    if (!currentMutatie) return;
    currentMutatie.postcode = postcode;
    currentMutatie.straat = straat;
    document.getElementById("mutatiePlaatsValue").textContent = postcode + " - " + straat;
    setFieldStatus("mutatiePlaatsStatus", "green", "check");
  });

  function selectRadio(group, value) {
    document.querySelectorAll(`.radio-row[data-group="${group}"]`).forEach((row) => {
      row.classList.toggle("active", row.dataset.value === value);
    });
    evaluateConditionalFields();
  }

  function evaluateConditionalFields() {

    const redenSection = document.getElementById("redenStaandehoudingSection");
    if (redenSection) {
      const staandehoudingActive = document.querySelector(
        '.radio-row[data-group="staandehouding"][data-value="staandehouding"].active'
      );
      redenSection.hidden = !staandehoudingActive;

      const redenAndersField = document.getElementById("redenStaandehoudingAndersField");
      if (redenAndersField) {
        const andersActive = document.querySelector(
          '.radio-row[data-group="reden-staandehouding"][data-value="anders"].active'
        );
        redenAndersField.hidden = !(staandehoudingActive && andersActive);
      }
    }

    const redenAndersFieldTop = document.getElementById("redenAndersField");
    if (redenAndersFieldTop) {
      const andersActive = document.querySelector('.radio-row[data-group="reden"][data-value="anders"].active');
      redenAndersFieldTop.hidden = !andersActive;
    }
  }

  document.querySelectorAll(".radio-row[data-group]").forEach((row) => {
    row.addEventListener("click", () => selectRadio(row.dataset.group, row.dataset.value));
  });

  document.querySelectorAll('.radio-row[data-group="zoek-geslacht"]').forEach((row) => {
    row.addEventListener("click", () => {
      if (typeof searchPersonen === "function") searchPersonen();
    });
  });

  selectRadio("staandehouding", "staandehouding");
  selectRadio("reden-staandehouding", "anders");
  selectRadio("new-hotspot-risk", "laag");
  selectRadio("new-goed-soort", "gevonden");
  selectRadio("zoek-geslacht", "alle");

  const sampleFeiten = [];
  let currentFeitCategorie = null;

  function renderFeitResults(list) {
    const container = document.getElementById("feitList");
    const countEl = document.getElementById("feitResultCount");
    if (!container || !countEl) return;
    countEl.textContent = `${list.length} feitcode(s) gevonden.`;
    container.innerHTML = list
      .map(
        (f) => `
        <button class="feit-card" data-code="${f.code}" data-desc="${f.desc}">
          <span class="feit-card-badge">${f.code.charAt(0).toUpperCase()}</span>
          <span class="feit-card-text">
            <span class="feit-card-title">${f.code} - ${f.price}</span>
            <span class="feit-card-desc">${f.desc}</span>
            ${f.categorie && !currentFeitCategorie ? `<span class="feit-card-categorie">${f.categorie}</span>` : ""}
          </span>
          <span class="feit-card-star" data-star="${f.code}" aria-label="Favoriet">
            <svg viewBox="0 0 24 24"><path d="m12 3 2.7 5.9 6.3.7-4.7 4.5 1.2 6.4-5.5-3.1-5.5 3.1 1.2-6.4-4.7-4.5 6.3-.7L12 3Z"/></svg>
          </span>
        </button>`
      )
      .join("");

    container.querySelectorAll(".feit-card").forEach((card) => {
      card.addEventListener("click", () => {
        applyFeitSelection(card.dataset.code, card.dataset.desc);
        goBack();
      });
    });

    container.querySelectorAll(".feit-card-star").forEach((star) => {
      star.addEventListener("click", (event) => {
        event.stopPropagation();
        star.classList.toggle("active");

        console.log("MEOS: Feitcode favoriet toggled ->", star.dataset.star, star.classList.contains("active"));
      });
    });
  }

  function mapBackendFeitcodes(rows) {
    return rows.map((r) => ({
      code: r.code,
      price: r.sanctiebedrag != null ? "€" + r.sanctiebedrag : "-",
      desc: r.omschrijving,
      categorie: r.categorie
    }));
  }

  async function runFeitSearch(query) {
    const backendRows = await callBackend("meos_getFeitcodes", { query, categorie: currentFeitCategorie });
    if (backendRows) {
      renderFeitResults(mapBackendFeitcodes(backendRows));
      return;
    }

    const filtered = query
      ? sampleFeiten.filter((f) => f.code.toLowerCase().includes(query.toLowerCase()))
      : sampleFeiten;
    renderFeitResults(filtered);
  }

  const feitSearchBtn = document.getElementById("feitSearchBtn");
  const feitInput = document.getElementById("feitInput");
  if (feitSearchBtn && feitInput) {
    feitInput.addEventListener("input", () => runFeitSearch(feitInput.value.trim()));
    feitSearchBtn.addEventListener("click", () => runFeitSearch(feitInput.value.trim()));
  }

  const riskLabels = { laag: "Laag", gemiddeld: "Gemiddeld", hoog: "Hoog" };

  const hotspots = [];

  let currentHotspotId = null;

  function renderHotspotList(list) {
    const container = document.getElementById("hotspotList");
    const countEl = document.getElementById("hotspotResultCount");
    if (!container || !countEl) return;
    countEl.textContent = `${list.length} locatie(s)`;
    container.innerHTML = list
      .map(
        (h) => `
        <button class="hotspot-card risk-${h.risk}" data-hotspot-id="${h.id}">
          <span class="hotspot-card-title">${h.name}</span>
          <span class="hotspot-card-meta">Postcode ${h.postcode} - ${h.feiten.length} meldingen - ${h.personen.length} bekende personen</span>
        </button>`
      )
      .join("");

    container.querySelectorAll(".hotspot-card").forEach((card) => {
      card.addEventListener("click", () => openHotspotDetail(card.dataset.hotspotId));
    });
  }

  async function renderPostcodeDocs(query) {
    const section = document.getElementById("postcodeDocsSection");
    const list = document.getElementById("postcodeDocsList");
    if (!section || !list) return;

    if (!query) {
      section.style.display = "none";
      list.innerHTML = "";
      return;
    }

    const backendRows = await callBackend("meos_getDocumentenByPostcode", { postcode: query });
    const matches = backendRows
      ? backendRows.map((r) => ({ type: r.type, postcode: r.postcode, straat: r.straat, omschrijving: r.omschrijving, tijdstip: r.created_at }))
      : locatieDocumenten.filter((d) => d.postcode.toLowerCase().includes(query));

    section.style.display = matches.length ? "block" : "none";
    list.innerHTML = matches
      .map(
        (d) => `
        <div class="hotspot-sub-card">
          <span class="hotspot-sub-card-title">${d.type} - postcode ${d.postcode} (${d.straat || "-"})${d.omschrijving ? ": " + d.omschrijving : ""}</span>
          <span class="hotspot-sub-card-meta">${d.tijdstip}</span>
        </div>`
      )
      .join("");
  }

  function renderHotspotDetail(hotspotId) {
    const h = hotspots.find((item) => item.id === hotspotId);
    if (!h) return;
    currentHotspotId = hotspotId;

    document.getElementById("hotspotDetailHeaderTitle").textContent = h.name;
    document.getElementById("hotspotDetailTitle").textContent = h.name;
    document.getElementById("hotspotDetailAddress").textContent = `${h.address} - Postcode ${h.postcode}`;

    const badge = document.getElementById("hotspotDetailRiskBadge");
    badge.textContent = riskLabels[h.risk];
    badge.className = "risk-badge risk-" + h.risk;

    document.getElementById("hotspotStatMeldingen").textContent = h.feiten.length;
    document.getElementById("hotspotStatPersonen").textContent = h.personen.length;

    const feitenList = document.getElementById("hotspotFeitenList");
    feitenList.innerHTML = h.feiten.length
      ? h.feiten
          .map((f) => `<div class="hotspot-sub-card"><span class="hotspot-sub-card-title">${f.title}</span><span class="hotspot-sub-card-meta">${f.meta}</span></div>`)
          .join("")
      : '<p class="empty-inline">Nog geen feiten geregistreerd op deze locatie.</p>';

    const personenList = document.getElementById("hotspotPersonenList");
    personenList.innerHTML = h.personen.length
      ? h.personen
          .map((p) => `<div class="hotspot-sub-card"><span class="hotspot-sub-card-title">${p.name}</span><span class="hotspot-sub-card-meta">${p.meta}</span></div>`)
          .join("")
      : '<p class="empty-inline">Nog geen personen bekend op deze locatie.</p>';
  }

  function openHotspotDetail(hotspotId) {
    renderHotspotDetail(hotspotId);
    pushPage("page-locatie-detail");

    console.log("MEOS: Locatie detail opened ->", hotspotId);
  }

  renderHotspotList(hotspots);

  const hotspotSearchInput = document.getElementById("hotspotSearchInput");
  if (hotspotSearchInput) {
    hotspotSearchInput.addEventListener("input", () => {
      const query = hotspotSearchInput.value.trim().toLowerCase();
      const filtered = query
        ? hotspots.filter((h) => h.name.toLowerCase().includes(query) || h.postcode.toLowerCase().includes(query))
        : hotspots;
      renderHotspotList(filtered);
      renderPostcodeDocs(query);
    });
  }

  const saveHotspotBtn = document.getElementById("saveHotspotBtn");
  if (saveHotspotBtn) {
    saveHotspotBtn.addEventListener("click", () => {
      const nameInput = document.getElementById("newHotspotName");
      const addressInput = document.getElementById("newHotspotAddress");
      const postcodeInput = document.getElementById("newHotspotPostcode");
      const riskRow = document.querySelector('.radio-row[data-group="new-hotspot-risk"].active');
      const name = nameInput.value.trim();
      if (!name) return;

      const newHotspot = {
        id: "hotspot-" + Date.now(),
        name,
        address: addressInput.value.trim() || "-",
        postcode: postcodeInput.value.trim() || "-",
        risk: riskRow ? riskRow.dataset.value : "laag",
        feiten: [],
        personen: []
      };
      hotspots.push(newHotspot);
      renderHotspotList(hotspots);

      nameInput.value = "";
      addressInput.value = "";
      postcodeInput.value = "";
      goBack();

      console.log("MEOS: Nieuwe locatie opgeslagen ->", newHotspot);
    });
  }

  function findHotspotByPostcode(postcode) {
    return hotspots.find((h) => h.postcode === postcode) || null;
  }

  async function renderDocsForPostcode(listId, emptyId, postcode) {
    const list = document.getElementById(listId);
    const emptyEl = document.getElementById(emptyId);
    if (!list) return;

    if (!postcode) {
      if (emptyEl) emptyEl.style.display = "block";
      list.innerHTML = "";
      return;
    }

    const backendRows = await callBackend("meos_getDocumentenByPostcode", { postcode });
    const matches = backendRows
      ? backendRows.map((r) => ({ type: r.type, postcode: r.postcode, straat: r.straat, omschrijving: r.omschrijving, tijdstip: r.created_at }))
      : locatieDocumenten.filter((d) => d.postcode === postcode);

    if (emptyEl) emptyEl.style.display = matches.length ? "none" : "block";
    list.innerHTML = matches
      .map(
        (d) => `
        <div class="hotspot-sub-card">
          <span class="hotspot-sub-card-title">${d.type} - postcode ${d.postcode} (${d.straat || "-"})${d.omschrijving ? ": " + d.omschrijving : ""}</span>
          <span class="hotspot-sub-card-meta">${d.tijdstip}</span>
        </div>`
      )
      .join("");
  }

  function showHotspotLink(riskBadgeId, openBtnId, hotspot) {
    const badge = document.getElementById(riskBadgeId);
    const openBtn = document.getElementById(openBtnId);
    if (!badge || !openBtn) return;
    if (hotspot) {
      badge.textContent = riskLabels[hotspot.risk];
      badge.className = "risk-badge risk-" + hotspot.risk;
      badge.style.display = "inline-flex";
      openBtn.style.display = "flex";
      openBtn.onclick = () => openHotspotDetail(hotspot.id);
    } else {
      badge.style.display = "none";
      openBtn.style.display = "none";
    }
  }

  async function runLocatieAuto() {
    const nearest = await callBackend("meos_getNearestPostcode");
    if (!nearest) {
      document.getElementById("locatieAutoStraat").textContent = "Geen postcodegegevens beschikbaar";
      document.getElementById("locatieAutoPostcode").textContent = "-";
      document.getElementById("locatieAutoRiskBadge").style.display = "none";
      document.getElementById("locatieAutoOpenHotspotBtn").style.display = "none";
      document.getElementById("locatieAutoHotspotEmpty").style.display = "block";
      renderDocsForPostcode("locatieAutoDocsList", "locatieAutoDocsEmpty", "");
      return;
    }

    document.getElementById("locatieAutoStraat").textContent = nearest.straat;
    document.getElementById("locatieAutoPostcode").textContent = "Postcode " + nearest.postcode;

    const hotspot = findHotspotByPostcode(nearest.postcode);
    showHotspotLink("locatieAutoRiskBadge", "locatieAutoOpenHotspotBtn", hotspot);
    document.getElementById("locatieAutoHotspotEmpty").style.display = hotspot ? "none" : "block";
    renderDocsForPostcode("locatieAutoDocsList", "locatieAutoDocsEmpty", nearest.postcode);
  }

  const locatieAutoTrigger = document.querySelector('.list-row[data-target="locatie-auto"]');
  if (locatieAutoTrigger) {
    locatieAutoTrigger.addEventListener("click", runLocatieAuto);
  }

  const locatieAutoRefreshBtn = document.getElementById("locatieAutoRefreshBtn");
  if (locatieAutoRefreshBtn) {
    locatieAutoRefreshBtn.addEventListener("click", runLocatieAuto);
  }

  async function runLocatiePostcodeSearch() {
    const input = document.getElementById("locatiePostcodeInput");
    const postcode = input.value.trim();
    const resultWrap = document.getElementById("locatiePostcodeResult");
    if (!postcode) {
      resultWrap.style.display = "none";
      document.getElementById("locatiePostcodeDocsEmpty").textContent = "Voer een postcode in om te zoeken.";
      document.getElementById("locatiePostcodeDocsEmpty").style.display = "block";
      document.getElementById("locatiePostcodeDocsList").innerHTML = "";
      return;
    }

    const straat = await getStraatByPostcode(postcode);
    resultWrap.style.display = "block";
    document.getElementById("locatiePostcodeStraat").textContent = straat || "Onbekende straat";
    document.getElementById("locatiePostcodePostcode").textContent = "Postcode " + postcode;

    const hotspot = findHotspotByPostcode(postcode);
    showHotspotLink("locatiePostcodeRiskBadge", "locatiePostcodeOpenHotspotBtn", hotspot);

    document.getElementById("locatiePostcodeDocsEmpty").textContent = "Geen meldingen bekend op deze postcode.";
    renderDocsForPostcode("locatiePostcodeDocsList", "locatiePostcodeDocsEmpty", postcode);
  }

  const locatiePostcodeInput = document.getElementById("locatiePostcodeInput");
  const locatiePostcodeSearchBtn = document.getElementById("locatiePostcodeSearchBtn");
  if (locatiePostcodeInput && locatiePostcodeSearchBtn) {
    locatiePostcodeInput.addEventListener("input", runLocatiePostcodeSearch);
    locatiePostcodeSearchBtn.addEventListener("click", runLocatiePostcodeSearch);
  }

  const addSightingBtn = document.getElementById("addSightingBtn");
  if (addSightingBtn) {
    addSightingBtn.addEventListener("click", () => pushPage("page-locatie-add-persoon"));
  }

  const saveSightingBtn = document.getElementById("saveSightingBtn");
  if (saveSightingBtn) {
    saveSightingBtn.addEventListener("click", () => {
      const nameInput = document.getElementById("sightingName");
      const noteInput = document.getElementById("sightingNote");
      const name = nameInput.value.trim();
      const h = hotspots.find((item) => item.id === currentHotspotId);
      if (!name || !h) return;

      h.personen.push({
        name,
        meta: `Laatst gezien ${formatAmsterdamDateTime()}${noteInput.value.trim() ? " - " + noteInput.value.trim() : ""}`
      });

      nameInput.value = "";
      noteInput.value = "";
      goBack();
      renderHotspotDetail(currentHotspotId);

      console.log("MEOS: Persoon toegevoegd aan locatie ->", currentHotspotId, name);
    });
  }

  const meldingStatusLabels = {
    nieuw: "Nieuw",
    onderweg: "Onderweg",
    "ter-plaatse": "Ter plaatse",
    afgehandeld: "Afgehandeld"
  };

  const meldingNextAction = {
    nieuw: { label: "Onderweg melden", next: "onderweg" },
    onderweg: { label: "Ter plaatse melden", next: "ter-plaatse" }
  };

  const meldingen = [];

  let currentMeldingId = null;

  function renderMeldingList() {
    const container = document.getElementById("meldingList");
    const countEl = document.getElementById("meldingResultCount");
    if (!container || !countEl) return;

    const sorted = [...meldingen].sort((a, b) => {
      const aDone = a.status === "afgehandeld" ? 1 : 0;
      const bDone = b.status === "afgehandeld" ? 1 : 0;
      return aDone - bDone;
    });

    countEl.textContent = `${meldingen.filter((m) => m.status !== "afgehandeld").length} actieve melding(en)`;
    container.innerHTML = sorted
      .map(
        (m) => `
        <button class="melding-card risk-${m.prio}" data-melding-id="${m.id}">
          <span class="melding-card-top">
            <span class="melding-card-title">${m.type}</span>
            <span class="status-badge status-${m.status}">${meldingStatusLabels[m.status]}</span>
          </span>
          <span class="melding-card-meta">${m.location} - ${m.time}</span>
        </button>`
      )
      .join("");

    container.querySelectorAll(".melding-card").forEach((card) => {
      card.addEventListener("click", () => openMeldingDetail(card.dataset.meldingId));
    });
  }

  function renderMeldingDetail(meldingId) {
    const m = meldingen.find((item) => item.id === meldingId);
    if (!m) return;
    currentMeldingId = meldingId;

    document.getElementById("meldingDetailHeaderTitle").textContent = m.type;
    document.getElementById("meldingDetailLocation").textContent = m.location;
    document.getElementById("meldingDetailTime").textContent = "Ontvangen om " + m.time;
    document.getElementById("meldingDetailDesc").textContent = m.omschrijving;

    const prioBadge = document.getElementById("meldingDetailPrioBadge");
    prioBadge.textContent = riskLabels[m.prio];
    prioBadge.className = "risk-badge risk-" + m.prio;

    const statusBadge = document.getElementById("meldingDetailStatusBadge");
    statusBadge.textContent = meldingStatusLabels[m.status];
    statusBadge.className = "status-badge status-" + m.status;

    const statusBtn = document.getElementById("meldingStatusBtn");
    const nextAction = meldingNextAction[m.status];
    if (nextAction && m.status !== "afgehandeld") {
      statusBtn.textContent = nextAction.label;
      statusBtn.style.display = "flex";
    } else {
      statusBtn.style.display = "none";
    }

    const afhandelenBtn = document.getElementById("meldingAfhandelenBtn");
    afhandelenBtn.textContent = m.status === "afgehandeld" ? "Melding afgehandeld" : "Afhandelen (EIND SITRAP)";
    afhandelenBtn.disabled = m.status === "afgehandeld";
  }

  function openMeldingDetail(meldingId) {
    renderMeldingDetail(meldingId);
    pushPage("page-melding-detail");

    console.log("MEOS: Melding geopend ->", meldingId);
  }

  renderMeldingList();

  const meldingStatusBtn = document.getElementById("meldingStatusBtn");
  if (meldingStatusBtn) {
    meldingStatusBtn.addEventListener("click", () => {
      const m = meldingen.find((item) => item.id === currentMeldingId);
      if (!m) return;
      const nextAction = meldingNextAction[m.status];
      if (!nextAction) return;
      m.status = nextAction.next;
      renderMeldingDetail(currentMeldingId);
      renderMeldingList();

      console.log("MEOS: Melding status bijgewerkt ->", currentMeldingId, m.status);
    });
  }

  const meldingAfhandelenBtn = document.getElementById("meldingAfhandelenBtn");
  if (meldingAfhandelenBtn) {
    meldingAfhandelenBtn.addEventListener("click", () => {
      if (meldingAfhandelenBtn.disabled) return;
      pushPage("page-melding-sitrap");
    });
  }

  const sitrapSubmitBtn = document.getElementById("sitrapSubmitBtn");
  if (sitrapSubmitBtn) {
    sitrapSubmitBtn.addEventListener("click", () => {
      const sitrapInput = document.getElementById("sitrapInput");
      const m = meldingen.find((item) => item.id === currentMeldingId);
      if (!m) return;

      m.status = "afgehandeld";
      m.sitrap = sitrapInput.value.trim();
      sitrapInput.value = "";

      goBack();
      renderMeldingDetail(currentMeldingId);
      renderMeldingList();

      console.log("MEOS: EIND SITRAP verstuurd ->", currentMeldingId, m.sitrap);
    });
  }

  const combibonSoortSaveBtn = document.getElementById("combibonSoortSaveBtn");
  if (combibonSoortSaveBtn) {
    combibonSoortSaveBtn.addEventListener("click", () => {
      const active = document.querySelector('.radio-row[data-group="combibon-soort"].active');
      if (!active) {
        showToast("Kies eerst een soort combibon.");
        return;
      }
      const title = active.querySelector(".soort-row-title").textContent;
      document.getElementById("combibonSoortValue").textContent = title;
      setFieldStatus("combibonSoortStatus", "green", "check");
      if (currentCombibon) currentCombibon.soort = active.dataset.value;

      goBack();
    });
  }

  const soortLabels = { inbeslag: "In beslag genomen", gevonden: "Gevonden / aangetroffen" };
  const goedStatusLabels = {
    "in-bewaring": "In bewaring",
    vrijgegeven: "Vrijgegeven",
    vernietigd: "Vernietigd",
    overgedragen: "Overgedragen"
  };
  const goedStatusCycle = ["in-bewaring", "vrijgegeven", "vernietigd", "overgedragen"];

  const goederen = [];

  let currentGoedId = null;

  function renderGoedList(list) {
    const container = document.getElementById("goedList");
    const countEl = document.getElementById("goedResultCount");
    if (!container || !countEl) return;
    countEl.textContent = `${list.length} goed(eren)`;
    container.innerHTML = list
      .map(
        (g) => `
        <button class="hotspot-card goed-card soort-${g.soort}" data-goed-id="${g.id}">
          <span class="hotspot-card-title">${g.omschrijving}</span>
          <span class="hotspot-card-meta">${soortLabels[g.soort]} - ${goedStatusLabels[g.status]}</span>
        </button>`
      )
      .join("");

    container.querySelectorAll(".goed-card").forEach((card) => {
      card.addEventListener("click", () => openGoedDetail(card.dataset.goedId));
    });
  }

  function renderGoedDetail(goedId) {
    const g = goederen.find((item) => item.id === goedId);
    if (!g) return;
    currentGoedId = goedId;

    document.getElementById("goedDetailHeaderTitle").textContent = g.omschrijving;
    document.getElementById("goedDetailSoort").textContent = soortLabels[g.soort];
    document.getElementById("goedDetailCategorie").textContent = g.categorie || "Onbekend";
    document.getElementById("goedDetailWaarde").textContent = g.waarde || "Onbekend";
    document.getElementById("goedDetailLocatie").textContent = g.locatie || "Niet opgegeven";
    document.getElementById("goedDetailDatum").textContent = g.datum;
    document.getElementById("goedDetailStatus").textContent = goedStatusLabels[g.status];
    document.getElementById("goedDetailPersoon").textContent = g.persoon || "Nog niet gekoppeld";

    const soortStatus = document.getElementById("goedDetailSoortStatus");
    soortStatus.className = "digibon-field-status " + (g.soort === "inbeslag" ? "status-orange" : "status-blue");
    soortStatus.innerHTML = g.soort === "inbeslag" ? '<span class="status-icon-text">!</span>' : '<span class="status-icon-text">?</span>';

    const statusColorMap = {
      "in-bewaring": "status-blue",
      vrijgegeven: "status-green",
      vernietigd: "status-orange",
      overgedragen: "status-orange"
    };
    const statusIndicator = document.getElementById("goedDetailStatusIndicator");
    statusIndicator.className = "digibon-field-status " + statusColorMap[g.status];
    statusIndicator.innerHTML =
      g.status === "vrijgegeven"
        ? '<svg viewBox="0 0 24 24" class="status-icon-svg"><path d="M4 12l5 5 11-11"/></svg>'
        : '<span class="status-icon-text">?</span>';
  }

  function openGoedDetail(goedId) {
    renderGoedDetail(goedId);
    pushPage("page-goed-detail");

    console.log("MEOS: Goed detail geopend ->", goedId);
  }

  renderGoedList(goederen);

  const goedSearchInput = document.getElementById("goedSearchInput");
  if (goedSearchInput) {
    goedSearchInput.addEventListener("input", () => {
      const query = goedSearchInput.value.trim().toLowerCase();
      const filtered = query
        ? goederen.filter((g) => g.omschrijving.toLowerCase().includes(query))
        : goederen;
      renderGoedList(filtered);
    });
  }

  const goedDetailStatusBtn = document.getElementById("goedDetailStatusBtn");
  if (goedDetailStatusBtn) {
    goedDetailStatusBtn.addEventListener("click", () => {
      const g = goederen.find((item) => item.id === currentGoedId);
      if (!g) return;
      const currentIndex = goedStatusCycle.indexOf(g.status);
      g.status = goedStatusCycle[(currentIndex + 1) % goedStatusCycle.length];
      renderGoedDetail(currentGoedId);
      renderGoedList(goederen);

      console.log("MEOS: Goed status gewijzigd ->", currentGoedId, g.status);
    });
  }

  const goedDeleteBtn = document.getElementById("goedDeleteBtn");
  if (goedDeleteBtn) {
    goedDeleteBtn.addEventListener("click", () => {
      const index = goederen.findIndex((item) => item.id === currentGoedId);
      if (index === -1) return;
      const removedId = currentGoedId;
      goederen.splice(index, 1);
      renderGoedList(goederen);
      goBack();

      console.log("MEOS: Goed verwijderd ->", removedId);
    });
  }

  const saveGoedBtn = document.getElementById("saveGoedBtn");
  if (saveGoedBtn) {
    saveGoedBtn.addEventListener("click", () => {
      const omschrijvingInput = document.getElementById("newGoedOmschrijving");
      const categorieInput = document.getElementById("newGoedCategorie");
      const waardeInput = document.getElementById("newGoedWaarde");
      const locatieInput = document.getElementById("newGoedLocatie");
      const soortRow = document.querySelector('.radio-row[data-group="new-goed-soort"].active');
      const omschrijving = omschrijvingInput.value.trim();
      if (!omschrijving) return;

      const newGoed = {
        id: "goed-" + Date.now(),
        omschrijving,
        soort: soortRow ? soortRow.dataset.value : "gevonden",
        categorie: categorieInput.value.trim() || "Overig",
        waarde: waardeInput.value.trim() || "Onbekend",
        locatie: locatieInput.value.trim() || "",
        datum: formatAmsterdamDateTime(),
        status: "in-bewaring",
        persoon: null
      };
      goederen.push(newGoed);
      renderGoedList(goederen);

      omschrijvingInput.value = "";
      categorieInput.value = "";
      waardeInput.value = "";
      locatieInput.value = "";
      goBack();

      console.log("MEOS: Nieuw goed opgeslagen ->", newGoed);
    });
  }

  const multimediaPhotos = [];
  let currentPhotoId = null;

  function renderMultimediaGrid() {
    const grid = document.getElementById("multimediaGrid");
    const emptyEl = document.getElementById("multimediaEmpty");
    const countEl = document.getElementById("multimediaResultCount");
    if (!grid || !emptyEl || !countEl) return;

    countEl.textContent = `${multimediaPhotos.length} bestand(en)`;
    emptyEl.style.display = multimediaPhotos.length ? "none" : "block";
    grid.innerHTML = multimediaPhotos
      .map((p) => `<button class="multimedia-thumb" data-photo-id="${p.id}"><img src="${p.url}" alt=""></button>`)
      .join("");

    grid.querySelectorAll(".multimedia-thumb").forEach((thumb) => {
      thumb.addEventListener("click", () => openPhotoView(thumb.dataset.photoId));
    });
  }

  function addPhoto(url) {
    if (!url) return;
    multimediaPhotos.unshift({ id: "photo-" + Date.now() + Math.random().toString(36).slice(2), url });
    renderMultimediaGrid();

    console.log("MEOS: Foto toegevoegd ->", url);
  }

  function openPhotoView(photoId) {
    const p = multimediaPhotos.find((item) => item.id === photoId);
    if (!p) return;
    currentPhotoId = photoId;
    document.getElementById("multimediaViewImg").src = p.url;
    pushPage("page-multimedia-view");
  }

  renderMultimediaGrid();

  const multimediaFallbackInput = document.createElement("input");
  multimediaFallbackInput.type = "file";
  multimediaFallbackInput.accept = "image/*";
  multimediaFallbackInput.style.display = "none";
  document.body.appendChild(multimediaFallbackInput);
  multimediaFallbackInput.addEventListener("change", () => {
    const file = multimediaFallbackInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => addPhoto(reader.result);
    reader.readAsDataURL(file);
    multimediaFallbackInput.value = "";
  });

  const takePhotoBtn = document.getElementById("takePhotoBtn");
  if (takePhotoBtn) {
    takePhotoBtn.addEventListener("click", () => {
      if (typeof useCamera === "function") {
        useCamera(
          (url) => addPhoto(url),
          { default: { type: "Photo", flash: false, camera: "rear" }, permissions: { toggleFlash: true, flipCamera: true, takePhoto: true } }
        );
      } else {

        multimediaFallbackInput.click();
      }
    });
  }

  const pickGalleryBtn = document.getElementById("pickGalleryBtn");
  if (pickGalleryBtn) {
    pickGalleryBtn.addEventListener("click", () => {
      if (typeof selectGallery === "function") {
        selectGallery({
          includeImages: true,
          includeVideos: false,
          cb: (data) => addPhoto(data)
        });
      } else {

        multimediaFallbackInput.click();
      }
    });
  }

  const multimediaDeleteBtn = document.getElementById("multimediaDeleteBtn");
  if (multimediaDeleteBtn) {
    multimediaDeleteBtn.addEventListener("click", () => {
      const index = multimediaPhotos.findIndex((item) => item.id === currentPhotoId);
      if (index === -1) return;
      multimediaPhotos.splice(index, 1);
      renderMultimediaGrid();
      goBack();
    });
  }

  function saveRedenWetenschap() {
    const active = document.querySelector('.radio-row[data-group="reden"].active');
    if (!active) {
      showToast("Kies eerst een reden van wetenschap.");
      return;
    }
    let summary = active.querySelector(".radio-label").textContent;
    if (active.dataset.value === "anders") {
      const extra = document.getElementById("redenAndersInput").value.trim();
      if (extra) summary += ": " + extra;
    }
    if (currentDigibon) {
      currentDigibon.redenWetenschap = summary;
      document.getElementById("digibonRedenValue").textContent = summary;
      setFieldStatus("digibonRedenStatus", "green", "check");
    }
    goBack();
  }

  function saveVerklaring() {
    const staandehoudingRow = document.querySelector('.radio-row[data-group="staandehouding"].active');
    if (!staandehoudingRow) {
      showToast("Vul eerst de verklaring in.");
      return;
    }
    let summary = staandehoudingRow.querySelector(".radio-label").textContent;
    if (staandehoudingRow.dataset.value === "staandehouding") {
      const redenRow = document.querySelector('.radio-row[data-group="reden-staandehouding"].active');
      if (redenRow) {
        summary += " - " + redenRow.querySelector(".radio-label").textContent;
        if (redenRow.dataset.value === "anders") {
          const extra = document.getElementById("redenStaandehoudingInput").value.trim();
          if (extra) summary += ": " + extra;
        }
      }
    }
    if (currentDigibon) {
      currentDigibon.verklaring = summary;
      document.getElementById("digibonVerklaringValue").textContent = summary;
      setFieldStatus("digibonVerklaringStatus", "green", "check");
    }
    goBack();
  }

  function saveSituatie() {
    const text = document.getElementById("situatieInput").value.trim();
    if (!text) {
      showToast("Vul eerst de situatie in.");
      return;
    }
    if (currentMutatie) {
      currentMutatie.situatie = text;
      document.getElementById("mutatieSituatieValue").textContent = text;
      setFieldStatus("mutatieSituatieStatus", "green", "check");
    }
    goBack();
  }

  function saveToelichting() {
    const text = document.getElementById("toelichtingInput").value.trim();
    if (!text) {
      showToast("Vul eerst een toelichting in.");
      return;
    }
    if (currentMutatie) {
      currentMutatie.toelichting = text;
      document.getElementById("mutatieToelichtingValue").textContent = text;
      setFieldStatus("mutatieToelichtingStatus", "green", "check");
    }
    goBack();
  }

  document.getElementById("redenSaveBtn")?.addEventListener("click", saveRedenWetenschap);
  document.getElementById("verklaringSaveBtn")?.addEventListener("click", saveVerklaring);
  document.getElementById("situatieSaveBtn")?.addEventListener("click", saveSituatie);
  document.getElementById("toelichtingSaveBtn")?.addEventListener("click", saveToelichting);

  async function submitDigibon() {
    if (!currentDigibon || !currentDigibon.feitCode) {
      showToast("Vul minimaal een Feit in.");
      return;
    }
    const result = await callBackend("meos_submitDigibon", currentDigibon);
    if (!result) {
      showToast("Geen verbinding met de server - niet opgeslagen.");
      return;
    }
    if (result.success) {
      showToast("Digibon verstuurd.");
      resetDigibonState();
      goBack();
    } else {
      showToast("Versturen van de Digibon is mislukt.");
    }
  }

  async function submitMutatie() {
    if (!currentMutatie || !currentMutatie.situatie || !currentMutatie.postcode) {
      showToast("Vul minimaal Situatie en Plaats voorval in.");
      return;
    }
    const result = await callBackend("meos_submitMutatie", currentMutatie);
    if (!result) {
      showToast("Geen verbinding met de server - niet opgeslagen.");
      return;
    }
    if (result.success) {
      showToast("Mutatie verstuurd.");
      resetMutatieState();
      goBack();
    } else {
      showToast("Versturen van de Mutatie is mislukt.");
    }
  }

  async function submitCombibon() {
    if (!currentCombibon || !currentCombibon.soort || !currentCombibon.feitCode) {
      showToast("Vul minimaal Soort combibon en Feit in.");
      return;
    }
    const result = await callBackend("meos_submitCombibon", currentCombibon);
    if (!result) {
      showToast("Geen verbinding met de server - niet opgeslagen.");
      return;
    }
    if (result.success) {
      showToast("Combibon verstuurd.");
      resetCombibonState();
      goBack();
    } else {
      showToast("Versturen van de Combibon is mislukt.");
    }
  }

  document.getElementById("digibonSubmitBtn")?.addEventListener("click", submitDigibon);
  document.getElementById("digibonSendBtn")?.addEventListener("click", submitDigibon);
  document.getElementById("mutatieSubmitBtn")?.addEventListener("click", submitMutatie);
  document.getElementById("mutatieSendBtn")?.addEventListener("click", submitMutatie);
  document.getElementById("combibonSubmitBtn")?.addEventListener("click", submitCombibon);
  document.getElementById("combibonSendBtn")?.addEventListener("click", submitCombibon);

  document.querySelectorAll(".menu-btn").forEach((btn) => {
    btn.addEventListener("click", toggleDrawer);
  });

  if (drawerBackdrop) {
    drawerBackdrop.addEventListener("click", closeDrawer);
  }

  showPage("page-main");
})();
