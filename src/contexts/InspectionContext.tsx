import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { Inspection, InspectionImage, InspectionResults } from '../types';

interface State {
  inspections: Inspection[];
  currentInspection: Inspection | null;
}

type Action =
  | { type: 'CREATE'; payload: Inspection }
  | { type: 'SET_CURRENT'; payload: string }
  | { type: 'ADD_IMAGES'; payload: { inspectionId: string; images: InspectionImage[] } }
  | { type: 'REMOVE_IMAGE'; payload: { inspectionId: string; imageId: string } }
  | { type: 'REORDER_IMAGES'; payload: { inspectionId: string; images: InspectionImage[] } }
  | { type: 'SET_STATUS'; payload: { inspectionId: string; status: Inspection['status'] } }
  | { type: 'SET_RESULTS'; payload: { inspectionId: string; results: InspectionResults } }
  | { type: 'DELETE'; payload: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'CREATE':
      return { ...state, inspections: [...state.inspections, action.payload], currentInspection: action.payload };
    case 'SET_CURRENT': {
      const found = state.inspections.find(i => i.id === action.payload) || null;
      return { ...state, currentInspection: found };
    }
    case 'ADD_IMAGES':
      return {
        ...state,
        inspections: state.inspections.map(i =>
          i.id === action.payload.inspectionId
            ? { ...i, images: [...i.images, ...action.payload.images], status: 'photos_uploaded' as const, updatedAt: new Date().toISOString() }
            : i
        ),
        currentInspection: state.currentInspection?.id === action.payload.inspectionId
          ? { ...state.currentInspection, images: [...state.currentInspection.images, ...action.payload.images], status: 'photos_uploaded', updatedAt: new Date().toISOString() }
          : state.currentInspection,
      };
    case 'REMOVE_IMAGE':
      return {
        ...state,
        inspections: state.inspections.map(i =>
          i.id === action.payload.inspectionId
            ? { ...i, images: i.images.filter(img => img.id !== action.payload.imageId), updatedAt: new Date().toISOString() }
            : i
        ),
        currentInspection: state.currentInspection?.id === action.payload.inspectionId
          ? { ...state.currentInspection, images: state.currentInspection.images.filter(img => img.id !== action.payload.imageId), updatedAt: new Date().toISOString() }
          : state.currentInspection,
      };
    case 'REORDER_IMAGES':
      return {
        ...state,
        inspections: state.inspections.map(i =>
          i.id === action.payload.inspectionId
            ? { ...i, images: action.payload.images, updatedAt: new Date().toISOString() }
            : i
        ),
        currentInspection: state.currentInspection?.id === action.payload.inspectionId
          ? { ...state.currentInspection, images: action.payload.images, updatedAt: new Date().toISOString() }
          : state.currentInspection,
      };
    case 'SET_STATUS':
      return {
        ...state,
        inspections: state.inspections.map(i =>
          i.id === action.payload.inspectionId
            ? { ...i, status: action.payload.status, updatedAt: new Date().toISOString() }
            : i
        ),
        currentInspection: state.currentInspection?.id === action.payload.inspectionId
          ? { ...state.currentInspection, status: action.payload.status, updatedAt: new Date().toISOString() }
          : state.currentInspection,
      };
    case 'SET_RESULTS':
      return {
        ...state,
        inspections: state.inspections.map(i =>
          i.id === action.payload.inspectionId
            ? { ...i, results: action.payload.results, status: 'completed' as const, updatedAt: new Date().toISOString() }
            : i
        ),
        currentInspection: state.currentInspection?.id === action.payload.inspectionId
          ? { ...state.currentInspection, results: action.payload.results, status: 'completed', updatedAt: new Date().toISOString() }
          : state.currentInspection,
      };
    case 'DELETE':
      return {
        ...state,
        inspections: state.inspections.filter(i => i.id !== action.payload),
        currentInspection: state.currentInspection?.id === action.payload ? null : state.currentInspection,
      };
    default:
      return state;
  }
}

interface ContextType {
  state: State;
  dispatch: React.Dispatch<Action>;
}

const InspectionContext = createContext<ContextType>({
  state: { inspections: [], currentInspection: null },
  dispatch: () => {},
});

export function InspectionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { inspections: [], currentInspection: null });
  return (
    <InspectionContext.Provider value={{ state, dispatch }}>
      {children}
    </InspectionContext.Provider>
  );
}

export const useInspections = () => useContext(InspectionContext);
