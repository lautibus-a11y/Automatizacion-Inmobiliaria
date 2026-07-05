import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Download, FileText, AlertCircle, Camera, X
} from 'lucide-react';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import { Button } from '../components/UI/Button';
import { Modal } from '../components/UI/Modal';
import { useInspections } from '../contexts/InspectionContext';
import { exportPDF, exportDOCX } from '../services/export';
import type { ExportFormat } from '../types';

export function Results() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useInspections();
  const inspection = state.inspections.find(i => i.id === id);
  const [exportModal, setExportModal] = useState(false);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  if (!inspection || !inspection.results) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle size={48} className="text-slate-400 mb-4" />
        <p className="text-lg text-slate-600 dark:text-slate-400">Resultados no disponibles</p>
        <Button className="mt-4" onClick={() => navigate('/')}>Volver al inicio</Button>
      </div>
    );
  }

  const r = inspection.results;

  const handleExport = async (format: ExportFormat) => {
    setExporting(format);
    setExportError(null);
    try {
      if (format === 'pdf') await exportPDF(inspection);
      if (format === 'docx') await exportDOCX(inspection);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido al exportar';
      console.error('Export error:', msg);
      setExportError(msg);
      return;
    }
    setExporting(null);
    setExportModal(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
            <button onClick={() => navigate('/')} className="hover:text-primary-600 cursor-pointer">Inicio</button>
            <span>/</span>
            <span>Resultados</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{inspection.address}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {inspection.client && `${inspection.client} — `}
            {inspection.propertyType} — {inspection.images.length} fotos analizadas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate(`/inspection/${inspection.id}/upload`)}>
            <Camera size={16} />
            Fotos
          </Button>
          <Button onClick={() => setExportModal(true)}>
            <Download size={16} />
            Exportar
          </Button>
        </div>
      </div>

      {/* General Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Puntaje de Conservación</p>
            <p className={`text-4xl font-bold ${
              r.generalState.conservationScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
              r.generalState.conservationScore >= 60 ? 'text-blue-600 dark:text-blue-400' :
              r.generalState.conservationScore >= 40 ? 'text-amber-600 dark:text-amber-400' :
              'text-red-600 dark:text-red-400'
            }`}>
              {r.generalState.conservationScore}
              <span className="text-lg text-slate-400">/100</span>
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Mantenimiento Requerido</p>
            <Badge variant={r.generalState.maintenanceLevel} className="text-base px-4 py-1">
              {r.generalState.maintenanceLevel === 'bajo' ? 'Bajo' : r.generalState.maintenanceLevel === 'medio' ? 'Medio' : 'Alto'}
            </Badge>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Ambientes Detectados</p>
            <p className="text-4xl font-bold text-slate-900 dark:text-white">{r.environmentSummaries.length}</p>
          </div>
        </Card>
      </div>

      {/* Property Summary */}
      {r.generalState.propertySummary && (
        <Card>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Resumen de la Propiedad</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">{r.generalState.propertySummary}</p>
        </Card>
      )}

      {/* Conclusion */}
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Conclusión General</h2>
        <p className="text-slate-600 dark:text-slate-400">{r.generalState.conclusion}</p>
      </Card>

      {/* Inventory */}
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Inventario Técnico</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-2 font-medium text-slate-500 dark:text-slate-400">Elemento</th>
                <th className="text-center py-3 px-2 font-medium text-slate-500 dark:text-slate-400">Cant.</th>
                <th className="text-left py-3 px-2 font-medium text-slate-500 dark:text-slate-400">Categoría</th>
                <th className="text-left py-3 px-2 font-medium text-slate-500 dark:text-slate-400">Marca</th>
              </tr>
            </thead>
            <tbody>
              {r.inventory.map((item, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="py-3 px-2 text-slate-900 dark:text-white font-medium">{item.name}</td>
                  <td className="py-3 px-2 text-center text-slate-900 dark:text-white">{item.count}</td>
                  <td className="py-3 px-2 text-slate-500 dark:text-slate-400">{item.category}</td>
                  <td className="py-3 px-2 text-slate-500 dark:text-slate-400">{item.brand || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Per-Image Gallery */}
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Análisis por Fotografía</h2>
      <div className="space-y-6">
        {inspection.images.map((img, idx) => {
          const analysis = r.imageAnalyses[idx];
          if (!analysis) return null;
          return (
            <Card key={img.id} className="overflow-hidden">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Image */}
                <div className="lg:w-80 shrink-0">
                  <div className="relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700">
                    <img
                      src={img.preview}
                      alt={`Foto ${idx + 1}`}
                      className="w-full aspect-4/3 object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Imagen {idx + 1}
                    </div>
                    {analysis.environments[0] && (
                      <div className="absolute top-3 right-3">
                        <Badge variant={analysis.environments[0].type}>
                          {analysis.environments[0].type}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-4">
                  {/* Description */}
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                      Descripción
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {analysis.description}
                    </p>
                  </div>

                  {/* Detected Objects */}
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                      Objetos detectados
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                      {analysis.objects.map((obj, oi) => (
                        <div
                          key={oi}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-sm"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium text-slate-900 dark:text-white truncate">
                              {obj.name}
                            </span>
                            <span className="text-slate-400 shrink-0">×{obj.count}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {obj.brand && (
                              <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                                {obj.brand}
                              </span>
                            )}
                            <Badge variant={obj.condition}>
                              {obj.condition.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Problems */}
                  {analysis.problems.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                        Problemas detectados
                      </h3>
                      <div className="space-y-1">
                        {analysis.problems.map((p, pi) => (
                          <p key={pi} className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1">
                            <span>⚠</span> {p.description}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Export Modal */}
      <Modal open={exportModal} onClose={() => setExportModal(false)} title="Exportar Informe">
        {exportError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
            <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400 flex-1">{exportError}</p>
            <button onClick={() => setExportError(null)} className="text-red-400 hover:text-red-600 cursor-pointer"><X size={14} /></button>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {[
            { format: 'pdf' as ExportFormat, icon: FileText, label: 'PDF Profesional', desc: 'Documento listo para imprimir con todas las imágenes' },
            { format: 'docx' as ExportFormat, icon: FileText, label: 'Word (.docx)', desc: 'Documento editable organizado por imagen' },
          ].map(({ format, icon: Icon, label, desc }) => (
            <button
              key={format}
              onClick={() => handleExport(format)}
              disabled={exporting === format}
              className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Icon size={28} className="text-primary-600 dark:text-primary-400" />
              <span className="font-medium text-slate-900 dark:text-white text-sm">{label}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{desc}</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
