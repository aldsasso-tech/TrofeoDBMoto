import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export default function AdminCalendarioPartecipanti() {
  const [year, setYear] = useState(2026);
  const [eventi, setEventi] = useState([]);
  const [partecipantiPerEvento, setPartecipantiPerEvento] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const anno = String(year);
    getDocs(query(collection(db, 'anni', anno, 'calendario'), orderBy('data', 'asc'))).then((snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setEventi(list);
      return Promise.all(list.map(async (ev) => {
        const partSnap = await getDocs(collection(db, 'anni', anno, 'calendario', ev.id, 'partecipanti'));
        const part = partSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const totaleGara = part.reduce((s, p) => s + (p.totale ?? 0), 0);
        const totAbb = part.filter((p) => p.abbigliamentoPista).length;
        const totTess = part.filter((p) => p.tesseramentoFMI).length;
        return [ev.id, { part, totaleGara, totAbb, totTess }];
      }));
    }).then((results) => {
      const map = {};
      results.forEach(([id, data]) => { map[id] = data; });
      setPartecipantiPerEvento(map);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="text-center text-white py-5">Caricamento...</div>;

  return (
    <div className="card card-trof p-4">
      <h4 className="text-white mb-4">Calendario partecipanti {year}</h4>
      <div className="mb-3">
        <label className="text-white me-2">Anno</label>
        <select className="form-select d-inline-block w-auto" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {[2026, 2027, 2028].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      {eventi.map((ev) => {
        const data = partecipantiPerEvento[ev.id];
        if (!data) return null;
        const { part, totaleGara, totAbb, totTess } = data;
        return (
          <div key={ev.id} className="card card-trof p-3 mb-3">
            <h6 className="text-white">{ev.data} — {ev.circuitoNome || ev.circuitoId} (Round {ev.round})</h6>
            <p className="text-white-50 small mb-2">Totale piloti: {part.length} — Totale prezzo gara: € {totaleGara.toFixed(2)} — Totale abbigliamento pista: {totAbb} — Totale Tesseramento FMI: {totTess}</p>
            <div className="table-responsive">
              <table className="table table-trof table-sm">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Cognome</th>
                    <th>Abbigliamento pista</th>
                    <th>Tesseramento FMI</th>
                  </tr>
                </thead>
                <tbody>
                  {part.map((p) => (
                    <tr key={p.id}>
                      <td>{p.nome ?? '—'}</td>
                      <td>{p.cognome ?? '—'}</td>
                      <td>{p.abbigliamentoPista ? 'Sì' : 'No'}</td>
                      <td>{p.tesseramentoFMI ? 'Sì' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
      {eventi.length === 0 && <p className="text-white-50">Nessun evento.</p>}
    </div>
  );
}
