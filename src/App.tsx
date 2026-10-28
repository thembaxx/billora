import { encryptBackup, decryptBackup, isEncryptedBackup } from './lib/encrypted-backup';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'motion/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  BellIcon,
  BuildingsIcon,
  CalendarBlankIcon,
  ChartLineUpIcon,
  CheckCircleIcon,
  CommandIcon,
  FileTextIcon,
  GearSixIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  SquaresFourIcon,
  WifiSlashIcon,
  XIcon,
} from '@phosphor-icons/react';
import type { Property, ServiceRequest, Settings, Statement, View, Workspace } from './types';
import {
  calendarFile,
  dateLabel,
  download,
  latestStatements,
  money,
  readWorkspace,
  personalWorkspace,
} from './lib/data';
import { clearDocuments, deleteDocument } from './lib/documents';
import { AnimatedTabs } from './components/AnimatedTabs';
import { Modal } from './components/Modal';
import { Overview } from './components/Overview';
import { Insights, Properties, Statements } from './components/Screens';
import { ImportForm, PropertyForm } from './components/Forms';
import { PropertyDetail, StatementDetail } from './components/DetailDialogs';
import { SettingsDialog } from './components/SettingsDialog';
import { GuideDialog } from './components/GuideDialog';
import { Onboarding } from './components/Onboarding';
import { Flower } from './components/Flower';
import { DemoConnections } from './components/DemoConnections';
import { RequestWorkspace } from './components/requests/RequestWorkspace';
import { followUpDue, newRequest, statementReference, type RequestMutation } from './lib/requests';
import { clearRequestFiles, deleteRequestFile } from './lib/request-files';
import { createFullBackup, restoreFullBackup } from './lib/backup';
import type { BillChange } from './lib/insights';

gsap.registerPlugin(ScrollTrigger, useGSAP);
const nav = [
  { id: 'overview' as const, label: 'Overview', icon: <SquaresFourIcon size={19} /> },
  { id: 'properties' as const, label: 'Properties', icon: <BuildingsIcon size={19} /> },
  { id: 'statements' as const, label: 'Statements', icon: <FileTextIcon size={19} /> },
  { id: 'insights' as const, label: 'Insights', icon: <ChartLineUpIcon size={19} /> },
];
const pages: Record<View, { title: string; description: string }> = {
  overview: {
    title: 'A little clarity.\nFor everything home.',
    description:
      'Review municipal statements, compare months and prepare a query evidence pack. Saved on this device.',
  },
  properties: {
    title: 'All your places.\nOne clear picture.',
    description: 'Home, rental or business. There’s a place for all of them.',
  },
  statements: {
    title: 'Every statement.\nIn its right place.',
    description: 'Every statement, thoughtfully in its place.',
  },
  insights: {
    title: 'Make sense\nof your spending.',
    description: 'A clearer view of what goes into your everyday.',
  },
};
type Dialog =
  | 'settings'
  | 'import'
  | 'add'
  | 'search'
  | 'reminders'
  | 'tour'
  | 'demo'
  | 'requests'
  | 'help'
  | null;
const initialDialog = (): Dialog => {
  const params = new URLSearchParams(location.search);
  if (params.has('import')) return 'import';
  if (params.has('settings')) return 'settings';
  if (params.has('help')) return 'help';
  if (params.has('requests')) return 'requests';
  return null;
};
interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}
const initialView = (): View => {
  const v = new URLSearchParams(location.search).get('view');
  return nav.some((n) => n.id === v) ? (v as View) : 'overview';
};
const initialSettings = (): Settings => {
  try {
    const saved = JSON.parse(localStorage.getItem('billora-settings') || '{}');
    return {
      theme: ['light', 'dark', 'system'].includes(saved?.theme) ? saved.theme : 'system',
      reduceMotion: saved?.reduceMotion === true,
      hideBalances: saved?.hideBalances === true,
      name: typeof saved?.name === 'string' ? saved.name.slice(0, 35) : 'Alex',
    };
  } catch {
    return { theme: 'system', reduceMotion: false, hideBalances: false, name: 'Alex' };
  }
};

