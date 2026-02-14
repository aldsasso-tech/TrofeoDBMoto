import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, getDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function Circuiti({ year }) {
  const [circuiti, setCircuiti] = useState([]);
  const [eventiPerCircuito, setEventiPerCircuito] = useState({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const oggi = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const anno = String(year || 2026);
    getDocs(collection(db, 'anni', anno, 'circuiti')).then((snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCircuiti(list);
      return getDocs(query(collection(db, 'anni', anno, 'calendario'), orderBy('data', 'asc')));
    }).then((calSnap) => {
      const eventi = calSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const byCircuito = {};
      eventi.forEach((ev) => {
        const cid = ev.circuitoId || ev.circuitoNome || 'unknown';
        if (!byCircuito[cid]) byCircuito[cid] = [];
        byCircuito[cid].push(ev);
      });
      setEventiPerCircuito(byCircuito);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [year]);

  const handlePartecipa = (ev) => {
    if (!user) {
      navigate('/richiedi-accesso');
      return;
    }
    navigate(`/iscrizione/${ev.id}`);
  };

  if (loading) return <div className="text-center text-white py-5">Caricamento circuiti...</div>;

  return (
    <div>
      <h2 className="text-white mb-4">Circuiti {year}</h2>
      <div className="row g-3">
        {circuiti.map((c) => (
          <div key={c.id} className="col-12 col-md-6 col-lg-4">
            <div className="card card-trof p-4 h-100">
              <h5 className="text-white">{c.nome || c.id}</h5>
              <ul className="list-unstyled text-white-50 small mb-3">
                <li>Lunghezza: {c.lunghezza ?? '—'}</li>
                <li>Larghezza: {c.larghezza ?? '—'}</li>
                <li>Curve sinistra: {c.curveSinistra ?? '—'}</li>
                <li>Curve destra: {c.curveDestra ?? '—'}</li>
                <li>Rettilineo più lungo: {c.rettilineoPiuLungo ?? '—'}</li>
                <li>Indirizzo: {c.indirizzo ?? '—'}</li>
              </ul>
              {eventiPerCircuito[c.id]?.map((ev) => {
                const dataPassata = ev.data < oggi;
                const hasRisultati = ev.risultatiInseriti === true;
                return (
                  <div key={ev.id} className="mb-2">
                    <span className="text-white-50">{ev.data} — {ev.ora || ''}</span>
                    {!dataPassata && (
                      <button type="button" className="btn btn-sm btn-trof ms-2" onClick={() => handlePartecipa(ev)}>Partecipa all&apos;evento</button>
                    )}
                    {dataPassata && !hasRisultati && <span className="text-white-50 ms-2">(Evento concluso)</span>}
                    {dataPassata && hasRisultati && (
                      <Link to={`/risultati/${ev.id}`} className="btn btn-sm btn-outline-info ms-2">Qualifiche e risultati gara</Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {circuiti.length === 0 && <p className="text-white-50">Nessun circuito per quest&apos;anno.</p>}
    </div>
  );
}
