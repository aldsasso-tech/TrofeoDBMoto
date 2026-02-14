import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function AdminRegolamento() {
  const [year, setYear] = useState(2026);
  const [testo, setTesto] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const anno = String(year);
    getDoc(doc(db, 'anni', anno, 'config', 'regolamento')).then((snap) => {
      setTesto(snap.exists() ? snap.data().testo || '' : '');
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [year]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'anni', String(year), 'config', 'regolamento'), { testo });
      alert('Regolamento salvato.');
    } catch (e) {
      alert('Errore: ' + (e.message || 'salvataggio non riuscito'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center text-white py-5">Caricamento...</div>;

  return (
    <div className="card card-trof p-4">
      <h4 className="text-white mb-4">Inserimento Regolamento</h4>
      <div className="mb-3">
        <label className="text-white me-2">Anno</label>
        <select className="form-select d-inline-block w-auto" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {[2026, 2027, 2028].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <form onSubmit={handleSave}>
        <div className="mb-3">
          <label className="form-label text-white">Testo regolamento (HTML consentito)</label>
          <textarea className="form-control font-monospace" rows={15} value={testo} onChange={(e) => setTesto(e.target.value)} style={{ background: 'rgba(10,22,40,0.9)', color: '#e8e8e8' }} />
        </div>
        <button type="submit" className="btn btn-trof" disabled={saving}>{saving ? 'Salvataggio...' : 'Salva'}</button>
      </form>
    </div>
  );
}
