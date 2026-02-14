import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function EventoDetail({ year }) {
  const { eventoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [evento, setEvento] = useState(null);
  const [partecipanti, setPartecipanti] = useState([]);
  const [loading, setLoading] = useState(true);
  const anno = String(year || 2026);

  useEffect(() => {
    if (!eventoId) return;
    getDoc(doc(db, 'anni', anno, 'calendario', eventoId)).then((snap) => {
      if (snap.exists()) setEvento({ id: snap.id, ...snap.data() });
      return getDocs(collection(db, 'anni', anno, 'calendario', eventoId, 'partecipanti'));
    }).then((snap) => {
      if (snap) setPartecipanti(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [eventoId, anno]);

  if (!user) {
    return (
      <div className="card card-trof p-4 text-center">
        <p className="text-white">Area riservata. Necessaria autenticazione.</p>
        <a href="/richiedi-accesso" className="btn btn-trof">Richiedi accesso</a>
      </div>
    );
  }

  if (loading) return <div className="text-center text-white py-5">Caricamento...</div>;
  if (!evento) return <p className="text-white">Evento non trovato.</p>;

  const dataEv = new Date(evento.data);
  const dataFmt = dataEv.toLocaleDateString('it-IT');
  const giorno = dataEv.toLocaleDateString('it-IT', { weekday: 'long' });

  return (
    <div>
      <h2 className="text-white mb-3">Evento — Round {evento.round ?? '—'}</h2>
      <div className="card card-trof p-4 mb-4">
        <p className="text-white mb-1"><strong>Data:</strong> {dataFmt} — {giorno}</p>
        <p className="text-white mb-1"><strong>Ora:</strong> {evento.ora ?? '—'}</p>
        <p className="text-white mb-0"><strong>Circuito:</strong> {evento.circuitoNome || evento.circuitoId || '—'}</p>
      </div>
      <h5 className="text-white mb-2">Partecipanti</h5>
      <div className="card card-trof overflow-hidden">
        <div className="table-responsive">
          <table className="table table-trof table-hover mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Nome</th>
                <th>Cognome</th>
                <th>Abbigliamento pista</th>
                <th>Tesseramento FMI</th>
              </tr>
            </thead>
            <tbody>
              {partecipanti.map((p, i) => (
                <tr key={p.id}>
                  <td>{i + 1}</td>
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
      {partecipanti.length === 0 && <p className="text-white-50">Nessun partecipante iscritto.</p>}
    </div>
  );
}
