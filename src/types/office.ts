export type DepartmentId = 'acquisitions' | 'dispositions' | 'operations' | 'ceo' | 'deal-review';

export type CameraMode = 'isometric' | 'fpv' | 'acquisitions' | 'dispositions' | 'operations' | 'ceo' | 'deal-review' | 'entry';

export interface DepartmentInfo {
  id: DepartmentId;
  name: string;
  specialistTitle: string;
  specialistName: string;
  shortDesc: string;
  focusArea: string;
  primaryMetrics: { label: string; value: string; change?: string }[];
  currentTasks: string[];
  dealDeskModule: string;
  accentColor: string;
  position: [number, number, number]; // 3D coordinates in office
}

export interface RealEstateDeal {
  id: string;
  address: string;
  submarket: 'Brookhaven' | 'Buckhead' | 'Sandy Springs' | 'Dunwoody' | 'Roswell';
  propertyType: 'Redevelopment Teardown' | 'Distressed Residential' | 'Vacant Residential Lot';
  yearBuilt: number;
  lotSize: string;
  askingPrice: number;
  sureCashOffer: number;
  contractPrice: number;
  projectedArv: number;
  estimatedBuildCost: number;
  builderResalePrice: number;
  grossSpread: number;
  netProfit: number;
  stage: 'Intake & Underwriting' | 'SureCash Offer Submitted' | 'Under Contract (DD)' | 'Matched to Builder' | 'Closing Scheduled' | 'Double Closed';
  matchedBuyer?: string;
  dueDiligenceDaysLeft?: number;
  emdStatus: '1% Deposited ($' | 'Pending Escrow' | 'Released to Weissman PC';
  closingAttorney: 'Weissman PC';
  targetClosingDate: string;
  notes: string;
}

export interface UnderwritingScenario {
  arv: number;
  constructionCost: number;
  builderProfitTarget: number;
  azreTargetSpread: number;
  transactionFees: number;
  maxAllowableOffer: number;
}
