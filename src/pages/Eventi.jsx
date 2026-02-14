import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, getDocs, getCountFromServer } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function Eventi({ year }) {
  const [eventi, setEventi] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const anno = String(year || 2026);
    const q = query(collection(db, 'anni', anno, 'calendario'), orderBy('data', 'asc'));
    getDocs(q).then((snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setEventi(list);
      return Promise.all(list.map(async (ev) => {
        const qPart = query(collection(db, 'anni', anno, 'calendario', ev.id, 'partecipanti'));
        const c = await getCountFromServer(qPart);
        return [ev.id, c.data().count];
      }));
    }).then((countList) => {
      const map = {};
      countList.forEach(([id, count]) => { map[id] = count; });
      setCounts(map);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [year]);

  const handlePartecipanti = (ev) => {
    if (!user) {
      navigate('/richiedi-accesso');
      return;
    }
    navigate(`/eventi/${ev.id}`);
  };

  if (loading) return <div className="text-center text-white py-5">Caricamento eventi...</div>;

  return (
    <div>
      <h2 className="text-white mb-4">Eventi {year}</h2>
      <div className="row g-3">
        {eventi.map((ev, idx) => {
          const dataEv = new Date(ev.data);
          const dataFmt = dataEv.toLocaleDateString('it-IT');
          const giorno = dataEv.toLocaleDateString('it-IT', { weekday: 'long' });
          return (
            <div key={ev.id} className="col-12 col-md-6 col-lg-4">
              <div className="card card-trof p-3 h-100">
                <h5 className="text-white">Round {ev.round ?? idx + 1}</h5>
                <p className="mb-1 text-white-50">{dataFmt} — {giorno}</p>
                <p className="mb-1 text-white">{ev.ora || '—'} — {ev.circuitoNome || ev.circuitoId || 'Circuito'}</p>
                <p className="mb-2 small text-white-50">Iscritti: {counts[ev.id] ?? 0} / 24</p>
                <button type="button" className="btn btn-sm btn-outline-light" onClick={() => handlePartecipanti(ev)}>Partecipanti</button>
              </div>
            </div>
          );
        })}
      </div>
      {eventi.length === 0 && <p className="text-white-50">Nessun evento.</p>}
    </div>
  );
}
