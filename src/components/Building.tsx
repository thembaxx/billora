import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ArrowsClockwiseIcon, CubeIcon } from '@phosphor-icons/react';

export default function Building({
  reduced = false,
  small = false,
}: {
  reduced?: boolean;
  small?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const reset = useRef<() => void>(() => {});
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'low-power',
      });
    } catch {
      setFailed(true);
      return;
    }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(7.4, 5.7, 8.5);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.45;
    el.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.45, 0);
    controls.enableDamping = true;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.minPolarAngle = 0.45;
    controls.maxPolarAngle = 1.5;
    controls.autoRotate = !reduced;
    controls.autoRotateSpeed = 0.45;
    controls.update();
    const ambient = new THREE.HemisphereLight(0xfff7ee, 0x9aa5ab, 3);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffe6ce, 4);
    sun.position.set(-3, 8, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -5;
    sun.shadow.camera.right = 5;
    sun.shadow.camera.top = 6;
    sun.shadow.camera.bottom = -5;
    sun.shadow.bias = -0.001;
    scene.add(sun);
    const edgeLight = new THREE.DirectionalLight(0xffffff, 3);
    edgeLight.position.set(3, 2, -5);
    scene.add(edgeLight);
    const model = new THREE.Group();
    scene.add(model);
    const mats = {
      slab: new THREE.MeshStandardMaterial({ color: '#e8e4db', roughness: 0.7 }),
      frame: new THREE.MeshStandardMaterial({ color: '#303d42', roughness: 0.55, metalness: 0.2 }),
      timber: new THREE.MeshStandardMaterial({ color: '#c68755', roughness: 0.7 }),
      glass: new THREE.MeshPhysicalMaterial({
        color: '#9cbbb9',
        metalness: 0.3,
        roughness: 0.16,
        transparent: true,
        opacity: 0.62,
      }),
      window: new THREE.MeshStandardMaterial({
        color: '#e6b27d',
        emissive: '#d68c43',
        emissiveIntensity: 0.25,
        roughness: 0.45,
      }),
      pot: new THREE.MeshStandardMaterial({ color: '#e9d5b9', roughness: 0.9 }),
      leaf: new THREE.MeshStandardMaterial({ color: '#486c39', roughness: 1 }),
    };
    const box = (
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      material: THREE.Material,
    ) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      model.add(m);
      return m;
    };
    box(3.9, 0.12, 3.1, 0, -0.04, 0, mats.slab);
    for (let f = 0; f < 4; f++) {
      const y = 0.12 + f * 0.83;
      box(3.35, 0.12, 2.55, 0, y, 0, mats.slab);
      box(2.9, 0.72, 1.8, 0, y + 0.4, -0.1, mats.timber);
      box(2.8, 0.59, 0.04, 0, y + 0.39, 0.82, mats.window);
      box(2.8, 0.59, 0.035, 0, y + 0.39, 0.86, mats.glass);
      box(0.035, 0.59, 1.75, 1.46, y + 0.39, -0.1, mats.glass);
      for (const x of [-1.5, -0.52, 0.52, 1.5])
        box(0.055, 0.76, 0.085, x, y + 0.42, 0.9, mats.frame);
      for (const z of [-1, -0.3, 0.4]) box(0.07, 0.76, 0.045, 1.5, y + 0.42, z, mats.frame);
      box(3.35, 0.07, 0.12, 0, y + 0.77, 0.91, mats.frame);
      box(3.3, 0.04, 0.05, 0, y + 0.38, 1.19, mats.frame);
      box(3.28, 0.32, 0.025, 0, y + 0.2, 1.19, mats.glass);
      box(0.035, 0.32, 2.3, 1.65, y + 0.2, 0, mats.glass);
      for (const x of [-1.62, 1.62]) box(0.035, 0.4, 0.04, x, y + 0.2, 1.19, mats.frame);
      if (f < 3)
        for (const x of [-1.18, 0.92]) {
          const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.085, 0.18, 12), mats.pot);
          pot.position.set(x, y + 0.15, 1.02);
          model.add(pot);
          const plant = new THREE.Mesh(new THREE.IcosahedronGeometry(0.17, 1), mats.leaf);
          plant.scale.y = 1.6;
          plant.position.set(x, y + 0.4, 1.02);
          model.add(plant);
        }
    }
    box(3.6, 0.15, 2.8, 0, 3.46, 0, mats.frame);
    box(0.13, 3.5, 2.54, -1.48, 1.73, -0.02, mats.frame);
    box(0.1, 3.5, 0.1, 1.48, 1.73, -1.15, mats.frame);
    // Solar panels and a small rooftop garden give the model a recognisable home scale.
    for (let i = 0; i < 3; i++) {
      const p = box(0.7, 0.04, 1, -0.85 + i * 0.83, 3.58, -0.2, mats.frame);
      p.rotation.x = -0.15;
    }
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(4, 64),
      new THREE.ShadowMaterial({ opacity: 0.17 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.12;
    ground.receiveShadow = true;
    scene.add(ground);
    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();
    renderer.render(scene, camera);
    let visible = true,
      frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(el);
    const render = () => {
      frame = requestAnimationFrame(render);
      if (visible && !document.hidden) {
        controls.update();
        renderer.render(scene, camera);
      }
    };
    render();
    reset.current = () => {
      camera.position.set(7.4, 5.7, 8.5);
      controls.target.set(0, 1.45, 0);
      controls.update();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        model.rotation.y += event.key === 'ArrowLeft' ? -0.2 : 0.2;
      }
    };
    el.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      observer.disconnect();
      controls.dispose();
      el.removeEventListener('keydown', onKey);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const a = Array.isArray(o.material) ? o.material : [o.material];
          a.forEach((m) => m.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [reduced]);
  return (
    <div className={`building-wrap ${small ? 'small' : ''}`}>
      {failed ? (
        <div className="building-fallback">
          <CubeIcon size={80} weight="duotone" />
          <p>A new perspective on home.</p>
        </div>
      ) : (
        <div
          ref={host}
          className="building-canvas"
          role="img"
          aria-label="Interactive 3D apartment building. Drag or use left and right arrow keys to rotate."
          tabIndex={0}
        />
      )}
      {!small && (
        <>
          <span className="model-hint">
            <CubeIcon size={14} /> {reduced ? 'Drag to explore' : 'A fresh perspective'}
          </span>
          <button
            className="model-reset"
            aria-label="Reset 3D view"
            onClick={() => reset.current()}
          >
            <ArrowsClockwiseIcon size={18} />
          </button>
        </>
      )}
    </div>
  );
}
