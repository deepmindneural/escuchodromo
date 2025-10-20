/**
 * Mocks de Supabase para testing
 *
 * Simula el cliente de Supabase con métodos para testing
 * Permite control completo sobre respuestas y errores
 */

import { profesionalesMock } from '../fixtures/profesionales';
import { horariosProfesional1Mock } from '../fixtures/horarios';
import { citasMock } from '../fixtures/citas';

// Mock completo del cliente de Supabase
export const crearMockSupabase = (overrides?: any) => {
  const defaultMock = {
    from: jest.fn((tabla: string) => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      then: jest.fn((callback) => callback({ data: [], error: null })),
    })),
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'mock-access-token-test',
            user: {
              id: 'auth-123-uuid-test-1',
              email: 'usuario@test.escuchodromo.com',
            },
          },
        },
        error: null,
      }),
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: {
            id: 'auth-123-uuid-test-1',
            email: 'usuario@test.escuchodromo.com',
          },
        },
        error: null,
      }),
    },
    functions: {
      invoke: jest.fn().mockResolvedValue({
        data: { success: true },
        error: null,
      }),
    },
    rpc: jest.fn().mockResolvedValue({
      data: true,
      error: null,
    }),
  };

  return {
    ...defaultMock,
    ...overrides,
  };
};

// Mock de respuesta exitosa de profesionales
export const mockRespuestaProfesionales = () => ({
  data: profesionalesMock.filter(
    (p) =>
      p.PerfilProfesional[0].perfil_aprobado &&
      p.PerfilProfesional[0].documentos_verificados &&
      p.esta_activo
  ),
  error: null,
});

// Mock de respuesta exitosa de horarios
export const mockRespuestaHorarios = () => ({
  data: horariosProfesional1Mock,
  error: null,
});

// Mock de respuesta exitosa de citas
export const mockRespuestaCitas = () => ({
  data: citasMock,
  error: null,
});

// Mock de error de Supabase
export const mockErrorSupabase = (mensaje: string = 'Error de base de datos') => ({
  data: null,
  error: {
    message: mensaje,
    details: 'Detalles del error de prueba',
    hint: 'Sugerencia de error de prueba',
    code: 'TEST_ERROR',
  },
});

// Mock de sesión no autenticada
export const mockSinSesion = () => ({
  data: {
    session: null,
  },
  error: {
    message: 'No autenticado',
    code: 'NO_AUTH',
  },
});

// Mock de usuario autenticado
export const mockUsuarioAutenticado = (usuarioId = 'usuario-123-uuid-test') => ({
  data: {
    user: {
      id: `auth-${usuarioId}`,
      email: `${usuarioId}@test.escuchodromo.com`,
      rol: 'USUARIO',
    },
  },
  error: null,
});

// Mock de fetch global para Edge Functions
export const mockFetchEdgeFunction = (responseData: any, status: number = 200) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(responseData),
      text: () => Promise.resolve(JSON.stringify(responseData)),
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
    } as Response)
  ) as jest.Mock;
};

// Limpiar mocks de fetch
export const limpiarMockFetch = () => {
  if (typeof global.fetch !== 'undefined' && jest.isMockFunction(global.fetch)) {
    (global.fetch as jest.Mock).mockClear();
  }
};

// Mock de toast (react-hot-toast)
export const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  loading: jest.fn(),
  custom: jest.fn(),
};

// Mock de useRouter (Next.js)
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
};

// Mock de useParams (Next.js)
export const mockParams = (params: Record<string, string> = {}) => ({
  ...params,
});

// Helper para simular delay en requests
export const mockDelayedResponse = (data: any, delay: number = 100) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data, error: null });
    }, delay);
  });
};

// Helper para simular error después de delay
export const mockDelayedError = (mensaje: string, delay: number = 100) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockErrorSupabase(mensaje));
    }, delay);
  });
};
