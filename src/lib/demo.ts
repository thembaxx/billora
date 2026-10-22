import type { Municipality } from '../types';

export interface DemoAccount {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  demo: true;
}
export interface DemoConnection {
  id: string;
  propertyId: string;
  municipality: Municipality;
  demo: true;
  authorisedAt: string;
  lastSyncedAt: string;
}
export interface DemoWorkspace {
  account: DemoAccount | null;
  connections: DemoConnection[];
}
export const DEMO_STORE = 'billora-demo';
export function readDemo(): DemoWorkspace {
  try {
    const value = JSON.parse(localStorage.getItem(DEMO_STORE) || 'null');
    if (
      value &&
      Array.isArray(value.connections) &&
      (!value.account || value.account.demo === true)
    )
      return value;
  } catch {
    /* A demo profile can always start fresh. */
  }
  return { account: null, connections: [] };
}
export function saveDemo(value: DemoWorkspace) {
  localStorage.setItem(DEMO_STORE, JSON.stringify(value));
}
const fixtures: Record<Municipality, { amount: number; ref: string; statements: number }> = {
  'City of Tshwane': { amount: 1865.4, ref: 'DEMO-TSH-0001', statements: 6 },
  'City of Johannesburg': { amount: 1617.2, ref: 'DEMO-JHB-0001', statements: 6 },
  'City of Cape Town': { amount: 1248.6, ref: 'DEMO-CPT-0001', statements: 3 },
  'City of Ekurhuleni': { amount: 1492.8, ref: 'DEMO-EKU-0001', statements: 3 },
  'Other municipality': { amount: 1420, ref: 'DEMO-ZA-0001', statements: 3 },
};
export function demoResponse(connection: DemoConnection) {
  return {
    demo: true,
    source: 'Billora local demonstration',
    provider: connection.municipality,
    reference: fixtures[connection.municipality].ref,
    balance: {
      amount: fixtures[connection.municipality].amount,
      currency: 'ZAR',
      verification: 'simulated — not a live municipal balance',
    },
    statementCount: fixtures[connection.municipality].statements,
    scopes: ['account:read', 'statements:read'],
    authorisation: { recordedForDemo: true, recordedAt: connection.authorisedAt },
    syncedAt: connection.lastSyncedAt,
    liveMunicipalConnection: false,
    cloudStorage: false,
    paymentProcessing: false,
  };
}
