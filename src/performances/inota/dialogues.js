const cue = (time, end, text) => ({
  time,
  end,
  speaker: "",
  label: "",
  text
});

// INOTA standalone dialogues.
// Times are seconds relative to the beginning of each scene.
// Edit texts and timings directly here without touching the ELISA performance.
export default {
  scene01: [
    cue(8.496, 9.449, "Can you hear me?"),
    cue(9.767, 12.627, "Do not rush."),
    cue(12.945, 17.712, "Water has never been in a hurry."),
    cue(18.030, 20.890, "And yet, it has always arrived."),
    cue(21.208, 24.068, "It has always arrived."),
    cue(26.610, 33.602, "They told you\nthat the body is a boundary."),
    cue(36.780, 45.042, "But the body\nhas always known\nit was a current."),
    cue(48.856, 57.754, "A presence\ndoes not need to be readable\nto be real."),
    cue(61.568, 69.195, "It can appear.\nDisappear.\nReturn in another form."),
    cue(72.373, 80.000, "It is not an error.\nIt is transformation.")
  ],

  scene02: [
    cue(7.202, 16.009, "There are technologies\nthat do not need machines."),
    cue(18.211, 27.018, "They inhabit the breath.\nThe posture.\nTime."),
    cue(29.220, 36.560, "The fear of taking up space."),
    cue(38.761, 48.303, "They convince you\nthat the cage\nwas your own choice."),
    cue(50.505, 57.110, "This is hypnosis."),
    cue(59.312, 69.587, "When the voice of power\nbecomes indistinguishable\nfrom your own."),
    cue(71.789, 76.927, "But listen."),
    cue(78.394, 85.000, "Beneath every language\nthere is still a source.")
  ],

  scene03: [
    cue(7.013, 15.067, "Every river\nremembers the sea\nbefore it has ever reached it."),
    cue(17.584, 26.141, "You too\nremember something\nthat was never taught to you."),
    cue(28.658, 38.221, "They asked you\nto be transparent.\nTo be docile.\nTo be readable."),
    cue(40.738, 49.295, "To leave traces\nthat others could interpret."),
    cue(51.812, 59.362, "But water\ncannot be contained."),
    cue(61.879, 68.423, "It changes form.\nIt does not belong."),
    cue(70.436, 76.477, "It resonates through bodies\nthat recognise one another."),
    cue(77.483, 80.000, "And it returns\nlike a tide.")
  ],

  scene04: [
    cue(8.193, 16.176, "Women\nhave always known."),
    cue(19.370, 27.353, "Bodies\nhave always known."),
    cue(30.546, 40.924, "Tides\ndo not ask permission\nto return."),
    cue(44.118, 55.294, "Perhaps this is why\nwe were taught\nto fear\nwhat overflows."),
    cue(58.487, 67.269, "What mixes.\nWhat cannot be contained."),
    cue(70.462, 79.244, "Technology too\ncan be water.\nIt can be current."),
    cue(81.639, 88.824, "It can be a place\nthat does not surveil,\nbut connects."),
    cue(91.218, 96.008, "A memory\nthat does not capture,\nbut returns."),
    cue(96.807, 100.000, "A network\nthat does not separate,\nbut lets things pass.")
  ],

  scene05: [
    cue(7.658, 20.949, "Perhaps freedom\nis not escaping the system."),
    cue(24.937, 40.886, "Perhaps it is learning\nto flow through it\nwithout becoming its shape."),
    cue(44.873, 56.835, "I am not here\nto guide you."),
    cue(60.823, 74.114, "I am here\nto remind you\nthat inside you\nthere is still"),
    cue(76.772, 86.076, "a water\nthat no one\nhas ever trained."),
    cue(88.734, 94.051, "ELISA"),
    cue(95.380, 100.696, "an audiovisual performance\nby BLIVET"),
    cue(102.025, 110.000, "Benedetta Marino\nBeatrice Resta\nMicol Gelsi")
  ]
};
