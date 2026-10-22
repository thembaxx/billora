import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRightIcon,
  CheckCircleIcon,
  FilePdfIcon,
  ShieldCheckIcon,
  UploadSimpleIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import type { Municipality, Property, Statement, Workspace } from '../types';
import { deleteDocument, extractPDF, saveDocument } from '../lib/documents';
import { Modal } from './Modal';
import { suggestStatementFields, type Suggestions } from '../lib/extract-suggestions';

export function PropertyForm({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (p: Property) => boolean;
}) {
  const [error, setError] = useState('');
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const property: Property = {
      id: crypto.randomUUID(),
      name: String(form.get('name')).trim(),
      address: String(form.get('address')).trim(),
      municipality: form.get('municipality') as Municipality,
      account: String(form.get('account')).trim(),
      kind: form.get('kind') as Property['kind'],
    };
    if (!property.name || !property.address) {
      setError('Add a property name and address to continue.');
      return;
    }
    if (onSave(property)) onClose();
    else
      setError(
        'This device could not save your property. Check your browser storage and try again.',
      );
  };
  return (
    <Modal
      title="Make room for your place."
      description="Add the details once. Keep the whole picture together."
      onClose={onClose}
    >
      <form onSubmit={submit} className="form-stack">
        <label>
          Property name
          <input
            name="name"
            required
            maxLength={70}
            placeholder="e.g. My Parkhurst home"
            autoFocus
          />
        </label>
        <label>
          Street address
          <input name="address" required maxLength={160} placeholder="24 Sixth Avenue, Parkhurst" />
        </label>
        <div className="form-columns">
          <label>
            Municipality
            <select name="municipality">
              {[
                'City of Johannesburg',
                'City of Tshwane',
                'City of Cape Town',
                'City of Ekurhuleni',
                'Other municipality',
              ].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <label>
            Property type
            <select name="kind">
              <option>Home</option>
              <option>Rental</option>
              <option>Business</option>
            </select>
          </label>
        </div>
        <label>
          Municipal account number <small>Optional</small>
          <input
            name="account"
            maxLength={50}
            placeholder="As shown on your statement"
            inputMode="numeric"
          />
        </label>
        <div className="note-box">
          <ShieldCheckIcon size={20} />
          <p>
            These details stay on this device. Adding a property doesn’t connect to a municipal
            system.
          </p>
        </div>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <button className="button primary full" type="submit">
          Add property
          <ArrowRightIcon />
        </button>
      </form>
    </Modal>
  );
}

