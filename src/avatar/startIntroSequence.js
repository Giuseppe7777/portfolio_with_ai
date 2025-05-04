import { setupScene } from './AvatarScene.js';
import { loadAvatarModel } from './loadAvatarModel.js';
import { playIntroAnimation } from './playIntroAnimation.js';
import { startBlinking } from './blink.js';
import { startIntroVoice } from './startIntroVoice.js';

/**
 * Стартова функція, яка:
 * - створює сцену
 * - завантажує аватара
 * - запускає анімацію вітання * 
 * @param {HTMLElement} container - DOM-елемент, куди вставляється canvas
 */
export async function startIntroSequence(container) {
  const photo = document.getElementById('avatar-photo');

  if (photo) photo.classList.add('fade-out');
  container.classList.add('fade-in');
  
  const { scene, camera, renderer, controls } = setupScene(container);

  const { avatar, mixer, faceMesh } = await loadAvatarModel(scene);

  playIntroAnimation(mixer, avatar, faceMesh);

    let hasFinished = false;

    const handleFinish = () => {
      if (hasFinished) return;
      hasFinished = true;
    
      startIntroVoice(faceMesh, avatar);
    };
    
    setTimeout(() => {
      mixer.dispatchEvent({ type: 'finished' });
    }, 4600);
    
    mixer.addEventListener('finished', handleFinish); 

  (function renderLoop() {
    requestAnimationFrame(renderLoop);
    renderer.render(scene, camera);
    controls.update();
  })();

  startBlinking(faceMesh);
}
