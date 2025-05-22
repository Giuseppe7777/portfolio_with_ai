
import * as THREE from 'three';
import { resetRightHandPoseSmooth } from '../avatar/utils/resetRightHandPose.js';

export function gestureAttentionWithFinger(avatar) {
  const rArm = avatar.getObjectByName('mixamorigRightArm');
  const rFore = avatar.getObjectByName('mixamorigRightForeArm');
  const rHand = avatar.getObjectByName('mixamorigRightHand');

  const t1 = avatar.getObjectByName('mixamorigRightHandThumb1');
  const t2 = avatar.getObjectByName('mixamorigRightHandThumb2');
  const t3 = avatar.getObjectByName('mixamorigRightHandThumb3');
  const i1 = avatar.getObjectByName('mixamorigRightHandIndex1');
  const m1 = avatar.getObjectByName('mixamorigRightHandMiddle1');
  const m2 = avatar.getObjectByName('mixamorigRightHandMiddle2');
  const m3 = avatar.getObjectByName('mixamorigRightHandMiddle3');
  const r1 = avatar.getObjectByName('mixamorigRightHandRing1');
  const r2 = avatar.getObjectByName('mixamorigRightHandRing2');
  const r3 = avatar.getObjectByName('mixamorigRightHandRing3');
  const p1 = avatar.getObjectByName('mixamorigRightHandPinky1');
  const p2 = avatar.getObjectByName('mixamorigRightHandPinky2');

  if (!rArm || !rFore || !rHand || !i1 || !m1 || !r1 || !p1 || !t1 || !t2 || !t3 || !m2 || !m3 || !r2 || !r3 || !p2) return;

  rArm.rotation.order = 'XYZ';
  rFore.rotation.order = 'XYZ';
  rHand.rotation.order = 'XYZ';
  i1.rotation.order = 'XYZ';
  m1.rotation.order = 'XYZ';
  m2.rotation.order = 'XYZ';
  m3.rotation.order = 'XYZ';
  r1.rotation.order = 'XYZ';
  r2.rotation.order = 'XYZ';
  r3.rotation.order = 'XYZ';
  p1.rotation.order = 'XYZ';
  p2.rotation.order = 'XYZ';
  t1.rotation.order = 'XYZ';
  t2.rotation.order = 'XYZ';
  t3.rotation.order = 'XYZ';

  const targetArm  = new THREE.Euler(2.100, 1.000, -1.100);
  const targetFore = new THREE.Euler(1.500, -0.900, -0.600);
  const targetHand = new THREE.Euler(-0.212, -0.777, -0.655);

  const fingers = {
    t1: new THREE.Euler(0.061, 0.340, -0.356),
    t2: new THREE.Euler(0.000, 0.100, 0.027),
    t3: new THREE.Euler(0.000, 0.100, 0.927),
    m1: new THREE.Euler(0.321, 0.800, 0.017),
    m2: new THREE.Euler(2.770, 0.000, 0.211),
    m3: new THREE.Euler(0.000, 0.000, 0.011),
    r1: new THREE.Euler(0.321, 0.800, 0.017),
    r2: new THREE.Euler(2.570, 0.000, 0.211),
    r3: new THREE.Euler(-0.105, -0.646, 0.052),
    p1: new THREE.Euler(0.321, 0.800, 0.017),
    p2: new THREE.Euler(2.700, 0.000, 0.211),
  };

  function raiseHandAndPose() {
    const steps = 30;
    let frame = 0;

    const fromArm = rArm.rotation.clone();
    const fromFore = rFore.rotation.clone();
    const fromHand = rHand.rotation.clone();

    const fromFingers = {};
    for (const key in fingers) {
      const bone = eval(key);
      fromFingers[key] = bone.rotation.clone();
    }

    function animate() {
      if (frame <= steps) {
        const alpha = frame / steps;

        rArm.rotation.x = THREE.MathUtils.lerp(fromArm.x, targetArm.x, alpha);
        rArm.rotation.y = THREE.MathUtils.lerp(fromArm.y, targetArm.y, alpha);
        rArm.rotation.z = THREE.MathUtils.lerp(fromArm.z, targetArm.z, alpha);

        rFore.rotation.x = THREE.MathUtils.lerp(fromFore.x, targetFore.x, alpha);
        rFore.rotation.y = THREE.MathUtils.lerp(fromFore.y, targetFore.y, alpha);
        rFore.rotation.z = THREE.MathUtils.lerp(fromFore.z, targetFore.z, alpha);

        rHand.rotation.x = THREE.MathUtils.lerp(fromHand.x, targetHand.x, alpha);
        rHand.rotation.y = THREE.MathUtils.lerp(fromHand.y, targetHand.y, alpha);
        rHand.rotation.z = THREE.MathUtils.lerp(fromHand.z, targetHand.z, alpha);

        for (const key in fingers) {
          const bone = eval(key);
          bone.rotation.x = THREE.MathUtils.lerp(fromFingers[key].x, fingers[key].x, alpha);
          bone.rotation.y = THREE.MathUtils.lerp(fromFingers[key].y, fingers[key].y, alpha);
          bone.rotation.z = THREE.MathUtils.lerp(fromFingers[key].z, fingers[key].z, alpha);
        }

        frame++;
        requestAnimationFrame(animate);
      } else {
        wagHandZ(() => {
          resetRightHandPoseSmooth(avatar, 700); // 700 мс — плавне повернення
        });
      }
    }

    animate();
  }

  function wagHandZ(callback) {
    let frame = 0;
    const steps = 20;
    const amplitude = 0.15;
    const repeats = 2;
    let count = 0;

    const minZ = -0.755;
    const maxZ = -0.455;
    const base = rHand.rotation.z;

    function animate() {
      if (count < repeats) {
        const angle = Math.sin((frame / steps) * Math.PI) * (maxZ - minZ) / 2;
        rHand.rotation.z = base + angle;

        frame++;
        if (frame <= steps) {
          requestAnimationFrame(animate);
        } else {
          frame = 0;
          count++;
          requestAnimationFrame(animate);
        }
      } else if (callback) {
        callback();
      }
    }

    animate();
  }

  raiseHandAndPose();
}

window.poseControl = {
    set(boneName, x, y, z) {
      const bone = avatar.getObjectByName(boneName);
      if (!bone) return console.warn(` Кістка ${boneName} не знайдена`);
      bone.rotation.set(x, y, z);
      console.log(`✅ ${boneName} встановлено → X=${x.toFixed(3)}, Y=${y.toFixed(3)}, Z=${z.toFixed(3)}`);
    },
    get(boneName) {
      const bone = avatar.getObjectByName(boneName);
      if (!bone) return console.warn(` Кістка ${boneName} не знайдена`);
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
