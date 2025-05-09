import * as THREE from 'three';

export function gestureExplainWithHand(avatar) {
  const rArm = avatar.getObjectByName('mixamorigRightArm');
  const rFore = avatar.getObjectByName('mixamorigRightForeArm');
  const rHand = avatar.getObjectByName('mixamorigRightHand');

  if (!rArm || !rFore || !rHand) return;

  rArm.rotation.order = 'XYZ';
  rFore.rotation.order = 'XYZ';
  rHand.rotation.order = 'XYZ';

  const targetArm  = new THREE.Euler(0.969, 0.3236, -0.619);
  const targetFore = new THREE.Euler(1.218, 1.148, 0.082);
  const targetHand = new THREE.Euler(0.813, -0.914, 0.901);

  const startPose = {
    arm: new THREE.Euler(0.969, 0.460, -0.219),
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
        rArm.rotation.x = THREE.MathUtils.lerp(fromArm.x, startPose.arm.x, frame / steps);
        rArm.rotation.y = THREE.MathUtils.lerp(fromArm.y, startPose.arm.y, frame / steps);
        rArm.rotation.z = THREE.MathUtils.lerp(fromArm.z, startPose.arm.z, frame / steps);

        rFore.rotation.x = THREE.MathUtils.lerp(fromFore.x, startPose.fore.x, frame / steps);
        rFore.rotation.y = THREE.MathUtils.lerp(fromFore.y, startPose.fore.y, frame / steps);
        rFore.rotation.z = THREE.MathUtils.lerp(fromFore.z, startPose.fore.z, frame / steps);

        rHand.rotation.x = THREE.MathUtils.lerp(fromHand.x, startPose.hand.x, frame / steps);
        rHand.rotation.y = THREE.MathUtils.lerp(fromHand.y, startPose.hand.y, frame / steps);
        rHand.rotation.z = THREE.MathUtils.lerp(fromHand.z, startPose.hand.z, frame / steps);

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
    const steps = 60;
    let frame = 0;

    const fromArm = startPose.arm;
    const fromFore = startPose.fore;
    const fromHand = startPose.hand;

    function animate() {
      if (frame < steps) {
        rArm.rotation.x = THREE.MathUtils.lerp(fromArm.x, targetArm.x, frame / steps);
        rArm.rotation.y = THREE.MathUtils.lerp(fromArm.y, targetArm.y, frame / steps);
        rArm.rotation.z = THREE.MathUtils.lerp(fromArm.z, targetArm.z, frame / steps);

        rFore.rotation.x = THREE.MathUtils.lerp(fromFore.x, targetFore.x, frame / steps);
        rFore.rotation.y = THREE.MathUtils.lerp(fromFore.y, targetFore.y, frame / steps);
        rFore.rotation.z = THREE.MathUtils.lerp(fromFore.z, targetFore.z, frame / steps);

        rHand.rotation.copy(fromHand); // не змінюємо кисть

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
    const radius = 0.3;
    const speed = 0.05;
    let t = 0;

    const originalQuat = rFore.quaternion.clone();

    const spin = () => {
      t += speed;
      const angle = t;

      const axis = new THREE.Vector3(
        Math.sin(angle),
        0,
        Math.cos(angle)
      ).normalize();

      const quat = new THREE.Quaternion();
      quat.setFromAxisAngle(axis, 0.2);
      const resultQuat = originalQuat.clone().multiply(quat);

      rFore.quaternion.copy(resultQuat);

      if (t < Math.PI * 3) { // 🔁 1.5 оберта
        requestAnimationFrame(spin);
      } else {
        resetForeArm();
      }
    };

    spin();
  }

  // === ФІНАЛ: повернення в нейтральну позу
  function resetForeArm() {
    const steps = 40;
    let frame = 0;

    const startArm = rArm.rotation.clone();
    const startFore = rFore.rotation.clone();
    const startHand = rHand.rotation.clone();

    const neutralArm  = new THREE.Euler(0.969, 0.460, -0.219);
    const neutralFore = new THREE.Euler(0.418, 0.248, 0.082);
    const neutralHand = new THREE.Euler(0.813, -0.914, 0.901);

    const animate = () => {
      if (frame < steps) {
        rArm.rotation.x = THREE.MathUtils.lerp(startArm.x, neutralArm.x, frame / steps);
        rArm.rotation.y = THREE.MathUtils.lerp(startArm.y, neutralArm.y, frame / steps);
        rArm.rotation.z = THREE.MathUtils.lerp(startArm.z, neutralArm.z, frame / steps);

        rFore.rotation.x = THREE.MathUtils.lerp(startFore.x, neutralFore.x, frame / steps);
        rFore.rotation.y = THREE.MathUtils.lerp(startFore.y, neutralFore.y, frame / steps);
        rFore.rotation.z = THREE.MathUtils.lerp(startFore.z, neutralFore.z, frame / steps);

        rHand.rotation.x = THREE.MathUtils.lerp(startHand.x, neutralHand.x, frame / steps);
        rHand.rotation.y = THREE.MathUtils.lerp(startHand.y, neutralHand.y, frame / steps);
        rHand.rotation.z = THREE.MathUtils.lerp(startHand.z, neutralHand.z, frame / steps);

        frame++;
        requestAnimationFrame(animate);
      }
    };

    animate();
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
    avatar.traverse(obj => {
      if (obj.isBone) bones[obj.name] = obj;
    });
    console.log("🦴 Доступні кістки:");
    console.table(Object.keys(bones));
  }
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

idleMimic.js:177 📍 mixamorigRightArm → X=0.969, Y=0.460, Z=-0.219
idleMimic.js:177 📍 mixamorigRightForeArm → X=0.418, Y=0.248, Z=0.082
idleMimic.js:177 📍 mixamorigRightHand → X=0.813, Y=-0.914, Z=0.901

correct - poseControl.set('mixamorigRightArm', 0.969, 0.3236, -0.619);
poseControl.set('mixamorigRightForeArm', 1.218, 1.148, 0.082); 

*/