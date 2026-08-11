export default class SubtitleManager {
  constructor() {
    if (window.__reactiveArchiveSubtitleManager) return window.__reactiveArchiveSubtitleManager;
    this.scene = null; this.cues = []; this.currentCueIndex = -1; this.enabled = true;
    this.sceneStartedAt = 0; this.pendingShowTimer = null; this.typingTimer = null;
    this.lastToggleAt = 0; this.positionMode = "ceiling";
    this.injectStyles(); this.element = this.createLayer(); this.applyPositionMode();
    window.__reactiveArchiveSubtitleManager = this;
  }
  isInota() { return document.documentElement.dataset.performance === "inota" || document.body.dataset.performance === "inota"; }
  injectStyles() {
    if (document.querySelector("#performance-subtitle-styles")) return;
    const style = document.createElement("style"); style.id = "performance-subtitle-styles";
    style.textContent = `
#performance-subtitles{position:fixed;z-index:1000002;pointer-events:none;opacity:0;visibility:hidden;transition:opacity 240ms ease,visibility 0s linear 240ms;color:rgba(255,255,255,.98);font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono",monospace;font-size:clamp(14px,1vw,19px);font-weight:400;line-height:1.35;white-space:pre-line;text-align:center}
#performance-subtitles[data-inota="true"]{font-size:clamp(18px,1.45vw,46px)}
#performance-subtitles.is-visible{opacity:1;visibility:visible;transition-delay:0s}
#performance-subtitles .subtitle-window{display:inline-block;max-width:100%;padding:8px 16px;border:0;background:transparent;box-shadow:none;text-align:center}
#performance-subtitles[data-inota="true"][data-position="screen"] .subtitle-window{background:rgb(0 0 0 / 72%);padding:10px 18px 12px}
#performance-subtitles .subtitle-speaker{display:block;margin:0 0 .7em;font-size:.62em;font-weight:500;letter-spacing:.14em;line-height:1;text-transform:uppercase;opacity:.7}
#performance-subtitles .subtitle-speaker::before{content:"> "}
#performance-subtitles .subtitle-text{display:block}
#performance-subtitles.is-typing .subtitle-text::after{content:"_";display:inline-block;margin-left:.08em;animation:subtitle-cursor-blink 700ms steps(1,end) infinite}
@keyframes subtitle-cursor-blink{0%,45%{opacity:1}46%,100%{opacity:0}}
@media(prefers-reduced-motion:reduce){#performance-subtitles{transition:none}}
`;
    document.head.appendChild(style);
  }
  createLayer() {
    const existing = document.querySelector("#performance-subtitles"); if (existing instanceof HTMLElement) return existing;
    const layer = document.createElement("div"); layer.id = "performance-subtitles"; layer.setAttribute("aria-live","polite"); layer.setAttribute("aria-atomic","true");
    layer.innerHTML = `<span class="subtitle-window"><span class="subtitle-speaker"></span><span class="subtitle-text"></span></span>`;
    document.body.appendChild(layer); return layer;
  }
  applyPositionMode() { if (!this.element) return; this.element.dataset.position=this.positionMode; this.element.dataset.inota=this.isInota()?"true":"false"; this.syncPositionGeometry(); }
  syncPositionGeometry() {
    if (!this.element || !this.isInota()) return;
    // The source video is display:none in INOTA, so it has no usable geometry.
    // The visible 3600x2400 output is the canvas. Position subtitles from that canvas.
    const canvas = document.querySelector("#visual-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) return;
    const r = canvas.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return;
    const sx = r.width / 3600; const sy = r.height / 2400;
    const screenLeft = r.left + 840 * sx;
    const screenTop = r.top + 1200 * sy;
    const screenWidth = 1920 * sx;
    const screenHeight = 1200 * sy;
    this.element.style.transform = "translateX(-50%)";
    if (this.positionMode === "screen") {
      this.element.style.left = `${screenLeft + screenWidth / 2}px`;
      this.element.style.top = `${screenTop + 55 * sy}px`;
      this.element.style.width = `${screenWidth * 0.90}px`;
    } else {
      this.element.style.left = `${r.left + r.width / 2}px`;
      this.element.style.top = `${r.top + 400 * sy}px`;
      this.element.style.width = `${r.width * 0.88}px`;
    }
  }
  setPositionMode(mode){this.positionMode=mode==="screen"?"screen":"ceiling";this.applyPositionMode();return this.positionMode}
  togglePositionMode(){return this.setPositionMode(this.positionMode==="ceiling"?"screen":"ceiling")}
  getPositionMode(){return this.positionMode}
  setScene(scene){this.cancelPendingShow();this.cancelTyping();this.scene=scene??null;this.cues=this.normalizeCues(scene);this.currentCueIndex=-1;this.sceneStartedAt=performance.now();this.clear();this.syncPositionGeometry()}
  normalizeCues(scene){const source=scene?.subtitleCues??scene?.text??scene?.subtitles??[];if(!source)return[];if(typeof source==="string")return source.split(/\n\s*\n/g).map(text=>({text:text.trim(),speaker:"aicha"})).filter(c=>c.text);if(!Array.isArray(source))return[];return source.map(c=>typeof c==="string"?{text:c.trim(),speaker:"aicha"}:{...c,text:String(c?.text??"").trim()}).filter(c=>c.text)}
  setEnabled(enabled){this.enabled=Boolean(enabled);if(!this.enabled){this.cancelPendingShow();this.cancelTyping();this.clear()}}
  toggle(){const now=performance.now();if(now-this.lastToggleAt<80)return this.enabled;this.lastToggleAt=now;this.setEnabled(!this.enabled);if(this.enabled)this.currentCueIndex=-1;return this.enabled}
  update(){this.syncPositionGeometry();if(!this.enabled||!this.scene||!this.cues.length){this.clear();return}const elapsed=(performance.now()-this.sceneStartedAt)/1000;const i=this.getCueIndex(elapsed);if(i===this.currentCueIndex)return;this.currentCueIndex=i;this.cancelPendingShow();this.cancelTyping();if(i<0){this.clear();return}this.show(this.cues[i])}
  getCueIndex(elapsed){const timed=this.cues.some(c=>Number.isFinite(Number(c.time)));if(timed)return this.cues.findIndex((c,i)=>{const start=Number(c.time??0),next=Number(this.cues[i+1]?.time),end=Number.isFinite(Number(c.end))?Number(c.end):Number.isFinite(next)?next:Number.POSITIVE_INFINITY;return elapsed>=start&&elapsed<end});const sd=Number(this.scene?.duration??0)/1000,total=sd>0?sd:this.cues.length*6.5,d=Math.max(3.2,total/this.cues.length);return Math.min(this.cues.length-1,Math.floor(elapsed/d))}
  show(cue){const speaker=this.element.querySelector(".subtitle-speaker"),text=this.element.querySelector(".subtitle-text");this.element.classList.remove("is-visible","is-typing");this.pendingShowTimer=window.setTimeout(()=>{this.pendingShowTimer=null;if(!this.enabled)return;this.element.dataset.speaker=cue.speaker??"aicha";speaker.textContent=cue.label??this.formatSpeaker(cue.speaker);this.element.classList.add("is-visible");const full=cue.text??"";if(!this.scene?.subtitleTyping){text.textContent=full;return}text.textContent="";this.element.classList.add("is-typing");const speed=Math.max(8,Number(this.scene?.subtitleTypingSpeed??38));let i=0;this.typingTimer=window.setInterval(()=>{i++;text.textContent=full.slice(0,i);if(i>=full.length){this.cancelTyping();this.element.classList.remove("is-typing")}},speed)},150)}
  cancelPendingShow(){if(this.pendingShowTimer){window.clearTimeout(this.pendingShowTimer);this.pendingShowTimer=null}}
  cancelTyping(){if(this.typingTimer){window.clearInterval(this.typingTimer);this.typingTimer=null}this.element?.classList.remove("is-typing")}
  clear(){this.cancelTyping();this.element?.classList.remove("is-visible")}
  formatSpeaker(speaker){if(speaker==="voice")return"VOICE";if(speaker==="aicha")return"AICHA";return speaker?String(speaker).toUpperCase():""}
}
