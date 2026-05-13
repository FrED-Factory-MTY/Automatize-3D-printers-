import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PrinterConfig, PrinterStatus, PrintJob, MqttLogEntry } from './types';

interface BambuStore {
  printers: PrinterConfig[];
  addPrinter: (p: PrinterConfig) => void;
  removePrinter: (serial: string) => void;

  statuses: Record<string, PrinterStatus>;
  updateStatus: (serial: string, patch: Partial<PrinterStatus>) => void;

  selectedSerial: string | null;
  selectPrinter: (serial: string) => void;

  jobs: PrintJob[];
  addJob: (job: PrintJob) => void;
  updateJob: (id: string, patch: Partial<PrintJob>) => void;

  mqttConnected: boolean;
  setMqttConnected: (v: boolean) => void;

  logs: MqttLogEntry[];
  addLog: (entry: Omit<MqttLogEntry, 'timestamp'>) => void;
}

export const useBambuStore = create<BambuStore>()(
  persist(
    (set) => ({
      printers: [],
      addPrinter: (p) => set((s) => ({
        printers: [...s.printers, p],
        selectedSerial: s.selectedSerial ?? p.serial,
      })),
      removePrinter: (serial) => set((s) => ({
        printers: s.printers.filter((p) => p.serial !== serial),
      })),

      statuses: {},
      updateStatus: (serial, patch) =>
        set((s) => ({
          statuses: { ...s.statuses, [serial]: { ...s.statuses[serial], ...patch } },
        })),

      selectedSerial: null,
      selectPrinter: (serial) => set({ selectedSerial: serial }),

      jobs: [],
      addJob: (job) => set((s) => ({ jobs: [job, ...s.jobs] })),
      updateJob: (id, patch) =>
        set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)) })),

      mqttConnected: false,
      setMqttConnected: (v) => set({ mqttConnected: v }),

      logs: [],
      addLog: (entry) =>
        set((s) => ({
          logs: [...s.logs.slice(-99), { ...entry, timestamp: new Date() }],
        })),
    }),
    {
      name: 'bambu-storage',
      partialize: (s) => ({
        printers: s.printers,
        selectedSerial: s.selectedSerial,
        jobs: s.jobs,
      }),
    }
  )
);
