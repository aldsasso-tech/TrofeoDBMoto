import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export default function AdminRichiesteExtra() {
  const [richieste, setRichieste] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(query(collection(db, 'richiestePartecipazioneExtra'), where('stato', '==', 'in_attesa'), orderBy('createdAt', 'desc'))).then((snap) => {
      setRichieste(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleApprova = async (r) => {
    try {
      await updateDoc(doc(db, 'richiestePartecipazioneExtra', r.id), { stato: 'approvata' });
      await addDoc(collection(db, 'mail'), {
        to: r.email,
        message: {
          subject: 'Trofeo DB Moto - Richiesta partecipazione extra approvata',
          text: `Gentile ${r.nome} ${r.cognome},\n\nLa sua richiesta di partecipazione all'evento del ${r.dataEvento} (${r.circuito}) è stata approvata. Può procedere con l'iscrizione dal calendario.\n\nCordiali saluti,\nTrofeo DB Moto`,
        },
      });
      setRichieste((prev) => prev.filter((x) => x.id !== r.id));
      alert('Richiesta approvata. L\'utente può iscriversi.');
    } catch (e) {
      alert('Errore: ' + e.message);
    }
  };

  const handleRifiuta = async (r) => {
    try {
      await updateDoc(doc(db, 'richiestePartecipazioneExtra', r.id), { stato: 'rifiutata' });
      await addDoc(collection(db, 'mail'), {
        to: r.email,
        message: {
          subject: 'Trofeo DB Moto - Richiesta partecipazione',
          text: `Gentile ${r.nome} ${r.cognome},\n\nSiamo spiacenti ma è stato raggiunto il numero massimo di piloti e non abbiamo possibilità di validare la sua richiesta. La invitiamo ad iscriversi ad altro evento.\n\nCordiali saluti,\nTrofeo DB Moto`,
        },
      });
      setRichieste((prev) => prev.filter((x) => x.id !== r.id));
      alert('Richiesta rifiutata. Email inviata.');
    } catch (e) {
      alert('Errore: ' + e.message);
    }
  };

  if (loading) return <div className="text-center text-white py-5">Caricamento...</div>;

  return (
    <div className="card card-trof p-4">
      <h4 className="text-white mb-4">Richieste partecipazione extra</h4>
      <div className="table-responsive">
        <table className="table table-trof">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Cognome</th>
              <th>Email</th>
              <th>Data evento</th>
              <th>Circuito</th>
              <th>Partecipanti</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {richieste.map((r) => (
              <tr key={r.id}>
                <td>{r.nome}</td>
                <td>{r.cognome}</td>
                <td>{r.email}</td>
                <td>{r.dataEvento}</td>
                <td>{r.circuito}</td>
                <td>{r.numeroPartecipanti ?? 24}</td>
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
