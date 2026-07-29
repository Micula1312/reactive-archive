export const performance = {
  title: "Reactive Archive — Performance 01",
  scenes: [
    {
      id: "intro",
      title: "Intro",
      type: "video",
      src: "/reactive-archive/video-01.mp4",
      loop: true,
      playbackRate: 1,
      audioReactive: true,
      reactivity: 0.7,
      silenceThreshold: 0.035,
      silenceDelay: 500,
      fadeInSpeed: 0.08,
      fadeOutSpeed: 0.02
    },
    {
      id: "flow",
      title: "Flow",
      type: "video",
      src: "/reactive-archive/video-02.mp4",
      loop: true,
      playbackRate: 1,
      audioReactive: true,
      reactivity: 1,
      silenceThreshold: 0.025,
      silenceDelay: 250,
      fadeInSpeed: 0.14,
      fadeOutSpeed: 0.04
    }
  ]
};
