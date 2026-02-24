/**
 * useSpeechToText — Reusable Speech-to-Text via Web Speech API (SpeechRecognition).
 * Client-side only; no audio stored or sent to backend. Transcript only.
 * Designed to be swappable with server-side STT (e.g. Groq Whisper) later.
 */
import { useState, useCallback, useRef, useEffect } from 'react';

const DEFAULT_LANGUAGE = 'en-IN';
const DEFAULT_CONTINUOUS = false;

/**
 * Safe browser detection for SpeechRecognition (Chrome, Edge, Safari; not Firefox).
 * @returns {typeof SpeechRecognition | typeof webkitSpeechRecognition | null}
 */
export function getSpeechRecognition() {
  if (typeof window === 'undefined') return null;
  const w = window;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

/**
 * @returns {boolean} True if the current environment supports SpeechRecognition.
 */
export function isSpeechRecognitionSupported() {
  return getSpeechRecognition() != null;
}

/** Map hook error code to user-facing message for toast/inline. */
export function getSpeechRecognitionErrorMessage(errorCode) {
  switch (errorCode) {
    case 'unsupported':
      return 'Voice input is not supported in this browser. Try Chrome or Edge.';
    case 'permission-denied':
      return 'Microphone access was denied. Allow mic in browser settings to use voice input.';
    case 'network':
      return 'Voice recognition needs network. Check your connection.';
    case 'no-speech':
      return 'No speech detected. Try again.';
    case 'aborted':
      return null;
    default:
      return 'Voice input failed. Try again.';
  }
}

/**
 * @param {object} [options]
 * @param {string} [options.language] - BCP-47 (default: 'en-IN')
 * @param {boolean} [options.continuous] - Keep listening until stopped (default: false)
 * @param {number} [options.maxAlternatives] - Max alternatives per result (default: 1)
 * @param {boolean} [options.interimResults] - Include interim results (default: false for cleaner transcript)
 * @param {(string) => void} [options.onResult] - Called with final transcript when a result is final (optional)
 */
export function useSpeechToText(options = {}) {
  const {
    language = DEFAULT_LANGUAGE,
    continuous = DEFAULT_CONTINUOUS,
    maxAlternatives = 1,
    interimResults = false,
    onResult,
  } = options;

  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const isMountedRef = useRef(true);

  const stopListening = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.abort();
      } catch (_) {
        try {
          rec.stop();
        } catch (_) {}
      }
      recognitionRef.current = null;
    }
    if (isMountedRef.current) {
      setListening(false);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  const startListening = useCallback(() => {
    setError(null);
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setError('unsupported');
      return;
    }

    // Avoid multiple instances
    if (recognitionRef.current) {
      stopListening();
    }

    const recognition = new Recognition();
    recognitionRef.current = recognition;

    recognition.continuous = continuous;
    recognition.lang = language;
    recognition.maxAlternatives = maxAlternatives;
    recognition.interimResults = interimResults;

    recognition.onstart = () => {
      if (isMountedRef.current) setListening(true);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (isMountedRef.current) setListening(false);
    };

    recognition.onerror = (event) => {
      if (!isMountedRef.current) return;
      const err = event.error;
      if (err === 'not-allowed' || err === 'service-not-allowed') {
        setError('permission-denied');
      } else if (err === 'network') {
        setError('network');
      } else if (err === 'no-speech') {
        setError('no-speech');
      } else if (err === 'aborted') {
        setError(null);
      } else {
        setError(err || 'error');
      }
      setListening(false);
      recognitionRef.current = null;
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? '';
        if (result.isFinal) {
          finalTranscript += text;
        } else {
          interimTranscript += text;
        }
      }
      const newText = (finalTranscript || interimTranscript).trim();
      if (!newText) return;
      if (isMountedRef.current) {
        setTranscript((prev) => {
          const next = prev ? `${prev} ${newText}`.trim() : newText;
          if (finalTranscript && onResult) {
            const full = prev ? `${prev} ${finalTranscript}`.trim() : finalTranscript.trim();
            onResult(full);
          }
          return next;
        });
      }
    };

    try {
      recognition.start();
    } catch (e) {
      if (isMountedRef.current) {
        setError('error');
        setListening(false);
      }
      recognitionRef.current = null;
    }
  }, [language, continuous, maxAlternatives, interimResults, onResult, stopListening]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopListening();
    };
  }, [stopListening]);

  return {
    transcript,
    listening,
    error,
    isSupported: isSpeechRecognitionSupported(),
    startListening,
    stopListening,
    resetTranscript,
  };
}

/*
 * BROWSER COMPATIBILITY
 * - Supported: Chrome, Edge, Safari (desktop and mobile). Uses webkitSpeechRecognition where needed.
 * - Not supported: Firefox (no SpeechRecognition). Use isSpeechRecognitionSupported() to hide or disable UI.
 *
 * LIMITATIONS (Web Speech API)
 * - Requires HTTPS (or localhost). Microphone permission required.
 * - Recognition quality and language support depend on the browser/OS.
 * - No offline guarantee; some browsers use cloud recognition.
 * - Silence or long pause may trigger onend; use continuous: true for long dictation.
 *
 * EXTENSIBILITY (server-side STT)
 * - To replace with Groq Whisper / Google Speech API / custom backend:
 *   1. Create an adapter that matches the same interface: startListening(), stopListening(),
 *      resetTranscript(), and state: transcript, listening, error, isSupported.
 *   2. In startListening, capture audio (e.g. MediaRecorder), send to your API, stream or
 *      receive transcript and set it via the same state setter or callback.
 *   3. Swap useSpeechToText for useSpeechToTextServer in the same components; no UI changes.
 */
export default useSpeechToText;
