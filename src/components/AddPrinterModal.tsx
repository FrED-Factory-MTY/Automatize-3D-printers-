import { useState } from 'react';
import { useBambuStore } from '~/lib/store';

export default function AddPrinterModal({ onClose }: { onClose?: () => void }) {
  const { addPrinter } = useBambuStore();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [serialNumber, setSerialNumber] = useState('');

  const handleAddPrinter = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // 1. Send the data to your Supabase Database via the API route
      const response = await fetch('/api/printers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, ipAddress, accessCode, serialNumber }),
      });

      if (!response.ok) throw new Error('Failed to save to database');

      const savedPrinter = await response.json();

      // 2. Add it to your local Zustand store so the Dashboard updates instantly
      addPrinter({
        serial: savedPrinter.serialNumber, // Map DB schema to Zustand state
        ip: savedPrinter.ipAddress,
        accessCode: savedPrinter.accessCode,
        mqttPort: 8883 // Default Bambu MQTT port
      });

      setMessage('Printer successfully added to database!');
      
      // Clear form
      setName('');
      setIpAddress('');
      setAccessCode('');
      setSerialNumber('');
      
    } catch (error) {
      setMessage('Error adding printer. Make sure the serial number is unique.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-panel border border-border p-6 rounded-lg w-full max-w-sm">
      <h2 className="text-xl font-bold mb-4 text-text">Add New Printer</h2>
      
      <form onSubmit={handleAddPrinter} className="flex flex-col gap-4">
        <div>
          <label className="block text-dim mb-1 text-xs uppercase tracking-wider">Printer Name</label>
          <input 
            type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. X1 Carbon Primary" required
            className="w-full bg-surface border border-border rounded px-3 py-2 text-text focus:border-accent outline-none"
          />
        </div>

        <div>
          <label className="block text-dim mb-1 text-xs uppercase tracking-wider">Serial Number</label>
          <input 
            type="text" value={serialNumber} onChange={e => setSerialNumber(e.target.value)}
            placeholder="e.g. 00M00A00000" required
            className="w-full bg-surface border border-border rounded px-3 py-2 text-text focus:border-accent outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-dim mb-1 text-xs uppercase tracking-wider">IP Address</label>
            <input 
              type="text" value={ipAddress} onChange={e => setIpAddress(e.target.value)}
              placeholder="192.168.1.50" required
              className="w-full bg-surface border border-border rounded px-3 py-2 text-text focus:border-accent outline-none"
            />
          </div>

          <div>
            <label className="block text-dim mb-1 text-xs uppercase tracking-wider">Access Code</label>
            <input 
              type="password" value={accessCode} onChange={e => setAccessCode(e.target.value)}
              placeholder="••••••••" required
              className="w-full bg-surface border border-border rounded px-3 py-2 text-text focus:border-accent outline-none"
            />
          </div>
        </div>

        <div className="mt-2 flex gap-2">
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 bg-surface border border-border text-text font-bold py-2 px-4 rounded hover:opacity-90 transition-opacity"
          >
            Cancel
          </button>
          <button 
            type="submit" disabled={loading}
            className="flex-1 bg-accent text-ink font-bold py-2 px-4 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Printer'}
          </button>
        </div>

        {message && (
          <p className={`text-sm mt-2 ${message.includes('Error') ? 'text-danger' : 'text-success'}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
}