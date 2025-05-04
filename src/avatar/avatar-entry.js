import { startIntroSequence } from './startIntroSequence.js';

/**
 * Точка входу для аватара
 * Викликає стартову послідовність у DOM-контейнері #avatar-container
 */
const button = document.getElementById('talk-button');
const container = document.getElementById('avatar-container');

let hasStarted = false;

if (button && container) {
  button.addEventListener('click', () => {
    if (hasStarted) return; // Не дозволяємо другий запуск
    hasStarted = true;

    startIntroSequence(container);
  });
} else {
  console.error(' talk-button або avatar-container не знайдено в DOM');
}