import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

export default function RisultatiEvento({ year }) {
  const { eventoId } = useParams();
  const [evento, setEvento] = useState(null);
  const [risultati, setRisultati] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const anno = String(year || 2026);

  useEffect(() => {
    if (!eventoId) return;
    getDoc(doc(db, 'anni', anno, 'calendario', eventoId)).then((snap) => {
      if (snap.exists()) setEvento({ id: snap.id, ...snap.data() });
      return getDoc(doc(db, 'anni', anno, 'calendario', eventoId, 'risultati', 'dati'));
    }).then((snap) => {
      if (snap?.exists()) setRisultati(snap.data());
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [eventoId, anno]);

  useEffect(() => {
    if (!risultati?.pdfPath) return;
    getDownloadURL(ref(storage, risultati.pdfPath)).then(setPdfUrl).catch(() => {});
  }, [risultati?.pdfPath]);

  if (loading) return <div className="text-center text-white py-5">Caricamento risultati...</div>;
  if (!evento) return <p className="text-white">Evento non trovato.</p>;

  const dataEv = new Date(evento.data);
  const dataFmt = dataEv.toLocaleDateString('it-IT');
  const giorno = dataEv.toLocaleDateString('it-IT', { weekday: 'long' });

  return (
    <div>
      <h2 className="text-white mb-3">Risultati — Round {evento.round ?? '—'}</h2>
      <div className="card card-trof p-4 mb-4">
        <p className="mb-1 text-white"><strong>Data:</strong> {dataFmt} — {giorno}</p>
        <p className="mb-1 text-white"><strong>Ora:</strong> {evento.ora ?? '—'}</p>
        <p className="mb-0 text-white"><strong>Circuito:</strong> {evento.circuitoNome || evento.circuitoId}</p>
      </div>

      {risultati?.qualifiche?.length > 0 && (
        <div className="card card-trof overflow-hidden mb-4">
          <h5 className="text-white p-3 mb-0">Qualifiche</h5>
          <div className="table-responsive">
            <table className="table table-trof mb-0">
              <thead>
                <tr>
                  <th>Pos.</th>
                  <th>Pilota</th>
                  <th>Tempo</th>
                  <th>Categoria</th>
                </tr>
              </thead>
              <tbody>
                {risultati.qualifiche.map((r, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{r.pilotaNome ?? '—'}</td>
                    <td>{r.tempo ?? '—'}</td>
                    <td>{r.categoria ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {['Moto3', 'Moto2', 'MotoGP'].map((cat) => {
        const dati = risultati?.[cat.toLowerCase()] ?? risultati?.[cat];
        if (!dati?.length) return null;
        return (
          <div key={cat} className="card card-trof overflow-hidden mb-4">
            <h5 className="text-white p-3 mb-0">{cat}</h5>
            <div className="table-responsive">
              <table className="table table-trof mb-0">
                <thead>
                  <tr>
                    <th>Pos.</th>
                    <th>Pilota</th>
                    <th>Gara1-Pos</th>
                    <th>Gara1-Punti</th>
                    <th>Gara2-Pos</th>
                    <th>Gara2-Punti</th>
                  </tr>
                </thead>
                <tbody>
                  {dati.map((r, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{r.pilotaNome ?? '—'}</td>
                      <td>{r.gara1Pos ?? '—'}</td>
                      <td>{r.gara1Punti ?? '—'}</td>
                      <td>{r.gara2Pos ?? '—'}</td>
                      <td>{r.gara2Punti ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {pdfUrl && (
        <div className="card card-trof p-3">
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn-trof">Scarica PDF tempi</a>
        </div>
      )}

      {!risultati && !loading && <p className="text-white-50">Risultati non ancora inseriti per questo evento.</p>}
    </div>
  );
}
