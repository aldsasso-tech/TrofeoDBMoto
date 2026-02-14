import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import RichiediAccesso from './pages/RichiediAccesso';
import Regolamento from './pages/Regolamento';
import Calendario from './pages/Calendario';
import Circuiti from './pages/Circuiti';
import Classifiche from './pages/Classifiche';
import Piloti from './pages/Piloti';
import Eventi from './pages/Eventi';
import FotoVideo from './pages/FotoVideo';
import EventoDetail from './pages/EventoDetail';
import Iscrizione from './pages/Iscrizione';
import Pagamento from './pages/Pagamento';
import RisultatiEvento from './pages/RisultatiEvento';
import RichiediDeroga from './pages/RichiediDeroga';
import AdminLayout from './admin/AdminLayout';
import AdminDashboard from './admin/AdminDashboard';
import AdminRichiesteAccesso from './admin/AdminRichiesteAccesso';
import AdminRegolamento from './admin/AdminRegolamento';
import AdminCalendario from './admin/AdminCalendario';
import AdminPiloti from './admin/AdminPiloti';
import AdminCircuiti from './admin/AdminCircuiti';
import AdminRichiesteExtra from './admin/AdminRichiesteExtra';
import AdminPrezzi from './admin/AdminPrezzi';
import AdminCalendarioPartecipanti from './admin/AdminCalendarioPartecipanti';
import AdminFinance from './admin/AdminFinance';
import AdminRisultati from './admin/AdminRisultati';
import { useAuth } from './context/AuthContext';

function AdminRoute({ children }) {
  const { user, userProfile, loading } = useAuth();
  if (loading) return <div className="text-center text-white py-5">Caricamento...</div>;
  const isAdmin = userProfile?.role === 'admin';
  if (!user || !isAdmin) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [year, setYear] = useState(2026);
  return (
    <Layout year={year}>
      <Routes>
        <Route path="/" element={<Home year={year} setYear={setYear} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/richiedi-accesso" element={<RichiediAccesso />} />
        <Route path="/regolamento" element={<Regolamento year={year} />} />
        <Route path="/calendario" element={<Calendario year={year} />} />
        <Route path="/circuiti" element={<Circuiti year={year} />} />
        <Route path="/classifiche" element={<Classifiche year={year} />} />
        <Route path="/piloti" element={<Piloti year={year} />} />
        <Route path="/eventi" element={<Eventi year={year} />} />
        <Route path="/eventi/:eventoId" element={<EventoDetail year={year} />} />
        <Route path="/iscrizione/:eventoId" element={<Iscrizione year={year} />} />
        <Route path="/pagamento/:eventoId" element={<Pagamento year={year} />} />
        <Route path="/risultati/:eventoId" element={<RisultatiEvento year={year} />} />
        <Route path="/richiedi-deroga/:eventoId" element={<RichiediDeroga year={year} />} />
        <Route path="/foto-video" element={<FotoVideo year={year} />} />
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="richieste-accesso" element={<AdminRichiesteAccesso />} />
          <Route path="regolamento" element={<AdminRegolamento />} />
          <Route path="calendario" element={<AdminCalendario />} />
          <Route path="piloti" element={<AdminPiloti />} />
          <Route path="circuiti" element={<AdminCircuiti />} />
          <Route path="richieste-extra" element={<AdminRichiesteExtra />} />
          <Route path="prezzi" element={<AdminPrezzi />} />
          <Route path="calendario-partecipanti" element={<AdminCalendarioPartecipanti />} />
          <Route path="finance" element={<AdminFinance />} />
          <Route path="risultati" element={<AdminRisultati />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
