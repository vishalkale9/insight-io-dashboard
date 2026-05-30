import { Pause, Play, ArrowRight } from "lucide-react";
import styles from "../../styles/AppLayout.module.css";

export default function StatusHUD({ isRunning, setIsRunning }) {
  return (
    <>
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
    </>
  );
}
