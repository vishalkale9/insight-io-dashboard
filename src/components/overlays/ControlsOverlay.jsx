import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import styles from "../../styles/AppLayout.module.css";

export default function ControlsOverlay({
  setTelemetry,
  setIsRunning,
  handleDpadControl,
}) {
  return (
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
  );
}
