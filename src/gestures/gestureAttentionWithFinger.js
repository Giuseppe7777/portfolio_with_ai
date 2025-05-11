// src/gestures/gestureAttentionWithFinger.js
import * as THREE from 'three';

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
        wagHandZ(() => resetToNeutral());
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

  function resetToNeutral() {
    const steps = 30;
    let frame = 0;

    const neutralArm = new THREE.Euler(0.969, 0.460, -0.219);
    const neutralFore = new THREE.Euler(0.418, 0.248, 0.082);
    const neutralHand = new THREE.Euler(0.813, -0.914, 0.901);

    const fromArm = rArm.rotation.clone();
    const fromFore = rFore.rotation.clone();
    const fromHand = rHand.rotation.clone();

    function animate() {
      if (frame <= steps) {
        const alpha = frame / steps;

        rArm.rotation.x = THREE.MathUtils.lerp(fromArm.x, neutralArm.x, alpha);
        rArm.rotation.y = THREE.MathUtils.lerp(fromArm.y, neutralArm.y, alpha);
        rArm.rotation.z = THREE.MathUtils.lerp(fromArm.z, neutralArm.z, alpha);

        rFore.rotation.x = THREE.MathUtils.lerp(fromFore.x, neutralFore.x, alpha);
        rFore.rotation.y = THREE.MathUtils.lerp(fromFore.y, neutralFore.y, alpha);
        rFore.rotation.z = THREE.MathUtils.lerp(fromFore.z, neutralFore.z, alpha);

        rHand.rotation.x = THREE.MathUtils.lerp(fromHand.x, neutralHand.x, alpha);
        rHand.rotation.y = THREE.MathUtils.lerp(fromHand.y, neutralHand.y, alpha);
        rHand.rotation.z = THREE.MathUtils.lerp(fromHand.z, neutralHand.z, alpha);

        frame++;
        requestAnimationFrame(animate);
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


  /*

  poseControl.set('mixamorigRightArm',       0.500, 0.800, -0.400); 
poseControl.set('mixamorigRightForeArm',   1.200, 1.100,  0.000); 
poseControl.set('mixamorigRightHand',      0.400, 0.000,  0.300); 

poseControl.set('mixamorigRightHandThumb1',  -0.500, 0.400, -0.300); 
poseControl.set('mixamorigRightHandThumb2',   0.200, -0.100, 0.200); 

poseControl.set('mixamorigRightHandIndex1',   0.100, 0.000, 0.100); 
poseControl.set('mixamorigRightHandMiddle1', -1.000, 0.000, 0.400); 
poseControl.set('mixamorigRightHandRing1',   -1.000, 0.000, 0.300); 
poseControl.set('mixamorigRightHandPinky1',  -1.000, 0.000, 0.200); 

  =============================================================

  [
  'mixamorigRightArm',
  'mixamorigRightForeArm',
  'mixamorigRightHand',
  'mixamorigRightHandThumb1',
  'mixamorigRightHandThumb2',
  'mixamorigRightHandIndex1',
  'mixamorigRightHandMiddle1',
  'mixamorigRightHandRing1',
  'mixamorigRightHandPinky1',
].forEach(name => {
  const bone = avatar.getObjectByName(name);
  if (!bone) {
    console.warn(`❌ ${name} not found`);
    return;
  }
  const r = bone.rotation;
  console.log(`📍 ${name} → X=${r.x.toFixed(3)}, Y=${r.y.toFixed(3)}, Z=${r.z.toFixed(3)}`);
});

========================================================================

poseControl.set('mixamorigRightArm',       0, 0, 0); // плечова частина
poseControl.set('mixamorigRightForeArm',   0, 0, 0); // передпліччя
poseControl.set('mixamorigRightHand',      0, 0, 0); // кисть

poseControl.set('mixamorigRightHandThumb1',   0, 0, 0); // великий палець 1
poseControl.set('mixamorigRightHandThumb2',   0, 0, 0); // великий палець 2

poseControl.set('mixamorigRightHandIndex1',   0, 0, 0); // вказівний
poseControl.set('mixamorigRightHandMiddle1',  0, 0, 0); // середній
poseControl.set('mixamorigRightHandRing1',    0, 0, 0); // безіменний
poseControl.set('mixamorigRightHandPinky1',   0, 0, 0); // мізинець

===================================================

poseControl.set('mixamorigRightArm',       1.100, 0.800, -0.100); 


poseControl.set('mixamorigRightArm',        1.524, 0.789, 0.338);   
poseControl.set('mixamorigRightForeArm',    1.544, 1.291, -0.171);  
poseControl.set('mixamorigRightHand',       1.012, -0.977, -0.855); 

poseControl.set('mixamorigRightHandThumb1', 0.209, -0.140, 0.436);  
poseControl.set('mixamorigRightHandThumb2', 0.000, 0.000, 0.227);   

poseControl.set('mixamorigRightHandIndex1',   1.523, 0.789, 0.338); 


poseControl.set('mixamorigRightHandMiddle1',  1.012, -0.977, -0.855);
poseControl.set('mixamorigRightHandMiddle2',  0.209, -0.140, 0.052);
poseControl.set('mixamorigRightHandMiddle3',  0.000, 0.000, 0.611);

poseControl.set('mixamorigRightHandRing1',   -0.052, 0.105, -0.052);
poseControl.set('mixamorigRightHandRing2',    1.221, -0.454, 1.605);
poseControl.set('mixamorigRightHandRing3',   -0.105, -0.646, 0.052);

poseControl.set('mixamorigRightHandPinky1',   2.321, 0.000, 0.017);
poseControl.set('mixamorigRightHandPinky2',   0.000, 0.000, 0.611);

  */
