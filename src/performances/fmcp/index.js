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
      audio: `${base}/audio/PRESET FMCP _ AI.mp3`,
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
      audio: `${base}/audio/PRESET FMCP_FORESTA mix v3.mp3`,
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
      id: "fmcp-as-the-pig",
      title: "AS THE PIG",
      type: "video",
      src: `${base}/videos/Fmcp_Visuals_As_The_Pig.mp4`,
      audio: `${base}/audio/PRESET FMCP_ AS THE PIG.mp3`,
      loop: true,
      advance: "manual",
      filter: {
        preset: "glitch",
        intensity: 0.72,
        bassImpact: 0.9,
        midFlow: 0.34,
        highDetail: 0.78
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
        preset: "glitch",
        intensity: 0.84,
        bassImpact: 0.94,
        midFlow: 0.3,
        highDetail: 0.88
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
        preset: "soft-gradient",
        intensity: 0.62,
        bassImpact: 0.32,
        midFlow: 0.86,
        highDetail: 0.16
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
      id: "fmcp-foresta",
      title: "FORESTA",
      type: "video",
      src: `${base}/videos/Fmcp_Visuals_Foresta.mp4`,
      audio: `${base}/audio/PRESET FMCP_FORESTA mix v3.mp3`,
      loop: true,
      advance: "manual",
      filter: {
        preset: "soft-gradient",
        intensity: 0.74,
        bassImpact: 0.48,
        midFlow: 0.92,
        highDetail: 0.2
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