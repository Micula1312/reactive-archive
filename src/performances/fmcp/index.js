const base = "/reactive-archive/fmcp";

const fmcp = {
  id: "fmcp",
  title: "FMCP",
  author: "FMCP",
  mode: "manual",
  audioPolicy: "microphone-first",

  scenes: [
    {
      id: "fmcp-intro-acqua",
      title: "INTRODACQUA 8.30AM",
      type: "video",
      src: `${base}/videos/FMCP_visuals_NO_TITLE.mp4`,
      audio: `${base}/audio/FMCP - INTRODACQUA.mp3`,
      loop: true,
      advance: "manual",
      filter: {
        preset: "soft-gradient",
        intensity: 0.75,
        bassImpact: 0.45,
        midFlow: 0.95,
        highDetail: 0.35
      }
    },

    {
      id: "fmcp-montagna",
      title: "MONTAGNA",
      type: "video",
      src: `${base}/videos/Fmcp_Visuals_DK.mp4`,
      audio: `${base}/audio/9_MONTAGNA.mp3`,
      loop: true,
      advance: "manual",
      filter: {
        preset: "soft-gradient",
        intensity: 0.68,
        bassImpact: 0.60,
        midFlow: 0.82,
        highDetail: 0.32
      }
    },

    {
      id: "fmcp-omm",
      title: "OMM",
      type: "video",
      src: `${base}/videos/Fmcp_Visuals_Omm.mp4`,
      audio: `${base}/audio/5_OMM.mp3`,
      loop: true,
      advance: "manual",
      filter: {
        preset: "defocus",
        intensity: 0.70,
        bassImpact: 0.40,
        midFlow: 0.90,
        highDetail: 0.25
      }
    },

    {
      id: "fmcp-ai",
      title: "AI",
      type: "video",
      src: `${base}/videos/Fmcp_Visuals_Ai.mp4`,
      audio: `${base}/audio/1_AI.mp3`,
      loop: true,
      advance: "manual",
      filter: {
        preset: "glitch",
        intensity: 0.90,
        bassImpact: 1.00,
        midFlow: 0.55,
        highDetail: 1.00
      }
    },

    {
      id: "fmcp-as-the-pig",
      title: "AS THE PIG",
      type: "video",
      src: `${base}/videos/Fmcp_Visuals_As_The_Pig.mp4`,
      audio: `${base}/audio/3_AS_THE_PIG.mp3`,
      loop: true,
      advance: "manual",
      filter: {
        preset: "glitch",
        intensity: 1.00,
        bassImpact: 1.00,
        midFlow: 0.65,
        highDetail: 1.00
      }
    },

    {
      id: "fmcp-brutalismo",
      title: "BRUTALISMO",
      type: "video",
      src: `${base}/videos/Fmcp_Visuals_Brutalismo.mp4`,
      audio: `${base}/audio/4_BRUTALISMO mix v1.mp3`,
      loop: true,
      advance: "manual",
      filter: {
        preset: "defocus",
        intensity: 0.92,
        bassImpact: 0.90,
        midFlow: 0.72,
        highDetail: 0.45
      }
    },

    {
      id: "fmcp-foresta",
      title: "FORESTA",
      type: "video",
      src: `${base}/videos/Fmcp_Visuals_Foresta.mp4`,
      audio: `${base}/audio/2_FORESTA.mp3`,
      loop: true,
      advance: "manual",
      filter: {
        preset: "soft-gradient",
        intensity: 0.82,
        bassImpact: 0.60,
        midFlow: 0.70,
        highDetail: 0.30
      }
    },

    {
      id: "fmcp-india-is-right",
      title: "INDIA IS RIGHT",
      type: "video",
      src: `${base}/videos/Fmcp_Visuals_India_Is_Right.mp4`,
      audio: null,
      loop: true,
      advance: "manual",
      filter: {
        preset: "soft-gradient",
        intensity: 0.78,
        bassImpact: 0.58,
        midFlow: 0.62,
        highDetail: 0.40
      }
    }
  ],

  alternateVisuals: [
    `${base}/videos/Fmcp_Visuals_Distorto.mp4`,
    `${base}/videos/Fmcp_Visuals_No_Title_2.mp4`,
    `${base}/videos/Fmcp_Visuals_No_Title_3.mp4`
  ]
};

export default fmcp;