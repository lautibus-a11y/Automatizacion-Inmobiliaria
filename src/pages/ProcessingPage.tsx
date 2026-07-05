import { useState, useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { Brain, CheckCircle, AlertCircle, ChevronRight, Loader2 } from 'lucide-react';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import { Button } from '../components/UI/Button';
import { useInspections } from '../contexts/InspectionContext';
import { analyzeImages, aggregateResults, generatePropertySummary } from '../services/ai';
import type { ImageAnalysis } from '../types';

export function ProcessingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useInspections();
  const inspection = state.inspections.find(i => i.id === id);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [currentAnalysis, setCurrentAnalysis] = useState<ImageAnalysis | null>(null);
  const [localStatus, setLocalStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!inspection || inspection.images.length === 0) return;
    let cancelled = false;

    dispatch({ type: 'SET_STATUS', payload: { inspectionId: inspection.id, status: 'processing' } });
    setLocalStatus('processing');
    setTotal(inspection.images.length);

    (async () => {
      try {
        const analyses = await analyzeImages(
          inspection.images,
          (current, total, partial) => {
            if (cancelled) return;
            setProgress(current);
            setTotal(total);
            setCurrentAnalysis(partial);
          }
        );

        if (cancelled) return;

        const results = aggregateResults(analyses);

        // Generate property summary
        setProgress(0);
        setTotal(1);
        setCurrentAnalysis(null);

        const summary = await generatePropertySummary(analyses, inspection.address);
        if (cancelled) return;
        results.generalState.propertySummary = summary;

        dispatch({ type: 'SET_RESULTS', payload: { inspectionId: inspection.id, results } });
        if (!cancelled) setLocalStatus('completed');
      } catch (err) {
        if (!cancelled) {
          setLocalStatus('error');
          setError(err instanceof Error ? err.message : 'Error durante el procesamiento');
        }
      }
    })();

    return () => { cancelled = true; };
  }, [id]);

  if (!inspection) return <Navigate to="/" replace />;
  if (inspection.images.length === 0) return <Navigate to={`/inspection/${id}/upload`} replace />;

  const conditionColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Procesamiento con IA</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{inspection.address}</p>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {localStatus === 'processing' && <Loader2 size={20} className="text-primary-600 animate-spin" />}
              {localStatus === 'completed' && <CheckCircle size={20} className="text-emerald-500" />}
              {localStatus === 'error' && <AlertCircle size={20} className="text-red-500" />}
              <span className="font-medium text-slate-900 dark:text-white">
                {localStatus === 'idle' && 'Preparando...'}
                {localStatus === 'processing' && (currentAnalysis ? `Analizando imágenes...` : 'Generando resumen...')}
                {localStatus === 'completed' && 'Análisis completado'}
                {localStatus === 'error' && 'Error en el análisis'}
              </span>
            </div>
            {localStatus === 'processing' && (
              <span className="text-sm text-slate-500">{progress}/{total}</span>
            )}
          </div>

          {localStatus === 'processing' && total > 0 && (
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-primary-600 h-full rounded-full transition-all duration-300"
                style={{ width: currentAnalysis ? `${(progress / total) * 100}%` : '100%' }}
              />
            </div>
          )}
        </div>
      </Card>

      {currentAnalysis && localStatus === 'processing' && (
        <Card>
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg shrink-0">
              <Brain size={20} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={currentAnalysis.environments[0]?.type}>
                  {currentAnalysis.environments[0]?.type || 'desconocido'}
                </Badge>
                <Badge variant={currentAnalysis.condition}>
                  {currentAnalysis.condition.replace('_', ' ')}
                </Badge>
                <span className={`text-sm font-bold ${conditionColor(currentAnalysis.conditionScore)}`}>
                  {currentAnalysis.conditionScore}/100
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {currentAnalysis.overallDescription}
              </p>
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                {currentAnalysis.electrical.slice(0, 3).map(el => (
                  <span key={el.name}>⚡ {el.name}: {el.count}</span>
                ))}
                {currentAnalysis.lighting.slice(0, 2).map(l => (
                  <span key={l.name}>💡 {l.name}: {l.count}</span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {localStatus === 'completed' && inspection.results && (
        <Card>
          <div className="text-center py-4">
            <CheckCircle size={48} className="text-emerald-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Análisis Completado</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Puntaje de conservación: {inspection.results.generalState.conservationScore}/100
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => navigate(`/results/${inspection.id}`)} size="lg">
                Ver Resultados
                <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {localStatus === 'error' && (
        <Card>
          <div className="text-center py-4">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Error</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-2">{error || 'Ocurrió un error durante el procesamiento'}</p>
            <Button variant="secondary" onClick={() => window.location.reload()}>Reintentar</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
