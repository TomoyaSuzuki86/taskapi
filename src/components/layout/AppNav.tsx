import { NavLink } from 'react-router-dom';
import { shellRouteMeta } from '@/app/route-meta';

export function AppNav() {
  return (
    <nav className="app-nav" aria-label="メインナビゲーション">
      {shellRouteMeta.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            isActive ? 'app-nav__link is-active' : 'app-nav__link'
          }
          end={item.to === '/'}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