export function ImportForm({
  data,
  onClose,
  onSave,
  onAddProperty,
  initialFile,
}: {
  data: Workspace;
  onClose: () => void;
  onSave: (s: Statement) => boolean;
  onAddProperty: () => void;
  initialFile?: File;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState('');
  const [notice, setNotice] = useState('');
  const [manual, setManual] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestions>({});
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [due, setDue] = useState('');
  const [amountValue, setAmountValue] = useState('');
  const [breakdown, setBreakdown] = useState({ electricity: '', water: '', rates: '' });
  const [categoryReviewed, setCategoryReviewed] = useState(false);
  const [selected, setSelected] = useState(data.properties[0]?.id || '');
  const picker = useRef<HTMLInputElement>(null);
  const once = useRef(false);
  async function accept(incoming?: File) {
    if (!incoming) return;
    setError('');
    setNotice('');
    if (incoming.size > 15 * 1024 * 1024) {
      setError('Choose a PDF smaller than 15 MB.');
      return;
    }
    const header = new TextDecoder().decode(
      new Uint8Array(await incoming.slice(0, 5).arrayBuffer()),
    );
    if (!incoming.name.toLowerCase().endsWith('.pdf') || header !== '%PDF-') {
      setError('Choose a valid PDF municipal statement.');
      return;
    }
    setFile(incoming);
    setManual(false);
    setBusy(true);
    try {
      const result = await extractPDF(incoming);
      setText(result);
      setSuggestions(suggestStatementFields(result));
      setNotice(
        result.trim()
          ? 'Text extracted on your device. Check the PDF and enter its figures below.'
          : 'This looks like a scanned PDF. You can still save the original and enter its figures below.',
      );
    } catch {
      setText('');
      setSuggestions({});
      setNotice(
        'We couldn’t extract text from this PDF. You can still save the original and enter its figures below.',
      );
    } finally {
      setBusy(false);
    }
  }
  // The native file handler supplies its file only once per mounted import form.
  useEffect(() => {
    if (initialFile && !once.current) {
      once.current = true;
      void accept(initialFile);
    }
  }, [initialFile]);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!selected) {
      setError('Add a property before importing a statement.');
      return;
    }
    if (!file && !manual) {
      setError('Choose a PDF, or select “Enter a statement manually”.');
      return;
    }
    const form = new FormData(e.currentTarget);
    const amount = Number(form.get('amount'));
    if (!Number.isFinite(amount) || amount < 0 || amount > 100000000) {
      setError('Enter a valid amount between R 0 and R 100,000,000.');
      return;
    }
    const values = {
      electricity: Number(form.get('electricity') || 0),
      water: Number(form.get('water') || 0),
      rates: Number(form.get('rates') || 0),
    };
    if (
      Object.values(values).some((v) => !Number.isFinite(v) || v < 0) ||
      Object.values(values).reduce((a, v) => a + v, 0) > amount + 0.01
    ) {
      setError('The category amounts must be positive and add up to no more than the total.');
      return;
    }
    const statement: Statement = {
      id: crypto.randomUUID(),
      propertyId: selected,
      period: String(form.get('period')),
      amount,
      dueDate: String(form.get('due')),
      importedAt: new Date().toISOString(),
      source: 'imported',
      categories: {
        ...values,
        services: +(amount - Object.values(values).reduce((a, v) => a + v, 0)).toFixed(2),
      },
      fileName: file?.name,
      extractedText: text,
      confidence: file ? 'reviewed' : 'manual',
      categoryReviewed,
    };
    if (
      data.statements.some(
        (s) =>
          s.source === 'imported' && s.propertyId === selected && s.period === statement.period,
      )
    ) {
      setError(
        'There is already an imported statement for this property and month. Open that statement to remove it before replacing it.',
      );
      return;
    }
    setBusy(true);
    try {
      if (file) {
        statement.fileId = statement.id;
        await saveDocument(statement.id, file);
      }
      if (!onSave(statement)) {
        if (statement.fileId) await deleteDocument(statement.fileId);
        throw new Error('Account data could not be saved. Check available browser storage.');
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save this statement. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title="Bring a little clarity."
      description="Import a statement. Keep the original. Review the details."
      onClose={onClose}
      wide
    >
      {!data.properties.length || data.statements.some((s) => s.source === 'sample') ? (
        <div className="empty-state">
          <FilePdfIcon size={48} />
          <h3>First, add your own property.</h3>
          <p>
            Illustrative sample properties are for exploring. Start your personal workspace before
            importing a real bill.
          </p>
          <button className="button primary" onClick={onAddProperty}>
            Add a property
            <ArrowRightIcon />
          </button>
        </div>
      ) : (
        <form className="form-stack" onSubmit={(e) => void submit(e)}>
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            ref={picker}
            onChange={(e) => void accept(e.target.files?.[0])}
            aria-label="Select municipal PDF"
          />
          <motion.button
            type="button"
            className={`upload-zone ${file ? 'has-file' : ''}`}
            whileHover={{ scale: 1.008 }}
            onClick={() => picker.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void accept(e.dataTransfer.files[0]);
            }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={file?.name || 'empty'}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {file ? (
                  <CheckCircleIcon size={35} weight="duotone" />
                ) : (
                  <UploadSimpleIcon size={35} weight="light" />
                )}
                <strong>{file ? file.name : 'Drop your municipal PDF here'}</strong>
                <small>
                  {busy
                    ? 'Reading your PDF…'
                    : file
                      ? `${(file.size / 1024).toFixed(0)} KB · Click to choose another`
                      : 'or choose a file · PDF up to 15 MB'}
                </small>
              </motion.span>
            </AnimatePresence>
          </motion.button>
          {!file && (
            <label className="check-label">
              <input
                type="checkbox"
                checked={manual}
                onChange={(e) => setManual(e.target.checked)}
              />
              Enter a statement manually
            </label>
          )}
          {notice && (
            <p className="import-notice" role="status">
              <WarningCircleIcon size={18} />
              {notice}
            </p>
          )}
          {Object.keys(suggestions).length > 0 && (
            <section className="note-box suggestion-review" aria-label="Suggested PDF fields">
              <div>
                <strong>Possible figures from your PDF</strong>
                <p>
                  Suggestions may be wrong. Compare each quoted passage with the original PDF before
                  saving.
                </p>
                <ul>
                  {Object.entries(suggestions).map(([field, suggestion]) => (
                    <li key={field}>
                      <strong>
                        {field}: {suggestion.value}
                      </strong>
                      <small>Found: “{suggestion.evidence}”</small>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="button secondary small"
                  onClick={() => {
                    if (suggestions.period) setPeriod(suggestions.period.value);
                    if (suggestions.due) setDue(suggestions.due.value);
                    if (suggestions.amount) setAmountValue(suggestions.amount.value);
                    const keys = ['electricity', 'water', 'rates'] as const;
                    setBreakdown((current) => {
                      const next = { ...current };
                      for (const key of keys)
                        if (suggestions[key]) next[key] = suggestions[key].value;
                      return next;
                    });
                    if (keys.some((key) => !!suggestions[key])) setCategoryReviewed(true);
                  }}
                >
                  Apply suggestions for review
                </button>
              </div>
            </section>
          )}
          <label>
            Property
            <select value={selected} onChange={(e) => setSelected(e.target.value)}>
              {data.properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <div className="form-columns">
            <label>
              Statement month
              <input
                name="period"
                type="month"
                required
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                min="2000-01"
                max="2100-12"
              />
            </label>
            <label>
              Payment due date
              <input
                name="due"
                type="date"
                required
                min="2000-01-01"
                max="2100-12-31"
                value={due}
                onChange={(e) => setDue(e.target.value)}
              />
            </label>
          </div>
          <label>
            Total due (ZAR)
            <input
              name="amount"
              type="number"
              value={amountValue}
              onChange={(e) => setAmountValue(e.target.value)}
              min="0"
              max="100000000"
              step="0.01"
              inputMode="decimal"
              required
              placeholder="0.00"
              className="numeric"
            />
          </label>
          <details className="category-details">
            <summary>
              Add a spending breakdown <span>Optional</span>
            </summary>
            <div className="form-columns three">
              {['electricity', 'water', 'rates'].map((c) => (
                <label key={c}>
                  {c[0].toUpperCase() + c.slice(1)} (R)
                  <input
                    name={c}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={breakdown[c as keyof typeof breakdown]}
                    onChange={(e) => {
                      setCategoryReviewed(true);
                      setBreakdown((prev) => ({ ...prev, [c]: e.target.value }));
                    }}
                  />
                </label>
              ))}
            </div>
            <small>The remainder is shown as other / unallocated.</small>
          </details>
          {text && (
            <details className="extracted-text">
              <summary>View extracted text</summary>
              <pre>{text}</pre>
            </details>
          )}
          <label className="check-label">
            <input type="checkbox" required />
            I’ve checked the total and due date against my statement.
          </label>
          <p className="small-note">
            <ShieldCheckIcon size={16} />
            <span>
              Your original PDF and reviewed figures stay on this device.{' '}
              <a
                className="inline-policy-link"
                href="/legal/privacy/"
                target="_blank"
                rel="noreferrer"
              >
                Privacy policy<span className="sr-only"> (opens in a new tab)</span>
              </a>
            </span>
          </p>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          <button className="button primary full" disabled={busy} type="submit">
            {busy ? 'Processing on your device…' : 'Save reviewed statement'}
            <ArrowRightIcon />
          </button>
        </form>
      )}
    </Modal>
  );
}
