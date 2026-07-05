import { getAIConfig } from '../config/ai';
import type { ImageAnalysis, InspectionResults, InspectionImage, DetectedObject } from '../types';
import JSON5 from 'json5';

const ANALYSIS_PROMPT = `Eres un experto en inspecciones inmobiliarias. Analizá la imagen y devolvé ÚNICAMENTE un objeto JSON (sin markdown, sin texto adicional) con esta estructura exacta:
{
  "environment": "living|cocina|dormitorio|bano|lavadero|cochera|quincho|galeria|jardin|pileta|oficina|deposito",
  "description": "Descripción detallada de lo que se ve en la imagen incluyendo tipo de ambiente y todos los objetos visibles. Máximo 3 oraciones.",
  "condition": "excelente|muy_bueno|bueno|regular|malo",
  "conditionScore": 0-100,
  "objects": [
    {
      "name": "Nombre del objeto exacto (ej: Enchufe, Interruptor, Spot LED, Cocina, Heladera, Aire acondicionado, Ventana, Puerta, Piso, Inodoro, etc)",
      "count": 1,
      "category": "Instalación eléctrica|Iluminación|Equipamiento|Sanitarios|Construcción|Exterior",
      "brand": "Marca visible o null",
      "condition": "excelente|muy_bueno|bueno|regular|malo",
      "observations": ["observación relevante o array vacío"]
    }
  ],
  "problems": [
    {
      "type": "Humedad|Filtración|Grieta|Oxidación|Desgaste|Rotura",
      "severity": "bajo|medio|alto",
      "description": "descripción del problema"
    }
  ]
}

REGLAS IMPORTANTES:
- Solo incluí objetos que REALMENTE se vean en la imagen.
- NO inventes objetos ni marcas.
- Si no hay marcas visibles, poné null en brand.
- Si no hay problemas visibles, devolvé problems como array vacío.
- Sé preciso con los conteos.`;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function safeParse(raw: string): any {
  try { return JSON.parse(raw); } catch {}
  try { return JSON5.parse(raw); } catch {}
  throw new Error(`No se pudo interpretar la respuesta de la IA: ${raw.slice(0, 200)}`);
}

async function callAI(prompt: string, imageFile?: File, maxTokens = 1024): Promise<string> {
  const config = getAIConfig();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://inspectapp.local',
    'X-Title': 'InspectApp',
  };
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  let messages: any[];

  if (imageFile) {
    const dataUrl = await fileToDataUrl(imageFile);
    messages = [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: dataUrl } },
      ],
    }];
  } else {
    messages = [{ role: 'user', content: prompt }];
  }

  const body = {
    model: config.model,
    messages,
    temperature: 0.1,
    max_tokens: maxTokens,
  };

  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  let text = data.choices?.[0]?.message?.content || '';
  text = text.replace(/<pad>/gi, '').replace(/<\|pad\|>/gi, '').trim();
  return text;
}

