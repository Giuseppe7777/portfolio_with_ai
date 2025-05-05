// src/avatar/startIdleFaceMovements.js
// import * as THREE from 'three';
// import { isTalking } from './state';

// export function startIdleFaceMovements(faceMesh, avatar) {
//   const infl = faceMesh.morphTargetInfluences;
//   const dict = faceMesh.morphTargetDictionary;

//   const smileL = dict['A38_Mouth_Smile_Left'];
//   const smileR = dict['A39_Mouth_Smile_Right'];
//   const browUp = dict['A06_Brow_Up'];
//   const squintL = dict['A16_Eye_Squint_Left'];
//   const squintR = dict['A17_Eye_Squint_Right'];

//   setInterval(() => {
//     if (!infl) return;
//     infl[smileL] = 0.8 + Math.random() * 0.5;
//     infl[smileR] = 0.8 + Math.random() * 0.5;
//     infl[browUp] = Math.random() * 0.3;
//     infl[squintL] = 0.1 + Math.random() * 0.9;
//     infl[squintR] = 0.1 + Math.random() * 0.9;
//   }, 3000);

//   const head = avatar.getObjectByName('mixamorigHead');
//   const neck = avatar.getObjectByName('mixamorigNeck');
//   const spine2 = avatar.getObjectByName('mixamorigSpine2');
//   const spine1 = avatar.getObjectByName('mixamorigSpine1');

//   const bones = {
//     lArm: avatar.getObjectByName('mixamorigLeftArm'),
//     lFore: avatar.getObjectByName('mixamorigLeftForeArm'),
//     lHand: avatar.getObjectByName('mixamorigLeftHand'),
//     t1: avatar.getObjectByName('mixamorigLeftHandThumb1'),
//     t2: avatar.getObjectByName('mixamorigLeftHandThumb2'),
//     i1: avatar.getObjectByName('mixamorigLeftHandIndex1'),
//     m1: avatar.getObjectByName('mixamorigLeftHandMiddle1'),
//     r1: avatar.getObjectByName('mixamorigLeftHandRing1'),
//     p1: avatar.getObjectByName('mixamorigLeftHandPinky1')
//   };

//   Object.values(bones).forEach(b => b && (b.rotation.order = 'XYZ'));

//   const startPose = {
//     lArm: new THREE.Euler(1.011, 0.511, 0.559),
//     lFore: new THREE.Euler(0.164, 0.545, 0.552),
//     lHand: new THREE.Euler(0.069, 0.030, 0.131)
//   };

//   const pose1 = {
//     lArm: new THREE.Euler(2.8, 2.4, 2.5),
//     lFore: new THREE.Euler(0.2, 1.0, 1.0),
//     lHand: new THREE.Euler(-0.4, 0.2, 1.1)
//   };

//   const finalPose = {
//     lArm: new THREE.Euler(3.551, 3.042, 3.089),
//     lFore: new THREE.Euler(0.116, 1.364, 1.170),
//     lHand: new THREE.Euler(-1.025, 0.344, 1.227),
//     t1: new THREE.Euler(-0.227, -0.140, 0.070),
//     t2: new THREE.Euler(0.000, 0.052, 0.925),
//     i1: new THREE.Euler(-0.733, 0.000, -0.646),
//     m1: new THREE.Euler(-0.611, 0.000, -0.489),
//     r1: new THREE.Euler(-0.471, 0.157, -0.384),
//     p1: new THREE.Euler(-0.454, -0.087, -0.070)
//   };

//   const cur = {};
//   Object.keys(bones).forEach(k => {
//     const b = bones[k];
//     if (b) cur[k] = b.rotation.clone();
//   });

//   let step = 0;
//   let t = 0;
//   const speed = 0.1;
//   const headCur = { x: 0, y: 0, z: 0 };

//   function animate() {
//     requestAnimationFrame(animate);
//     t += 0.016;

//     if (!isTalking) {
//       if (head) {
//         headCur.x = THREE.MathUtils.lerp(headCur.x, clamp(Math.sin(t * 0.3), 0.25, 0), 0.05);
//         headCur.y = THREE.MathUtils.lerp(headCur.y, clamp(Math.sin(t * 0.2), -0.1, 0.3), 0.05);
//         headCur.z = THREE.MathUtils.lerp(headCur.z, clamp(Math.sin(t * 0.17), -0.05, 0.05), 0.05);
//         head.rotation.set(headCur.x, headCur.y, headCur.z);
//       }
//       if (neck) neck.rotation.x = Math.sin(t * 0.4) * 0.02;
//       if (spine2) spine2.rotation.x = Math.sin(t * 0.2) * 0.05;
//       if (spine1) {
//         spine1.rotation.z = Math.sin(t * 0.25) * 0.06;
//         spine1.rotation.y = Math.sin(t * 0.25) * 0.2;
//       }

//       let allDone = true;
//       const targetPose = step === 0 ? pose1 : finalPose;
//       Object.keys(bones).forEach(k => {
//         const b = bones[k];
//         const c = cur[k];
//         const target = targetPose[k];
//         if (!b || !c || !target) return;
//         c.x = b.rotation.x = THREE.MathUtils.lerp(c.x, target.x, speed);
//         c.y = b.rotation.y = THREE.MathUtils.lerp(c.y, target.y, speed);
//         c.z = b.rotation.z = THREE.MathUtils.lerp(c.z, target.z, speed);
//         if (Math.abs(c.x - target.x) > 0.01 || Math.abs(c.y - target.y) > 0.01 || Math.abs(c.z - target.z) > 0.01) {
//           allDone = false;
//         }
//       });

