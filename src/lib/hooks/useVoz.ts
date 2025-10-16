import { useState, useRef, useCallback, useEffect } from 'react';

interface OpcionesVoz {
  onTranscripcion?: (texto: string) => void;
  onTranscripcionFinal?: (texto: string) => void;
  onError?: (error: string) => void;
  idiomaReconocimiento?: string;
}

/**
 * Hook para reconocimiento y síntesis de voz usando Web Speech API
 * 100% GRATIS - Funciona en Chrome, Edge, Safari
 */
export function useVoz(opcionesIniciales?: OpcionesVoz) {
  const [estaGrabando, setEstaGrabando] = useState(false);
  const [transcripcion, setTranscripcion] = useState('');
  const [estaHablando, setEstaHablando] = useState(false);
  const [soportaReconocimiento, setSoportaReconocimiento] = useState(false);
  const [soportaSintesis, setSoportaSintesis] = useState(false);

  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  // Verificar soporte del navegador
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Verificar Speech Recognition
    const tieneReconocimiento =
      'SpeechRecognition' in window ||
      'webkitSpeechRecognition' in window;
    setSoportaReconocimiento(tieneReconocimiento);

    // Verificar Speech Synthesis
    const tieneSintesis = 'speechSynthesis' in window;
    setSoportaSintesis(tieneSintesis);

    if (tieneSintesis) {
      synthesisRef.current = window.speechSynthesis;
    }
  }, []);

  // Inicializar Web Speech Recognition
  useEffect(() => {
    if (typeof window === 'undefined' || !soportaReconocimiento) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    recognitionRef.current = new SpeechRecognition();

    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = opcionesIniciales?.idiomaReconocimiento || 'es-ES';

    recognitionRef.current.onresult = (event: any) => {
      let transcripcionFinal = '';
      let transcripcionInterina = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const resultado = event.results[i];
        if (resultado.isFinal) {
          transcripcionFinal += resultado[0].transcript + ' ';
        } else {
          transcripcionInterina += resultado[0].transcript;
        }
      }

      if (transcripcionFinal) {
        setTranscripcion(transcripcionFinal.trim());
        opcionesIniciales?.onTranscripcionFinal?.(transcripcionFinal.trim());
      } else {
        setTranscripcion(transcripcionInterina);
        opcionesIniciales?.onTranscripcion?.(transcripcionInterina);
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Error de reconocimiento:', event.error);

      if (event.error === 'no-speech') {
        opcionesIniciales?.onError?.('No se detectó voz. Intenta de nuevo.');
      } else if (event.error === 'not-allowed') {
        opcionesIniciales?.onError?.('Permiso de micrófono denegado. Habilítalo en la configuración del navegador.');
      } else {
        opcionesIniciales?.onError?.(`Error de reconocimiento: ${event.error}`);
      }

      setEstaGrabando(false);
    };

    recognitionRef.current.onend = () => {
      setEstaGrabando(false);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [soportaReconocimiento, opcionesIniciales]);

  // Iniciar grabación
  const iniciarGrabacion = useCallback(() => {
    if (!soportaReconocimiento) {
      opcionesIniciales?.onError?.(
        'Tu navegador no soporta reconocimiento de voz. Usa Chrome, Edge o Safari.'
      );
      return;
    }

    if (!recognitionRef.current) {
      opcionesIniciales?.onError?.('Reconocimiento de voz no inicializado.');
      return;
    }

    try {
      setTranscripcion('');
      recognitionRef.current.start();
      setEstaGrabando(true);
    } catch (error) {
      console.error('Error al iniciar grabación:', error);
      opcionesIniciales?.onError?.(
        error instanceof Error ? error.message : 'Error al iniciar grabación'
      );
    }
  }, [soportaReconocimiento, opcionesIniciales]);

  // Detener grabación
  const detenerGrabacion = useCallback(() => {
    if (recognitionRef.current && estaGrabando) {
      try {
        recognitionRef.current.stop();
        setEstaGrabando(false);
      } catch (error) {
        console.error('Error al detener grabación:', error);
      }
    }
  }, [estaGrabando]);

  // Sintetizar voz (Text-to-Speech)
  const hablar = useCallback((texto: string, opciones?: {
    velocidad?: number;
    tono?: number;
    volumen?: number;
    vozPreferida?: string;
  }) => {
    if (!soportaSintesis || !synthesisRef.current) {
      opcionesIniciales?.onError?.(
        'Tu navegador no soporta síntesis de voz.'
      );
      return;
    }

    // Cancelar cualquier síntesis en curso
    synthesisRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(texto);

    // Configurar idioma español
    utterance.lang = 'es-ES';

    // Configurar opciones
    utterance.rate = opciones?.velocidad || 1.0;  // 0.1 a 10
    utterance.pitch = opciones?.tono || 1.0;      // 0 a 2
    utterance.volume = opciones?.volumen || 1.0;  // 0 a 1

    // Intentar usar voz española si está disponible
    const voces = synthesisRef.current.getVoices();
    const vozEspanola = voces.find(voz =>
      voz.lang.startsWith('es') && voz.name.includes(opciones?.vozPreferida || 'Google')
    ) || voces.find(voz => voz.lang.startsWith('es'));

    if (vozEspanola) {
      utterance.voice = vozEspanola;
    }

    utterance.onstart = () => {
      setEstaHablando(true);
    };

    utterance.onend = () => {
      setEstaHablando(false);
    };

    utterance.onerror = (event) => {
      console.error('Error en síntesis de voz:', event);
      setEstaHablando(false);
      opcionesIniciales?.onError?.('Error al reproducir voz');
    };

    setEstaHablando(true);
    synthesisRef.current.speak(utterance);
  }, [soportaSintesis, opcionesIniciales]);

  // Detener síntesis de voz
  const detenerHabla = useCallback(() => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setEstaHablando(false);
    }
  }, []);

  // Obtener voces disponibles
  const obtenerVoces = useCallback(() => {
    if (!synthesisRef.current) return [];
    return synthesisRef.current.getVoices();
  }, []);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (recognitionRef.current && estaGrabando) {
        recognitionRef.current.stop();
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, [estaGrabando]);

  return {
    // Estados
    estaGrabando,
    transcripcion,
    estaHablando,
    soportaReconocimiento,
    soportaSintesis,

    // Métodos
    iniciarGrabacion,
    detenerGrabacion,
    hablar,
    detenerHabla,
    obtenerVoces,
  };
}
