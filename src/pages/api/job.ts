import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import path from 'path';
import { db } from '~/server/db';
import { pieces } from '~/server/db/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { ip, accessCode, serial, pieceId, plate_number } = req.body;

  if (!ip || !accessCode || !serial || !pieceId) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  try {
    const piece = await db.query.pieces.findFirst({
      where: eq(pieces.id, pieceId),
    });

    if (!piece) {
      return res.status(404).json({ message: 'Piece not found' });
    }

    const scriptPath = path.join(process.cwd(), 'src/scripts/add_job.py');
    const pythonCmd = 'python3'; 
    const arg = JSON.stringify({ ip, accessCode, serial, filepath: piece.filePath, filename: piece.name, plate_number: plate_number || 1 });

    exec(`${pythonCmd} ${scriptPath} '${arg}'`, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return res.status(500).json({ message: 'Failed to execute script', error: stderr || error.message });
      }
      
      try {
        const result = JSON.parse(stdout);
        if (result.error) {
          return res.status(400).json({ message: result.error });
        }
        return res.status(200).json({ message: 'Job started successfully' });
      } catch (e) {
        return res.status(500).json({ message: 'Failed to parse script output', output: stdout });
      }
    });
  } catch (error) {
    console.error('Job submission error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}
