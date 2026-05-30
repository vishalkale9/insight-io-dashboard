import { useEffect, useRef } from "react";

export default function CameraView({
  isRunning,
  viewMode,
  isFullBackground,
  zoomLevel,
}) {
  const videoRef = useRef(null);

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
}
