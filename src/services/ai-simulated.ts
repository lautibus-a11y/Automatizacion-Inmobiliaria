import type { ImageAnalysis, DetectedObject } from '../types';

const ENVIRONMENTS = ['living', 'cocina', 'dormitorio', 'bano', 'lavadero', 'cochera', 'quincho', 'galeria', 'jardin', 'pileta', 'oficina', 'deposito'] as const;

const OBJECT_TEMPLATES = [
  { name: 'Enchufe', category: 'Instalación eléctrica', countRange: [2, 8] as const },
  { name: 'Interruptor', category: 'Instalación eléctrica', countRange: [1, 5] as const },
  { name: 'Tablero eléctrico', category: 'Instalación eléctrica', countRange: [0, 1] as const },
  { name: 'Disyuntor', category: 'Instalación eléctrica', countRange: [0, 1] as const },
  { name: 'Llave térmica', category: 'Instalación eléctrica', countRange: [0, 3] as const },
  { name: 'Spot LED', category: 'Iluminación', countRange: [0, 8] as const },
  { name: 'Lamparita', category: 'Iluminación', countRange: [0, 4] as const },
  { name: 'Plafón', category: 'Iluminación', countRange: [0, 2] as const },
  { name: 'Reflector', category: 'Iluminación', countRange: [0, 2] as const },
  { name: 'Araña', category: 'Iluminación', countRange: [0, 1] as const },
  { name: 'Aplique', category: 'Iluminación', countRange: [0, 3] as const },
  { name: 'Aire acondicionado', category: 'Equipamiento', countRange: [0, 2] as const },
  { name: 'Cocina', category: 'Equipamiento', countRange: [0, 1] as const },
  { name: 'Horno', category: 'Equipamiento', countRange: [0, 1] as const },
  { name: 'Anafe', category: 'Equipamiento', countRange: [0, 1] as const },
  { name: 'Heladera', category: 'Equipamiento', countRange: [0, 1] as const },
  { name: 'Microondas', category: 'Equipamiento', countRange: [0, 1] as const },
  { name: 'Lavavajillas', category: 'Equipamiento', countRange: [0, 1] as const },
  { name: 'Termotanque', category: 'Equipamiento', countRange: [0, 1] as const },
  { name: 'Caldera', category: 'Equipamiento', countRange: [0, 1] as const },
  { name: 'Inodoro', category: 'Sanitarios', countRange: [0, 2] as const },
  { name: 'Bidet', category: 'Sanitarios', countRange: [0, 1] as const },
  { name: 'Ducha', category: 'Sanitarios', countRange: [0, 1] as const },
  { name: 'Grifería', category: 'Sanitarios', countRange: [0, 3] as const },
  { name: 'Lavatorio', category: 'Sanitarios', countRange: [0, 2] as const },
  { name: 'Piso', category: 'Construcción', countRange: [1, 1] as const },
  { name: 'Pared', category: 'Construcción', countRange: [1, 1] as const },
  { name: 'Techo', category: 'Construcción', countRange: [1, 1] as const },
  { name: 'Ventana', category: 'Construcción', countRange: [1, 4] as const },
  { name: 'Puerta', category: 'Construcción', countRange: [1, 3] as const },
  { name: 'Reja', category: 'Construcción', countRange: [0, 2] as const },
  { name: 'Persiana', category: 'Construcción', countRange: [0, 3] as const },
  { name: 'Pileta', category: 'Exterior', countRange: [0, 1] as const },
  { name: 'Parrilla', category: 'Exterior', countRange: [0, 1] as const },
  { name: 'Quincho', category: 'Exterior', countRange: [0, 1] as const },
  { name: 'Portón', category: 'Exterior', countRange: [0, 1] as const },
  { name: 'Cerco', category: 'Exterior', countRange: [0, 1] as const },
  { name: 'Iluminación exterior', category: 'Exterior', countRange: [0, 3] as const },
];

const CONDITIONS = ['excelente', 'muy_bueno', 'bueno', 'regular', 'malo'] as const;

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomCondition() {
  return pick(CONDITIONS);
}

