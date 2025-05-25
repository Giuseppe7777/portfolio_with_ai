// src/avatar/avatar-entry.js
import { startIntroSequence } from './startIntroSequence.js';
import { preloadAvatarModel } from './preloadAvatarModel.js';
import { playVoiceStreamWithMimic } from "../voice/playVoiceStreamWithMimic.js";
import { sendToGPT } from "./listenUserSpeech.js";
import { playLimitMessageWithAvatar } from "./playLimitMessageWithAvatar.js";
import {
  setConversationActive,
  getConversationActive,
  currentAudio,
  currentMixer,
  micStream,
  setCurrentAudio,
  setCurrentMixer,
  setMicStream,
  getRenderLoopId,
  getFinishTimerId,
  getScene,
  setScene,
  getRenderer,
  setRenderer,
  getAudioContext,
  setQuestionCount,
  getQuestionCountLS,
  setQuestionCountLS,
  getLastSessionLS
} from './state.js';

const button = document.getElementById('talk-button');
const container = document.getElementById('avatar-container');
const photo = document.getElementById('avatar-photo');

function is24HoursPassed(lastTimestamp) {
  const MS_IN_DAY = 24 * 60 * 60 * 1000;
  return (Date.now() - lastTimestamp) >= MS_IN_DAY;
}

preloadAvatarModel().then((data) => {
  window.preloadedAvatarData = data;
  console.log('🚀 Avatar preloaded');
});

// 🔁 Локальний захист запуску
let isLaunching = false;

if (button && container && photo) {
  button.addEventListener('click', () => {
    const isActive = getConversationActive();

    // ⛔ Не дозволяємо запускати сцену повторно, поки вона ще створюється
    if (!isActive && isLaunching) return;

    // ▶️ Запуск
    if (!isActive) {

      const questionCountLS = getQuestionCountLS();
      const lastSession = getLastSessionLS();

      console.log('[AVATAR ENTRY] questionCountLS:', questionCountLS, 'lastSession:', lastSession);

      if (
        questionCountLS >= 6 &&
        lastSession > 0 &&
        !is24HoursPassed(lastSession)
      ) {
        console.log('[AVATAR ENTRY] Ліміт запитань не минув, блокую запуск!');
        (async () => {
          const lastLangPrompt = `
            Please detect the language of the user in previous conversations.
            Just use that language — and only that language — to politely say that the question limit for today is reached, and the user can try again in 24 hours. Thank them warmly for the conversation.
            Be brief but friendly.
          `;
          const { answer } = await sendToGPT(lastLangPrompt);

          // WOW-ефект — аватар озвучує блокування
          await playLimitMessageWithAvatar(answer);
        })();
        return;

      }

      // Якщо ліміт був, але вже минуло 24 години — скидаємо лічильник
      if (questionCountLS >= 6 && is24HoursPassed(lastSession)) {
        setQuestionCountLS(0);
        setQuestionCount(0);
        console.log('[AVATAR ENTRY] Минуло 24 години, скидаємо лічильник.');
      }

      isLaunching = true;
      setConversationActive(true);
      photo.classList.add('loading');
      button.textContent = 'Stop Talk';

      setQuestionCount(0);
      setQuestionCountLS(0);

      setTimeout(() => {
        startIntroSequence(container);
      }, 300);
    }

    // ⏹ Зупинка
    else {
      stopConversation();
    }
  });
} else {
  console.error('talk-button або avatar-container або avatar-photo не знайдено в DOM');
}

export function stopConversation() {
  setConversationActive(false);
  isLaunching = false;

  // ⏱ Очистити таймер
  const timeoutId = getFinishTimerId();
  if (timeoutId) clearTimeout(timeoutId);

  // ⏹ Зупинити requestAnimationFrame
  const loopId = getRenderLoopId();
  if (loopId) cancelAnimationFrame(loopId);

  // 🧼 Видалити canvas
  const canvas = container.querySelector('canvas');
  if (canvas) canvas.remove();

  // 📷 Повернути фото
  console.log('[STOP] Повертаємо фото — remove fade-out');
  photo.classList.remove('fade-out');
  photo.classList.remove('loading');
  container.classList.remove('fade-in');
  container.innerHTML = '';
  button.textContent = 'Talk with me';

  // 🧼 Очистити сцену
  const scene = getScene();
  if (scene) {
    scene.traverse((object) => {
      // 💣 Очистити геометрію
      if (object.geometry) {
        object.geometry.dispose();
      }

      // 💣 Очистити матеріали
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(m => m.dispose());
        } else {
          object.material.dispose();
        }
      }

      // 💣 Очистити текстури (якщо напряму в об'єкті — на випадок кастомних речей)
      if (object.texture) {
        object.texture.dispose();
      }
    });

    // 🔁 Потім фізично прибрати об'єкти зі сцени
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }

    setScene(null);
  }


  // 🧼 Dispose рендерера
  const renderer = getRenderer();
  if (renderer) {
    // 💥 Видалити canvas перед dispose
    const canvas = renderer.domElement;
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }

    renderer.dispose();
    setRenderer(null);
  }

  // 🎤 Видалити кнопку мікрофона
  const micBtn = document.getElementById('mic-permission-btn');
  if (micBtn) micBtn.remove();

  // 🔇 Зупинити аудіо
  if (currentAudio && !currentAudio.paused) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    setCurrentAudio(null);
  }

  // 🔕 Зупинити анімації
  if (currentMixer) {
    currentMixer.stopAllAction();
    setCurrentMixer(null);
  }

  // 🎙️ Зупинити мікрофон
  if (micStream) {
    micStream.getTracks().forEach(track => track.stop());
    setMicStream(null);
  }

    // 🔇 Закрити AudioContext, якщо активний
  const ctx = getAudioContext();
  if (ctx && ctx.state !== 'closed') {
    ctx.close();
  }
}

