'use client';

import { useState, useEffect } from 'react';
import { FaMicrophone, FaMicrophoneSlash, FaVolumeUp, FaSpinner } from 'react-icons/fa';
import { Boton } from '../ui/boton';
import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';
import { useVoz } from '../../hooks/useVoz';
import { cn } from '../../utilidades';

interface ChatVozProps {
  conversacionId: string;
  onMensajeEnviado?: (mensaje: string, emociones?: any) => void;
}

export function ChatVoz({ conversacionId, onMensajeEnviado }: ChatVozProps) {
  const [volumen, setVolumen] = useState(0);
  const [estadoAnimo, setEstadoAnimo] = useState<string | null>(null);
  
  const {
    estaGrabando,
    transcripcion,
    emocionesDetectadas,
    estaConectado,
    conectarWebSocket,
    iniciarGrabacion,
    detenerGrabacion,
    sintetizarVoz,
  } = useVoz({
    onTranscripcion: (texto) => {
      console.log('Transcripción:', texto);
    },
    onEmocionDetectada: (emociones) => {
      console.log('Emociones detectadas:', emociones);
      // Determinar emoción dominante
      const emocionDominante = Object.entries(emociones.emociones)
        .sort(([, a], [, b]) => (b as number) - (a as number))[0][0];
      setEstadoAnimo(emocionDominante);
    },
    onError: (error) => {
      // Solo mostrar error si el usuario intentó grabar
      if (estaGrabando) {
        console.error('Error de voz:', error);
        // Mostrar notificación al usuario
        alert('Error al acceder al micrófono. Por favor, verifica los permisos del navegador.');
      }
    },
  });

  useEffect(() => {
    conectarWebSocket(conversacionId);
  }, [conversacionId, conectarWebSocket]);

  // Monitorear volumen del micrófono
  useEffect(() => {
    if (!estaGrabando) return;

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      microphone.connect(analyser);
      analyser.fftSize = 256;

      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setVolumen(volume);
        
        if (estaGrabando) {
          requestAnimationFrame(checkVolume);
        }
      };

      checkVolume();

      return () => {
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
      };
    });
  }, [estaGrabando]);

  const manejarGrabacion = async () => {
    if (estaGrabando) {
      detenerGrabacion();
      if (transcripcion && onMensajeEnviado) {
        onMensajeEnviado(transcripcion, emocionesDetectadas);
      }
    } else {
      await iniciarGrabacion();
    }
  };

  const obtenerColorEmocion = (emocion: string | null) => {
    const colores: Record<string, string> = {
      alegria: 'bg-yellow-500',
      tristeza: 'bg-blue-500',
      ansiedad: 'bg-purple-500',
      ira: 'bg-red-500',
      miedo: 'bg-orange-500',
      calma: 'bg-green-500',
    };
    return colores[emocion || ''] || 'bg-gray-500';
  };

  return (
    <div className="space-y-4">
      {/* Indicador de conexión */}
      <div className="flex items-center gap-2 text-sm">
        <div className={cn(
          "w-2 h-2 rounded-full",
          estaConectado ? "bg-green-500" : "bg-red-500"
        )} />
        <span className="text-muted-foreground">
          {estaConectado ? 'Conectado' : 'Desconectado'}
        </span>
      </div>

      {/* Área de grabación */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            {/* Botón de grabación */}
            <Boton
              tamano="xl"
              variante={estaGrabando ? "destructivo" : "predeterminado"}
              className={cn(
                "relative h-20 w-20 rounded-full transition-all",
                estaGrabando && "animate-pulse"
              )}
              onClick={manejarGrabacion}
            >
              {estaGrabando ? (
                <FaMicrophoneSlash className="h-8 w-8" />
              ) : (
                <FaMicrophone className="h-8 w-8" />
              )}
            </Boton>

            {/* Indicador de volumen */}
            {estaGrabando && (
              <div className="w-full max-w-xs space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <FaVolumeUp className="h-4 w-4" />
                  <span className="text-muted-foreground">Nivel de audio</span>
                </div>
                <Progress value={volumen} max={100} className="h-2" />
              </div>
            )}

            {/* Transcripción en tiempo real */}
            {transcripcion && (
              <div className="w-full max-w-md">
                <p className="text-center text-sm text-muted-foreground mb-2">
                  Transcripción:
                </p>
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <p className="text-sm">{transcripcion}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Estado emocional detectado */}
            {estadoAnimo && (
              <div className="flex items-center gap-2">
                <div className={cn(
                  "h-3 w-3 rounded-full",
                  obtenerColorEmocion(estadoAnimo)
                )} />
                <span className="text-sm text-muted-foreground">
                  Estado emocional: {estadoAnimo}
                </span>
              </div>
            )}

            {/* Instrucciones */}
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {estaGrabando
                ? 'Habla claramente. Toca el botón para detener.'
                : 'Toca el micrófono para empezar a hablar'}
            </p>
          </div>
        </CardContent>

        {/* Efecto visual de grabación */}
        {estaGrabando && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent animate-pulse" />
          </div>
        )}
      </Card>

      {/* Análisis emocional detallado */}
      {emocionesDetectadas && (
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm font-medium mb-3">Análisis emocional</h4>
            <div className="space-y-2">
              {Object.entries(emocionesDetectadas.emociones).map(([emocion, valor]) => (
                <div key={emocion} className="flex items-center gap-2">
                  <span className="text-sm capitalize w-20">{emocion}:</span>
                  <Progress 
                    value={(valor as number) * 100} 
                    className="flex-1 h-2"
                  />
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {((valor as number) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}