import { Plus, Minus } from "lucide-react";
import Map2DView from "../views/Map2DView";
import CameraView from "../views/CameraView";
import styles from "../../styles/AppLayout.module.css";

export default function PictureInPicture({
  viewMode,
  zoomLevel,
  setZoomLevel,
  telemetry,
  isRunning,
}) {
  return (
    <div className={styles.cameraOverlay}>
      <div className={styles.cameraCard}>
        {/* If main is Camera, render the 2D map in the card. Otherwise, render the Camera feed in the card. */}
        {viewMode === "CAMERA" ? (
          <Map2DView telemetry={telemetry} viewMode={viewMode} />
        ) : (
          <CameraView
            isRunning={isRunning}
            viewMode={viewMode}
            isFullBackground={false}
            zoomLevel={zoomLevel}
          />
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
  );
}
