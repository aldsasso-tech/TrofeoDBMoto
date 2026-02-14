import { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../firebase';
import { PUNTI_GARA } from '../constants';

export default function AdminRisultati() {
  const [year, setYear] = useState(2026);
  const [eventi, setEventi] = useState([]);
  const [piloti, setPiloti] = useState([]);
  const [selectedEvento, setSelectedEvento] = useState(null);
  const [risultati, setRisultati] = useState({ qualifiche: [], moto3: [], moto2: [], motogp: [] });
  const [pdfFile, setPdfFile] = useState(null);
  const [partecipantiEvento, setPartecipantiEvento] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const oggi = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const anno = String(year);
    getDocs(collection(db, 'anni', anno, 'calendario')).then((snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((e) => e.data <= oggi);
      setEventi(list);
      return getDocs(collection(db, 'anni', anno, 'piloti'));
    }).then((snap) => {
      setPiloti(snap?.docs?.map((d) => ({ id: d.id, ...d.data() })) ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [year]);

  useEffect(() => {
    if (!selectedEvento) return;
    const anno = String(year);
    getDoc(doc(db, 'anni', anno, 'calendario', selectedEvento.id, 'risultati', 'dati')).then((snap) => {
      if (snap.exists()) setRisultati(snap.data());
      else setRisultati({ qualifiche: [], moto3: Array(8).fill(null).map(() => ({})), moto2: Array(8).fill(null).map(() => ({})), motogp: Array(8).fill(null).map(() => ({})) });
    }).catch(() => setRisultati({ qualifiche: [], moto3: Array(8).fill(null).map(() => ({})), moto2: Array(8).fill(null).map(() => ({})), motogp: Array(8).fill(null).map(() => ({})) }));
  }, [selectedEvento, year]);

  useEffect(() => {
    if (!selectedEvento) {
      setPartecipantiEvento([]);
      return;
    }
    const anno = String(year);
    getDocs(collection(db, 'anni', anno, 'calendario', selectedEvento.id, 'partecipanti')).then((snap) => {
      const part = snap.docs.map((d) => {
        const data = d.data();
        return { id: data.userId || d.id, nome: data.nome || '', cognome: data.cognome || '' };
      });
      setPartecipantiEvento(part);
    }).catch(() => setPartecipantiEvento([]));
  }, [selectedEvento, year]);

  const partecipanti = partecipantiEvento.length > 0 ? partecipantiEvento : piloti;

  const puntiGara = (pos) => PUNTI_GARA[pos] ?? 0;

  const updateQualifica = (i, field, value) => {
    setRisultati((r) => {
      const q = [...(r.qualifiche || [])];
      while (q.length <= i) q.push({});
      q[i] = { ...q[i], [field]: value };
      return { ...r, qualifiche: q };
    });
  };

  const updateGara = (cat, i, field, value) => {
    const key = cat.toLowerCase();
    setRisultati((r) => {
      const arr = [...(r[key] || Array(8).fill(null).map(() => ({})))];
      while (arr.length <= i) arr.push({});
      arr[i] = { ...arr[i], [field]: value };
      if (field === 'gara1Pos') arr[i].gara1Punti = puntiGara(Number(value));
      if (field === 'gara2Pos') arr[i].gara2Punti = puntiGara(Number(value));
      return { ...r, [key]: arr };
    });
  };

  const addRow = (cat) => {
    const key = cat.toLowerCase();
    setRisultati((r) => ({ ...r, [key]: [...(r[key] || []), {}] }));
  };
  const removeRow = (cat, i) => {
    const key = cat.toLowerCase();
    setRisultati((r) => ({ ...r, [key]: (r[key] || []).filter((_, j) => j !== i) }));
  };

  const handleSave = async () => {
    if (!selectedEvento) return;
    setSaving(true);
    const anno = String(year);
    let pdfPath = risultati.pdfPath;
    if (pdfFile) {
      const path = `anni/${anno}/risultati/${selectedEvento.id}/tempi.pdf`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, pdfFile);
      pdfPath = path;
    }
    const payload = {
      ...risultati,
      pdfPath: pdfPath || risultati.pdfPath,
      qualifiche: (risultati.qualifiche || []).map((q, i) => ({ ...q, pilotaNome: partecipanti.find((p) => p.id === q.pilotaId)?.nome + ' ' + partecipanti.find((p) => p.id === q.pilotaId)?.cognome })),
    };
    ['moto3', 'moto2', 'motogp'].forEach((k) => {
      if (payload[k]) payload[k] = payload[k].map((row, i) => ({
        ...row,
        pilotaNome: partecipanti.find((p) => p.id === row.pilotaId)?.nome + ' ' + partecipanti.find((p) => p.id === row.pilotaId)?.cognome,
        gara1Punti: row.gara1Pos != null ? puntiGara(Number(row.gara1Pos)) : row.gara1Punti,
        gara2Punti: row.gara2Pos != null ? puntiGara(Number(row.gara2Pos)) : row.gara2Punti,
      }));
    });
    try {
      await setDoc(doc(db, 'anni', anno, 'calendario', selectedEvento.id, 'risultati', 'dati'), payload);
      await setDoc(doc(db, 'anni', anno, 'calendario', selectedEvento.id), { risultatiInseriti: true }, { merge: true });
      alert('Risultati salvati.');
    } catch (e) {
      alert('Errore: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center text-white py-5">Caricamento...</div>;

  return (
    <div className="card card-trof p-4">
      <h4 className="text-white mb-4">Inserimento risultati {year}</h4>
      <div className="mb-3">
        <label className="text-white me-2">Anno</label>
        <select className="form-select d-inline-block w-auto" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {[2026, 2027, 2028].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <p className="text-white-50 small mb-3">Eventi con data ≤ oggi. Seleziona un evento per inserire qualifiche e classifiche.</p>
      <div className="row g-2 mb-4">
        {eventi.map((ev) => (
          <div key={ev.id} className="col-12 col-md-6 col-lg-4">
            <button type="button" className={`btn w-100 ${selectedEvento?.id === ev.id ? 'btn-trof' : 'btn-outline-light'}`} onClick={() => setSelectedEvento(ev)}>
              {ev.data} — {ev.circuitoNome || ev.circuitoId} (Round {ev.round})
            </button>
          </div>
        ))}
      </div>

      {selectedEvento && (
        <>
          <div className="mb-3">
            <label className="text-white me-2">PDF tempi</label>
            <input type="file" accept=".pdf" className="form-control d-inline-block w-auto" onChange={(e) => setPdfFile(e.target.files?.[0])} />
          </div>

          <h6 className="text-white mt-3">Qualifiche</h6>
          <div className="table-responsive mb-3">
            <table className="table table-trof">
              <thead>
                <tr><th>Pos.</th><th>Pilota</th><th>Tempo (mm:ss,000)</th><th>Categoria</th></tr>
              </thead>
              <tbody>
                {(risultati.qualifiche || []).map((q, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>
                      <select className="form-select form-select-sm" value={q.pilotaId || ''} onChange={(e) => updateQualifica(i, 'pilotaId', e.target.value)}>
                        <option value="">—</option>
                        {partecipanti.map((p) => <option key={p.id} value={p.id}>{p.nome} {p.cognome}</option>)}
                      </select>
                    </td>
                    <td><input type="text" className="form-control form-control-sm" placeholder="mm:ss,000" value={q.tempo || ''} onChange={(e) => updateQualifica(i, 'tempo', e.target.value)} /></td>
                    <td>
                      <select className="form-select form-select-sm" value={q.categoria || ''} onChange={(e) => updateQualifica(i, 'categoria', e.target.value)}>
                        <option value="">—</option>
                        <option value="Moto3">Moto3</option>
                        <option value="Moto2">Moto2</option>
                        <option value="MotoGP">MotoGP</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {['Moto3', 'Moto2', 'MotoGP'].map((cat) => (
            <div key={cat} className="mb-4">
              <h6 className="text-white">{cat}</h6>
              <div className="table-responsive">
                <table className="table table-trof">
                  <thead>
                    <tr>
                      <th>Pos.</th>
                      <th>Pilota</th>
                      <th>Gara1-Pos</th>
                      <th>Gara1-Punti</th>
                      <th>Gara2-Pos</th>
                      <th>Gara2-Punti</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(risultati[cat.toLowerCase()] || []).map((row, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>
                          <select className="form-select form-select-sm" value={row.pilotaId || ''} onChange={(e) => updateGara(cat, i, 'pilotaId', e.target.value)}>
                            <option value="">—</option>
                            {partecipanti.map((p) => <option key={p.id} value={p.id}>{p.nome} {p.cognome}</option>)}
                          </select>
                        </td>
                        <td>
                          <select className="form-select form-select-sm" value={row.gara1Pos ?? ''} onChange={(e) => updateGara(cat, i, 'gara1Pos', e.target.value)}>
                            <option value="">—</option>
                            {[1,2,3,4,5,6,7,8,9,10].map((n) => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </td>
                        <td>{row.gara1Punti ?? '—'}</td>
                        <td>
                          <select className="form-select form-select-sm" value={row.gara2Pos ?? ''} onChange={(e) => updateGara(cat, i, 'gara2Pos', e.target.value)}>
                            <option value="">—</option>
                            {[1,2,3,4,5,6,7,8,9,10].map((n) => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </td>
                        <td>{row.gara2Punti ?? '—'}</td>
                        <td><button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeRow(cat, i)}>Elimina</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" className="btn btn-sm btn-outline-light" onClick={() => addRow(cat)}>Aggiungi riga</button>
            </div>
          ))}

          <button type="button" className="btn btn-trof" onClick={handleSave} disabled={saving}>{saving ? 'Salvataggio...' : 'Salva risultati'}</button>
        </>
      )}
    </div>
  );
}
