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

  const lArm = avatar.getObjectByName('mixamorigLeftArm');
  const lFore = avatar.getObjectByName('mixamorigLeftForeArm');
  const lHand = avatar.getObjectByName('mixamorigLeftHand');

  const t1 = avatar.getObjectByName('mixamorigLeftHandThumb1');
  const t2 = avatar.getObjectByName('mixamorigLeftHandThumb2');
  const i1 = avatar.getObjectByName('mixamorigLeftHandIndex1');
  const m1 = avatar.getObjectByName('mixamorigLeftHandMiddle1');
  const r1 = avatar.getObjectByName('mixamorigLeftHandRing1');
  const p1 = avatar.getObjectByName('mixamorigLeftHandPinky1');

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

  if (!lArm || !lFore || !lHand) return;

  lArm.rotation.order = 'XYZ';
  lFore.rotation.order = 'XYZ';
  lHand.rotation.order = 'XYZ';
  t1 && (t1.rotation.order = 'XYZ');
  t2 && (t2.rotation.order = 'XYZ');
  i1 && (i1.rotation.order = 'XYZ');
  m1 && (m1.rotation.order = 'XYZ');
  r1 && (r1.rotation.order = 'XYZ');
  p1 && (p1.rotation.order = 'XYZ');

  const steps = [
    new THREE.Euler(0.7, 0.2, 0.2),              // стартова поза
    new THREE.Euler(3.48, 2.75, 2.85)            // фінальна — рука на талії
  ];

  const stepsFore = [
    new THREE.Euler(0.4, 0.5, 0.6),
    new THREE.Euler(0.116, 0.7, 1.4)
  ];

  const stepsHand = [
    new THREE.Euler(-0.1, 0.1, 0.4),
    new THREE.Euler(-1.025, 0.344, 1.227)
  ];

  let stepIndex = 0;
  let progress = 0;
  const lerpSpeed = 0.03;

  function setQuats(fromIndex, toIndex) {
    fromQuat.arm.copy(lArm.quaternion).normalize();
    toQuat.arm.setFromEuler(new THREE.Euler(3.571, 3.042, 3.089)).normalize();

    fromQuat.fore.copy(lFore.quaternion).normalize();
    toQuat.fore.setFromEuler(new THREE.Euler(0.116, 1.364, 1.170)).normalize();

    fromQuat.hand.copy(lHand.quaternion).normalize();
    toQuat.hand.setFromEuler(new THREE.Euler(-1.325, 0.544, 1.227)).normalize();

    fromQuat.t1.copy(t1.quaternion).normalize();
    toQuat.t1.setFromEuler(new THREE.Euler(-0.927, -0.140, 0.070)).normalize();

    fromQuat.t2.copy(t2.quaternion).normalize();
    toQuat.t2.setFromEuler(new THREE.Euler(0.000, 0.052, 0.925)).normalize();

    fromQuat.i1.copy(i1.quaternion).normalize();
    toQuat.i1.setFromEuler(new THREE.Euler(-0.733, 0.000, -0.646)).normalize();

    fromQuat.m1.copy(m1.quaternion).normalize();
    toQuat.m1.setFromEuler(new THREE.Euler(-0.611, 0.000, -0.489)).normalize();

    fromQuat.r1.copy(r1.quaternion).normalize();
    toQuat.r1.setFromEuler(new THREE.Euler(-0.471, 0.157, -0.384)).normalize();

    fromQuat.p1.copy(p1.quaternion).normalize();
    toQuat.p1.setFromEuler(new THREE.Euler(-0.454, -0.087, -0.070)).normalize();
  }


  setQuats(0, 1);

  function animate() {
    requestAnimationFrame(animate);

    if (isTalking) return;

    if (stepIndex < steps.length - 1) {
      progress += lerpSpeed;
      if (progress >= 1) {
        progress = 1;
        stepIndex = steps.length - 1; // зупиняємося на останньому кроці
        console.log(`✅ Final step reached`);

        // 🔍 Виводимо обертання ключових кісток
        console.log("🔎 Final bone rotations:");
        console.log("lArm:", lArm.rotation);
        console.log("lFore:", lFore.rotation);
        console.log("lHand:", lHand.rotation);
        console.log("t1:", t1?.rotation);
        console.log("t2:", t2?.rotation);
        console.log("i1:", i1?.rotation);
        console.log("m1:", m1?.rotation);
        console.log("r1:", r1?.rotation);
        console.log("p1:", p1?.rotation);
      }

      lArm.quaternion.copy(fromQuat.arm).slerp(toQuat.arm, progress);
      lFore.quaternion.copy(fromQuat.fore).slerp(toQuat.fore, progress);
      lHand.quaternion.copy(fromQuat.hand).slerp(toQuat.hand, progress);

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
