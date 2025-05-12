// src/gestures/gestureRightHandOnWaist.js
import * as THREE from 'three';

/**
 * Піднімає праву руку на талію з пальцями (жест "рука на поясі")
 * @param {THREE.Object3D} avatar - повна 3D-модель
 * @param {number} durationMs - тривалість анімації у мс (за замовчуванням 600)
 */
export function gestureRightHandOnWaist(avatar, durationMs = 600) {
  const rArm = avatar.getObjectByName('mixamorigRightArm');
  const rFore = avatar.getObjectByName('mixamorigRightForeArm');
  const rHand = avatar.getObjectByName('mixamorigRightHand');

  const t1 = avatar.getObjectByName('mixamorigRightHandThumb1');
  const t2 = avatar.getObjectByName('mixamorigRightHandThumb2');
  const i1 = avatar.getObjectByName('mixamorigRightHandIndex1');
  const m1 = avatar.getObjectByName('mixamorigRightHandMiddle1');
  const r1 = avatar.getObjectByName('mixamorigRightHandRing1');
  const p1 = avatar.getObjectByName('mixamorigRightHandPinky1');

  if (!rArm || !rFore || !rHand) return;

  const steps = Math.round(durationMs / (1000 / 60));
  let frame = 0;

  const fromQuat = {
    arm: rArm.quaternion.clone(),
    fore: rFore.quaternion.clone(),
    hand: rHand.quaternion.clone(),
    t1: t1?.quaternion.clone(),
    t2: t2?.quaternion.clone(),
    i1: i1?.quaternion.clone(),
    m1: m1?.quaternion.clone(),
    r1: r1?.quaternion.clone(),
    p1: p1?.quaternion.clone(),
  };

  const toQuat = {
    arm: new THREE.Quaternion().setFromEuler(new THREE.Euler(3.571, -3.042, -3.089)),
    fore: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.116, -1.364, -1.170)),
    hand: new THREE.Quaternion().setFromEuler(new THREE.Euler(-1.325, -0.544, -1.227)),

    t1: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.927, 0.140, -0.070)),
    t2: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.000, -0.052, -0.925)),

    i1: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.733, 0.000, 0.646)),
    m1: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.611, 0.000, 0.489)),
    r1: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.471, -0.157, 0.384)),
    p1: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.454, 0.087, 0.070)),
  };

  function animate() {
    if (frame <= steps) {
      const alpha = frame / steps;

      rArm.quaternion.copy(fromQuat.arm).slerp(toQuat.arm, alpha);
      rFore.quaternion.copy(fromQuat.fore).slerp(toQuat.fore, alpha);
      rHand.quaternion.copy(fromQuat.hand).slerp(toQuat.hand, alpha);

      t1 && t1.quaternion.copy(fromQuat.t1).slerp(toQuat.t1, alpha);
      t2 && t2.quaternion.copy(fromQuat.t2).slerp(toQuat.t2, alpha);
      i1 && i1.quaternion.copy(fromQuat.i1).slerp(toQuat.i1, alpha);
      m1 && m1.quaternion.copy(fromQuat.m1).slerp(toQuat.m1, alpha);
      r1 && r1.quaternion.copy(fromQuat.r1).slerp(toQuat.r1, alpha);
      p1 && p1.quaternion.copy(fromQuat.p1).slerp(toQuat.p1, alpha);

      frame++;
      requestAnimationFrame(animate);
    }
  }

  animate();
}
