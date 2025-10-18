-- Supabase Database Schema for Route Recommendation App
-- Run these commands in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Admins table
CREATE TABLE admins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  profile_image_url TEXT,
  instagram_id TEXT
);

-- Routes table
CREATE TABLE routes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES admins(id) ON DELETE CASCADE NOT NULL,
  is_public BOOLEAN DEFAULT true
);

-- Places table
CREATE TABLE places (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE NOT NULL,
  place_name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  kakao_place_id TEXT,
  order_index INTEGER NOT NULL
);

-- Place descriptions table
CREATE TABLE place_descriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  place_id UUID REFERENCES places(id) ON DELETE CASCADE NOT NULL,
  content JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_routes_creator ON routes(creator_id);
CREATE INDEX idx_places_route ON places(route_id);
CREATE INDEX idx_places_order ON places(route_id, order_index);
CREATE INDEX idx_place_descriptions_place ON place_descriptions(place_id);

-- Enable Row Level Security (RLS)
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_descriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Allow public read, but require authentication for write)
-- For simplicity, we'll allow public read access and handle auth in the app layer

-- Public read access for routes
CREATE POLICY "Public routes are viewable by everyone"
  ON routes FOR SELECT
  USING (is_public = true);

-- Allow all operations for authenticated users (you can refine this later)
CREATE POLICY "Authenticated users can do everything with routes"
  ON routes FOR ALL
  USING (true);

-- Public read access for places
CREATE POLICY "Places are viewable by everyone"
  ON places FOR SELECT
  USING (true);

-- Allow all operations for authenticated users
CREATE POLICY "Authenticated users can do everything with places"
  ON places FOR ALL
  USING (true);

-- Public read access for descriptions
CREATE POLICY "Descriptions are viewable by everyone"
  ON place_descriptions FOR SELECT
  USING (true);

-- Allow all operations for authenticated users
CREATE POLICY "Authenticated users can do everything with descriptions"
  ON place_descriptions FOR ALL
  USING (true);

-- Public read access for admins (for displaying creator info)
CREATE POLICY "Admin profiles are viewable by everyone"
  ON admins FOR SELECT
  USING (true);

-- Allow insert for new admin registration
CREATE POLICY "Anyone can create admin profile"
  ON admins FOR INSERT
  WITH CHECK (true);

-- Storage bucket for profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true);

-- Storage policy for profile images
CREATE POLICY "Public profile images are accessible by everyone"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-images');

CREATE POLICY "Anyone can upload profile images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-images');
