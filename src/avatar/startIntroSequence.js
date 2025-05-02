import { setupScene } from './AvatarScene.js';
import { loadAvatarModel } from './loadAvatarModel.js';
import { playIntroAnimation } from './playIntroAnimation.js';

/**
 * Стартова функція, яка:
 * - створює сцену
 * - завантажує аватара
 * - запускає анімацію вітання
 * - (пізніше: озвучить "Hi! Hallo! Привіт!" і ввімкне мікрофон)
 * @param {HTMLElement} container - DOM-елемент, куди вставляється canvas
 */
export async function startIntroSequence(container) {
  const photo = document.getElementById('avatar-photo');

  if (photo) photo.classList.add('fade-out');
  container.classList.add('fade-in');
  
  //  Крок 1: Створюємо сцену
  const { scene, camera, renderer, controls } = setupScene(container);

  //  Крок 2: Завантажуємо модель
  const { avatar, mixer, faceMesh } = await loadAvatarModel(scene);

  //  Крок 3: Анімація WalkAndWave + усмішка
  playIntroAnimation(mixer, avatar, faceMesh);

  //  Крок 4: Рендеримо сцену постійно
  (function renderLoop() {
    requestAnimationFrame(renderLoop);
    renderer.render(scene, camera);
    controls.update();
  })();

  console.log('🚀 startIntroSequence запущено');

  // ⏳ Далі ми додамо: playVoice("Hi! Hallo! Привіт!"), listenForLanguage()...
}
