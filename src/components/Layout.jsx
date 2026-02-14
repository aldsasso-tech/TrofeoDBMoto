import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LOGO_SRC = '/logo-trofeo.svg';

export default function Layout({ children, year }) {
  const { user, signOut, isAdmin } = useAuth();
  const [showNav, setShowNav] = useState(false);

  const publicLinks = [
    { to: '/', label: 'Home' },
    { to: '/regolamento', label: 'Regolamento' },
    { to: '/calendario', label: 'Calendario' },
  ];

  const authLinks = [
    { to: '/circuiti', label: 'Circuiti' },
    { to: '/classifiche', label: 'Classifiche' },
    { to: '/piloti', label: 'Piloti' },
    { to: '/eventi', label: 'Eventi' },
    { to: '/foto-video', label: 'Foto/Video' },
  ];

  return (
    <div className="app-wrap">
      <nav className="navbar navbar-expand-lg navbar-dark navbar-trof">
        <div className="container">
          <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
            <img src={LOGO_SRC} alt="Trofeo DB Moto" className="logo-trof" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling?.classList.remove('d-none'); }} />
            <span className="d-none">Trofeo DB Moto</span>
            <span>Trofeo DB Moto</span>
          </Link>
          <button className="navbar-toggler" type="button" onClick={() => setShowNav(!showNav)} aria-label="Menu">
            <span className="navbar-toggler-icon" />
          </button>
          <div className={`collapse navbar-collapse ${showNav ? 'show' : ''}`}>
            <ul className="navbar-nav me-auto">
              {publicLinks.map(({ to, label }) => (
                <li key={to} className="nav-item">
                  <NavLink className="nav-link" to={to} onClick={() => setShowNav(false)}>{label}</NavLink>
                </li>
              ))}
              {user && authLinks.map(({ to, label }) => (
                <li key={to} className="nav-item">
                  <NavLink className="nav-link" to={to} onClick={() => setShowNav(false)}>{label}</NavLink>
                </li>
              ))}
              {isAdmin && (
                <li className="nav-item">
                  <NavLink className="nav-link" to="/admin" onClick={() => setShowNav(false)}>ADMIN</NavLink>
                </li>
              )}
            </ul>
            <div className="d-flex align-items-center gap-2">
              {user ? (
                <>
                  <span className="text-white small">{user.email}</span>
                  <button className="btn btn-sm btn-outline-light" onClick={() => { signOut(); setShowNav(false); }}>Esci</button>
                </>
              ) : (
                <Link className="btn btn-trof btn-sm" to="/login" onClick={() => setShowNav(false)}>Login</Link>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="main-content container">{children}</main>
      <footer className="footer-trof mt-auto">
        <div className="container">Trofeo DB Moto {year || new Date().getFullYear()} — Tutti i diritti riservati</div>
      </footer>
    </div>
  );
}
