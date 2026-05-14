/**
 * @module faceApiLoader
 * @description Frontend utility / library module.
 */

const CDN_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/dist/face-api.js';

interface FaceNetLoader {
  loadFromUri(uri: string): Promise<void>;
}

interface FaceLandmarksWithEyes {
  getLeftEye(): { x: number; y: number }[];
  getRightEye(): { x: number; y: number }[];
}

interface FaceDetectionWithLandmarks {
  landmarks: FaceLandmarksWithEyes;
  withFaceDescriptor(): PromiseLike<{
    descriptor: Float32Array;
    detection: { score: number };
  } | null | undefined>;
}

interface FaceDetectionTask {
  withFaceLandmarks(): PromiseLike<FaceDetectionWithLandmarks | null | undefined> & {
    withFaceDescriptor(): PromiseLike<{
      descriptor: Float32Array;
      detection: { score: number };
    } | null | undefined>;
  };
}

export interface FaceApiModule {
  nets: {
    tinyFaceDetector: FaceNetLoader;
    faceLandmark68Net: FaceNetLoader;
    faceRecognitionNet: FaceNetLoader;
  };
  TinyFaceDetectorOptions: new () => object;
  detectSingleFace(
    input: HTMLVideoElement | HTMLCanvasElement,
    options: object
  ): FaceDetectionTask;
}

type FaceApiWindow = Window & typeof globalThis & { __faceApiLoaded?: boolean; faceapi?: FaceApiModule };

let loadPromise: Promise<FaceApiModule> | null = null;

export function loadFaceApi(): Promise<FaceApiModule> {
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR not supported'));

  const win = window as FaceApiWindow;

  if (win.__faceApiLoaded && win.faceapi) {
    return Promise.resolve(win.faceapi);
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${CDN_URL}"]`);
    if (existing) {
      const check = () => {
        if (win.faceapi) {
          win.__faceApiLoaded = true;
          resolve(win.faceapi);
        } else {
          setTimeout(check, 100);
        }
      };
      check();
      return;
    }

    const script = document.createElement('script');
    script.src = CDN_URL;
    script.async = true;
    script.onload = () => {
      if (win.faceapi) {
        win.__faceApiLoaded = true;
        resolve(win.faceapi);
      } else {
        reject(new Error('face-api.js loaded but window.faceapi is undefined'));
      }
    };
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Failed to load face-api.js from CDN'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
