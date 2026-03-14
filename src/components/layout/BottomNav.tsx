import { NavLink } from 'react-router-dom';
import styles from './BottomNav.module.css';

const HomeIcon = () => <span aria-hidden="true">H</span>;
const MitasIcon = () => <span aria-hidden="true">M</span>;
const SettingsIcon = () => <span aria-hidden="true">S</span>;

export function BottomNav() {
  return (
    <nav className={styles.nav} aria-label="Main navigation">
      <NavLink
        to="/"
        className={({ isActive }) =>
          isActive ? `${styles.link} ${styles.active}` : styles.link
        }
        end
      >
        <HomeIcon />
        <span className={styles.label}>Home</span>
      </NavLink>
      <NavLink
        to="/mitas"
        className={({ isActive }) =>
          isActive ? `${styles.link} ${styles.active}` : styles.link
        }
      >
        <MitasIcon />
        <span className={styles.label}>Mitas</span>
      </NavLink>
      <NavLink
        to="/settings"
        className={({ isActive }) =>
          isActive ? `${styles.link} ${styles.active}` : styles.link
        }
      >
        <SettingsIcon />
        <span className={styles.label}>Settings</span>
      </NavLink>
    </nav>
  );
}
