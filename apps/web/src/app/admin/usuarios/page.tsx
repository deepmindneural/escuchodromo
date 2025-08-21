'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../lib/componentes/ui/table';
import { Input } from '../../../lib/componentes/ui/input';
import { Button } from '../../../lib/componentes/ui/button';
import { Badge } from '../../../lib/componentes/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../lib/componentes/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../../lib/componentes/ui/card';
import { Search, ChevronLeft, ChevronRight, User, Shield, ShieldCheck } from 'lucide-react';
import { Skeleton } from '../../../lib/componentes/ui/skeleton';

interface Usuario {
  id: string;
  email: string;
  nombre: string | null;
  rol: string;
  estaActivo: boolean;
  fechaRegistro: string;
  estadisticas: {
    conversaciones: number;
    evaluaciones: number;
    pagos: number;
  };
}

interface Paginacion {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [paginacion, setPaginacion] = useState<Paginacion | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [cargando, setCargando] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);

  useEffect(() => {
    cargarUsuarios();
  }, [paginaActual, busqueda, filtroRol, filtroEstado]);

  const cargarUsuarios = async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams({
        pagina: paginaActual.toString(),
        limite: '10',
      });

      if (busqueda) params.append('busqueda', busqueda);
      if (filtroRol) params.append('rol', filtroRol);
      if (filtroEstado) params.append('estado', filtroEstado);

      const response = await fetch(
        `http://localhost:3333/api/admin/usuarios?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUsuarios(data.usuarios);
        setPaginacion(data.paginacion);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setCargando(false);
    }
  };

  const cambiarRol = async (usuarioId: string, nuevoRol: string) => {
    try {
      const response = await fetch(
        `http://localhost:3333/api/admin/usuarios/${usuarioId}/rol`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ rol: nuevoRol }),
        }
      );

      if (response.ok) {
        cargarUsuarios();
      }
    } catch (error) {
      console.error('Error al cambiar rol:', error);
    }
  };

  const toggleEstado = async (usuarioId: string) => {
    try {
      const response = await fetch(
        `http://localhost:3333/api/admin/usuarios/${usuarioId}/toggle-estado`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.ok) {
        cargarUsuarios();
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  };

  const obtenerIconoRol = (rol: string) => {
    switch (rol) {
      case 'ADMIN':
        return <ShieldCheck className="h-4 w-4" />;
      case 'TERAPEUTA':
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <p className="text-muted-foreground">
          Administra los usuarios de la plataforma
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por email o nombre..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPaginaActual(1);
                }}
                className="pl-9"
              />
            </div>

            <Select
              value={filtroRol}
              onValueChange={(value) => {
                setFiltroRol(value);
                setPaginaActual(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los roles</SelectItem>
                <SelectItem value="USUARIO">Usuario</SelectItem>
                <SelectItem value="TERAPEUTA">Terapeuta</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filtroEstado}
              onValueChange={(value) => {
                setFiltroEstado(value);
                setPaginaActual(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los estados</SelectItem>
                <SelectItem value="activo">Activos</SelectItem>
                <SelectItem value="inactivo">Inactivos</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setBusqueda('');
                setFiltroRol('');
                setFiltroEstado('');
                setPaginaActual(1);
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de usuarios */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Estadísticas</TableHead>
                <TableHead>Fecha Registro</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cargando ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-12 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : usuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              ) : (
                usuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{usuario.email}</p>
                        {usuario.nombre && (
                          <p className="text-sm text-muted-foreground">
                            {usuario.nombre}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {obtenerIconoRol(usuario.rol)}
                        {usuario.rol}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={usuario.estaActivo ? 'success' : 'secondary'}
                      >
                        {usuario.estaActivo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <p>{usuario.estadisticas.conversaciones} conversaciones</p>
                        <p>{usuario.estadisticas.evaluaciones} evaluaciones</p>
                        <p>{usuario.estadisticas.pagos} pagos</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(usuario.fechaRegistro).toLocaleDateString('es-CO')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Select
                          value={usuario.rol}
                          onValueChange={(value) => cambiarRol(usuario.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USUARIO">Usuario</SelectItem>
                            <SelectItem value="TERAPEUTA">Terapeuta</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleEstado(usuario.id)}
                        >
                          {usuario.estaActivo ? 'Desactivar' : 'Activar'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Paginación */}
      {paginacion && paginacion.totalPaginas > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {(paginacion.pagina - 1) * paginacion.limite + 1} a{' '}
            {Math.min(paginacion.pagina * paginacion.limite, paginacion.total)} de{' '}
            {paginacion.total} usuarios
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaginaActual(paginaActual - 1)}
              disabled={paginaActual === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaginaActual(paginaActual + 1)}
              disabled={paginaActual === paginacion.totalPaginas}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}