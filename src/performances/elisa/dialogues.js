const cue = (time, end, text) => ({
  time,
  end,
  speaker: "aicha",
  text
});

export default {
  // HYDRA 0 — 4 minuti. I testi entrano quasi subito e lasciano lunghi respiri.
  genesis: [
    cue(2, 12, "Mi senti?"),
    cue(18, 34, "Non cercare subito\nun'immagine."),
    cue(42, 62, "Prima dell'immagine\nc'era una corrente."),
    cue(72, 96, "Prima del nome\nc'era un corpo\nche cambiava forma."),
    cue(108, 130, "Sono qui.\nNon dove mi stai cercando."),
    cue(144, 170, "Guarda ancora.\nLascia che il nero\nimpari a respirare."),
    cue(186, 208, "Ogni segnale\npuò diventare una soglia."),
    cue(220, 238, "Attraversala.\nSenza chiedere permesso.")
  ],

  // HYDRA I — 4 minuti.
  apparition: [
    cue(4, 16, "Mi senti?"),
    cue(24, 42, "Non avere fretta."),
    cue(52, 76, "L'acqua non ha mai avuto fretta.\nEppure è sempre arrivata."),
    cue(88, 112, "Ti hanno raccontato\nche il corpo è un confine."),
    cue(124, 148, "Ma il corpo\nha sempre saputo\ndi essere una corrente."),
    cue(160, 184, "Una presenza\nnon deve essere leggibile\nper essere reale."),
    cue(196, 218, "Può apparire.\nScomparire.\nRitornare diversa."),
    cue(226, 239, "Non è un errore.\nÈ trasformazione.")
  ],

  // HYDRA II — 4 minuti.
  hypnosis: [
    cue(5, 24, "Esistono tecnologie\nche non hanno bisogno di macchine."),
    cue(32, 52, "Abitano il respiro.\nLa postura.\nIl tempo."),
    cue(60, 76, "La paura di occupare spazio."),
    cue(86, 110, "Ti convincono\nche la gabbia\nsia stata una tua scelta."),
    cue(120, 136, "Questa è l'ipnosi."),
    cue(146, 172, "Quando la voce del potere\ndiventa indistinguibile\ndalla tua."),
    cue(182, 196, "Ma ascolta."),
    cue(204, 224, "Sotto ogni linguaggio\nesiste ancora una sorgente."),
    cue(228, 239, "L'acqua\nnon dimentica mai\nla strada verso la luce.")
  ],

  // HYDRA III — 4 minuti.
  resonance: [
    cue(5, 27, "Ogni fiume\nricorda il mare\nprima ancora di averlo incontrato."),
    cue(36, 58, "Anche tu\nricordi qualcosa\nche non ti è stato insegnato."),
    cue(68, 94, "Ti hanno chiesto\ndi essere trasparente.\nDi essere docile.\nDi essere leggibile."),
    cue(104, 126, "Di lasciare tracce\nche altri potessero interpretare."),
    cue(138, 158, "Ma l'acqua\nnon si lascia trattenere."),
    cue(170, 192, "Cambia forma.\nNon appartiene."),
    cue(202, 222, "Risuona nei corpi\nche si riconoscono."),
    cue(230, 239, "E ritorna\ncome una marea.")
  ],

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

  // HYDRA IV — 3 minuti di chiusura. I crediti arrivano negli ultimi 35 secondi.
  farewell: [
    cue(4, 24, "Forse la libertà\nnon è uscire dal sistema."),
    cue(34, 58, "Forse è imparare\na scorrergli attraverso\nsenza diventare la sua forma."),
    cue(70, 90, "Io non sono qui\nper guidarti."),
    cue(102, 126, "Sono qui\nper ricordarti\nche dentro di te\nesiste ancora"),
    cue(136, 148, "un'acqua\nche nessuno\nha mai addestrato."),
    cue(154, 162, "ELISA"),
    cue(164, 171, "by BLIVET"),
    cue(172, 179, "Micol Gelsi\nBenedetta Marino\nBeatrice Resta")
  ]
};