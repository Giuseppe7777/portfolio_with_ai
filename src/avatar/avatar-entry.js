import { startIntroSequence } from './startIntroSequence.js';

/**
 * Точка входу для аватара
 * Викликає стартову послідовність у DOM-контейнері #avatar-container
 */
const button = document.getElementById('talk-button');
const container = document.getElementById('avatar-container');

if (button && container) {
  button.addEventListener('click', () => {
    startIntroSequence(container);
  });
} else {
  console.error(' talk-button або avatar-container не знайдено в DOM');
}