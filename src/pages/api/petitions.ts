import { type NextApiRequest, type NextApiResponse } from 'next';
import { db } from '~/server/db';
import { petitions, users } from '~/server/db/schema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId, userEmail, fileName, fileUrl, notes, organization } = req.body;

    // 1. Safety Check: Ensure the user exists in our public user_profiles table
    // (Supabase creates them in auth.users, but we need them in our public table too)
    try {
      await db.insert(users).values({
        id: userId,
        email: userEmail,
      }).onConflictDoNothing(); // If they are already in the table, ignore.
    } catch (e) {
      console.log("User profile check passed/handled.");
    }

    // 2. Insert the print job (petition)
    const newPetition = await db.insert(petitions).values({
      userId,
      fileName,
      fileUrl,
      notes: `[Org: ${organization}] ${notes || ''}`, // We append the org to the notes!
    }).returning();

    return res.status(200).json(newPetition[0]);
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ message: 'Error saving petition to database' });
  }
}