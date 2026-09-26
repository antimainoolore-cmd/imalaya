import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import Home from '@/pages/Home';
import MatchDetail from '@/pages/MatchDetail';
import PlayerDetail from '@/pages/PlayerDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/match/:id" element={<MatchDetail />} />
          <Route path="/player/:id" element={<PlayerDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
