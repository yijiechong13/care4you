import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

const BUCKET_NAME = 'event-images';

/**
 * Upload an image to Supabase Storage
 * @param imageUri - Local URI of the image to upload
 * @param eventId - Event ID for organizing images
 * @param fileName - Optional custom filename
 * @returns Public URL of the uploaded image, or null if failed
 */
export const uploadImage = async (
  imageUri: string,
  eventId: string,
  fileName?: string
): Promise<string | null> => {
  try {
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Generate unique filename
    const timestamp = Date.now();
    const finalFileName = fileName || `event_${eventId}_${timestamp}.jpg`;
    const filePath = `${eventId}/${finalFileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, decode(base64), {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Upload image failed:', error);
    return null;
  }
};

/**
 * Upload multiple images to Supabase Storage
 * @param images - Array of image objects with uri and isPrimary
 * @param eventId - Event ID for organizing images
 * @returns Array of uploaded image URLs with their metadata
 */
export const uploadMultipleImages = async (
  images: { uri: string; isPrimary: boolean }[],
  eventId: string
): Promise<{ url: string; isPrimary: boolean; displayOrder: number }[]> => {
  const uploadedImages: { url: string; isPrimary: boolean; displayOrder: number }[] = [];

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const url = await uploadImage(image.uri, eventId);

    if (url) {
      uploadedImages.push({
        url,
        isPrimary: image.isPrimary,
        displayOrder: i,
      });
    }
  }

  return uploadedImages;
};

/**
 * Delete an image from Supabase Storage
 * @param imageUrl - Public URL of the image to delete
 * @returns true if deleted successfully, false otherwise
 */
export const deleteImage = async (imageUrl: string): Promise<boolean> => {
  try {
    // Extract path from URL
    const urlParts = imageUrl.split(`${BUCKET_NAME}/`);
    if (urlParts.length < 2) {
      console.error('Invalid image URL format');
      return false;
    }
    const path = urlParts[1];

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete image failed:', error);
    return false;
  }
};

/**
 * Delete multiple images from Supabase Storage
 * @param imageUrls - Array of public URLs to delete
 * @returns Number of successfully deleted images
 */
export const deleteMultipleImages = async (imageUrls: string[]): Promise<number> => {
  let deletedCount = 0;

  for (const url of imageUrls) {
    const success = await deleteImage(url);
    if (success) {
      deletedCount++;
    }
  }

  return deletedCount;
};
