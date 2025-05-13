import { playVoiceWithMimic } from "../voice/playVoiceWithMimic.js";
import { movementsAndMimicWhileNotTalking } from "./movAndMimWhileNotTalking.js";
import { promptMicrophoneAccess, setAvatarContext } from "./listenUserSpeech.js";
import { getConversationActive } from './state.js';

/**
 * Програє перше вітання після анімації WalkAndWave
 * @param {THREE.Mesh} faceMesh - меш з shape keys для міміки
 * @param {THREE.Group} avatar - повна модель
 */
export async function startIntroVoice(faceMesh, avatar) {
  // 🔗 Передаємо faceMesh і avatar у listenUserSpeech.js
  setAvatarContext(faceMesh, avatar);

  const audioUrl = "/audio/intro-voice-1.mp3";

  // 🎙️ Відтворення голосу з мімікою + запуск idle-анімації після
  const duration = await playVoiceWithMimic(audioUrl, faceMesh, avatar, () => {
    movementsAndMimicWhileNotTalking(faceMesh, avatar);
  });

  // ⏱️ Показуємо кнопку за 5 сек до кінця
  setTimeout(() => {
    if (getConversationActive()) {
      promptMicrophoneAccess();
    } else {
      console.log('🛑 Розмова була зупинена до появи кнопки мікрофона.');
    }
  }, (duration - 5) * 1000);
}
