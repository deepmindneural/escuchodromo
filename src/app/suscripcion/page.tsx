'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../lib/componentes/ui/card';
import { Boton } from '../../lib/componentes/ui/boton';
import { RadioGroup, RadioGroupItem } from '../../lib/componentes/ui/radio-group';
import { Label } from '../../lib/componentes/ui/label';
import { FaCheck, FaCreditCard, FaArrowLeft, FaSpinner, FaCrown, FaStar } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import Navegacion from '../../lib/componentes/layout/Navegacion';

interface Plan {
  id: string;
  nombre: string;
  precio: {
    COP: number;
    USD: number;
  };
  caracteristicas: string[];
  duracionDias: number;
}

export default function PaginaSuscripcion() {
  const router = useRouter();
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [planSeleccionado, setPlanSeleccionado] = useState<string>('');
  const [moneda, setMoneda] = useState<'COP' | 'USD'>('COP');
  const [proveedor, setProveedor] = useState<'stripe' | 'paypal'>('stripe');
  const [cargando, setCargando] = useState(false);
  const [suscripcionActiva, setSuscripcionActiva] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/iniciar-sesion');
      return;
    }

    cargarPlanes();
    verificarSuscripcion();
  }, [router]);

  const cargarPlanes = async () => {
    try {
      const response = await fetch('http://localhost:3333/api/pagos/planes');
      if (response.ok) {
        const data = await response.json();
        setPlanes(data);
        if (data.length > 0) {
          setPlanSeleccionado(data[1].id); // Seleccionar plan profesional por defecto
        }
      }
    } catch (error) {
      console.error('Error al cargar planes:', error);
    }
  };

  const verificarSuscripcion = async () => {
    try {
      const response = await fetch('http://localhost:3333/api/pagos/suscripcion/activa', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSuscripcionActiva(data);
      }
    } catch (error) {
      console.error('Error al verificar suscripción:', error);
    }
  };

  const iniciarPago = async () => {
    if (!planSeleccionado) {
      toast.error('Por favor selecciona un plan');
      return;
    }

    setCargando(true);

    try {
      const response = await fetch('http://localhost:3333/api/pagos/crear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          planId: planSeleccionado,
          proveedor,
          moneda,
        }),
      });

      if (response.ok) {
        const { pagoId, proveedorId, clientSecret, urlAprobacion } = await response.json();

        // Guardar información del pago
        sessionStorage.setItem('pagoEnProceso', JSON.stringify({
          pagoId,
          proveedorId,
          proveedor,
        }));

        // Redirigir según el proveedor
        if (proveedor === 'stripe') {
          // En producción, usar Stripe Checkout o Elements
          router.push(`/pago/stripe?payment_intent_client_secret=${clientSecret}`);
        } else if (proveedor === 'paypal' && urlAprobacion) {
          // Redirigir a PayPal
          window.location.href = urlAprobacion;
        }
      } else {
        throw new Error('Error al crear el pago');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('No se pudo iniciar el proceso de pago');
    } finally {
      setCargando(false);
    }
  };

  const formatearPrecio = (precio: number, moneda: string) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: moneda,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(precio);
  };

  if (suscripcionActiva) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <Link href="/dashboard">
            <Boton variante="fantasma" className="mb-4">
              <FaArrowLeft className="h-4 w-4 mr-2" />
              Volver al dashboard
            </Boton>
          </Link>

          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Suscripción Activa</CardTitle>
                <CardDescription>
                  Ya tienes una suscripción activa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Plan actual</p>
                    <p className="text-lg font-semibold">{suscripcionActiva.planNombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Válida hasta</p>
                    <p className="text-lg font-semibold">
                      {new Date(suscripcionActiva.fechaFin).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                  <div className="pt-4">
                    <Boton variante="contorno" className="w-full">
                      Gestionar suscripción
                    </Boton>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <Link href="/dashboard">
          <Boton variante="fantasma" className="mb-4">
            <FaArrowLeft className="h-4 w-4 mr-2" />
            Volver al dashboard
          </Boton>
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Elige tu plan</h1>
          <p className="text-xl text-muted-foreground">
            Invierte en tu bienestar emocional
          </p>
        </div>

        {/* Selector de moneda */}
        <div className="flex justify-center mb-8">
          <RadioGroup
            value={moneda}
            onValueChange={(value) => setMoneda(value as 'COP' | 'USD')}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="COP" id="cop" />
              <Label htmlFor="cop">COP (Pesos)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="USD" id="usd" />
              <Label htmlFor="usd">USD (Dólares)</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Planes */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-8">
          {planes.map((plan) => (
            <Card
              key={plan.id}
              className={`relative cursor-pointer transition-all ${
                planSeleccionado === plan.id
                  ? 'ring-2 ring-primary shadow-lg scale-105'
                  : 'hover:shadow-md'
              }`}
              onClick={() => setPlanSeleccionado(plan.id)}
            >
              {plan.id === 'profesional' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-white text-sm px-3 py-1 rounded-full">
                    Más popular
                  </span>
                </div>
              )}
              
              <CardHeader>
                <CardTitle>{plan.nombre}</CardTitle>
                <div className="mt-4">
                  <span className="text-3xl font-bold">
                    {formatearPrecio(plan.precio[moneda], moneda)}
                  </span>
                  <span className="text-muted-foreground">/mes</span>
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3">
                  {plan.caracteristicas.map((caracteristica, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <FaCheck className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{caracteristica}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                <Boton
                  variante={planSeleccionado === plan.id ? 'predeterminado' : 'contorno'}
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPlanSeleccionado(plan.id);
                  }}
                >
                  {planSeleccionado === plan.id ? 'Seleccionado' : 'Seleccionar'}
                </Boton>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Método de pago */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Método de pago</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={proveedor}
              onValueChange={(value) => setProveedor(value as 'stripe' | 'paypal')}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="stripe" id="stripe" />
                <Label htmlFor="stripe" className="flex items-center gap-2 cursor-pointer">
                  <FaCreditCard className="h-5 w-5" />
                  Tarjeta de crédito/débito
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="paypal" id="paypal" />
                <Label htmlFor="paypal" className="flex items-center gap-2 cursor-pointer">
                  <div className="text-blue-600 font-bold">PayPal</div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
          <CardFooter>
            <Boton
              onClick={iniciarPago}
              disabled={!planSeleccionado || cargando}
              className="w-full"
              tamano="lg"
            >
              {cargando ? (
                <>
                  <FaSpinner className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  Continuar al pago
                  <FaCreditCard className="h-4 w-4 ml-2" />
                </>
              )}
            </Boton>
          </CardFooter>
        </Card>

        {/* Información de seguridad */}
        <div className="max-w-2xl mx-auto mt-8 text-center text-sm text-muted-foreground">
          <p>🔒 Todos los pagos son procesados de forma segura</p>
          <p className="mt-2">
            Puedes cancelar tu suscripción en cualquier momento desde tu perfil
          </p>
        </div>
      </div>
    </div>
  );
}