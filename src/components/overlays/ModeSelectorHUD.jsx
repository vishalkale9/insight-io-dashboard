import { ArrowRight } from "lucide-react";
import styles from "../../styles/AppLayout.module.css";

export default function ModeSelectorHUD({ isAutoMode, handleModeChange }) {
  return (
    <>
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
    </>
  );
}
