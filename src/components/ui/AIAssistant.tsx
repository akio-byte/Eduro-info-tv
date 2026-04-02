import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Loader2, Check, X, ChevronDown } from 'lucide-react';
import { Button } from './Button';
import { useAiAction, AiActionType, AiRequestOptions } from '../../hooks/useAiAction';

interface AIAssistantProps {
  currentText: string;
  onAccept: (newText: string) => void;
  className?: string;
}

type MenuState = 'CLOSED' | 'MENU' | 'LOADING' | 'RESULT' | 'ERROR';

export function AIAssistant({ currentText, onAccept, className = '' }: AIAssistantProps) {
  const [menuState, setMenuState] = useState<MenuState>('CLOSED');
  const [resultText, setResultText] = useState<string>('');
  const { generateContent, isLoading, error, clearError } = useAiAction();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        if (menuState === 'MENU') {
          setMenuState('CLOSED');
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuState]);

  // Handle errors from the hook
  useEffect(() => {
    if (error) {
      setMenuState('ERROR');
    }
  }, [error]);

  const handleAction = async (action: AiActionType, options?: AiRequestOptions) => {
    if (!currentText.trim()) {
      alert('Kirjoita ensin tekstiä, jota haluat muokata.');
      setMenuState('CLOSED');
      return;
    }

    setMenuState('LOADING');
    const result = await generateContent(action, currentText, options);
    
    if (result && typeof result === 'string') {
      setResultText(result);
      setMenuState('RESULT');
    } else if (result && Array.isArray(result)) {
      // Fallback if we accidentally get an array (e.g. from SUGGEST_TITLES which is not implemented in this UI yet)
      setResultText(result[0]);
      setMenuState('RESULT');
    }
  };

  const handleAccept = () => {
    onAccept(resultText);
    setMenuState('CLOSED');
    setResultText('');
  };

  const handleCancel = () => {
    setMenuState('CLOSED');
    setResultText('');
    clearError();
  };

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      {/* Trigger Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 px-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
        onClick={() => setMenuState(menuState === 'CLOSED' ? 'MENU' : 'CLOSED')}
        disabled={isLoading}
      >
        <Sparkles className="h-4 w-4 mr-1" />
        AI Apuri
        <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
      </Button>

      {/* Popover Menu */}
      {menuState !== 'CLOSED' && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-md shadow-lg border border-slate-200 z-50 overflow-hidden">
          
          {/* State: MENU */}
          {menuState === 'MENU' && (
            <div className="p-2 space-y-1">
              <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Muokkaa tekstiä
              </div>
              <button
                type="button"
                className="w-full text-left px-2 py-2 text-sm rounded hover:bg-slate-100 transition-colors"
                onClick={() => handleAction('SUMMARIZE')}
              >
                Tiivistä infonäytölle (max 3 lausetta)
              </button>
              
              <div className="border-t border-slate-100 my-1"></div>
              <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Muuta sävyä
              </div>
              <button
                type="button"
                className="w-full text-left px-2 py-2 text-sm rounded hover:bg-slate-100 transition-colors"
                onClick={() => handleAction('REWRITE_TONE', { tone: 'clear' })}
              >
                Selkeä ja ymmärrettävä
              </button>
              <button
                type="button"
                className="w-full text-left px-2 py-2 text-sm rounded hover:bg-slate-100 transition-colors"
                onClick={() => handleAction('REWRITE_TONE', { tone: 'official' })}
              >
                Virallinen ja asiallinen
              </button>
              <button
                type="button"
                className="w-full text-left px-2 py-2 text-sm rounded hover:bg-slate-100 transition-colors"
                onClick={() => handleAction('REWRITE_TONE', { tone: 'inspiring' })}
              >
                Innostava ja positiivinen
              </button>

              <div className="border-t border-slate-100 my-1"></div>
              <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pakota pituus
              </div>
              <button
                type="button"
                className="w-full text-left px-2 py-2 text-sm rounded hover:bg-slate-100 transition-colors"
                onClick={() => handleAction('SHORTEN', { lines: 2 })}
              >
                Lyhennä noin 2 riviin
              </button>
            </div>
          )}

          {/* State: LOADING */}
          {menuState === 'LOADING' && (
            <div className="p-6 flex flex-col items-center justify-center text-slate-500 space-y-3">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              <span className="text-sm">Tekoäly miettii...</span>
            </div>
          )}

          {/* State: ERROR */}
          {menuState === 'ERROR' && (
            <div className="p-4 space-y-3">
              <div className="text-sm text-red-600 font-medium">Virhe tapahtui</div>
              <div className="text-xs text-slate-600 bg-red-50 p-2 rounded border border-red-100">
                {error || 'Tuntematon virhe.'}
              </div>
              <Button type="button" variant="outline" size="sm" className="w-full" onClick={handleCancel}>
                Sulje
              </Button>
            </div>
          )}

          {/* State: RESULT */}
          {menuState === 'RESULT' && (
            <div className="p-4 space-y-3">
              <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider flex items-center">
                <Sparkles className="h-3 w-3 mr-1" /> Ehdotus
              </div>
              <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded border border-slate-200 max-h-48 overflow-y-auto whitespace-pre-wrap">
                {resultText}
              </div>
              <div className="flex space-x-2 pt-2">
                <Button type="button" variant="outline" size="sm" className="flex-1" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-1" /> Hylkää
                </Button>
                <Button type="button" size="sm" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleAccept}>
                  <Check className="h-4 w-4 mr-1" /> Korvaa
                </Button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
