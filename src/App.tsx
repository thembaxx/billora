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
import type { Property, Settings, Statement, View, Workspace } from './types';
import {
  calendarFile,
  dateLabel,
  download,
  latestStatements,
  money,
  readWorkspace,
} from './lib/data';
import { clearDocuments, deleteDocument } from './lib/documents';
import { AnimatedTabs } from './components/AnimatedTabs';
import { Modal } from './components/Modal';
import { Overview } from './components/Overview';
import { Insights, Properties, Statements } from './components/Screens';
import { ImportForm, PropertyForm } from './components/Forms';
import { PropertyDetail, StatementDetail } from './components/DetailDialogs';
import { SettingsDialog } from './components/SettingsDialog';
import { Onboarding } from './components/Onboarding';
import { Flower } from './components/Flower';
import { DemoConnections } from './components/DemoConnections';

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
    description: 'Your municipal accounts, together. Just as they should be.',
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
type Dialog = 'settings' | 'import' | 'add' | 'search' | 'reminders' | 'tour' | 'demo' | null;
const initialDialog = (): Dialog => {
  const params = new URLSearchParams(location.search);
  if (params.has('import')) return 'import';
  if (params.has('settings')) return 'settings';
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
    return {
      theme: 'system',
      reduceMotion: false,
      hideBalances: false,
      name: 'Alex',
      ...JSON.parse(localStorage.getItem('billora-settings') || '{}'),
    };
  } catch {
    return { theme: 'system', reduceMotion: false, hideBalances: false, name: 'Alex' };
  }
};

export default function App() {
  const [data, setData] = useState<Workspace>(readWorkspace);
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [view, setView] = useState<View>(initialView);
  const [dialog, setDialog] = useState<Dialog>(initialDialog);
  const [property, setProperty] = useState<Property | null>(null);
  const [statementId, setStatementId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');
  const [offline, setOffline] = useState(!navigator.onLine);
  const [welcome, setWelcome] = useState(() => !localStorage.getItem('billora-welcomed'));
  const [install, setInstall] = useState<InstallPrompt | null>(null);
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
  const update = (next: Workspace) => {
    try {
      localStorage.setItem('billora-workspace', JSON.stringify(next));
      setData(next);
      return true;
    } catch {
      notify('Your browser could not save these changes. Free some device storage and try again.');
      return false;
    }
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
  };
  const finishTour = () => {
    localStorage.setItem('billora-welcomed', 'true');
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
            aria-label={`Reminders, ${pending.length} upcoming accounts`}
          >
            <BellIcon size={21} />
            {pending.length > 0 && <i />}
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
                localStorage.setItem('billora-welcomed', 'true');
                setWelcome(false);
              }}
            >
              <XIcon size={16} />
            </button>
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
            onDemo={() => setDialog('demo')}
          />
        )}
        {view === 'properties' && (
          <Properties
            data={data}
            settings={settings}
            onAdd={() => setDialog('add')}
            onDemo={() => setDialog('demo')}
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
        {view === 'insights' && <Insights data={data} settings={settings} />}
      </main>
      {dialog === 'add' && (
        <PropertyForm
          onClose={closeDialog}
          onSave={(p) => {
            const ok = update({ ...data, properties: [...data.properties, p] });
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
          onAddProperty={() => setDialog('add')}
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
            notify('Account data exported. Download original PDFs from each statement.');
          }}
          onClear={async () => {
            try {
              await clearDocuments();
              if (update({ properties: [], statements: [] })) {
                setDialog(null);
                notify('A clean slate. Your workspace is ready for your own accounts.');
              }
            } catch {
              notify('Could not clear the document store. Your workspace has been kept.');
            }
          }}
          onTour={() => setDialog('tour')}
          onDemo={() => setDialog('demo')}
        />
      )}
      {dialog === 'tour' && (
        <Onboarding reduced={reduced} onClose={finishTour} onStart={finishTour} />
      )}
      {dialog === 'demo' && (
        <DemoConnections data={data} onClose={closeDialog} onAddProperty={() => setDialog('add')} />
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
          description="Due dates from the latest statement for each property."
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
          {!pending.length && (
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
                if (currentStatement.fileId) await deleteDocument(currentStatement.fileId);
                if (
                  update({
                    ...data,
                    statements: data.statements.filter((s) => s.id !== currentStatement.id),
                  })
                ) {
                  setStatementId(null);
                  notify('Statement removed from this device.');
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
