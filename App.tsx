import React, { useState, useRef } from 'react';
import { extractFramesFromVideo, formatTime } from './utils/videoUtils';
import { generateSketchFromFrame } from './services/geminiService';
import { TutorialStep, Language } from './types';
import { getTranslation } from './utils/translations';
import ApiKeySelector from './components/ApiKeySelector';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [isKeyReady, setIsKeyReady] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = getTranslation(lang);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('video/')) {
      setError(t.errorVideo);
      return;
    }

    setFile(selectedFile);
    setError(null);
    setSteps([]);
    processVideo(selectedFile);
  };

  const processVideo = async (videoFile: File) => {
    setIsExtracting(true);
    try {
      // Extract 6 representative frames
      const { frames } = await extractFramesFromVideo(videoFile, 6);
      
      const newSteps: TutorialStep[] = frames.map((frame, index) => ({
        id: `step-${index}`,
        originalFrame: frame.data,
        sketchedImage: null,
        timestamp: frame.timestamp,
        status: 'pending',
      }));

      setSteps(newSteps);
      setIsExtracting(false);
      generateSketches(newSteps);
    } catch (err) {
      console.error(err);
      setError(t.errorExtract);
      setIsExtracting(false);
    }
  };

  const generateSketches = async (currentSteps: TutorialStep[]) => {
    setIsGenerating(true);

    // Process sequentially to avoid rate limits and allow user to see progress
    for (let i = 0; i < currentSteps.length; i++) {
      const step = currentSteps[i];
      
      // Update status to processing
      setSteps(prev => prev.map(s => s.id === step.id ? { ...s, status: 'processing' } : s));

      try {
        const sketch = await generateSketchFromFrame(step.originalFrame);
        
        setSteps(prev => prev.map(s => s.id === step.id ? { 
          ...s, 
          sketchedImage: sketch, 
          status: 'completed' 
        } : s));
      } catch (err) {
        console.error(`Failed to generate sketch for step ${i}`, err);
        setSteps(prev => prev.map(s => s.id === step.id ? { ...s, status: 'failed' } : s));
      }
    }
    setIsGenerating(false);
  };

  const reset = () => {
    setFile(null);
    setSteps([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleLang = () => {
    setLang(l => l === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="min-h-screen font-sans text-gray-800">
      <ApiKeySelector onKeySelected={() => setIsKeyReady(true)} lang={lang} />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 bg-opacity-90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🍌</span>
            <h1 className="text-2xl font-bold tracking-tight font-hand text-gray-900">
              {t.appTitle} <span className="text-orange-500">{t.appTitleSuffix}</span>
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden sm:block text-sm font-medium text-gray-500">
              {t.poweredBy}
            </div>
            <button 
              onClick={toggleLang}
              className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-sm font-bold text-gray-600 transition-colors"
            >
              {lang === 'en' ? '中文' : 'English'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Intro / Upload Section */}
        {!steps.length && !isExtracting && (
          <div className="max-w-xl mx-auto text-center mt-10">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
              {t.heroTitle} <span className="text-orange-500 italic font-hand">{t.heroTitleHighlight}</span> {t.heroTitleSuffix}
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              {t.heroSubtitle}
            </p>

            <div 
              className={`relative border-2 border-dashed rounded-2xl p-12 transition-all ${
                isKeyReady 
                  ? "border-gray-300 hover:border-orange-500 hover:bg-orange-50 cursor-pointer" 
                  : "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
              }`}
              onClick={() => isKeyReady && fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                accept="video/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={!isKeyReady}
              />
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-700">
                    {isKeyReady ? t.uploadReady : t.uploadConnect}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{t.uploadHint}</p>
                </div>
              </div>
            </div>
            {error && (
              <p className="mt-4 text-red-600 bg-red-50 py-2 px-4 rounded-lg inline-block">{error}</p>
            )}
          </div>
        )}

        {/* Processing / Result Section */}
        {(steps.length > 0 || isExtracting) && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 font-hand">{t.stepsTitle}</h2>
                <p className="text-gray-500 text-sm">
                  {isExtracting ? t.statusExtracting : isGenerating ? t.statusGenerating : t.statusComplete}
                </p>
              </div>
              <button 
                onClick={reset}
                className="text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
                disabled={isGenerating}
              >
                {t.startOver}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <div key={step.id} className="group relative bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                  {/* Card Header (Step Number) */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="bg-gray-900 text-white font-hand font-bold text-xl w-10 h-10 flex items-center justify-center rounded-full shadow-lg border-2 border-white">
                      {index + 1}
                    </span>
                  </div>

                  {/* Main Image Area */}
                  <div className="relative aspect-video bg-gray-100">
                    {step.status === 'completed' && step.sketchedImage ? (
                      <img 
                        src={step.sketchedImage} 
                        alt={`Step ${index + 1} sketch`} 
                        className="w-full h-full object-cover mix-blend-multiply"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        {step.status === 'failed' ? (
                          <div className="text-red-400 flex flex-col items-center">
                            <span className="text-2xl mb-2">⚠️</span>
                            <span className="text-sm">{t.statusFailed}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center animate-pulse">
                             <div className="w-12 h-12 border-4 border-gray-300 border-t-orange-500 rounded-full animate-spin mb-4"></div>
                             <span className="text-sm font-medium text-gray-500 font-hand text-lg">
                               {step.status === 'processing' ? t.statusProcessing : t.statusWaiting}
                             </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Reference Image (Small inset) */}
                  <div className="absolute bottom-4 right-4 w-24 h-auto aspect-video rounded-lg overflow-hidden border-2 border-white shadow-md group-hover:scale-150 group-hover:-translate-y-4 group-hover:shadow-xl transition-all origin-bottom-right z-20 bg-black">
                     <img 
                      src={step.originalFrame} 
                      alt="Reference" 
                      className="w-full h-full object-cover opacity-80 hover:opacity-100"
                    />
                  </div>

                  {/* Timestamp Badge */}
                  <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {formatTime(step.timestamp)}
                    </div>
                    {step.status === 'completed' && (
                       <button 
                         onClick={() => {
                           const link = document.createElement('a');
                           link.href = step.sketchedImage || '';
                           link.download = `sketch_step_${index+1}.png`;
                           link.click();
                         }}
                         className="text-orange-600 hover:text-orange-700 text-xs font-bold uppercase tracking-wide"
                       >
                         {t.download}
                       </button>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Skeleton Cards while extracting */}
              {isExtracting && Array.from({ length: 3 }).map((_, i) => (
                <div key={`skel-${i}`} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-64 animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="h-16 bg-gray-100 p-4">
                    <div className="h-4 w-20 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom Actions if completed */}
      {!isGenerating && !isExtracting && steps.some(s => s.status === 'completed') && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40">
           <div className="max-w-7xl mx-auto flex justify-between items-center">
             <div className="text-gray-600 text-sm">
               {t.saveHint}
             </div>
             <button
               onClick={() => alert(t.printAlert)}
               className="bg-gray-900 text-white hover:bg-gray-800 font-bold py-2 px-6 rounded-lg shadow-md transition-transform active:scale-95"
             >
               {t.print}
             </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
