
import { startIntroSequence } from './startIntroSequence.js';
import { playVoiceStreamWithMimic } from '../voice/playVoiceStreamWithMimic.js';
import { stopConversation } from './avatar-entry.js';
import { setConversationActive } from './state.js';

/**
 * WOW-режим: аватар спочатку анімує WalkAndWave, потім озвучує TTS-меседж, потім зникає.
 * @param {string} message - Текст для озвучення про ліміт
 */
export async function playLimitMessageWithAvatar(message) {
  const container = document.getElementById('avatar-container');
  const photo = document.getElementById('avatar-photo');
  if (photo) photo.classList.add('fade-out');

  setConversationActive(true);

  // Запускаємо WalkAndWave, а після анімації — TTS
  await startIntroSequence(container, {
    limitMessageText: message,
    async onAfterAnimation({ avatar, faceMesh }) {

      await playVoiceStreamWithMimic(
        message,
        faceMesh,
        avatar,
        [],
        message.split(/\s+/).length
      );

      // Дати час договорити
      await new Promise(r => setTimeout(r, 1200));
      stopConversation();
    }
  });
}
