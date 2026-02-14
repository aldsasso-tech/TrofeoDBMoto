import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export default function Piloti({ year }) {
  const [piloti, setPiloti] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const anno = String(year || 2026);
    getDocs(query(collection(db, 'anni', anno, 'piloti'), orderBy('cognome'))).then((snap) => {
      setPiloti(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="text-center text-white py-5">Caricamento piloti...</div>;

  return (
    <div>
      <h2 className="text-white mb-4">Piloti {year}</h2>
      <div className="card card-trof overflow-hidden">
        <div className="table-responsive">
          <table className="table table-trof table-hover mb-0">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Cognome</th>
                <th>Età</th>
                <th>Peso (kg)</th>
                <th>Scadenza iscrizione FMI</th>
              </tr>
            </thead>
            <tbody>
              {piloti.map((p) => (
                <tr key={p.id}>
                  <td>{p.nome ?? '—'}</td>
                  <td>{p.cognome ?? '—'}</td>
                  <td>{p.eta ?? '—'}</td>
                  <td>{p.peso ?? '—'}</td>
                  <td>{p.scadenzaFMI ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {piloti.length === 0 && <p className="text-white-50 mt-3">Nessun pilota inserito.</p>}
    </div>
  );
}
