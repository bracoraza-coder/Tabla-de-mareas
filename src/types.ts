export interface Port {
  id: string;
  ihmId?: number;
  name: string;
  region: string;
  country: string;
  lat: number;
  lng: number;
  baseHeight: number; // mean sea level in meters
  amplitude: number;  // semi-diurnal tide amplitude
  phaseShiftHours: number; // local phase shift
  waterTempAvg: number; // avg sea temp °C
  isPopular?: boolean;
}

export interface HighLowTide {
  type: 'pleamar' | 'bajamar';
  time: string; // HH:mm
  height: number; // meters
  timestamp: number; // unix timestamp ms
}

export interface HourlyTidePoint {
  time: string; // HH:mm
  timeLabel: string;
  height: number; // meters
  timestamp: number;
  isCurrent?: boolean;
}

export interface SolunarPeriod {
  name: string; // e.g. "Período Mayor 1", "Período Menor 1"
  type: 'mayor' | 'menor';
  start: string; // HH:mm
  end: string;   // HH:mm
  quality: 'alta' | 'media' | 'excelente';
}

export interface SolunarData {
  activityScore: number; // 1 to 5
  activityLabel: 'Muy Baja' | 'Baja' | 'Media' | 'Alta' | 'Excelente';
  majorPeriods: SolunarPeriod[];
  minorPeriods: SolunarPeriod[];
  sunrise: string;
  solarNoon: string;
  sunset: string;
  dayLength: string;
  moonrise: string;
  moonset: string;
  moonTransit: string;
  moonPhaseName: string; // e.g., "Luna Llena", "Cuarto Creciente"
  moonPhaseIcon: string;
  moonIllumination: number; // 0 - 100%
  moonAgeDays: number;
}

export interface MarineWeather {
  temp: number; // °C
  feelsLike: number; // °C
  condition: string; // "Soleado", "Parcialmente nublado", "Chubascos", etc.
  conditionCode: string; // icon key
  windSpeedKnots: number;
  windSpeedKm: number;
  windDirection: string; // e.g. "NNE", "SO"
  windDegrees: number;
  windGustKnots: number;
  beaufortScale: number;
  beaufortDescription: string;
  waveHeightMeters: number;
  wavePeriodSeconds: number;
  waveDirection: string;
  seaStateName: string; // "Mar Calma", "Marejadilla", "Marejada", "Fuerte Marejada"
  waterTemp: number; // °C
  pressureHpa: number;
  pressureTrend: 'ascenso' | 'descenso' | 'estable';
  humidityPercent: number;
  uvIndex: number;
  visibilityKm: number;
}

export interface TideDayData {
  dateStr: string; // YYYY-MM-DD
  dayOfWeek: string;
  coefficient: number; // 30 - 120
  highLows: HighLowTide[];
  hourlyPoints: HourlyTidePoint[];
  currentWaterHeight: number;
  currentTideState: 'subiendo' | 'bajando' | 'pleamar' | 'bajamar';
  nextTide: HighLowTide;
  nextTideTimeLeftStr: string;
  solunar: SolunarData;
  weather: MarineWeather;
}

export interface MonthlyTideRow {
  dateStr: string;
  dayNumber: number;
  dayName: string;
  coefficient: number;
  highTidesStr: string;
  lowTidesStr: string;
  moonPhaseIcon: string;
  moonPhaseName: string;
  solunarScore: number;
  sunrise: string;
  sunset: string;
}

export type UnitHeight = 'm' | 'ft';
export type UnitSpeed = 'knots' | 'kmh' | 'mph';
export type UnitTemp = 'C' | 'F';

export interface UserUnits {
  height: UnitHeight;
  speed: UnitSpeed;
  temp: UnitTemp;
}

export interface NotificationSettings {
  enabled: boolean;
  subscribedPortIds: string[];
  alertTimingMinutes: number; // 0, 15, 30, 60
  notifyPleamar: boolean;
  notifyBajamar: boolean;
  notifyMareasVivas: boolean; // coeff >= 80
}

export interface ScheduledAlert {
  id: string;
  ihmId?: number;
  portId: string;
  portName: string;
  tideType: 'pleamar' | 'bajamar';
  timeStr: string; // HH:mm
  scheduledAlertTimeStr: string; // HH:mm
  heightMeters: number;
  coefficient: number;
  timestamp: number;
}

