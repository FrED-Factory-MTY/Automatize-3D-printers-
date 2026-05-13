// Bambu Lab MQTT WebSocket proxy — with TLS
// Usage: node proxy.js <printer-ip> <access-code>

const tls  = require('tls');
const http = require('http');
const { WebSocketServer } = require('ws');

const PRINTER_IP   = process.argv[2];
const ACCESS_CODE  = process.argv[3];
const WS_PORT      = process.argv[4] || 9001;
const PRINTER_PORT = 8883;

if (!PRINTER_IP || !ACCESS_CODE) {
  console.error('Usage: node proxy.js <printer-ip> <access-code>');
  process.exit(1);
}

const server = http.createServer();
const wss = new WebSocketServer({ server });

console.log(`\n🖨  Bambu MQTT proxy (TLS)`);
console.log(`   Printer  : ${PRINTER_IP}:${PRINTER_PORT}`);
console.log(`   WebSocket: ws://localhost:${WS_PORT}`);
console.log(`   Waiting for dashboard to connect...\n`);

wss.on('connection', (ws) => {
  console.log('→ Dashboard connected');

  // TLS connection to Bambu printer (self-signed cert, so rejectUnauthorized: false)
  const tcp = tls.connect({
    host: PRINTER_IP,
    port: PRINTER_PORT,
    rejectUnauthorized: false,
  });

  tcp.on('secureConnect', () => console.log('→ Printer TLS connected ✓'));
  tcp.on('error',   (e) => { console.error('Printer error:', e.message); ws.close(); });
  tcp.on('close',   ()  => { console.log('→ Printer disconnected'); ws.close(); });

  // Printer → Dashboard
  tcp.on('data', (data) => {
    if (ws.readyState === ws.OPEN) ws.send(data);
  });

  // Dashboard → Printer
  ws.on('message', (data) => tcp.write(data));
  ws.on('close',   ()     => { console.log('→ Dashboard disconnected'); tcp.destroy(); });
  ws.on('error',   (e)    => { console.error('WS error:', e.message); tcp.destroy(); });
});

server.listen(WS_PORT, () => {
  console.log(`✓ Proxy running on ws://localhost:${WS_PORT}\n`);
});