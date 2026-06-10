import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import HelpBadge from './components/HelpBadge.jsx';
import Splash from './components/Splash.jsx';
import Home from './pages/Home.jsx';
import Carte from './pages/Carte.jsx';
import Classement from './pages/Classement.jsx';
import Communaute from './pages/Communaute.jsx';
import Guides from './pages/Guides.jsx';
import Profil from './pages/Profil.jsx';
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
          <Route path="/carte" element={<Carte />} />
          <Route path="/classement" element={<Classement />} />
          <Route path="/communaute" element={<Communaute />} />
          <Route path="/guides" element={<Guides />} />
          <Route path="/profil" element={<Profil />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <HelpBadge />
    </>
  );
}
