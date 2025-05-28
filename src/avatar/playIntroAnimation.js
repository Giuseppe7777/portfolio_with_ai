// src/avatar/playIntroAnimation.js
import * as THREE from 'three';

/**
 * Відтворює анімацію WalkAndWave та міміку усмішки
 * @param {THREE.AnimationMixer} mixer
 * @param {THREE.Group} avatar
 * @param {THREE.Mesh} faceMesh - меш з shape keys (наприклад, Body_1)
 */
export function playIntroAnimation(mixer, avatar, faceMesh) {
  // 🔹 Запускаємо анімацію з fadeIn
  const action = mixer._actions[0];
  action.paused = false;
  action.fadeIn(0.001);

    // 🔹 Міміка — усмішка (плавно) + решта фіксовано
  if (faceMesh && faceMesh.morphTargetDictionary) {
    const dict = faceMesh.morphTargetDictionary;
    const infl = faceMesh.morphTargetInfluences;

    const set = (name, val) => {
      const index = dict[name];
      if (index !== undefined) infl[index] = val;
      else console.warn(`❌ Shape key ${name} не знайдено`);
    };

    // 🧊 Намертво зафіксовані значення
    set('A42_Mouth_Dimple_Left',    0.55);
    set('A43_Mouth_Dimple_Right',   0.55);
    set('A16_Eye_Squint_Left',      1.00);
    set('A17_Eye_Squint_Right',     1.00);
    set('A08_Eye_Look_Down_Left',   1.00);
    set('A09_Eye_Look_Down_Right',  1.00);
    set('A04_Brow_Outer_Up_Left',   0.17);
    set('A05_Brow_Outer_Up_Right',  0.17);
    set('A02_Brow_Down_Left',       0.31);
    set('A03_Brow_Down_Right',      0.31);

    // 😊 Усмішка з fade-in: з 0.57 до 1.0
    const smileL = dict['A38_Mouth_Smile_Left'];
    const smileR = dict['A39_Mouth_Smile_Right'];
    let smileValue = 0.45;

    if (smileL !== undefined && smileR !== undefined) {
      const smileInterval = setInterval(() => {
        smileValue += 0.02;
        infl[smileL] = smileValue;
        infl[smileR] = smileValue;
        if (smileValue >= 0.70) clearInterval(smileInterval);
      }, 50);
    }
  }

  // 🔹 Цільова позиція, щоб підплив до кадру (якщо треба)
  const targetPosition = new THREE.Vector3(0, 0.2, 0);
  const clock = new THREE.Clock();
  let stopped = false;

  function animate() {
    if (!stopped) {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      mixer.update(delta);
      avatar.position.lerp(targetPosition, 0.03);
    }
  }

  animate();

  // 🔁 Через 4.6 сек — стоп анімації + фіксація пози
    setTimeout(() => {
    // 🧠 Зберігаємо фактичну позу
    const lArmRot  = avatar.getObjectByName('mixamorigLeftArm')?.rotation.clone();
    const lForeRot = avatar.getObjectByName('mixamorigLeftForeArm')?.rotation.clone();
    const lHandRot = avatar.getObjectByName('mixamorigLeftHand')?.rotation.clone();
    const headRot  = avatar.getObjectByName('mixamorigHead')?.rotation.clone();

    const rArmRot  = new THREE.Euler(0.969, 0.460, -0.219);
    const rForeRot = new THREE.Euler(0.418, 0.248,  0.082);
    const rHandRot = new THREE.Euler(0.813, -0.914, 0.901);

    mixer.stopAllAction();
    stopped = true;

    avatar.getObjectByName('mixamorigLeftArm')?.rotation.copy(lArmRot);
    avatar.getObjectByName('mixamorigLeftForeArm')?.rotation.copy(lForeRot);
    avatar.getObjectByName('mixamorigLeftHand')?.rotation.copy(lHandRot);
    avatar.getObjectByName('mixamorigHead')?.rotation.copy(headRot);

    avatar.getObjectByName('mixamorigRightArm')?.rotation.copy(rArmRot);
    avatar.getObjectByName('mixamorigRightForeArm')?.rotation.copy(rForeRot);
    avatar.getObjectByName('mixamorigRightHand')?.rotation.copy(rHandRot);

    avatar.updateMatrixWorld(true);
  }, 4600);

}
