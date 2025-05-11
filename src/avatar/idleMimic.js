
import * as THREE from 'three';
import { isTalking } from './state';

export function startIdleFaceMovements(faceMesh, avatar) {
  const infl = faceMesh.morphTargetInfluences;
  const dict = faceMesh.morphTargetDictionary;

  const smileL = dict['A38_Mouth_Smile_Left'];
  const smileR = dict['A39_Mouth_Smile_Right'];
  const browUp = dict['A06_Brow_Up'];
  const squintL = dict['A16_Eye_Squint_Left'];
  const squintR = dict['A17_Eye_Squint_Right'];

  setInterval(() => {
    if (!infl) return;
    infl[smileL] = 0.8 + Math.random() * 0.5;
    infl[smileR] = 0.8 + Math.random() * 0.5;
    infl[browUp] = Math.random() * 0.3;
    infl[squintL] = 0.1 + Math.random() * 0.9;
    infl[squintR] = 0.1 + Math.random() * 0.9;
  }, 3000);

  const head = avatar.getObjectByName('mixamorigHead');
  const neck = avatar.getObjectByName('mixamorigNeck');
  const spine2 = avatar.getObjectByName('mixamorigSpine2');
  const spine1 = avatar.getObjectByName('mixamorigSpine1');

  const rArm = avatar.getObjectByName('mixamorigRightArm');
  const rFore = avatar.getObjectByName('mixamorigRightForeArm');
  const rHand = avatar.getObjectByName('mixamorigRightHand');

  const t1 = avatar.getObjectByName('mixamorigRightHandThumb1');
  const t2 = avatar.getObjectByName('mixamorigRightHandThumb2');
  const i1 = avatar.getObjectByName('mixamorigRightHandIndex1');
  const m1 = avatar.getObjectByName('mixamorigRightHandMiddle1');
  const r1 = avatar.getObjectByName('mixamorigRightHandRing1');
  const p1 = avatar.getObjectByName('mixamorigRightHandPinky1');

  const fromQuat = {
    arm: new THREE.Quaternion(),
    fore: new THREE.Quaternion(),
    hand: new THREE.Quaternion(),
    t1: new THREE.Quaternion(),
    t2: new THREE.Quaternion(),
    i1: new THREE.Quaternion(),
    m1: new THREE.Quaternion(),
    r1: new THREE.Quaternion(),
    p1: new THREE.Quaternion(),
  };

  const toQuat = {
    arm: new THREE.Quaternion(),
    fore: new THREE.Quaternion(),
    hand: new THREE.Quaternion(),
    t1: new THREE.Quaternion(),
    t2: new THREE.Quaternion(),
    i1: new THREE.Quaternion(),
    m1: new THREE.Quaternion(),
    r1: new THREE.Quaternion(),
    p1: new THREE.Quaternion(),
  };

  if (!rArm || !rFore || !rHand) return;

  rArm.rotation.order = 'XYZ';
  rFore.rotation.order = 'XYZ';
  rHand.rotation.order = 'XYZ';
  t1 && (t1.rotation.order = 'XYZ');
  t2 && (t2.rotation.order = 'XYZ');
  i1 && (i1.rotation.order = 'XYZ');
  m1 && (m1.rotation.order = 'XYZ');
  r1 && (r1.rotation.order = 'XYZ');
  p1 && (p1.rotation.order = 'XYZ');

  const lerpSpeed = 0.03;
  let stepIndex = 0;
  let progress = 0;
  let t = 0;
  const headCur = { x: 0, y: 0, z: 0 };

  function setQuats() {
    fromQuat.arm.copy(rArm.quaternion).normalize();
    toQuat.arm.setFromEuler(new THREE.Euler(3.571, -3.042, -3.089)).normalize();

    fromQuat.fore.copy(rFore.quaternion).normalize();
    toQuat.fore.setFromEuler(new THREE.Euler(0.116, -1.364, -1.170)).normalize();

    fromQuat.hand.copy(rHand.quaternion).normalize();
    toQuat.hand.setFromEuler(new THREE.Euler(-1.325, -0.544, -1.227)).normalize();

    fromQuat.t1.copy(t1.quaternion).normalize();
    toQuat.t1.setFromEuler(new THREE.Euler(-0.927, 0.140, -0.070)).normalize();

    fromQuat.t2.copy(t2.quaternion).normalize();
    toQuat.t2.setFromEuler(new THREE.Euler(0.000, -0.052, -0.925)).normalize();

    fromQuat.i1.copy(i1.quaternion).normalize();
    toQuat.i1.setFromEuler(new THREE.Euler(-0.733, 0.000, 0.646)).normalize();

    fromQuat.m1.copy(m1.quaternion).normalize();
    toQuat.m1.setFromEuler(new THREE.Euler(-0.611, 0.000, 0.489)).normalize();

    fromQuat.r1.copy(r1.quaternion).normalize();
    toQuat.r1.setFromEuler(new THREE.Euler(-0.471, -0.157, 0.384)).normalize();

    fromQuat.p1.copy(p1.quaternion).normalize();
    toQuat.p1.setFromEuler(new THREE.Euler(-0.454, 0.087, 0.070)).normalize();
  }

  setQuats();

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

    if (stepIndex < 1) {
      progress += lerpSpeed;
      if (progress >= 1) {
        progress = 1;
        stepIndex = 1;
      }

      rArm.quaternion.copy(fromQuat.arm).slerp(toQuat.arm, progress);
      rFore.quaternion.copy(fromQuat.fore).slerp(toQuat.fore, progress);
      rHand.quaternion.copy(fromQuat.hand).slerp(toQuat.hand, progress);

      t1.quaternion.copy(fromQuat.t1).slerp(toQuat.t1, progress);
      t2.quaternion.copy(fromQuat.t2).slerp(toQuat.t2, progress);
      i1.quaternion.copy(fromQuat.i1).slerp(toQuat.i1, progress);
      m1.quaternion.copy(fromQuat.m1).slerp(toQuat.m1, progress);
      r1.quaternion.copy(fromQuat.r1).slerp(toQuat.r1, progress);
      p1.quaternion.copy(fromQuat.p1).slerp(toQuat.p1, progress);
    }
  }

  animate();

  window.poseControl = {
    set(boneName, x, y, z) {
      const bone = avatar.getObjectByName(boneName);
      if (!bone) return console.warn(`❌ Кістка ${boneName} не знайдена`);
      bone.rotation.set(x, y, z);
      console.log(`✅ ${boneName} встановлено → X=${x.toFixed(3)}, Y=${y.toFixed(3)}, Z=${z.toFixed(3)}`);
    },
    get(boneName) {
      const bone = avatar.getObjectByName(boneName);
      if (!bone) return console.warn(`❌ Кістка ${boneName} не знайдена`);
      const r = bone.rotation;
      console.log(`📍 ${boneName} → X=${r.x.toFixed(3)}, Y=${r.y.toFixed(3)}, Z=${r.z.toFixed(3)}`);
    },
    list() {
      const bones = {};
      avatar.traverse(obj => {
        if (obj.isBone) bones[obj.name] = obj;
      });
      console.log("🦴 Доступні кістки:");
      console.table(Object.keys(bones));
    }
  };
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
