
import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Package, Box, Weight, Building2, Save } from 'lucide-react';
import { Category, TransactionType, CargoTypeCategory, MeasureUnit } from '../types';

interface CategoryManagerProps {
  categories: Category[];
  cargoTypes: CargoTypeCategory[];
  addCategory: (category: Omit<Category, 'id'>) => void;
  deleteCategory: (id: string) => void;
  addCargoType: (ct: Omit<CargoTypeCategory, 'id'>) => void;
  deleteCargoType: (id: string) => void;
  companyName: string;
  setCompanyName: (name: string) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ 
  categories, 
  cargoTypes, 
  addCategory, 
  deleteCategory, 
  addCargoType, 
  deleteCargoType,
  companyName,
  setCompanyName
}) => {
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<TransactionType>(TransactionType.REVENUE);

  const [newCargoName, setNewCargoName] = useState('');
  const [newCargoUnit, setNewCargoUnit] = useState<MeasureUnit>(MeasureUnit.WEIGHT);

  const [tempCompanyName, setTempCompanyName] = useState(companyName);
  const [isEditingCompany, setIsEditingCompany] = useState(false);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addCategory({ name: newName, type: newType });
    setNewName('');
  };

  const handleAddCargo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCargoName.trim()) return;
    addCargoType({ name: newCargoName, unit: newCargoUnit });
    setNewCargoName('');
  };

  const handleSaveCompanyName = () => {
    if (tempCompanyName.trim()) {
      setCompanyName(tempCompanyName);
      setIsEditingCompany(false);
    }
  };

  const getTypeLabel = (type: TransactionType) => {
    switch (type) {
      case TransactionType.REVENUE: return { label: 'Receita', color: 'bg-emerald-100 text-emerald-700' };
      case TransactionType.FIXED_COST: return { label: 'Custo Fixo', color: 'bg-slate-100 text-slate-700' };
      case TransactionType.VARIABLE_EXPENSE: return { label: 'Despesa Variável', color: 'bg-rose-100 text-rose-700' };
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      {/* Configurações Gerais da Empresa */}
      <section className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Building2 size={24} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Identidade da Empresa</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Nome da Empresa / Transportadora</label>
              <input
                type="text"
                placeholder="Ex: Transportadora Silva S/A"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold text-slate-700"
                value={tempCompanyName}
                onChange={(e) => setTempCompanyName(e.target.value)}
                onFocus={() => setIsEditingCompany(true)}
              />
            </div>
            {isEditingCompany && (
              <button
                onClick={handleSaveCompanyName}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-100 animate-in zoom-in-95"
              >
                <Save size={20} /> Salvar Nome
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">Este nome aparecerá no cabeçalho e nos relatórios exportados.</p>
        </div>
      </section>

      {/* Gestão de Categorias Financeiras */}
      <section className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Categorias Financeiras</h2>
          <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Ex: Aluguel, Bonus, Peças..."
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <select
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={newType}
                onChange={(e) => setNewType(e.target.value as TransactionType)}
              >
                <option value={TransactionType.REVENUE}>Receita</option>
                <option value={TransactionType.FIXED_COST}>Custo Fixo</option>
                <option value={TransactionType.VARIABLE_EXPENSE}>Despesa Variável</option>
              </select>
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-black flex items-center justify-center gap-2 transition-colors"
            >
              <Plus size={20} /> Adicionar
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[TransactionType.REVENUE, TransactionType.FIXED_COST, TransactionType.VARIABLE_EXPENSE].map(type => (
            <div key={type} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-700">{getTypeLabel(type).label}s</h3>
              </div>
              <div className="p-4">
                <ul className="space-y-2">
                  {categories.filter(c => c.type === type).map(cat => (
                    <li key={cat.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 group border border-transparent hover:border-slate-200 transition-all">
                      <span className="text-slate-700 font-medium">{cat.name}</span>
                      <button 
                        onClick={() => deleteCategory(cat.id)}
                        className="text-slate-300 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Gestão de Tipos de Carga */}
      <section className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Package size={24} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Tipos de Carga (Odometria / Carga)</h2>
          </div>
          <form onSubmit={handleAddCargo} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Ex: Soja, Calcário, Minério..."
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={newCargoName}
                onChange={(e) => setNewCargoName(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-56">
              <select
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                value={newCargoUnit}
                onChange={(e) => setNewCargoUnit(e.target.value as MeasureUnit)}
              >
                <option value={MeasureUnit.WEIGHT}>Medir por PESO (Toneladas)</option>
                <option value={MeasureUnit.VOLUME}>Medir por VOLUME (m³)</option>
              </select>
            </div>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-black flex items-center justify-center gap-2 transition-colors"
            >
              <Plus size={20} /> Cadastrar Carga
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cargoTypes.map(ct => (
            <div key={ct.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${ct.unit === MeasureUnit.WEIGHT ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                  {ct.unit === MeasureUnit.WEIGHT ? <Weight size={18} /> : <Box size={18} />}
                </div>
                <div>
                  <div className="font-bold text-slate-800">{ct.name}</div>
                  <div className="text-[10px] font-black uppercase text-slate-400">
                    Exige {ct.unit === MeasureUnit.WEIGHT ? 'Peso' : 'Volume'}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => deleteCargoType(ct.id)}
                className="text-slate-300 hover:text-rose-600 transition-colors p-2"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CategoryManager;
