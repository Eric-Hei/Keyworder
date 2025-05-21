import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';

type SpeechRecognitionProps = {
  onKeywordDetected: (keyword: string) => void;
  keywords?: string[];
};

export function useSpeechRecognition({ onKeywordDetected, keywords = [] }: SpeechRecognitionProps) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const keywordsRef = useRef<string[]>(keywords);

  useEffect(() => {
    keywordsRef.current = keywords;
  }, [keywords]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const SpeechRecognition = (window as any).SpeechRecognition || 
                               (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join(' ')
            .toLowerCase();

          keywordsRef.current.forEach(keyword => {
            if (transcript.includes(keyword.toLowerCase())) {
              onKeywordDetected(keyword);
            }
          });
        };

        recognitionRef.current.onerror = (event: any) => {
          setError(event.error);
          setIsListening(false);
        };

        setIsAvailable(true);
      } else {
        setError('Speech recognition not supported in this browser');
        setIsAvailable(false);
      }
    } else {
      setIsAvailable(true);
    }

    return () => {
      if (Platform.OS === 'web') {
        if (recognitionRef.current && typeof recognitionRef.current.stop === 'function') {
          try {
            recognitionRef.current.stop();
          } catch (err) {
            console.error('Error stopping recognition:', err);
          }
        }
      } else {
        clearInterval(recognitionRef.current);
      }
    };
  }, [onKeywordDetected]);

  const startListening = useCallback(() => {
    setError(null);
    
    if (Platform.OS === 'web' && recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Error starting recognition:', err);
        setError('Failed to start speech recognition');
      }
    } else {
      setIsListening(true);
      const interval = setInterval(() => {
        if (keywordsRef.current.length > 0) {
          const randomIndex = Math.floor(Math.random() * keywordsRef.current.length);
          onKeywordDetected(keywordsRef.current[randomIndex]);
        }
      }, 5000);

      recognitionRef.current = interval;
    }
  }, []);

  const stopListening = useCallback(() => {
    if (Platform.OS === 'web' && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Error stopping recognition:', err);
      }
    } else {
      clearInterval(recognitionRef.current);
    }
    setIsListening(false);
  }, []);

  const resetRecognition = useCallback((newKeywords: string[]) => {
    keywordsRef.current = newKeywords;
  }, []);

  return {
    isListening,
    startListening,
    stopListening,
    error,
    isAvailable,
    resetRecognition
  };
}