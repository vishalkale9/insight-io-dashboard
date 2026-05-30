import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function LiDAR3DView({ telemetry, viewMode }) {
  const threeContainerRef = useRef(null);
  const robot3DRef = useRef(null);

  useEffect(() => {
    if (viewMode !== "MAP_3D") return;

    const container = threeContainerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3f4f6);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );
    camera.position.set(0, 30, 40);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const gridHelper = new THREE.GridHelper(80, 80, 0x9ca3af, 0xd1d5db);
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    const robotGroup = new THREE.Group();
    const bodyGeometry = new THREE.BoxGeometry(2.4, 1.2, 1.8);
    const bodyMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: false,
    });
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);

    const edges = new THREE.EdgesGeometry(bodyGeometry);
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x0f172a, linewidth: 2 }),
    );
    bodyMesh.add(line);
    robotGroup.add(bodyMesh);

    const wheelGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 8);
    const wheelMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const wheelPositions = [
      [-1.0, -0.4, -1.0],
      [1.0, -0.4, -1.0],
      [-1.0, -0.4, 1.0],
      [1.0, -0.4, 1.0],
    ];
    wheelPositions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeom, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      robotGroup.add(wheel);
    });

    robotGroup.position.set(0, 0.9, 0);
    scene.add(robotGroup);
    robot3DRef.current = robotGroup;

    // --- Generate Static Environment Point Cloud (Warehouse Corridors & Obstacles) ---
    const staticCount = 15000;
    const staticPositions = new Float32Array(staticCount * 3);
    const staticColors = new Float32Array(staticCount * 3);

    const cBlue = new THREE.Color(0x3b82f6);
    const cGreen = new THREE.Color(0x10b981);
    const cOrange = new THREE.Color(0xf59e0b);

    let pIdx = 0;
    const addWallPoints = (
      xStart,
      xEnd,
      zStart,
      zEnd,
      yMin,
      yMax,
      numPoints,
    ) => {
      for (let i = 0; i < numPoints; i++) {
        if (pIdx >= staticCount) break;
        const t = Math.random();
        const x = xStart + (xEnd - xStart) * t;
        const z = zStart + (zEnd - zStart) * t;
        const y = yMin + (yMax - yMin) * Math.random();

        staticPositions[pIdx * 3] = x + (Math.random() - 0.5) * 0.15;
        staticPositions[pIdx * 3 + 1] = y + (Math.random() - 0.5) * 0.05;
        staticPositions[pIdx * 3 + 2] = z + (Math.random() - 0.5) * 0.15;

        const col = new THREE.Color().lerpColors(cBlue, cGreen, y / yMax);
        staticColors[pIdx * 3] = col.r;
        staticColors[pIdx * 3 + 1] = col.g;
        staticColors[pIdx * 3 + 2] = col.b;
        pIdx++;
      }
    };

    // Outer and Inner Walls
    addWallPoints(-27, 27, -22, -22, 0, 4, 1500);
    addWallPoints(-27, 27, -18, -18, 0, 4, 1500);
    addWallPoints(-27, 27, 18, 18, 0, 4, 1500);
    addWallPoints(-27, 27, 22, 22, 0, 4, 1500);
    addWallPoints(-27, -27, -22, 22, 0, 4, 1500);
    addWallPoints(-23, -23, -22, 22, 0, 4, 1500);
    addWallPoints(23, 23, -22, 22, 0, 4, 1500);
    addWallPoints(27, 27, -22, 22, 0, 4, 1500);

    // Obstacle Boxes Points
    const addBoxPoints = (cx, cz, w, d, h, numPoints) => {
      for (let i = 0; i < numPoints; i++) {
        if (pIdx >= staticCount) break;
        const side = Math.floor(Math.random() * 5);
        let x, z;
        let y = Math.random() * h;
        if (side === 0) {
          x = cx - w / 2 + Math.random() * w;
          z = cz + d / 2;
        } else if (side === 1) {
          x = cx - w / 2 + Math.random() * w;
          z = cz - d / 2;
        } else if (side === 2) {
          x = cx - w / 2;
          z = cz - d / 2 + Math.random() * d;
        } else if (side === 3) {
          x = cx + w / 2;
          z = cz - d / 2 + Math.random() * d;
        } else {
          x = cx - w / 2 + Math.random() * w;
          z = cz - d / 2 + Math.random() * d;
          y = h;
        }

        staticPositions[pIdx * 3] = x;
        staticPositions[pIdx * 3 + 1] = y;
        staticPositions[pIdx * 3 + 2] = z;

        const col = new THREE.Color().lerpColors(cGreen, cOrange, y / h);
        staticColors[pIdx * 3] = col.r;
        staticColors[pIdx * 3 + 1] = col.g;
        staticColors[pIdx * 3 + 2] = col.b;
        pIdx++;
      }
    };

    addBoxPoints(7, -14, 10, 8, 3, 1000);
    addBoxPoints(5, 3.5, 14, 7, 2.5, 1000);
    addBoxPoints(5, 26, 14, 8, 3.5, 1000);
    addBoxPoints(26, 18, 16, 28, 5, 2000);

    const staticGeometry = new THREE.BufferGeometry();
    staticGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(staticPositions, 3),
    );
    staticGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(staticColors, 3),
    );

    const staticMaterial = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const staticPointsMesh = new THREE.Points(staticGeometry, staticMaterial);
    scene.add(staticPointsMesh);

    // --- Generate Active Concentric LiDAR Rings (Centered at Robot Group) ---
    const ringsCount = 2500;
    const ringsPositions = new Float32Array(ringsCount * 3);
    const ringsColors = new Float32Array(ringsCount * 3);

    const cCyan = new THREE.Color(0x00ffff);

    for (let i = 0; i < ringsCount; i++) {
      const ringId = Math.floor(Math.random() * 16) + 1;
      const radius = ringId * 1.5;
      const angle = Math.random() * Math.PI * 2;

      const lx = Math.cos(angle) * radius;
      const lz = Math.sin(angle) * radius;
      const ly = 0.05 + (Math.random() - 0.5) * 0.03;

      ringsPositions[i * 3] = lx;
      ringsPositions[i * 3 + 1] = ly;
      ringsPositions[i * 3 + 2] = lz;

      ringsColors[i * 3] = cCyan.r;
      ringsColors[i * 3 + 1] = cCyan.g;
      ringsColors[i * 3 + 2] = cCyan.b;
    }

    const ringsGeometry = new THREE.BufferGeometry();
    ringsGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(ringsPositions, 3),
    );
    ringsGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(ringsColors, 3),
    );

    const ringsMaterial = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
    });

    const ringsPointsMesh = new THREE.Points(ringsGeometry, ringsMaterial);
    scene.add(ringsPointsMesh);

    let reqId;
    const animate = () => {
      reqId = requestAnimationFrame(animate);

      if (robotGroup) {
        ringsPointsMesh.position.copy(robotGroup.position);
        ringsPointsMesh.position.y = 0;
        ringsPointsMesh.rotation.y = Date.now() / 1200;
        controls.target.copy(robotGroup.position);
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [viewMode]);

  // Translate 2D coordinates to ThreeJS 3D position
  useEffect(() => {
    if (viewMode !== "MAP_3D" || !robot3DRef.current) return;

    const scaleX = (telemetry.x - 400) / 10;
    const scaleZ = (telemetry.y - 300) / 10;

    robot3DRef.current.position.x = scaleX;
    robot3DRef.current.position.z = scaleZ;
    robot3DRef.current.rotation.y = -telemetry.yaw;
  }, [telemetry, viewMode]);

  return (
    <div ref={threeContainerRef} style={{ width: "100%", height: "100%" }} />
  );
}
