// /**
//  * Програє озвучку тексту та анімує рот через гучність аудіо
//  * @param {string} audioUrl - URL до аудіо (наприклад, від ElevenLabs)
//  * @param {THREE.Mesh} faceMesh - меш із morphTargetDictionary та morphTargetInfluences
//  */
// export async function playVoiceWithMimic(audioUrl, faceMesh, avatar) {
//   const audio = new Audio(audioUrl);
//   audio.volume = 1.0;

//   // 🔸 Знайти shape key для рота
//   const mouthOpenKey = 'A25_Jaw_Open';
//   const dict = faceMesh.morphTargetDictionary;
//   const infl = faceMesh.morphTargetInfluences;
//   const mouthIndex = dict[mouthOpenKey];
//   console.log('👄 mouthIndex:', mouthIndex);
//   const jawBone = avatar.getObjectByName('mixamorigJawRoot');
//   console.log('🦴 Щелепна кістка (з avatar):', jawBone);

//   if (mouthIndex === undefined) {
//     console.warn(`Shape key '${mouthOpenKey}' не знайдено`);
//     audio.play(); // все одно програємо без міміки
//     return;
//   }

//   // 🔹 Створюємо аудіо-контекст для аналізу гучності
//   const context = new AudioContext();
//   const src = context.createMediaElementSource(audio);
//   const analyser = context.createAnalyser();
//   analyser.fftSize = 512;
//   const dataArray = new Uint8Array(analyser.frequencyBinCount);

//   src.connect(analyser);
//   analyser.connect(context.destination);

//   // 🔹 Анімація рота залежно від гучності
//   const animate = () => {
//     analyser.getByteFrequencyData(dataArray);
//     const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;
//     infl[mouthIndex] = volume * 3.2; // масштабування для ефекту
//     if (!audio.paused && !audio.ended) {
//       requestAnimationFrame(animate);
//     } else {
//       infl[mouthIndex] = 0;
//     }
//   };

//   // 🔸 Старт програвання та синхронної анімації
//   audio.play().then(() => {
//     context.resume();
//     animate();
//   }).catch(err => {
//     console.error('🎵 Не вдалося програти аудіо:', err);
//   });
// }

// src/avatar/playVoiceWithMimic.js
import * as THREE from 'three';

/**
 * Програє озвучку тексту та анімує рот через гучність аудіо
 * @param {string} audioUrl - URL до аудіо (наприклад, від ElevenLabs)
 * @param {THREE.Mesh} faceMesh - меш із morphTargetDictionary та morphTargetInfluences
 * @param {THREE.Object3D} avatar - повна модель, з якої витягується щелепа
 */
export async function playVoiceWithMimic(audioUrl, faceMesh, avatar) {
  const audio = new Audio(audioUrl);
  audio.volume = 1.0;

  // 🟣 Shape key
  const mouthOpenKey = 'A25_Jaw_Open';
  const dict = faceMesh.morphTargetDictionary;
  const infl = faceMesh.morphTargetInfluences;
  const mouthIndex = dict[mouthOpenKey];

  if (mouthIndex === undefined) {
    console.warn(`❌ Shape key '${mouthOpenKey}' не знайдено`);
    audio.play();
    return;
  }

  // 🦴 Щелепна кістка
  const jaw = avatar.getObjectByName('mixamorigJawRoot');
  if (!jaw) {
    console.warn('❌ Щелепна кістка не знайдена');
    audio.play();
    return;
  }

  // 📊 Аудіо-аналітика
  const context = new AudioContext();
  const src = context.createMediaElementSource(audio);
  const analyser = context.createAnalyser();
  analyser.fftSize = 512;
  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  src.connect(analyser);
  analyser.connect(context.destination);

  // 🔄 Анімація міміки
  const baseJaw = Math.PI / 2;     // Базовий кут закритого рота
  const jawAmplitude = 0.2;        // Максимальне відкривання щелепи

  const animate = () => {
    analyser.getByteFrequencyData(dataArray);
    const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;

    infl[mouthIndex] = volume * 3.5;

    jaw.rotation.x = baseJaw + volume * jawAmplitude;

    if (!audio.paused && !audio.ended) {
      requestAnimationFrame(animate);
    } else {
      infl[mouthIndex] = 0;
      jaw.rotation.x = baseJaw; // Повертаємо у закритий стан
    }
  };

  // ▶️ Пуск
  audio.play().then(() => {
    context.resume();
    animate();
  }).catch(err => {
    console.error('🎵 Не вдалося програти аудіо:', err);
  });
}
