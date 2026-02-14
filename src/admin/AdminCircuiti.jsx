import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export default function AdminCircuiti() {
  const [year, setYear] = useState(2026);
  const [circuiti, setCircuiti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nome: '', lunghezza: '', larghezza: '', curveSinistra: '', curveDestra: '', rettilineoPiuLungo: '', indirizzo: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const anno = String(year);
    getDocs(collection(db, 'anni', anno, 'circuiti')).then((snap) => {
      setCircuiti(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [year]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      nome: form.nome.trim(),
      lunghezza: form.lunghezza || null,
      larghezza: form.larghezza || null,
      curveSinistra: form.curveSinistra || null,
      curveDestra: form.curveDestra || null,
      rettilineoPiuLungo: form.rettilineoPiuLungo || null,
      indirizzo: form.indirizzo || null,
    };
    try {
      if (editingId) {
        await updateDoc(doc(db, 'anni', String(year), 'circuiti', editingId), payload);
        setCircuiti((prev) => prev.map((c) => (c.id === editingId ? { ...c, ...payload } : c)));
        setEditingId(null);
      } else {
        const ref = await addDoc(collection(db, 'anni', String(year), 'circuiti'), payload);
        setCircuiti((prev) => [...prev, { id: ref.id, ...payload }]);
      }
      setForm({ nome: '', lunghezza: '', larghezza: '', curveSinistra: '', curveDestra: '', rettilineoPiuLungo: '', indirizzo: '' });
    } catch (err) {
      alert('Errore: ' + (err.message || 'salvataggio non riuscito'));
    }
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setForm({
      nome: c.nome || '',
      lunghezza: c.lunghezza ?? '',
      larghezza: c.larghezza ?? '',
      curveSinistra: c.curveSinistra ?? '',
      curveDestra: c.curveDestra ?? '',
      rettilineoPiuLungo: c.rettilineoPiuLungo ?? '',
      indirizzo: c.indirizzo ?? '',
    });
  };

  if (loading) return <div className="text-center text-white py-5">Caricamento...</div>;

  return (
    <div className="card card-trof p-4">
      <h4 className="text-white mb-4">Inserimento Circuiti {year}</h4>
      <div className="mb-3">
        <label className="text-white me-2">Anno</label>
        <select className="form-select d-inline-block w-auto" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {[2026, 2027, 2028].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="row g-2">
          <div className="col-12 col-md-6"><input type="text" className="form-control" placeholder="Nome" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} required /></div>
          <div className="col-6 col-md-2"><input type="text" className="form-control" placeholder="Lunghezza" value={form.lunghezza} onChange={(e) => setForm((f) => ({ ...f, lunghezza: e.target.value }))} /></div>
          <div className="col-6 col-md-2"><input type="text" className="form-control" placeholder="Larghezza" value={form.larghezza} onChange={(e) => setForm((f) => ({ ...f, larghezza: e.target.value }))} /></div>
          <div className="col-6 col-md-2"><input type="text" className="form-control" placeholder="Curve sx" value={form.curveSinistra} onChange={(e) => setForm((f) => ({ ...f, curveSinistra: e.target.value }))} /></div>
          <div className="col-6 col-md-2"><input type="text" className="form-control" placeholder="Curve dx" value={form.curveDestra} onChange={(e) => setForm((f) => ({ ...f, curveDestra: e.target.value }))} /></div>
          <div className="col-12 col-md-4"><input type="text" className="form-control" placeholder="Rettilineo più lungo" value={form.rettilineoPiuLungo} onChange={(e) => setForm((f) => ({ ...f, rettilineoPiuLungo: e.target.value }))} /></div>
          <div className="col-12 col-md-4"><input type="text" className="form-control" placeholder="Indirizzo" value={form.indirizzo} onChange={(e) => setForm((f) => ({ ...f, indirizzo: e.target.value }))} /></div>
          <div className="col-12 col-md-2"><button type="submit" className="btn btn-trof w-100">{editingId ? 'Aggiorna' : 'Aggiungi'}</button></div>
        </div>
      </form>
      <div className="table-responsive">
        <table className="table table-trof">
          <thead>
            <tr><th>Nome</th><th>Lunghezza</th><th>Indirizzo</th><th></th></tr>
          </thead>
          <tbody>
            {circuiti.map((c) => (
              <tr key={c.id}>
                <td>{c.nome}</td>
                <td>{c.lunghezza ?? '—'}</td>
                <td>{c.indirizzo ?? '—'}</td>
                <td><button type="button" className="btn btn-sm btn-outline-light" onClick={() => startEdit(c)}>Modifica</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
