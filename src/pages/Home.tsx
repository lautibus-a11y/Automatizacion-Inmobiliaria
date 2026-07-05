import { useNavigate } from 'react-router-dom';
import { PlusCircle, ClipboardList, BarChart3, Camera, FileText, Brain } from 'lucide-react';
import { Button } from '../components/UI/Button';
import { Card } from '../components/UI/Card';
import { useInspections } from '../contexts/InspectionContext';

export function Home() {
  const navigate = useNavigate();
  const { state } = useInspections();
  const count = state.inspections.length;
  const completed = state.inspections.filter(i => i.status === 'completed').length;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Panel Principal</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gestión de inspecciones inmobiliarias</p>
        </div>
        <Button size="lg" onClick={() => navigate('/new')}>
          <PlusCircle size={18} />
          Nueva Inspección
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <ClipboardList size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{count}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Inspecciones</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              <BarChart3 size={24} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{completed}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Completadas</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <Camera size={24} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {state.inspections.reduce((s, i) => s + i.images.length, 0)}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Fotos Cargadas</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Inicio Rápido</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/new')}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left cursor-pointer"
            >
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <Camera size={20} className="text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Nueva Inspección</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Crear y cargar fotos de una propiedad</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/inspections')}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left cursor-pointer"
            >
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <FileText size={20} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Ver Inspecciones</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Acceder a inspecciones existentes</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left cursor-pointer"
            >
              <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                <Brain size={20} className="text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Configurar IA</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Conectar API de OpenRouter</p>
              </div>
            </button>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Cómo funciona</h2>
          <div className="space-y-4">
            {[
              { step: 1, title: 'Crear inspección', desc: 'Ingresá los datos de la propiedad' },
              { step: 2, title: 'Cargar imágenes', desc: 'Subí hasta 100 fotos de la propiedad' },
              { step: 3, title: 'Procesar con IA', desc: 'Analizamos cada imagen automáticamente' },
              { step: 4, title: 'Obtener informe', desc: 'Exportá el resultado en PDF, Word o CSV' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex items-start gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-sm font-bold shrink-0">
                  {step}
                </span>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white text-sm">{title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
