import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export default function AdminCalendario() {
  const [year, setYear] = useState(2026);
  const [eventi, setEventi] = useState([]);
  const [circuiti, setCircuiti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ data: '', ora: '', circuitoId: '', circuitoNome: '', round: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const anno = String(year);
    Promise.all([
      getDocs(query(collection(db, 'anni', anno, 'calendario'), orderBy('data', 'asc'))),
      getDocs(collection(db, 'anni', anno, 'circuiti')),
    ]).then(([calSnap, circSnap]) => {
      setEventi(calSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setCircuiti(circSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [year]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addDoc(collection(db, 'anni', String(year), 'calendario'), {
        data: form.data,
        ora: form.ora,
        circuitoId: form.circuitoId,
        circuitoNome: circuiti.find((c) => c.id === form.circuitoId)?.nome || form.circuitoNome,
        round: form.round ? Number(form.round) : eventi.length + 1,
      });
      setForm({ data: '', ora: '', circuitoId: '', circuitoNome: '', round: '' });
      setEventi((prev) => [...prev, { data: form.data, ora: form.ora, circuitoId: form.circuitoId, round: form.round || eventi.length + 1 }]);
      alert('Evento aggiunto.');
    } catch (e) {
      alert('Errore: ' + (e.message || 'aggiunta non riuscita'));
    } finally {
      setSaving(false);
    }
  };

  const toggleIscrizioni = async (ev) => {
    try {
      await updateDoc(doc(db, 'anni', String(year), 'calendario', ev.id), { iscrizioniChiuse: !ev.iscrizioniChiuse });
      setEventi((prev) => prev.map((e) => (e.id === ev.id ? { ...e, iscrizioniChiuse: !e.iscrizioniChiuse } : e)));
    } catch (e) {
      alert('Errore: ' + e.message);
    }
  };

  if (loading) return <div className="text-center text-white py-5">Caricamento...</div>;

  return (
    <div className="card card-trof p-4">
      <h4 className="text-white mb-4">Inserimento Calendario</h4>
      <div className="mb-3">
        <label className="text-white me-2">Anno</label>
        <select className="form-select d-inline-block w-auto" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {[2026, 2027, 2028].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <form onSubmit={handleAdd} className="row g-2 mb-4">
        <div className="col-6 col-md-2">
          <input type="date" className="form-control" value={form.data} onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))} required />
        </div>
        <div className="col-6 col-md-2">
          <input type="text" className="form-control" placeholder="Ora" value={form.ora} onChange={(e) => setForm((f) => ({ ...f, ora: e.target.value }))} />
        </div>
        <div className="col-6 col-md-2">
          <select className="form-select" value={form.circuitoId} onChange={(e) => setForm((f) => ({ ...f, circuitoId: e.target.value }))}>
            <option value="">Circuito</option>
            {circuiti.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div className="col-6 col-md-2">
          <input type="number" className="form-control" placeholder="Round" value={form.round} onChange={(e) => setForm((f) => ({ ...f, round: e.target.value }))} />
        </div>
        <div className="col-12 col-md-2">
          <button type="submit" className="btn btn-trof w-100" disabled={saving}>{saving ? '...' : 'Aggiungi'}</button>
        </div>
      </form>
      <h6 className="text-white mb-2">Eventi — Chiudi iscrizioni</h6>
      <div className="table-responsive">
        <table className="table table-trof">
          <thead>
            <tr>
              <th>Data</th>
              <th>Ora</th>
              <th>Circuito</th>
              <th>Round</th>
              <th>Iscrizioni</th>
            </tr>
          </thead>
          <tbody>
            {eventi.map((ev) => (
              <tr key={ev.id}>
                <td>{ev.data}</td>
                <td>{ev.ora}</td>
                <td>{ev.circuitoNome || ev.circuitoId}</td>
                <td>{ev.round}</td>
                <td>
                  <button type="button" className="btn btn-sm btn-outline-warning" onClick={() => toggleIscrizioni(ev)}>
                    {ev.iscrizioniChiuse ? 'Riapri' : 'Chiudi'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
