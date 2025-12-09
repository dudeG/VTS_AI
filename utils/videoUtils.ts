import { VideoMetadata } from '../types';

export const extractFramesFromVideo = async (
  videoFile: File,
  numFrames: number = 4
): Promise<{ frames: { timestamp: number; data: string }[]; metadata: VideoMetadata }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const url = URL.createObjectURL(videoFile);

    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    const frames: { timestamp: number; data: string }[] = [];

    video.onloadedmetadata = async () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const duration = video.duration;
      const interval = duration / (numFrames + 1); // Avoid start and very end

      try {
        for (let i = 1; i <= numFrames; i++) {
          const currentTime = interval * i;
          video.currentTime = currentTime;
          
          await new Promise<void>((seekResolve) => {
            const onSeeked = () => {
              video.removeEventListener('seeked', onSeeked);
              seekResolve();
            };
            video.addEventListener('seeked', onSeeked);
          });

          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            // Use JPEG for slightly smaller base64 strings, though PNG is fine too
            const data = canvas.toDataURL('image/jpeg', 0.9);
            frames.push({ timestamp: currentTime, data });
          }
        }

        URL.revokeObjectURL(url);
        resolve({
          frames,
          metadata: {
            duration,
            width: video.videoWidth,
            height: video.videoHeight,
          },
        });
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    video.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error("Error loading video file"));
    };
  });
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};