import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Small ornamental map instrument; real geographic positions are rendered by LiveMap.
export function GeoCompass({ reduced = false }: { reduced?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
    } catch {
      setFallback(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(112, 112);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 30);
    camera.position.set(0, 1.1, 5.5);
    camera.lookAt(0, 0, 0);
    const ambient = new THREE.HemisphereLight(0xffe4ca, 0x6b8291, 3);
    scene.add(ambient);
    const accent = new THREE.DirectionalLight(0xffffff, 2.5);
    accent.position.set(-2, 4, 6);
    scene.add(accent);
    const model = new THREE.Group();
    scene.add(model);
    const copper = new THREE.MeshStandardMaterial({
      color: 0xeb6545,
      metalness: 0.28,
      roughness: 0.3,
    });
    const pale = new THREE.MeshStandardMaterial({
      color: 0xf4c396,
      metalness: 0.25,
      roughness: 0.45,
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.045, 10, 96), copper);
    ring.rotation.x = Math.PI / 3.2;
    model.add(ring);
    const inner = new THREE.Mesh(new THREE.TorusGeometry(0.83, 0.027, 10, 80), pale);
    inner.rotation.y = Math.PI / 3.1;
    model.add(inner);
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.44), copper);
    crystal.scale.y = 1.45;
    model.add(crystal);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 18, 12), pale);
    dot.position.set(0, 1.47, 0);
    model.add(dot);
    let raf = 0;
    let active = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        active = entry.isIntersecting;
      },
      { threshold: 0.02 },
    );
    observer.observe(el);
    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!active || document.hidden) return;
      if (!reduced) {
        model.rotation.y += 0.005;
        crystal.rotation.z += 0.002;
      }
      renderer.render(scene, camera);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      ring.geometry.dispose();
      inner.geometry.dispose();
      crystal.geometry.dispose();
      dot.geometry.dispose();
      copper.dispose();
      pale.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [reduced]);

  return (
    <div ref={host} className="geo-compass" aria-hidden="true">
      {fallback && <span className="geo-compass-fallback" />}
    </div>
  );
}
