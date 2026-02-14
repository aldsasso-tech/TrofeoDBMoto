# Trofeo DB Moto

Webapp per la gestione del Trofeo DB Moto: calendario eventi, iscrizioni, pagamenti, classifiche e area admin.

- **Stile**: MotoGP, colori sfumati blu scuro e rosso, Bootstrap responsive.
- **Hosting**: [GitHub - aldsasso-tech/TrofeoDBMoto](https://github.com/aldsasso-tech/TrofeoDBMoto)
- **Backend**: Firebase (Auth, Firestore, Storage) + estensione **Trigger Email from Firestore**.

## Setup

### 1. Variabili ambiente Firebase

Crea un file `.env` nella root del progetto (non committare):

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 2. Firebase Console

- **Authentication**: abilita “Email/Password”.
- **Firestore**: crea il database; le collection verranno create dall’app (anni, richiesteAccesso, richiestePartecipazioneExtra, users, mail).
- **Storage**: abilita per upload PDF/foto/video.
- **Estensione**: installa “Trigger Email from Firestore” e configurala sulla collection `mail`. I documenti devono avere almeno `to` e `message` (es. `message.subject`, `message.text`).

### 3. Regole Firestore (esempio)

- `users`: lettura/scrittura solo per utente autenticato sul proprio documento; gli admin possono leggere tutti.
- `richiesteAccesso`: lettura solo admin; scrittura da chi non è loggato (form richiedi accesso) e da admin (approva/rifiuta).
- `anni/{year}/...`: lettura pubblica per calendario/regolamento/classifiche; scrittura solo admin.
- Collection `mail`: solo da backend/Cloud Functions (non dare scrittura ai client se non necessario; l’app scrive su `mail` per le email, l’estensione le invia).

### 4. Ruolo admin

Dopo aver creato un utente (a mano o tramite approvazione richiesta accesso), in Firestore imposta sul documento `users/{uid}` il campo `role: "admin"` per quell’utente.

### 5. Cloud Functions

- Entra nella cartella `functions` e esegui: `npm install`
- Configura il progetto Firebase: `firebase use <project-id>`
- Deploy: `firebase deploy --only functions`

Le functions:
- **onRichiestaAccessoApproved**: su update di `richiesteAccesso` con `stato === 'approvata'` crea l’utente in Auth con password temporanea e aggiunge un documento in `mail` per l’invio delle credenziali (l’estensione Trigger Email invierà la mail).
- **onRisultatiSaved**: su scrittura in `anni/{year}/calendario/{eventoId}/risultati/dati` ricalcola la classifica generale e salva in `anni/{year}/config/classificaGenerale`.

### 6. Indici Firestore

Crea indici compositi dove richiesto dagli errori in console, in particolare per:
- `richiesteAccesso`: `stato` (Ascending) + `createdAt` (Descending)
- `anni/{year}/calendario`: `data` (Ascending) (per Home e Calendario)

## Comandi

- `npm run dev` — avvio in sviluppo
- `npm run build` — build per produzione
- `npm run preview` — anteprima build

## Logo

Inserisci il logo del Trofeo DB Moto in `public/logo-trofeo.svg` (o aggiorna il percorso in `Layout.jsx` e `Home.jsx`).

## Pagamenti

- **PayPal**: messaggio con opzione “Amici e familiari” e indirizzo davide462003@yahoo.it.
- **Postepay**: card 4023601251649752, Broglia Davide, C.F. BRGDVD80H22H501H.

La validazione del pagamento avviene in area **Admin > Finance**: l’admin conferma o rifiuta; in base a ciò partono le email “Iscrizione confermata” o “Pagamento non riuscito” (scrivendo in `mail` per l’estensione Trigger Email).
