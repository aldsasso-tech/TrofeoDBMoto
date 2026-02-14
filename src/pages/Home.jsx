import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export default function Home({ year, setYear }) {
  const [prossimoEvento, setProssimoEvento] = useState(null);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const q = query(
      collection(db, 'anni', String(year), 'calendario'),
      where('data', '>=', today.toISOString().slice(0, 10)),
      orderBy('data', 'asc'),
      limit(1)
    );
    getDocs(q).then((snap) => {
      if (!snap.empty) setProssimoEvento({ id: snap.docs[0].id, ...snap.docs[0].data() });
    }).catch(() => setProssimoEvento(null));
  }, [year]);

  const anni = [];
  for (let y = 2026; y <= new Date().getFullYear() + 1; y++) anni.push(y);

  return (
    <div className="text-center">
      <img src="/logo-trofeo.svg" alt="Trofeo DB Moto" className="logo-trof my-4" style={{ maxHeight: '120px' }} />
      <h1 className="text-white mb-3">Trofeo DB Moto</h1>
      <p className="text-white-50 mb-4">Seleziona l&apos;anno e accedi alle sezioni</p>

      <div className="mb-4">
        <label className="text-white me-2">Anno:</label>
        <select className="form-select form-select-lg d-inline-block w-auto mx-auto" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {anni.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="card card-trof p-4 mb-4 text-start">
        <h5 className="text-white mb-3">Prossimo evento</h5>
        {prossimoEvento ? (
          <p className="mb-0">
            <strong>Data:</strong> {prossimoEvento.data} — <strong>Circuito:</strong> {prossimoEvento.circuitoNome || prossimoEvento.circuitoId || '—'}
          </p>
        ) : (
          <p className="mb-0 text-white-50">Nessun evento futuro in calendario.</p>
        )}
      </div>

      <div className="d-flex flex-wrap justify-content-center gap-3">
        <Link to="/regolamento" className="btn btn-trof">Regolamento</Link>
        <Link to="/calendario" className="btn btn-trof">Calendario</Link>
        <Link to="/login" className="btn btn-outline-danger">Login</Link>
        <Link to="/richiedi-accesso" className="btn btn-outline-light">Richiedi accesso</Link>
      </div>
    </div>
  );
}