async function analyzeImageWithAPI(image: InspectionImage): Promise<ImageAnalysis> {
  const content = await callAI(ANALYSIS_PROMPT, image.file);

  if (!content) {
    throw new Error('Respuesta vacía de la API');
  }

  let jsonStr = content.trim();
  const codeMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeMatch) {
    jsonStr = codeMatch[1].trim();
  } else {
    const objMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objMatch) jsonStr = objMatch[0];
  }

  const parsed = safeParse(jsonStr);

  const objects: DetectedObject[] = (parsed.objects || []).map((o: any) => ({
    name: o.name,
    count: o.count || 1,
    brand: o.brand || null,
    condition: o.condition || 'bueno',
    observations: o.observations || [],
    category: o.category || '',
  }));

  const env = parsed.environment || 'living';
  const cond = parsed.condition || 'bueno';
  const condScore = parsed.conditionScore ?? 50;

  const description = parsed.description || `Fotografía correspondiente a ${env}.`;
  const problems = (parsed.problems || []).map((p: any) => ({
    type: p.type || 'Otros',
    severity: (p.severity || 'bajo') as 'bajo' | 'medio' | 'alto',
    description: p.description || '',
  }));

  return {
    objects,
    environments: [{ type: env, confidence: 0.95 }],
    elements: objects.filter(o => o.category === 'Construcción').map(o => ({
      name: o.name, count: o.count, condition: o.condition,
    })),
    electrical: objects.filter(o => o.category === 'Instalación eléctrica').map(o => ({
      name: o.name, count: o.count,
    })),
    lighting: objects.filter(o => o.category === 'Iluminación').map(o => ({
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
    conditionScore: condScore,
    problems,
    overallDescription: description,
    description,
  };
}

export async function analyzeImages(
  images: InspectionImage[],
  onProgress: (current: number, total: number, partial: ImageAnalysis) => void
): Promise<ImageAnalysis[]> {
  const config = getAIConfig();
  const results: ImageAnalysis[] = [];
  const useRealAPI = !config.useSimulated;

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    try {
      let analysis: ImageAnalysis;

      if (useRealAPI) {
        console.log(`InspectAI: Calling OpenRouter for image ${i + 1}/${images.length}`);
        analysis = await analyzeImageWithAPI(image);
      } else {
        console.warn(`InspectAI: No API key configured, using simulated data for image ${i + 1}`);
        const { simulateImageAnalysis } = await import('./ai-simulated');
        analysis = simulateImageAnalysis(i);
      }

      results.push(analysis);
      onProgress(i + 1, images.length, analysis);

      if (useRealAPI && i < images.length - 1) {
        await new Promise(r => setTimeout(r, 300));
      }
    } catch (err) {
      console.error(`Error analyzing image ${i + 1}:`, err);
      const fallback: ImageAnalysis = {
        objects: [],
        environments: [{ type: 'living', confidence: 0.5 }],
        elements: [], electrical: [], lighting: [], plumbing: [], equipment: [],
        brands: [],
        condition: 'bueno',
        conditionScore: 50,
        problems: [{ type: 'Error', severity: 'bajo', description: `No se pudo analizar esta imagen: ${err instanceof Error ? err.message : 'Error desconocido'}` }],
        overallDescription: 'No se pudo analizar esta imagen automáticamente.',
        description: 'No se pudo analizar esta imagen automáticamente.',
      };
      results.push(fallback);
      onProgress(i + 1, images.length, fallback);
    }
  }

  return results;
}

function aggregateResults(analyses: ImageAnalysis[]): InspectionResults {
  const inventoryMap = new Map<string, { count: number; brands: Set<string>; category: string }>();
  const envMap = new Map<string, { items: Map<string, { count: number; brands: Set<string> }>; conditions: number[]; observations: string[] }>();

  for (const analysis of analyses) {
    const env = analysis.environments[0]?.type || 'living';
    if (!envMap.has(env)) {
      envMap.set(env, { items: new Map(), conditions: [], observations: [] });
    }
    const envData = envMap.get(env)!;
    envData.conditions.push(analysis.conditionScore);

    for (const obj of analysis.objects) {
      const key = obj.name;
      const existing = inventoryMap.get(key) || { count: 0, brands: new Set(), category: obj.category };
      existing.count += obj.count;
      inventoryMap.set(key, existing);
      if (obj.brand) existing.brands.add(obj.brand);

      if (!envData.items.has(key)) {
        envData.items.set(key, { count: 0, brands: new Set() });
      }
      envData.items.get(key)!.count += obj.count;
      if (obj.brand) envData.items.get(key)!.brands.add(obj.brand);
    }

    if (analysis.problems.length > 0) {
      envData.observations.push(...analysis.problems.map(p => p.description));
    }
  }

  const inventory: InspectionResults['inventory'] = Array.from(inventoryMap.entries())
    .map(([name, data]) => ({
      category: data.category,
      name,
      count: data.count,
      brand: data.brands.size > 0 ? Array.from(data.brands).join(', ') : undefined,
    }))
    .sort((a, b) => b.count - a.count);

  const environmentSummaries: InspectionResults['environmentSummaries'] = Array.from(envMap.entries()).map(([env, data]) => {
    const avgScore = data.conditions.reduce((a, b) => a + b, 0) / data.conditions.length;
    const condition: InspectionResults['environmentSummaries'][0]['overallCondition'] =
      avgScore >= 80 ? 'muy_bueno' : avgScore >= 60 ? 'bueno' : avgScore >= 40 ? 'regular' : 'malo';

    return {
      environment: env as any,
      items: Array.from(data.items.entries()).map(([name, itemData]) => ({
        category: '',
        name,
        count: itemData.count,
        brand: itemData.brands.size > 0 ? Array.from(itemData.brands).join(', ') : undefined,
      })),
      overallCondition: condition,
      score: Math.round(avgScore),
      observations: [...new Set(data.observations)],
    };
  });

  const allScores = analyses.map(a => a.conditionScore);
  const avgScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;
  const totalProblems = analyses.reduce((sum, a) => sum + a.problems.length, 0);

  const generalState = {
    conservationScore: Math.round(avgScore),
    maintenanceLevel: (avgScore >= 70 ? 'bajo' : avgScore >= 45 ? 'medio' : 'alto') as 'bajo' | 'medio' | 'alto',
    observations: [
      avgScore >= 80 ? 'Propiedad en buen estado de conservación general.' : avgScore >= 50 ? 'Propiedad que requiere mantenimiento moderado.' : 'Propiedad que requiere reparaciones significativas.',
      totalProblems > 0 ? `Se detectaron ${totalProblems} problemas visibles en distintas áreas.` : 'No se detectaron problemas significativos.',
      analyses.length > 0 ? `Analizadas ${analyses.length} imágenes de la propiedad.` : '',
    ].filter(Boolean),
    conclusion: `La propiedad presenta un puntaje de conservación de ${Math.round(avgScore)}/100, lo que indica un nivel de mantenimiento ${avgScore >= 70 ? 'bajo' : avgScore >= 45 ? 'medio' : 'alto'}. ${avgScore >= 70 ? 'Se recomienda mantenimiento periódico para preservar las condiciones actuales.' : avgScore >= 45 ? 'Se recomienda realizar las reparaciones necesarias para evitar deterioro mayor.' : 'Se recomienda una renovación integral para poner la propiedad en condiciones óptimas.'}`,
    propertySummary: '',
  };

  return { inventory, environmentSummaries, generalState, imageAnalyses: analyses };
}

const SUMMARY_PROMPT = `Generá un resumen descriptivo de una propiedad inmobiliaria en base al análisis de sus imágenes. Describí el estado general, los ambientes detectados, los objetos y equipamiento presente, y cualquier problema observado. Máximo 4 párrafos. Respondé SOLO con el texto del resumen, sin formato adicional.`;

export async function generatePropertySummary(
  analyses: ImageAnalysis[],
  address: string
): Promise<string> {
  const config = getAIConfig();
  const useRealAPI = !config.useSimulated;

  const context = analyses.map((a, i) => {
    const env = a.environments[0]?.type || 'desconocido';
    const objs = a.objects.map(o => `${o.name} (${o.count})${o.brand ? ` - ${o.brand}` : ''} - ${o.condition}`).join('; ');
    const probs = a.problems.map(p => p.description).join('; ');
    return `Imagen ${i + 1} (${env}): ${a.description} | Objetos: ${objs || 'ninguno'} | Problemas: ${probs || 'ninguno'}`;
  }).join('\n');

  if (!useRealAPI) {
    const descs = analyses.map(a => a.description).join(' ');
    const envs = [...new Set(analyses.map(a => a.environments[0]?.type).filter(Boolean))].join(', ');
    return `La propiedad ubicada en ${address} está compuesta por los siguientes ambientes: ${envs}. ${descs} En general, la propiedad presenta un estado de conservación que requiere atención en ciertos aspectos.`;
  }

  const prompt = `${SUMMARY_PROMPT}\n\nDatos de la propiedad:\nDirección: ${address}\n\nAnálisis por imagen:\n${context}`;

  try {
    const text = await callAI(prompt, undefined, 2048);
    return text || 'No se pudo generar el resumen.';
  } catch (err) {
    console.error('Error generating summary:', err);
    const descs = analyses.map(a => a.description).join(' ');
    return `La propiedad en ${address} fue analizada en ${analyses.length} imágenes. ${descs}`;
  }
}

export { aggregateResults };
