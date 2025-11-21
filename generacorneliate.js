// struttura dati per liste
var DATA = {
  temi: [], // {A}
  verbi: [], // {V}
  concetti: [], // {C}
  luoghi: [], // {L}
  finali: [], // {F}
  poprefs: [], // {POP}
  templates: [], // stringhe con placeholder {A},{V},{C},{L},{F},{POP}
};

var urls = {
  temi: "temi.txt",
  verbi: "verbi.txt",
  concetti: "concetti.txt",
  luoghi: "luoghi.txt",
  finali: "finali.txt",
  poprefs: "poprefs.txt",
  templates: "templates.txt",
};

// utility: read a text file, split by newline, trim, filter empties
function fetchList(url) {
  return fetch(url)
    .then((resp) => {
      if (!resp.ok) throw new Error("Fetch error " + resp.status + " " + url);
      return resp.arrayBuffer();
    })
    .then((buffer) => {
      const dec = new TextDecoder("utf-8");
      return dec
        .decode(buffer)
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter((s) => s !== "");
    });
}

// carica tutti i file definiti in "urls" e popola DATA
function loadAllLists() {
  const keys = Object.keys(urls);
  const promises = keys.map((k) => fetchList(urls[k]));
  return Promise.all(promises)
    .then((results) => {
      keys.forEach((k, i) => (DATA[k] = results[i]));
      console.log(
        "Lists loaded:",
        Object.fromEntries(keys.map((k, i) => [k, DATA[k].length]))
      );
      // se vuoi generare automaticamente al load:
      if (document.getElementById("titolo")) getTitoloCornelio();
    })
    .catch((err) => {
      console.error("Errore caricamento liste:", err);
    });
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

// funzione che “aggiusta” combinazioni scorrette di preposizione + articolo
function fixConcordanza(titolo) {
  // rimuove combinazioni tipo "di la", "di il", "della il", "dopo la", ecc.
  titolo = titolo.replace(
    /\b(di|della|del|dello|dell’)\s+(il|la|lo|l’)\b/gi,
    "$1"
  );
  titolo = titolo.replace(/\b(dopo|per|sotto|sopra)\s+(il|la|lo|l’)\b/gi, "$1");

  // eventualmente puoi aggiungere altre regole qui
  // es: evitare doppie virgole o spazi strani
  titolo = titolo.replace(/\s{2,}/g, " ").trim();
  return titolo;
}

// genera un titolo (sceglie template casuale e lo riempie)
function getTitoloCornelio() {
  if (!DATA.templates || DATA.templates.length === 0) {
    console.warn("templates vuoto: assicurati di aver caricato templates.txt");
    document.getElementById("titolo").textContent = "— templates mancanti —";
    return "";
  }
  var t = rnd(DATA.templates);
  var titolo = fillTemplate(t);

  // **correzione grammaticale**
  titolo = fixConcordanza(titolo);

  // se hai un elemento #titolo nell'HTML
  var el = document.getElementById("titolo");
  if (el) el.textContent = titolo;
  return titolo;
}

// genera n titoli (ritorna array). Mostra il primo in #titolo, e opzionalmente append in #listaTitoli
function getTitoli(n) {
  n = n || 1;
  var res = [];
  for (var i = 0; i < n; i++) {
    res.push(getTitoloCornelio());
  }
  // se c'è un contenitore per lista, svuotalo e inserisci
  var listEl = document.getElementById("listaTitoli");
  if (listEl) {
    listEl.innerHTML = "";
    res.forEach((t) => {
      var p = document.createElement("p");
      p.className = "titolo-generato";
      p.textContent = t;
      listEl.appendChild(p);
    });
  }
  return res;
}

// force reload (utile per sviluppo)
function reloadData() {
  return loadAllLists();
}

// mostra alcuni esempi (usato per debug o preview)
function listExamples(count) {
  count = count || 10;
  var examples = [];
  for (var i = 0; i < count; i++)
    examples.push(fillTemplate(rnd(DATA.templates)));
  console.log("Esempi:", examples);
  return examples;
}

// auto load
window.addEventListener("load", function () {
  loadAllLists();
});
