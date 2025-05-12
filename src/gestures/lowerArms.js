// src/gestures/lowerArms.js
import * as THREE from 'three';

export function lowerRightArm(avatar, durationMs = 600) {
  return animateToNeutralPose(avatar, rightNeutralAngles, durationMs);
}

export function lowerLeftArm(avatar, durationMs = 600) {
  return animateToNeutralPose(avatar, leftNeutralAngles, durationMs);
}

function animateToNeutralPose(avatar, targetAngles, durationMs) {
  const steps = Math.round(durationMs / (1000 / 60));
  let frame = 0;

  const bones = {};
  const from = {};

  for (const boneName in targetAngles) {
    const bone = avatar.getObjectByName(boneName);
    if (bone) {
      bones[boneName] = bone;
      from[boneName] = bone.rotation.clone();
    }
  }

  function animate() {
    if (frame <= steps) {
      const alpha = frame / steps;
      for (const boneName in bones) {
        const bone = bones[boneName];
        const target = targetAngles[boneName];
        bone.rotation.x = THREE.MathUtils.lerp(from[boneName].x, target[0], alpha);
        bone.rotation.y = THREE.MathUtils.lerp(from[boneName].y, target[1], alpha);
        bone.rotation.z = THREE.MathUtils.lerp(from[boneName].z, target[2], alpha);
      }

      frame++;
      requestAnimationFrame(animate);
    }
  }

  animate();
}

const rightNeutralAngles = {
  mixamorigRightArm:       [0.969, 0.460, -0.219],
  mixamorigRightForeArm:   [0.418, 0.248, 0.082],
  mixamorigRightHand:      [0.813, -0.914, 0.901],

  mixamorigRightHandThumb1: [0.014, 0.002, -0.771],
  mixamorigRightHandThumb2: [-0.125, -0.159, 0.193],
  mixamorigRightHandThumb3: [0.000, 0.000, 0.000],

  mixamorigRightHandIndex1: [-0.080, -0.011, 0.080],
  mixamorigRightHandIndex2: [0.137, 0.008, -0.044],
  mixamorigRightHandIndex3: [0.000, 0.000, 0.000],

  mixamorigRightHandMiddle1: [-0.035, -0.005, 0.140],
  mixamorigRightHandMiddle2: [0.126, -0.000, -0.055],
  mixamorigRightHandMiddle3: [0.000, 0.000, 0.000],

  mixamorigRightHandRing1: [0.215, 0.030, 0.169],
  mixamorigRightHandRing2: [-0.024, 0.001, 0.013],
  mixamorigRightHandRing3: [0.000, 0.000, 0.000],

  mixamorigRightHandPinky1: [0.116, 0.016, 0.226],
  mixamorigRightHandPinky2: [0.343, -0.029, 0.105],
  mixamorigRightHandPinky3: [0.000, 0.000, 0.000],
};

const leftNeutralAngles = {
  mixamorigLeftArm:       [0.790, 0.691, 0.239],
  mixamorigLeftForeArm:   [0.096, 0.508, 0.394],
  mixamorigLeftHand:      [0.156, -0.354, 0.122],

  mixamorigLeftHandThumb1: [0.058, 0.006, 0.349],
  mixamorigLeftHandThumb2: [-0.153, 0.169, -0.197],
  mixamorigLeftHandThumb3: [0.000, 0.000, 0.000],

  mixamorigLeftHandIndex1: [-0.101, 0.009, -0.053],
  mixamorigLeftHandIndex2: [0.129, -0.005, 0.037],
  mixamorigLeftHandIndex3: [0.000, 0.000, 0.000],

  mixamorigLeftHandMiddle1: [-0.102, 0.010, -0.095],
  mixamorigLeftHandMiddle2: [0.137, 0.000, 0.055],
  mixamorigLeftHandMiddle3: [0.000, 0.000, 0.000],

  mixamorigLeftHandRing1: [0.048, -0.005, -0.118],
  mixamorigLeftHandRing2: [0.025, 0.001, -0.009],
  mixamorigLeftHandRing3: [0.000, 0.000, 0.000],

  mixamorigLeftHandPinky1: [-0.037, 0.003, -0.152],
  mixamorigLeftHandPinky2: [0.263, 0.015, -0.089],
  mixamorigLeftHandPinky3: [0.000, 0.000, 0.000],
};
