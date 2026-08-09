export interface Port {
  id: string;
  name: string;
  country: string;
  region: string;
  lat: number;
  lng: number;
  timezone: string;
  baseHeight: number; // For algorithmic approximation
  amplitude: number;  // For algorithmic approximation
  phaseDelayMinutes: number; // For algorithmic approximation relative to standard Moon transit
  isPopular: boolean;
  beachAngle?: number; // Beach facing orientation angle (0° to 360°)
}

export interface WindClassification {
  windType: 'Terral (Offshore)' | 'Onshore (Mar de Tierra)' | 'Costero (Sideshore)';
  ratingText: 'Excelente' | 'Desfavorable' | 'Aceptable';
  angleDiff: number;
  isOffshore: boolean;
  isOnshore: boolean;
  description: string;
}

export interface TideEvent {
  time: string; // HH:MM
  height: number; // meters
  type: 'pleamar' | 'bajamar';
}

export interface CurvePoint {
  time: string;
  height: number;
}

export interface SolunarData {
  moonPhaseName: string;
  illuminationPercent: number; // 0-100
  isWaxing: boolean;
  majorPeriods: { start: string; end: string }[];
  minorPeriods: { start: string; end: string }[];
  activityScore: number; // 0-100
}

export interface TideDayData {
  dateStr: string; // YYYY-MM-DD
  highLows: TideEvent[];
  curvePoints: CurvePoint[];
  coefficient: number; // 30-120
  
  // Solunar & Sun
  solunar: SolunarData;
  sunrise: string; // HH:MM
  sunset: string; // HH:MM

  // Real-time state
  currentWaterHeight: number;
  currentTideState: 'subiendo' | 'bajando';
  nextTide: TideEvent;
  nextTideTimeLeftStr: string;
}

export interface MarineWeather {
  // Wind
  windSpeedKnots: number;
  windDirection: string; // N, NE, etc.
  windDegrees: number;
  windGustKnots: number;
  // Waves
  waveHeightMeters: number;
  waveDirection: string;
  wavePeriodSeconds: number;
  waterTemp: number; // Celsius
  seaStateName: string; // Marejadilla, Marejada, etc.
  // Beaufort
  beaufortScale: number;
  beaufortDescription: string;
  // Standard Weather
  temp: number; // Celsius
  feelsLike: number;
  condition: string; // Sunny, Cloudy, etc.
  pressureHpa: number;
  pressureTrend: 'ascenso' | 'descenso' | 'estable';
  humidityPercent: number;
  uvIndex: number;
  visibilityKm: number;
}

// User Preferences stored in localStorage
export interface UserUnits {
  height: 'm' | 'ft';
  speed: 'knots' | 'kmh' | 'mph';
  temp: 'C' | 'F';
}

export interface NotificationSettings {
  enabled: boolean;
  subscribedPortIds: string[];
  alertTimingMinutes: number; // e.g., 60 mins before
  notifyPleamar: boolean;
  notifyBajamar: boolean;
  notifyMareasVivas: boolean; // only notify if coef >= 80
}

// For the monthly table
export interface MonthlyTideRow {
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  dayName: string; // Lunes, Martes...
  coefficient: number;
  highTidesStr: string; // "04:15(2.4m) 16:30(2.6m)"
  lowTidesStr: string;  // "10:20(0.4m) 22:45(0.5m)"
  moonPhaseIcon: string;
  moonPhaseName: string;
  solunarScore: number; // 1-5 stars approx
  sunrise: string;
  sunset: string;
}

export interface ScheduledAlert {
  id: string;
  portId: string;
  portName: string;
  tideType: 'pleamar' | 'bajamar';
  timeStr: string; // HH:MM of the actual tide event
  scheduledAlertTimeStr: string; // HH:MM when the alert will fire
  heightMeters: number;
  coefficient: number;
}
