import { setupScene } from './AvatarScene.js';
import { loadAvatarModel } from './loadAvatarModel.js';
import { playIntroAnimation } from './playIntroAnimation.js';
import { startBlinking } from './blink.js';

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

  //     // 🔓 Підготовка: shape key
  //   const dict = faceMesh.morphTargetDictionary;
  //   const infl = faceMesh.morphTargetInfluences;
  //   const mouthIndex = dict['A25_Jaw_Open'];
  //   infl.fill(0); // очистка

  //   if (mouthIndex !== undefined) {
  //     infl[mouthIndex] = 2;
  //     console.log('👄 Рот відкрито через shape key A25_Jaw_Open');
  //   }

  //   // 🦴 Щелепа
  //   const jaw = avatar.getObjectByName('mixamorigJawRoot');
  //   jaw.rotation.x = Math.PI / 2;

  //   window.jaw = jaw;

  // // Test Start ==============================================================
  // scene.add(avatar);
  // avatar.scale.set(9, 9, 9);
  // avatar.position.y = -12; 
  // // Test End ==============================================================


  //  Крок 3: Анімація WalkAndWave + усмішка
  playIntroAnimation(mixer, avatar, faceMesh);

  //  Крок 4: Рендеримо сцену постійно
  (function renderLoop() {
    requestAnimationFrame(renderLoop);
    renderer.render(scene, camera);
    controls.update();
  })();

  startBlinking(faceMesh);

  console.log('🚀 startIntroSequence запущено');

  // ⏳ Далі ми додамо: playVoice("Hi! Hallo! Привіт!"), listenForLanguage()...
}