function pickBrand(): string | null {
  const brands = ['Samsung', 'Whirlpool', 'Longvie', 'Ferrum', 'FV', 'Rheem', 'Philips', 'Osram', 'Cambre', 'LG', 'Noblex', 'Electrolux', 'Bosch', 'Midea'];
  return Math.random() > 0.6 ? pick(brands) : null;
}

function generateDescription(envName: string, objects: DetectedObject[]): string {
  const notable = objects.filter(o => o.count > 0).slice(0, 6);
  if (notable.length === 0) return `Fotografia correspondiente a ${envName}. No se detectaron objetos significativos.`;
  const conditionLabels: Record<string, string> = {
    excelente: 'excelente estado', muy_bueno: 'muy buen estado',
    bueno: 'buen estado', regular: 'estado regular', malo: 'mal estado',
  };
  const parts: string[] = [];
  for (const obj of notable) {
    const brand = obj.brand ? ` marca ${obj.brand}` : '';
    const count = obj.count > 1 ? `${obj.count} ` : '';
    const plural = obj.count > 1 ? 's' : '';
    const label = conditionLabels[obj.condition] || obj.condition;
    parts.push(`${count}${obj.name}${plural}${brand} en ${label}`);
  }
  const last = parts.pop();
  const text = parts.length > 0 ? parts.join(', ') + ' y ' + last : last;
  return `Fotografia correspondiente a ${envName} de la propiedad. Se detecta ${text}.`;
}

export function simulateImageAnalysis(_index: number): ImageAnalysis {
  const env = pick(ENVIRONMENTS);
  const envLabels: Record<string, string> = {
    living: 'el living', cocina: 'la cocina', dormitorio: 'el dormitorio',
    bano: 'el bano', lavadero: 'el lavadero', cochera: 'la cochera',
    quincho: 'el quincho', galeria: 'la galeria', jardin: 'el jardin',
    pileta: 'la pileta', oficina: 'la oficina', deposito: 'el deposito',
  };
  const envName = envLabels[env] || env;

  const objects: DetectedObject[] = OBJECT_TEMPLATES
    .map(t => ({
      name: t.name,
      count: randomInt(t.countRange[0], t.countRange[1]),
      brand: t.category === 'Equipamiento' ? pickBrand() : null,
      condition: randomCondition(),
      observations: [],
      category: t.category,
    }))
    .filter(o => o.count > 0);

  const description = generateDescription(envName, objects);
  const cond = randomCondition();
  const scoreMap: Record<string, number> = { excelente: 95, muy_bueno: 82, bueno: 68, regular: 45, malo: 25 };
  const allProblems = [
    { type: 'Humedad', severity: 'bajo' as const, description: 'Posible filtracion en esquina superior' },
    { type: 'Pintura descascarada', severity: 'medio' as const, description: 'Desgaste en pared sur' },
    { type: 'Grietas', severity: 'bajo' as const, description: 'Microgrietas en revestimiento' },
    { type: 'Oxidacion', severity: 'medio' as const, description: 'Oxidacion en marco de ventana' },
    { type: 'Desgaste excesivo', severity: 'alto' as const, description: 'Pisos con desgaste notable' },
  ];
  const selectedProblems = Math.random() > 0.5 ? allProblems.slice(0, randomInt(0, 2)) : [];

  return {
    objects,
    environments: [{ type: env, confidence: 0.85 + Math.random() * 0.14 }],
    elements: objects.filter(o => o.category === 'Construccion').map(o => ({
      name: o.name, count: o.count, condition: o.condition,
    })),
    electrical: objects.filter(o => o.category === 'Instalacion electrica').map(o => ({
      name: o.name, count: o.count,
    })),
    lighting: objects.filter(o => o.category === 'Iluminacion').map(o => ({
      name: o.name, count: o.count,
    })),
    plumbing: objects.filter(o => o.category === 'Sanitarios').map(o => ({
      name: o.name, count: o.count, condition: o.condition,
    })),
    equipment: objects.filter(o => o.category === 'Equipamiento').map(o => ({
      name: o.name, count: o.count, brand: o.brand, condition: o.condition,
    })),
    brands: objects.filter(o => o.brand).map(o => ({ name: o.brand!, items: [o.name] })),
    condition: cond,
    conditionScore: scoreMap[cond],
    problems: selectedProblems,
    overallDescription: description,
    description,
  };
}
