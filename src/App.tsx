import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router';
import Header from './components/Header';
import StatusStrip from './components/layout/StatusStrip';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';

// Chart-heavy pages load ECharts on demand.
const LiveAlerts = lazy(() => import('./pages/LiveAlerts'));
const DepthCorrelation = lazy(() => import('./pages/DepthCorrelation'));
const RiskPrediction = lazy(() => import('./pages/RiskPrediction'));
const AskReports = lazy(() => import('./pages/AskReports'));
const KnowledgeSearch = lazy(() => import('./pages/KnowledgeSearch'));
const DocumentProcessing = lazy(() => import('./pages/DocumentProcessing'));
const EngineerReview = lazy(() => import('./pages/EngineerReview'));
const About = lazy(() => import('./pages/About'));

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.getElementById('main')?.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex h-full min-w-[1180px] flex-col">
      <Header />
      <StatusStrip />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main id="main" className="min-w-0 flex-1 overflow-auto">
          <Suspense fallback={<div className="p-6 text-muted">Loading…</div>}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/alerts" element={<LiveAlerts />} />
              <Route path="/depth" element={<DepthCorrelation />} />
              <Route path="/risk" element={<RiskPrediction />} />
              <Route path="/ask" element={<AskReports />} />
              <Route path="/search" element={<KnowledgeSearch />} />
              <Route path="/documents" element={<DocumentProcessing />} />
              <Route path="/review" element={<EngineerReview />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
      <Footer />
    </div>
  );
}
