import { useEffect, useState } from 'react';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db, storage } from '../firebase';

export default function FotoVideo({ year }) {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const anno = String(year || 2026);
    getDocs(query(collection(db, 'anni', anno, 'media'), orderBy('createdAt', 'desc'))).then((snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMedia(list);
      setLoading(false);
    }).catch(() => {
      listAll(ref(storage, `anni/${anno}/media`)).then((res) => {
        const items = res.items.map((itemRef) => ({ id: itemRef.name, path: itemRef.fullPath, name: itemRef.name }));
        setMedia(items);
        setLoading(false);
      }).catch(() => setLoading(false));
    });
  }, [year]);

  const [urls, setUrls] = useState({});
  useEffect(() => {
    media.forEach((m) => {
      if (m.url) {
        setUrls((prev) => ({ ...prev, [m.id]: m.url }));
        return;
      }
      if (m.path && storage) {
        getDownloadURL(ref(storage, m.path)).then((url) => {
          setUrls((prev) => ({ ...prev, [m.id]: url }));
        }).catch(() => {});
      }
    });
  }, [media]);

  if (loading) return <div className="text-center text-white py-5">Caricamento foto e video...</div>;

  return (
    <div>
      <h2 className="text-white mb-4">Foto e Video {year}</h2>
      <div className="row g-3">
        {media.map((m) => {
          const url = urls[m.id] || m.url;
          const isVideo = /\.(mp4|webm|ogg)$/i.test(m.name || '') || m.tipo === 'video';
          if (!url) return <div key={m.id} className="col-12 col-md-6 col-lg-4"><div className="card card-trof p-3">Caricamento...</div></div>;
          return (
            <div key={m.id} className="col-12 col-md-6 col-lg-4">
              <div className="card card-trof overflow-hidden">
                {isVideo ? (
                  <video src={url} controls className="w-100" style={{ maxHeight: '280px' }} />
                ) : (
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt={m.nome || m.name} className="img-fluid w-100" style={{ maxHeight: '280px', objectFit: 'cover' }} />
                  </a>
                )}
                <div className="card-body py-2">
                  <small className="text-white-50">{m.titolo || m.nome || m.name || 'Media'}</small>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {media.length === 0 && <p className="text-white-50">Nessuna foto o video caricata.</p>}
    </div>
  );
}
