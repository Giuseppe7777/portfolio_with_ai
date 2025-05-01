import { createAvatarScene } from './avatar/AvatarScene.js';

let avatarStarted = false;

document.addEventListener('DOMContentLoaded', () => {
  const btn    = document.getElementById('talk-button');
  const photo  = document.getElementById('avatar-photo');
  const canvas = document.getElementById('avatar-container');

  btn.addEventListener('click', () => {
    if (avatarStarted) return;
    avatarStarted = true;

    photo.classList.add('fade-out');

    setTimeout(() => {
      canvas.classList.add('fade-in');       
      createAvatarScene(canvas);             
    }, 500);
  });
});

