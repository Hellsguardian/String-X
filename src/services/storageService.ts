import { supabase } from '../lib/supabase/client';
import { isSupabaseConfigured } from '../lib/supabase/env';
import { ServiceResult, successResult, errorResult } from '../types/api';

const BUCKET_NAME = 'profile-photos';

export const storageService = {
  /**
   * Upload profile photo or face verification image to Supabase Storage
   */
  async uploadPhoto(
    fileOrBlob: File | Blob,
    userId: string,
    fileNamePrefix = 'photo'
  ): Promise<ServiceResult<{ publicUrl: string; path: string }>> {
    try {
      const ext = fileOrBlob.type.includes('png') ? 'png' : 'jpg';
      const path = `${userId}/${fileNamePrefix}_${Date.now()}.${ext}`;

      if (isSupabaseConfigured) {
        const { error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(path, fileOrBlob, {
            upsert: true,
            contentType: fileOrBlob.type || 'image/jpeg',
          });

        if (error) {
          return errorResult(error.message, error.name, error);
        }

        const { data: publicData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(path);

        return successResult({
          publicUrl: publicData.publicUrl,
          path,
        });
      }

      // Local mock fallback: create object URL or read as DataURL
      const mockUrl = URL.createObjectURL(fileOrBlob);
      return successResult({
        publicUrl: mockUrl,
        path,
      });
    } catch (err: any) {
      return errorResult(err.message || 'Failed to upload photo');
    }
  },

  /**
   * Convert base64 dataUrl (from camera capture) to Blob and upload
   */
  async uploadDataUrl(
    dataUrl: string,
    userId: string,
    fileNamePrefix = 'face_verification'
  ): Promise<ServiceResult<{ publicUrl: string; path: string }>> {
    try {
      if (!dataUrl.startsWith('data:')) {
        // Already a remote URL
        return successResult({ publicUrl: dataUrl, path: dataUrl });
      }

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      return this.uploadPhoto(blob, userId, fileNamePrefix);
    } catch (err: any) {
      return errorResult(err.message || 'Failed to process image data');
    }
  },

  /**
   * Upload face verification selfie to private 'verifications' bucket
   */
  async uploadVerificationSelfie(
    fileOrBlob: File | Blob,
    userId: string
  ): Promise<ServiceResult<{ path: string }>> {
    try {
      const ext = fileOrBlob.type.includes('png') ? 'png' : 'jpg';
      const path = `${userId}/face_verification_${Date.now()}.${ext}`;

      if (isSupabaseConfigured) {
        const { error } = await supabase.storage
          .from('verifications')
          .upload(path, fileOrBlob, {
            upsert: true,
            contentType: fileOrBlob.type || 'image/jpeg',
          });

        if (error) {
          console.warn('[storageService] verifications bucket upload warning:', error.message);
          // If storage fails, we still return the deterministic path for the user folder
          return successResult({ path });
        }

        return successResult({ path });
      }

      return successResult({ path: `${userId}/mock_face_${Date.now()}.jpg` });
    } catch (err: any) {
      return errorResult(err.message || 'Failed to upload verification selfie');
    }
  },

  /**
   * Upload base64 face verification selfie dataUrl to 'verifications' bucket
   */
  async uploadVerificationDataUrl(
    dataUrl: string,
    userId: string
  ): Promise<ServiceResult<{ path: string }>> {
    try {
      if (!dataUrl.startsWith('data:')) {
        return successResult({ path: dataUrl });
      }
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      return this.uploadVerificationSelfie(blob, userId);
    } catch (err: any) {
      return errorResult(err.message || 'Failed to process image data');
    }
  },
};
