export function resetRightHandPose(avatar) {
  const bones = {
    hand: avatar.getObjectByName('mixamorigRightHand'),
    t1: avatar.getObjectByName('mixamorigRightHandThumb1'),
    t2: avatar.getObjectByName('mixamorigRightHandThumb2'),
    i1: avatar.getObjectByName('mixamorigRightHandIndex1'),
    m1: avatar.getObjectByName('mixamorigRightHandMiddle1'),
    r1: avatar.getObjectByName('mixamorigRightHandRing1'),
    p1: avatar.getObjectByName('mixamorigRightHandPinky1'),
  };

  const angles = {
    hand: [0.813, -0.914, 0.901],
    t1: [0.014, 0.002, -0.771],
    t2: [-0.125, -0.159, 0.193],
    i1: [-0.080, -0.011, 0.080],
    m1: [-0.035, -0.005, 0.140],
    r1: [0.215, 0.030, 0.169],
    p1: [0.116, 0.016, 0.226],
  };

  for (const key in bones) {
    if (bones[key]) {
      const [x, y, z] = angles[key];
      bones[key].rotation.set(x, y, z);
    }
  }
}