import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Profile from './Profile';
import * as AuthContextModule from '../../context/AuthContext';

describe('Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show unauthenticated state and login form when user is not logged in', async () => {
    const mockLogin = vi.fn().mockResolvedValue({});
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      user: null,
      roles: [],
      login: mockLogin,
      logout: vi.fn(),
      loading: false,
    });

    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );

    expect(screen.getByText('No has iniciado sesión')).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo Electrónico:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contraseña:/i)).toBeInTheDocument();

    const emailInput = screen.getByLabelText(/Correo Electrónico:/i);
    const passInput = screen.getByLabelText(/Contraseña:/i);
    const submitBtn = screen.getByRole('button', { name: /Iniciar Sesión/i });

    fireEvent.change(emailInput, { target: { value: 'cliente@printworks.cl' } });
    fireEvent.change(passInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    expect(mockLogin).toHaveBeenCalledWith('cliente@printworks.cl', 'password123');
  });

  it('should show basic profile details, email and connected status when user is logged in', () => {
    const mockLogout = vi.fn();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      user: {
        name: 'carlos',
        email: 'carlos@printworks.cl',
        sub: 'cognito-sub-1234',
        userPoolId: 'us-east-1_KtdUxURf6',
        roles: ['usuarios'],
      },
      roles: ['usuarios'],
      login: vi.fn(),
      logout: mockLogout,
      loading: false,
    });

    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );

    expect(screen.getByText('Perfil de Usuario')).toBeInTheDocument();
    expect(screen.getAllByText('Conectado').length).toBeGreaterThan(0);
    expect(screen.getAllByText('carlos@printworks.cl')).toHaveLength(2);
    // Verificar que los datos técnicos de Cognito ya no se muestran
    expect(screen.queryByText('us-east-1_KtdUxURf6')).not.toBeInTheDocument();
    expect(screen.queryByText('cognito-sub-1234')).not.toBeInTheDocument();
    expect(screen.queryByText(/User Sub/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/User Pool ID/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Roles \/ Grupos Asignados/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/No se encontraron grupos asociados en el token/i)).not.toBeInTheDocument();

    const logoutBtn = screen.getByRole('button', { name: /Cerrar Sesión/i });
    expect(logoutBtn).toBeInTheDocument();

    fireEvent.click(logoutBtn);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
