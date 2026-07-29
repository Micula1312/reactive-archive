const aiVideo = "https://thearchiveoftheuntamed.xyz/wp/wp-content/uploads/2026/07/Fmcp_Visuals_Ai.mp4";
const asThePigVideo = "https://thearchiveoftheuntamed.xyz/wp/wp-content/uploads/2026/07/Fmcp-Visuals-As-The-Pig1.mp4";
const introAudio = "/reactive-archive/fmcp/audio/FMCP - INTRODACQUA 8.30AM vDani 2.mp3";

const placeholder = (id, title) => ({
  id,
  title,
  type: "text",
  text: "VIDEO NON CARICATO",
  cursor: false,
  typingSpeed: 18,
  fontSize: "clamp(20px, 3vw, 44px)",
  letterSpacing: "0.12em",
  lineHeight: 1.2,
  color: "#f5f5f5",
  background: "#080808",
  advance: "manual",
  audio: null
});

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
      src: aiVideo,
      audio: introAudio,
      loop: true,
      advance: "manual",
      filter: {
        preset: "soft-gradient",
        intensity: 0.42,
        bassImpact: 0.24,
        midFlow: 0.36,
        highDetail: 0.14
      }
    },

    placeholder("fmcp-montagna", "MONTAGNA"),
    placeholder("fmcp-omm", "OMM"),

    {
      id: "fmcp-ai",
      title: "AI",
      type: "video",
      src: aiVideo,
      audio: null,
      loop: true,
      advance: "manual",
      filter: {
        preset: "glitch",
        intensity: 0.34,
        bassImpact: 0.42,
        midFlow: 0.22,
        highDetail: 0.36
      }
    },

    {
      id: "fmcp-as-the-pig",
      title: "AS THE PIG",
      type: "video",
      src: asThePigVideo,
      audio: null,
      loop: true,
      advance: "manual",
      filter: {
        preset: "glitch",
        intensity: 0.42,
        bassImpact: 0.5,
        midFlow: 0.24,
        highDetail: 0.42
      }
    },

    placeholder("fmcp-brutalismo", "BRUTALISMO"),
    placeholder("fmcp-foresta", "FORESTA"),
    placeholder("fmcp-india-is-right", "INDIA IS RIGHT")
  ],

  alternateVisuals: []
};

export default fmcp;
