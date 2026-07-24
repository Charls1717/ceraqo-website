import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Fog,
  Group,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  PointLight,
  Points,
  RepeatWrapping,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * "The Opening" — the real-time WebGL bridge between the hero and the
 * story: push in on the bottle cap, unthread it, one clear droplet
 * falls onto the dark paint panel the bottle stands on, spreads into a
 * thin film where champagne micro-specks self-arrange into an even
 * ultra-thin layer, and the layer sweeps outward across the panel.
 *
 * Everything is a pure function of the scroll progress t ∈ [0,1], so
 * scrubbing backwards replays the scene exactly in reverse.
 */

/* ---------------------------------------------------------------- */
/* timeline helpers                                                  */
/* ---------------------------------------------------------------- */

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** normalized segment progress with smoothstep easing */
const seg = (t: number, a: number, b: number) => {
  const x = clamp01((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const lerp = (a: number, b: number, x: number) => a + (b - a) * x;

interface CamKey {
  t: number;
  pos: Vector3;
  look: Vector3;
  fov: number;
}

/**
 * The bottle never leaves the frame: mid shot, cap close-up, neck hold
 * while the droplet forms, follow the fall, film macro with the bottle
 * base planted in-shot, and a pulled-back end frame of bottle + coated
 * panel.
 */
const CAM_KEYS: CamKey[] = [
  { t: 0.0, pos: new Vector3(0.62, 0.92, 3.05), look: new Vector3(0.08, 0.66, 0), fov: 38 },
  { t: 0.18, pos: new Vector3(0.34, 1.34, 0.92), look: new Vector3(0, 1.2, 0), fov: 34 },
  { t: 0.42, pos: new Vector3(0.5, 1.22, 1.0), look: new Vector3(0.03, 1.04, 0), fov: 34 },
  { t: 0.53, pos: new Vector3(0.56, 1.0, 1.18), look: new Vector3(0.1, 0.94, 0), fov: 35 },
  { t: 0.64, pos: new Vector3(0.84, 0.52, 1.5), look: new Vector3(0.48, 0.08, 0.1), fov: 36 },
  { t: 0.82, pos: new Vector3(1.04, 0.6, 2.0), look: new Vector3(0.34, 0.14, 0.05), fov: 36 },
  { t: 1.0, pos: new Vector3(0.6, 0.9, 3.05), look: new Vector3(0.24, 0.34, 0), fov: 38 },
];

/* ---------------------------------------------------------------- */
/* procedural textures                                               */
/* ---------------------------------------------------------------- */

function labelTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 1024;
  const g = c.getContext('2d')!;
  g.clearRect(0, 0, 1024, 1024);
  const champagne = '#c8a878';
  const font = (px: number, weight = 400) =>
    `${weight} ${px}px 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif`;
  const tracked = (text: string, x: number, y: number, px: number, track: number, color: string, weight = 400) => {
    g.font = font(px, weight);
    g.fillStyle = color;
    let w = 0;
    for (const ch of text) w += g.measureText(ch).width + track;
    let cx = x - w / 2;
    for (const ch of text) {
      g.fillText(ch, cx, y);
      cx += g.measureText(ch).width + track;
    }
  };
  tracked('CERAQO', 512, 380, 92, 34, champagne, 500);
  g.fillStyle = 'rgba(200, 168, 120, 0.85)';
  g.fillRect(512 - 120, 440, 240, 3);
  tracked('Q-ARMOR', 512, 560, 62, 22, '#d9ddda', 400);
  tracked('defense-grade', 512, 668, 30, 6, 'rgba(217,221,218,0.72)');
  tracked('surface technology', 512, 712, 30, 6, 'rgba(217,221,218,0.72)');
  tracked('30 ml', 300, 852, 28, 4, 'rgba(200,168,120,0.8)');
  tracked('n° 001', 726, 852, 28, 4, 'rgba(200,168,120,0.8)');
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** brushed metal + knurl band + embossed batch ring, used as a bump map */
function capBumpTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#808080';
  g.fillRect(0, 0, 1024, 256);
  for (let x = 0; x < 1024; x++) {
    const v = 128 + ((Math.sin(x * 12.9898) * 43758.5453) % 14);
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.globalAlpha = 0.35;
    g.fillRect(x, 0, 1, 256);
  }
  g.globalAlpha = 1;
  for (let x = 0; x < 1024; x += 12) {
    g.fillStyle = '#5a5a5a';
    g.fillRect(x, 8, 6, 120);
    g.fillStyle = '#9a9a9a';
    g.fillRect(x + 6, 8, 6, 120);
  }
  g.font = "500 26px 'Space Grotesk', Arial, sans-serif";
  g.fillStyle = '#a8a8a8';
  g.fillText('BATCH Q-A · 2026 · N°001 · BATCH Q-A · 2026 · N°001 · ', 6, 216);
  const tex = new CanvasTexture(c);
  tex.wrapS = RepeatWrapping;
  return tex;
}

/** shallow helical thread detail for the exposed neck */
function threadBumpTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#808080';
  g.fillRect(0, 0, 256, 128);
  g.strokeStyle = '#a6a6a6';
  g.lineWidth = 4;
  for (let i = -2; i < 10; i++) {
    g.beginPath();
    g.moveTo(-20, i * 18);
    g.lineTo(276, i * 18 - 30);
    g.stroke();
  }
  const tex = new CanvasTexture(c);
  tex.wrapS = RepeatWrapping;
  return tex;
}

/** soft radial contact shadow, so nothing ever floats */
function shadowTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(128, 128, 10, 128, 128, 126);
  grad.addColorStop(0, 'rgba(0,0,0,0.62)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.32)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  return new CanvasTexture(c);
}

/* ---------------------------------------------------------------- */
/* scene                                                             */
/* ---------------------------------------------------------------- */

export interface OpeningScene {
  canvas: HTMLCanvasElement;
  setSize(w: number, h: number, dpr: number): void;
  /** evaluate the full timeline at t ∈ [0,1] */
  update(t: number): void;
  render(): void;
  dispose(): void;
}

const CORE_SPECKS = 6000;
const OUTER_SPECKS = 16000;
const CORE_R = 0.9;
const FILM_MAX_R = 4.6;
const DROP_LAND = new Vector3(0.5, 0, 0.12);
const DUSK = 0x1b1e1c;

export function createOpeningScene(canvas: HTMLCanvasElement): OpeningScene | null {
  let renderer: WebGLRenderer;
  try {
    // preserveDrawingBuffer keeps readbacks deterministic for the QA
    // suite's reversibility check; the scene renders on demand, so the
    // cost is irrelevant.
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  } catch {
    return null;
  }
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.06).texture;
  scene.environmentIntensity = 0.45;
  // the dusk studio breathes into the distance instead of ending on a
  // horizon line
  scene.fog = new Fog(DUSK, 6.5, 17);

  const camera = new PerspectiveCamera(38, 1, 0.05, 30);

  const key = new DirectionalLight(0xfff1dc, 2.1);
  key.position.set(2.4, 3.2, 2.2);
  scene.add(key);
  const rim = new PointLight(0x5ce9e4, 2.6, 9, 1.6);
  rim.position.set(-2.1, 1.5, -1.3);
  scene.add(rim);

  // -- the dark paint panel everything stands on --------------------
  const surface = new Mesh(
    new CircleGeometry(24, 64).rotateX(-Math.PI / 2),
    new MeshPhysicalMaterial({
      color: 0x0a0c0b,
      metalness: 0.2,
      roughness: 0.16,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      envMapIntensity: 0.32,
    }),
  );
  scene.add(surface);

  // -- bottle (Part A) ----------------------------------------------
  const bottle = new Group();
  scene.add(bottle);

  // straight matte wall, tight shoulder — the product silhouette
  const R = 0.21;
  const profile: Vector2[] = [
    new Vector2(0.0, 0),
    new Vector2(R * 0.92, 0.0),
    new Vector2(R, 0.05),
    new Vector2(R, 0.86),
    new Vector2(R * 0.965, 0.93),
    new Vector2(R * 0.78, 1.0),
    new Vector2(R * 0.46, 1.045),
    new Vector2(R * 0.36, 1.06),
    new Vector2(R * 0.36, 1.1),
  ];
  const bodyMat = new MeshPhysicalMaterial({
    color: 0x151817,
    metalness: 0.14,
    roughness: 0.52,
    clearcoat: 0.32,
    clearcoatRoughness: 0.34,
  });
  const body = new Mesh(new LatheGeometry(profile, 80), bodyMat);
  bottle.add(body);

  const label = new Mesh(
    new CylinderGeometry(R + 0.0025, R + 0.0025, 0.52, 64, 1, true, -0.95, 1.9),
    new MeshStandardMaterial({
      map: labelTexture(),
      transparent: true,
      metalness: 0.5,
      roughness: 0.44,
      side: DoubleSide,
    }),
  );
  label.position.y = 0.47;
  bottle.add(label);

  const collar = new Mesh(
    new TorusGeometry(R * 0.38, 0.014, 20, 64).rotateX(Math.PI / 2),
    new MeshStandardMaterial({ color: 0xc8a878, metalness: 1, roughness: 0.32 }),
  );
  collar.position.y = 1.075;
  bottle.add(collar);

  const neck = new Mesh(
    new CylinderGeometry(R * 0.34, R * 0.35, 0.1, 48),
    new MeshStandardMaterial({
      color: 0x454b4d,
      metalness: 0.85,
      roughness: 0.36,
      bumpMap: threadBumpTexture(),
      bumpScale: 0.9,
    }),
  );
  neck.position.y = 1.14;
  bottle.add(neck);

  // grounded: soft contact shadow under the base
  const shadowTex = shadowTexture();
  const bottleShadow = new Mesh(
    new CircleGeometry(0.34, 48).rotateX(-Math.PI / 2),
    new MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
  );
  bottleShadow.position.y = 0.0015;
  bottleShadow.renderOrder = 1;
  scene.add(bottleShadow);

  // -- cap ----------------------------------------------------------
  const cap = new Group();
  const capMat = new MeshStandardMaterial({
    color: 0xb6babb,
    metalness: 1,
    roughness: 0.27,
    bumpMap: capBumpTexture(),
    bumpScale: 1.6,
    envMapIntensity: 1.25,
  });
  cap.add(new Mesh(new CylinderGeometry(R * 0.44, R * 0.45, 0.24, 96), capMat));
  const capTop = new Mesh(
    new CylinderGeometry(R * 0.44, R * 0.44, 0.015, 96),
    new MeshStandardMaterial({ color: 0xc0c4c5, metalness: 1, roughness: 0.22 }),
  );
  capTop.position.y = 0.125;
  cap.add(capTop);
  const insert = new Mesh(
    new CylinderGeometry(R * 0.36, R * 0.36, 0.02, 48),
    new MeshStandardMaterial({ color: 0x1a1c1c, metalness: 0.05, roughness: 0.92 }),
  );
  insert.position.y = -0.12;
  cap.add(insert);
  const CAP_REST_Y = 1.245;
  cap.position.y = CAP_REST_Y;
  scene.add(cap);

  // -- droplet ------------------------------------------------------
  const droplet = new Mesh(
    new SphereGeometry(0.05, 48, 48),
    new MeshPhysicalMaterial({
      color: 0xf4fffe,
      transmission: 1,
      roughness: 0.03,
      ior: 1.4,
      thickness: 0.35,
      clearcoat: 1,
    }),
  );
  droplet.visible = false;
  scene.add(droplet);

  // -- film + self-arranging micro-specks ---------------------------
  const filmMat = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uRadius: { value: 0 },
      uSheen: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vPos;
      void main() {
        vPos = position.xz; // the disc lies in the XZ plane
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uRadius;
      uniform float uSheen;
      varying vec2 vPos;
      void main() {
        float r = length(vPos);
        float body = smoothstep(uRadius, uRadius - 0.14, r);
        float rim = smoothstep(uRadius, uRadius - 0.04, r) - smoothstep(uRadius - 0.04, uRadius - 0.15, r);
        vec3 base = vec3(0.55, 0.82, 0.8);
        float band = exp(-pow((vPos.x + vPos.y * 0.35) - (uSheen * 9.0 - 4.5), 2.0) * 0.55);
        vec3 col = base + vec3(0.3, 0.2, 0.06) * band;
        float a = body * (0.05 + 0.045 * band) + rim * 0.15;
        if (a < 0.004) discard;
        gl_FragColor = vec4(col, a);
      }
    `,
  });
  const film = new Mesh(new CircleGeometry(FILM_MAX_R, 96).rotateX(-Math.PI / 2), filmMat);
  film.position.set(DROP_LAND.x, 0.0035, DROP_LAND.z);
  film.renderOrder = 2;
  scene.add(film);

  // Two speck populations sharing one material: a dense core for the
  // droplet-pool macro, and a panel-wide field for the sweep. Grid
  // positions carry a little jitter so the settled layer reads as
  // material, not graph paper.
  const total = CORE_SPECKS + OUTER_SPECKS;
  const rand = new Float32Array(total * 3);
  const grid = new Float32Array(total * 2);
  const core = new Float32Array(total);
  {
    const fill = (offset: number, count: number, radius: number, isCore: number) => {
      const s = Math.sqrt((Math.PI * radius * radius) / (count * 0.866));
      let gi = 0;
      const rows = Math.ceil((radius * 2) / (s * 0.866));
      outer: for (let iy = -rows; iy <= rows; iy++) {
        for (let ix = -rows; ix <= rows; ix++) {
          const gx = (ix + (iy & 1 ? 0.5 : 0)) * s + (Math.random() - 0.5) * s * 0.34;
          const gz = iy * s * 0.866 + (Math.random() - 0.5) * s * 0.34;
          if (gx * gx + gz * gz > radius * radius) continue;
          const i = offset + gi;
          grid[i * 2] = gx;
          grid[i * 2 + 1] = gz;
          const a = Math.random() * Math.PI * 2;
          const d = Math.random() * (isCore ? 0.3 : 0.6);
          rand[i * 3] = gx + Math.cos(a) * d;
          rand[i * 3 + 1] = Math.random();
          rand[i * 3 + 2] = gz + Math.sin(a) * d;
          core[i] = isCore;
          gi++;
          if (gi >= count) break outer;
        }
      }
      return gi;
    };
    fill(0, CORE_SPECKS, CORE_R, 1);
    fill(CORE_SPECKS, OUTER_SPECKS, FILM_MAX_R, 0);
  }
  const speckGeo = new BufferGeometry();
  speckGeo.setAttribute('position', new BufferAttribute(new Float32Array(total * 3), 3));
  speckGeo.setAttribute('aRand', new BufferAttribute(rand, 3));
  speckGeo.setAttribute('aGrid', new BufferAttribute(grid, 2));
  speckGeo.setAttribute('aCore', new BufferAttribute(core, 1));
  const speckMat = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uRadius: { value: 0 },
      uSettle: { value: 0 },
      uTwinkle: { value: 0 },
      uCoreFade: { value: 0 },
      uPx: { value: 2.0 },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aRand;
      attribute vec2 aGrid;
      attribute float aCore;
      uniform float uRadius;
      uniform float uSettle;
      uniform float uTwinkle;
      uniform float uCoreFade;
      uniform float uPx;
      varying float vA;
      void main() {
        float stag = aRand.y;
        float s = clamp(uSettle * 1.7 - stag * 0.7, 0.0, 1.0);
        s = s * s * (3.0 - 2.0 * s);
        vec2 p = mix(aRand.xz, aGrid, s);
        float r = length(p);
        float inside = smoothstep(uRadius, uRadius - 0.2, r);
        float tw = 0.4 + 0.6 * sin(stag * 61.7 + uTwinkle * 6.0 + r * 5.0);
        // the dense core carries the macro moment, then yields to the
        // panel-wide field so the settled layer stays even
        float pop = mix(1.0, 1.0 - uCoreFade * 0.72, aCore);
        vA = inside * mix(tw, 0.85, s * 0.55) * pop;
        vec4 mv = modelViewMatrix * vec4(p.x, 0.006, p.y, 1.0);
        gl_PointSize = uPx * (0.9 + 0.8 * fract(stag * 7.31)) * (1.6 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vA;
      void main() {
        vec2 q = gl_PointCoord - 0.5;
        float m = smoothstep(0.5, 0.12, length(q));
        float a = vA * m;
        if (a < 0.01) discard;
        gl_FragColor = vec4(vec3(0.83, 0.66, 0.4) * (0.7 + 0.5 * m), a * 0.7);
      }
    `,
  });
  const specks = new Points(speckGeo, speckMat);
  specks.position.copy(film.position);
  specks.renderOrder = 3;
  specks.frustumCulled = false;
  scene.add(specks);

  // ----------------------------------------------------------------
  const camPos = new Vector3();
  const camLook = new Vector3();

  const update = (t: number) => {
    let k = 0;
    while (k < CAM_KEYS.length - 2 && t > CAM_KEYS[k + 1].t) k++;
    const a = CAM_KEYS[k];
    const b = CAM_KEYS[k + 1];
    const x = seg(t, a.t, b.t);
    camPos.lerpVectors(a.pos, b.pos, x);
    camLook.lerpVectors(a.look, b.look, x);
    camera.position.copy(camPos);
    camera.lookAt(camLook);
    camera.fov = lerp(a.fov, b.fov, x);
    camera.updateProjectionMatrix();

    // cap unthreads (2.5 turns), lifts, drifts aside
    const unthread = seg(t, 0.18, 0.4);
    const drift = seg(t, 0.4, 0.72);
    cap.rotation.y = -unthread * Math.PI * 5;
    cap.position.y = CAP_REST_Y + Math.pow(unthread, 1.5) * 0.34 + drift * 0.5;
    cap.position.x = unthread * 0.1 + drift * 0.42;
    cap.position.z = -drift * 0.18;
    cap.rotation.z = unthread * 0.1 + drift * 0.35;

    // droplet: forms at the lip while the camera holds the neck,
    // falls, lands
    const form = seg(t, 0.44, 0.53);
    const fall = seg(t, 0.54, 0.6);
    const splash = seg(t, 0.6, 0.64);
    droplet.visible = t > 0.44 && splash < 1;
    if (droplet.visible) {
      droplet.position.set(
        lerp(0.075, DROP_LAND.x, fall),
        lerp(1.13, 0.045, fall * fall),
        lerp(0, DROP_LAND.z, fall),
      );
      const stretch = 1 + form * 0.25 - fall * 0.2;
      const size = form * (1 - splash);
      droplet.scale.set(size / stretch, size * stretch, size / stretch);
    }

    // film: droplet-sized pool, then the panel-wide sweep
    const pool = seg(t, 0.6, 0.8);
    const sweep = seg(t, 0.8, 1.0);
    const radius = pool * 0.62 + sweep * (FILM_MAX_R - 0.62);
    filmMat.uniforms.uRadius.value = radius;
    filmMat.uniforms.uSheen.value = sweep;
    speckMat.uniforms.uRadius.value = radius;
    speckMat.uniforms.uSettle.value = seg(t, 0.66, 0.94);
    speckMat.uniforms.uTwinkle.value = t;
    speckMat.uniforms.uCoreFade.value = sweep;
  };

  const setSize = (w: number, h: number, dpr: number) => {
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    speckMat.uniforms.uPx.value = 2.0 * dpr * (h / 720);
  };

  return {
    canvas,
    setSize,
    update,
    render: () => renderer.render(scene, camera),
    dispose: () => {
      pmrem.dispose();
      renderer.dispose();
      scene.traverse((o) => {
        const m = o as Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material as MeshStandardMaterial | undefined;
        if (mat) {
          mat.map?.dispose();
          (mat as MeshStandardMaterial).bumpMap?.dispose();
          mat.dispose();
        }
      });
    },
  };
}
