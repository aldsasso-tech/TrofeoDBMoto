import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, getDocs, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function Iscrizione({ year }) {
  const { eventoId } = useParams();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [evento, setEvento] = useState(null);
  const [prezzi, setPrezzi] = useState({ circuito: 0, abbigliamento: 0, tesseramento: 0 });
  const [abbigliamento, setAbbigliamento] = useState(false);
  const [tesseramento, setTesseramento] = useState(false);
  const [loading, setLoading] = useState(true);
  const [invio, setInvio] = useState(false);
  const anno = String(year || 2026);

  useEffect(() => {
    if (!eventoId) return;
    Promise.all([
      getDoc(doc(db, 'anni', anno, 'calendario', eventoId)),
      getDocs(collection(db, 'anni', anno, 'prezzi')),
    ]).then(([evSnap, prezziSnap]) => {
      if (evSnap.exists()) setEvento({ id: evSnap.id, ...evSnap.data() });
      const prezzoDoc = prezziSnap.docs.find((d) => d.id === eventoId || d.data().eventoId === eventoId)?.data();
      const prezzoGenerale = prezziSnap.docs.find((d) => d.id === 'generale')?.data();
      setPrezzi({
        circuito: prezzoDoc?.prezzoCircuito ?? prezzoGenerale?.prezzoCircuito ?? 0,
        abbigliamento: prezzoDoc?.prezzoAbbigliamento ?? prezzoGenerale?.prezzoAbbigliamento ?? 0,
        tesseramento: prezzoDoc?.prezzoTesseramento ?? prezzoGenerale?.prezzoTesseramento ?? 0,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [eventoId, anno]);

  const totale = prezzi.circuito + (abbigliamento ? prezzi.abbigliamento : 0) + (tesseramento ? prezzi.tesseramento : 0);

  const handleProsegui = (e) => {
    e.preventDefault();
    setInvio(true);
    addDoc(collection(db, 'anni', anno, 'calendario', eventoId, 'partecipanti'), {
      userId: user.uid,
      email: user.email,
      nome: userProfile?.nome ?? user.displayName ?? '',
      cognome: userProfile?.cognome ?? '',
      abbigliamentoPista: abbigliamento,
      tesseramentoFMI: tesseramento,
      totale,
      statoPagamento: 'in_attesa',
      createdAt: serverTimestamp(),
    }).then(() => {
      navigate(`/pagamento/${eventoId}`);
    }).catch((err) => {
      alert('Errore: ' + (err.message || 'iscrizione non riuscita'));
    }).finally(() => setInvio(false));
  };

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
    <div className="row justify-content-center">
      <div className="col-lg-8">
        <div className="card card-trof p-4">
          <h4 className="text-white mb-4">Iscrizione evento</h4>
          <div className="card card-trof p-3 mb-4 bg-dark bg-opacity-25">
            <p className="mb-1 text-white"><strong>Data:</strong> {dataFmt} — {giorno}</p>
            <p className="mb-1 text-white"><strong>Ora:</strong> {evento.ora ?? '—'}</p>
            <p className="mb-0 text-white"><strong>Circuito:</strong> {evento.circuitoNome || evento.circuitoId}</p>
          </div>
          <form onSubmit={handleProsegui}>
            <p className="text-white mb-2">Prezzo circuito: € {prezzi.circuito.toFixed(2)}</p>
            <div className="form-check mb-2">
              <input type="checkbox" className="form-check-input" id="abb" checked={abbigliamento} onChange={(e) => setAbbigliamento(e.target.checked)} />
              <label className="form-check-label text-white" htmlFor="abb">Abbigliamento da pista — € {prezzi.abbigliamento.toFixed(2)}</label>
            </div>
            <div className="form-check mb-3">
              <input type="checkbox" className="form-check-input" id="tess" checked={tesseramento} onChange={(e) => setTesseramento(e.target.checked)} />
              <label className="form-check-label text-white" htmlFor="tess">Tesseramento FMI — € {prezzi.tesseramento.toFixed(2)}</label>
            </div>
            <p className="text-white h5 mb-3">Totale: € {totale.toFixed(2)}</p>
            <button type="submit" className="btn btn-trof" disabled={invio}>{invio ? 'Invio...' : 'Prosegui'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
