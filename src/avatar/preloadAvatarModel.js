// src/avatar/preloadAvatarModel.js
import { loadAvatarModel } from './loadAvatarModel.js';
import { setupScene } from './AvatarScene.js';

let cachedAvatarData = null;

export async function preloadAvatarModel() {
  if (cachedAvatarData) return cachedAvatarData;

  // Створюємо прихований контейнер для завантаження
  const hiddenContainer = document.createElement('div');
  hiddenContainer.style.display = 'none';
  document.body.appendChild(hiddenContainer);

  // Створюємо технічну сцену
  const { scene } = setupScene(hiddenContainer);

  // Завантажуємо модель і кешуємо результат
  cachedAvatarData = await loadAvatarModel(scene);

  // Зберігаємо глобально — буде доступна звідусіль
  window.preloadedAvatarData = cachedAvatarData;

  return cachedAvatarData;
}
