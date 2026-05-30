import { Battery, Wifi } from "lucide-react";
import styles from "../../styles/AppLayout.module.css";

export default function TelemetryHUD({ telemetry }) {
  return (
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
        <span style={{ color: "var(--color-green)" }}>{telemetry.system}</span>
        <span className={styles.statusDot} />
      </div>
    </div>
  );
}
