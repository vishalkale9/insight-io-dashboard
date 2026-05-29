import { useState, useEffect, useRef } from "react";
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

  const [telemetry, setTelemetry] = useState({
    x: 220, // Canvas X coordinate
    y: 280, // Canvas Y coordinate
    yaw: -Math.PI / 4, // Rotation angle (yaw) in radians
    linearVelocity: 0.0,
    angularVelocity: 0.0,
    battery: 100,
    signal: "Strong",
    failsafe: "Okay",
    system: "Okay",
  });

  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isAutoMode || !isRunning) return;

      let lv = telemetry.linearVelocity;
      let av = telemetry.angularVelocity;
      let isControlKey = true;

      switch (e.key.toLowerCase()) {
        case "w":
        case "arrowup":
          lv = Math.min(lv + 0.5, 4.0); //Drive forward
          break;
        case "s":
        case "arrowdown":
          lv = Math.max(lv - 0.5, -2.0); //Reverse
          break;
        case "a":
        case "arrowleft":
          av = Math.min(av + 0.2, 1.5); //Turn left
          break;
        case "d":
        case "arrowright":
          av = Math.max(av - 0.2, -1.5); //Turn right
          break;
        case " ": //Braking
          lv = 0;
          av = 0;
          break;
        default:
          isControlKey = false;
          break;
      }

      if (isControlKey) {
        e.preventDefault(); // Block browser page scroll
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

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isRunning) return;

      setTelemetry((prev) => {
        if (isAutoMode) {
          const time = Date.now() / 2000;

          const radius = 120;
          const centerX = 380;
          const centerY = 300;

          const nextX = centerX + radius * Math.cos(time);
          const nextY = centerY + radius * Math.sin(time);
          const nextYaw = time + Math.PI / 2; // Face forward direction

          return {
            ...prev,
            x: parseFloat(nextX.toFixed(2)),
            y: parseFloat(nextY.toFixed(2)),
            yaw: nextYaw,
            linearVelocity: 1.5,
            angularVelocity: 0.5,
            battery: Math.max(0, prev.battery - (Math.random() > 0.99 ? 1 : 0)),
          };
        }

        const dt = 0.1; // 100ms time step
        const nextYaw = prev.yaw + prev.angularVelocity * dt;

        const nextX = prev.x + prev.linearVelocity * Math.cos(nextYaw) * 1.5;
        const nextY = prev.y + prev.linearVelocity * Math.sin(nextYaw) * 1.5;

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

  useEffect(() => {
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
      ctx.fillStyle = "#f3f4f6";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "#d1d5db";
      ctx.lineWidth = 4;
      ctx.beginPath();

      ctx.rect(30, 30, canvas.width - 60, canvas.height - 60);
      ctx.stroke();

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

      obstacles.forEach((obs) => {
        ctx.fillStyle = "rgba(239, 68, 68, 0.08)"; //
        ctx.strokeStyle = "rgba(239, 68, 68, 0.2)";
        ctx.lineWidth = 1.5;

        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);

        ctx.fillStyle = "#9ca3af";
        ctx.font = "10px Inter";
        ctx.textAlign = "center";
        ctx.fillText(obs.label, obs.x + obs.w / 2, obs.y + obs.h / 2 + 4);
      });

      const rx = telemetry.x;
      const ry = telemetry.y;
      const ryaw = telemetry.yaw;

      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate(ryaw);

      ctx.fillStyle = "#0f172a";
      ctx.fillRect(-14, -12, 6, 4); // Top-left wheel
      ctx.fillRect(8, -12, 6, 4); // Top-right wheel
      ctx.fillRect(-14, 8, 6, 4); // Bottom-left wheel
      ctx.fillRect(8, 8, 6, 4); // Bottom-right wheel

      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2.5;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(-12, -9, 24, 18, 4);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(-4, -14);
      ctx.stroke();

      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(-4, -14, 4, -Math.PI * 0.75, -Math.PI * 0.25);
      ctx.stroke();

      ctx.restore();

      ctx.strokeStyle = "rgba(59, 130, 246, 0.3)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(380, 300, 120, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, [telemetry]);

  const cameraCanvasRef = useRef(null);
  useEffect(() => {
    const canvas = cameraCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const renderCam = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!isRunning) {
        const imgData = ctx.createImageData(canvas.width, canvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const val = Math.floor(Math.random() * 255);
          data[i] = val;
          data[i + 1] = val;
          data[i + 2] = val;
          data[i + 3] = 80;
        }
        ctx.putImageData(imgData, 0, 0);
      } else {
        ctx.fillStyle = "#a1a1aa";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = "#71717a";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height * 0.75);
        ctx.lineTo(canvas.width, canvas.height * 0.75);
        ctx.stroke();

        ctx.strokeStyle = "#eab308";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(120, 20);
        ctx.lineTo(120, 100);
        ctx.lineTo(240, 100);
        ctx.moveTo(180, 100);
        ctx.lineTo(180, 140);
        ctx.stroke();

        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 1;
        ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
      }

      requestAnimationFrame(renderCam);
    };

    renderCam();
  }, [isRunning]);

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

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.logoSection}>
          <div className={styles.logoIcon}>ERIC</div>
          <div className={styles.logoSub}>ROBOTICS</div>
        </div>

        <nav className={styles.menuSection}>
          <div className={`${styles.menuItem} ${styles.menuItemActive}`}>
            <LayoutGrid size={20} />
          </div>
          <div className={styles.menuItem}>
            <MapIcon size={20} />
          </div>
          <div className={styles.menuItem}>
            <MapPin size={20} />
          </div>
          <div className={styles.menuItem}>
            <GridIcon size={20} />
          </div>
          <div className={styles.menuItem}>
            <Crosshair size={20} />
          </div>
          <div className={styles.menuItem}>
            <TrendingUp size={20} />
          </div>
        </nav>

        <div className={styles.profileSection}>
          <User size={22} />
        </div>
      </aside>

      <main className={styles.mainViewport}>
        <div className={styles.mapContainer}>
          <button className={styles.mapToggleBtn}>Map View</button>
          <canvas ref={canvasRef} className={styles.mapCanvas} />
        </div>

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

        <div className={styles.cameraOverlay}>
          <div className={styles.cameraCard}>
            <canvas
              ref={cameraCanvasRef}
              width={280}
              height={160}
              style={{ display: "block" }}
            />
          </div>
          <div className={styles.sliderContainer}>
            <Plus size={12} color="var(--text-muted)" />
            <input
              type="range"
              min="1"
              max="100"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(e.target.value)}
              className={styles.sliderInput}
            />
            <Minus size={12} color="var(--text-muted)" />
          </div>
        </div>

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
