import { useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Upload, GripVertical, ImagePlus, ChevronLeft,
  AlertCircle, ArrowRight, Trash2
} from 'lucide-react';
import { Button } from '../components/UI/Button';
import { useInspections } from '../contexts/InspectionContext';
import type { InspectionImage } from '../types';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_FILES = 100;

export function ImageUpload() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useInspections();
  const inspection = state.inspections.find(i => i.id === id);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    if (!inspection) return;
    const remaining = MAX_FILES - inspection.images.length;
    if (remaining <= 0) {
      setError(`Máximo ${MAX_FILES} imágenes permitidas`);
      return;
    }
    const validFiles = Array.from(files)
      .filter(f => ACCEPTED_TYPES.includes(f.type) || f.name.match(/\.(heic|heif)$/i))
      .slice(0, remaining);

    if (validFiles.length === 0) {
      setError('Formatos aceptados: JPG, PNG, WEBP, HEIC');
      return;
    }

    setError(null);
    const newImages: InspectionImage[] = await Promise.all(
      validFiles.map(async (file, idx) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        order: inspection.images.length + idx,
        analysis: null,
      }))
    );
    dispatch({ type: 'ADD_IMAGES', payload: { inspectionId: inspection.id, images: newImages } });
  }, [inspection, dispatch]);

  const removeImage = (imageId: string) => {
    if (!inspection) return;
    const img = inspection.images.find(i => i.id === imageId);
    if (img) URL.revokeObjectURL(img.preview);
    dispatch({ type: 'REMOVE_IMAGE', payload: { inspectionId: inspection.id, imageId } });
  };

  const moveImage = (from: number, to: number) => {
    if (!inspection) return;
    const imgs = [...inspection.images];
    const [moved] = imgs.splice(from, 1);
    imgs.splice(to, 0, moved);
    const reordered = imgs.map((img, idx) => ({ ...img, order: idx }));
    dispatch({ type: 'REORDER_IMAGES', payload: { inspectionId: inspection.id, images: reordered } });
  };

  if (!inspection) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle size={48} className="text-slate-400 mb-4" />
        <p className="text-lg text-slate-600 dark:text-slate-400">Inspección no encontrada</p>
        <Button className="mt-4" onClick={() => navigate('/')}>Volver al inicio</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cargar Imágenes</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {inspection.address} — {inspection.images.length}/{MAX_FILES} imágenes
          </p>
        </div>
        <div className="flex gap-3">
          {inspection.images.length > 0 && (
            <>
              <Button variant="ghost" onClick={() => navigate(`/inspection/${inspection.id}`)}>
                <ChevronLeft size={18} />
                Volver
              </Button>
              <Button onClick={() => navigate(`/processing/${inspection.id}`)}>
                Procesar con IA
                <ArrowRight size={18} />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={e => { e.preventDefault(); setIsDragOver(false); addFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
          isDragOver
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-slate-300 dark:border-slate-600 hover:border-primary-400 dark:hover:border-primary-500 bg-white dark:bg-slate-800/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="hidden"
          onChange={e => e.target.files && addFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 bg-primary-100 dark:bg-primary-900/30 rounded-2xl">
            <Upload size={32} className="text-primary-600 dark:text-primary-400" />
          </div>
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
            Arrastrá tus imágenes aquí
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            o hacé clic para seleccionar archivos
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            JPG, PNG, WEBP, HEIC — Hasta {MAX_FILES} imágenes
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Preview grid */}
      {inspection.images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {inspection.images.map((img, idx) => (
            <div
              key={img.id}
              draggable
              onDragStart={() => { dragItem.current = idx; }}
              onDragEnter={() => { dragOverItem.current = idx; }}
              onDragEnd={() => {
                if (dragItem.current != null && dragOverItem.current != null && dragItem.current !== dragOverItem.current) {
                  moveImage(dragItem.current, dragOverItem.current);
                }
                dragItem.current = null;
                dragOverItem.current = null;
              }}
              onDragOver={e => e.preventDefault()}
              className="group relative bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs hover:shadow-md transition-all animate-scale-in"
            >
              <div className="absolute top-2 left-2 z-10 flex gap-1">
                <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                  {idx + 1}
                </span>
              </div>

              <button
                onClick={() => removeImage(img.id)}
                className="absolute top-2 right-2 z-10 p-1.5 bg-black/60 hover:bg-red-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
              >
                <Trash2 size={14} className="text-white" />
              </button>

              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 transition-opacity">
                <GripVertical size={20} className="text-white" />
              </div>

              <img
                src={img.preview}
                alt={`Foto ${idx + 1}`}
                className="w-full aspect-4/3 object-cover"
              />
            </div>
          ))}

          {/* Add more button */}
          {inspection.images.length < MAX_FILES && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-primary-400 dark:hover:border-primary-500 bg-white dark:bg-slate-800/50 transition-colors aspect-4/3 cursor-pointer"
            >
              <ImagePlus size={24} className="text-slate-400" />
              <span className="text-xs text-slate-400">Agregar más</span>
            </button>
          )}
        </div>
      )}

      {/* Bottom actions */}
      {inspection.images.length > 0 && (
        <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            <strong>{inspection.images.length}</strong> imágenes cargadas
            {inspection.images.length >= 5 && ' — listo para procesar'}
          </p>
          <Button onClick={() => navigate(`/processing/${inspection.id}`)} size="lg">
            Procesar con IA
            <ArrowRight size={18} />
          </Button>
        </div>
      )}
    </div>
  );
}
