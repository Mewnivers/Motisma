import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import HelpBadge from './components/HelpBadge.jsx';
import Splash from './components/Splash.jsx';
import Home from './pages/Home.jsx';
// MapLibre is heavy — only load it when the map route is visited.
const Carte = lazy(() => import('./pages/Carte.jsx'));
import Classement from './pages/Classement.jsx';
import Communaute from './pages/Communaute.jsx';
import Guides from './pages/Guides.jsx';
import Profil from './pages/Profil.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Terms from './pages/Terms.jsx';
import Privacy from './pages/Privacy.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <>
      <Splash />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Carte temporairement masquee : redirige vers l'accueil. Restaurer le
              bloc ci-dessous et le lien NAV pour reactiver la page.
          <Route
            path="/carte"
            element={
              <Suspense fallback={<div className="map-loading">Chargement de la carte…</div>}>
                <Carte />
              </Suspense>
            }
          />
          */}
          <Route path="/carte" element={<Navigate to="/" replace />} />
          <Route path="/classement" element={<Classement />} />
          <Route path="/communaute" element={<Communaute />} />
          <Route path="/guides" element={<Guides />} />
          <Route path="/profil" element={<Profil />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <HelpBadge />
    </>
  );
}
