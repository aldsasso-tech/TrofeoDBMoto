import { useEffect, useState } from 'react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function AdminPrezzi() {
  const [year, setYear] = useState(2026);
  const [eventi, setEventi] = useState([]);
  const [prezzi, setPrezzi] = useState({});
  const [form, setForm] = useState({ eventoId: '', prezzoCircuito: '', prezzoAbbigliamento: '', prezzoTesseramento: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const anno = String(year);
    getDocs(collection(db, 'anni', anno, 'calendario')).then((snap) => {
      setEventi(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      return getDocs(collection(db, 'anni', anno, 'prezzi'));
    }).then((snap) => {
      const map = {};
      snap?.docs?.forEach((d) => { map[d.id] = d.data(); });
      setPrezzi(map);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [year]);

  const handleSave = async (e) => {
    e.preventDefault();
    const id = form.eventoId || 'generale';
    try {
      await setDoc(doc(db, 'anni', String(year), 'prezzi', id), {
        eventoId: form.eventoId || null,
        prezzoCircuito: Number(form.prezzoCircuito) || 0,
        prezzoAbbigliamento: Number(form.prezzoAbbigliamento) || 0,
        prezzoTesseramento: Number(form.prezzoTesseramento) || 0,
      });
      setPrezzi((prev) => ({ ...prev, [id]: { prezzoCircuito: Number(form.prezzoCircuito), prezzoAbbigliamento: Number(form.prezzoAbbigliamento), prezzoTesseramento: Number(form.prezzoTesseramento) } }));
      setForm({ eventoId: '', prezzoCircuito: '', prezzoAbbigliamento: '', prezzoTesseramento: '' });
      alert('Prezzi salvati.');
    } catch (err) {
      alert('Errore: ' + err.message);
    }
  };

  if (loading) return <div className="text-center text-white py-5">Caricamento...</div>;

  return (
    <div className="card card-trof p-4">
      <h4 className="text-white mb-4">Inserimento Prezzi {year}</h4>
      <div className="mb-3">
        <label className="text-white me-2">Anno</label>
        <select className="form-select d-inline-block w-auto" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {[2026, 2027, 2028].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <form onSubmit={handleSave} className="row g-2 mb-4">
        <div className="col-12 col-md-3">
          <select className="form-select" value={form.eventoId} onChange={(e) => setForm((f) => ({ ...f, eventoId: e.target.value }))}>
            <option value="">Prezzi generali (default)</option>
            {eventi.map((ev) => <option key={ev.id} value={ev.id}>{ev.data} — {ev.circuitoNome || ev.circuitoId}</option>)}
          </select>
        </div>
        <div className="col-6 col-md-2"><input type="number" step="0.01" className="form-control" placeholder="Prezzo circuito €" value={form.prezzoCircuito} onChange={(e) => setForm((f) => ({ ...f, prezzoCircuito: e.target.value }))} /></div>
        <div className="col-6 col-md-2"><input type="number" step="0.01" className="form-control" placeholder="Abbigliamento €" value={form.prezzoAbbigliamento} onChange={(e) => setForm((f) => ({ ...f, prezzoAbbigliamento: e.target.value }))} /></div>
        <div className="col-6 col-md-2"><input type="number" step="0.01" className="form-control" placeholder="Tesseramento FMI €" value={form.prezzoTesseramento} onChange={(e) => setForm((f) => ({ ...f, prezzoTesseramento: e.target.value }))} /></div>
        <div className="col-6 col-md-2"><button type="submit" className="btn btn-trof w-100">Salva</button></div>
      </form>
      <h6 className="text-white mb-2">Riepilogo prezzi salvati</h6>
      <div className="table-responsive">
        <table className="table table-trof">
          <thead>
            <tr><th>Evento / Generale</th><th>Circuito</th><th>Abbigliamento</th><th>Tesseramento</th></tr>
          </thead>
          <tbody>
            {Object.entries(prezzi).map(([id, p]) => (
              <tr key={id}>
                <td>{id === 'generale' ? 'Generale' : eventi.find((e) => e.id === id)?.circuitoNome || id}</td>
                <td>€ {Number(p.prezzoCircuito || 0).toFixed(2)}</td>
                <td>€ {Number(p.prezzoAbbigliamento || 0).toFixed(2)}</td>
                <td>€ {Number(p.prezzoTesseramento || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
