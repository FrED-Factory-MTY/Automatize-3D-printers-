import { type NextApiRequest, type NextApiResponse } from 'next';
import { db } from '~/server/db';
import { printers } from '~/server/db/schema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // We only want to accept POST requests for adding data
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, ipAddress, accessCode, serialNumber } = req.body;

    // Insert the new printer into Supabase using Drizzle ORM
    const newPrinter = await db.insert(printers).values({
      name,
      ipAddress,
      accessCode,
      serialNumber,
    }).returning();

    // Send the successfully created printer back to the frontend
    return res.status(200).json(newPrinter[0]);
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ message: 'Error saving printer to database' });
  }
}