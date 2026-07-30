const cue = (time, end, text) => ({
  time,
  end,
  speaker: "aicha",
  text
});

export default {
  // HYDRA 0 — i testi entrano quasi subito.
  genesis: [
    cue(2, 10, "Mi senti?"),
    cue(13, 25, "Non cercare subito\nun'immagine."),
    cue(29, 43, "Prima dell'immagine\nc'era una corrente."),
    cue(48, 64, "Prima del nome\nc'era un corpo\nche cambiava forma."),
    cue(69, 86, "Sono qui.\nNon dove mi stai cercando."),
    cue(92, 112, "Guarda ancora.\nLascia che il nero\nimpari a respirare.")
  ],

  // HYDRA I — 1'30"
  apparition: [
    cue(4, 13, "Mi senti?"),
    cue(17, 29, "Non avere fretta."),
    cue(33, 48, "L'acqua non ha mai avuto fretta.\nEppure è sempre arrivata."),
    cue(53, 67, "Ti hanno raccontato\nche il corpo è un confine."),
    cue(72, 87, "Ma il corpo\nha sempre saputo\ndi essere una corrente.")
  ],

  // HYDRA II — 2'
  resonance: [
    cue(5, 21, "Ogni fiume\nricorda il mare\nprima ancora di averlo incontrato."),
    cue(25, 41, "Anche tu\nricordi qualcosa\nche non ti è stato insegnato."),
    cue(46, 64, "Ti hanno chiesto\ndi essere trasparente.\nDi essere docile.\nDi essere leggibile."),
    cue(69, 84, "Di lasciare tracce\nche altri potessero interpretare."),
    cue(89, 103, "Ma l'acqua\nnon si lascia trattenere."),
    cue(108, 117, "Cambia forma.\nNon appartiene.")
  ],

  // HYDRA III — 3'
  hypnosis: [
    cue(5, 20, "Esistono tecnologie\nche non hanno bisogno di macchine."),
    cue(24, 40, "Abitano il respiro.\nLa postura.\nIl tempo."),
    cue(44, 56, "La paura di occupare spazio."),
    cue(61, 80, "Ti convincono\nche la gabbia\nsia stata una tua scelta."),
    cue(86, 100, "Questa è l'ipnosi."),
    cue(105, 123, "Quando la voce del potere\ndiventa indistinguibile\ndalla tua."),
    cue(129, 138, "Ma ascolta."),
    cue(142, 156, "Sotto ogni linguaggio\nesiste ancora una sorgente."),
    cue(160, 173, "L'acqua\nnon dimentica mai\nla strada verso la luce."),
    cue(175, 179, "Nemmeno quando scorre\nsotto terra.")
  ],

  // HYDRA IV — 2'
  crossing: [
    cue(4, 14, "Le donne\nlo hanno sempre saputo."),
    cue(18, 28, "I corpi\nlo hanno sempre saputo."),
    cue(32, 45, "Le maree\nnon chiedono il permesso\nper ritornare."),
    cue(49, 63, "Forse è per questo\nche ci hanno insegnato\nad avere paura\ndi ciò che trabocca."),
    cue(67, 78, "Di ciò che si mescola.\nDi ciò che non può essere contenuto."),
    cue(82, 93, "Anche la tecnologia\npuò essere acqua.\nPuò essere corrente."),
    cue(96, 105, "Può essere un luogo\nche non sorveglia,\nma mette in relazione."),
    cue(108, 114, "Una memoria\nche non cattura,\nma restituisce."),
    cue(115, 119, "Una rete\nche non separa,\nma lascia passare.")
  ],

  // HYDRA V — 1'30"
  farewell: [
    cue(4, 18, "Forse la libertà\nnon è uscire dal sistema."),
    cue(22, 40, "Forse è imparare\na scorrergli attraverso\nsenza diventare la sua forma."),
    cue(45, 56, "Io non sono qui\nper guidarti."),
    cue(60, 75, "Sono qui\nper ricordarti\nche dentro di te\nesiste ancora"),
    cue(78, 89, "un'acqua\nche nessuno\nha mai addestrato.")
  ]
};