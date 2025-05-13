// 🔁 Додаємо підтримку циклу: слухає → говорить → слухає

import * as THREE from "three";
import { setTalking } from "../avatar/state";
import { movementsAndMimicWhileTalking } from "../avatar/movAndMimWhileTalking.js";
import { setCurrentAudio, setAudioContext  } from '../avatar/state.js';

/**
 * Програє озвучку тексту та анімує рот через гучність аудіо
 * @param {string} audioUrl - URL до аудіо (наприклад, від ElevenLabs)
 * @param {THREE.Mesh} faceMesh - меш із morphTargetDictionary та morphTargetInfluences
 * @param {THREE.Object3D} avatar - повна модель, з якої витягується щелепа
 * @returns {Promise} - завершується після завершення звуку
 */
export async function playVoiceWithMimic(audioUrl, faceMesh, avatar, onStartSpeaking = () => {}) {
  return new Promise(async (resolve) => {
    const audio = new Audio(audioUrl);
    audio.preload = "auto";
    audio.volume = 1.0;

    setCurrentAudio(audio); 

    const mouthOpenKey = "A25_Jaw_Open";
    const dict = faceMesh.morphTargetDictionary;
    const infl = faceMesh.morphTargetInfluences;
    const mouthIndex = dict[mouthOpenKey];

    const jaw = avatar.getObjectByName("mixamorigJawRoot");

    if (mouthIndex === undefined || !jaw) {
      audio.play();
      audio.onended = resolve;
      return;
    }

    const context = new AudioContext();
    setAudioContext(context);

    const src = context.createMediaElementSource(audio);
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    src.connect(analyser);
    analyser.connect(context.destination);

    const baseJaw = Math.PI / 2;
    const jawAmplitude = 0.2;

    const animate = () => {
      analyser.getByteFrequencyData(dataArray);
      const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;

      infl[mouthIndex] = volume * 3.7;
      jaw.rotation.x = baseJaw + volume * jawAmplitude;

      if (!audio.paused && !audio.ended) {  // коли припиняється інтроспіч то йде підняття правої руки
        requestAnimationFrame(animate);
      } else {
        infl[mouthIndex] = 0;
        jaw.rotation.x = baseJaw;
        setTalking(false);

        // ✋ Підняття ПРАВОЇ руки — після говоріння
        import('/src/gestures/gestureRightHandOnWaist.js')
          .then(m => m.gestureRightHandOnWaist(avatar)); 
        resolve(); // 🔁 Завершення — важливо для циклу
      }
    };

    await new Promise((resolve) => {
      audio.addEventListener("loadedmetadata", resolve);
    });

    // 🔹 Додаємо живі рухи тіла до голосу
    window.stopIdleMimic = true;
    movementsAndMimicWhileTalking(faceMesh, avatar);

    audio
      .play()
      .then(() => {
        context.resume();
        setTalking(true);
        onStartSpeaking();

        // Жест крутіння рукою)
        // setTimeout(() => {
        //   requestAnimationFrame(() => {
        //     resetRightHandPose(avatar);
        //     import("/src/gestures/gestureExplainWithHand.js").then((m) => m.gestureExplainWithHand(avatar));
        //   });
        // }, 2500);

        // Жест Увага!!! великий палець)
        // setTimeout(() => {
        //   requestAnimationFrame(() => {
        //     resetRightHandPose(avatar);
        //     import("/src/gestures/gestureAttentionWithFinger.js").then((m) => m.gestureAttentionWithFinger(avatar));
        //   });
        // }, 5500);

        // ✋ Підняти ліву руку під час говоріння
      setTimeout(() => {
        requestAnimationFrame(() => {
          import("/src/gestures/gestureLeftHandOnWaist.js")
            .then((m) => m.gestureLeftHandOnWaist(avatar));
        });
      }, 500);

              // Жест - Опускання правої руки)
        setTimeout(() => {
          requestAnimationFrame(() => {
            import("/src/gestures/lowerArms.js").then((m) => m.lowerRightArm(avatar));
          });
        }, 3000);

        // Жест - Опускання лівої руки)
        setTimeout(() => {
          requestAnimationFrame(() => {
            import("/src/gestures/lowerArms.js").then((m) => m.lowerLeftArm(avatar));
          });
        }, 9500);

        animate();
      })
      .catch((err) => {~~
        console.error("🎵 Не вдалося програти аудіо:", err);
        setTalking(false);
        resolve();
      });
  });
}


