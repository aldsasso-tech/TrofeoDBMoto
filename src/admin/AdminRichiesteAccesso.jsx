import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export default function AdminRichiesteAccesso() {
  const [richieste, setRichieste] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(query(collection(db, 'richiesteAccesso'), where('stato', '==', 'in_attesa'), orderBy('createdAt', 'desc'))).then((snap) => {
      setRichieste(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleApprova = async (r) => {
    try {
      await updateDoc(doc(db, 'richiesteAccesso', r.id), { stato: 'approvata', approvataAt: new Date().toISOString() });
      setRichieste((prev) => prev.filter((x) => x.id !== r.id));
      alert('Richiesta approvata. La Cloud Function creerà l\'utente e invierà le credenziali via email.');
    } catch (e) {
      alert('Errore: ' + (e.message || 'approvazione non riuscita'));
    }
  };

  const handleRifiuta = async (r) => {
    try {
      await updateDoc(doc(db, 'richiesteAccesso', r.id), { stato: 'rifiutata', rifiutataAt: new Date().toISOString() });
      await addDoc(collection(db, 'mail'), {
        to: r.email,
        message: {
          subject: 'Trofeo DB Moto - Richiesta accesso non accolta',
          text: `Gentile ${r.nome} ${r.cognome},\n\nLa sua richiesta di accesso al portale Trofeo DB Moto non è stata accolta.\n\nCordiali saluti,\nTrofeo DB Moto`,
        },
      });
      setRichieste((prev) => prev.filter((x) => x.id !== r.id));
      alert('Richiesta rifiutata. Email di cortesia inviata.');
    } catch (e) {
      alert('Errore: ' + (e.message || 'operazione non riuscita'));
    }
  };

  if (loading) return <div className="text-center text-white py-5">Caricamento...</div>;

  return (
    <div className="card card-trof p-4">
      <h4 className="text-white mb-4">Richieste di accesso</h4>
      <div className="table-responsive">
        <table className="table table-trof">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Cognome</th>
              <th>Email</th>
              <th>Telefono</th>
              <th>Data richiesta</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {richieste.map((r) => (
              <tr key={r.id}>
                <td>{r.nome}</td>
                <td>{r.cognome}</td>
                <td>{r.email}</td>
                <td>{r.telefono}</td>
                <td>{r.createdAt?.toDate?.()?.toLocaleDateString('it-IT') ?? '—'}</td>
                <td>
                  <button type="button" className="btn btn-sm btn-success me-1" onClick={() => handleApprova(r)}>Approva</button>
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => handleRifiuta(r)}>Rifiuta</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {richieste.length === 0 && <p className="text-white-50 mb-0">Nessuna richiesta in attesa.</p>}
    </div>
  );
}
