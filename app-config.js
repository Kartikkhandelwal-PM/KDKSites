/* ============================================================
   PUBLIC app config — safe to commit.
   The Supabase URL and the "anon" key are designed to be public
   (they ship to every browser); the real secret keys live only in
   Supabase secrets and Netlify env vars, never here.
   ------------------------------------------------------------
   Loaded BEFORE local-ai-config.js. On your machine, the gitignored
   local-ai-config.js overrides this to add a direct AI provider key
   for local testing. On the deployed site (where local-ai-config.js
   does not exist) these values are what powers auth + publish + AI.
   ============================================================ */
window.KDK_AI = {
  provider: 'openai',                                            // AI provider used via the Supabase Edge Function
  supabaseUrl:     'https://hlhtopqbzfzlxxmolkok.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsaHRvcHFiemZ6bHh4bW9sa29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NTMyOTAsImV4cCI6MjA5OTMyOTI5MH0.K5UZ9CbqbNEfMRTMaOVTtlrx9HGi544iy2zf5CVZXww',
  openai:    { model: 'gpt-4o-mini' },
  anthropic: { model: 'claude-opus-4-8' }
};
