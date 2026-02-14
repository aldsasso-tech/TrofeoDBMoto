import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export default function AdminPiloti() {
  const [year, setYear] = useState(2026);
  const [piloti, setPiloti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nome: '', cognome: '', eta: '', peso: '', scadenzaFMI: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const anno = String(year);
    getDocs(query(collection(db, 'anni', anno, 'piloti'), orderBy('cognome'))).then((snap) => {
      setPiloti(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [year]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { nome: form.nome.trim(), cognome: form.cognome.trim(), eta: form.eta ? Number(form.eta) : null, peso: form.peso ? Number(form.peso) : null, scadenzaFMI: form.scadenzaFMI || null };
    try {
      if (editingId) {
        await updateDoc(doc(db, 'anni', String(year), 'piloti', editingId), payload);
        setPiloti((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...payload } : p)));
        setEditingId(null);
      } else {
        const ref = await addDoc(collection(db, 'anni', String(year), 'piloti'), payload);
        setPiloti((prev) => [...prev, { id: ref.id, ...payload }]);
      }
      setForm({ nome: '', cognome: '', eta: '', peso: '', scadenzaFMI: '' });
    } catch (err) {
      alert('Errore: ' + (err.message || 'salvataggio non riuscito'));
    }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({ nome: p.nome || '', cognome: p.cognome || '', eta: p.eta ?? '', peso: p.peso ?? '', scadenzaFMI: p.scadenzaFMI || '' });
  };

  if (loading) return <div className="text-center text-white py-5">Caricamento...</div>;

  return (
    <div className="card card-trof p-4">
      <h4 className="text-white mb-4">Inserimento Piloti {year}</h4>
      <div className="mb-3">
        <label className="text-white me-2">Anno</label>
        <select className="form-select d-inline-block w-auto" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {[2026, 2027, 2028].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <form onSubmit={handleSubmit} className="row g-2 mb-4">
        <div className="col-6 col-md-2"><input type="text" className="form-control" placeholder="Nome" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} required /></div>
        <div className="col-6 col-md-2"><input type="text" className="form-control" placeholder="Cognome" value={form.cognome} onChange={(e) => setForm((f) => ({ ...f, cognome: e.target.value }))} required /></div>
        <div className="col-6 col-md-2"><input type="number" className="form-control" placeholder="Età" value={form.eta} onChange={(e) => setForm((f) => ({ ...f, eta: e.target.value }))} /></div>
        <div className="col-6 col-md-2"><input type="number" step="0.01" className="form-control" placeholder="Peso (kg)" value={form.peso} onChange={(e) => setForm((f) => ({ ...f, peso: e.target.value }))} /></div>
        <div className="col-6 col-md-2"><input type="text" className="form-control" placeholder="Scadenza FMI" value={form.scadenzaFMI} onChange={(e) => setForm((f) => ({ ...f, scadenzaFMI: e.target.value }))} /></div>
        <div className="col-6 col-md-2"><button type="submit" className="btn btn-trof w-100">{editingId ? 'Aggiorna' : 'Aggiungi'}</button></div>
      </form>
      <div className="table-responsive">
        <table className="table table-trof">
          <thead>
            <tr><th>Nome</th><th>Cognome</th><th>Età</th><th>Peso</th><th>Scadenza FMI</th><th></th></tr>
          </thead>
          <tbody>
            {piloti.map((p) => (
              <tr key={p.id}>
                <td>{p.nome}</td>
                <td>{p.cognome}</td>
                <td>{p.eta ?? '—'}</td>
                <td>{p.peso ?? '—'}</td>
                <td>{p.scadenzaFMI ?? '—'}</td>
                <td><button type="button" className="btn btn-sm btn-outline-light" onClick={() => startEdit(p)}>Modifica</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
