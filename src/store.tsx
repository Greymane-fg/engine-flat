import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { SEED_SERVICES } from './data/services';
import type {
  PackageTier,
  Pkg,
  ReadinessReport,
  Service,
  ServiceId,
} from './types';
import { APPLICATION_STAGES } from './config';
import { uid } from './lib/utils';
import type { DeliveryState } from './lib/email';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type ApplicationContact = {
  fullName: string;
  email: string;
  whatsapp: string;
  storeUrl: string;
  category?: string;
  objective?: string;
  requirements?: string;
  notes?: string;
  /** Merchant accepted the assessment/service disclaimer. */
  consentGiven?: boolean;
};

export type Application = {
  id: string;
  reference: string;
  createdAt: string;
  type: 'assessment' | 'service';
  serviceId?: ServiceId;
  packageId?: string;
  packageTier?: PackageTier;
  serviceFee: number | null;
  adBudget?: number;
  /**
   * Total expected payment, or `null` when the selected package has no fixed
   * price yet ("to be confirmed"). Never coerce an unknown price to zero — a
   * silent $0 total misrepresents what the merchant will be asked to pay.
   */
  total: number | null;
  status: (typeof APPLICATION_STAGES)[number];
  contact: ApplicationContact;
  reportId?: string;
  expert?: string;
  internalNote?: string;
  paid?: boolean;
  /** Outcome of the two EmailJS sends recorded at submission time. */
  delivery?: DeliveryState;
};

export type AdminSettings = {
  /** Replaces the brand wordmark. */
  brandName: string;
  currencyCode: string;
  currencySymbol: string;
  contactEmail: string;
  whatsappDigits: string;
  /** Toggle service availability in the catalogue. */
  pausedServices: ServiceId[];
  assessmentLive: boolean;
};

type PersistedState = {
  version: 1;
  services: Service[];
  applications: Application[];
  reports: ReadinessReport[];
  settings: AdminSettings;
};

/* ------------------------------------------------------------------ */
/* Defaults                                                            */
/* ------------------------------------------------------------------ */

const DEFAULT_SETTINGS: AdminSettings = {
  brandName: 'Engine',
  currencyCode: 'USD',
  currencySymbol: '$',
  contactEmail: 'readiness@engine.studio',
  whatsappDigits: '2348010000000',
  pausedServices: [],
  assessmentLive: true,
};

const STORAGE_KEY = 'engine-flat:v1';

function load(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      if (parsed.version === 1 && Array.isArray(parsed.services)) {
        return {
          ...parsed,
          settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
        };
      }
    }
  } catch {
    /* corrupted storage — fall through to seed */
  }
  return {
    version: 1,
    services: structuredClone(SEED_SERVICES),
    applications: [],
    reports: [],
    settings: DEFAULT_SETTINGS,
  };
}

/* ------------------------------------------------------------------ */
/* Modal routing                                                       */
/* ------------------------------------------------------------------ */

export type ModalState =
  | { kind: 'none' }
  | { kind: 'assessment'; prefill?: Partial<ApplicationContact> }
  | { kind: 'report'; reportId?: string; report?: ReadinessReport }
  | { kind: 'service'; serviceId: ServiceId; tier?: PackageTier; apply?: boolean }
  | { kind: 'policy'; policy: string }
  | { kind: 'admin' }
  | { kind: 'track' }
  | { kind: 'genius' };

