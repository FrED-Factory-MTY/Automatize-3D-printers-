import { type NextApiRequest, type NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { db } from '~/server/db';
import { pieces } from '~/server/db/schema';
import { randomUUID } from 'crypto';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const filenameHeader = req.headers['x-filename'] as string;
  if (!filenameHeader) {
    return res.status(400).json({ message: 'Missing x-filename header' });
  }

  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure the uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Create a unique filename to avoid collisions
    const ext = path.extname(filenameHeader) || '.gcode';
    const baseName = path.basename(filenameHeader, ext);
    const uniqueFileName = `${baseName}-${randomUUID()}${ext}`;
    const filePath = path.join(uploadDir, uniqueFileName);

    // Stream the request body to the file
    const fileStream = fs.createWriteStream(filePath);
    await new Promise<void>((resolve, reject) => {
      req.pipe(fileStream);
      req.on('end', () => resolve());
      req.on('error', (err) => reject(err));
      fileStream.on('error', (err) => reject(err));
    });

    // Save piece metadata to database
    const newPiece = await db.insert(pieces).values({
      name: filenameHeader,
      filePath: filePath, // Store the absolute path for the Python script
    }).returning();

    return res.status(200).json(newPiece[0]);
  } catch (error) {
    console.error('File upload error:', error);
    return res.status(500).json({ message: 'Failed to upload file' });
  }
}
