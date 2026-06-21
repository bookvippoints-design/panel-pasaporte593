import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jsvzljwfuksneglmcwuc.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzdnpsandmdWtzbmVnbG1jd3VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5OTc3MzksImV4cCI6MjA5NzU3MzczOX0._uPBW8jRj1qOCYqdOYKnMWe1zC85kQ8wsA8K22GqbLE'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
