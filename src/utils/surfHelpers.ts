import { Port } from '../types';

export interface SurfSuitability {
  isSurfable: boolean;
  reason?: 'inland' | 'port' | 'sheltered_bay';
  title: string;
  message: string;
}

export function checkSurfSuitability(port: Port): SurfSuitability {
  const nameLower = (port.name || '').toLowerCase();
  const regionLower = (port.region || '').toLowerCase();
  const countryLower = (port.country || '').toLowerCase();

  // 1. Inland water bodies (Rivers, Reservoirs, Lakes, Dams)
  const inlandKeywords = [
    'río ', 'rio ', 'embalse', 'pantano', 'lago', 'dam', 'reservoir', 'river', 'canal interior'
  ];
  const isLandLocked = inlandKeywords.some(kw => nameLower.includes(kw) || regionLower.includes(kw));

  if (isLandLocked) {
    return {
      isSurfable: false,
      reason: 'inland',
      title: 'Ubicación de aguas interiores (Sin olas de surf)',
      message: `Esta ubicación (${port.name}) se encuentra en un río, embalse o aguas interiores. No cuenta con oleaje marino ni rompientes para la práctica del surf.`
    };
  }

  // 2. Surf & Beach keywords (override port keyword if explicit beach/break name)
  const explicitSurfKeywords = [
    'playa', 'beach', 'surf', 'duna', 'cala', 'spot', 'break', 'point', 'reef', 
    'praia', 'plage', 'pantin', 'mundaka', 'zarautz', 'sopelana', 'rodiles', 
    'somo', 'liencres', 'suances', 'el palmar', 'bolonia', 'valdevaqueros', 
    'zahara', 'famara', 'cotillo', 'las canteras', 'medano', 'pipeline', 
    'j-bay', 'jbay', 'huntington', 'bells beach', 'teahupoo', 'nazaré', 
    'nazare', 'supertubos', 'coxos', 'peniche', 'ericeira', 'hossegor', 'biarritz'
  ];
  const isExplicitBeachOrSurf = explicitSurfKeywords.some(kw => nameLower.includes(kw));

  if (isExplicitBeachOrSurf) {
    return {
      isSurfable: true,
      title: 'Apto para Surf',
      message: 'Spot de playa o rompiente en mar abierto.'
    };
  }

  // 3. Commercial ports, inner docks, harbors, sheltered marina basins
  const portKeywords = [
    '(puerto)', ' puerto', 'puerto de', 'dársena', 'darsena', 'muelle', 
    'marina ', 'embarcadero', 'astillero', 'terminal', 'puerto comercial', 
    'puerto pesquero', 'dock', 'harbor', 'harbour', 'port of', 'puerto /'
  ];
  const isCommercialPortOrDock = portKeywords.some(kw => nameLower.includes(kw));

  if (isCommercialPortOrDock) {
    return {
      isSurfable: false,
      reason: 'port',
      title: 'Puerto marítimo / Dársena resguardada',
      message: `Esta ubicación corresponde a un puerto náutico o dársena resguardada (${port.name}). En instalaciones portuarias y muelles de la ría/puerto no se forman olas ni rompientes aptas para la práctica del surf.`
    };
  }

  // Default: Open coastal spots without explicit port keyword are considered surfable
  return {
    isSurfable: true,
    title: 'Zona Costera',
    message: 'Zona de costa abierta.'
  };
}
