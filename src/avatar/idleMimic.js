// src/avatar/idleMimic.js

// import * as THREE from 'three';

// export function startIdleFaceMovements(faceMesh, avatar) {
//   const infl = faceMesh.morphTargetInfluences;
//   const dict = faceMesh.morphTargetDictionary;

//   const smileL = dict['A38_Mouth_Smile_Left'];
//   const smileR = dict['A39_Mouth_Smile_Right'];
//   const browUp = dict['A06_Brow_Up'];
//   const squintL = dict['A16_Eye_Squint_Left'];
//   const squintR = dict['A17_Eye_Squint_Right'];

//   setInterval(() => {
//     if (!infl || !dict) return;

//     infl[smileL] = 0.8 + Math.random() * 0.5;
//     infl[smileR] = 0.8 + Math.random() * 0.5;
//     infl[browUp] = Math.random() * 0.3;
//     infl[squintL] = 0.1 + Math.random() * 0.9;
//     infl[squintR] = 0.1 + Math.random() * 0.9;
//   }, 3000);

//   const head = avatar.getObjectByName('mixamorigHead');
//   const neck = avatar.getObjectByName('mixamorigNeck');
//   const spine2 = avatar.getObjectByName('mixamorigSpine2');

//   let t = 0;

//   const current = { x: 0, y: 0, z: 0 };

//   function animateBones() {
//     requestAnimationFrame(animateBones);
//     t += 0.016;

//     if (head) {
//       // 🎯 Обмежені target-и
//       const targetX = clamp(Math.sin(t * 0.3), 0.25, 0.00);   // Вперед більше, назад обмежено
//       const targetY = clamp(Math.sin(t * 0.2), -0.1, 0.3);   // Обертається активніше вліво/вправо
//       const targetZ = clamp(Math.sin(t * 0.17), -0.08, 0.08);  // Легкий нахил до плечей

//       // Плавність
//       current.x = THREE.MathUtils.lerp(current.x, targetX, 0.05);
//       current.y = THREE.MathUtils.lerp(current.y, targetY, 0.05);
//       current.z = THREE.MathUtils.lerp(current.z, targetZ, 0.05);

//       head.rotation.x = current.x;
//       head.rotation.y = current.y;
//       head.rotation.z = current.z;
//     }

//     if (neck) {
//       neck.rotation.x = Math.sin(t * 0.4) * 0.02;
//     }

//     if (spine2) {
//       spine2.rotation.x = Math.sin(t * 0.2) * 0.015;
//     }
//   }

//   animateBones();
// }

// function clamp(val, min, max) {
//   return Math.max(min, Math.min(max, val));
// }


// ==============================================================

// src/avatar/idleMimic.js

import * as THREE from 'three';
import { isTalking } from './state'; // імпортуємо прапор

export function startIdleFaceMovements(faceMesh, avatar) {
  const infl = faceMesh.morphTargetInfluences;
  const dict = faceMesh.morphTargetDictionary;

  const smileL = dict['A38_Mouth_Smile_Left'];
  const smileR = dict['A39_Mouth_Smile_Right'];
  const browUp = dict['A06_Brow_Up'];
  const squintL = dict['A16_Eye_Squint_Left'];
  const squintR = dict['A17_Eye_Squint_Right'];

  setInterval(() => {
    if (!infl || !dict) return;

    infl[smileL] = 0.8 + Math.random() * 0.5;
    infl[smileR] = 0.8 + Math.random() * 0.5;
    infl[browUp] = Math.random() * 0.3;
    infl[squintL] = 0.1 + Math.random() * 0.9;
    infl[squintR] = 0.1 + Math.random() * 0.9;
  }, 3000);

  const head = avatar.getObjectByName('mixamorigHead');
  const neck = avatar.getObjectByName('mixamorigNeck');
  const spine2 = avatar.getObjectByName('mixamorigSpine2');

  let t = 0;
  const current = { x: 0, y: 0, z: 0 };

  function animateBones() {
    requestAnimationFrame(animateBones);
    t += 0.016;

    if (head && !isTalking) {  // ⛔ не крутити, якщо говорить
      const targetX = clamp(Math.sin(t * 0.3), 0.25, 0.00);
      const targetY = clamp(Math.sin(t * 0.2), -0.1, 0.3);
      const targetZ = clamp(Math.sin(t * 0.17), -0.05, 0.05);

      current.x = THREE.MathUtils.lerp(current.x, targetX, 0.05);
      current.y = THREE.MathUtils.lerp(current.y, targetY, 0.05);
      current.z = THREE.MathUtils.lerp(current.z, targetZ, 0.05);

      head.rotation.x = current.x;
      head.rotation.y = current.y;
      head.rotation.z = current.z;
    }

    if (neck) {
      neck.rotation.x = Math.sin(t * 0.4) * 0.02;
    }

    if (spine2) {
      spine2.rotation.x = Math.sin(t * 0.2) * 0.015;
    }
  }

  animateBones();
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

