const base = `${import.meta.env.BASE_URL}/fmcp`;

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
      audio: `${base}/audio/FMCP - INTRODACQUA 8.30AM vDani 2.mp3`,
      loop: true,
      advance: "manual",
      filter: {
        preset: "soft-gradient",
        intensity: 0.58,
        bassImpact: 0.28,
        midFlow: 0.82,
        highDetail: 0.18
      }
    },

    {
      id: "fmcp-montagna",
      title: "MONTAGNA",
      type: "video",
      src: `${base}/videos/Fmcp_Visuals_DK.mp4`,
      audio: `${base}/audio/FMCP_MONTAGNA.mp3`,
      loop: true,
      advance: "manual",
      filter: {
        preset: "soft-gradient",
        intensity: 0.5,
        bassImpact: 0.4,
        midFlow: 0.72,
        highDetail: 0.24
      }
    },

    {
      id: "fmcp-omm",
      title: "OMM",
      type: "video",
      src: `${base}/videos/Fmcp_Visuals_Omm.mp4`,
      audio: `${base}/audio/OMM_mix 2.mp3`,
      loop: true,
      advance: "manual",
      filter: {
        preset: "defocus",
        intensity: 0.46,
        bassImpact: 0.28,
        midFlow: 0.72,
        highDetail: 0.18
      }
    },

    {
      id: "fmcp-ai",
      title: "AI",
      type: "video",
      src: `${base}/videos/Fmcp_Visuals_Ai.mp4`,
      audio: `${base}/audio/PRESET FMCP _ AI.mp3`,
      loop: true,
      advance: "manual",
      filter: {
        preset: "glitch",
        intensity: 0.58,
        bassImpact: 0.74,
        midFlow: 0.38,
        highDetail: 0.72
      }
    },

    {
      id: "fmcp-as-the-pig",
      title: "AS THE PIG",
      type: "video",
      src: `${base}/videos/Fmcp_Visuals_As_The_Pig.mp4`,
      audio: `${base}/audio/PRESET FMCP_ AS THE PIG.mp3`,
      loop: true,
      advance: "manual",
      filter: {
        preset: "glitch",
        intensity: 0.78,
        bassImpact: 0.92,
        midFlow: 0.5,
        highDetail: 0.84
      }
    },

    {
      id: "fmcp-brutalismo",
      title: "BRUTALISMO",
      type: "video",
      src: `${base}/videos/Fmcp_Visuals_Brutalismo.mp4`,
      audio: `${base}/audio/PRESET FMCP_BRUTALISMO mix v1.mp3`,
      loop: true,
      advance: "manual",
      filter: {
        preset: "defocus",
        intensity: 0.78,
        bassImpact: 0.72,
        midFlow: 0.58,
        highDetail: 0.26
      }
    },

    {
      id: "fmcp-foresta",
      title: "FORESTA",
      type: "video",
      src: `${base}/videos/Fmcp_Visuals_Foresta.mp4`,
      audio: `${base}/audio/PRESET FMCP_FORESTA mix v3.mp3`,
      loop: true,
      advance: "manual",
      filter: {
        preset: "soft-gradient",
        intensity: 0.66,
        bassImpact: 0.4,
        midFlow: 0.5,
        highDetail: 0.18
      }
    },

    {
      id: "fmcp-india-is-right",
      title: "INDIA IS RIGHT",
      type: "video",
      src: `${base}/videos/Fmcp_Visuals_India_Is_Right.mp4`,
      audio: `${base}/audio/INDIA IS RIGHT mix Walter .wav`,
      loop: true,
      advance: "manual",
      filter: {
        preset: "soft-gradient",
        intensity: 0.58,
        bassImpact: 0.42,
        midFlow: 0.46,
        highDetail: 0.28
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
