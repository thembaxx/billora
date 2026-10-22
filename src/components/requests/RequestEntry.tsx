import { ArrowRightIcon, ClipboardTextIcon } from '@phosphor-icons/react';
import type { ServiceRequest } from '../../types';
import { followUpDue } from '../../lib/requests';

export function RequestEntry({
  requests,
  onOpen,
}: {
  requests: ServiceRequest[];
  onOpen: () => void;
}) {
  const open = requests.filter((r) => r.status !== 'resolved').length;
  const due = requests.filter(followUpDue).length;
  return (
    <section className="request-entry reveal">
      <span className="request-entry-icon">
        <ClipboardTextIcon size={28} weight="duotone" />
      </span>
      <div>
        <span className="eyebrow">SERVICE REQUESTS</span>
        <h2>A little help. A clear next step.</h2>
        <p>
          {requests.length
            ? `${open} open · ${due} personal follow-up${due === 1 ? '' : 's'} due. Your updates, in one place.`
            : 'Prepare a request, gather evidence and keep track of your follow-up.'}
        </p>
      </div>
      <button className="button secondary" onClick={onOpen}>
        Service requests <ArrowRightIcon size={18} />
      </button>
    </section>
  );
}
