import React, { useEffect, useState } from 'react';
import { Language } from '../types';
import { getTranslation } from '../utils/translations';

interface ApiKeySelectorProps {
  onKeySelected: () => void;
  lang: Language;
}

const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected, lang }) => {
  const [loading, setLoading] = useState(true);
  const [hasKey, setHasKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const t = getTranslation(lang).apiKey;

  useEffect(() => {
    checkKey();
  }, []);

  const checkKey = async () => {
    try {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        if (selected) {
          setHasKey(true);
          onKeySelected();
        }
      }
    } catch (e) {
      console.error("Error checking API key", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectKey = async () => {
    setError(null);
    try {
      if (window.aistudio && window.aistudio.openSelectKey) {
        await window.aistudio.openSelectKey();
        // Assuming success if promise resolves, as per instructions to not wait/race
        setHasKey(true);
        onKeySelected();
      } else {
        setError(t.errorEnv);
      }
    } catch (e: any) {
      if (e.message && e.message.includes("Requested entity was not found")) {
         setError(t.errorFail);
         setHasKey(false);
      } else {
         setError(t.errorGeneric);
      }
    }
  };

  if (loading) return null; // Or a small spinner
  if (hasKey) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center border-2 border-orange-100">
        <div className="mb-6 flex justify-center">
           <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-3xl">
             🍌
           </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4 font-hand">{t.title}</h2>
        <p className="text-gray-600 mb-6">
          {t.description} <span className="font-semibold text-orange-600">{t.modelName}</span> {t.descriptionSuffix}
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        <button
          onClick={handleSelectKey}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.536 9.636a1.038 1.038 0 111.414-1.414L15.464 7.243A2 2 0 0118 10M5 21h8a2 2 0 002-2v-5a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2z" />
          </svg>
          {t.button}
        </button>
        
        <div className="mt-6 text-xs text-gray-400">
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-orange-500">
            {t.billing}
          </a>
        </div>
      </div>
    </div>
  );
};

export default ApiKeySelector;
