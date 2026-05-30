import {
  Map as MapIcon,
  Grid as GridIcon,
  Crosshair,
  TrendingUp,
  User,
} from "lucide-react";
import styles from "../../styles/AppLayout.module.css";

export default function Sidebar({ viewMode, setViewMode }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoSection}>
        <div className={styles.logoIcon}>ERIC</div>
        <div className={styles.logoSub}>ROBOTICS</div>
      </div>

      <nav className={styles.menuSection}>
        <div
          className={`${styles.menuItem} ${viewMode === "MAP_2D" ? styles.menuItemActive : ""}`}
          onClick={() => setViewMode("MAP_2D")}
          title="2D Map View"
        >
          <MapIcon size={20} />
        </div>
        <div
          className={`${styles.menuItem} ${viewMode === "MAP_3D" ? styles.menuItemActive : ""}`}
          onClick={() => setViewMode("MAP_3D")}
          title="3D LiDAR View"
        >
          <GridIcon size={20} />
        </div>
        <div
          className={`${styles.menuItem} ${viewMode === "CAMERA" ? styles.menuItemActive : ""}`}
          onClick={() => setViewMode("CAMERA")}
          title="Camera View"
        >
          <Crosshair size={20} />
        </div>
        <div className={styles.menuItem} title="Telemetry Analytics">
          <TrendingUp size={20} />
        </div>
      </nav>

      <div className={styles.profileSection}>
        <User size={22} />
      </div>
    </aside>
  );
}
