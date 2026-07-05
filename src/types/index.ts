export type PropertyType = 'casa' | 'departamento' | 'ph' | 'local' | 'oficina' | 'galpon' | 'terreno';

export type InspectionStatus = 'draft' | 'photos_uploaded' | 'processing' | 'completed' | 'error';

export type EnvironmentType =
  | 'living' | 'cocina' | 'dormitorio' | 'bano' | 'lavadero'
  | 'cochera' | 'quincho' | 'galeria' | 'jardin' | 'pileta'
  | 'oficina' | 'deposito' | 'pasillo' | 'comedor' | 'terraza';

export type Condition = 'excelente' | 'muy_bueno' | 'bueno' | 'regular' | 'malo';

export interface InspectionBasicData {
  address: string;
  propertyType: PropertyType;
  client: string;
  observations: string;
}

export interface Inspection extends InspectionBasicData {
  id: string;
  status: InspectionStatus;
  createdAt: string;
  updatedAt: string;
  images: InspectionImage[];
  results: InspectionResults | null;
}

export interface InspectionImage {
  id: string;
  file: File;
  preview: string;
  order: number;
  analysis: ImageAnalysis | null;
}

export interface DetectedObject {
  name: string;
  count: number;
  brand: string | null;
  condition: Condition;
  observations: string[];
  category: string;
}

export interface ImageAnalysis {
  objects: DetectedObject[];
  environments: DetectedEnvironment[];
  elements: DetectedElement[];
  electrical: DetectedElectrical[];
  lighting: DetectedLighting[];
  plumbing: DetectedPlumbing[];
  equipment: DetectedEquipment[];
  brands: DetectedBrand[];
  condition: Condition;
  conditionScore: number;
  problems: DetectedProblem[];
  overallDescription: string;
  description: string;
}

export interface DetectedEnvironment {
  type: EnvironmentType;
  confidence: number;
}

export interface DetectedElement {
  name: string;
  count: number;
  condition: Condition;
}

export interface DetectedElectrical {
  name: string;
  count: number;
}

export interface DetectedLighting {
  name: string;
  count: number;
}

export interface DetectedPlumbing {
  name: string;
  count: number;
  condition: Condition;
}

export interface DetectedEquipment {
  name: string;
  count: number;
  brand: string | null;
  condition: Condition;
}

export interface DetectedBrand {
  name: string;
  items: string[];
}

export interface DetectedProblem {
  type: string;
  severity: 'bajo' | 'medio' | 'alto';
  description: string;
}

export interface InspectionResults {
  inventory: InventoryItem[];
  environmentSummaries: EnvironmentSummary[];
  generalState: GeneralState;
  imageAnalyses: ImageAnalysis[];
}

export interface InventoryItem {
  category: string;
  name: string;
  count: number;
  brand?: string;
}

export interface EnvironmentSummary {
  environment: EnvironmentType;
  items: InventoryItem[];
  overallCondition: Condition;
  score: number;
  observations: string[];
}

export interface GeneralState {
  conservationScore: number;
  maintenanceLevel: 'bajo' | 'medio' | 'alto';
  observations: string[];
  conclusion: string;
  propertySummary: string;
}

export type ExportFormat = 'pdf' | 'docx';
