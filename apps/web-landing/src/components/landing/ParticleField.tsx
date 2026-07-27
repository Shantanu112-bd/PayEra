"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

/*
  Ambient particle field for the landing background.

  • Points span the brand ramp: blue (#2563EB) → indigo (#6366F1) → violet (#7C3AED).
  • Slow drift + gentle mouse parallax; bloom for the filmic glow.
  • Fully disposed on unmount; pauses when the tab is hidden; flattens to a
    static frame under prefers-reduced-motion.

  Rendered only on the client (see dynamic import with ssr:false in the page).
*/

const BLUE = new THREE.Color("#2563eb");
const INDIGO = new THREE.Color("#6366f1");
const VIOLET = new THREE.Color("#7c3aed");

export default function ParticleField() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.z = 14;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ---- Particles ----
    const COUNT = 1400;
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const tmp = new THREE.Color();

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      // Distribute in a soft ellipsoid volume.
      const r = Math.pow(Math.random(), 0.6) * 16;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i3] = r * Math.sin(phi) * Math.cos(theta) * 1.4;
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.9;
      positions[i3 + 2] = r * Math.cos(phi) * 0.7;

      // Color ramp by depth: blue → indigo → violet.
      const t = ((positions[i3 + 2] ?? 0) + 12) / 24;
      if (t < 0.5) tmp.lerpColors(BLUE, INDIGO, t * 2);
      else tmp.lerpColors(INDIGO, VIOLET, (t - 0.5) * 2);
      colors[i3] = tmp.r;
      colors[i3 + 1] = tmp.g;
      colors[i3 + 2] = tmp.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // ---- Bloom ----
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.85, // strength
      0.7, // radius
      0.2 // threshold
    );
    composer.addPass(bloom);
    composer.setSize(width, height);

    // ---- Interaction ----
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: MouseEvent) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 0.6;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 0.6;
    };
    window.addEventListener("mousemove", onMove);

    // ---- Loop ----
    let raf = 0;
    let running = true;
    const clock = new THREE.Clock();

    const render = () => {
      const t = clock.getElapsedTime();
      points.rotation.y = t * 0.04;
      points.rotation.x = Math.sin(t * 0.12) * 0.06;
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      camera.position.x = mouse.x * 3;
      camera.position.y = -mouse.y * 2;
      camera.lookAt(scene.position);
      composer.render();
    };

    const loop = () => {
      if (!running) return;
      render();
      raf = requestAnimationFrame(loop);
    };

    if (reduce) {
      render(); // single static frame
    } else {
      loop();
    }

    // ---- Resize ----
    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // Pause when tab hidden (saves battery, avoids runaway rAF).
    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        if (raf) cancelAnimationFrame(raf);
      } else if (!reduce && !running) {
        running = true;
        loop();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // ---- Cleanup ----
    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      geometry.dispose();
      material.dispose();
      bloom.dispose();
      composer.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="fixed inset-0 -z-10 h-screen w-screen"
    />
  );
}
