-- Create the banners table
CREATE TABLE IF NOT EXISTS banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link TEXT,
  bg_color_from TEXT,
  bg_color_to TEXT,
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0
);

-- Enable Row Level Security (RLS)
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Create Policy: Allow public read access (everyone can see banners)
CREATE POLICY "Allow public read access" 
ON banners FOR SELECT 
USING (true);

-- Create Policy: Allow authenticated insert access (only logged in admins)
CREATE POLICY "Allow authenticated insert access" 
ON banners FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Create Policy: Allow authenticated update access
CREATE POLICY "Allow authenticated update access" 
ON banners FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Create Policy: Allow authenticated delete access
CREATE POLICY "Allow authenticated delete access" 
ON banners FOR DELETE 
USING (auth.role() = 'authenticated');

-- Optional: Create Storage Bucket for Banner Images if you want to switch to Supabase Storage later instead of Base64 strings (which have size limits)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true);
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'banners' );
-- CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'banners' AND auth.role() = 'authenticated' );
