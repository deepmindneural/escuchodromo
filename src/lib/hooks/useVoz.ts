import { useState, useRef, useCallback, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface OpcionesVoz {
  onTranscripcion?: (texto: string) => void;
  onEmocionDetectada?: (emociones: any) => void;
  onError?: (error: string) => void;
  idiomaReconocimiento?: string;
}

export function useVoz(opcionesIniciales?: OpcionesVoz) {
  const [estaGrabando, setEstaGrabando] = useState(false);
  const [transcripcion, setTranscripcion] = useState('');
  const [emocionesDetectadas, setEmocionesDetectadas] = useState<any>(null);
  const [estaConectado, setEstaConectado] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const chunksAudioRef = useRef<Blob[]>([]);

  // Inicializar Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
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

        const textoCompleto = transcripcionFinal || transcripcionInterina;
        setTranscripcion(textoCompleto);
        opcionesIniciales?.onTranscripcion?.(textoCompleto);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Error de reconocimiento:', event.error);
        opcionesIniciales?.onError?.(`Error de reconocimiento: ${event.error}`);
      };
    }
  }, [opcionesIniciales]);

  // Conectar al WebSocket de voz
  const conectarWebSocket = useCallback((conversacionId: string) => {
    const token = localStorage.getItem('token');
    
    socketRef.current = io('http://localhost:3333/voz', {
      auth: {
        token,
      },
    });

    socketRef.current.on('connect', () => {
      console.log('Conectado al servidor de voz');
      setEstaConectado(true);
      
      // Iniciar sesión de voz
      socketRef.current?.emit('iniciar-sesion-voz', { conversacionId });
    });

    socketRef.current.on('sesion-voz-iniciada', (data) => {
      console.log('Sesión de voz iniciada:', data);
    });

    socketRef.current.on('transcripcion-parcial', (data) => {
      setTranscripcion(data.texto);
    });

    socketRef.current.on('transcripcion-final', (data) => {
      setTranscripcion(data.transcripcion);
      if (data.analisisEmocional) {
        setEmocionesDetectadas(data.analisisEmocional);
        opcionesIniciales?.onEmocionDetectada?.(data.analisisEmocional);
      }
    });

    socketRef.current.on('respuesta-voz-generada', async (data) => {
      // Reproducir audio de respuesta
      await reproducirAudio(data.audioUrl);
    });

    socketRef.current.on('error', (data) => {
      console.error('Error del servidor:', data);
      opcionesIniciales?.onError?.(data.mensaje);
    });

    socketRef.current.on('disconnect', () => {
      setEstaConectado(false);
    });
  }, [opcionesIniciales]);

  // Iniciar grabación
  const iniciarGrabacion = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      chunksAudioRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksAudioRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksAudioRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        
        reader.onloadend = () => {
          const base64Audio = reader.result?.toString().split(',')[1];
          if (base64Audio && socketRef.current) {
            socketRef.current.emit('audio-chunk', {
              chunk: base64Audio,
              esFinal: true,
            });
          }
        };
        
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorderRef.current.start(100); // Grabar en chunks de 100ms
      
      // Iniciar reconocimiento de voz también
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      
      setEstaGrabando(true);
    } catch (error) {
      console.error('Error al iniciar grabación:', error);
      setEstaGrabando(false);
      opcionesIniciales?.onError?.(error instanceof Error ? error.message : 'Error al acceder al micrófono');
    }
  }, [opcionesIniciales]);

  // Detener grabación
  const detenerGrabacion = useCallback(() => {
    if (mediaRecorderRef.current && estaGrabando) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      
      setEstaGrabando(false);
    }
  }, [estaGrabando]);

  // Reproducir audio
  const reproducirAudio = useCallback(async (url: string) => {
    try {
      const audio = new Audio(url);
      await audio.play();
    } catch (error) {
      console.error('Error al reproducir audio:', error);
    }
  }, []);

  // Enviar texto para síntesis de voz
  const sintetizarVoz = useCallback((texto: string, emocionUsuario?: string) => {
    if (socketRef.current && estaConectado) {
      socketRef.current.emit('solicitar-respuesta-voz', {
        texto,
        emocionDetectada: emocionUsuario,
      });
    }
  }, [estaConectado]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (mediaRecorderRef.current && estaGrabando) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [estaGrabando]);

  return {
    estaGrabando,
    transcripcion,
    emocionesDetectadas,
    estaConectado,
    conectarWebSocket,
    iniciarGrabacion,
    detenerGrabacion,
    sintetizarVoz,
  };
}