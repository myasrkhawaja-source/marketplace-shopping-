/**
 * layouts/MainLayout.jsx
 * ---------------------------------------------------------
 * Public / customer shell: navbar + page content + footer.
 */
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const MainLayout = () => (
  <div className="app-shell">
    <Navbar />
    <main>
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default MainLayout;
