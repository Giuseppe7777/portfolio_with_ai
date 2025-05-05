import { playVoiceWithMimic } from '../voice/playVoiceWithMimic.js';
import { startIdleFaceMovements } from './idleMimic.js';
import { promptMicrophoneAccess } from './listenUserSpeech.js';

/**
 * Програє перше вітання після анімації WalkAndWave
 * @param {THREE.Mesh} faceMesh - меш з shape keys для міміки
 */
export async function startIntroVoice(faceMesh, avatar) {

  const audioUrl = '/audio/intro-voice.mp3'; // ← тут буде ElevenLabs в майбутньому

  //  Починаємо фонову міміку
  startIdleFaceMovements(faceMesh, avatar);

  await playVoiceWithMimic(audioUrl, faceMesh, avatar);

  promptMicrophoneAccess();
}