export default function App() {
  const [loaded] = useState(readWorkspace);
  const [loadError, setLoadError] = useState(loaded.error);
  const [data, setData] = useState<Workspace>(loaded.data);
  const dataRef = useRef(data);
  dataRef.current = data;
  const [requestContext, setRequestContext] = useState<{ id: string; edit: boolean } | null>(null);
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [view, setView] = useState<View>(initialView);
  const [dialog, setDialog] = useState<Dialog>(initialDialog);
  const [property, setProperty] = useState<Property | null>(null);
  const [statementId, setStatementId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');
  const [offline, setOffline] = useState(!navigator.onLine);
  const [welcome, setWelcome] = useState(() => {
    try {
      return !localStorage.getItem('billora-welcomed');
    } catch {
      return false;
    }
  });
  const [install, setInstall] = useState<InstallPrompt | null>(null);
  const [returnToImport, setReturnToImport] = useState(false);
  const [launchFile, setLaunchFile] = useState<File | undefined>();
  const systemReduced = useReducedMotion();
  const reduced = settings.reduceMotion || !!systemReduced;
  const scope = useRef<HTMLElement>(null);
  const notify = useCallback((message: string) => setToast(message), []);
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError() {
      notify('Offline setup wasn’t available. You can still use Billora while connected.');
    },
  });
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const apply = () => {
      const dark =
        settings.theme === 'dark' ||
        (settings.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
      document
        .querySelector('link[rel=manifest]')
        ?.setAttribute('href', dark ? '/manifest-dark.webmanifest' : '/manifest.webmanifest');
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', dark ? '#17181c' : '#f5f5f8');
      document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
    };
    apply();
    const m = matchMedia('(prefers-color-scheme: dark)');
    m.addEventListener('change', apply);
    return () => m.removeEventListener('change', apply);
  }, [settings.theme, reduced]);
  const navigate = useCallback((v: View) => {
    setView(v);
    setDialog(null);
    setProperty(null);
    setStatementId(null);
    const url = new URL(location.href);
    url.search = '';
    if (v !== 'overview') url.searchParams.set('view', v);
    history.pushState({}, '', url);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);
  useEffect(() => {
    const pop = () => {
      setView(initialView());
      setDialog(initialDialog());
      setProperty(null);
      setStatementId(null);
    };
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setProperty(null);
        setStatementId(null);
        setDialog((d) => (d === 'search' ? null : 'search'));
      }
    };
    const online = () => setOffline(!navigator.onLine);
    const prompt = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallPrompt);
    };
    window.addEventListener('keydown', key);
    window.addEventListener('online', online);
    window.addEventListener('offline', online);
    window.addEventListener('beforeinstallprompt', prompt);
    return () => {
      window.removeEventListener('keydown', key);
      window.removeEventListener('online', online);
      window.removeEventListener('offline', online);
      window.removeEventListener('beforeinstallprompt', prompt);
    };
  }, []);
  useEffect(() => {
    const launch = (
      window as unknown as {
        launchQueue?: {
          setConsumer: (
            callback: (p: { files: { getFile: () => Promise<File> }[] }) => Promise<void>,
          ) => void;
        };
      }
    ).launchQueue;
    launch?.setConsumer(async (p) => {
      if (p.files[0]) {
        setLaunchFile(await p.files[0].getFile());
        setDialog('import');
      }
    });
  }, []);
  useGSAP(
    () => {
      if (reduced) return;
      gsap.from('.reveal', {
        y: 24,
        opacity: 0,
        duration: 0.65,
        stagger: 0.065,
        ease: 'power3.out',
        clearProps: 'all',
      });
      gsap.utils.toArray<HTMLElement>('.bottom-grid .card').forEach((el) =>
        gsap.fromTo(
          el,
          { y: 30, scale: 0.98 },
          {
            y: 0,
            scale: 1,
            scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 72%', scrub: 1 },
            ease: 'none',
          },
        ),
      );
    },
    { scope, dependencies: [view, reduced] },
  );
  const update = (next: Workspace, recovering = false) => {
    if (loadError && !recovering) {
      notify('Changes are paused. Restore a backup or clear the unreadable workspace in Settings.');
      return false;
    }
    try {
      localStorage.setItem('billora-workspace', JSON.stringify(next));
      dataRef.current = next;
      setData(next);
      return true;
    } catch {
      notify('Your browser could not save these changes. Free some device storage and try again.');
      return false;
    }
  };
  const createRequest = (
    p: Property,
    statement?: Statement,
    change?: BillChange,
  ): ServiceRequest | null => {
    const request = newRequest(p, statement);
    if (change) {
      request.comparison = {
        previous: statementReference(change.previous),
        label: change.label,
        before: change.before,
        after: change.after,
      };
      request.description =
        'Please review the change in ' +
        change.label.toLowerCase() +
        ' between ' +
        change.previous.period +
        ' (' +
        money(change.before) +
        ') and ' +
        change.current.period +
        ' (' +
        money(change.after) +
        '). The difference is ' +
        money(change.difference) +
        '. These figures come from my reviewed imported statements; ' +
        'I am asking for clarification, not asserting a billing error.';
      request.desiredOutcome =
        'Please explain the charges and confirm the applicable readings and tariffs.';
    }
    const current = dataRef.current;
    return update({ ...current, requests: [...current.requests, request] }) ? request : null;
  };
  const mutateRequest: RequestMutation = (id, change) => {
    const current = dataRef.current;
    const previous = current.requests.find((r) => r.id === id);
    if (!previous) return false;
    const nextRequest = { ...change(previous), updatedAt: new Date().toISOString() };
    const next = {
      ...current,
      requests: current.requests.map((r) => (r.id === id ? nextRequest : r)),
    };
    if (!update(next)) return false;
    // Unlinking a bill can release an original retained only for this request.
    const released = [previous.statement?.fileId, previous.comparison?.previous.fileId].filter(
      (fileId): fileId is string =>
        !!fileId &&
        !next.statements.some((s) => s.fileId === fileId) &&
        !next.requests.some(
          (r) => r.statement?.fileId === fileId || r.comparison?.previous.fileId === fileId,
        ),
    );
    if (released.length)
      void Promise.all([...new Set(released)].map(deleteDocument)).catch(() =>
        notify(
          'Request updated, but an unlinked PDF could not be cleared. Use Clear workspace or browser site-data controls to finish removing it.',
        ),
      );
    return true;
  };
  const openRequests = (context: { id: string; edit: boolean } | null = null) => {
    setRequestContext(context);
    setProperty(null);
    setStatementId(null);
    setDialog('requests');
  };
  const startRequest = (p: Property, statement?: Statement, change?: BillChange) => {
    const request = createRequest(p, statement, change);
    if (request) openRequests({ id: request.id, edit: true });
  };
  const updateSettings = (next: Settings) => {
    try {
      localStorage.setItem('billora-settings', JSON.stringify(next));
      setSettings(next);
    } catch {
      notify('Settings could not be saved on this device.');
    }
  };
  const showImport = () => {
    setProperty(null);
    setStatementId(null);
    setDialog('import');
  };
  const showStatement = (s: Statement) => {
    setProperty(null);
    setDialog(null);
    setStatementId(s.id);
  };
  const closeDialog = () => {
    setDialog(null);
    setLaunchFile(undefined);
    const url = new URL(location.href);
    for (const key of ['import', 'settings', 'requests', 'help']) url.searchParams.delete(key);
    history.replaceState({}, '', url);
  };
  const finishTour = () => {
    try {
      localStorage.setItem('billora-welcomed', 'true');
    } catch {
      /* Tour remains usable without storage. */
    }
    setWelcome(false);
    setDialog(null);
  };
  const currentStatement = data.statements.find((s) => s.id === statementId);
  const pending = latestStatements(data)
    .filter((s) => !s.paidNote)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const matches = data.properties.filter((p) =>
    `${p.name} ${p.address} ${p.municipality} ${p.account}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const sample = data.statements.some((s) => s.source === 'sample');
  const requestFollowUps = data.requests
    .filter((r) => r.status === 'submitted' && r.submission?.followUpOn)
    .sort((a, b) => a.submission!.followUpOn.localeCompare(b.submission!.followUpOn));
  return (
    <MotionConfig reducedMotion={reduced ? 'always' : 'user'}>
      <a href="#main-content" className="skip-link">
        Skip to workspace
      </a>
      <header className="site-header">
        <button
          className="brand"
          onClick={() => navigate('overview')}
          aria-label="Billora overview"
        >
          <img src="/logo.png" alt="" />
          <span>
            billora<span>.</span>
          </span>
        </button>
        <nav aria-label="Main navigation">
          <AnimatedTabs items={nav} value={view} onChange={navigate} label="Workspace screens" />
        </nav>
        <div className="header-actions">
          <button
            className="header-search"
            aria-label="Open search"
            onClick={() => {
              setQuery('');
              setDialog('search');
            }}
          >
            <MagnifyingGlassIcon size={18} />
            <span>Find a little clarity…</span>
            <kbd>
              <CommandIcon size={11} />K
            </kbd>
          </button>
          <button
            className="icon-button notification-button"
            onClick={() => setDialog('reminders')}
            aria-label={`Reminders, ${pending.length} upcoming accounts, ${requestFollowUps.length} personal follow-ups`}
          >
            <BellIcon size={21} />
            {(pending.length > 0 || data.requests.some(followUpDue)) && <i />}
          </button>
          <button
            className="icon-button"
            onClick={() => setDialog('settings')}
            aria-label="Open settings"
          >
            <GearSixIcon size={22} />
          </button>
          <button
            className="avatar"
            onClick={() => setDialog('settings')}
            aria-label="Profile settings"
          >
            {settings.name.slice(0, 1).toUpperCase()}
          </button>
        </div>
      </header>
      <main id="main-content" ref={scope} className="workspace" tabIndex={-1}>
        {loadError && (
          <section
            className="info-banner recovery-banner"
            role="alert"
            aria-label="Workspace recovery"
          >
            <div>
              <strong>Let’s recover your workspace.</strong>
              <p>{loadError}</p>
              {loaded.raw !== null && (
                <button
                  className="button secondary small"
                  onClick={() =>
                    download(loaded.raw!, 'billora-unreadable-records.json', 'application/json')
                  }
                >
                  Download saved records
                </button>
              )}
              <button className="button secondary small" onClick={() => setDialog('settings')}>
                Open recovery settings
              </button>
            </div>
          </section>
        )}
        {offline && (
          <div className="offline-banner" role="status">
            <WifiSlashIcon size={18} />
            You’re offline. Your saved statements are still right here.
          </div>
        )}
        <section className="page-heading">
          <div>
            <p className="greeting">
              <span className="greeting-sun" />
              Good{' '}
              {new Date().getHours() < 12
                ? 'morning'
                : new Date().getHours() < 17
                  ? 'afternoon'
                  : 'evening'}
              , {settings.name}
              <span className="greeting-divider" />
              <span className="greeting-note">Let’s make room for clarity.</span>
            </p>
            <AnimatePresence mode="wait">
              <motion.h1
                key={view}
                initial={{ opacity: 0, y: reduced ? 0 : 9 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                {pages[view].title.split('\n').map((line, i) => (
                  <span key={line} className={i === 1 ? 'muted-heading' : ''}>
                    {line}
                    {i === 0 && <br />}
                  </span>
                ))}
              </motion.h1>
            </AnimatePresence>
            <p className="page-description">{pages[view].description}</p>
          </div>
          <div className="page-heading-actions">
            <span className="today">
              <CalendarBlankIcon size={16} />
              {new Date().toLocaleDateString('en-ZA', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <button
              className="button primary"
              onClick={view === 'properties' ? () => setDialog('add') : showImport}
            >
              <PlusIcon size={18} />
              {view === 'properties' ? 'Add property' : 'Import statement'}
            </button>
          </div>
        </section>
        {welcome && view === 'overview' && (
          <div className="welcome-strip">
            <span className="welcome-spark">
              <Flower />
            </span>
            <p>
              <strong>A fresh start feels good.</strong> Explore with{' '}
              {sample ? 'sample accounts' : 'your own accounts'}.
            </p>
            <button className="text-button" onClick={() => setDialog('tour')}>
              Take a quick look
              <ArrowRightIcon size={16} />
            </button>
            <button
              className="icon-button"
              aria-label="Dismiss welcome"
              onClick={() => {
                try {
                  localStorage.setItem('billora-welcomed', 'true');
                } catch {
                  /* Dismiss for this visit. */
                }
                setWelcome(false);
              }}
            >
              <XIcon size={16} />
            </button>
          </div>
        )}
        {view === 'overview' && data.statements.some((s) => s.source === 'sample') && (
          <div className="info-banner sample-separation">
            <div>
              <strong>Exploring with illustrative accounts.</strong>
              <p>
                These are not your municipal balances. Start a personal workspace before importing
                real bills.
              </p>
              <button
                className="button secondary small"
                onClick={() => {
                  if (update(personalWorkspace(data)))
                    notify('Personal workspace ready. Add your own property to begin.');
                }}
              >
                Start my workspace <ArrowUpRightIcon size={16} />
              </button>
            </div>
          </div>
        )}
        {view === 'overview' && (
          <Overview
            data={data}
            settings={settings}
            reduced={reduced}
            navigate={navigate}
            onImport={showImport}
            onProperty={setProperty}
            onReminders={() => setDialog('reminders')}
            onTour={() => setDialog('tour')}
            onRequests={() => openRequests()}
          />
        )}
        {view === 'properties' && (
          <Properties
            data={data}
            settings={settings}
            onAdd={() => setDialog('add')}
            onDemo={() => setDialog('demo')}
            onRequests={() => openRequests()}
            onProperty={setProperty}
          />
        )}
        {view === 'statements' && (
          <Statements
            data={data}
            settings={settings}
            onImport={showImport}
            onStatement={showStatement}
          />
        )}
        {view === 'insights' && (
          <Insights
            data={data}
            settings={settings}
            onStatement={showStatement}
            onRequest={(change) => {
              const p = data.properties.find((item) => item.id === change.propertyId);
              if (p) startRequest(p, change.current, change);
            }}
          />
        )}
      </main>
      {dialog === 'add' && (
        <PropertyForm
          onClose={() => {
            if (returnToImport) {
              setReturnToImport(false);
              setDialog('import');
            } else closeDialog();
          }}
          onSave={(p) => {
            const personal = personalWorkspace(data);
            const ok = update({ ...personal, properties: [...personal.properties, p] });
            if (ok) notify('A new place, nicely organised. Property added.');
            return ok;
          }}
        />
      )}
      {dialog === 'import' && (
        <ImportForm
          data={data}
          initialFile={launchFile}
          onClose={closeDialog}
          onAddProperty={() => {
            setReturnToImport(true);
            setDialog('add');
          }}
          onSave={(s) => {
            const ok = update({
              ...data,
              statements: [
                ...data.statements.filter(
                  (row) =>
                    !(
                      row.source === 'sample' &&
                      row.propertyId === s.propertyId &&
                      row.period === s.period
                    ),
                ),
                s,
              ],
            });
            if (ok) notify('Statement saved. A little more clarity.');
            return ok;
          }}
        />
      )}
      {dialog === 'settings' && (
        <SettingsDialog
          settings={settings}
          onChange={updateSettings}
          onClose={closeDialog}
          offline={offline}
          installAvailable={!!install}
          onInstall={() => {
            void (async () => {
              if (!install) return;
              await install.prompt();
              const result = await install.userChoice;
              if (result.outcome === 'accepted')
                notify('Billora is moving a little closer to home.');
              setInstall(null);
            })();
          }}
          sampleWorkspace={data.statements.some((s) => s.source === 'sample')}
          onPersonal={() => {
            if (update(personalWorkspace(data))) {
              setDialog(null);
              notify('Your personal workspace is ready. Sample bills are no longer included.');
            }
          }}
          onBackup={async (password) => {
            const blob = await createFullBackup(data);
            const secured = password ? await encryptBackup(blob, password) : blob;
            download(
              secured,
              password ? 'billora-complete-backup.billora' : 'billora-complete-backup.zip',
              secured.type,
            );
            notify(
              password
                ? 'Password-protected backup downloaded. Keep its password separately; it cannot be recovered.'
                : 'Unencrypted ZIP downloaded. Keep this file private.',
            );
          }}
          onRestore={async (file, password) => {
            const original = (await isEncryptedBackup(file))
              ? new File([await decryptBackup(file, password || '')], 'restored.zip', {
                  type: 'application/zip',
                })
              : file;
            const restored = await restoreFullBackup(original);
            dataRef.current = restored;
            setData(restored);
            setLoadError('');
            navigate('overview');
            notify('Full workspace restored from your local ZIP.');
          }}
          onExport={() => {
            download(
              JSON.stringify(
                { version: 1, exportedAt: new Date().toISOString(), ...data },
                null,
                2,
              ),
              'billora-account-data.json',
              'application/json',
            );
            notify(
              'Records-only JSON exported. Use Full backup (ZIP) to include original PDFs and evidence.',
            );
          }}
          onClear={async () => {
            try {
              if (update({ properties: [], statements: [], requests: [] }, true)) {
                setLoadError('');
                await Promise.all([clearDocuments(), clearRequestFiles()]);
                setDialog(null);
                notify('A clean slate. Your workspace is ready for your own accounts.');
              }
            } catch {
              notify(
                'Could not finish clearing local files. Try again or use your browser’s site-data controls.',
              );
            }
          }}
          onTour={() => setDialog('tour')}
          onDemo={() => setDialog('demo')}
          onRequests={() => openRequests()}
        />
      )}
      {dialog === 'help' && (
        <GuideDialog
          onClose={closeDialog}
          onSettings={() => setDialog('settings')}
          onImport={showImport}
        />
      )}
      {dialog === 'tour' && (
        <Onboarding reduced={reduced} onClose={finishTour} onStart={finishTour} />
      )}
      {dialog === 'demo' && (
        <DemoConnections data={data} onClose={closeDialog} onAddProperty={() => setDialog('add')} />
      )}
      {dialog === 'requests' && (
        <RequestWorkspace
          data={data}
          hidden={settings.hideBalances}
          initial={requestContext}
          onCreate={createRequest}
          onMutate={mutateRequest}
          onClose={closeDialog}
          onAddProperty={() => setDialog('add')}
          notify={notify}
          onDelete={async (id) => {
            const request = dataRef.current.requests.find((r) => r.id === id);
            if (!request) return false;
            const current = dataRef.current;
            const remaining = current.requests.filter((r) => r.id !== id);
            if (!update({ ...current, requests: remaining })) return false;
            try {
              await Promise.all(request.evidence.map((f) => deleteRequestFile(f.id)));
              for (const fileId of new Set([
                request.statement?.fileId,
                request.comparison?.previous.fileId,
              ])) {
                if (
                  fileId &&
                  !current.statements.some((s) => s.fileId === fileId) &&
                  !remaining.some(
                    (r) =>
                      r.statement?.fileId === fileId || r.comparison?.previous.fileId === fileId,
                  )
                )
                  await deleteDocument(fileId);
              }
              notify('Local request and its attached evidence removed.');
            } catch {
              notify(
                'Request removed, but some local files could not be cleared. Use Clear workspace or browser site-data controls to finish removing files.',
              );
            }
            return true;
          }}
        />
      )}
      {dialog === 'search' && (
        <Modal
          title="Find a little clarity."
          description="Search your places, accounts, statements or screens."
          onClose={closeDialog}
        >
          <label className="search-field command-search">
            <MagnifyingGlassIcon size={21} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Property, municipality or account…"
              aria-label="Search workspace"
            />
            <kbd>Esc</kbd>
          </label>
          <div className="command-results">
            {nav
              .filter((n) => n.label.toLowerCase().includes(query.toLowerCase()))
              .map((n) => (
                <button key={n.id} onClick={() => navigate(n.id)}>
                  {n.icon}
                  <span>
                    {n.label}
                    <small>Go to screen</small>
                  </span>
                  <ArrowRightIcon />
                </button>
              ))}
            {matches.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setDialog(null);
                  setProperty(p);
                }}
              >
                <BuildingsIcon />
                <span>
                  {p.name}
                  <small>
                    {p.municipality} · {p.account}
                  </small>
                </span>
                <ArrowUpRightIcon />
              </button>
            ))}
            {data.requests
              .filter((r) =>
                `${r.localReference} ${r.property.name} ${r.description}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )
              .slice(0, 5)
              .map((r) => (
                <button key={r.id} onClick={() => openRequests({ id: r.id, edit: false })}>
                  <FileTextIcon />
                  <span>
                    {r.property.name}
                    <small>Service request · {r.localReference}</small>
                  </span>
                  <ArrowUpRightIcon />
                </button>
              ))}
            {query &&
              data.statements
                .filter((s) =>
                  `${s.period} ${s.fileName || ''}`.toLowerCase().includes(query.toLowerCase()),
                )
                .slice(0, 6)
                .map((s) => (
                  <button key={s.id} onClick={() => showStatement(s)}>
                    <FileTextIcon />
                    <span>
                      {s.period}
                      <small>{data.properties.find((p) => p.id === s.propertyId)?.name}</small>
                    </span>
                    <ArrowUpRightIcon />
                  </button>
                ))}
            {query &&
              !matches.length &&
              !nav.some((n) => n.label.toLowerCase().includes(query.toLowerCase())) &&
              !data.requests.some((r) =>
                `${r.localReference} ${r.property.name} ${r.description}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              ) &&
              !data.statements.some((s) =>
                `${s.period} ${s.fileName || ''}`.toLowerCase().includes(query.toLowerCase()),
              ) && (
                <p className="empty-state">
                  Nothing here yet. Try a property name, month or municipality.
                </p>
              )}
          </div>
        </Modal>
      )}
      {dialog === 'reminders' && (
        <Modal
          title="A little ahead of the everyday."
          description="Statement due dates and your chosen service-request follow-ups."
          onClose={closeDialog}
        >
          <div className="reminder-list">
            {pending.map((s) => (
              <div className="reminder-item" key={s.id}>
                <div className="reminder-day">
                  <strong className="numeric">{s.dueDate.slice(-2)}</strong>
                  <small>{dateLabel(s.dueDate, { month: 'short' })}</small>
                </div>
                <div>
                  <strong>{data.properties.find((p) => p.id === s.propertyId)?.name}</strong>
                  <p className="numeric">{settings.hideBalances ? 'R •••••' : money(s.amount)}</p>
                  <small>{s.source === 'sample' ? 'Sample due date' : 'Imported due date'}</small>
                </div>
                <button
                  className="icon-button"
                  aria-label={`Download reminder for ${data.properties.find((p) => p.id === s.propertyId)?.name}`}
                  onClick={() => {
                    download(
                      calendarFile(
                        s,
                        data.properties.find((p) => p.id === s.propertyId)?.name || 'Property',
                      ),
                      `billora-reminder-${s.dueDate}.ics`,
                      'text/calendar',
                    );
                    notify('Reminder downloaded. Open it to add it to your calendar.');
                  }}
                >
                  <ArrowUpRightIcon size={20} />
                </button>
              </div>
            ))}
          </div>
          {requestFollowUps.length > 0 && (
            <section className="request-reminders">
              <h3>Your service-request follow-ups</h3>
              <p className="request-help">
                Dates chosen by you, not official municipal response deadlines.
              </p>
              {requestFollowUps.map((r) => (
                <button key={r.id} onClick={() => openRequests({ id: r.id, edit: false })}>
                  <span>
                    <strong>{r.property.name}</strong>
                    <small>
                      {r.submission!.reference} ·{' '}
                      {followUpDue(r) ? 'Your follow-up is due' : 'Personal reminder'}
                    </small>
                  </span>
                  <time className="numeric">{r.submission!.followUpOn}</time>
                  <ArrowUpRightIcon size={18} />
                </button>
              ))}
            </section>
          )}
          {!pending.length && !requestFollowUps.length && (
            <div className="empty-state">
              <CheckCircleIcon size={44} />
              <h3>A little breathing room.</h3>
              <p>No unmarked account reminders. Import your next bill when it arrives.</p>
            </div>
          )}
          <p className="note-box">
            Download a due date to add it to your calendar. Billora doesn’t send background
            notifications.
          </p>
        </Modal>
      )}
      {property && (
        <PropertyDetail
          property={property}
          data={data}
          hidden={settings.hideBalances}
          onClose={() => setProperty(null)}
          onImport={showImport}
          onRequest={() => startRequest(property)}
          onStatement={showStatement}
        />
      )}
      {currentStatement && data.properties.find((p) => p.id === currentStatement.propertyId) && (
        <StatementDetail
          statement={currentStatement}
          property={data.properties.find((p) => p.id === currentStatement.propertyId)!}
          hidden={settings.hideBalances}
          onClose={() => setStatementId(null)}
          notify={notify}
          onRequest={() =>
            startRequest(
              data.properties.find((p) => p.id === currentStatement.propertyId)!,
              currentStatement,
            )
          }
          onUpdate={(s) => {
            if (
              update({
                ...data,
                statements: data.statements.map((row) => (row.id === s.id ? s : row)),
              })
            )
              notify(
                s.paidNote ? 'Marked as paid for your records.' : 'Personal payment note removed.',
              );
          }}
          onDelete={() => {
            void (async () => {
              try {
                const fileId = currentStatement.fileId;
                const linked =
                  Boolean(fileId) &&
                  data.requests.some(
                    (r) =>
                      r.statement?.fileId === fileId || r.comparison?.previous.fileId === fileId,
                  );
                if (
                  update({
                    ...data,
                    statements: data.statements.filter((s) => s.id !== currentStatement.id),
                  })
                ) {
                  if (fileId && !linked) await deleteDocument(fileId);
                  setStatementId(null);
                  notify(
                    linked
                      ? 'Statement removed from the library. Its PDF stays with your linked request.'
                      : 'Statement removed from this device.',
                  );
                }
              } catch {
                notify('Could not remove the original PDF. Please try again.');
              }
            })();
          }}
        />
      )}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast"
            role="status"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <CheckCircleIcon size={21} />
            <span>{toast}</span>
            <button aria-label="Dismiss notification" onClick={() => setToast('')}>
              <XIcon size={17} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {needRefresh && (
        <div className="update-toast" role="status">
          <span>A fresh version of Billora is ready.</span>
          <button className="text-button" onClick={() => void updateServiceWorker(true)}>
            Update
            <ArrowRightIcon />
          </button>
        </div>
      )}
    </MotionConfig>
  );
}
