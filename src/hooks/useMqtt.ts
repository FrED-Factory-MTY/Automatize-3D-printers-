'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useBambuStore } from '~/lib/store';
import { PrinterConfig, mqttTopics, bambuCommands } from '~/lib/types';

// NOTE: Bambu printers use raw MQTT over TCP with TLS (port 8883).
// Browsers cannot open raw TCP sockets, so you have two options:
//
// Option A (LAN, Recommended for local network):
//   Run a small proxy server (e.g. mqtt-ws-proxy or your FastAPI backend)
//   that bridges WebSocket <-> MQTT TCP. Set NEXT_PUBLIC_WS_PROXY_URL.
//
// Option B (Cloud):
//   Use Bambu Cloud MQTT broker at mqtt.bambulab.com:8883
//   with your cloud token. Requires internet access.
//
// This hook connects via WebSocket to your proxy or directly to the cloud broker.

const WS_PROXY_URL = process.env.NEXT_PUBLIC_WS_PROXY_URL || 'ws://localhost:9001';

// Parse Bambu status message and extract fields we care about
function parsePrintReport(payload: Record<string, unknown>, serial: string) {
  const print = payload.print as Record<string, unknown> | undefined;
  if (!print) return null;

  return {
    serial,
    gcodeState: print.gcode_state as string | undefined,
    nozzleTemp: typeof print.nozzle_temper === 'number' ? Math.round(print.nozzle_temper) : undefined,
    nozzleTempTarget: typeof print.nozzle_target_temper === 'number' ? Math.round(print.nozzle_target_temper) : undefined,
    bedTemp: typeof print.bed_temper === 'number' ? Math.round(print.bed_temper) : undefined,
    bedTempTarget: typeof print.bed_target_temper === 'number' ? Math.round(print.bed_target_temper) : undefined,
    chamberTemp: typeof print.chamber_temper === 'number' ? Math.round(print.chamber_temper) : undefined,
    printPercent: typeof print.mc_percent === 'number' ? Math.round(print.mc_percent) : undefined,
    layerNum: typeof print.layer_num === 'number' ? print.layer_num : undefined,
    totalLayerNum: typeof print.total_layer_num === 'number' ? print.total_layer_num : undefined,
    remainingTime: typeof print.mc_remaining_time === 'number' ? print.mc_remaining_time : undefined,
    speed: typeof print.spd_lvl === 'number' ? print.spd_lvl : undefined,
    fileName: typeof print.gcode_file === 'string' ? print.gcode_file.split('/').pop() : undefined,
    wifiSignal: typeof print.wifi_signal === 'string' ? print.wifi_signal : undefined,
  };
}

export function useMqtt(config: PrinterConfig | null) {
  const clientRef = useRef<import('mqtt').MqttClient | null>(null);
  const { updateStatus, addLog, setMqttConnected } = useBambuStore();

  const connect = useCallback(async () => {
    if (!config) return;
    if (clientRef.current) clientRef.current.end(true);

    // Dynamically import mqtt to avoid SSR issues
    const mqtt = (await import('mqtt')).default;

    addLog({ level: 'info', message: `Connecting to ${config.ip}:${config.mqttPort}…` });

    const client = mqtt.connect(WS_PROXY_URL, {
      username: 'bblp',
      password: config.accessCode,
      clientId: `bambu-dash-${config.serial.slice(-6)}-${Date.now()}`,
      clean: true,
      reconnectPeriod: 5000,
      // TLS is handled by the proxy for LAN mode
    });

    clientRef.current = client;

    client.on('connect', () => {
      setMqttConnected(true);
      updateStatus(config.serial, { connected: true });
      addLog({ level: 'info', message: `Connected · SUB ${mqttTopics.report(config.serial)}` });

      client.subscribe(mqttTopics.report(config.serial), { qos: 0 });

      // Ask printer to push its full state immediately
      client.publish(
        mqttTopics.request(config.serial),
        JSON.stringify(bambuCommands.pushAll()),
        { qos: 0 }
      );
    });

    client.on('message', (_topic: string, message: Buffer) => {
      try {
        const payload = JSON.parse(message.toString()) as Record<string, unknown>;
        const patch = parsePrintReport(payload, config.serial);
        if (patch) {
          // Remove undefined fields before merging into store
          const clean = Object.fromEntries(
            Object.entries(patch).filter(([, v]) => v !== undefined)
          );
          updateStatus(config.serial, clean);
          addLog({ level: 'data', message: `layer=${patch.layerNum} temp=${patch.nozzleTemp}°C` });
        }
      } catch (e) {
        addLog({ level: 'warn', message: `Parse error: ${String(e)}` });
      }
    });

    client.on('error', (err: Error) => {
      addLog({ level: 'error', message: err.message });
      setMqttConnected(false);
      updateStatus(config.serial, { connected: false });
    });

    client.on('close', () => {
      setMqttConnected(false);
      updateStatus(config.serial, { connected: false });
      addLog({ level: 'warn', message: 'Disconnected — retrying…' });
    });
  }, [config, addLog, setMqttConnected, updateStatus]);

  // Publish a command to the printer
  const publish = useCallback(
    (payload: object) => {
      if (!clientRef.current || !config) return;
      clientRef.current.publish(
        mqttTopics.request(config.serial),
        JSON.stringify(payload),
        { qos: 0 }
      );
    },
    [config]
  );

  useEffect(() => {
    connect();
    return () => {
      clientRef.current?.end(true);
    };
  }, [connect]);

  return { publish, reconnect: connect };
}
