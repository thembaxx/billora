import { ArrowUpRightIcon, BuildingsIcon, HouseLineIcon } from '@phosphor-icons/react';
import type { Property, Statement } from '../types';
import { money, dateLabel } from '../lib/data';

export function PropertyCard({
  property,
  statement,
  onClick,
  hidden = false,
  large = false,
}: {
  property: Property;
  statement?: Statement;
  onClick: () => void;
  hidden?: boolean;
  large?: boolean;
}) {
  return (
    <button className={`property-card ${large ? 'large' : ''}`} onClick={onClick}>
      <div className="property-photo">
        <img
          src={property.kind === 'Home' ? '/images/home.webp' : '/images/apartment.webp'}
          alt=""
        />
        <span className="property-kind">
          {property.kind === 'Home' ? <HouseLineIcon /> : <BuildingsIcon />}
          {property.kind}
        </span>
      </div>
      <div className="property-info">
        <span className="municipality">{property.municipality}</span>
        <h3>{property.name}</h3>
        {large && <p>{property.address}</p>}
        <div className="property-bottom">
          <strong className="numeric">
            {hidden ? 'R •••••' : statement ? money(statement.amount) : 'No statement yet'}
          </strong>
          <span>
            {statement ? `Due ${dateLabel(statement.dueDate)}` : 'Add your first bill'}
            <ArrowUpRightIcon size={15} />
          </span>
        </div>
      </div>
    </button>
  );
}
