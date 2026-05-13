// Bambu Lab MQTT protocol types
// Based on: https://github.com/bambulab/BambuStudio/wiki

export interface PrinterConfig {
  serial: string;
  ip: string;
  accessCode: string;
  mqttPort: number;
  name: string;
  model: 'X1C' | 'X1' | 'P1S' | 'P1P' | 'A1' | 'A1M' | 'A1 Mini';
}

export interface PrinterStatus {
  serial: string;
  connected: boolean;
  gcodeState: 'IDLE' | 'PREPARE' | 'RUNNING' | 'PAUSE' | 'FINISH' | 'FAILED' | 'SLICING';
  nozzleTemp: number;
  nozzleTempTarget: number;
  bedTemp: number;
  bedTempTarget: number;
  chamberTemp: number;
  fanSpeed: number;         // 0-15
  printPercent: number;     // 0-100
  layerNum: number;
  totalLayerNum: number;
  remainingTime: number;    // minutes
  speed: number;            // 1=Silent 2=Standard 3=Sport 4=Ludicrous
  fileName: string;
  ams: AmsSlot[];
  subtaskName: string;
  wifiSignal: string;
}

export interface AmsSlot {
  id: number;
  color: string;   // hex without #
  type: string;    // PLA, PETG, TPU, etc.
  remain: number;  // 0-100 percent
}

export interface PrintJob {
  id: string;
  fileName: string;
  printerSerial: string;
  status: 'queued' | 'printing' | 'paused' | 'done' | 'failed';
  material: string;
  estimatedMinutes: number;
  startedAt?: Date;
  finishedAt?: Date;
  layerCurrent?: number;
  layerTotal?: number;
  progressPercent?: number;
}

export interface MqttLogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'data';
  message: string;
}

// MQTT topics — Bambu uses device/{serial}/report and device/{serial}/request
export const mqttTopics = {
  report: (serial: string) => `device/${serial}/report`,
  request: (serial: string) => `device/${serial}/request`,
};

// Speed profiles
export const SPEED_PROFILES = {
  1: { label: 'Silent', percent: 50 },
  2: { label: 'Standard', percent: 100 },
  3: { label: 'Sport', percent: 150 },
  4: { label: 'Ludicrous', percent: 166 },
} as const;

// Command payloads — publish these to device/{serial}/request
export const bambuCommands = {
  // Refresh full printer state
  pushAll: () => ({
    pushing: { sequence_id: '0', command: 'pushall' },
  }),

  // Pause the current print
  pause: () => ({
    print: { sequence_id: '0', command: 'pause' },
  }),

  // Resume a paused print
  resume: () => ({
    print: { sequence_id: '0', command: 'resume' },
  }),

  // Stop and cancel the print
  stop: () => ({
    print: { sequence_id: '0', command: 'stop' },
  }),

  // Set speed profile: 1=Silent 2=Standard 3=Sport 4=Ludicrous
  setSpeed: (profile: 1 | 2 | 3 | 4) => ({
    print: { sequence_id: '0', command: 'print_speed', param: String(profile) },
  }),

  // Set nozzle temperature
  setNozzleTemp: (temp: number) => ({
    print: { sequence_id: '0', command: 'gcode_line', param: `M104 S${temp}\n` },
  }),

  // Set bed temperature
  setBedTemp: (temp: number) => ({
    print: { sequence_id: '0', command: 'gcode_line', param: `M140 S${temp}\n` },
  }),
};
