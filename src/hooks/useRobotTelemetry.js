import { useState, useEffect } from "react";

export function useRobotTelemetry() {
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [isRunning, setIsRunning] = useState(true);

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

  return {
    telemetry,
    setTelemetry,
    isAutoMode,
    setIsAutoMode,
    isRunning,
    setIsRunning,
    handleDpadControl,
    handleModeChange,
  };
}
