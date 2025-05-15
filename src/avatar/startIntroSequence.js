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
 * - запускає анімацію вітання 
 * @param {HTMLElement} container - DOM-елемент, куди вставляється canvas
 */
export async function startIntroSequence(container) {
  // 🛑 Перевірка перед стартом
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

  // 🛑 Перевірка після створення сцени
  if (!getConversationActive()) {
    console.log('🛑 Розмова зупинена — скасовано перед завантаженням моделі.');
    return;
  }

  let avatar, mixer, faceMesh;

  if (window.preloadedAvatarData) {
    // Використовуємо вже завантажену модель
    ({ avatar, mixer, faceMesh } = window.preloadedAvatarData);
    scene.add(avatar); // обов’язково вставити у поточну сцену
    console.log('⚡ Використано preloaded модель');
  } else {
    // Якщо не встигло завантажитись — fallback
    ({ avatar, mixer, faceMesh } = await loadAvatarModel(scene));
    console.log('🐢 Модель не була preloaded, завантажили вручну');
  }

  // 🛑 Перевірка після завантаження GLB
  if (!getConversationActive()) {
    console.log('🛑 Завантаження моделі скасовано — розмова зупинена.');
    return;
  }

  playIntroAnimation(mixer, avatar, faceMesh);
  setCurrentMixer(mixer);

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
}
