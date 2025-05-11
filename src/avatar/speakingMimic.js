
import * as THREE from 'three';

export function startSpeakingBodyMovements(faceMesh, avatar) {
  const infl = faceMesh.morphTargetInfluences;
  const dict = faceMesh.morphTargetDictionary;

  const smileL = dict['A38_Mouth_Smile_Left'];
  const smileR = dict['A39_Mouth_Smile_Right'];
  const browUp = dict['A06_Brow_Up'];
  const squintL = dict['A16_Eye_Squint_Left'];
  const squintR = dict['A17_Eye_Squint_Right'];

  const head = avatar.getObjectByName('mixamorigHead');
  const neck = avatar.getObjectByName('mixamorigNeck');
  const spine2 = avatar.getObjectByName('mixamorigSpine2');
  const spine1 = avatar.getObjectByName('mixamorigSpine1');

  const lArm = avatar.getObjectByName('mixamorigLeftArm');
  const lFore = avatar.getObjectByName('mixamorigLeftForeArm');
  const lHand = avatar.getObjectByName('mixamorigLeftHand');

  const fingers = {
    t1: avatar.getObjectByName('mixamorigLeftHandThumb1'),
    t2: avatar.getObjectByName('mixamorigLeftHandThumb2'),
    i1: avatar.getObjectByName('mixamorigLeftHandIndex1'),
    m1: avatar.getObjectByName('mixamorigLeftHandMiddle1'),
    r1: avatar.getObjectByName('mixamorigLeftHandRing1'),
    p1: avatar.getObjectByName('mixamorigLeftHandPinky1'),
  };

  const fromQuat = {}; const toQuat = {};
  const headCur = { x: 0, y: 0, z: 0 };

  if (!lArm || !lFore || !lHand) return;

  // Ініціалізація кісток
  lArm.rotation.order = 'XYZ';
  lFore.rotation.order = 'XYZ';
  lHand.rotation.order = 'XYZ';
  for (let k in fingers) fingers[k] && (fingers[k].rotation.order = 'XYZ');

  fromQuat.arm = lArm.quaternion.clone();
  toQuat.arm = new THREE.Quaternion().setFromEuler(new THREE.Euler(3.571, 3.042, 3.089));

  fromQuat.fore = lFore.quaternion.clone();
  toQuat.fore = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.116, 1.364, 1.170));

  fromQuat.hand = lHand.quaternion.clone();
  toQuat.hand = new THREE.Quaternion().setFromEuler(new THREE.Euler(-1.325, 0.544, 1.227));

  const fingerTargets = {
    t1: [-0.927, -0.140, 0.070],
    t2: [0.000, 0.052, 0.925],
    i1: [-0.733, 0.000, -0.646],
    m1: [-0.611, 0.000, -0.489],
    r1: [-0.471, 0.157, -0.384],
    p1: [-0.454, -0.087, -0.070]
  };

  for (let f in fingerTargets) {
    if (fingers[f]) {
      fromQuat[f] = fingers[f].quaternion.clone();
      toQuat[f] = new THREE.Quaternion().setFromEuler(new THREE.Euler(...fingerTargets[f]));
    }
  }

  let progress = 0;
  const lerpSpeed = 0.03;
  let t = 0;

  function animate() {
  requestAnimationFrame(animate);
  t += 0.016;

    // 🧠 Міміка
    if (infl) {
      if (infl[smileL] < 0.2) infl[smileL] = 0.8 + Math.random() * 0.5;
      if (infl[smileR] < 0.2) infl[smileR] = 0.8 + Math.random() * 0.5;
      infl[browUp] = Math.random() * 0.3;

      if (infl[squintL] < 0.2) infl[squintL] = 0.1 + Math.random() * 0.9;
      if (infl[squintR] < 0.2) infl[squintR] = 0.1 + Math.random() * 0.9;
    }

    // 🧠 Рух голови (X, Z), без Y
    if (head) {
      headCur.x = THREE.MathUtils.lerp(headCur.x, clamp(Math.sin(t * 0.3), 0.25, 0), 0.05);
      headCur.z = THREE.MathUtils.lerp(headCur.z, clamp(Math.sin(t * 0.17), -0.05, 0.05), 0.05);
      head.rotation.set(headCur.x, 0, headCur.z); // Y = 0
    }

    if (neck) neck.rotation.x = Math.sin(t * 0.4) * 0.02;
    if (spine2) spine2.rotation.x = Math.sin(t * 0.2) * 0.05;
    if (spine1) {
      spine1.rotation.z = Math.sin(t * 0.25) * 0.06;
      // ❌ spine1.rotation.y = ... — прибираємо хитання вбік
    }

    // 🖐️ Плавна поза руки
    if (progress < 1) {
      progress += lerpSpeed;
      lArm.quaternion.copy(fromQuat.arm).slerp(toQuat.arm, progress);
      lFore.quaternion.copy(fromQuat.fore).slerp(toQuat.fore, progress);
      lHand.quaternion.copy(fromQuat.hand).slerp(toQuat.hand, progress);

      for (let f in fingers) {
        if (fingers[f]) fingers[f].quaternion.copy(fromQuat[f]).slerp(toQuat[f], progress);
      }
    }
  }

  animate();

  return () => {
    // можна реалізувати ручну зупинку через cancelAnimationFrame
  };
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
