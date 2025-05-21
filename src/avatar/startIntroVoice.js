import { playVoiceStreamWithMimic } from "../voice/playVoiceStreamWithMimic.js";
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

  const introText = `Hello! I'm Yosyp Malanka, a web developer from Ukraine, now living in Austria. Let's talk!`;

  // ▶️ Озвучуємо інтро
  await playVoiceStreamWithMimic(introText, faceMesh, avatar);

  // 🧠 Після завершення голосу — запускаємо міміку у спокої
  movementsAndMimicWhileNotTalking(faceMesh, avatar);

  // ⏱️ Показуємо кнопку мікрофона 
  if (getConversationActive()) {
    promptMicrophoneAccess();
  } else {
    console.log('🛑 Розмова була зупинена до появи кнопки мікрофона.');
  }
  
}