//       if (allDone && step === 0) step = 1;
//     } else {
//       step = 0;
//     }
//   }

//   animate();
// }

// function clamp(v, min, max) {
//   return Math.max(min, Math.min(max, v));
// }



/*
poseControl.set('lArm',   3.551,  3.042,  3.089);
poseControl.set('lFore',  0.116,  1.364,  1.170);
poseControl.set('lHand', -1.025, 0.344,  1.227);

poseControl.set('t1',    -0.227, -0.140,  0.070);
poseControl.set('t2',     0.000,  0.052,  0.925);

poseControl.set('i1',    -0.733,  0.000, -0.646);
poseControl.set('m1',    -0.611,  0.000, -0.489);
poseControl.set('r1',    -0.471,  0.157, -0.384);
poseControl.set('p1',    -0.454, -0.087, -0.070);
*/




/*
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

  const bones = {
    lArm: avatar.getObjectByName('mixamorigLeftArm'),
    lFore: avatar.getObjectByName('mixamorigLeftForeArm'),
    lHand: avatar.getObjectByName('mixamorigLeftHand'),
  };

  Object.values(bones).forEach(b => b && (b.rotation.order = 'XYZ'));

  const current = {
    lArm: bones.lArm ? bones.lArm.rotation.clone() : new THREE.Euler(),
    lFore: bones.lFore ? bones.lFore.rotation.clone() : new THREE.Euler(),
    lHand: bones.lHand ? bones.lHand.rotation.clone() : new THREE.Euler()
  };

  const startPose = {
    lArm: new THREE.Euler(1.011, 0.511, 0.559),
    lFore: new THREE.Euler(0.164, 0.545, 0.552),
    lHand: new THREE.Euler(0.069, 0.030, 0.131)
  };

  const pose1 = {
    lArm: new THREE.Euler(2.8, 2.6, 2.7),
    lFore: new THREE.Euler(0.3, 1.1, 1.3),
    lHand: new THREE.Euler(-0.5, 0.2, 0.8)
  };

  const finalPose = {
    lArm: new THREE.Euler(3.551, 3.042, 3.089),
    lFore: new THREE.Euler(0.116, 1.364, 1.170),
    lHand: new THREE.Euler(-1.025, 0.344, 1.227)
  };

  let stage = 0;
  let t = 0;
  const headCur = { x: 0, y: 0, z: 0 };

  function animate() {
    requestAnimationFrame(animate);
    t += 0.016;

    if (!isTalking) {
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

      const targetPose = stage === 0 ? pose1 : finalPose;
      let done = true;
      Object.keys(bones).forEach(k => {
        const bone = bones[k];
        const cur = current[k];
        const tgt = targetPose[k];
        if (!bone || !cur || !tgt) return;

        cur.x = bone.rotation.x = THREE.MathUtils.lerp(cur.x, tgt.x, 0.08);
        cur.y = bone.rotation.y = THREE.MathUtils.lerp(cur.y, tgt.y, 0.08);
        cur.z = bone.rotation.z = THREE.MathUtils.lerp(cur.z, tgt.z, 0.08);

        const dx = Math.abs(cur.x - tgt.x);
        const dy = Math.abs(cur.y - tgt.y);
        const dz = Math.abs(cur.z - tgt.z);
        if (dx > 0.01 || dy > 0.01 || dz > 0.01) done = false;
      });

      if (done && stage === 0) stage = 1;
    } else {
      stage = 0;
    }
  }

  animate();
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

*/

// src/avatar/startIdleFaceMovements.js

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

  if (!lArm || !lFore || !lHand) return;

  lArm.rotation.order = 'XYZ';
  lFore.rotation.order = 'XYZ';
  lHand.rotation.order = 'XYZ';

  const steps = [
    new THREE.Euler(1.011, 0.511, 0.559),
    new THREE.Euler(1.4, 0.7, 1.1),
    new THREE.Euler(2.0, 1.6, 1.8),
    new THREE.Euler(3.0, 2.5, 2.6),
    new THREE.Euler(3.551, 3.042, 3.089),
  ];

  const stepsFore = [
    new THREE.Euler(0.164, 0.545, 0.552),
    new THREE.Euler(0.3, 0.8, 0.7),
    new THREE.Euler(0.5, 1.0, 1.0),
    new THREE.Euler(0.8, 1.2, 1.2),
    new THREE.Euler(0.116, 1.364, 1.170),
  ];

  const stepsHand = [
    new THREE.Euler(0.069, 0.030, 0.131),
    new THREE.Euler(-0.2, 0.2, 0.6),
    new THREE.Euler(-0.5, 0.3, 0.9),
    new THREE.Euler(-0.8, 0.35, 1.1),
    new THREE.Euler(-1.025, 0.344, 1.227),
  ];

  let stepIndex = 0;
  let delay = 0;
  const interval = 60; // приблизно 1 крок кожні 60 кадрів (1 сек)

  function animate() {
    requestAnimationFrame(animate);

    if (!isTalking && stepIndex < steps.length && delay++ > interval) {
      lArm.rotation.copy(steps[stepIndex]);
      lFore.rotation.copy(stepsFore[stepIndex]);
      lHand.rotation.copy(stepsHand[stepIndex]);

      console.log(`▶ Step ${stepIndex}`, steps[stepIndex]);
      stepIndex++;
      delay = 0;
    }
  }

  animate();
}


// src/avatar/startIdleFaceMovements.js
