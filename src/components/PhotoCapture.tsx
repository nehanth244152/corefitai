import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, X, Check, AlertCircle, Smartphone } from 'lucide-react';

interface PhotoCaptureProps {
  onPhotoCapture: (imageData: string) => void;
  onClose: () => void;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onPhotoCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<{
    isMobile: boolean;
    isIOS: boolean;
    isAndroid: boolean;
    browser: string;
  }>({
    isMobile: false,
    isIOS: false,
    isAndroid: false,
    browser: 'unknown'
  });

  // Detect device and browser
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    
    let browser = 'unknown';
    if (userAgent.includes('Chrome')) browser = 'chrome';
    else if (userAgent.includes('Firefox')) browser = 'firefox';
    else if (userAgent.includes('Safari')) browser = 'safari';
    else if (userAgent.includes('Edge')) browser = 'edge';

    setDeviceInfo({ isMobile, isIOS, isAndroid, browser });
  }, []);

  const checkCameraSupport = () => {
    // Check if running in secure context (HTTPS or localhost)
    if (!window.isSecureContext) {
      return {
        supported: false,
        reason: 'Camera requires HTTPS. Please access this site over HTTPS or use file upload instead.'
      };
    }

    // Check if getUserMedia is available
    if (!navigator.mediaDevices?.getUserMedia) {
      return {
        supported: false,
        reason: 'Camera is not supported in this browser. Please use the file upload option.'
      };
    }

    return { supported: true };
  };

  const waitForVideoElement = async (maxWait = 5000): Promise<HTMLVideoElement> => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      if (videoRef.current) {
        return videoRef.current;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error('Video element not available after waiting');
  };

  const requestCameraPermission = async () => {
    try {
      setIsLoading(true);
      setCameraError(null);
      setPermissionRequested(true);
      
      console.log('🍎 Requesting camera permission for iOS/Android...');
      
      // Check camera support first
      const supportCheck = checkCameraSupport();
      if (!supportCheck.supported) {
        throw new Error(supportCheck.reason);
      }

      // Wait for video element to be available (critical for iOS)
      console.log('📱 Waiting for video element...');
      await waitForVideoElement();
      console.log('📱 Video element is ready');

      // Start camera directly with iOS-optimized approach
      await startCameraDirectly();
      
    } catch (error: any) {
      console.error('🍎 Camera permission failed:', error);
      setIsLoading(false);
      setPermissionRequested(false);
      
      let errorMessage = '';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission was denied. Please:\n\n1. Refresh the page\n2. Click "Allow" when prompted for camera access\n3. Or use "Upload from Gallery" below';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device. Please use the "Upload from Gallery" option.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is being used by another app. Please close other camera apps and try again.';
      } else if (error.message.includes('HTTPS')) {
        errorMessage = error.message;
      } else if (error.message.includes('not supported')) {
        errorMessage = error.message;
      } else if (error.message.includes('Video element')) {
        errorMessage = 'Camera interface initialization failed. Please try again or use "Upload from Gallery".';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Camera startup timed out. This sometimes happens on iOS - please try "Upload from Gallery" or try again.';
      } else {
        errorMessage = `Camera access failed: ${error.message}\n\nPlease try "Upload from Gallery" instead.`;
      }
      
      setCameraError(errorMessage);
    }
  };

  const startCameraDirectly = async () => {
    try {
      console.log('🍎 Starting camera with iOS-optimized constraints...');
      
      // Ensure video element is still available
      const video = await waitForVideoElement();
      console.log('📱 Video element confirmed available');

      // Reset video element state
      video.srcObject = null;
      setVideoReady(false);
      
      // iOS-optimized constraints - simpler and more reliable
      let constraints: MediaStreamConstraints;
      
      if (deviceInfo.isIOS) {
        // Simplified constraints for iOS - avoid complex ideal/max values
        constraints = {
          video: {
            facingMode: 'environment', // Use string instead of object for better iOS compatibility
            width: 1280,
            height: 720,
            frameRate: 30
          }
        };
      } else if (deviceInfo.isAndroid) {
        constraints = {
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          }
        };
      } else {
        constraints = {
          video: {
            facingMode: 'environment',
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30 }
          }
        };
      }

      console.log('📱 Requesting camera with constraints:', constraints);
      
      // Request camera access with full constraints
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('🍎 Camera stream obtained successfully');

      // Configure video element
      video.srcObject = mediaStream;
      video.playsInline = true;
      video.muted = true;
      video.autoplay = true;
      video.controls = false;

      // iOS-specific video loading with better error handling
      await new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          cleanup();
          reject(new Error('Camera startup timeout. This can happen on iOS - please try "Upload from Gallery".'));
        }, deviceInfo.isIOS ? 20000 : 10000); // Longer timeout for iOS

        let resolved = false;

        const onLoadedMetadata = async () => {
          if (resolved) return;
          
          console.log('📱 Video metadata loaded:', video.videoWidth, 'x', video.videoHeight);
          
          // Ensure we have valid video dimensions
          if (video.videoWidth === 0 || video.videoHeight === 0) {
            console.warn('📱 Video dimensions are zero, waiting...');
            return;
          }
          
          try {
            // iOS requires careful handling of play() promise
            if (deviceInfo.isIOS) {
              // For iOS, try to play and handle any promise rejection gracefully
              try {
                await video.play();
                console.log('🍎 iOS video playing successfully');
              } catch (playError) {
                console.warn('🍎 iOS video play warning (may still work):', playError);
                // Don't reject here - iOS sometimes works even with play() errors
              }
            } else {
              const playPromise = video.play();
              if (playPromise) {
                await playPromise;
                console.log('📱 Video playing successfully');
              }
            }
            
            // Additional iOS-specific check
            if (deviceInfo.isIOS) {
              // Give iOS a moment to stabilize
              await playPromise;
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            resolved = true;
            clearTimeout(timeoutId);
            cleanup();
            setVideoReady(true);
            resolve();
          } catch (playError) {
            console.error('📱 Video play failed:', playError);
            if (!resolved) {
              resolved = true;
              clearTimeout(timeoutId);
              cleanup();
              if (deviceInfo.isIOS) {
                reject(new Error('iOS camera setup failed. Please try "Upload from Gallery" or refresh the page.'));
              } else {
                reject(new Error('Failed to start video playback. Please try again.'));
              }
            }
          }
        };

        const onCanPlay = () => {
          if (resolved) return;
          console.log('📱 Video can play');
          onLoadedMetadata();
        };
        
        const onLoadedData = () => {
          if (resolved) return;
          console.log('🍎 Video data loaded (iOS event)');
          onLoadedMetadata();
        };

        const onError = (error: any) => {
          console.error('📱 Video error:', error);
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            cleanup();
            if (deviceInfo.isIOS) {
              reject(new Error('iOS camera failed to load. Please try "Upload from Gallery" or check camera permissions in Settings.'));
            } else {
              reject(new Error('Video failed to load. Please check your camera connection.'));
            }
          }
        };

        const cleanup = () => {
          video.removeEventListener('loadedmetadata', onLoadedMetadata);
          video.removeEventListener('canplay', onCanPlay);
          video.removeEventListener('loadeddata', onLoadedData);
          video.removeEventListener('error', onError);
        };

        video.addEventListener('loadedmetadata', onLoadedMetadata);
        video.addEventListener('canplay', onCanPlay);
        video.addEventListener('loadeddata', onLoadedData); // Additional iOS event
        video.addEventListener('error', onError);

        // Check if video is already ready (different readiness states for iOS)
        if (video.readyState >= (deviceInfo.isIOS ? 1 : 2)) { 
          console.log('📱 Video already ready, readyState:', video.readyState);
          onLoadedMetadata();
        }
      });

      setStream(mediaStream);
      setCameraActive(true);
      setIsLoading(false);
      console.log('🍎 Camera setup complete');
      
    } catch (error: any) {
      console.error('🍎 Camera startup error:', error);
      setIsLoading(false);
      setVideoReady(false);
      setCameraActive(false);
      
      // Clean up any existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      
      // Add iOS-specific error message enhancement
      if (deviceInfo.isIOS && error.message && !error.message.includes('iOS')) {
        error.message = `iOS Camera Error: ${error.message}`;
      }
      
      throw error;
    }
  };

  const stopCamera = () => {
    console.log('📱 Stopping camera...');
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('📱 Camera track stopped:', track.kind);
      });
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setCameraActive(false);
    setVideoReady(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && cameraActive && videoReady) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      console.log('📸 Capturing photo...');
      
      const videoWidth = video.videoWidth || 640;
      const videoHeight = video.videoHeight || 480;
      
      console.log('Video dimensions:', videoWidth, 'x', videoHeight);
      
      if (videoWidth === 0 || videoHeight === 0) {
        setCameraError('Camera not ready. Please wait for the video to fully load.');
        return;
      }
      
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, videoWidth, videoHeight);
        ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.85);
        console.log('📸 Photo captured, data length:', imageData.length);
        
        if (imageData && imageData.length > 1000) {
          setCapturedImage(imageData);
          stopCamera();
        } else {
          console.error('📸 Captured image appears to be invalid');
          setCameraError('Failed to capture image. Please try again.');
        }
      }
    } else {
      console.warn('📸 Cannot capture photo - camera not ready');
      setCameraError('Camera not ready. Please wait for the camera to fully load.');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      console.log('📁 File selected:', file.name, file.size);
      
      if (file.size > 10 * 1024 * 1024) {
        setCameraError('File is too large. Please select an image smaller than 10MB.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        if (imageData) {
          setCapturedImage(imageData);
          console.log('📁 File loaded successfully');
        }
      };
      reader.onerror = () => {
        console.error('📁 Error reading file');
        setCameraError('Failed to read the selected file. Please try again.');
      };
      reader.readAsDataURL(file);
    } else {
      setCameraError('Please select a valid image file.');
    }
    
    event.target.value = '';
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      console.log('✅ Confirming photo');
      onPhotoCapture(capturedImage);
      onClose();
    }
  };

  const retakePhoto = () => {
    console.log('🔄 Retaking photo');
    setCapturedImage(null);
    setCameraError(null);
    setPermissionRequested(false);
    setVideoReady(false);
    setCameraActive(false);
  };

  const handleClose = () => {
    console.log('❌ Closing photo capture');
    stopCamera();
    onClose();
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 PhotoCapture component unmounting');
      stopCamera();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 dark:bg-black dark:bg-opacity-85 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Capture Food Photo</h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-4">
          {!capturedImage ? (
            <div className="space-y-4">
              {/* Initial state - show options */}
              {!permissionRequested && !cameraActive && !isLoading && !cameraError && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-6 text-center">
                    <Smartphone className="h-12 w-12 text-blue-500 dark:text-blue-400 mx-auto mb-3" />
                    <p className="text-blue-700 dark:text-blue-300 font-medium mb-2">Choose your method</p>
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      {deviceInfo.isMobile 
                        ? 'For best results on mobile, we recommend uploading from your gallery'
                        : 'Take a photo or upload from your device'
                      }
                    </p>
                  </div>
                  
                  {deviceInfo.isMobile ? (
                    <>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full bg-emerald-500 text-white py-4 px-4 rounded-xl font-medium hover:bg-emerald-600 transition-colors duration-200 flex items-center justify-center space-x-2"
                      >
                        <Upload className="h-5 w-5" />
                        <span>{deviceInfo.isIOS ? 'Choose from Photos' : 'Upload from Gallery'}</span>
                      </button>
                      
                      <div className="text-center text-gray-500 dark:text-gray-400 text-sm">or</div>
                      
                      <button
                        onClick={requestCameraPermission}
                        className="w-full bg-blue-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center space-x-2"
                      >
                        <Camera className="h-5 w-5" />
                        <span>Use Camera</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={requestCameraPermission}
                        className="w-full bg-blue-500 text-white py-4 px-4 rounded-xl font-medium hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center space-x-2"
                      >
                        <Camera className="h-5 w-5" />
                        <span>Use Camera</span>
                      </button>
                      
                      <div className="text-center text-gray-500 dark:text-gray-400 text-sm">or</div>
                      
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full bg-emerald-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-emerald-600 transition-colors duration-200 flex items-center justify-center space-x-2"
                      >
                        <Upload className="h-5 w-5" />
                        <span>{deviceInfo.isIOS ? 'Choose from Photos' : 'Upload from Gallery'}</span>
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Video element - always present when camera might be used */}
              <div className={`space-y-4 ${(!permissionRequested && !cameraActive && !isLoading) ? 'hidden' : ''}`}>
                <div className={`relative bg-black rounded-xl overflow-hidden ${!videoReady ? 'hidden' : ''}`}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 border-2 border-white border-opacity-30 rounded-xl pointer-events-none"></div>
                  <div className="absolute bottom-2 left-2 bg-green-500 bg-opacity-90 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span>Camera Ready</span>
                  </div>
                </div>
                
                {videoReady && (
                  <div className="flex space-x-3">
                    <button
                      onClick={capturePhoto}
                      className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <Camera className="h-5 w-5" />
                      <span>Capture Photo</span>
                    </button>
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors duration-200"
                      title="Upload from gallery"
                    >
                      <Upload className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Camera error state */}
              {cameraError && (
                <div className="space-y-4">
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-red-600 dark:text-red-400 text-sm font-medium mb-1">Camera Issue</p>
                        <p className="text-red-600 dark:text-red-400 text-sm whitespace-pre-line">{cameraError}</p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-emerald-500 text-white py-4 px-4 rounded-xl font-medium hover:bg-emerald-600 transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <Upload className="h-5 w-5" />
                    <span>{deviceInfo.isIOS ? 'Choose from Photos' : 'Upload from Gallery'}</span>
                  </button>
                  
                  {!cameraError.includes('not supported') && 
                   !cameraError.includes('not found') && 
                   !cameraError.includes('HTTPS') && (
                    <>
                      <div className="text-center text-gray-500 dark:text-gray-400 text-sm">or</div>
                      <button
                        onClick={() => {
                          setCameraError(null);
                          setPermissionRequested(false);
                          setVideoReady(false);
                          setCameraActive(false);
                          requestCameraPermission();
                        }}
                        className="w-full bg-blue-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center space-x-2"
                      >
                        <Camera className="h-5 w-5" />
                        <span>Try Camera Again</span>
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Loading state */}
              {isLoading && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-8 text-center">
                    <div className="relative">
                      <Camera className="h-12 w-12 text-blue-400 dark:text-blue-300 mx-auto mb-3" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </div>
                    <p className="text-blue-600 dark:text-blue-300 font-medium">
                      {permissionRequested ? (deviceInfo.isIOS ? 'Starting iOS camera...' : 'Starting camera...') : 'Requesting camera access...'}
                    </p>
                    <p className="text-sm text-blue-500 dark:text-blue-400 mt-1">
                      {deviceInfo.isMobile 
                        ? (deviceInfo.isIOS ? 'Please allow camera access in Safari settings if prompted' : 'Please allow camera access when prompted')
                        : 'Initializing camera interface'
                      }
                    </p>
                  </div>
                  
                  <div className="text-center text-gray-500 dark:text-gray-400 text-sm">Taking too long?</div>
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-emerald-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-emerald-600 transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <Upload className="h-5 w-5" />
                    <span>{deviceInfo.isIOS ? 'Choose from Photos' : 'Upload from Gallery'}</span>
                  </button>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture={deviceInfo.isIOS ? undefined : "environment"}
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden">
                <img
                  src={capturedImage}
                  alt="Captured food"
                  className="w-full h-64 object-cover"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={confirmPhoto}
                  className="flex-1 bg-emerald-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-emerald-600 transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Check className="h-5 w-5" />
                  <span>Use This Photo</span>
                </button>
                
                <button
                  onClick={retakePhoto}
                  className="px-4 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
                >
                  Retake
                </button>
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default PhotoCapture;