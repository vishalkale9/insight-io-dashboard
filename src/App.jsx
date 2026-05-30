import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  LayoutGrid,
  Map as MapIcon,
  MapPin,
  Grid as GridIcon,
  Crosshair,
  TrendingUp,
  User,
  Pause,
  Play,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Battery,
  Wifi,
  Plus,
  Minus,
} from "lucide-react";
import styles from "./styles/AppLayout.module.css";

export default function App() {
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [isRunning, setIsRunning] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(50);

  // View mode: 'MAP_2D' (2D Occupancy Grid), 'MAP_3D' (3D LiDAR Point Cloud), or 'CAMERA' (Full video background)
  const [viewMode, setViewMode] = useState("MAP_2D");

  // Robot pose and telemetry state (coordinates relative to a base 800x600 map coordinate system)
  const [telemetry, setTelemetry] = useState({
    x: 400,
    y: 300,
    yaw: -Math.PI / 4,
    linearVelocity: 0.0,
    angularVelocity: 0.0,
    battery: 100,
    signal: "Strong",
    failsafe: "Okay",
    system: "Okay",
  });

  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const threeContainerRef = useRef(null);
  const robot3DRef = useRef(null);
  const videoRef = useRef(null);

  // Keyboard driving input mapping (WASD / Arrows)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isAutoMode || !isRunning) return;

      let lv = telemetry.linearVelocity;
      let av = telemetry.angularVelocity;
      let isControlKey = true;

      switch (e.key.toLowerCase()) {
        case "w":
        case "arrowup":
          lv = Math.min(lv + 0.5, 4.0); // Drive forward
          break;
        case "s":
        case "arrowdown":
          lv = Math.max(lv - 0.5, -2.0); // Reverse
          break;
        case "a":
        case "arrowleft":
          av = Math.min(av + 0.2, 1.5); // Turn left
          break;
        case "d":
        case "arrowright":
          av = Math.max(av - 0.2, -1.5); // Turn right
          break;
        case " ": // Brake stop
          lv = 0;
          av = 0;
          break;
        default:
          isControlKey = false;
          break;
      }

      if (isControlKey) {
        e.preventDefault();
        setTelemetry((prev) => ({
          ...prev,
          linearVelocity: parseFloat(lv.toFixed(2)),
          angularVelocity: parseFloat(av.toFixed(2)),
        }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [telemetry, isAutoMode, isRunning]);

  // Telemetry physics calculations (kinematics loop)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isRunning) return;

      setTelemetry((prev) => {
        if (isAutoMode) {
          const t = Date.now() / 1000;
          const speed = 70; // Pixels per second along corridors
          const W_s = 420; // Horizontal segment length
          const H_s = 320; // Vertical segment length
          const R = 40; // Corner radius
          const L_a = (Math.PI / 2) * R; // Arc length (62.83)
          const perimeter = 2 * W_s + 2 * H_s + 4 * L_a; // Total path length (1731.32)

          const d = (speed * t) % perimeter;
          let nextX;
          let nextY;
          let nextYaw;

          if (d < W_s) {
            nextX = 150 + R + d;
            nextY = 100;
            nextYaw = 0;
          } else if (d < W_s + L_a) {
            const theta = (d - W_s) / R - Math.PI / 2;
            nextX = 650 - R + R * Math.cos(theta);
            nextY = 100 + R + R * Math.sin(theta);
            nextYaw = theta + Math.PI / 2;
          } else if (d < W_s + L_a + H_s) {
            nextX = 650;
            nextY = 100 + R + (d - W_s - L_a);
            nextYaw = Math.PI / 2;
          } else if (d < W_s + 2 * L_a + H_s) {
            const theta = (d - W_s - L_a - H_s) / R;
            nextX = 650 - R + R * Math.cos(theta);
            nextY = 500 - R + R * Math.sin(theta);
            nextYaw = theta + Math.PI / 2;
          } else if (d < 2 * W_s + 2 * L_a + H_s) {
            nextX = 650 - R - (d - W_s - 2 * L_a - H_s);
            nextY = 500;
            nextYaw = Math.PI;
          } else if (d < 2 * W_s + 3 * L_a + H_s) {
            const theta = (d - 2 * W_s - 2 * L_a - H_s) / R + Math.PI / 2;
            nextX = 150 + R + R * Math.cos(theta);
            nextY = 500 - R + R * Math.sin(theta);
            nextYaw = theta + Math.PI / 2;
          } else if (d < 2 * W_s + 3 * L_a + 2 * H_s) {
            nextX = 150;
            nextY = 500 - R - (d - 2 * W_s - 3 * L_a - H_s);
            nextYaw = -Math.PI / 2;
          } else {
            const theta = (d - 2 * W_s - 3 * L_a - 2 * H_s) / R + Math.PI;
            nextX = 150 + R + R * Math.cos(theta);
            nextY = 100 + R + R * Math.sin(theta);
            nextYaw = theta + Math.PI / 2;
          }

          return {
            ...prev,
            x: parseFloat(nextX.toFixed(2)),
            y: parseFloat(nextY.toFixed(2)),
            yaw: nextYaw,
            linearVelocity: 1.5,
            angularVelocity: 0.15,
            battery: Math.max(0, prev.battery - (Math.random() > 0.99 ? 1 : 0)),
          };
        }

        const dt = 0.1;
        const nextYaw = prev.yaw + prev.angularVelocity * dt;
        const nextX = prev.x + prev.linearVelocity * Math.cos(nextYaw) * 1.5;
        const nextY = prev.y + prev.linearVelocity * Math.sin(nextYaw) * 1.5;

        // Keep inside 800x600 coordinate box boundaries
        const boundedX = Math.max(40, Math.min(760, nextX));
        const boundedY = Math.max(40, Math.min(560, nextY));

        const decayedLinear = prev.linearVelocity * 0.92;
        const decayedAngular = prev.angularVelocity * 0.85;

        return {
          ...prev,
          x: parseFloat(boundedX.toFixed(2)),
          y: parseFloat(boundedY.toFixed(2)),
          yaw: nextYaw,
          linearVelocity: Math.abs(decayedLinear) < 0.05 ? 0 : decayedLinear,
          angularVelocity: Math.abs(decayedAngular) < 0.05 ? 0 : decayedAngular,
          battery: Math.max(0, prev.battery - (Math.random() > 0.99 ? 1 : 0)),
        };
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, isAutoMode]);

  // --- 2D Occupancy Grid Map Renderer ---
  useEffect(() => {
    // Render 2D map only if it is either the main viewport or downscaled inside the bottom-left card
    const is2DActive = viewMode === "MAP_2D" || viewMode === "CAMERA";
    if (!is2DActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const obstacles = [
      { x: 420, y: 120, w: 100, h: 80, label: "Work Area" },
      { x: 380, y: 300, w: 140, h: 70, label: "Assembly Line" },
      { x: 380, y: 520, w: 140, h: 80, label: "Machining Station" },
      { x: 580, y: 360, w: 160, h: 280, label: "Warehouse Racks" },
    ];

    const render = () => {
      ctx.save();

      // Calculate layout scaling factors to fit inside the bottom card vs full screen
      const baseWidth = 800;
      const baseHeight = 600;
      const scaleX = canvas.width / baseWidth;
      const scaleY = canvas.height / baseHeight;
      const scale = Math.min(scaleX, scaleY);

      // Centered translation coordinates
      const offsetX = (canvas.width - baseWidth * scale) / 2;
      const offsetY = (canvas.height - baseHeight * scale) / 2;
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      // 1. Draw occupancy background
      ctx.fillStyle = "#f3f4f6";
      ctx.fillRect(0, 0, baseWidth, baseHeight);

      // 2. Draw map blueprint outer borders
      ctx.strokeStyle = "#d1d5db";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.rect(30, 30, baseWidth - 60, baseHeight - 60);
      ctx.stroke();

      // Inner lanes / corridors
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 40;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(150, 100);
      ctx.lineTo(650, 100);
      ctx.lineTo(650, 500);
      ctx.lineTo(150, 500);
      ctx.closePath();
      ctx.stroke();

      // 3. Draw facility obstacle zones (transparent pink boxes)
      obstacles.forEach((obs) => {
        ctx.fillStyle = "rgba(239, 68, 68, 0.08)";
        ctx.strokeStyle = "rgba(239, 68, 68, 0.2)";
        ctx.lineWidth = 1.5;
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);

        ctx.fillStyle = "#9ca3af";
        ctx.font = "10px Inter";
        ctx.textAlign = "center";
        ctx.fillText(obs.label, obs.x + obs.w / 2, obs.y + obs.h / 2 + 4);
      });

      // 4. Render robot icon
      const rx = telemetry.x;
      const ry = telemetry.y;
      const ryaw = telemetry.yaw;

      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate(ryaw);

      // Wheels
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(-14, -12, 6, 4);
      ctx.fillRect(8, -12, 6, 4);
      ctx.fillRect(-14, 8, 6, 4);
      ctx.fillRect(8, 8, 6, 4);

      // Chassis body deck
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2.5;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(-12, -9, 24, 18, 4);
      ctx.fill();
      ctx.stroke();

      // Antenna mast
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(-4, -14);
      ctx.stroke();

      // Signal arcs
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(-4, -14, 4, -Math.PI * 0.75, -Math.PI * 0.25);
      ctx.stroke();

      ctx.restore();

      // Autonomous circular path tracker lines
      ctx.strokeStyle = "rgba(59, 130, 246, 0.3)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(400, 300, 120, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore();

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, [telemetry, viewMode]);

  // --- 3D LiDAR PCD Map Visualizer (Three.js) ---
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

    // Generate Outer and Inner Walls of the corridors corresponding to the 2D occupancy grid
    // Top corridor (z = -20): walls at z = -22 and z = -18
    addWallPoints(-27, 27, -22, -22, 0, 4, 1500);
    addWallPoints(-27, 27, -18, -18, 0, 4, 1500);

    // Bottom corridor (z = 20): walls at z = 18 and z = 22
    addWallPoints(-27, 27, 18, 18, 0, 4, 1500);
    addWallPoints(-27, 27, 22, 22, 0, 4, 1500);

    // Left corridor (x = -25): walls at x = -27 and x = -23
    addWallPoints(-27, -27, -22, 22, 0, 4, 1500);
    addWallPoints(-23, -23, -22, 22, 0, 4, 1500);

    // Right corridor (x = 25): walls at x = 23 and x = 27
    addWallPoints(23, 23, -22, 22, 0, 4, 1500);
    addWallPoints(27, 27, -22, 22, 0, 4, 1500);

    // Add Obstacle Boxes Points matching the facility zones
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
        // Track active concentric scanner rings centered at the robot Group's position
        ringsPointsMesh.position.copy(robotGroup.position);
        ringsPointsMesh.position.y = 0; // Keep on the floor plane

        // Spin the rings to simulate the rotating Velodyne LiDAR sensor
        ringsPointsMesh.rotation.y = Date.now() / 1200;

        // Dynamic camera tracking target
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

    // Scale coordinate offsets: (400, 300) in 2D is mapped to (0, 0) in 3D grid
    const scaleX = (telemetry.x - 400) / 10;
    const scaleZ = (telemetry.y - 300) / 10;

    robot3DRef.current.position.x = scaleX;
    robot3DRef.current.position.z = scaleZ;
    robot3DRef.current.rotation.y = -telemetry.yaw;
  }, [telemetry, viewMode]);

  // Button manual driving control handler
  const handleDpadControl = (dir) => {
    if (isAutoMode || !isRunning) return;

    let lv = telemetry.linearVelocity;
    let av = telemetry.angularVelocity;

    switch (dir) {
      case "W":
        lv = Math.min(lv + 0.6, 3.5);
        break;
      case "S":
        lv = Math.max(lv - 0.6, -1.5);
        break;
      case "A":
        av = Math.min(av + 0.3, 1.2);
        break;
      case "D":
        av = Math.max(av - 0.3, -1.2);
        break;
    }

    setTelemetry((prev) => ({
      ...prev,
      linearVelocity: parseFloat(lv.toFixed(2)),
      angularVelocity: parseFloat(av.toFixed(2)),
    }));
  };

  const handleModeChange = (mode) => {
    setIsAutoMode(mode === "AUTO");
    setTelemetry((prev) => ({
      ...prev,
      linearVelocity: 0,
      angularVelocity: 0,
    }));
  };

  // Toggle layout states: Cycles through 2D Map -> 3D LiDAR -> Camera Background
  const handleViewModeToggle = () => {
    setViewMode((prev) => {
      if (prev === "MAP_2D") return "MAP_3D";
      if (prev === "MAP_3D") return "CAMERA";
      return "MAP_2D";
    });
  };

  // Label names for top button state tracker
  const getViewModeLabel = () => {
    if (viewMode === "MAP_2D") return "Map View";
    if (viewMode === "MAP_3D") return "3D LiDAR";
    return "Camera View";
  };

  // Handle play/pause sync of FPV video player
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      if (isRunning) {
        video.play().catch((err) => {
          console.warn("FPV Video playback failed:", err);
        });
      } else {
        video.pause();
      }
    }
  }, [isRunning, viewMode]);

  // Shared Video element rendering block (rendered dynamically in main bg or bottom card)
  const renderVideoPlayer = (isFullBackground) => {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <video
          ref={videoRef}
          src="/sample_video.mp4"
          loop
          muted
          autoPlay={isRunning}
          playsInline
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${1 + zoomLevel / 100})`,
            transition: "transform 0.1s ease-out",
            display: isRunning ? "block" : "none",
          }}
        />
        {!isRunning && (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "#1e293b",
              color: "var(--color-red)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-cyber)",
              fontSize: isFullBackground ? "1.5rem" : "0.75rem",
              fontWeight: 700,
              letterSpacing: "1px",
            }}
          >
            FEED PAUSED
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* 1. Left Navigation Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logoSection}>
          <div className={styles.logoIcon}>ERIC</div>
          <div className={styles.logoSub}>ROBOTICS</div>
        </div>

        <nav className={styles.menuSection}>
          <div 
            className={`${styles.menuItem} ${viewMode === "MAP_2D" ? styles.menuItemActive : ""}`}
            onClick={() => setViewMode("MAP_2D")}
            title="2D Map View"
          >
            <MapIcon size={20} />
          </div>
          <div 
            className={`${styles.menuItem} ${viewMode === "MAP_3D" ? styles.menuItemActive : ""}`}
            onClick={() => setViewMode("MAP_3D")}
            title="3D LiDAR View"
          >
            <GridIcon size={20} />
          </div>
          <div 
            className={`${styles.menuItem} ${viewMode === "CAMERA" ? styles.menuItemActive : ""}`}
            onClick={() => setViewMode("CAMERA")}
            title="Camera View"
          >
            <Crosshair size={20} />
          </div>
          <div className={styles.menuItem} title="Telemetry Analytics">
            <TrendingUp size={20} />
          </div>
        </nav>

        <div className={styles.profileSection}>
          <User size={22} />
        </div>
      </aside>

      {/* 2. Main Area with Map & floating HUD panels */}
      <main className={styles.mainViewport}>
        {/* Main background view (swapped dynamically) */}
        <div className={styles.mapContainer}>
          <button
            onClick={handleViewModeToggle}
            className={styles.mapToggleBtn}
          >
            {getViewModeLabel()}
          </button>

          {viewMode === "MAP_2D" && (
            <canvas ref={canvasRef} className={styles.mapCanvas} />
          )}

          {viewMode === "MAP_3D" && (
            <div
              ref={threeContainerRef}
              style={{ width: "100%", height: "100%" }}
            />
          )}

          {viewMode === "CAMERA" && renderVideoPlayer(true)}
        </div>

        {/* Floating Top-Left Status */}
        <div className={`${styles.floatingCapsule} ${styles.statusCapsule}`}>
          <span className={styles.statusLabel}>Status</span>
          <span className={styles.statusVal}>
            {isRunning ? "On Mission 1234" : "Halted"}
          </span>
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={styles.pauseBtn}
            title={isRunning ? "Pause Robot Mission" : "Resume Robot Mission"}
          >
            {isRunning ? (
              <Pause size={12} fill="currentColor" />
            ) : (
              <Play size={12} fill="currentColor" />
            )}
          </button>
        </div>

        <button className={styles.quickGoalBtn}>
          QUICK GOAL <ArrowRight size={13} strokeWidth={2.5} />
        </button>

        {/* Floating Top-Center System Diagnostics */}
        <div className={`${styles.floatingCapsule} ${styles.telemetryCapsule}`}>
          <div className={styles.telemetryItem}>
            <span className={styles.telemetryVal}>{telemetry.battery}%</span>
            <Battery size={14} fill="currentColor" />
          </div>
          <div className={styles.telemetryItem}>
            <Wifi size={14} />
            <span className={styles.telemetryVal}>{telemetry.signal}</span>
          </div>
          <div className={styles.telemetryItem}>
            <span>Failsafe</span>
            <span style={{ color: "var(--color-green)" }}>
              {telemetry.failsafe}
            </span>
            <span className={styles.statusDot} />
          </div>
          <div className={styles.telemetryItem}>
            <span>System</span>
            <span style={{ color: "var(--color-green)" }}>
              {telemetry.system}
            </span>
            <span className={styles.statusDot} />
          </div>
        </div>

        {/* Floating Top-Right Modes */}
        <div className={`${styles.floatingCapsule} ${styles.modeCapsule}`}>
          <span className={styles.modeLabel}>MODE</span>
          <button
            onClick={() => handleModeChange("AUTO")}
            className={`${styles.modeOption} ${isAutoMode ? styles.modeOptionActive : ""}`}
          >
            AUTO
          </button>
          <button
            onClick={() => handleModeChange("MANUAL")}
            className={`${styles.modeOption} ${!isAutoMode ? styles.modeOptionActive : ""}`}
          >
            MANUAL
          </button>
        </div>

        <button className={styles.initiateBtn}>
          INITIATE <ArrowRight size={13} strokeWidth={2.5} />
        </button>

        {/* Floating Bottom-Left Card (Dynamic Swap Overlay) */}
        <div className={styles.cameraOverlay}>
          <div className={styles.cameraCard}>
            {/* If main is Camera, render the 2D map in the card. Otherwise, render the Camera feed in the card. */}
            {viewMode === "CAMERA" ? (
              <canvas ref={canvasRef} className={styles.mapCanvas} />
            ) : (
              renderVideoPlayer(false)
            )}
          </div>

          <div className={styles.sliderContainer}>
            <Plus size={12} color="var(--text-muted)" />
            <input
              type="range"
              min="1"
              max="100"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseInt(e.target.value))}
              className={styles.sliderInput}
            />
            <Minus size={12} color="var(--text-muted)" />
          </div>
        </div>

        {/* Floating Bottom-Right Controls */}
        <div className={styles.controlsOverlay}>
          <button
            onClick={() => {
              setTelemetry((prev) => ({
                ...prev,
                linearVelocity: 0,
                angularVelocity: 0,
              }));
              setIsRunning(false);
            }}
            className={styles.emergencyStopBtn}
          >
            EMERGENCY
            <br />
            STOP
          </button>

          <div className={styles.dpad}>
            <button
              onClick={() => handleDpadControl("W")}
              className={`${styles.dpadBtn} ${styles.dpadUp}`}
            >
              <ChevronUp size={16} />
            </button>
            <button
              onClick={() => handleDpadControl("A")}
              className={`${styles.dpadBtn} ${styles.dpadLeft}`}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => handleDpadControl("S")}
              className={`${styles.dpadBtn} ${styles.dpadDown}`}
            >
              <ChevronDown size={16} />
            </button>
            <button
              onClick={() => handleDpadControl("D")}
              className={`${styles.dpadBtn} ${styles.dpadRight}`}
            >
              <ChevronRight size={16} />
            </button>
            <div className={styles.dpadCenter}>
              <span>W+key</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
