/* ============================================================
   SUPABASE CONNECTION CONFIG
   Fill these two values in with your own project's credentials.
   Project Settings → API → Project URL / anon public key.
   The anon key is safe to expose in client code — it only ever
   acts through the RLS policies you already defined in SQL.
============================================================ */

const SUPABASE_URL = "https://kmnpmcsrzcuzlpcdfrvc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_DRWizJD7cm1aZSCWIBtD-g_lW6hR4qj";

// Storage buckets used by the dashboard (must match your SQL setup)
const BUCKET_PORTFOLIO = "portfolio";
const BUCKET_DOCUMENTS = "documents";
