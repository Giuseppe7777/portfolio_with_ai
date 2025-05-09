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

  // 🔹 Міміка — усмішка та м’який погляд
  if (faceMesh && faceMesh.morphTargetDictionary) {
    const dict = faceMesh.morphTargetDictionary;
    const infl = faceMesh.morphTargetInfluences;

    const smileR = dict['A39_Mouth_Smile_Right'];
    const smileL = dict['A38_Mouth_Smile_Left'];
    const eyeWideR = dict['A19_Eye_Wide_Right'];
    const eyeWideL = dict['A18_Eye_Wide_Left'];
    const squintR = dict['A17_Eye_Squint_Right'];
    const squintL = dict['A16_Eye_Squint_Left'];

    infl[eyeWideR] = 0;
    infl[eyeWideL] = 0;
    infl[squintR] = 0.15;
    infl[squintL] = 0.15;

    let smileValue = 0;
    const smileInterval = setInterval(() => {
      smileValue += 0.05;
      infl[smileR] = smileValue;
      infl[smileL] = smileValue;
      if (smileValue >= 1) clearInterval(smileInterval);
    }, 50);
  }

  // 🔹 Цільова позиція, щоб підплив до кадру (якщо треба)
  const targetPosition = new THREE.Vector3(-0.15, 0.2, 0.36);
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
