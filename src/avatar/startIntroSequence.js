// src/avatar/startIntroSequence.js
import { setupScene } from './AvatarScene.js';
import { loadAvatarModel } from './loadAvatarModel.js';
import { playIntroAnimation } from './playIntroAnimation.js';
import { startBlinking } from './blink.js';
import { startIntroVoice } from './startIntroVoice.js';
import {
  setCurrentMixer,
  getConversationActive,
  setRenderLoopId,
  setFinishTimerId,
  setScene,
  setRenderer
} from './state.js';

/**
 * Стартова функція, яка:
 * - створює сцену
 * - завантажує аватара
 * - запускає анімацію вітання (WalkAndWave), після якої може бути кастомний меседж
 * @param {HTMLElement} container - DOM-елемент, куди вставляється canvas
 * @param {Object} options - { skipSpeech: true } або { limitMessageText, onAfterAnimation }
 * @returns {Object} - { avatar, faceMesh, mixer }
 */
export async function startIntroSequence(container, options = {}) {
  if (!getConversationActive()) {
    console.log('🛑 Запуск скасовано: розмова була зупинена до старту сцени.');
    return;
  }

  const photo = document.getElementById('avatar-photo');
  if (photo) photo.classList.add('fade-out');
  container.classList.add('fade-in');

  const { scene, camera, renderer, controls } = setupScene(container);
  setScene(scene);
  setRenderer(renderer);

  if (!getConversationActive()) {
    console.log('🛑 Розмова зупинена — скасовано перед завантаженням моделі.');
    return;
  }

  let avatar, mixer, faceMesh;

  if (window.preloadedAvatarData) {
    ({ avatar, mixer, faceMesh } = window.preloadedAvatarData);
    scene.add(avatar);
    console.log('⚡ Використано preloaded модель');
  } else {
    ({ avatar, mixer, faceMesh } = await loadAvatarModel(scene));
    console.log('🐢 Модель не була preloaded, завантажили вручну');
  }

  if (!getConversationActive()) {
    console.log('🛑 Завантаження моделі скасовано — розмова зупинена.');
    return;
  }

  // 🔧 Примусова компіляція шейдерів
  renderer.compile(scene, camera);
  console.log('🛠️ renderer.compile() викликано');

  // 🖼️ Фейковий перший рендер, щоб прогріти WebGL
  renderer.render(scene, camera);
  console.log('🖼️ Перший примусовий рендер виконано');

  // 🧠 Чекаємо 2 стабільні кадри (достатньо після compile + render)
  await new Promise((resolve) => {
    let frames = 0;
    function waitFrames() {
      requestAnimationFrame(() => {
        frames++;
        if (frames >= 2) {
          console.log('✅ 2 кадри після прогріву WebGL — стартує анімація');
          resolve();
        } else {
          waitFrames();
        }
      });
    }
    waitFrames();
  });

  // ============================================================================

  // 🔁 Скидаємо позицію аватара у початкову (idle)
  avatar.position.set(0, -3, -10);
  avatar.rotation.set(0, 0, 0);
  avatar.updateMatrixWorld(true);

  // 💡 Скидаємо action, щоб стартував з самого початку
  if (mixer && mixer._actions && mixer._actions[0]) {
    const action = mixer._actions[0];
    action.reset();
    action.paused = false;
    action.time = 0;
    action.play();
  }

  setCurrentMixer(mixer);

  // ===== WOW-режим: Після WalkAndWave — твій кастомний меседж ==================
  if (options.limitMessageText) {
    // WalkAndWave як завжди
    playIntroAnimation(mixer, avatar, faceMesh);

    let hasFinished = false;

    const handleFinish = () => {
      if (hasFinished) return;
      hasFinished = true;

      // Після WalkAndWave — твій кастомний меседж
      if (typeof options.onAfterAnimation === 'function') {
        options.onAfterAnimation({ avatar, faceMesh, mixer });
      }
    };

    const timerId = setTimeout(() => {
      mixer.dispatchEvent({ type: 'finished' });
    }, 4600);
    setFinishTimerId(timerId);

    mixer.addEventListener('finished', handleFinish);

    let animationFrameId;
    function renderLoop() {
      animationFrameId = requestAnimationFrame(renderLoop);
      renderer.render(scene, camera);
      controls.update();
    }

    renderLoop();
    setRenderLoopId(animationFrameId);

    startBlinking(faceMesh);

    // Повертаємо модель
    return { avatar, faceMesh, mixer };
  }

  // ===== Idle-режим без WalkAndWave/інтро-спіча =====================
  if (options.skipSpeech) {
    startBlinking(faceMesh);
    return { avatar, faceMesh, mixer };
  }

  // ===== Стандартна поведінка (WalkAndWave + інтро) ================
  console.log('🎬 Стартує playIntroAnimation з позицією:', avatar.position);
  playIntroAnimation(mixer, avatar, faceMesh);

  let hasFinished = false;

  const handleFinish = () => {
    if (hasFinished) return;
    hasFinished = true;

    if (getConversationActive()) {
      startIntroVoice(faceMesh, avatar);
    } else {
      console.log('🛑 Аватар зупинено до завершення анімації. Спіч не запускається.');
    }
  };

  const timerId = setTimeout(() => {
    mixer.dispatchEvent({ type: 'finished' });
  }, 4600);
  setFinishTimerId(timerId);

  mixer.addEventListener('finished', handleFinish);

  let animationFrameId;
  function renderLoop() {
    animationFrameId = requestAnimationFrame(renderLoop);
    renderer.render(scene, camera);
    controls.update();
  }

  renderLoop();
  setRenderLoopId(animationFrameId);

  startBlinking(faceMesh);

  return { avatar, faceMesh, mixer };
}
