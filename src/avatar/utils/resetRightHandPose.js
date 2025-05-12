
import * as THREE from 'three';

export function resetRightHandPose(avatar) {
  for (const [boneName, [x, y, z]] of Object.entries(neutralAngles)) {
    const bone = avatar.getObjectByName(boneName);
    if (bone) bone.rotation.set(x, y, z);
  }
}

export function resetRightHandPoseSmooth(avatar, durationMs = 500) {
  const steps = Math.round(durationMs / (1000 / 60)); 
  let frame = 0;

  const bones = {};
  const from = {};

  for (const boneName in neutralAngles) {
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
        const target = neutralAngles[boneName];
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

const neutralAngles = {
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
