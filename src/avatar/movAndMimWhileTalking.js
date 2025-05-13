// src/avatar/movementsAndMimicWhileTalking.js
import * as THREE from 'three';
import { isTalking } from './state.js';

export function movementsAndMimicWhileTalking(faceMesh, avatar) {
  /* ---------- міміка усмішки --------- */
  const infl = faceMesh.morphTargetInfluences;
  const dict = faceMesh.morphTargetDictionary;
  const smileL = dict['A38_Mouth_Smile_Left'];
  const smileR = dict['A39_Mouth_Smile_Right'];

  setInterval(() => {
    if (!infl) return;
    infl[smileL] = 0.57 + Math.random() * 0.18;
    infl[smileR] = 0.57 + Math.random() * 0.18;
  }, 2000);

  /* ---------- кістки, що рухаємо --------- */
  const head   = avatar.getObjectByName('mixamorigHead');
  const neck   = avatar.getObjectByName('mixamorigNeck');
  const spine2 = avatar.getObjectByName('mixamorigSpine2');
  const spine1 = avatar.getObjectByName('mixamorigSpine1');

  /* ---------- стани --------- */
  let t = 0;
  const headCur = { x: 0, y: 0, z: 0 }; 
  let captured = false;                

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  /* ---------- анімаційний цикл --------- */
  function animate() {
    requestAnimationFrame(animate);
    t += 0.016;

    if (isTalking && !captured && head) {
      headCur.x = head.rotation.x;
      headCur.y = head.rotation.y;
      headCur.z = head.rotation.z;
      captured  = true;
    }

    if (!isTalking) return; 

    /* ---------- плавні рухи голови --------- */
    if (head) {
      // X ― легкий нахил уперед / назад
      headCur.x = THREE.MathUtils.lerp(
        headCur.x,
        clamp(Math.sin(t * 0.3), 0.25, 0),
        0.05
      );

      // Y ― повертаємо разом із тулубом, але плавно
      if (spine1) {
        headCur.y = THREE.MathUtils.lerp(
          headCur.y,
          clamp(-spine1.rotation.y, -0.3, 0.3),
          0.05
        );
      }

      // Z ― невелике похитування
      headCur.z = THREE.MathUtils.lerp(
        headCur.z,
        clamp(Math.sin(t * 0.17), -0.05, 0.05),
        0.05
      );

      head.rotation.set(headCur.x, headCur.y, headCur.z);
    }

    /* ---------- дрібні рухи шиї / тулуба --------- */
    if (neck)   neck.rotation.x   = Math.sin(t * 0.4) * 0.02;
    if (spine2) spine2.rotation.x = Math.sin(t * 0.2) * 0.05;
    if (spine1) spine1.rotation.z = Math.sin(t * 0.25) * 0.06;
  }

  animate();
}
