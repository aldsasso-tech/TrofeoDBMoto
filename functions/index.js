/**
 * Cloud Functions per Trofeo DB Moto
 *
 * 1. onRichiestaAccessoApproved: quando una richiesta accesso passa a "approvata",
 *    crea l'utente in Firebase Auth con password temporanea e invia email con credenziali.
 *
 * 2. onRisultatiSaved: quando vengono salvati i risultati di un evento,
 *    ricalcola la classifica generale e la salva in anni/{year}/config/classificaGenerale.
 *
 * Configurare l'estensione "Trigger Email from Firestore" sulla collection "mail"
 * (formato documenti: to, message: { subject, text }).
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

const PUNTI_CLASSIFICA = {
  1: 100, 2: 95, 3: 90, 4: 86, 5: 82, 6: 79, 7: 77, 8: 75, 9: 70, 10: 67,
  11: 64, 12: 61, 13: 58, 14: 56, 15: 54, 16: 52, 17: 45, 18: 42, 19: 39, 20: 36,
  21: 33, 22: 31, 23: 29, 24: 27,
};

function generaPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let p = '';
  for (let i = 0; i < 12; i++) p += chars.charAt(Math.floor(Math.random() * chars.length));
  return p;
}

exports.onRichiestaAccessoApproved = functions.firestore
  .document('richiesteAccesso/{id}')
  .onUpdate(async (change, context) => {
    const after = change.after.data();
    const before = change.before.data();
    if (after.stato !== 'approvata' || before.stato === 'approvata') return;

    const email = after.email;
    const nome = after.nome || '';
    const cognome = after.cognome || '';
    const password = generaPassword();

    try {
      const userRecord = await auth.createUser({
        email,
        emailVerified: false,
        password,
        displayName: `${nome} ${cognome}`.trim(),
      });

      await db.collection('users').doc(userRecord.uid).set({
        email,
        nome,
        cognome,
        role: 'user',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await db.collection('mail').add({
        to: email,
        message: {
          subject: 'Trofeo DB Moto - Credenziali di accesso',
          text: `Gentile ${nome} ${cognome},\n\nLa sua richiesta di accesso è stata approvata.\nCredenziali:\nEmail: ${email}\nPassword: ${password}\n\nAcceda al portale e cambia la password se necessario.\n\nCordiali saluti,\nTrofeo DB Moto`,
        },
      });
    } catch (e) {
      console.error('Errore creazione utente o invio mail:', e);
    }
  });

exports.onRisultatiSaved = functions.firestore
  .document('anni/{year}/calendario/{eventoId}/risultati/dati')
  .onWrite(async (change, context) => {
    const { year, eventoId } = context.params;
    const snapshot = change.after;
    if (!snapshot.exists) return;

    const pilotiSnap = await db.collection('anni').doc(year).collection('piloti').get();
    const pilotiMap = {};
    pilotiSnap.docs.forEach((d) => {
      pilotiMap[d.id] = { pilotaId: d.id, ...d.data() };
    });

    const eventiSnap = await db.collection('anni').doc(year).collection('calendario').orderBy('data', 'asc').get();
    const eventiChiusi = eventiSnap.docs.filter((d) => {
      const data = d.data().data;
      return data && data <= new Date().toISOString().slice(0, 10);
    });

    const puntiPerEvento = {};
    for (const evDoc of eventiChiusi) {
      const evId = evDoc.id;
      const resSnap = await db.collection('anni').doc(year).collection('calendario').doc(evId).collection('risultati').doc('dati').get();
      if (!resSnap.exists) continue;
      const dati = resSnap.data();
      const moto3 = dati.moto3 || [];
      const moto2 = dati.moto2 || [];
      const motogp = dati.motogp || [];
      const tutte = [...moto3, ...moto2, ...motogp];
      tutte.forEach((r, idx) => {
        const pid = r.pilotaId;
        if (!pid) return;
        const pos = idx + 1;
        const punti = PUNTI_CLASSIFICA[pos] || 0;
        if (!puntiPerEvento[pid]) puntiPerEvento[pid] = { puntiTotali: 0, eventi: {} };
        puntiPerEvento[pid].puntiTotali += punti;
        puntiPerEvento[pid].eventi[evId] = { posizione: pos, punti };
      });
    }

    const pilotiIds = Object.keys(puntiPerEvento);
    const classifica = pilotiIds.map((pid) => {
      const p = pilotiMap[pid] || {};
      const ev = puntiPerEvento[pid];
      const eventiDisputati = Object.keys(ev.eventi).length;
      return {
        pilotaId: pid,
        nome: p.nome,
        cognome: p.cognome,
        eta: p.eta,
        peso: p.peso,
        punti: ev.puntiTotali,
        eventiDisputati,
        eventiDettaglio: ev.eventi,
      };
    }).sort((a, b) => b.punti - a.punti);

    await db.collection('anni').doc(year).collection('config').doc('classificaGenerale').set({
      piloti: classifica,
      aggiornatoIl: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
