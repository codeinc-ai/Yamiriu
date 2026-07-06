// Generates simple capsule-mannequin placeholder avatars for the outfit
// builder (public/models/avatars/{men,women,kids}.glb) until the founders'
// 3D artist delivers real rigged models — see 3D-ASSET-SPEC.md for the
// contract those real deliverables must follow.
//
// Run with: node scripts/generate-placeholder-avatars.mjs
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// GLTFExporter's binary (.glb) path uses the browser FileReader API to read
// the packed Blob back into an ArrayBuffer — polyfill the one method/event
// it actually calls so this can run under plain Node.
if (typeof globalThis.FileReader === "undefined") {
  globalThis.FileReader = class FileReader {
    readAsArrayBuffer(blob) {
      blob
        .arrayBuffer()
        .then((buffer) => {
          this.result = buffer;
          this.onloadend?.();
        })
        .catch((error) => this.onerror?.(error));
    }
  };
}

const OUT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../public/models/avatars"
);

const MANNEQUIN_COLOR = 0xe8ded0;

function buildMannequin({
  headRadius,
  shoulderWidth,
  torsoLength,
  armLength,
  armRadius,
  legLength,
  legRadius,
  hipWidth,
}) {
  const group = new THREE.Group();
  group.name = "Avatar";

  const material = new THREE.MeshStandardMaterial({
    color: MANNEQUIN_COLOR,
    roughness: 0.6,
    metalness: 0.05,
  });

  const legGeo = new THREE.CapsuleGeometry(legRadius, legLength - legRadius * 2, 4, 8);
  const leftLeg = new THREE.Mesh(legGeo, material);
  leftLeg.name = "LeftLeg";
  leftLeg.position.set(-hipWidth / 2, legLength / 2, 0);
  leftLeg.castShadow = true;
  leftLeg.receiveShadow = true;
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, material);
  rightLeg.name = "RightLeg";
  rightLeg.position.set(hipWidth / 2, legLength / 2, 0);
  rightLeg.castShadow = true;
  rightLeg.receiveShadow = true;
  group.add(rightLeg);

  const torsoGeo = new THREE.CapsuleGeometry(shoulderWidth / 2, torsoLength - shoulderWidth, 4, 8);
  const torso = new THREE.Mesh(torsoGeo, material);
  torso.name = "Torso";
  const torsoY = legLength + torsoLength / 2;
  torso.position.set(0, torsoY, 0);
  torso.castShadow = true;
  torso.receiveShadow = true;
  group.add(torso);

  const armGeo = new THREE.CapsuleGeometry(armRadius, armLength - armRadius * 2, 4, 8);
  const armY = torsoY + torsoLength / 2 - armLength / 2;
  const leftArm = new THREE.Mesh(armGeo, material);
  leftArm.name = "LeftArm";
  leftArm.position.set(-(shoulderWidth / 2 + armRadius), armY, 0);
  leftArm.castShadow = true;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, material);
  rightArm.name = "RightArm";
  rightArm.position.set(shoulderWidth / 2 + armRadius, armY, 0);
  rightArm.castShadow = true;
  group.add(rightArm);

  const headGeo = new THREE.SphereGeometry(headRadius, 16, 12);
  const head = new THREE.Mesh(headGeo, material);
  head.name = "Head";
  head.position.set(0, legLength + torsoLength + headRadius, 0);
  head.castShadow = true;
  group.add(head);

  return group;
}

const AVATARS = {
  men: buildMannequin({
    headRadius: 0.13,
    shoulderWidth: 0.46,
    torsoLength: 0.62,
    armLength: 0.62,
    armRadius: 0.06,
    legLength: 0.95,
    legRadius: 0.09,
    hipWidth: 0.26,
  }),
  women: buildMannequin({
    headRadius: 0.12,
    shoulderWidth: 0.4,
    torsoLength: 0.58,
    armLength: 0.58,
    armRadius: 0.05,
    legLength: 0.9,
    legRadius: 0.08,
    hipWidth: 0.28,
  }),
  kids: buildMannequin({
    headRadius: 0.11,
    shoulderWidth: 0.26,
    torsoLength: 0.36,
    armLength: 0.36,
    armRadius: 0.04,
    legLength: 0.5,
    legRadius: 0.055,
    hipWidth: 0.18,
  }),
};

const exporter = new GLTFExporter();

async function exportGlb(name, object3d) {
  const arrayBuffer = await new Promise((resolve, reject) => {
    exporter.parse(object3d, resolve, reject, { binary: true });
  });
  await fs.mkdir(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, `${name}.glb`);
  await fs.writeFile(outPath, Buffer.from(arrayBuffer));
  console.log(`Wrote ${path.relative(process.cwd(), outPath)}`);
}

for (const [name, object3d] of Object.entries(AVATARS)) {
  await exportGlb(name, object3d);
}
