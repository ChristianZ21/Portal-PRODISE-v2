import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zqiqrydouzcfdvjgvtoj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxaXFyeWRvdXpjZmR2amd2dG9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MzEzNzgsImV4cCI6MjA5MTQwNzM3OH0.MSNXplkXodHiFWvwqhJZS0BwrZIYiqnOW4WMBFnYsvs'

export const supabase = createClient(supabaseUrl, supabaseKey)
