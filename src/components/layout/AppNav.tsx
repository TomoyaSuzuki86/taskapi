import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/history', label: 'History' },
  { to: '/settings', label: 'Settings' },
];

export function AppNav() {
  return (
    <nav className="app-nav" aria-label="Primary">
      {navItems.map((item) => (
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
