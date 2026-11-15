import { useApp } from './store';
import { useReveal } from './hooks';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { Introduction } from './components/Introduction';
import { Stages } from './components/Stages';
import { HowItWorks } from './components/HowItWorks';
import { Services } from './components/Services';
import { Genius } from './components/Genius';
import { About } from './components/About';
import { FinalCta } from './components/FinalCta';
import { Footer } from './components/Footer';
import { AssessmentModal } from './components/AssessmentModal';
import { ServiceModal } from './components/ServiceModal';
import { PolicyModal } from './components/PolicyModal';
import { AdminModal } from './components/AdminModal';
import { TrackModal } from './components/TrackModal';
import { ReportModal } from './components/ReportModal';
import { Check } from 'lucide-react';

function Modals() {
  const { modal, closeModal } = useApp();

  switch (modal.kind) {
    case 'assessment':
      return <AssessmentModal prefill={modal.prefill} onClose={closeModal} />;
    case 'service':
      return (
        <ServiceModal
          serviceId={modal.serviceId}
          tier={modal.tier}
          apply={modal.apply}
          onClose={closeModal}
        />
      );
    case 'genius':
      return <ServiceModal serviceId="genius-marketing" onClose={closeModal} />;
    case 'policy':
      return <PolicyModal policy={modal.policy} onClose={closeModal} />;
    case 'admin':
      return <AdminModal onClose={closeModal} />;
    case 'track':
      return <TrackModal onClose={closeModal} />;
    case 'report':
      return modal.report ? (
        <ReportModal report={modal.report} onClose={closeModal} />
      ) : null;
    default:
      return null;
  }
}

function Toast() {
  const { toast } = useApp();
  return (
    <div className={`toast ${toast ? 'toast--in' : ''}`} role="status" aria-live="polite">
      {toast && (
        <>
          <Check size={15} strokeWidth={3} />
          <span>{toast}</span>
        </>
      )}
    </div>
  );
}

export default function App() {
  useReveal();
  const { modal, toast } = useApp();

  return (
    <>
      <a href="#introduction" className="skip-link">
        Skip to content
      </a>
      <Nav />
      <main>
        <Hero />
        <Introduction />
        <Stages />
        <HowItWorks />
        <Services />
        <Genius />
        <About />
        <FinalCta />
      </main>
      <Footer />
      {modal.kind !== 'none' && <Modals />}
      <Toast key={toast ?? 'idle'} />
    </>
  );
}
