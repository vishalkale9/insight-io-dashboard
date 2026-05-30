import { useState } from "react";
import { useRobotTelemetry } from "./hooks/useRobotTelemetry";

import Sidebar from "./components/layout/Sidebar";
import Map2DView from "./components/views/Map2DView";
import LiDAR3DView from "./components/views/LiDAR3DView";
import CameraView from "./components/views/CameraView";

import StatusHUD from "./components/overlays/StatusHUD";
import TelemetryHUD from "./components/overlays/TelemetryHUD";
import ModeSelectorHUD from "./components/overlays/ModeSelectorHUD";
import ControlsOverlay from "./components/overlays/ControlsOverlay";
import PictureInPicture from "./components/overlays/PictureInPicture";

import styles from "./styles/AppLayout.module.css";

export default function App() {
  const [zoomLevel, setZoomLevel] = useState(50);
  const [viewMode, setViewMode] = useState("MAP_2D");

  const {
    telemetry,
    setTelemetry,
    isAutoMode,
    isRunning,
    setIsRunning,
    handleDpadControl,
    handleModeChange,
  } = useRobotTelemetry();

  const handleViewModeToggle = () => {
    setViewMode((prev) => {
      if (prev === "MAP_2D") return "MAP_3D";
      if (prev === "MAP_3D") return "CAMERA";
      return "MAP_2D";
    });
  };

  const getViewModeLabel = () => {
    if (viewMode === "MAP_2D") return "Map View";
    if (viewMode === "MAP_3D") return "3D LiDAR";
    return "Camera View";
  };

  return (
    <div className={styles.container}>
      <Sidebar viewMode={viewMode} setViewMode={setViewMode} />

      <main className={styles.mainViewport}>
        {/* Main Background View */}
        <div className={styles.mapContainer}>
          <button
            onClick={handleViewModeToggle}
            className={styles.mapToggleBtn}
          >
            {getViewModeLabel()}
          </button>

          {viewMode === "MAP_2D" && (
            <Map2DView telemetry={telemetry} viewMode={viewMode} />
          )}

          {viewMode === "MAP_3D" && (
            <LiDAR3DView telemetry={telemetry} viewMode={viewMode} />
          )}

          {viewMode === "CAMERA" && (
            <CameraView
              isRunning={isRunning}
              viewMode={viewMode}
              isFullBackground={true}
              zoomLevel={zoomLevel}
            />
          )}
        </div>

        {/* Floating Overlays */}
        <StatusHUD isRunning={isRunning} setIsRunning={setIsRunning} />

        <TelemetryHUD telemetry={telemetry} />

        <ModeSelectorHUD
          isAutoMode={isAutoMode}
          handleModeChange={handleModeChange}
        />

        <PictureInPicture
          viewMode={viewMode}
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
          telemetry={telemetry}
          isRunning={isRunning}
        />

        <ControlsOverlay
          setTelemetry={setTelemetry}
          setIsRunning={setIsRunning}
          handleDpadControl={handleDpadControl}
        />
      </main>
    </div>
  );
}
