// ── src/voice/playVoiceStreamWithMimic.js ──────────────────────────
import * as THREE from "three";
import { setTalking, setCurrentAudio, setAudioContext } from "../avatar/state.js";

/**
 * Програє TTS-потік + анімує рот
 * @param {string} text
 * @param {THREE.Mesh}  faceMesh
 * @param {THREE.Group} avatar
 */
export async function playVoiceStreamWithMimic(text, faceMesh, avatar) {
  console.log("[TTS-STREAM] ▶️ старт потокового озвучення…");

  /* ---------- MediaSource ---------- */
  const mediaSource = new MediaSource();
  const audio = new Audio();
  audio.src = URL.createObjectURL(mediaSource);
  audio.preload = "auto";
  audio.volume = 1.0;
  setCurrentAudio(audio);

  /* ---------- Міміка ---------- */
  const dict = faceMesh.morphTargetDictionary;
  const infl = faceMesh.morphTargetInfluences;
  const mouthIdx = dict["A25_Jaw_Open"];
  const jaw = avatar.getObjectByName("mixamorigJawRoot");
  const hasMouth = mouthIdx !== undefined && jaw;

  let ctx; // AudioContext буде створено, коли потрібен

  /* ---------- Потокове отримання ---------- */
  mediaSource.addEventListener("sourceopen", async () => {
    const sb = mediaSource.addSourceBuffer("audio/mpeg");
    const queue = [];
    let updating = false;
    let started = false;

    const feed = () => {
      if (updating || queue.length === 0) return;
      updating = true;
      sb.appendBuffer(queue.shift());
    };

    sb.addEventListener("updateend", () => {
      updating = false;

      /* ▶️ Запускаємо play() одразу на першому чанку */
      if (!started) {
        started = true;
        audio
          .play()
          .then(() => {
            console.log("[TTS-STREAM] ▶️ audio.play() успішно");
            if (ctx && ctx.state === "suspended") ctx.resume();
          })
          .catch((err) => console.error("[TTS-STREAM] play() error:", err));
      }

      feed();
    });

    /* ---------- Читаємо чанки з PHP ---------- */

    console.log('[TTS-STREAM] 🚀 Відправляємо текст у ElevenLabs:', text);

    const resp = await fetch("php/tts.php", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    console.log('[TTS-STREAM] 📦 Response object:', resp);
    console.log('[TTS-STREAM] HTTP status:', resp.status);
    console.log('[TTS-STREAM] Content-Type:', resp.headers.get('Content-Type'));
    console.log('[TTS-STREAM] OK:', resp.ok);

    const reader = resp.body.getReader();
    let total = 0;

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        console.log("[TTS-STREAM] ∎ кінець потоку");
        if (!sb.updating) mediaSource.endOfStream();
        else sb.addEventListener("updateend", () => mediaSource.endOfStream(), { once: true });
        break;
      }
      queue.push(value);
      total += value.byteLength;
      console.log(`[TTS-STREAM] +${value.byteLength}B (∑ ${total})`);
      feed();
    }
  });

  /* ---------- Анімація рота ---------- */
  if (hasMouth) {
    ctx = new AudioContext();
    setAudioContext(ctx);

    const src = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    src.connect(analyser);
    analyser.connect(ctx.destination);

    const data = new Uint8Array(analyser.frequencyBinCount);
    const baseJaw = Math.PI / 2;
    const amp = 0.2;
    setTalking(true);

    const animate = () => {
      analyser.getByteFrequencyData(data);
      const vol = data.reduce((a, b) => a + b, 0) / data.length / 255;
      infl[mouthIdx] = vol * 3.7;
      jaw.rotation.x = baseJaw + vol * amp;

      if (!audio.paused && !audio.ended) requestAnimationFrame(animate);
      else {
        infl[mouthIdx] = 0;
        jaw.rotation.x = baseJaw;
        setTalking(false);
      }
    };
    animate();
  }

  /* ---------- Promise завершення ---------- */
  return new Promise((resolve) => {
    audio.addEventListener("ended", () => {
      console.log("[TTS-STREAM] ⏹️ завершено");
      resolve();
    });
  });
}
