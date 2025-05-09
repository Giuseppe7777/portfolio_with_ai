import { playVoiceWithMimic } from '../voice/playVoiceWithMimic.js';
import { startIdleFaceMovements } from './idleMimic.js';
import { promptMicrophoneAccess, setAvatarContext } from './listenUserSpeech.js';

/**
 * Програє перше вітання після анімації WalkAndWave
 * @param {THREE.Mesh} faceMesh - меш з shape keys для міміки
 * @param {THREE.Group} avatar - повна модель
 */
export async function startIntroVoice(faceMesh, avatar) {
  // 🔗 Передаємо faceMesh і avatar у listenUserSpeech.js
  setAvatarContext(faceMesh, avatar);

  const audioUrl = '/audio/intro-voice-1.mp3'; 

  // 🎙️ Відтворення голосу з мімікою + запуск idle-анімації після
  const duration = await playVoiceWithMimic(
    audioUrl,
    faceMesh,
    avatar,
    () => startIdleFaceMovements(faceMesh, avatar)
  );

  // ⏱️ Показуємо кнопку за 5 сек до кінця
  setTimeout(() => {
    promptMicrophoneAccess();
  }, (duration - 5) * 1000);
}


// import { playVoiceWithMimic } from '../voice/playVoiceWithMimic.js';
// import { promptMicrophoneAccess, setAvatarContext } from './listenUserSpeech.js';

// export async function startIntroVoice(faceMesh, avatar) {
//   setAvatarContext(faceMesh, avatar);

// //===========================================================
// window.avatar = avatar; 
// //===========================================================

//   const audioUrl = '/audio/intro-voice-1.mp3';

//   const duration = await playVoiceWithMimic(
//     audioUrl,
//     faceMesh,
//     avatar,
//     () => {
//       // 🔕 Не викликаємо startIdleFaceMovements
//       console.log('🧘‍♀️ Idle mimic тимчасово вимкнено');
//     }
//   );

//   setTimeout(() => {
//     promptMicrophoneAccess();
//   }, (duration - 5) * 1000);
// }
