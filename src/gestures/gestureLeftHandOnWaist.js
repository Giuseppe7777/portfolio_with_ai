// src/gestures/gestureLeftHandOnWaist.js
import * as THREE from 'three';

/**
 * Піднімає ліву руку на талію з анімацією всіх кісток та пальців
 * @param {THREE.Object3D} avatar
 * @param {number} durationMs - час анімації (за замовчуванням 600мс)
 */
export function gestureLeftHandOnWaist(avatar, durationMs = 600) {
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

  if (!lArm || !lFore || !lHand) return;

  lArm.rotation.order = 'XYZ';
  lFore.rotation.order = 'XYZ';
  lHand.rotation.order = 'XYZ';
  for (let k in fingers) fingers[k] && (fingers[k].rotation.order = 'XYZ');

  const fromQuat = {};
  const toQuat = {};

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

  const steps = Math.round(durationMs / (1000 / 60));
  let frame = 0;

  function animate() {
    if (frame <= steps) {
      const alpha = frame / steps;

      lArm.quaternion.copy(fromQuat.arm).slerp(toQuat.arm, alpha);
      lFore.quaternion.copy(fromQuat.fore).slerp(toQuat.fore, alpha);
      lHand.quaternion.copy(fromQuat.hand).slerp(toQuat.hand, alpha);

      for (let f in fingers) {
        if (fingers[f]) {
          fingers[f].quaternion.copy(fromQuat[f]).slerp(toQuat[f], alpha);
        }
      }

      frame++;
      requestAnimationFrame(animate);
    }
  }

  animate();
}
