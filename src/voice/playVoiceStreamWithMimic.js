// ── src/voice/playVoiceStreamWithMimic.js ──────────────────────────
import * as THREE from "three";
import { setTalking, setCurrentAudio, setAudioContext } from "../avatar/state.js";
import { movementsAndMimicWhileTalking } from "../avatar/movAndMimWhileTalking.js";

let activeAudioURL = null;

/**
 * Програє TTS-аудіо через Blob + міміку та жести
 * @param {string} text
 * @param {THREE.Mesh}  faceMesh
 * @param {THREE.Group} avatar
 */
export async function playVoiceStreamWithMimic(text, faceMesh, avatar) {
  console.log("[TTS-BLOB] ▶️ старт запиту до ElevenLabs…");

  // 🧼 Очистка попереднього аудіо URL
  if (activeAudioURL) {
    URL.revokeObjectURL(activeAudioURL);
    activeAudioURL = null;
  }

  const resp = await fetch("php/tts.php", {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });

  const reader = resp.body.getReader();
  const chunks = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.byteLength;
    console.log(`[TTS-BLOB] +${value.byteLength}B (∑ ${total})`);
  }

  const audioBlob = new Blob(chunks, { type: "audio/mpeg" });
  const audioURL = URL.createObjectURL(audioBlob);
  activeAudioURL = audioURL;
  const audio = new Audio(audioURL);
  audio.preload = "auto";
  audio.volume = 1.0;
  setCurrentAudio(audio);

  const dict = faceMesh.morphTargetDictionary;
  const infl = faceMesh.morphTargetInfluences;
  const mouthIdx = dict["A25_Jaw_Open"];
  const jaw = avatar.getObjectByName("mixamorigJawRoot");
  const hasMouth = mouthIdx !== undefined && jaw;

  let ctx, analyser, data;

  if (hasMouth) {
    ctx = new AudioContext();
    setAudioContext(ctx);

    const src = ctx.createMediaElementSource(audio);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    src.connect(analyser);
    analyser.connect(ctx.destination);

    data = new Uint8Array(analyser.frequencyBinCount);
  }

  return new Promise((resolve) => {
    audio.addEventListener("ended", () => {
      console.log("[TTS-BLOB] ⏹️ завершено");
      resolve();
    });

    window.stopIdleMimic = true;
    movementsAndMimicWhileTalking(faceMesh, avatar);

    audio.play()
      .then(() => {
        console.log("[TTS-BLOB] ▶️ audio.play() успішно");
        if (ctx && ctx.state === "suspended") ctx.resume();
        setTalking(true);

        if (hasMouth) {
          const baseJaw = Math.PI / 2;
          const amp = 0.2;

          const animate = () => {
            analyser.getByteFrequencyData(data);
            const vol = data.reduce((a, b) => a + b, 0) / data.length / 255;
            infl[mouthIdx] = vol * 3.7;
            jaw.rotation.x = baseJaw + vol * amp;

            if (!audio.paused && !audio.ended) {
              requestAnimationFrame(animate);
            } else {
              infl[mouthIdx] = 0;
              jaw.rotation.x = baseJaw;
              setTalking(false);

              import("../gestures/gestureRightHandOnWaist.js")
                .then((m) => m.gestureRightHandOnWaist(avatar))
                .catch(console.warn);
            }
          };
          animate();
        }

        setTimeout(() => {
          requestAnimationFrame(() => {
            import("../gestures/gestureLeftHandOnWaist.js")
              .then((m) => m.gestureLeftHandOnWaist(avatar))
              .catch(console.warn);
          });
        }, 500);

        setTimeout(() => {
          requestAnimationFrame(() => {
            import("../gestures/lowerArms.js").then((m) => m.lowerRightArm(avatar)).catch(console.warn);
          });
        }, 3000);

        setTimeout(() => {
          requestAnimationFrame(() => {
            import("../gestures/lowerArms.js").then((m) => m.lowerLeftArm(avatar)).catch(console.warn);
          });
        }, 9500);
      })
      .catch((err) => {
        console.error("[TTS-BLOB] play() error:", err);
        setTalking(false);
        resolve();
      });
  });
}
