import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function RichiediDeroga({ year }) {
  const { eventoId } = useParams();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invio, setInvio] = useState(false);
  const anno = year || 2026;

  useEffect(() => {
    if (!eventoId) return;
    getDoc(doc(db, 'anni', String(anno), 'calendario', eventoId)).then((snap) => {
      if (snap.exists()) setEvento({ id: snap.id, ...snap.data() });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [eventoId, anno]);

  const handleSi = async () => {
    if (!user || !userProfile || !evento) return;
    setInvio(true);
    try {
      const payload = {
        userId: user.uid,
        nome: userProfile.nome || user.displayName || '',
        cognome: userProfile.cognome || '',
        email: user.email,
        dataEvento: evento.data,
        circuito: evento.circuitoNome || evento.circuitoId,
        numeroPartecipanti: 24,
        stato: 'in_attesa',
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'richiestePartecipazioneExtra'), payload);
      alert('Richiesta di deroga inviata. Riceverai una risposta via email.');
      navigate('/calendario');
    } catch (e) {
      alert('Errore: ' + (e.message || 'invio fallito'));
    } finally {
      setInvio(false);
    }
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
  if (!evento) return <div className="text-white">Evento non trovato.</div>;

  return (
    <div className="card card-trof p-4">
      <h5 className="text-white mb-3">Richiedi deroga</h5>
      <p className="text-white mb-4">Il numero di partecipanti per questo evento è completo. Vuoi richiedere la possibilità di partecipare?</p>
      <div className="d-flex gap-2 justify-content-center">
        <button type="button" className="btn btn-trof" onClick={handleSi} disabled={invio}>Sì</button>
        <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/calendario')}>No</button>
      </div>
    </div>
  );
}
