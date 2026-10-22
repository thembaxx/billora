export type View = 'overview' | 'properties' | 'statements' | 'insights';
export type Municipality =
  | 'City of Tshwane'
  | 'City of Johannesburg'
  | 'City of Cape Town'
  | 'City of Ekurhuleni'
  | 'Other municipality';
export interface Property {
  id: string;
  name: string;
  address: string;
  municipality: Municipality;
  account: string;
  kind: 'Home' | 'Rental' | 'Business';
}
export interface Statement {
  id: string;
  propertyId: string;
  period: string;
  amount: number;
  dueDate: string;
  importedAt: string;
  source: 'sample' | 'imported';
  categories: { electricity: number; water: number; rates: number; services: number };
  fileName?: string;
  fileId?: string;
  extractedText?: string;
  confidence?: 'reviewed' | 'manual';
  paidNote?: boolean;
}
export interface Workspace {
  properties: Property[];
  statements: Statement[];
  requests: ServiceRequest[];
}
export type RequestKind = 'billing' | 'meter' | 'water' | 'electricity' | 'refuse' | 'other';
export interface RequestAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
}
export interface RequestEvent {
  id: string;
  at: string;
  text: string;
}
export interface ServiceRequest {
  id: string;
  localReference: string;
  propertyId: string;
  property: Pick<Property, 'name' | 'address' | 'municipality' | 'account'>;
  kind: RequestKind;
  description: string;
  desiredOutcome: string;
  incidentDate: string;
  statement?: Pick<Statement, 'id' | 'period' | 'amount' | 'source' | 'fileId' | 'fileName'>;
  evidence: RequestAttachment[];
  checked: string[];
  confirmed: boolean;
  status: 'draft' | 'ready' | 'submitted' | 'resolved';
  submission?: {
    reference: string;
    channel: string;
    date: string;
    followUpOn: string;
  };
  events: RequestEvent[];
  createdAt: string;
  updatedAt: string;
}
export interface Settings {
  theme: 'light' | 'dark' | 'system';
  reduceMotion: boolean;
  hideBalances: boolean;
  name: string;
}
export const portals: Record<Municipality, string> = {
  'City of Tshwane': 'https://www.e-tshwane.co.za/',
  'City of Johannesburg': 'https://www.e-joburg.org.za/',
  'City of Cape Town': 'https://eservices.capetown.gov.za/',
  'City of Ekurhuleni': 'https://siyakhokha.ekurhuleni.gov.za/',
  'Other municipality':
    'https://www.gov.za/about-government/contact-directory/provincial-local-government',
};
