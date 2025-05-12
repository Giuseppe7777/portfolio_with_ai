// src/avatar/movementsAndMimicWhileNotTalking.js
import * as THREE from 'three';
import { isTalking } from './state';

export function movementsAndMimicWhileNotTalking(faceMesh, avatar) {
  const infl = faceMesh.morphTargetInfluences;
  const dict = faceMesh.morphTargetDictionary;

  const smileL = dict['A38_Mouth_Smile_Left'];
  const smileR = dict['A39_Mouth_Smile_Right'];
  const browUp = dict['A06_Brow_Up'];
  const squintL = dict['A16_Eye_Squint_Left'];
  const squintR = dict['A17_Eye_Squint_Right'];

  setInterval(() => {
    if (!infl) return;
    infl[smileL] = 0.57 + Math.random() * 0.18;
    infl[smileR] = 0.57 + Math.random() * 0.18;
  }, 3000);

  const head = avatar.getObjectByName('mixamorigHead');
  const neck = avatar.getObjectByName('mixamorigNeck');
  const spine2 = avatar.getObjectByName('mixamorigSpine2');
  const spine1 = avatar.getObjectByName('mixamorigSpine1');

  let t = 0;
  const headCur = { x: 0, y: 0, z: 0 };

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function animate() {
    requestAnimationFrame(animate);
    t += 0.016;

    if (isTalking) return;

    if (head) {
      headCur.x = THREE.MathUtils.lerp(headCur.x, clamp(Math.sin(t * 0.3), 0.25, 0), 0.05);
      headCur.y = THREE.MathUtils.lerp(headCur.y, clamp(Math.sin(t * 0.2), -0.1, 0.3), 0.05);
      headCur.z = THREE.MathUtils.lerp(headCur.z, clamp(Math.sin(t * 0.17), -0.05, 0.05), 0.05);
      head.rotation.set(headCur.x, headCur.y, headCur.z);
    }

    if (neck) neck.rotation.x = Math.sin(t * 0.4) * 0.02;
    if (spine2) spine2.rotation.x = Math.sin(t * 0.2) * 0.05;
    if (spine1) {
      spine1.rotation.z = Math.sin(t * 0.25) * 0.06;
      spine1.rotation.y = Math.sin(t * 0.25) * 0.2;
    }
  }

  animate();
}
