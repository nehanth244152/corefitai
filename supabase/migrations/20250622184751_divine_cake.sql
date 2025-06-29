/*
  # Create storage bucket for food images

  1. Storage
    - Create `food-images` bucket for storing meal photos
    - Enable public access for food images
    - Set up RLS policies for secure access

  2. Security
    - Users can upload images to their own folder
    - Users can view their own images
    - Images are publicly accessible via URL
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('food-images', 'food-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for uploading images
CREATE POLICY "Users can upload own food images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'food-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policy for viewing images
CREATE POLICY "Users can view own food images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'food-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policy for updating images
CREATE POLICY "Users can update own food images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'food-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policy for deleting images
CREATE POLICY "Users can delete own food images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'food-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);