import { useState, useEffect, useRef } from 'react';
import { useBambuStore } from '~/lib/store';

type Piece = {
  id: number;
  name: string;
  filePath: string;
  createdAt: string;
};

export default function AddJobModal({ onClose }: { onClose: () => void }) {
  const { printers } = useBambuStore();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [serial, setSerial] = useState(printers[0]?.serial || '');
  const [plateNumber, setPlateNumber] = useState(1);
  
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [selectedPieceId, setSelectedPieceId] = useState<number | ''>('');
  
  const [uploadMode, setUploadMode] = useState(false);
  const [isFolderUpload, setIsFolderUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch available pieces on load
  useEffect(() => {
    fetch('/api/pieces')
      .then(res => res.json())
      .then(data => {
        setPieces(data);
        if (data.length > 0) {
          setSelectedPieceId(data[0].id);
        } else {
          setUploadMode(true);
        }
      })
      .catch(err => console.error("Failed to fetch pieces:", err));
  }, []);

  const handleFileUpload = async (files: FileList): Promise<Piece | null> => {
    setUploading(true);
    try {
      const firstFile = files.item(0);
      if (!firstFile) throw new Error('No file selected');

      let fileToUpload: File | Blob = firstFile;
      let filename = firstFile.name;

      // Check if multiple files or a directory was selected
      if (files.length > 1 || (files.length === 1 && firstFile.webkitRelativePath)) {
        setMessage(`Zipping folder contents...`);
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        
        const firstPath = firstFile.webkitRelativePath || '';
        const rootFolder = firstPath.includes('/') ? firstPath.substring(0, firstPath.indexOf('/')) : 'archive';
        filename = rootFolder.endsWith('.3mf') ? rootFolder : `${rootFolder}.gcode.3mf`;

        for (let i = 0; i < files.length; i++) {
          const file = files.item(i);
          if (!file) continue;
          const pathParts = file.webkitRelativePath.split('/');
          // Remove the root folder from the path
          const relativePath = pathParts.slice(1).join('/');
          if (relativePath) {
            zip.file(relativePath, file);
          }
        }
        fileToUpload = await zip.generateAsync({ type: 'blob' });
        setMessage(`Uploading ${filename} to server...`);
      } else {
        setMessage(`Uploading ${filename} to server...`);
      }

      const response = await fetch('/api/pieces/upload', {
        method: 'POST',
        headers: {
          'X-Filename': filename,
          'Content-Type': 'application/octet-stream',
        },
        body: fileToUpload,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const newPiece = await response.json();
      setPieces([newPiece, ...pieces]);
      setSelectedPieceId(newPiece.id);
      return newPiece;
    } catch (error) {
      setMessage(`Upload Error: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const printer = printers.find(p => p.serial === serial);
    if (!printer) {
      setMessage('Error: Select a valid printer');
      setLoading(false);
      return;
    }

    let finalPieceId = selectedPieceId;

    // If in upload mode, upload the file first
    if (uploadMode) {
      const files = fileInputRef.current?.files;
      if (!files || files.length === 0) {
        setMessage('Error: Please select a file or folder to upload');
        setLoading(false);
        return;
      }
      const newPiece = await handleFileUpload(files);
      if (!newPiece) {
        setLoading(false);
        return;
      }
      finalPieceId = newPiece.id;
    }

    if (!finalPieceId) {
      setMessage('Error: Please select a piece to print');
      setLoading(false);
      return;
    }

    setMessage('Sending to printer (this may take a minute)...');

    try {
      const response = await fetch('/api/job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ip: printer.ip,
          accessCode: printer.accessCode,
          serial: printer.serial,
          pieceId: finalPieceId,
          plate_number: plateNumber
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to start job');
      }

      setMessage('Job started successfully!');
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-panel border border-border p-6 rounded-lg w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4 text-text">Send New Print Job</h2>
        
        <form onSubmit={handleAddJob} className="flex flex-col gap-4">
          <div>
            <label className="block text-dim mb-1 text-xs uppercase tracking-wider">Printer</label>
            <select 
              value={serial} onChange={e => setSerial(e.target.value)}
              required
              className="w-full bg-surface border border-border rounded px-3 py-2 text-text focus:border-accent outline-none"
            >
              <option value="" disabled>Select Printer</option>
              {printers.map(p => (
                <option key={p.serial} value={p.serial}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-dim text-xs uppercase tracking-wider">Model / Piece</label>
              <div className="flex gap-2">
                {uploadMode && (
                  <button 
                    type="button"
                    onClick={() => {
                      setIsFolderUpload(!isFolderUpload);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-accent text-xs hover:underline"
                  >
                    {isFolderUpload ? 'Select File Instead' : 'Select Folder'}
                  </button>
                )}
                <button 
                  type="button"
                  onClick={() => setUploadMode(!uploadMode)}
                  className="text-accent text-xs hover:underline"
                >
                  {uploadMode ? 'Select Existing' : 'Upload New'}
                </button>
              </div>
            </div>

            {uploadMode ? (
              <input 
                key={isFolderUpload ? 'folder' : 'file'} // Force re-render to apply webkitdirectory correctly
                type="file" 
                ref={fileInputRef}
                accept={isFolderUpload ? undefined : ".gcode,.3mf"}
                {...(isFolderUpload ? { webkitdirectory: "", directory: "" } as any : {})}
                required={uploadMode}
                className="w-full bg-surface border border-border rounded px-3 py-2 text-text focus:border-accent outline-none text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-accent/10 file:text-accent hover:file:bg-accent/20"
              />
            ) : (
              <select 
                value={selectedPieceId} 
                onChange={e => setSelectedPieceId(parseInt(e.target.value))}
                required={!uploadMode}
                className="w-full bg-surface border border-border rounded px-3 py-2 text-text focus:border-accent outline-none"
              >
                <option value="" disabled>Select a piece</option>
                {pieces.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-dim mb-1 text-xs uppercase tracking-wider">Plate Number</label>
            <input 
              type="number" value={plateNumber} onChange={e => setPlateNumber(parseInt(e.target.value))}
              min="1" required
              className="w-full bg-surface border border-border rounded px-3 py-2 text-text focus:border-accent outline-none"
            />
          </div>

          <div className="mt-2 flex gap-2">
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading || uploading}
              className="flex-1 bg-surface border border-border text-text font-bold py-2 px-4 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || uploading}
              className="flex-1 bg-accent text-ink font-bold py-2 px-4 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading || uploading ? 'Working...' : 'Start Job'}
            </button>
          </div>

          {message && (
            <p className={`text-sm mt-2 ${message.includes('Error') ? 'text-danger' : 'text-success'}`}>
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}