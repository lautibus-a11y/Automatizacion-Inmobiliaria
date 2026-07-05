import { useNavigate } from 'react-router-dom';
import { PlusCircle, Camera, BarChart3, Clock, Trash2, ArrowUpRight } from 'lucide-react';
import { Button } from '../components/UI/Button';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import { useInspections } from '../contexts/InspectionContext';

const statusLabels: Record<string, { label: string; variant: string }> = {
  draft: { label: 'Borrador', variant: 'default' },
  photos_uploaded: { label: 'Fotos cargadas', variant: 'default' },
  processing: { label: 'Procesando', variant: 'medio' },
  completed: { label: 'Completado', variant: 'excelente' },
  error: { label: 'Error', variant: 'malo' },
};

export function InspectionsList() {
  const navigate = useNavigate();
  const { state, dispatch } = useInspections();

  if (state.inspections.length === 0) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20 animate-slide-up">
        <BarChart3 size={64} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No hay inspecciones</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Creá tu primera inspección para comenzar</p>
        <Button size="lg" onClick={() => navigate('/new')}>
          <PlusCircle size={18} />
          Nueva Inspección
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inspecciones</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{state.inspections.length} inspecciones registradas</p>
        </div>
        <Button onClick={() => navigate('/new')}>
          <PlusCircle size={18} />
          Nueva
        </Button>
      </div>

      <div className="space-y-3">
        {state.inspections.map(inspection => {
          const st = statusLabels[inspection.status];
          return (
            <Card key={inspection.id} padding={false}>
              <div className="p-5 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                      {inspection.address}
                    </h3>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <span className="capitalize">{inspection.propertyType}</span>
                    {inspection.client && <span>{inspection.client}</span>}
                    <span className="flex items-center gap-1">
                      <Camera size={14} />
                      {inspection.images.length} fotos
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {new Date(inspection.createdAt).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {inspection.results && (
                    <>
                      <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        {inspection.results.generalState.conservationScore}
                      </span>
                      <span className="text-xs text-slate-400">pts</span>
                    </>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/inspection/${inspection.id}/upload`)}
                  >
                    <Camera size={16} />
                  </Button>

                  {inspection.results && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/results/${inspection.id}`)}
                    >
                      <ArrowUpRight size={16} />
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('¿Eliminar esta inspección?')) {
                        dispatch({ type: 'DELETE', payload: inspection.id });
                      }
                    }}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
