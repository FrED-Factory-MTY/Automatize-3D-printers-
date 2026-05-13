import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is not set.');
  console.error('Copy .env.example to .env and fill in your Supabase credentials.');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "pieces" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(255) NOT NULL,
        "file_path" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log('Successfully created pieces table');
  } catch (error) {
    console.error('Error creating table:', error);
  } finally {
    await sql.end();
  }
}

main();
