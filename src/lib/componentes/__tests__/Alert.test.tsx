import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Alert, useAlert } from '../ui/alert';

// Mock de framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('Alert Component', () => {
  const defaultProps = {
    tipo: 'info' as const,
    mensaje: 'Test message',
    mostrar: true,
    onCerrar: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería renderizar la alerta cuando mostrar es true', () => {
    render(<Alert {...defaultProps} />);
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('no debería renderizar cuando mostrar es false', () => {
    render(<Alert {...defaultProps} mostrar={false} />);
    
    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });

  it('debería mostrar el título cuando se proporciona', () => {
    render(<Alert {...defaultProps} titulo="Test Title" />);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('debería llamar onCerrar cuando se hace click en el botón cerrar', () => {
    const onCerrar = jest.fn();
    render(<Alert {...defaultProps} onCerrar={onCerrar} />);
    
    const botonCerrar = screen.getByRole('button');
    fireEvent.click(botonCerrar);
    
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it('debería aplicar las clases correctas para diferentes tipos', () => {
    const { rerender } = render(<Alert {...defaultProps} tipo="exito" />);
    let container = screen.getByText('Test message').closest('div');
    expect(container).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800');

    rerender(<Alert {...defaultProps} tipo="error" />);
    container = screen.getByText('Test message').closest('div');
    expect(container).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800');

    rerender(<Alert {...defaultProps} tipo="advertencia" />);
    container = screen.getByText('Test message').closest('div');
    expect(container).toHaveClass('bg-yellow-50', 'border-yellow-200', 'text-yellow-800');
  });

  it('debería cerrarse automáticamente después de la duración especificada', async () => {
    const onCerrar = jest.fn();
    render(<Alert {...defaultProps} onCerrar={onCerrar} duracion={1} />);
    
    // Esperar que se cierre automáticamente
    await waitFor(() => {
      expect(onCerrar).toHaveBeenCalledTimes(1);
    }, { timeout: 1500 });
  });
});

describe('useAlert Hook', () => {
  const TestComponent = () => {
    const { alerts, exito, error, advertencia, info } = useAlert();
    
    return (
      <div>
        <button onClick={() => exito('Success message')}>Success</button>
        <button onClick={() => error('Error message')}>Error</button>
        <button onClick={() => advertencia('Warning message')}>Warning</button>
        <button onClick={() => info('Info message')}>Info</button>
        
        {alerts.map((alert) => (
          <Alert key={alert.id} {...alert} />
        ))}
      </div>
    );
  };

  it('debería crear y mostrar alertas de diferentes tipos', () => {
    render(<TestComponent />);
    
    fireEvent.click(screen.getByText('Success'));
    expect(screen.getByText('Success message')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Error'));
    expect(screen.getByText('Error message')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Warning'));
    expect(screen.getByText('Warning message')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Info'));
    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('debería permitir cerrar alertas individualmente', async () => {
    render(<TestComponent />);
    
    fireEvent.click(screen.getByText('Success'));
    expect(screen.getByText('Success message')).toBeInTheDocument();
    
    // Cerrar la alerta
    const botonCerrar = screen.getByRole('button', { name: '' }); // Botón X
    fireEvent.click(botonCerrar);
    
    await waitFor(() => {
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    });
  });
});