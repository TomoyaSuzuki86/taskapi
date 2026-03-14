import { NavLink } from 'react-router-dom';
import styles from './BottomNav.module.css';

const HomeIcon = () => <span aria-hidden="true">⌂</span>;
const SettingsIcon = () => <span aria-hidden="true">⋯</span>;

export function BottomNav() {
  return (
    <nav className={styles.nav} aria-label="メインナビゲーション">
      <NavLink
        to="/"
        className={({ isActive }) =>
          isActive ? `${styles.link} ${styles.active}` : styles.link
        }
        end
      >
        <HomeIcon />
        <span className={styles.label}>ホーム</span>
      </NavLink>
      <NavLink
        to="/settings"
        className={({ isActive }) =>
          isActive ? `${styles.link} ${styles.active}` : styles.link
        }
      >
        <SettingsIcon />
        <span className={styles.label}>設定</span>
      </NavLink>
    </nav>
  );
}
