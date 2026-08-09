const cue = (time, end, text) => ({
  time,
  end,
  speaker: "",
  label: "",
  text
});

// INOTA standalone dialogues.
// Times are seconds relative to the beginning of each scene.
export default {
  // 00:00 → 01:20
  scene01: [
    cue(4.496, 8.449, "Can you hear me?"),
    cue(9.767, 13.627, "Do not rush."),
    cue(14.945, 18.712, "Water has never been in a hurry."),
    cue(20.030, 25.890, "And yet, it has always arrived."),
    cue(27.610, 33.602, "They told you\nthat the body is a boundary."),
    cue(36.780, 45.042, "But the body\nhas always known\nit was a current."),
    cue(48.856, 57.754, "A presence\ndoes not need to be readable\nto be real."),
    cue(61.568, 69.195, "It can appear.\nDisappear.\nReturn in another form."),
    cue(72.373, 79.500, "It is not an error.\nIt is transformation.")
  ],

  // 01:20 → 03:00
  // 04-Video-Verticale starts at scene second 60 = MASTER 02:20.
  scene02: [
    cue(2.000, 13.000, "There are technologies\nthat do not need machines."),
    cue(16.000, 28.000, "They inhabit the breath.\nThe posture.\nTime."),
    cue(31.000, 40.000, "The fear of taking up space."),
    cue(43.000, 55.000, "They convince you\nthat the cage\nwas your own choice."),
    cue(58.000, 66.000, "This is hypnosis."),
    cue(69.000, 82.000, "When the voice of power\nbecomes indistinguishable\nfrom your own."),
    cue(85.000, 90.000, "But listen."),
    cue(92.000, 99.000, "Beneath every language\nthere is still a source.")
  ],

  // 03:00 → 04:26
  scene03: [
    cue(5.000, 14.000, "Every river\nremembers the sea\nbefore it has ever reached it."),
    cue(17.000, 24.000, "You too\nremember something\nthat was never taught to you."),
    cue(26.000, 35.000, "They asked you\nto be transparent.\nTo be docile.\nTo be readable."),
    cue(37.000, 45.000, "To leave traces\nthat others could interpret."),
    cue(48.000, 55.000, "But water\ncannot be contained."),
    cue(57.000, 64.000, "It changes form.\nIt does not belong."),
    cue(67.000, 74.000, "It resonates through bodies\nthat recognise one another."),
    cue(75.000, 85.500, "And it returns\nlike a tide.")
  ],

  // 04:26 → 06:00 — FORESTS
  // Starts directly from the "Perhaps freedom..." block.
  scene04: [
    cue(5.000, 19.000, "Perhaps freedom\nis not escaping the system."),
    cue(22.000, 39.000, "Perhaps it is learning\nto flow through it\nwithout becoming its shape."),
    cue(43.000, 56.000, "I am not here\nto guide you."),
    cue(60.000, 74.000, "I am here\nto remind you\nthat inside you\nthere is still"),
    cue(77.000, 89.000, "a light\nthat no one\nhas ever trained.")
  ],

  // 06:00 → 07:00 — FACE + CACOPHONY
  scene05: [
    cue(2.000, 7.000, "Women\nhave always known."),
    cue(8.500, 13.500, "Bodies\nhave always known."),
    cue(15.000, 22.000, "Tides\ndo not ask permission\nto return."),
    cue(24.000, 33.000, "Perhaps this is why\nwe were taught\nto fear\nwhat overflows."),
    cue(35.000, 41.000, "What mixes.\nWhat cannot be contained."),
    cue(43.000, 50.000, "Technology too\ncan be water.\nIt can be current."),
    cue(52.000, 60.000, "It can be a place\nthat does not surveil,\nbut connects.")
  ],

  // 07:00 → 08:00 — CREDITS ONLY
  scene06: [
    cue(1.000, 8.500, "A memory\nthat does not capture,\nbut returns."),
    cue(10.000, 20.700, "A network\nthat does not separate,\nbut lets things pass."),
    cue(25.000, 30.000, "ELISA"),
    cue(32.000, 46.000, "an audiovisual tale\nby BLIVET"),
    cue(50.000, 59.000, "Benedetta Marino\nBeatrice Resta\nMicol Gelsi")
  ]
};
