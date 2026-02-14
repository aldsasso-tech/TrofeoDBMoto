import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function Regolamento({ year }) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, 'anni', String(year), 'config', 'regolamento')).then((snap) => {
      setHtml(snap.exists() ? (snap.data().testo || '') : '');
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="text-center text-white py-5">Caricamento regolamento...</div>;

  return (
    <div className="card card-trof p-4">
      <h2 className="text-white mb-4">Regolamento</h2>
      {html ? <div className="text-white regolamento-body" dangerouslySetInnerHTML={{ __html: html }} /> : <p className="text-white-50">Il regolamento non è ancora stato pubblicato.</p>}
    </div>
  );
}
