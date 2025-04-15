
import { createAvatarScene } from './avatar/AvatarScene.js';

document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("avatar-container");
    if (container) {
        createAvatarScene(container);
    }
});
