// struttura dati per liste
const DATA = {
  temi: [], // {A}
  verbi: [], // {V}
  concetti: [], // {C}
  luoghi: [], // {L}
  finali: [], // {F}
  poprefs: [], // {POP}
  templates: [], // stringhe con placeholder {A},{V},{C},{L},{F},{POP}
};

const urls = {
  temi: "temi.txt",
  verbi: "verbi.txt",
  concetti: "concetti.txt",
  luoghi: "luoghi.txt",
  finali: "finali.txt",
  poprefs: "poprefs.txt",
  templates: "templates.txt",
};

// Cache per migliorare le performance
let cachedTemplates = null;

// utility: read a text file, split by newline, trim, filter empties
function fetchList(url) {
  return fetch(url)
    .then((resp) => {
      if (!resp.ok) {
        throw new Error(
          `Errore nel caricamento di ${url}: ${resp.status} ${resp.statusText}`
        );
      }
      return resp.text();
    })
    .then((text) => {
      return text
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter((s) => s !== "");
    })
    .catch((err) => {
      console.error(`Errore nel caricamento di ${url}:`, err);
      return [];
    });
}

// carica tutti i file definiti in "urls" e popola DATA
async function loadAllLists() {
  const keys = Object.keys(urls);
  const loadingPromises = keys.map((k) => fetchList(urls[k]));

  try {
    const results = await Promise.allSettled(loadingPromises);

    keys.forEach((k, i) => {
      if (results[i].status === "fulfilled") {
        DATA[k] = results[i].value;
      } else {
        console.warn(`Impossibile caricare ${k}:`, results[i].reason);
        DATA[k] = [];
      }
    });

    console.log(
      "Lists loaded:",
      Object.fromEntries(keys.map((k) => [k, DATA[k].length]))
    );

    // Prepara cache per i template
    cachedTemplates = [...DATA.templates];

    // Genera automaticamente al load se l'elemento esiste
    const titleElement = document.getElementById("titolo");
    if (titleElement) {
      getTitoloCornelio();
    }

    return true;
  } catch (err) {
    console.error("Errore critico nel caricamento liste:", err);
    return false;
  }
}

// helper: pick random element or fallback empty string
function rnd(list) {
  if (!list || list.length === 0) return "";
  return list[Math.floor(Math.random() * list.length)];
}

// funzione che applica un singolo template: sostituisce placeholders con elementi casuali
function fillTemplate(template) {
  // placeholders possibili: {A} {V} {C} {L} {F} {POP}
  return template
    .replace(/\{A\}/g, rnd(DATA.temi))
    .replace(/\{V\}/g, rnd(DATA.verbi))
    .replace(/\{C\}/g, rnd(DATA.concetti))
    .replace(/\{L\}/g, rnd(DATA.luoghi))
    .replace(/\{F\}/g, rnd(DATA.finali))
    .replace(/\{POP\}/g, rnd(DATA.poprefs));
}

// Mappa delle correzioni per le preposizioni articolate
const PREPOSITION_CORRECTIONS = {
  // Preposizione "di"
  "di il": "del",
  "di lo": "dello",
  "di la": "della",
  "di i": "dei",
  "di gli": "degli",
  "di le": "delle",
  "di l'": "dell'",

  // Preposizione "a"
  "a il": "al",
  "a lo": "allo",
  "a la": "alla",
  "a i": "ai",
  "a gli": "agli",
  "a le": "alle",
  "a l'": "all'",

  // Preposizione "da"
  "da il": "dal",
  "da lo": "dallo",
  "da la": "dalla",
  "da i": "dai",
  "da gli": "dagli",
  "da le": "dalle",
  "da l'": "dall'",

  // Preposizione "in"
  "in il": "nel",
  "in lo": "nello",
  "in la": "nella",
  "in i": "nei",
  "in gli": "negli",
  "in le": "nelle",
  "in l'": "nell'",

  // Preposizione "su"
  "su il": "sul",
  "su lo": "sullo",
  "su la": "sulla",
  "su i": "sui",
  "su gli": "sugli",
  "su le": "sulle",
  "su l'": "sull'",

  // Preposizione "con"
  "con il": "col",
  "con lo": "collo",
  "con la": "colla",
  "con i": "coi",
  "con gli": "cogli",
  "con le": "colle",

  // Altri casi comuni
  "tra il": "tra il", // non si apostrofa
  "tra lo": "tra lo",
  "tra la": "tra la",
  "tra i": "tra i",
  "tra gli": "tra gli",
  "tra le": "tra le",
  "tra l'": "tra l'",

  "fra il": "fra il",
  "fra lo": "fra lo",
  "fra la": "fra la",
  "fra i": "fra i",
  "fra gli": "fra gli",
  "fra le": "fra le",
  "fra l'": "fra l'",

  // Casi particolari con articoli indeterminativi
  "un il": "un",
  "un lo": "uno",
  "un la": "una",
  "un i": "dei",
  "un gli": "degli",
  "un le": "delle",
};

