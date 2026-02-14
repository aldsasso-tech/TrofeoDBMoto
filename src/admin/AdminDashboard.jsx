import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  return (
    <div className="card card-trof p-4">
      <h4 className="text-white mb-4">Dashboard ADMIN</h4>
      <p className="text-white-50 mb-3">Seleziona una voce dal menu per gestire regolamento, calendario, piloti, circuiti, richieste, prezzi, partecipanti, finance e risultati.</p>
      <div className="row g-2">
        <div className="col-12 col-sm-6 col-md-4">
          <Link to="/admin/richieste-accesso" className="btn btn-trof w-100">Richieste di accesso</Link>
        </div>
        <div className="col-12 col-sm-6 col-md-4">
          <Link to="/admin/calendario" className="btn btn-outline-light w-100">Calendario</Link>
        </div>
        <div className="col-12 col-sm-6 col-md-4">
          <Link to="/admin/risultati" className="btn btn-outline-light w-100">Inserimento risultati</Link>
        </div>
        <div className="col-12 col-sm-6 col-md-4">
          <Link to="/admin/finance" className="btn btn-outline-light w-100">Finance</Link>
        </div>
      </div>
    </div>
  );
}
