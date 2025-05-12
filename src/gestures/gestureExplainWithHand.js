// src/gestures/gestureExplainWithHand.js
import * as THREE from "three";
import { resetRightHandPoseSmooth } from "../avatar/utils/resetRightHandPose.js";

export function gestureExplainWithHand(avatar) {
  const rArm = avatar.getObjectByName("mixamorigRightArm");
  const rFore = avatar.getObjectByName("mixamorigRightForeArm");
  const rHand = avatar.getObjectByName("mixamorigRightHand");

  if (!rArm || !rFore || !rHand) return;

  rArm.rotation.order = "XYZ";
  rFore.rotation.order = "XYZ";
  rHand.rotation.order = "XYZ";

  const targetArm = new THREE.Euler(0.969, 0.3236, -0.619);
  const targetFore = new THREE.Euler(1.218, 1.148, 0.082);
  const targetHand = new THREE.Euler(0.813, -0.914, 0.901);

  const startPose = {
    arm: new THREE.Euler(0.969, 0.46, -0.219),
    fore: new THREE.Euler(0.418, 0.248, 0.082),
    hand: new THREE.Euler(0.813, -0.914, 0.901),
  };

  // === ФАЗА 1: мʼяко привести руку до стартової пози
  function approachStartPose() {
    const steps = 15;
    let frame = 0;

    const fromArm = rArm.rotation.clone();
    const fromFore = rFore.rotation.clone();
    const fromHand = rHand.rotation.clone();

    function animate() {
      if (frame < steps) {
        const alpha = frame / steps;

        rArm.rotation.x = THREE.MathUtils.lerp(fromArm.x, startPose.arm.x, alpha);
        rArm.rotation.y = THREE.MathUtils.lerp(fromArm.y, startPose.arm.y, alpha);
        rArm.rotation.z = THREE.MathUtils.lerp(fromArm.z, startPose.arm.z, alpha);

        rFore.rotation.x = THREE.MathUtils.lerp(fromFore.x, startPose.fore.x, alpha);
        rFore.rotation.y = THREE.MathUtils.lerp(fromFore.y, startPose.fore.y, alpha);
        rFore.rotation.z = THREE.MathUtils.lerp(fromFore.z, startPose.fore.z, alpha);

        rHand.rotation.x = THREE.MathUtils.lerp(fromHand.x, startPose.hand.x, alpha);
        rHand.rotation.y = THREE.MathUtils.lerp(fromHand.y, startPose.hand.y, alpha);
        rHand.rotation.z = THREE.MathUtils.lerp(fromHand.z, startPose.hand.z, alpha);

        frame++;
        requestAnimationFrame(animate);
      } else {
        raiseAndRotate();
      }
    }

    animate();
  }

  // === ФАЗА 2: підняття руки
  function raiseAndRotate() {
    const steps = 35;
    let frame = 0;

    const fromArm = startPose.arm;
    const fromFore = startPose.fore;
    const fromHand = startPose.hand;

    function animate() {
      if (frame < steps) {
        const alpha = frame / steps;

        rArm.rotation.x = THREE.MathUtils.lerp(fromArm.x, targetArm.x, alpha);
        rArm.rotation.y = THREE.MathUtils.lerp(fromArm.y, targetArm.y, alpha);
        rArm.rotation.z = THREE.MathUtils.lerp(fromArm.z, targetArm.z, alpha);

        rFore.rotation.x = THREE.MathUtils.lerp(fromFore.x, targetFore.x, alpha);
        rFore.rotation.y = THREE.MathUtils.lerp(fromFore.y, targetFore.y, alpha);
        rFore.rotation.z = THREE.MathUtils.lerp(fromFore.z, targetFore.z, alpha);

        rHand.rotation.copy(fromHand); // кисть залишається без змін

        frame++;
        requestAnimationFrame(animate);
      } else {
        orbitForeArm();
      }
    }

    animate();
  }

  // === ФАЗА 3: оберт передпліччя
  function orbitForeArm() {
    const speed = 0.1;
    let t = 0;

    const originalQuat = rFore.quaternion.clone();

    function spin() {
      t += speed;
      const angle = t;

      const axis = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle)).normalize();
      const quat = new THREE.Quaternion().setFromAxisAngle(axis, 0.2);
      const resultQuat = originalQuat.clone().multiply(quat);

      rFore.quaternion.copy(resultQuat);

      if (t < Math.PI * 1.8) {
        requestAnimationFrame(spin);
      } else {
        resetRightHandPoseSmooth(avatar, 700); // ✅ Плавне повернення
      }
    }

    spin();
  }

  // ▶️ Запускаємо фазу 1
  approachStartPose();
}

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
    avatar.traverse((obj) => {
      if (obj.isBone) bones[obj.name] = obj;
    });
    console.log("🦴 Доступні кістки:");
    console.table(Object.keys(bones));
  },
};

// import('/src/gestures/gestureExplainWithHand.js').then(m => m.gestureExplainWithHand(avatar));

/*
poseControl.set('mixamorigRightShoulder', -0.2, 0.4, 0.2);     // плече
poseControl.set('mixamorigRightArm',      -0.6, 1.0, -0.3);     // плечова частина
poseControl.set('mixamorigRightForeArm',  -1.0, 0.2,  0.1);     // передпліччя
poseControl.set('mixamorigRightHand',      0.3, 0.3,  0.5);     // кисть

Типові діапазони, які реально використовуються:
Реальні повороти рук і суглобів: -1.5 → +1.5

Згинання ліктя (ForeArm): -1.3 → 0

Рух плеча вперед (Arm, Shoulder): -1.0 → +1.0

Кисть: -1.0 → +1.0 на кожній осі


poseControl.get('mixamorigRightArm');
poseControl.get('mixamorigRightForeArm');
poseControl.get('mixamorigRightHand');

movAndMimWhileNotTalking.js:177 📍 mixamorigRightArm → X=0.969, Y=0.460, Z=-0.219
movAndMimWhileNotTalking.js:177 📍 mixamorigRightForeArm → X=0.418, Y=0.248, Z=0.082
movAndMimWhileNotTalking.js:177 📍 mixamorigRightHand → X=0.813, Y=-0.914, Z=0.901

correct - poseControl.set('mixamorigRightArm', 0.969, 0.3236, -0.619);
poseControl.set('mixamorigRightForeArm', 1.218, 1.148, 0.082); 

*/
