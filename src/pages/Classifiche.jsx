import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getCategoriaEta, getCategoriaPeso, PUNTI_CLASSIFICA_GENERALE } from '../constants';

export default function Classifiche({ year }) {
  const [tab, setTab] = useState('eventi');
  const [eventi, setEventi] = useState([]);
  const [classificaGenerale, setClassificaGenerale] = useState([]);
  const [loading, setLoading] = useState(true);
  const anno = String(year || 2026);

  useEffect(() => {
    getDocs(query(collection(db, 'anni', anno, 'calendario'), orderBy('data', 'asc'))).then((snap) => {
      setEventi(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      return getDoc(doc(db, 'anni', anno, 'config', 'classificaGenerale'));
    }).then((snap) => {
      if (snap?.exists()) setClassificaGenerale(snap.data().piloti || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [anno]);

  const filtroEta = (cat) => classificaGenerale.filter((p) => getCategoriaEta(p.eta) === cat);
  const filtroPeso = (cat) => classificaGenerale.filter((p) => getCategoriaPeso(p.peso) === cat);

  if (loading) return <div className="text-center text-white py-5">Caricamento classifiche...</div>;

  return (
    <div>
      <h2 className="text-white mb-4">Classifiche {year}</h2>
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item"><button type="button" className={`nav-link ${tab === 'eventi' ? 'active' : ''}`} onClick={() => setTab('eventi')}>Per evento</button></li>
        <li className="nav-item"><button type="button" className={`nav-link ${tab === 'assoluta' ? 'active' : ''}`} onClick={() => setTab('assoluta')}>Generale assoluta</button></li>
        <li className="nav-item"><button type="button" className={`nav-link ${tab === 'eta' ? 'active' : ''}`} onClick={() => setTab('eta')}>Per età</button></li>
        <li className="nav-item"><button type="button" className={`nav-link ${tab === 'peso' ? 'active' : ''}`} onClick={() => setTab('peso')}>Per peso</button></li>
      </ul>

      {tab === 'eventi' && (
        <div className="row g-3">
          {eventi.map((ev, idx) => (
            <div key={ev.id} className="col-12 col-md-6 col-lg-4">
              <Link to={`/risultati/${ev.id}`} className="text-decoration-none">
                <div className="card card-trof p-3 h-100 hover-shadow">
                  <h6 className="text-white">Round {ev.round ?? idx + 1}</h6>
                  <p className="mb-0 text-white-50 small">{ev.data} — {ev.circuitoNome || ev.circuitoId}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {tab === 'assoluta' && (
        <div className="card card-trof overflow-hidden">
          <div className="table-responsive">
            <table className="table table-trof mb-0">
              <thead>
                <tr>
                  <th>Pos.</th>
                  <th>Pilota</th>
                  <th>Punti</th>
                  <th>GAP</th>
                  <th>Eventi disp.</th>
                  <th>Età</th>
                  <th>Peso</th>
                  <th>Cat.Età</th>
                  <th>Cat.Peso</th>
                </tr>
              </thead>
              <tbody>
                {classificaGenerale.map((p, i) => (
                  <tr key={p.pilotaId || i}>
                    <td>{i + 1}</td>
                    <td>{p.nome} {p.cognome}</td>
                    <td>{p.punti ?? 0}</td>
                    <td>{classificaGenerale[0] ? (classificaGenerale[0].punti ?? 0) - (p.punti ?? 0) : 0}</td>
                    <td>{p.eventiDisputati ?? 0}</td>
                    <td>{p.eta ?? '—'}</td>
                    <td>{p.peso ?? '—'}</td>
                    <td>{getCategoriaEta(p.eta)}</td>
                    <td>{getCategoriaPeso(p.peso)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {classificaGenerale.length === 0 && <p className="text-white-50 p-3 mb-0">Classifica non ancora calcolata.</p>}
        </div>
      )}

      {tab === 'eta' && (
        <>
          <h5 className="text-white mt-3">Junior (≤34 anni)</h5>
          <TabellaClassifica piloti={filtroEta('Junior')} />
          <h5 className="text-white mt-4">Middle (35-49)</h5>
          <TabellaClassifica piloti={filtroEta('Middle')} />
          <h5 className="text-white mt-4">Senior (≥50)</h5>
          <TabellaClassifica piloti={filtroEta('Senior')} />
        </>
      )}

      {tab === 'peso' && (
        <>
          <h5 className="text-white mt-3">Light (≤79,63 kg)</h5>
          <TabellaClassifica piloti={filtroPeso('Light')} />
          <h5 className="text-white mt-4">Medium (79,64-92,31 kg)</h5>
          <TabellaClassifica piloti={filtroPeso('Medium')} />
          <h5 className="text-white mt-4">Strong (≥92,32 kg)</h5>
          <TabellaClassifica piloti={filtroPeso('Strong')} />
        </>
      )}
    </div>
  );
}

function TabellaClassifica({ piloti }) {
  const maxPunti = piloti[0]?.punti ?? 0;
  return (
    <div className="card card-trof overflow-hidden mb-3">
      <div className="table-responsive">
        <table className="table table-trof mb-0">
          <thead>
            <tr>
              <th>Pos.</th>
              <th>Pilota</th>
              <th>Punti</th>
              <th>GAP</th>
            </tr>
          </thead>
          <tbody>
            {piloti.map((p, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{p.nome} {p.cognome}</td>
                <td>{p.punti ?? 0}</td>
                <td>{maxPunti - (p.punti ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {piloti.length === 0 && <p className="text-white-50 p-2 mb-0 small">Nessun pilota in questa categoria.</p>}
    </div>
  );
}
