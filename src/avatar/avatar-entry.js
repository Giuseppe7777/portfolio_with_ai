// src/avatar/avatar-entry.js
import { startIntroSequence } from './startIntroSequence.js';
import { preloadAvatarModel } from './preloadAvatarModel.js';
import { playVoiceStreamWithMimic } from "../voice/playVoiceStreamWithMimic.js";
import { sendToGPT } from "./listenUserSpeech.js";
import { playLimitMessageWithAvatar } from "./playLimitMessageWithAvatar.js";
import { resetSpeechState } from './listenUserSpeech.js';
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
  closeAudioContext
} from './state.js';

const button = document.getElementById('talk-button');
const container = document.getElementById('avatar-container');
const photo = document.getElementById('avatar-photo');

function unlockAudioForSafari() {
  const a = new Audio();
  a.muted = true;
  const playPromise = a.play();
  if (playPromise) {
    playPromise.catch(() => {}).finally(() => {
      a.pause();
      a.remove();
    });
  }
}

preloadAvatarModel().then((data) => {
  window.preloadedAvatarData = data;
  console.log('🚀 Avatar preloaded');
});

// 🔁 Локальний захист запуску
let isLaunching = false;

// --- Додаємо нову функцію для серверної перевірки ---
async function checkLimitOnBackend() {
  const resp = await fetch(`${BASE_URL}/php/checkLimit.php`, { method: 'GET' });
  if (!resp.ok) return { status: 'error' };
  try {
    return await resp.json(); // {status: 'ok'|'limit', message: '...'}
  } catch {
    return { status: 'error' };
  }
}

if (button && container && photo) {
  button.addEventListener('click', async () => {
    unlockAudioForSafari();
    const isActive = getConversationActive();

    // ⛔ Не дозволяємо запускати сцену повторно, поки вона ще створюється
    if (!isActive && isLaunching) return;

    // ▶️ Запуск
    if (!isActive) {
      // --- Ось тут перевіряємо сервер ---
      const limitInfo = await checkLimitOnBackend();

      if (limitInfo.status === 'limit') {
        console.log('[AVATAR ENTRY] Сервер повернув ліміт, блокую запуск!');
        // Відправляємо службовий prompt на GPT, або беремо готовий message із сервера
        const lastLangPrompt = `
          Please detect the language of the user in previous conversations.
          Just use that language — and only that language — to politely say that the question limit for today is reached, and the user can try again in 24 hours. Thank them warmly for the conversation.
          Be brief but friendly.
        `;

        // Якщо сервер повертає вже готовий message — використовуй його:
        const answer = limitInfo.message || (await sendToGPT(lastLangPrompt)).answer;

        // WOW-ефект — аватар озвучує блокування
        await playLimitMessageWithAvatar(answer);
        return;
      }

      // --- Якщо ліміт не досягнуто, запускаємо стандартний сценарій ---
      isLaunching = true;
      setConversationActive(true);
      photo.classList.add('loading');
      button.textContent = 'Stop Talk';

      setQuestionCount(0);

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
  resetSpeechState();
  setConversationActive(false);
  isLaunching = false;

  // ⏱ Очистити таймер
  const timeoutId = getFinishTimerId();
  if (timeoutId) clearTimeout(timeoutId);

  // ⏹ Зупинити requestAnimationFrame
  const loopId = getRenderLoopId();
  if (loopId) cancelAnimationFrame(loopId);

  // Видалити canvas
  const canvas = container.querySelector('canvas');
  if (canvas) canvas.remove();

  // 📷 Повернути фото
  console.log('[STOP] Повертаємо фото — remove fade-out');
  photo.classList.remove('fade-out');
  photo.classList.remove('loading');
  container.classList.remove('fade-in');
  container.innerHTML = '';
  button.textContent = 'Talk with me';

  // Очистити сцену
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

    // Потім фізично прибрати об'єкти зі сцени
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }

    setScene(null);
  }


  // Dispose рендерера
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

  // Видалити кнопку мікрофона
  const micBtn = document.getElementById('mic-permission-btn');
  if (micBtn) micBtn.remove();

  // Зупинити аудіо
  if (currentAudio && !currentAudio.paused) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    setCurrentAudio(null);
  }

  // Зупинити анімації
  if (currentMixer) {
    currentMixer.stopAllAction();
    setCurrentMixer(null);
  }

  // Зупинити мікрофон
  if (micStream) {
    micStream.getTracks().forEach(track => track.stop());
    setMicStream(null);
  }

    // Закрити AudioContext, якщо активний
  closeAudioContext();
}