// funzione che corregge le concordanze grammaticali
function fixConcordanza(titolo) {
  if (!titolo || typeof titolo !== "string") return titolo;

  let corrected = titolo;

  // Applica le correzioni dalle preposizioni articolate
  Object.keys(PREPOSITION_CORRECTIONS).forEach((wrong) => {
    const regex = new RegExp(`\\b${wrong}\\b`, "gi");
    corrected = corrected.replace(regex, PREPOSITION_CORRECTIONS[wrong]);
  });

  // Correzioni per elisioni e troncamenti
  corrected = corrected
    // Elimina doppi articoli
    .replace(
      /\b(della|del|dello|dell'|alla|al|allo|all'|nella|nel|nello|nell'|sulla|sul|sullo|sull')\s+(il|la|lo|i|gli|le|l')\b/gi,
      "$1"
    )
    // Corregge "dopo il/la" -> "dopo il/la" (rimane invariato, ma elimina doppi)
    .replace(
      /\b(dopo|prima|sotto|sopra|entro)\s+(il|la|lo|i|gli|le|l')\s+(il|la|lo|i|gli|le|l')\b/gi,
      "$1 $2"
    )
    // Normalizza spazi multipli e trim
    .replace(/\s{2,}/g, " ")
    .trim();

  // Capitalizza la prima lettera
  if (corrected.length > 0) {
    corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1);
  }

  return corrected;
}

// genera un titolo (sceglie template casuale e lo riempie)
function getTitoloCornelio() {
  if (!DATA.templates || DATA.templates.length === 0) {
    console.warn("templates vuoto: assicurati di aver caricato templates.txt");
    const titleElement = document.getElementById("titolo");
    if (titleElement) {
      titleElement.textContent = "— templates mancanti —";
    }
    return "";
  }

  const template = rnd(DATA.templates);
  let titolo = fillTemplate(template);

  // Applica correzioni grammaticali
  titolo = fixConcordanza(titolo);

  // Aggiorna l'elemento titolo nell'HTML
  const titleElement = document.getElementById("titolo");
  if (titleElement) {
    titleElement.textContent = titolo;
    titleElement.setAttribute("aria-live", "polite");
  }

  return titolo;
}

// genera n titoli (ritorna array)
function getTitoli(n = 1) {
  const results = [];
  for (let i = 0; i < n; i++) {
    results.push(getTitoloCornelio());
  }
  return results;
}

// force reload (utile per sviluppo)
async function reloadData() {
  return await loadAllLists();
}

// mostra alcuni esempi (usato per debug o preview)
function listExamples(count = 10) {
  const examples = [];
  for (let i = 0; i < count; i++) {
    examples.push(fillTemplate(rnd(DATA.templates)));
  }
  console.log("Esempi:", examples);
  return examples;
}

// Gestione eventi UI
function setupEventListeners() {
  const generateBtn = document.getElementById("generate-btn");
  const loadingIndicator = document.getElementById("loading-indicator");

  if (generateBtn) {
    generateBtn.addEventListener("click", async function () {
      // Mostra indicatore di caricamento
      if (loadingIndicator) {
        loadingIndicator.classList.remove("hidden");
        generateBtn.disabled = true;
      }

      // Simula un piccolo delay per feedback visivo
      await new Promise((resolve) => setTimeout(resolve, 100));

      getTitoloCornelio();

      // Nascondi indicatore
      if (loadingIndicator) {
        loadingIndicator.classList.add("hidden");
        generateBtn.disabled = false;
      }
    });
  }
}

// auto load
document.addEventListener("DOMContentLoaded", function () {
  loadAllLists().then((success) => {
    if (success) {
      console.log("Generatore caricato con successo");
    } else {
      console.error("Errore nel caricamento del generatore");
      const titleElement = document.getElementById("titolo");
      if (titleElement) {
        titleElement.textContent = "Errore nel caricamento dei dati";
      }
    }
  });

  setupEventListeners();
});
