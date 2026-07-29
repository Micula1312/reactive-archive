console.log("APP UI NUOVO CARICATO");
export class UIManager {
  constructor({
    canvas,
    video,
    startScreen,
    startButton,
    status,
    debugPanel,
    audioValue,
    bassValue,
    midValue,
    highValue
  }) {
    this.canvas = canvas;
    this.video = video;
    this.startScreen = startScreen;
    this.startButton = startButton;
    this.status = status;
    this.debugPanel = debugPanel;
    this.audioValue = audioValue;
    this.bassValue = bassValue;
    this.midValue = midValue;
    this.highValue = highValue;

    this.callbacks = {
      start: null,
      nextVideo: null,
      previousVideo: null,
      selectVideo: null,
      toggleAudioReactive: null,
      toggleMicrophoneMode: null,
      restartVideo: null
    };

    this.handleKeydown =
      this.handleKeydown.bind(this);

    this.handleStartClick =
      this.handleStartClick.bind(this);

    this.startButton.addEventListener(
      "click",
      this.handleStartClick
    );

    window.addEventListener(
      "keydown",
      this.handleKeydown
    );
  }

  onStart(callback) {
    this.callbacks.start = callback;
  }

  onNextVideo(callback) {
    this.callbacks.nextVideo = callback;
  }

  onPreviousVideo(callback) {
    this.callbacks.previousVideo = callback;
  }

  onSelectVideo(callback) {
    this.callbacks.selectVideo = callback;
  }

  onToggleAudioReactive(callback) {
    this.callbacks.toggleAudioReactive =
      callback;
  }

  onToggleMicrophoneMode(callback) {
    this.callbacks.toggleMicrophoneMode =
      callback;
  }

  onRestartVideo(callback) {
    this.callbacks.restartVideo = callback;
  }

  async handleStartClick() {
    if (!this.callbacks.start) {
      return;
    }

    await this.callbacks.start();
  }

  handleKeydown(event) {
    const key = event.key.toLowerCase();

    if (event.code === "Space") {
      event.preventDefault();
      this.toggleVideoPlayback();
      return;
    }

    if (key === "f") {
      this.enterFullscreen();
      return;
    }

    if (key === "b") {
      this.toggleBlackout();
      return;
    }

    if (key === "h") {
      this.toggleDebugPanel();
      return;
    }

    if (
      event.key === "ArrowRight" ||
      event.key === "Enter"
    ) {
      event.preventDefault();

      this.callbacks.nextVideo?.();
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();

      this.callbacks.previousVideo?.();
      return;
    }

    if (/^[1-9]$/.test(key)) {
      const index = Number(key) - 1;

      this.callbacks.selectVideo?.(index);
      return;
    }

    if (key === "a") {
      this.callbacks
        .toggleAudioReactive?.();

      return;
    }

    if (key === "m") {
      this.callbacks
        .toggleMicrophoneMode?.();

      return;
    }

    if (key === "r") {
      this.callbacks.restartVideo?.();
    }
  }

  toggleVideoPlayback() {
    if (this.video.paused) {
      this.video
        .play()
        .catch(console.error);
    } else {
      this.video.pause();
    }
  }

  enterFullscreen() {
    document.documentElement
      .requestFullscreen()
      .catch(() => {});
  }

  toggleBlackout() {
    this.canvas.classList.toggle(
      "blackout"
    );
  }

  toggleDebugPanel() {
    this.debugPanel.hidden =
      !this.debugPanel.hidden;
  }

  setStatus(message) {
    this.status.textContent = message;
  }

  setStartButtonDisabled(disabled) {
    this.startButton.disabled = disabled;
  }

  hideStartScreen() {
    this.startScreen.hidden = true;
  }

  showStartScreen() {
    this.startScreen.hidden = false;
  }

  setAudioReactiveState(active) {
    this.debugPanel.dataset.audioActive =
      String(active);
  }

  updateAudioValues({
    level = 0,
    bass = 0,
    mid = 0,
    high = 0
  }) {
    this.audioValue.textContent =
      level.toFixed(3);

    this.bassValue.textContent =
      bass.toFixed(3);

    this.midValue.textContent =
      mid.toFixed(3);

    this.highValue.textContent =
      high.toFixed(3);
  }

  destroy() {
    this.startButton.removeEventListener(
      "click",
      this.handleStartClick
    );

    window.removeEventListener(
      "keydown",
      this.handleKeydown
    );
  }
}