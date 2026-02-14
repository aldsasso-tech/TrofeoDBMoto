import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/admin', end: true, label: 'Dashboard' },
  { to: '/admin/richieste-accesso', label: 'Richieste di accesso' },
  { to: '/admin/regolamento', label: 'Inserimento Regolamento' },
  { to: '/admin/calendario', label: 'Inserimento Calendario' },
  { to: '/admin/piloti', label: 'Inserimento Piloti' },
  { to: '/admin/circuiti', label: 'Inserimento Circuiti' },
  { to: '/admin/richieste-extra', label: 'Richieste partecipazione extra' },
  { to: '/admin/prezzi', label: 'Inserimento Prezzi' },
  { to: '/admin/calendario-partecipanti', label: 'Calendario partecipanti' },
  { to: '/admin/finance', label: 'Finance' },
  { to: '/admin/risultati', label: 'Inserimento risultati' },
];

export default function AdminLayout() {
  return (
    <div className="row">
      <nav className="col-md-3 col-lg-2 mb-4">
        <div className="card card-trof p-2">
          <h6 className="text-center text-white mb-3">Pannello ADMIN</h6>
          <div className="nav flex-column">
            {links.map(({ to, end, label }) => (
              <NavLink key={to} className="nav-link text-white" to={to} end={end ?? false}>{label}</NavLink>
            ))}
          </div>
        </div>
      </nav>
      <div className="col-md-9 col-lg-10">
        <Outlet />
      </div>
    </div>
  );
}
