import type { Statement, Workspace } from '../types';

export const billCategories = {
  electricity: 'Electricity',
  water: 'Water',
  rates: 'Property rates',
  services: 'Other / unallocated',
} as const;

type Category = keyof typeof billCategories;
export interface BillChange {
  propertyId: string;
  propertyName: string;
  current: Statement;
  previous: Statement;
  category: Category | 'total';
  label: string;
  before: number;
  after: number;
  difference: number;
  percent: number | null;
  notable: boolean;
}

const monthNumber = (period: string) => {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) return null;
  return Number(period.slice(0, 4)) * 12 + Number(period.slice(5, 7));
};

export function billChanges(data: Workspace): BillChange[] {
  return data.properties.flatMap((property) => {
    const history = data.statements
      .filter((s) => s.propertyId === property.id && s.source === 'imported')
      .sort((a, b) => b.period.localeCompare(a.period) || b.importedAt.localeCompare(a.importedAt));
    const current = history[0];
    const previous = history[1];
    if (
      !current ||
      !previous ||
      monthNumber(current.period) === null ||
      monthNumber(previous.period) !== monthNumber(current.period)! - 1
    )
      return [];

    const categories: Array<Category | 'total'> = ['total'];
    if (current.categoryReviewed && previous.categoryReviewed) {
      categories.push('electricity', 'water', 'rates', 'services');
    }
    return categories.flatMap((category) => {
      const before = category === 'total' ? previous.amount : previous.categories[category];
      const after = category === 'total' ? current.amount : current.categories[category];
      if (!Number.isFinite(before) || !Number.isFinite(after) || before < 0 || after < 0) return [];
      const difference = Math.round((after - before) * 100) / 100;
      const percent = before > 0 ? (difference / before) * 100 : null;
      return [
        {
          propertyId: property.id,
          propertyName: property.name,
          current,
          previous,
          category,
          label: category === 'total' ? 'Total bill' : billCategories[category],
          before,
          after,
          difference,
          percent,
          notable:
            difference >= (category === 'total' ? 250 : 100) &&
            (percent === null ? false : percent >= 30),
        },
      ];
    });
  });
}
