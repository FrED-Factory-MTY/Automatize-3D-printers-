import { type NextApiRequest, type NextApiResponse } from 'next';
import { db } from '~/server/db';
import { pieces } from '~/server/db/schema';
import { desc } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const allPieces = await db.select().from(pieces).orderBy(desc(pieces.createdAt));
    return res.status(200).json(allPieces);
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ message: 'Error fetching pieces' });
  }
}
