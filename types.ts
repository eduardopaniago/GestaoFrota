
export enum TransactionType {
  REVENUE = 'REVENUE',
  FIXED_COST = 'FIXED_COST',
  VARIABLE_EXPENSE = 'VARIABLE_EXPENSE'
}

export enum MeasureUnit {
  WEIGHT = 'WEIGHT',
  VOLUME = 'VOLUME'
}

export enum MaintenanceStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export interface UserProfile {
  name: string;
  email: string;
  picture: string;
  id: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
}

export interface CargoTypeCategory {
  id: string;
  name: string;
  unit: MeasureUnit;
}

export interface Truck {
  id: string;
  plate: string;
  model: string;
}

export interface FuelRecord {
  id: string;
  date: string;
  truckId: string;
  mileage: number;
  liters: number;
  pricePerLiter: number;
  cost: number;
}

export interface MaintenanceOrder {
  id: string;
  truckId: string;
  title: string;
  description: string;
  resultNotes?: string;
  dateStarted: string;
  dateFinished?: string;
  status: MaintenanceStatus;
  type: 'PREVENTIVA' | 'CORRETIVA';
}

export interface BudgetOption {
  id: string;
  supplier: string;
  amount: number;
  details: string;
  date: string;
  isSelected: boolean;
}

export interface BudgetRequest {
  id: string;
  title: string;
  productName: string;
  description: string;
  date: string;
  options: BudgetOption[];
}

export interface Transaction {
  id: string;
  date: string;
  executionDate: string;
  dueDate?: string;
  isPaid: boolean;
  amount: number;
  description: string;
  subCategory?: string;
  categoryId: string;
  type: TransactionType;
  truckId?: string;
  maintenanceId?: string;
  fuelRecordId?: string;
  mileage?: number;
  liters?: number;
  pricePerLiter?: number;
  startMileage?: number;
  endMileage?: number;
  weight?: number;
  volume?: number;
  cargoTypeId?: string;
  cargoTypeLabel?: string;
}

export type View = 'DASHBOARD' | 'TRANSACTIONS' | 'AI_ENTRY' | 'IMPORT' | 'CATEGORIES' | 'FUEL' | 'REPORTS' | 'TRUCKS' | 'BUDGETS' | 'WORKSHOP' | 'CLIENT_QUOTES' | 'CLOUD_SYNC';
