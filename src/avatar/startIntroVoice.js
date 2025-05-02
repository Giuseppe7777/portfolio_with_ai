import { playVoiceWithMimic } from '../voice/playVoiceWithMimic.js';

/**
 * Програє перше вітання після анімації WalkAndWave
 * @param {THREE.Mesh} faceMesh - меш з shape keys для міміки
 */
export async function startIntroVoice(faceMesh, avatar) {
  // 🔹 Статичний URL до озвученого аудіо (тимчасово)
  const audioUrl = '/audio/intro-voice-hi.mp3'; // ← тут буде ElevenLabs в майбутньому

  // 🔸 Відтворюємо голос і одночасно анімуємо рот
  await playVoiceWithMimic(audioUrl, faceMesh, avatar);

  // 🟡 Далі: слухаємо користувача
  // TODO: listenForLanguage(); — реалізується в наступному кроці
}
