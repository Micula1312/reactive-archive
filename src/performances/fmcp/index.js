const base = `${import.meta.env.BASE_URL}performances/fmcp`;

const fmcp = {
  id: "fmcp",
  title: "FMCP — Viaggio nelle stagioni",
  author: "FMCP",
  mode: "manual",
  audioPolicy: "microphone-first",

  // Otto tracce come viaggio nel tempo e nelle stagioni:
  // inverno tecnologico → primavera poetica → estate euforica → autunno psichedelico.
  scenes: [
    {
      id: "fmcp-ai",
      title: "AI — INVERNO TECNOLOGICO",
      season: "winter",
      mood: "freddo, artificiale, digitale",
      type: "video",
      src: `${base}/videos/Fmcp_Visuals_Ai.mp4`,
      audio: `${base}/audio/1_AI.mp3`,
      loop: true,
      advance: "manual",
      filter: {
        preset: "glitch",
        intensity: 0.92,
        bassImpact: 0.82,
        midFlow: 0.38,
        highDetail: 1.0
      }
    },

    {
      id: "fmcp-as-the-pig",
      title: "AS THE PIG — INVERNO TECNOLOGICO",
      season: "winter",
      mood: "meccanico, freddo, aggressivo",
      type: "video",
      src: `${base}/videos/FMCP_visuals_NO_TITLE.mp4`,
      audio: `${base}/audio/3_AS_THE_PIG.mp3`,
      loop: true,
      advance: "manual",
      filter: {
        preset: "glitch",
        intensity: 1.0,
        bassImpact: 1.0,
        midFlow: 0.42,
        highDetail: 0.95
      }
    },

    {
      id: "fmcp-foresta",
      title: "FORESTA — PRIMAVERA",
      season: "spring",
      mood: "poetico, organico, luminoso",
      type: "video",
      src: `${base}/videos/Fmcp_Visuals_No_Title_2.mp4`,
      audio: `${base}/audio/2_FORESTA.mp3`,
      loop: true,
      advance: "manual",
      filter: {
        preset: "soft-gradient",
        intensity: 0.72,
        bassImpact: 0.42,
        midFlow: 0.96,
        highDetail: 0.34
      }
    },

    {
      id: "fmcp-brutalismo",
      title: "BRUTALISMO — PRIMAVERA",
      season: "spring",
      mood: "colorato, materico, poesia presa bene",
      type: "video",
      src: `${base}/videos/Fmcp_Visuals_Foresta.mp4`,
      audio: `${base}/audio/4_BRUTALISMO mix v1.mp3`,
      loop: true,
      advance: "manual",
      filter: {
        preset: "soft-gradient",
        intensity: 0.86,
        bassImpact: 0.62,
        midFlow: 0.88,
        highDetail: 0.46
      }
    },

    {
      id: "fmcp-india-is-right",
      title: "INDIA IS RIGHT — ESTATE",
      season: "summer",
      mood: "caldo, espansivo, euforico",
      type: "video",
      src: `${base}/videos/Fmcp_Visuals_India_Is_Right.mp4`,
      audio: `${base}/audio/6_INDIA.mp3`,
      loop: true,
      advance: "manual",
      filter: {
        preset: "soft-gradient",
        intensity: 0.9,
        bassImpact: 0.72,
        midFlow: 0.88,
        highDetail: 0.58
      }
    },

    {
      id: "fmcp-distorto",
      title: "DISTORTO — ESTATE",
      season: "summer",
      mood: "euforia, calore, accelerazione",
      type: "video",
      src: `${base}/videos/Fmcp_Visuals_Distorto.mp4`,
      audio: `${base}/audio/7_DISTORTO.mp3`,
      loop: true,
      advance: "manual",
      filter: {
        preset: "glitch",
        intensity: 0.96,
        bassImpact: 0.94,
        midFlow: 0.78,
        highDetail: 0.9
      }
    },

    {
      id: "fmcp-omm",
      title: "OMM — ESTATE",
      season: "summer",
      mood: "trance, apertura, euforia sospesa",
      type: "video",
      src: `${base}/videos/Fmcp_Visuals_No_Title_3.mp4`,
      audio: `${base}/audio/5_OMM.mp3`,
      loop: true,
      advance: "manual",
      filter: {
        preset: "defocus",
        intensity: 0.8,
        bassImpact: 0.5,
        midFlow: 1.0,
        highDetail: 0.3
      }
    },

    {
      id: "fmcp-montagna",
      title: "MONTAGNA / DARK — AUTUNNO PSICHEDELICO",
      season: "autumn",
      mood: "scuro, psichedelico, profondo",
      type: "video",
      src: `${base}/videos/Fmcp_Visuals_DK.mp4`,
      audio: `${base}/audio/9_MONTAGNA.mp3`,
      loop: true,
      advance: "manual",
      filter: {
        preset: "defocus",
        intensity: 0.94,
        bassImpact: 0.86,
        midFlow: 0.76,
        highDetail: 0.5
      }
    }
  ],

  // Il visual OMM resta fuori dalla regia principale ed è disponibile solo come riserva.
  alternateVisuals: [
    `${base}/videos/Fmcp_Visuals_Omm.mp4`
  ]
};

export default fmcp;