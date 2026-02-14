import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

const PAYPAL_EMAIL = 'davide462003@yahoo.it';
const POSTEPAY_CARD = '4023601251649752';
const POSTEPAY_CF = 'BRGDVD80H22H501H';

export default function Pagamento({ year }) {
  const { eventoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tipo, setTipo] = useState(null);
  const [totale, setTotale] = useState(0);
  const [loading, setLoading] = useState(true);
  const anno = String(year || 2026);

  useEffect(() => {
    if (!eventoId || !user) return;
    const q = query(
      collection(db, 'anni', anno, 'calendario', eventoId, 'partecipanti'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    getDocs(q).then((snap) => {
      if (!snap.empty) {
        const d = snap.docs[0].data();
        setTotale(d.totale ?? 0);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [eventoId, user?.uid, anno]);

  if (!user) {
    return (
      <div className="card card-trof p-4 text-center">
        <p className="text-white">Area riservata. Necessaria autenticazione.</p>
        <a href="/richiedi-accesso" className="btn btn-trof">Richiedi accesso</a>
      </div>
    );
  }

  if (loading) return <div className="text-center text-white py-5">Caricamento...</div>;

  if (!tipo) {
    return (
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card card-trof p-4">
            <h4 className="text-white mb-4">Opzioni di pagamento</h4>
            <p className="text-white mb-3">Totale da pagare: € {totale.toFixed(2)}</p>
            <div className="d-flex flex-column gap-3">
              <button type="button" className="btn btn-trof btn-lg" onClick={() => setTipo('paypal')}>Paga con PayPal</button>
              <button type="button" className="btn btn-outline-light btn-lg" onClick={() => setTipo('postepay')}>Ricarica Postepay</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (tipo === 'paypal') {
    return (
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card card-trof p-4">
            <h4 className="text-white mb-3">Pagamento PayPal</h4>
            <div className="alert alert-warning text-dark">Utilizzare opzione <strong>Amici e familiari</strong>.</div>
            <p className="text-white mb-2">Totale importo: <strong>€ {totale.toFixed(2)}</strong></p>
            <p className="text-white-50 small">L&apos;importo verrà accreditato su PayPal di BROGLIA Davide: <strong className="text-white">{PAYPAL_EMAIL}</strong></p>
            <p className="text-white-50 small mt-3">Il pagamento sarà validato a seguito della verifica del pagamento.</p>
            <button type="button" className="btn btn-outline-light mt-2" onClick={() => navigate('/calendario')}>Torna al calendario</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-8 col-lg-6">
        <div className="card card-trof p-4">
          <h4 className="text-white mb-3">Ricarica Postepay</h4>
          <p className="text-white mb-2">Totale importo: <strong>€ {totale.toFixed(2)}</strong></p>
          <p className="text-white-50 small">Accredito su Postepay: <strong className="text-white">{POSTEPAY_CARD}</strong></p>
          <p className="text-white-50 small">Intestatario: Broglia Davide — C.F. {POSTEPAY_CF}</p>
          <p className="text-white-50 small mt-3">Il pagamento sarà validato a seguito della verifica del pagamento.</p>
          <button type="button" className="btn btn-outline-light mt-2" onClick={() => navigate('/calendario')}>Torna al calendario</button>
        </div>
      </div>
    </div>
  );
}
