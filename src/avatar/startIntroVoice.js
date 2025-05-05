import { playVoiceWithMimic } from '../voice/playVoiceWithMimic.js';
import { startIdleFaceMovements } from './idleMimic.js';
import { promptMicrophoneAccess } from './listenUserSpeech.js';

/**
 * Програє перше вітання після анімації WalkAndWave
 * @param {THREE.Mesh} faceMesh - меш з shape keys для міміки
 */
export async function startIntroVoice(faceMesh, avatar) {

  const audioUrl = '/audio/intro-voice.mp3'; // ← тут буде ElevenLabs в майбутньому

   // запускаємо голос і передаємо старт idle-анімації як callback
  const duration = await playVoiceWithMimic(
    audioUrl,
    faceMesh,
    avatar,
    () => startIdleFaceMovements(faceMesh, avatar)
  );

  // показуємо кнопку за 5 сек до кінця
  setTimeout(() => {
    promptMicrophoneAccess();
  }, (duration - 5) * 1000);
}
