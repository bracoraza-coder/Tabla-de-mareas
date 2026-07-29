import { Port, TideDayData, UserUnits } from '../types';
import { formatHeight, formatWindSpeed, formatTemp } from './tideEngine';
import { formatZonedHHMM } from './timezoneHelpers';

export interface StationAnalysis {
  stationInfo: {
    id: string;
    name: string;
    region: string;
    coordinates: string;
    sensorNetwork: string;
    tideModel: string;
    lastUpdate: string;
  };
  summary: string;
  fishingDiagnosis: {
    score: number;
    activityLevel: string;
    recommendedSpecies: string[];
    bestTimeWindows: string[];
    recommendedBaits: string[];
    tideStrategy: string;
    pressureImpact: string;
  };
  navigationBulletin: {
    safetyStatus: 'Excelente' | 'Precaución' | 'Adversa / Peligro';
    seaStateDetails: string;
    windSummary: string;
    waveType: string;
    coastalAdvice: string;
  };
  dataSources: {
    tides: string;
    weather: string;
    solunar: string;
  };
}

export function generateStationReport(
  port: Port,
  dayData: TideDayData,
  units: UserUnits,
  customQuery?: string
): StationAnalysis {
  const weather = dayData.weather;
  const solunar = dayData.solunar;
  const coeff = dayData.coefficient;
  const tideState = dayData.currentTideState;
  const waterTemp = weather.waterTemp;

  // 1. Station Details
  const coordinates = `${port.lat.toFixed(3)}° N, ${Math.abs(port.lng).toFixed(3)}° ${port.lng < 0 ? 'W' : 'E'}`;
  const sensorNetwork = `Estación Meteorológica y Mareográfica Costera de ${port.name}`;
  const tideModel = `Modelo Armónico Hidrográfico M2/S2 (Amplitud: ${port.amplitude}m, Desfase: ${port.phaseShiftHours}h)`;

  // 2. Fishing Diagnosis Calculation
  let fishingScore = solunar.activityScore;
  
  // Adjust fishing score based on barometric pressure & wind
  if (weather.pressureHpa >= 1013 && weather.pressureHpa <= 1022) {
    fishingScore = Math.min(5, fishingScore + 0.5);
  } else if (weather.pressureHpa < 1008) {
    fishingScore = Math.max(1, fishingScore - 0.5);
  }

  if (coeff >= 75) {
    fishingScore = Math.min(5, fishingScore + 0.5);
  }

  let activityLevel = 'Moderada';
  if (fishingScore >= 4.5) activityLevel = 'Excelente (Picada Intensa)';
  else if (fishingScore >= 3.5) activityLevel = 'Buena';
  else if (fishingScore >= 2.5) activityLevel = 'Aceptable';
  else activityLevel = 'Baja (Marea/Viento poco propicio)';

  // Species recommendation based on water temp & region
  const recommendedSpecies: string[] = [];
  if (waterTemp >= 18) {
    recommendedSpecies.push('Dorada (Sparus aurata)', 'Lubina / Robalo', 'Sargo Real');
    if (port.region.includes('Canarias') || port.region.includes('Andalucía')) {
      recommendedSpecies.push('Baila', 'Pargo / Denton', 'Sama');
    }
  } else {
    recommendedSpecies.push('Lubina / Robalo', 'Sargo Común', 'Calamar de Costa');
    if (port.region.includes('Galicia') || port.region.includes('Asturias') || port.region.includes('Cantabria') || port.region.includes('País Vasco')) {
      recommendedSpecies.push('Abadejo', 'Róbalo de Rompiente', 'Chipirón');
    }
  }

  // Recommended Baits & Lures
  const recommendedBaits: string[] = [];
  if (coeff > 70) {
    recommendedBaits.push('Tita de Palangre', 'Cangrejo Verde', 'Navaja fresca con concha');
  } else {
    recommendedBaits.push('Gusano Americano / Coreano', 'Muergo pelado', 'Vinilos plomados de paseo');
  }
  if (weather.waveHeightMeters > 1.2) {
    recommendedBaits.push('Sardina en salazón (para fondo y espuma)');
  }

  // Best Time Windows based on Tides & Solunar
  const bestTimeWindows: string[] = [];
  
  // High tides window
  const highTides = dayData.highLows.filter(t => t.type === 'pleamar');
  if (highTides.length > 0) {
    highTides.forEach(ht => {
      bestTimeWindows.push(`1.5h antes y después de Pleamar (${ht.time}h)`);
    });
  }

  // Solunar major window
  if (solunar.majorPeriods.length > 0) {
    solunar.majorPeriods.forEach(p => {
      bestTimeWindows.push(`Período Solunar Mayor: ${p.start} - ${p.end}`);
    });
  }

  // Tide Strategy Text
  let tideStrategy = '';
  if (coeff >= 80) {
    tideStrategy = `Coeficiente muy alto (${coeff} - Mareas Vivas). Las corrientes en canales y bocanas serán fuertes. Busca zonas de abrigo, puntales o la última hora del repunte de pleamar.`;
  } else if (coeff <= 55) {
    tideStrategy = `Coeficiente bajo (${coeff} - Mareas Muertas). Las aguas estarán más calmas y transparentes. Ideal para pesca a eging (calamar/sepia) o pesca fina a corcho en zonas rocosas.`;
  } else {
    tideStrategy = `Coeficiente equilibrado (${coeff}). Movimiento de agua continuo idóneo para el comedero de especies costeras como doradas y sargos.`;
  }

  let pressureImpact = '';
  if (weather.pressureTrend.includes('subiendo') || weather.pressureTrend.includes('estable')) {
    pressureImpact = `Presión barométrica favorable (${weather.pressureHpa} hPa). Estimula el comportamiento cazador de los peces en aguas poco profundas.`;
  } else {
    pressureImpact = `Presión barométrica descendente (${weather.pressureHpa} hPa). Los peces suelen aletargarse o buscar zonas más profundas previo al cambio de tiempo.`;
  }

  // 3. Navigation Bulletin Calculation
  let safetyStatus: 'Excelente' | 'Precaución' | 'Adversa / Peligro' = 'Excelente';
  if (weather.windSpeedKnots >= 22 || weather.waveHeightMeters >= 2.2) {
    safetyStatus = 'Adversa / Peligro';
  } else if (weather.windSpeedKnots >= 14 || weather.waveHeightMeters >= 1.3) {
    safetyStatus = 'Precaución';
  }

  let seaStateDetails = `${weather.seaStateName} con altura significativa de ola de ${formatHeight(weather.waveHeightMeters, units)}.`;
  let windSummary = `Viento de componente ${weather.windDirection} (${weather.windDegrees}°) con velocidad media de ${formatWindSpeed(weather.windSpeedKnots, units)} y rachas de hasta ${formatWindSpeed(weather.windGustKnots, units)}. Escala Beaufort: Fuerza ${weather.beaufortScale} (${weather.beaufortDescription}).`;

  let waveType = '';
  if (weather.wavePeriodSeconds >= 10) {
    waveType = `Mar de Fondo Largo (Período de ${weather.wavePeriodSeconds}s). Olas espaciadas y con energía proveniente de borrascas mar adentro. Atención en rompientes de rocas.`;
  } else {
    waveType = `Mar de Viento Corto (Período de ${weather.wavePeriodSeconds}s). Olas cortas generadas por la brisa local.`;
  }

  let coastalAdvice = '';
  if (safetyStatus === 'Adversa / Peligro') {
    coastalAdvice = `ALERTA DE NAVEGACIÓN: Vientos fuertes y oleaje pronunciado. Se desaconseja la salida a la mar para embarcaciones de recreo pequeñas y pesca desde acantilados expuestos.`;
  } else if (safetyStatus === 'Precaución') {
    coastalAdvice = `Navegación con precaución. Mantener vigilancia de las rachas de viento y la corriente de resaca durante los cambios de marea.`;
  } else {
    coastalAdvice = `Condiciones óptimas para la navegación deportiva, fondeo en calas y deportes náuticos (paddle surf, kayak, vela).`;
  }

  // Overall Summary text
  const summary = `Informe en tiempo real emitido por la estación meteorológica y oceanográfica de ${port.name}. Actualmente la marea está ${tideState.toUpperCase()} (${formatHeight(dayData.currentWaterHeight, units)}) con un coeficiente astronómico de ${coeff}. Viento de ${formatWindSpeed(weather.windSpeedKnots, units)} (${weather.windDirection}) y temperatura del agua marina a ${formatTemp(waterTemp, units)}.`;

  // Custom topic filter response if user asked something
  if (customQuery) {
    const q = customQuery.toLowerCase();
    if (q.includes('pesca') || q.includes('pece') || q.includes('picad') || q.includes('carnad') || q.includes('señuel')) {
      tideStrategy = `[RESPUESTA A SU CONSULTA SOBRE PESCA]: ${tideStrategy} Recomendación técnica: usar ${recommendedBaits.slice(0,2).join(', ')} para ${recommendedSpecies.slice(0,2).join(' y ')}.`;
    } else if (q.includes('naveg') || q.includes('barco') || q.includes('viento') || q.includes('ola') || q.includes('segur')) {
      coastalAdvice = `[RESPUESTA A SU CONSULTA SOBRE NAVEGACIÓN]: ${coastalAdvice} Viento actual de ${formatWindSpeed(weather.windSpeedKnots, units)} (${weather.windDirection}) y mar de ${weather.seaStateName.toLowerCase()}.`;
    }
  }

  return {
    stationInfo: {
      id: port.id,
      name: port.name,
      region: port.region,
      coordinates,
      sensorNetwork,
      tideModel,
      lastUpdate: `${formatZonedHHMM(Date.now(), port.timezone)}h (hora local)`,
    },
    summary,
    fishingDiagnosis: {
      score: Math.round(fishingScore * 10) / 10,
      activityLevel,
      recommendedSpecies,
      bestTimeWindows,
      recommendedBaits,
      tideStrategy,
      pressureImpact,
    },
    navigationBulletin: {
      safetyStatus,
      seaStateDetails,
      windSummary,
      waveType,
      coastalAdvice,
    },
    dataSources: {
      tides: `Ecuación Armónica de Mareas M2/S2 (Oficial Puertos del Estado & Instituto Hidrográfico de la Marina / NOAA).`,
      weather: `Red de Estaciones Meteorológicas Costeras y Boyas de Oleaje (AEMET & Open-Meteo Data Network).`,
      solunar: `Efemérides astronómicas exactas del azimut lunar y solar (Tablas Solunares de J. A. Knight).`,
    },
  };
}
