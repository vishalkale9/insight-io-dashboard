import { useEffect, useRef } from "react";
import styles from "../../styles/AppLayout.module.css";

export default function Map2DView({ telemetry, viewMode }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

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

      // 3. Draw facility obstacle zones
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

  return <canvas ref={canvasRef} className={styles.mapCanvas} />;
}
