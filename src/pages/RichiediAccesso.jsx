import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function RichiediAccesso() {
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [gdpr, setGdpr] = useState(false);
  const [invio, setInvio] = useState(false);
  const [errore, setErrore] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErrore('');
    if (!gdpr) {
      setErrore('È obbligatorio accettare il trattamento dati (GDPR).');
      return;
    }
    setInvio(true);
    try {
      await addDoc(collection(db, 'richiesteAccesso'), {
        nome: nome.trim(),
        cognome: cognome.trim(),
        email: email.trim().toLowerCase(),
        telefono: telefono.trim(),
        gdpr: true,
        stato: 'in_attesa',
        createdAt: serverTimestamp(),
      });
      setNome(''); setCognome(''); setEmail(''); setTelefono(''); setGdpr(false);
      alert('Richiesta inviata. Riceverai una risposta via email.');
    } catch (err) {
      setErrore(err.message || 'Errore durante l\'invio.');
    } finally {
      setInvio(false);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-8 col-lg-6">
        <div className="card card-trof p-4">
          <h4 className="text-white mb-3">Richiedi accesso</h4>
          <p className="text-white-50 small">Compila tutti i campi. Dopo la richiesta un amministratore valuterà l&apos;accesso e ti invierà le credenziali via email.</p>
          {errore && <div className="alert alert-danger">{errore}</div>}
          <form onSubmit={handleSubmit}>
            <div className="row g-2">
              <div className="col-md-6">
                <label className="form-label text-white">Nome *</label>
                <input className="form-control" value={nome} onChange={(e) => setNome(e.target.value)} required />
              </div>
              <div className="col-md-6">
                <label className="form-label text-white">Cognome *</label>
                <input className="form-control" value={cognome} onChange={(e) => setCognome(e.target.value)} required />
              </div>
            </div>
            <div className="mt-2">
              <label className="form-label text-white">Indirizzo email *</label>
              <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="mt-2">
              <label className="form-label text-white">Telefono *</label>
              <input type="tel" className="form-control" value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
            </div>
            <div className="form-check mt-3">
              <input type="checkbox" className="form-check-input" id="gdpr" checked={gdpr} onChange={(e) => setGdpr(e.target.checked)} />
              <label className="form-check-label text-white" htmlFor="gdpr">Acconsento al trattamento dei miei dati personali (GDPR) *</label>
            </div>
            <button type="submit" className="btn btn-trof mt-3 w-100" disabled={invio}>{invio ? 'Invio in corso...' : 'Invia richiesta'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
