import { ArrowUpRightIcon } from '@phosphor-icons/react';
import { Modal } from './Modal';

export function GuideDialog({
  onClose,
  onSettings,
  onImport,
}: {
  onClose: () => void;
  onSettings: () => void;
  onImport: () => void;
}) {
  return (
    <Modal
      title="A clearer bill. A prepared query."
      description="Help & project notes · browser-local portfolio preview"
      onClose={onClose}
    >
      <div className="form-stack project-guide">
        <section>
          <h3>From statement to evidence</h3>
          <p>
            Billora helps South African households organise municipal bills and ask informed
            questions about changes.
          </p>
          <ol>
            <li>
              Add your property. Sample accounts are illustrative and separate from personal
              records.
            </li>
            <li>
              Import a PDF or enter a bill manually. Open the original and check the total, month
              and due date before saving. Text suggestions can be wrong.
            </li>
            <li>
              Import the previous or next month for the same property. In Insights, compare
              consecutive months. Category comparisons need a breakdown for both bills.
            </li>
            <li>
              Prepare a query from a notable increase, or open Service requests for any concern.
              Review the letter and evidence, then download the request pack.
            </li>
          </ol>
          <p>
            Comparison packs include both saved originals and the reviewed comparison figures. A
            manually entered bill has no PDF. Billora never submits requests, verifies payments or
            connects to a live municipal account.
          </p>
          <button className="button primary" onClick={onImport}>
            Import a statement <ArrowUpRightIcon size={18} />
          </button>
        </section>
        <section>
          <h3>Keep a copy you control</h3>
          <p>
            Records, originals and evidence stay in this browser profile. Clearing site data or
            changing devices can remove access. Download an encrypted full backup in Settings and
            keep its password separately. Restore replaces your current workspace after
            confirmation.
          </p>
          <p>
            Account JSON contains records only. A request ZIP is an unencrypted sharing pack, not a
            restorable backup. Hidden balances are still included in downloads.
          </p>
          <button className="button secondary" onClick={onSettings}>
            Open backup & data controls
          </button>
        </section>
        <section>
          <h3>If something goes wrong</h3>
          <p>
            For unreadable saved records, use the recovery banner to download them before restoring
            or clearing. For a full device, free storage and retry. If a PDF cannot be read, enter
            its figures manually; optional OCR reads up to five scanned pages locally after
            downloading tools. Missing evidence must be attached again before export.
          </p>
          <p>
            For app problems,{' '}
            <a href="https://github.com/thembaxx/billora/issues" target="_blank" rel="noreferrer">
              report an issue on GitHub<span className="sr-only"> (opens in a new tab)</span>
            </a>
            . Include browser, steps and an anonymised example. GitHub issues are public: omit
            account numbers, addresses, bills, passwords and backups. For billing decisions, contact
            your municipality through its official channel.
          </p>
        </section>
        <section>
          <h3>Why this project exists</h3>
          <p>
            The design challenge is turning scattered statements into a reviewable question without
            implying access to private municipal systems. The implementation combines local PDF
            extraction, explicit human review, conservative comparisons and portable evidence.
          </p>
          <p>
            This is a functional local preview, with no claim of user research outcomes, savings or
            municipal approval. Cloud and municipal connection screens are simulations. Legal drafts
            still need operator details; browser/device compatibility and authorised integrations
            need further work.
          </p>
          <p>
            <a
              href="https://github.com/thembaxx/billora/blob/main/docs/CASE_STUDY.md"
              target="_blank"
              rel="noreferrer"
            >
              Read the case study<span className="sr-only"> (opens in a new tab)</span>
            </a>{' '}
            ·{' '}
            <a
              href="https://github.com/thembaxx/billora/blob/main/docs/LAUNCH_EVIDENCE.md"
              target="_blank"
              rel="noreferrer"
            >
              Release verification<span className="sr-only"> (opens in a new tab)</span>
            </a>{' '}
            · <a href="/legal/">Privacy & legal drafts</a>
          </p>
        </section>
      </div>
    </Modal>
  );
}
