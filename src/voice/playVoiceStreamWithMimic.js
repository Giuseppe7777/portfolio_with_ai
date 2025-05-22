// src/voice/playVoiceStreamWithMimic.js
import * as THREE from "three";
import { setTalking, setCurrentAudio, setAudioContext } from "../avatar/state.js";
import { movementsAndMimicWhileTalking } from "../avatar/movAndMimWhileTalking.js";

let activeAudioURL = null;

/**
 * Програє TTS-потік через MediaSource + міміку + жести
 * @param {string} text
 * @param {THREE.Mesh} faceMesh
 * @param {THREE.Group} avatar
 */
export async function playVoiceStreamWithMimic(text, faceMesh, avatar, gestures = [], totalWords = 0) {
  console.log("[TTS-STREAM] ▶️ старт потокового озвучення…");

  // 🧼 Очистка попереднього аудіо
  if (activeAudioURL) {
    URL.revokeObjectURL(activeAudioURL);
    activeAudioURL = null;
  }

  // === Найголовніше! Завжди створюй новий MediaSource, не використовуй попередній ===
  const mediaSource = new MediaSource();
  const audio = new Audio();
  const audioURL = URL.createObjectURL(mediaSource);
  activeAudioURL = audioURL;
  audio.src = audioURL;
  audio.preload = "auto";
  audio.volume = 1.0;
  setCurrentAudio(audio);

  // === Аналіз для міміки ===
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
    let sb = null;
    let streamEnded = false;
    let cleaningSourceBuffer = false;

    mediaSource.addEventListener("sourceopen", async () => {
      // 👇 Найголовніше: очищаємо всі старі SourceBuffer ПЕРЕД створенням нового!
      while (mediaSource.sourceBuffers.length > 0) {
        try {
          cleaningSourceBuffer = true;
          // Додатково: дочекайся, поки buffer не в updating-стані
          const buf = mediaSource.sourceBuffers[0];
          if (buf.updating) {
            await new Promise(r => buf.addEventListener('updateend', r, { once: true }));
          }
          mediaSource.removeSourceBuffer(buf);
          cleaningSourceBuffer = false;
        } catch (e) {
          console.warn("🧼 Не вдалося прибрати старий SourceBuffer:", e);
          break;
        }
      }

      sb = mediaSource.addSourceBuffer("audio/mpeg");
      const queue = [];
      let updating = false;
      let started = false;

      const feed = () => {
        if (streamEnded || updating || queue.length === 0) return;
        updating = true;
        try {
          sb.appendBuffer(queue.shift());
        } catch (err) {
          console.warn("❌ feed() appendBuffer failed:", err);
          updating = false;
        }
      };

      sb.addEventListener("updateend", () => {
        updating = false;
        if (!started) {
          started = true;
          // ==== Стартуємо анімації та звук ====
          window.stopIdleMimic = true;
          movementsAndMimicWhileTalking(faceMesh, avatar);

          audio.play()
            .then(() => {
              console.log("[TTS-STREAM] ▶️ audio.play() успішно");

                  // --- Approximate timing для жестів ---
              const avgWordsPerSecond = 2.3; // Підібрати під твій голос!
              if (gestures.length > 0 && totalWords > 0) {
                gestures.forEach(g => {
                  // Таймінг у секундах — gesture на потрібному слові
                  const timeMs = (g.wordPos / avgWordsPerSecond) * 1000;

                  console.log(
                    `⏰ Gesture "${g.type}" (approximate) спрацює через ${(timeMs / 1000).toFixed(2)} сек (позиція: слово ${g.wordPos} з ${totalWords})`
                  );

                  setTimeout(() => {
                    console.log(`🟢 Виконую gesture: ${g.type} (на ${(timeMs/1000).toFixed(2)}s, approx)`);
                    if (g.type === 'attention') {
                      import('../gestures/gestureAttentionWithFinger.js')
                        .then(m => m.gestureAttentionWithFinger(avatar));
                    }
                    if (g.type === 'explain') {
                      import('../gestures/gestureExplainWithHand.js')
                        .then(m => m.gestureExplainWithHand(avatar));
                    }
                  }, timeMs);
                });
              }
    // --- /Approximate timing ---

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
              // (жести для рук)
              setTimeout(() => {
                requestAnimationFrame(() => {
                  import("../gestures/gestureLeftHandOnWaist.js")
                    .then((m) => m.gestureLeftHandOnWaist(avatar))
                    .catch(console.warn);
                });
              }, 500);

              setTimeout(() => {
                requestAnimationFrame(() => {
                  import("../gestures/lowerArms.js")
                    .then((m) => m.lowerRightArm(avatar))
                    .catch(console.warn);
                });
              }, 3000);

              setTimeout(() => {
                requestAnimationFrame(() => {
                  import("../gestures/lowerArms.js")
                    .then((m) => m.lowerLeftArm(avatar))
                    .catch(console.warn);
                });
              }, 9500);

            })
            .catch((err) => {
              console.error("[TTS-STREAM] play() error:", err);
              resolve();
            });
        }
        feed();
      });

      console.log('[TTS-STREAM] 🚀 Відправляємо текст у ElevenLabs:', text);
      const resp = await fetch("php/tts.php", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const reader = resp.body.getReader();
      let total = 0;

      // Читання аудіо-чанків по стріму
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log("[TTS-STREAM] ∎ кінець потоку");
          streamEnded = true;
          if (!sb.updating) {
            try {
              mediaSource.endOfStream();
            } catch (e) {
              console.warn("endOfStream error:", e);
            }
          } else {
            sb.addEventListener("updateend", () => {
              try {
                mediaSource.endOfStream();
              } catch (e) {
                console.warn("endOfStream error (updateend):", e);
              }
            }, { once: true });
          }
          break;
        }
        queue.push(value);
        total += value.byteLength;
        // Для дебагу:
        // console.log(`[TTS-STREAM] +${value.byteLength}B (∑ ${total})`);
        feed();
      }
    });

    // Очищення ресурсу при завершенні відтворення
    audio.addEventListener("ended", () => {
      console.log("[TTS-STREAM] ⏹️ завершено");
      audio.src = "";
      URL.revokeObjectURL(activeAudioURL);
      activeAudioURL = null;
      // ВАЖЛИВО: додатково пробуємо очистити SourceBuffer
      if (mediaSource.readyState === "open" && sb && !sb.updating) {
        try {
          mediaSource.removeSourceBuffer(sb);
        } catch (e) {
          // Може бути вже очищено — не страшно
        }
      }
      resolve();
    });
  });
}
