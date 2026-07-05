import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Home, Building, Store, Briefcase, Warehouse, MapPin } from 'lucide-react';
import { Button } from '../components/UI/Button';
import { Card } from '../components/UI/Card';
import { Input, Textarea } from '../components/UI/Input';
import { useInspections } from '../contexts/InspectionContext';
import type { PropertyType, Inspection } from '../types';

const propertyTypes: { value: PropertyType; label: string; icon: typeof Home }[] = [
  { value: 'casa', label: 'Casa', icon: Home },
  { value: 'departamento', label: 'Departamento', icon: Building },
  { value: 'ph', label: 'PH', icon: Building },
  { value: 'local', label: 'Local Comercial', icon: Store },
  { value: 'oficina', label: 'Oficina', icon: Briefcase },
  { value: 'galpon', label: 'Galpón', icon: Warehouse },
  { value: 'terreno', label: 'Terreno', icon: MapPin },
];

export function NewInspection() {
  const navigate = useNavigate();
  const { dispatch } = useInspections();
  const [address, setAddress] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('casa');
  const [client, setClient] = useState('');
  const [observations, setObservations] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inspection: Inspection = {
      id: crypto.randomUUID(),
      address,
      propertyType,
      client,
      observations,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      images: [],
      results: null,
    };
    dispatch({ type: 'CREATE', payload: inspection });
    navigate(`/inspection/${inspection.id}/upload`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nueva Inspección</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Completá los datos básicos de la propiedad</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Dirección *</label>
            <Input
              required
              placeholder="Ingresá la dirección completa"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tipo de Propiedad *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {propertyTypes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPropertyType(value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    propertyType === value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Icon size={24} />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Cliente</label>
            <Input
              placeholder="Nombre del cliente o inmobiliaria"
              value={client}
              onChange={e => setClient(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Observaciones</label>
            <Textarea
              rows={3}
              placeholder="Notas adicionales sobre la propiedad..."
              value={observations}
              onChange={e => setObservations(e.target.value)}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" size="lg" disabled={!address.trim()}>
              Continuar con Fotos
              <ArrowRight size={18} />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
