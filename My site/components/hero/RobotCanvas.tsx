"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function RobotCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasPointer = window.matchMedia("(pointer:fine)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0.4, 7.2);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);

    const clampDPR = () => Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setPixelRatio(clampDPR());
      renderer.setSize(w, h, false);
      camera.aspect = w / h || 1;
      camera.updateProjectionMatrix();
    };

    /* Lighting */
    scene.add(new THREE.AmbientLight(0x6a7290, 0.7));
    const fill = new THREE.DirectionalLight(0x9fc0ff, 1.0);
    fill.position.set(2, 3, 4);
    scene.add(fill);
    const key = new THREE.DirectionalLight(0xfff0e0, 0.9);
    key.position.set(3, 2, 3);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xec4899, 2.2);
    rim.position.set(-2, 1, -4);
    scene.add(rim);
    const rim2 = new THREE.PointLight(0x8b5cf6, 2.0, 20);
    rim2.position.set(-3, 2, 2);
    scene.add(rim2);
    const cyan = new THREE.PointLight(0x06b6d4, 1.5, 20);
    cyan.position.set(3, -1, 2);
    scene.add(cyan);

    /* Materials */
    const shellMat = new THREE.MeshStandardMaterial({ color: 0x20222f, metalness: 0.82, roughness: 0.32 });
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x2e3146, metalness: 0.88, roughness: 0.26 });
    const screenMat = new THREE.MeshStandardMaterial({ color: 0x07070e, metalness: 0.4, roughness: 0.08 });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x22d3ee, emissiveIntensity: 2.6, metalness: 0, roughness: 0.3 });
    const violetMat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, emissive: 0x8b5cf6, emissiveIntensity: 1.5, metalness: 0.3, roughness: 0.4 });

    /* Groups: root (float) > bodyGroup (slow tilt) > headGroup (fast track) */
    const root = new THREE.Group();
    const bodyGroup = new THREE.Group();
    const headGroup = new THREE.Group();
    scene.add(root);
    root.add(bodyGroup);
    bodyGroup.add(headGroup);
    const grippers: THREE.Group[] = [];

    /* Body — smooth rounded torso */
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.62, 40, 40), shellMat);
    body.position.y = -0.55;
    body.scale.set(0.95, 1.1, 0.82);
    bodyGroup.add(body);

    const chestPlate = new THREE.Mesh(new THREE.SphereGeometry(0.34, 32, 32), screenMat);
    chestPlate.position.set(0, -0.5, 0.4);
    chestPlate.scale.set(1, 1.1, 0.4);
    bodyGroup.add(chestPlate);

    const core = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.035, 16, 36), eyeMat);
    core.position.set(0, -0.5, 0.56);
    bodyGroup.add(core);

    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.02, 12, 60), violetMat);
    belt.position.set(0, -0.2, 0);
    belt.rotation.x = Math.PI / 2;
    belt.scale.set(1, 0.82, 1);
    bodyGroup.add(belt);

    // Jointed two-segment arms: shoulder → upper arm → elbow → forearm → hand.
    const connectLimb = (
      p0: THREE.Vector3,
      p1: THREE.Vector3,
      rTop: number,
      rBot: number,
      mat: THREE.Material
    ) => {
      const v = new THREE.Vector3().subVectors(p1, p0);
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, v.length(), 18), mat);
      seg.position.copy(p0).add(p1).multiplyScalar(0.5);
      seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize());
      return seg;
    };
    [-1, 1].forEach((s) => {
      const shoulder = new THREE.Vector3(0.58 * s, -0.3, 0.02);
      const elbow = new THREE.Vector3(0.8 * s, -0.74, 0.04);
      const wrist = new THREE.Vector3(0.6 * s, -1.06, 0.2);

      const shBall = new THREE.Mesh(new THREE.SphereGeometry(0.17, 28, 28), panelMat);
      shBall.position.copy(shoulder);
      bodyGroup.add(shBall);

      bodyGroup.add(connectLimb(shoulder, elbow, 0.095, 0.085, shellMat));

      const elBall = new THREE.Mesh(new THREE.SphereGeometry(0.1, 22, 22), panelMat);
      elBall.position.copy(elbow);
      bodyGroup.add(elBall);

      bodyGroup.add(connectLimb(elbow, wrist, 0.08, 0.07, shellMat));

      // LEGO-style claw: two curved jaws (half-tori) forming a pincer
      const gripper = new THREE.Group();
      const knuckle = new THREE.Mesh(new THREE.SphereGeometry(0.07, 20, 20), panelMat);
      gripper.add(knuckle);
      const wristCap = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.07, 18), shellMat);
      wristCap.position.y = -0.04;
      gripper.add(wristCap);
      [-1, 1].forEach((d) => {
        const jaw = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.034, 14, 22, Math.PI), shellMat);
        jaw.position.set(d * 0.04, 0.12, 0);
        jaw.rotation.z = (-d * Math.PI) / 2;
        gripper.add(jaw);
        const tip = new THREE.Mesh(new THREE.SphereGeometry(0.034, 16, 16), shellMat);
        tip.position.set(d * 0.04, 0.22, 0);
        gripper.add(tip);
      });
      const armDir = new THREE.Vector3().subVectors(wrist, elbow).normalize();
      gripper.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), armDir);
      gripper.position.copy(wrist);
      bodyGroup.add(gripper);
      grippers.push(gripper);
    });

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.2, 28), panelMat);
    neck.position.y = 0.16;
    bodyGroup.add(neck);

    /* Head — square but finished, with a screen-face */
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.98, 0.86), shellMat);
    head.position.y = 0.98;
    headGroup.add(head);

    const crown = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.12, 0.7), panelMat);
    crown.position.set(0, 1.5, 0);
    headGroup.add(crown);
    const chin = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.14, 0.66), panelMat);
    chin.position.set(0, 0.5, 0.04);
    headGroup.add(chin);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.66, 0.04), violetMat);
    frame.position.set(0, 1.0, 0.43);
    headGroup.add(frame);
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.58, 0.05), screenMat);
    screen.position.set(0, 1.0, 0.45);
    headGroup.add(screen);

    const eyes: THREE.Group[] = [];
    const makeEye = (x: number) => {
      const g = new THREE.Group();
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.2, 20), eyeMat);
      g.add(bar);
      const top = new THREE.Mesh(new THREE.SphereGeometry(0.07, 18, 18), eyeMat);
      top.position.y = 0.1;
      g.add(top);
      const bot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 18, 18), eyeMat);
      bot.position.y = -0.1;
      g.add(bot);
      g.position.set(x, 1.0, 0.49);
      headGroup.add(g);
      eyes.push(g);
    };
    makeEye(-0.22);
    makeEye(0.22);

    [-1, 1].forEach((s) => {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.5, 0.4), panelMat);
      line.position.set(0.58 * s, 1.0, 0.1);
      headGroup.add(line);
    });

    [-1, 1].forEach((s) => {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.1, 24), panelMat);
      cap.rotation.z = Math.PI / 2;
      cap.position.set(0.62 * s, 1.0, -0.05);
      headGroup.add(cap);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 12, 30), violetMat);
      ring.rotation.y = Math.PI / 2;
      ring.position.set(0.67 * s, 1.0, -0.05);
      headGroup.add(ring);
    });

    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.5, 12), panelMat);
    rod.position.set(-0.3, 1.68, 0);
    rod.rotation.z = 0.18;
    headGroup.add(rod);
    const antTip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 20, 20), eyeMat);
    antTip.position.set(-0.38, 1.92, 0);
    headGroup.add(antTip);

    /* Interaction state */
    const mouse = { x: 0, y: 0 };
    let hovering = false;
    let squint = 1;
    let anger = 0;
    let angerEnd = 0;

    const onMove = (e: PointerEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onEnter = () => {
      hovering = true;
    };
    const onLeave = () => {
      hovering = false;
    };
    const onDown = () => {
      angerEnd = performance.now() + 1700;
    };
    if (hasPointer) {
      window.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerenter", onEnter);
      canvas.addEventListener("pointerleave", onLeave);
    }
    // Click / tap the robot → it gets angry for ~1.7s (works on touch too)
    canvas.addEventListener("pointerdown", onDown);

    const calmCol = new THREE.Color(0x22d3ee);
    const angryCol = new THREE.Color(0xff2200);

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const clock = new THREE.Clock();

    const applyScale = () => {
      root.scale.setScalar(window.innerWidth < 900 ? 0.85 : 1.0);
    };

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      let targetX: number;
      let targetY: number;
      if (hasPointer && !reduceMotion) {
        targetX = mouse.x;
        targetY = mouse.y;
      } else {
        targetX = Math.sin(t * 0.5) * 0.6;
        targetY = Math.sin(t * 0.35) * 0.25;
      }

      const angerTarget = performance.now() < angerEnd ? 1 : 0;
      anger = lerp(anger, angerTarget, angerTarget ? 0.35 : 0.06);

      headGroup.rotation.y = lerp(headGroup.rotation.y, targetX * 0.7, 0.1);
      headGroup.rotation.x = lerp(headGroup.rotation.x, targetY * 0.4, 0.1);
      bodyGroup.rotation.y = lerp(bodyGroup.rotation.y, targetX * 0.15, 0.05);
      bodyGroup.rotation.x = lerp(bodyGroup.rotation.x, targetY * 0.08, 0.05);

      if (!reduceMotion) {
        root.position.y = Math.sin(t * 1.2) * 0.08;
        root.rotation.z = Math.sin(t * 0.8) * 0.02;

        eyeMat.emissiveIntensity =
          2.3 + Math.sin(t * 3) * 0.35 + anger * (2.2 + Math.abs(Math.sin(t * 13)) * 2.0);
        eyeMat.color.copy(calmCol).lerp(angryCol, anger);
        eyeMat.emissive.copy(calmCol).lerp(angryCol, anger);
        antTip.scale.setScalar(1 + Math.sin(t * 2) * 0.18 + anger * 0.4);

        // Angry: head trembles and leans in
        headGroup.rotation.z += Math.sin(t * 46) * anger * 0.06;
        headGroup.rotation.x += anger * 0.16;

        // Claws twitch when angry
        grippers.forEach((g, gi) => {
          g.rotation.x = Math.sin(t * 28 + gi) * anger * 0.35;
        });

        const ex = targetX * 0.05;
        const ey = -targetY * 0.04;
        squint = lerp(squint, hovering ? 0.42 : 1, 0.12);
        const phase = t % 4.5;
        const blink = phase < 0.14 ? Math.max(0.12, Math.abs(phase - 0.07) / 0.07) : 1;
        eyes.forEach((e, i) => {
          const baseX = i === 0 ? -0.22 : 0.22;
          e.position.x = baseX + ex;
          e.position.y = 1.0 + ey + (1 - squint) * 0.05;
          e.scale.y = blink * squint * (1 - anger * 0.5);
          e.scale.x = 1 + (1 - squint) * 0.35;
          // Angry "brows": inner ends down
          e.rotation.z = (i === 0 ? -1 : 1) * anger * 0.5;
        });
      }

      renderer.render(scene, camera);
    };

    const onResize = () => {
      resize();
      applyScale();
    };
    window.addEventListener("resize", onResize);

    resize();
    applyScale();
    setLoading(false);
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerenter", onEnter);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerdown", onDown);
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
      });
      [shellMat, panelMat, screenMat, eyeMat, violetMat].forEach((m) => m.dispose());
      renderer.dispose();
    };
  }, []);

  return (
    <div className="canvas-wrap">
      <canvas ref={canvasRef} className="robot-canvas" aria-hidden="true" />
      {loading && <div className="canvas-loader">инициализация…</div>}
    </div>
  );
}
