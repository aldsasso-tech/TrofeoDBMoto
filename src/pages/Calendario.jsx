import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, getDocs, getCountFromServer } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function Calendario({ year }) {
  const [eventi, setEventi] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAuthRequired, setShowAuthRequired] = useState(false);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'anni', String(year), 'calendario'), orderBy('data', 'asc'));
    getDocs(q).then((snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setEventi(list);
      return Promise.all(list.map(async (ev) => {
        const qPart = query(collection(db, 'anni', String(year), 'calendario', ev.id, 'partecipanti'));
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

  const oggi = new Date().toISOString().slice(0, 10);
  const isIscrizioniAperte = (ev) => {
    const chiuso = ev.iscrizioniChiuse === true;
    return !chiuso && ev.data > oggi && (counts[ev.id] ?? 0) < 24;
  };
  const isIscrizioniChiuse = (ev) => ev.data <= oggi || ev.iscrizioniChiuse === true;
  const isPieno = (ev) => (counts[ev.id] ?? 0) >= 24 && ev.data > oggi;

  const handlePartecipanti = (ev) => {
    if (!user) {
      setShowAuthRequired(true);
      return;
    }
    navigate(`/eventi/${ev.id}`);
  };

  const handleIscriviti = (ev) => {
    if (!user) {
      setShowAuthRequired(true);
      return;
    }
    navigate(`/iscrizione/${ev.id}`);
  };

  const handleDeroga = (ev) => {
    if (!user) {
      setShowAuthRequired(true);
      return;
    }
    if (window.confirm('Il numero di partecipanti per questo evento è completo. Vuoi richiedere la possibilità di partecipare?')) {
      navigate(`/richiedi-deroga/${ev.id}`);
    }
  };

  if (loading) return <div className="text-center text-white py-5">Caricamento calendario...</div>;

  return (
    <div>
      {showAuthRequired && (
        <div className="alert alert-warning d-flex align-items-center justify-content-between flex-wrap gap-2">
          <span>Area riservata. Necessaria autenticazione.</span>
          <div>
            <Link to="/richiedi-accesso" className="btn btn-sm btn-trof me-2">Richiedi accesso</Link>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowAuthRequired(false)}>Chiudi</button>
          </div>
        </div>
      )}
      <h2 className="text-white mb-4">Calendario {year}</h2>
      <div className="row g-3">
        {eventi.map((ev, idx) => {
          const dataEv = new Date(ev.data);
          const giorno = dataEv.toLocaleDateString('it-IT', { weekday: 'long' });
          const dataFmt = dataEv.toLocaleDateString('it-IT');
          const hasRisultati = ev.risultatiInseriti === true;
          return (
            <div key={ev.id} className="col-12 col-md-6 col-lg-4">
              <div className="card card-trof p-3 h-100">
                <h5 className="text-white">Round {ev.round ?? idx + 1}</h5>
                <p className="mb-1 text-white-50">{dataFmt} — {giorno}</p>
                <p className="mb-1 text-white">{ev.ora || '—'} — {ev.circuitoNome || ev.circuitoId || 'Circuito'}</p>
                <p className="mb-2 small text-white-50">Iscritti: {counts[ev.id] ?? 0} / 24</p>
                <div className="d-flex flex-wrap gap-2">
                  <button type="button" className="btn btn-sm btn-outline-light" onClick={() => handlePartecipanti(ev)}>Partecipanti</button>
                  {isIscrizioniAperte(ev) && <Link to={`/iscrizione/${ev.id}`} className="btn btn-sm btn-trof" onClick={() => handleIscriviti(ev)}>Iscriviti</Link>}
                  {isIscrizioniChiuse(ev) && <button type="button" className="btn btn-sm btn-secondary" disabled>Iscrizioni chiuse</button>}
                  {isPieno(ev) && <button type="button" className="btn btn-sm btn-outline-warning" onClick={() => handleDeroga(ev)}>24 Piloti iscritti - Richiedi deroga</button>}
                  {hasRisultati && <Link to={`/risultati/${ev.id}`} className="btn btn-sm btn-outline-info">Risultati</Link>}
                  {isAdmin && isIscrizioniChiuse(ev) && <Link to="/admin/risultati" className="btn btn-sm btn-outline-danger">Inserimento risultati</Link>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {eventi.length === 0 && <p className="text-white-50">Nessun evento in calendario per quest&apos;anno.</p>}
    </div>
  );
}