type Ctx = {
  services: Service[];
  applications: Application[];
  reports: ReadinessReport[];
  settings: AdminSettings;
  adminUnlocked: boolean;
  modal: ModalState;
  navOpen: boolean;
  toast: string | null;
  openModal: (m: ModalState) => void;
  closeModal: () => void;
  setNavOpen: (v: boolean) => void;
  addApplication: (app: Application) => void;
  addReport: (report: ReadinessReport) => void;
  updateApplication: (id: string, patch: Partial<Application>) => void;
  updatePackage: (serviceId: ServiceId, packageId: string, patch: Partial<Pkg>) => void;
  updateSettings: (patch: Partial<AdminSettings>) => void;
  toggleService: (serviceId: ServiceId) => void;
  unlockAdmin: (passcode: string) => boolean;
  lockAdmin: () => void;
  notify: (message: string) => void;
  resetDemoData: () => void;
  findReport: (id: string) => ReadinessReport | undefined;
  findApplication: (reference: string) => Application | undefined;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(() => load());
  const [modal, setModal] = useState<ModalState>({ kind: 'none' });
  const [navOpen, setNavOpen] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or unavailable — app still works in-memory */
    }
  }, [state]);

  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4200);
  }, []);

  const openModal = useCallback((m: ModalState) => {
    setModal(m);
    setNavOpen(false);
  }, []);
  const closeModal = useCallback(() => setModal({ kind: 'none' }), []);

  const addApplication = useCallback((app: Application) => {
    setState((s) => ({ ...s, applications: [app, ...s.applications] }));
  }, []);

  const addReport = useCallback((report: ReadinessReport) => {
    setState((s) => ({ ...s, reports: [report, ...s.reports] }));
  }, []);

  const updateApplication = useCallback((id: string, patch: Partial<Application>) => {
    setState((s) => ({
      ...s,
      applications: s.applications.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  }, []);

  const updatePackage = useCallback(
    (serviceId: ServiceId, packageId: string, patch: Partial<Pkg>) => {
      setState((s) => ({
        ...s,
        services: s.services.map((svc) =>
          svc.id !== serviceId
            ? svc
            : {
                ...svc,
                packages: svc.packages.map((p) => (p.id === packageId ? { ...p, ...patch } : p)),
              },
        ),
      }));
    },
    [],
  );

  const updateSettings = useCallback((patch: Partial<AdminSettings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const toggleService = useCallback((serviceId: ServiceId) => {
    setState((s) => {
      const paused = s.settings.pausedServices.includes(serviceId);
      return {
        ...s,
        settings: {
          ...s.settings,
          pausedServices: paused
            ? s.settings.pausedServices.filter((id) => id !== serviceId)
            : [...s.settings.pausedServices, serviceId],
        },
      };
    });
  }, []);

  const unlockAdmin = useCallback((passcode: string) => {
    // Demo passcode. In production this is replaced by real authentication.
    const ok = passcode.trim().toLowerCase() === 'engine';
    if (ok) setAdminUnlocked(true);
    return ok;
  }, []);

  const lockAdmin = useCallback(() => setAdminUnlocked(false), []);

  const resetDemoData = useCallback(() => {
    setState({
      version: 1,
      services: structuredClone(SEED_SERVICES),
      applications: [],
      reports: [],
      settings: DEFAULT_SETTINGS,
    });
    notify('Demo data reset to defaults.');
  }, [notify]);

  const findReport = useCallback(
    (id: string) => state.reports.find((r) => r.id === id),
    [state.reports],
  );
  const findApplication = useCallback(
    (reference: string) =>
      state.applications.find(
        (a) => a.reference.toLowerCase() === reference.trim().toLowerCase(),
      ),
    [state.applications],
  );

  const value = useMemo<Ctx>(
    () => ({
      services: state.services,
      applications: state.applications,
      reports: state.reports,
      settings: state.settings,
      adminUnlocked,
      modal,
      navOpen,
      toast,
      openModal,
      closeModal,
      setNavOpen,
      addApplication,
      addReport,
      updateApplication,
      updatePackage,
      updateSettings,
      toggleService,
      unlockAdmin,
      lockAdmin,
      notify,
      resetDemoData,
      findReport,
      findApplication,
    }),
    [
      state.services,
      state.applications,
      state.reports,
      state.settings,
      adminUnlocked,
      modal,
      navOpen,
      toast,
      openModal,
      closeModal,
      addApplication,
      addReport,
      updateApplication,
      updatePackage,
      updateSettings,
      toggleService,
      unlockAdmin,
      lockAdmin,
      notify,
      resetDemoData,
      findReport,
      findApplication,
    ],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export function makeApplication(
  data: Omit<Application, 'id' | 'reference' | 'createdAt' | 'status'>,
  existing: Application[] = [],
): Application {
  // Sequential references per year keep the admin console readable and make
  // collisions impossible within a workspace.
  const year = new Date().getFullYear();
  const used = new Set(existing.map((a) => a.reference));
  let seq = existing.filter((a) => a.reference.startsWith(`ENG-${year}-`)).length + 1;
  let reference = `ENG-${year}-${String(seq).padStart(4, '0')}`;
  while (used.has(reference)) {
    seq += 1;
    reference = `ENG-${year}-${String(seq).padStart(4, '0')}`;
  }
  return {
    ...data,
    id: uid('app'),
    reference,
    createdAt: new Date().toISOString(),
    status: 'Submitted',
  };
}

export function stageIndex(status: Application['status']): number {
  return APPLICATION_STAGES.indexOf(status);
}
