
import { TransactionType, Category, CargoTypeCategory, MeasureUnit } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'Fretes', type: TransactionType.REVENUE },
  { id: '2', name: 'Seguro', type: TransactionType.FIXED_COST },
  { id: '3', name: 'Salários', type: TransactionType.FIXED_COST },
  { id: '4', name: 'Combustível', type: TransactionType.VARIABLE_EXPENSE },
  { id: '5', name: 'Manutenção', type: TransactionType.VARIABLE_EXPENSE },
  { id: '6', name: 'Pedágio', type: TransactionType.VARIABLE_EXPENSE },
];

export const INITIAL_CARGO_TYPES: CargoTypeCategory[] = [
  { id: 'c1', name: 'Aterro', unit: MeasureUnit.VOLUME },
  { id: 'c2', name: 'Brita 0', unit: MeasureUnit.WEIGHT },
  { id: 'c3', name: 'Brita 1', unit: MeasureUnit.WEIGHT },
  { id: 'c4', name: 'Areia', unit: MeasureUnit.VOLUME },
  { id: 'c5', name: 'Massa Asfáltica', unit: MeasureUnit.WEIGHT },
];

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
