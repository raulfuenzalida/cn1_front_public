import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from './LoginForm';
import * as AuthContextModule from '../../context/AuthContext';

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login mode by default and allow switching to register mode', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      login: vi.fn(),
      signUp: vi.fn(),
      confirmSignUp: vi.fn(),
      resendConfirmationCode: vi.fn(),
      loading: false,
    });

    render(<LoginForm />);

    expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeInTheDocument();
    expect(screen.getByText(/Regístrate aquí/i)).toBeInTheDocument();

    // Cambiar a modo registro
    fireEvent.click(screen.getByText(/Regístrate aquí/i));

    expect(screen.getByText('Crear Cuenta de Cliente')).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirmar Contraseña:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Crear Cuenta/i })).toBeInTheDocument();
  });

  it('should validate that passwords match before calling signUp', async () => {
    const mockSignUp = vi.fn();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      login: vi.fn(),
      signUp: mockSignUp,
      confirmSignUp: vi.fn(),
      resendConfirmationCode: vi.fn(),
      loading: false,
    });

    render(<LoginForm defaultMode="register" />);

    fireEvent.change(screen.getByLabelText(/Correo Electrónico:/i), {
      target: { value: 'nuevo@printworks.cl' },
    });
    fireEvent.change(screen.getByLabelText(/^Contraseña:/i), {
      target: { value: 'Pass123456!' },
    });
    fireEvent.change(screen.getByLabelText(/Confirmar Contraseña:/i), {
      target: { value: 'Distinta123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Crear Cuenta/i }));

    expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('should transition to confirmation screen on successful signUp', async () => {
    const mockSignUp = vi.fn().mockResolvedValue({
      userConfirmed: false,
      userSub: 'sub-123',
    });

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      login: vi.fn(),
      signUp: mockSignUp,
      confirmSignUp: vi.fn(),
      resendConfirmationCode: vi.fn(),
      loading: false,
    });

    render(<LoginForm defaultMode="register" />);

    fireEvent.change(screen.getByLabelText(/Correo Electrónico:/i), {
      target: { value: 'nuevo@printworks.cl' },
    });
    fireEvent.change(screen.getByLabelText(/^Contraseña:/i), {
      target: { value: 'Pass123456!' },
    });
    fireEvent.change(screen.getByLabelText(/Confirmar Contraseña:/i), {
      target: { value: 'Pass123456!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Crear Cuenta/i }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('nuevo@printworks.cl', 'Pass123456!');
      expect(screen.getByText('Verificar Correo Electrónico')).toBeInTheDocument();
      expect(screen.getByLabelText(/Código de Verificación/i)).toBeInTheDocument();
    });
  });

  it('should submit confirmation code and auto-login', async () => {
    const mockConfirmSignUp = vi.fn().mockResolvedValue(true);
    const mockOnSuccess = vi.fn();

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      login: vi.fn(),
      signUp: vi.fn(),
      confirmSignUp: mockConfirmSignUp,
      resendConfirmationCode: vi.fn(),
      loading: false,
    });

    render(<LoginForm defaultMode="confirm" onSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByLabelText(/Correo Electrónico a Verificar:/i), {
      target: { value: 'nuevo@printworks.cl' },
    });
    fireEvent.change(screen.getByLabelText(/Código de Verificación/i), {
      target: { value: '123456' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Confirmar e Iniciar Sesión/i }));

    await waitFor(() => {
      expect(mockConfirmSignUp).toHaveBeenCalledWith('nuevo@printworks.cl', '123456', null);
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('should show verification shortcut button when user is already registered on signUp', async () => {
    const error = new Error('Este correo electrónico ya se encuentra registrado');
    error.type = 'UsernameExistsException';
    const mockSignUp = vi.fn().mockRejectedValue(error);

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      login: vi.fn(),
      signUp: mockSignUp,
      confirmSignUp: vi.fn(),
      resendConfirmationCode: vi.fn(),
      loading: false,
    });

    render(<LoginForm defaultMode="register" />);

    fireEvent.change(screen.getByLabelText(/Correo Electrónico:/i), {
      target: { value: 'existente@printworks.cl' },
    });
    fireEvent.change(screen.getByLabelText(/^Contraseña:/i), {
      target: { value: 'Pass123456!' },
    });
    fireEvent.change(screen.getByLabelText(/Confirmar Contraseña:/i), {
      target: { value: 'Pass123456!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Crear Cuenta/i }));

    await waitFor(() => {
      expect(screen.getByText(/ya se encuentra registrado en Cognito/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Ingresar Código de Verificación →/i })).toBeInTheDocument();
    });

    // Clic en el botón de atajo para ir a confirmar
    fireEvent.click(screen.getByRole('button', { name: /Ingresar Código de Verificación →/i }));

    expect(screen.getByText('Verificar Correo Electrónico')).toBeInTheDocument();
    expect(screen.getByDisplayValue('existente@printworks.cl')).toBeInTheDocument();
  });

  it('should allow switching to confirm mode directly using the "Verificar cuenta" link', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      login: vi.fn(),
      signUp: vi.fn(),
      confirmSignUp: vi.fn(),
      resendConfirmationCode: vi.fn(),
      loading: false,
    });

    render(<LoginForm defaultMode="login" />);

    expect(screen.getByText(/Verificar cuenta/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Verificar cuenta/i));

    expect(screen.getByText('Verificar Correo Electrónico')).toBeInTheDocument();
    expect(screen.getByLabelText(/Código de Verificación/i)).toBeInTheDocument();
  });

  it('should automatically switch to confirm mode when login throws UserNotConfirmedException', async () => {
    const error = new Error('El usuario aún no ha confirmado su correo electrónico');
    error.type = 'UserNotConfirmedException';
    const mockLogin = vi.fn().mockRejectedValue(error);

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      login: mockLogin,
      signUp: vi.fn(),
      confirmSignUp: vi.fn(),
      resendConfirmationCode: vi.fn(),
      loading: false,
    });

    render(<LoginForm defaultMode="login" />);

    fireEvent.change(screen.getByLabelText(/Correo Electrónico:/i), {
      target: { value: 'no_confirmado@printworks.cl' },
    });
    fireEvent.change(screen.getByLabelText(/^Contraseña:/i), {
      target: { value: 'Pass123456!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    await waitFor(() => {
      expect(screen.getByText('Verificar Correo Electrónico')).toBeInTheDocument();
      expect(screen.getByText(/Tu cuenta aún no está confirmada/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('no_confirmado@printworks.cl')).toBeInTheDocument();
    });
  });
});
