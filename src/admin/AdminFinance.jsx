import { useEffect, useState } from 'react';
import { collection, getDocs, getDoc, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function AdminFinance() {
  const [year, setYear] = useState(2026);
  const [data, setData] = useState({ ricavi: 0, costi: 0, cassa: 0 });
  const [pagamenti, setPagamenti] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const anno = String(year);
    getDoc(doc(db, 'anni', anno, 'config', 'finance')).then((snap) => {
      if (snap.exists()) setData(snap.data());
    }).catch(() => {});
    getDocs(collection(db, 'anni', anno, 'calendario')).then((snap) => {
      const eventi = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return Promise.all(eventi.map(async (ev) => {
        const partSnap = await getDocs(collection(db, 'anni', anno, 'calendario', ev.id, 'partecipanti'));
        return partSnap.docs.map((d) => ({ eventoId: ev.id, eventoData: ev, ...d.data(), partId: d.id }));
      }));
    }).then((lists) => {
      setPagamenti(lists.flat());
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [year]);

  const handleValidate = async (p, esito) => {
    const anno = String(year);
    const docRef = doc(db, 'anni', anno, 'calendario', p.eventoId, 'partecipanti', p.partId);
    try {
      await updateDoc(docRef, { statoPagamento: esito ? 'confermato' : 'rifiutato', validatoAt: new Date().toISOString() });
      setPagamenti((prev) => prev.map((x) => (x.partId === p.partId && x.eventoId === p.eventoId ? { ...x, statoPagamento: esito ? 'confermato' : 'rifiutato' } : x)));
      await addDoc(collection(db, 'mail'), {
        to: p.email,
        message: {
          subject: esito ? 'Trofeo DB Moto - Iscrizione confermata' : 'Trofeo DB Moto - Pagamento non riuscito',
          text: esito
            ? `Gentile ${p.nome} ${p.cognome},\n\nLa sua iscrizione è stata confermata. Evento: ${p.eventoData?.data} — ${p.eventoData?.circuitoNome || p.eventoId}.\n\nCordiali saluti,\nTrofeo DB Moto`
            : `Gentile ${p.nome} ${p.cognome},\n\nIl pagamento non è andato a buon fine. L'iscrizione non è valida.\n\nCordiali saluti,\nTrofeo DB Moto`,
        },
      });
      alert(esito ? 'Pagamento confermato. Email inviata.' : 'Pagamento rifiutato. Email inviata.');
    } catch (e) {
      alert('Errore: ' + e.message);
    }
  };

  const ricavi = pagamenti.filter((p) => p.statoPagamento === 'confermato').reduce((s, p) => s + (p.totale ?? 0), 0);
  const marginalita = ricavi - (data.costi || 0);
  const cassa = (data.cassa || 0) + ricavi - (data.costi || 0);

  if (loading) return <div className="text-center text-white py-5">Caricamento...</div>;

  return (
    <div className="card card-trof p-4">
      <h4 className="text-white mb-4">Finance {year}</h4>
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card card-trof p-3">
            <small className="text-white-50">Ricavi (confermati)</small>
            <p className="text-white h5 mb-0">€ {ricavi.toFixed(2)}</p>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card card-trof p-3">
            <small className="text-white-50">Costi</small>
            <p className="text-white h5 mb-0">€ {(data.costi || 0).toFixed(2)}</p>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card card-trof p-3">
            <small className="text-white-50">Marginalità</small>
            <p className="text-white h5 mb-0">€ {marginalita.toFixed(2)}</p>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card card-trof p-3">
            <small className="text-white-50">Cassa</small>
            <p className="text-white h5 mb-0">€ {cassa.toFixed(2)}</p>
          </div>
        </div>
      </div>
      <h6 className="text-white mb-2">Validazione pagamenti</h6>
      <div className="table-responsive">
        <table className="table table-trof">
          <thead>
            <tr>
              <th>Evento</th>
              <th>Pilota</th>
              <th>Totale</th>
              <th>Stato</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {pagamenti.map((p) => (
              <tr key={`${p.eventoId}-${p.partId}`}>
                <td>{p.eventoData?.data ?? p.eventoId}</td>
                <td>{p.nome} {p.cognome}</td>
                <td>€ {(p.totale ?? 0).toFixed(2)}</td>
                <td>{p.statoPagamento === 'confermato' ? 'Confermato' : p.statoPagamento === 'rifiutato' ? 'Rifiutato' : 'In attesa'}</td>
                <td>
                  {p.statoPagamento === 'in_attesa' && (
                    <>
                      <button type="button" className="btn btn-sm btn-success me-1" onClick={() => handleValidate(p, true)}>Conferma</button>
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => handleValidate(p, false)}>Rifiuta</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
