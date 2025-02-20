import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
export const supabase = createClient(
  'https://mylldnnmdqhzsrmibmio.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15bGxkbm5tZHFoenNybWlibWlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5NzkwNjgsImV4cCI6MjA1NTU1NTA2OH0.SRbtgWbcAMXMkLinxnumc-aOZfZH6TDcJPc4e0c6eKc'
);
