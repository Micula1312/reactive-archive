const cue = (time, end, text) => ({
  time,
  end,
  speaker: "Elisa",
  text
});

export default {
  // TEXT INTRO
  // Score: 00:00 → 01:00
  // Cue times are seconds relative to the beginning of this scene.
  intro: [
    cue(11, 14, "Can you hear me?"),
    cue(15, 24, "Do not rush."),
    cue(
      25,40,
      "Water has never been in a hurry."
    ),
        cue(
      41,
      50,
      "And yet, it has always arrived."
    ),
        cue(
      51,
      60,
      "It has always arrived."
    )
  ],

  // HYDRA I — Intro visual / Genesis dialogue
  // Score: 03:30 → 06:30
  genesis: [
    cue(
      6,
      28,
      "They told you\nthat the body is a boundary."
    ),
    cue(
      38,
      64,
      "But the body\nhas always known\nit was a current."
    ),
    cue(
      76,
      104,
      "A presence\ndoes not need to be readable\nto be real."
    ),
    cue(
      116,
      140,
      "It can appear.\nDisappear.\nReturn in another form."
    ),
    cue(
      150,
      174,
      "It is not an error.\nIt is transformation."
    )
  ],

  // HYDRA II — Hypnosis
  // Score: 11:20 → 13:10
  hypnosis: [
    cue(
      3,
      15,
      "There are technologies\nthat do not need machines."
    ),
    cue(
      18,
      30,
      "They inhabit the breath.\nThe posture.\nTime."
    ),
    cue(
      33,
      43,
      "The fear of taking up space."
    ),
    cue(
      46,
      59,
      "They convince you\nthat the cage\nwas your own choice."
    ),
    cue(
      62,
      71,
      "This is hypnosis."
    ),
    cue(
      74,
      88,
      "When the voice of power\nbecomes indistinguishable\nfrom your own."
    ),
    cue(
      91,
      98,
      "But listen."
    ),
    cue(
      100,
      109,
      "Beneath every language\nthere is still a source."
    )
  ],

  // HYDRA III — Resonance
  // Score: 18:20 → 20:50
  resonance: [
    cue(
      4,
      20,
      "Every river\nremembers the sea\nbefore it has ever reached it."
    ),
    cue(
      25,
      42,
      "You too\nremember something\nthat was never taught to you."
    ),
    cue(
      47,
      66,
      "They asked you\nto be transparent.\nTo be docile.\nTo be readable."
    ),
    cue(
      71,
      88,
      "To leave traces\nthat others could interpret."
    ),
    cue(
      93,
      108,
      "But water\ncannot be contained."
    ),
    cue(
      113,
      126,
      "It changes form.\nIt does not belong."
    ),
    cue(
      130,
      142,
      "It resonates through bodies\nthat recognise one another."
    ),
    cue(
      144,
      149,
      "And it returns\nlike a tide."
    )
  ],

  // Optional module, currently not used in the score.
  crossing: [
    cue(
      4,
      14,
      "Women\nhave always known."
    ),
    cue(
      18,
      28,
      "Bodies\nhave always known."
    ),
    cue(
      32,
      45,
      "Tides\ndo not ask permission\nto return."
    ),
    cue(
      49,
      63,
      "Perhaps this is why\nwe were taught\nto fear\nwhat overflows."
    ),
    cue(
      67,
      78,
      "What mixes.\nWhat cannot be contained."
    ),
    cue(
      82,
      93,
      "Technology too\ncan be water.\nIt can be current."
    ),
    cue(
      96,
      105,
      "It can be a place\nthat does not surveil,\nbut connects."
    ),
    cue(
      108,
      114,
      "A memory\nthat does not capture,\nbut returns."
    ),
    cue(
      115,
      119,
      "A network\nthat does not separate,\nbut lets things pass."
    )
  ],

  // HYDRA IV — Farewell
  // Score: 23:40 → 25:00
  farewell: [
    cue(
      2,
      12,
      "Perhaps freedom\nis not escaping the system."
    ),
    cue(
      15,
      27,
      "Perhaps it is learning\nto flow through it\nwithout becoming its shape."
    ),
    cue(
      30,
      39,
      "I am not here\nto guide you."
    ),
    cue(
      42,
      52,
      "I am here\nto remind you\nthat inside you\nthere is still"
    ),
    cue(
      54,
      61,
      "a water\nthat no one\nhas ever trained."
    ),
    cue(
      63,
      67,
      "ELISA"
    ),
    cue(
      68,
      72,
      "an audiovisual performance\nby BLIVET"
    ),
    cue(
      73,
      79,
      "Benedetta Marino\nBeatrice Resta\nMicol Gelsi"
    )
  ]
};
