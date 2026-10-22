import { useState } from 'react';
import {
  ArrowDownIcon,
  ArrowUpRightIcon,
  DesktopIcon,
  DeviceMobileIcon,
  MoonIcon,
  ShieldCheckIcon,
  SunIcon,
} from '@phosphor-icons/react';
import type { Settings } from '../types';
import { AnimatedTabs } from './AnimatedTabs';
import { Modal } from './Modal';

export function SettingsDialog({
  settings,
  onChange,
  onClose,
  onInstall,
  installAvailable,
  onExport,
  onClear,
  onTour,
  onDemo,
  offline,
}: {
  settings: Settings;
  onChange: (s: Settings) => void;
  onClose: () => void;
  onInstall: () => void;
  installAvailable: boolean;
  onExport: () => void;
  onClear: () => Promise<void>;
  onTour: () => void;
  onDemo: () => void;
  offline: boolean;
}) {
  const [clear, setClear] = useState(false);
  const [name, setName] = useState(settings.name);
  return (
    <Modal
      title="Make Billora yours."
      description="A few thoughtful touches, just how you like them."
      onClose={onClose}
    >
      <div className="settings-body">
        <label className="setting-label">
          What should we call you?
          <input
            maxLength={35}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => onChange({ ...settings, name: name.trim() || 'Alex' })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
            placeholder="Your first name"
          />
        </label>
        <div className="setting-section">
          <span className="setting-label">Appearance</span>
          <AnimatedTabs
            label="Appearance"
            value={settings.theme}
            onChange={(theme) => onChange({ ...settings, theme })}
            items={[
              { id: 'light', label: 'Light', icon: <SunIcon /> },
              { id: 'dark', label: 'Dark', icon: <MoonIcon /> },
              { id: 'system', label: 'System', icon: <DesktopIcon /> },
            ]}
          />
          <small>System follows your device, from sunrise to lights out.</small>
        </div>
        <div className="setting-row">
          <span>
            <strong>Gentler motion</strong>
            <small>Keep things still and comfortable.</small>
          </span>
          <button
            className={`switch ${settings.reduceMotion ? 'on' : ''}`}
            role="switch"
            aria-checked={settings.reduceMotion}
            aria-label="Gentler motion"
            onClick={() => onChange({ ...settings, reduceMotion: !settings.reduceMotion })}
          >
            <span />
          </button>
        </div>
        <div className="setting-row">
          <span>
            <strong>Hide balances</strong>
            <small>A little privacy when you need it.</small>
          </span>
          <button
            className={`switch ${settings.hideBalances ? 'on' : ''}`}
            role="switch"
            aria-checked={settings.hideBalances}
            aria-label="Hide balances"
            onClick={() => onChange({ ...settings, hideBalances: !settings.hideBalances })}
          >
            <span />
          </button>
        </div>
        <div className="install-panel">
          <DeviceMobileIcon size={32} weight="duotone" />
          <div>
            <h3>A little closer to home.</h3>
            <p>
              {matchMedia('(display-mode: standalone)').matches
                ? 'Billora is running as an installed app.'
                : installAvailable
                  ? 'Add Billora to your home screen for a full-screen workspace.'
                  : 'On iPhone: tap Share, then Add to Home Screen. On desktop: use your browser’s Install app option when available.'}
            </p>
            {installAvailable && (
              <button className="text-button" onClick={onInstall}>
                Install Billora
                <ArrowUpRightIcon />
              </button>
            )}
          </div>
        </div>
        <div className="setting-section">
          <span className="setting-label">Your workspace</span>
          <p className="small-note">
            <ShieldCheckIcon size={17} />
            Your data and original PDFs are stored in this browser on this device. There is no cloud
            sync or account login. Export records and keep copies of your PDFs before clearing
            browser data.
          </p>
          <button className="settings-action" onClick={onExport}>
            <ArrowDownIcon />
            Export account data (JSON)
            <ArrowUpRightIcon />
          </button>
          <button className="settings-action" onClick={onTour}>
            Take the welcome tour
            <ArrowUpRightIcon />
          </button>
          {clear ? (
            <div className="delete-section">
              <p>
                This removes all sample and imported records, properties and original PDFs from this
                device. Export anything you need first.
              </p>
              <div>
                <button className="button secondary" onClick={() => setClear(false)}>
                  Keep my data
                </button>
                <button className="button danger" onClick={() => void onClear()}>
                  Clear workspace
                </button>
              </div>
            </div>
          ) : (
            <button className="text-button muted" onClick={() => setClear(true)}>
              Clear workspace & start fresh
            </button>
          )}
        </div>
        <section className="demo-entry">
          <span className="demo-label">DEMO INTEGRATION</span>
          <h3>A more connected Billora.</h3>
          <p>
            Try a demo cloud account and an authorised municipal connection flow. Every sync and
            balance is simulated on this device.
          </p>
          <button className="text-button" onClick={onDemo}>
            Explore cloud & municipal demo
            <ArrowUpRightIcon />
          </button>
        </section>
        <section className="settings-legal" aria-labelledby="settings-legal-title">
          <h3 id="settings-legal-title">Privacy &amp; legal</h3>
          <p>Clear policies for this browser-local preview. Operator details are still pending.</p>
          <div>
            <a href="/legal/privacy/">
              Privacy policy <ArrowUpRightIcon size={16} />
            </a>
            <a href="/legal/data/">
              Data &amp; deletion <ArrowUpRightIcon size={16} />
            </a>
            <a href="/legal/terms/">
              Terms of use <ArrowUpRightIcon size={16} />
            </a>
            <a href="/legal/">
              All legal documents <ArrowUpRightIcon size={16} />
            </a>
          </div>
        </section>
        <div className="settings-footer">
          <img src="/logo.png" width="24" alt="" />
          <span>
            Billora<small>A little clarity for everything home.</small>
          </span>
          <span className="connection-status">
            <i className={offline ? 'offline' : ''} />
            {offline ? 'Offline' : 'On this device'}
          </span>
        </div>
      </div>
    </Modal>
  );
}
