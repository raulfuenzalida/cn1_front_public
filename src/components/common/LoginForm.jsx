import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const LoginForm = ({
  onSuccess,
  title = 'Iniciar Sesión con AWS Cognito',
  subtitle = 'Ingresa tu correo y contraseña registrados en el User Pool.',
  defaultMode = 'login',
}) => {
  const { login, signUp, confirmSignUp, resendConfirmationCode, loading } = useAuth();

  const [mode, setMode] = useState(defaultMode); // 'login' | 'register' | 'confirm'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [isResending, setIsResending] = useState(false);
  const [showConfirmAction, setShowConfirmAction] = useState(false);

  const resetMessages = () => {
    setErrorMessage(null);
    setInfoMessage(null);
    setShowConfirmAction(false);
  };

  const switchMode = (newMode) => {
    resetMessages();
    setMode(newMode);
  };

  // 1. Manejo de Inicio de Sesión
  const handleLogin = async (e) => {
    e.preventDefault();
    resetMessages();

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Ingresa tu correo electrónico');
      return;
    }
    if (!password) {
      setErrorMessage('Ingresa tu contraseña');
      return;
    }

    try {
      await login(cleanEmail, password);
      if (onSuccess) onSuccess();
    } catch (err) {
      // Si el usuario aún no está confirmado, lo guiamos a la pantalla de verificación
      const isUnconfirmed =
        err.type?.includes('UserNotConfirmedException') ||
        err.raw?.__type?.includes('UserNotConfirmedException') ||
        err.message?.includes('no ha confirmado') ||
        err.message?.includes('not confirmed');

      if (isUnconfirmed) {
        setMode('confirm');
        setInfoMessage('Tu cuenta aún no está confirmada. Ingresa el código de 6 dígitos enviado a tu correo o haz clic en "Reenviar código".');
        return;
      }
      setErrorMessage(err.message || 'Error al autenticarse en AWS Cognito');
    }
  };

  // 2. Manejo de Registro
  const handleRegister = async (e) => {
    e.preventDefault();
    resetMessages();

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Ingresa un correo electrónico válido');
      return;
    }
    if (!password) {
      setErrorMessage('Ingresa una contraseña');
      return;
    }

    const hasMinLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    if (!hasMinLength || !hasUpper || !hasLower || !hasNumber || !hasSymbol) {
      setErrorMessage(
        'La contraseña debe tener mínimo 8 caracteres e incluir: mayúscula, minúscula, número y un símbolo especial (ej. !@#$%&*).'
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden');
      return;
    }

    try {
      await signUp(cleanEmail, password);
      setMode('confirm');
      setInfoMessage(`¡Cuenta creada! Hemos enviado un código de verificación a ${cleanEmail}.`);
    } catch (err) {
      const isAlreadyExists =
        err.type?.includes('UsernameExistsException') ||
        err.raw?.__type?.includes('UsernameExistsException') ||
        err.message?.includes('ya se encuentra registrado') ||
        err.message?.includes('already exists');

      if (isAlreadyExists) {
        setErrorMessage(
          'Este correo electrónico ya se encuentra registrado en Cognito. Si aún no has confirmado tu cuenta o ya recibiste tu código de 6 dígitos, puedes verificarla a continuación:'
        );
        setShowConfirmAction(true);
        return;
      }

      setErrorMessage(err.message || 'Error al registrar usuario en AWS Cognito');
    }
  };

  // 3. Manejo de Confirmación y Auto-Login
  const handleConfirm = async (e) => {
    e.preventDefault();
    resetMessages();

    const cleanEmail = email.trim();
    const cleanCode = verificationCode.trim();

    if (!cleanEmail) {
      setErrorMessage('Ingresa tu correo electrónico a verificar');
      return;
    }

    if (!cleanCode) {
      setErrorMessage('Ingresa el código de 6 dígitos enviado a tu correo');
      return;
    }

    try {
      // confirmSignUp confirma la cuenta y si se pasa la contraseña hace auto-login inmediatamente
      await confirmSignUp(cleanEmail, cleanCode, password || null);
      if (onSuccess) onSuccess();
      if (!password) {
        setMode('login');
        setInfoMessage('¡Cuenta confirmada con éxito! Ahora ingresa tu contraseña para iniciar sesión.');
      }
    } catch (err) {
      // Si la cuenta ya fue confirmada previamente:
      if (
        err.type?.includes('NotAuthorizedException') ||
        err.raw?.__type?.includes('NotAuthorizedException') ||
        err.message?.includes('confirmada') ||
        err.message?.includes('already confirmed')
      ) {
        if (password) {
          try {
            await login(cleanEmail, password);
            if (onSuccess) onSuccess();
            return;
          } catch (loginErr) {
            setErrorMessage(loginErr.message || 'Contraseña incorrecta');
            return;
          }
        }
        setMode('login');
        setInfoMessage('Tu cuenta ya está confirmada. Inicia sesión con tu correo y contraseña.');
        return;
      }
      setErrorMessage(err.message || 'Error al verificar el código de confirmación');
    }
  };

  // 4. Reenvío de código de confirmación
  const handleResendCode = async () => {
    resetMessages();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Ingresa tu correo para reenviar el código');
      return;
    }

    try {
      setIsResending(true);
      await resendConfirmationCode(cleanEmail);
      setInfoMessage(`Código reenviado con éxito a ${cleanEmail}. Revisa tu bandeja de entrada o spam.`);
    } catch (err) {
      setErrorMessage(err.message || 'No se pudo reenviar el código');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="login-form-card card p-4 shadow-sm">
      <div className="text-center mb-3">
        {/* Icono de AWS Cognito / Identidad */}
        <div
          className="rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
          style={{
            width: '56px',
            height: '56px',
            backgroundColor: 'rgba(221, 161, 94, 0.2)',
            color: 'var(--color-accent-dark)',
          }}
        >
          {mode === 'confirm' ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
          ) : mode === 'register' ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10H12V2z"></path>
              <path d="M12 12 2.1 12a10.1 10.1 0 0 0 1.9 4"></path>
              <path d="M12 12l4-8.9"></path>
            </svg>
          )}
        </div>

        <h3 className="h5 mb-1">
          {mode === 'confirm'
            ? 'Verificar Correo Electrónico'
            : mode === 'register'
            ? 'Crear Cuenta de Cliente'
            : title}
        </h3>
        <p className="text-muted small mb-0">
          {mode === 'confirm'
            ? 'Ingresa el código de 6 dígitos que llegó a tu correo.'
            : mode === 'register'
            ? 'Regístrate con tu correo y contraseña para comprar en PrintWorks.'
            : subtitle}
        </p>
      </div>

      {infoMessage && (
        <div className="alert alert-info py-2 small mb-3" role="status">
          {infoMessage}
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-danger py-2 small mb-3" role="alert">
          {errorMessage}
        </div>
      )}

      {showConfirmAction && (
        <div className="alert alert-warning py-2 small mb-3 text-center">
          <p className="mb-2 fw-semibold">¿Tienes un código de verificación pendiente para este correo?</p>
          <button
            type="button"
            className="btn btn-dark btn-sm fw-semibold w-100"
            onClick={() => {
              resetMessages();
              setMode('confirm');
              setInfoMessage(`Ingresa el código de 6 dígitos que llegó a ${email}. Si no lo ves, haz clic en "Reenviar código".`);
            }}
          >
            Ingresar Código de Verificación →
          </button>
        </div>
      )}

      {/* 1. MODO: LOGIN */}
      {mode === 'login' && (
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label htmlFor="login-email" className="form-label small fw-semibold">
              Correo Electrónico:
            </label>
            <input
              id="login-email"
              type="email"
              className="form-control"
              placeholder="usuario@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="mb-3">
            <label htmlFor="login-password" className="form-label small fw-semibold">
              Contraseña:
            </label>
            <input
              id="login-password"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2 fw-semibold mb-3"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Autenticando en Cognito...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>

          <div className="text-center pt-2 border-top d-flex flex-column gap-2">
            <div>
              <span className="small text-muted me-1">¿No tienes una cuenta?</span>
              <button
                type="button"
                className="btn btn-link p-0 small text-decoration-none fw-semibold"
                onClick={() => switchMode('register')}
              >
                Regístrate aquí
              </button>
            </div>
            <div>
              <span className="small text-muted me-1">¿Tienes un código pendiente?</span>
              <button
                type="button"
                className="btn btn-link p-0 small text-decoration-none fw-semibold"
                onClick={() => switchMode('confirm')}
              >
                Verificar cuenta
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 2. MODO: REGISTRO (SIGN UP) */}
      {mode === 'register' && (
        <form onSubmit={handleRegister}>
          <div className="mb-3">
            <label htmlFor="register-email" className="form-label small fw-semibold">
              Correo Electrónico:
            </label>
            <input
              id="register-email"
              type="email"
              className="form-control"
              placeholder="usuario@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="mb-3">
            <label htmlFor="register-password" className="form-label small fw-semibold">
              Contraseña:
            </label>
            <input
              id="register-password"
              type="password"
              className="form-control"
              placeholder="Mínimo 8 caracteres (ej. Pass1234!)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <div className="p-2 rounded mt-2 mb-2 border small" style={{ fontSize: '0.75rem', backgroundColor: 'var(--hover-bg)' }}>
              <div className="fw-semibold mb-1">Requisitos de contraseña en AWS Cognito:</div>
              <div className={password.length >= 8 ? 'text-success' : 'text-muted'}>
                {password.length >= 8 ? '✓' : '○'} Mínimo 8 caracteres
              </div>
              <div className={/[A-Z]/.test(password) ? 'text-success' : 'text-muted'}>
                {/[A-Z]/.test(password) ? '✓' : '○'} Al menos una mayúscula (A-Z)
              </div>
              <div className={/[a-z]/.test(password) ? 'text-success' : 'text-muted'}>
                {/[a-z]/.test(password) ? '✓' : '○'} Al menos una minúscula (a-z)
              </div>
              <div className={/[0-9]/.test(password) ? 'text-success' : 'text-muted'}>
                {/[0-9]/.test(password) ? '✓' : '○'} Al menos un número (0-9)
              </div>
              <div className={/[^A-Za-z0-9]/.test(password) ? 'text-success' : 'text-muted'}>
                {/[^A-Za-z0-9]/.test(password) ? '✓' : '○'} Al menos un símbolo (!@#$%&*...)
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="register-confirm-password" className="form-label small fw-semibold">
              Confirmar Contraseña:
            </label>
            <input
              id="register-confirm-password"
              type="password"
              className="form-control"
              placeholder="Repite tu contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2 fw-semibold mb-3"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Creando cuenta en Cognito...
              </>
            ) : (
              'Crear Cuenta'
            )}
          </button>

          <div className="text-center pt-2 border-top d-flex flex-column gap-2">
            <div>
              <span className="small text-muted me-1">¿Ya tienes cuenta?</span>
              <button
                type="button"
                className="btn btn-link p-0 small text-decoration-none fw-semibold"
                onClick={() => switchMode('login')}
              >
                Inicia sesión
              </button>
            </div>
            <div>
              <span className="small text-muted me-1">¿Tienes un código pendiente?</span>
              <button
                type="button"
                className="btn btn-link p-0 small text-decoration-none fw-semibold"
                onClick={() => switchMode('confirm')}
              >
                Verificar cuenta
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 3. MODO: CONFIRMACIÓN DE CÓDIGO (CONFIRM SIGN UP) */}
      {mode === 'confirm' && (
        <form onSubmit={handleConfirm}>
          <div className="mb-3">
            <label htmlFor="confirm-email" className="form-label small fw-semibold">
              Correo Electrónico a Verificar:
            </label>
            <input
              id="confirm-email"
              type="email"
              className="form-control"
              placeholder="usuario@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="mb-3">
            <label htmlFor="verification-code" className="form-label small fw-semibold">
              Código de Verificación (6 dígitos):
            </label>
            <input
              id="verification-code"
              type="text"
              maxLength="6"
              className="form-control text-center fs-5 fw-bold letter-spacing-2"
              placeholder="123456"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required
              autoFocus
            />
            <div className="d-flex justify-content-between align-items-center mt-2">
              <span className="small text-muted">Revisa tu bandeja de spam si no lo ves.</span>
              <button
                type="button"
                className="btn btn-link btn-sm p-0 text-decoration-none"
                onClick={handleResendCode}
                disabled={isResending}
              >
                {isResending ? 'Reenviando...' : 'Reenviar código'}
              </button>
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="confirm-password" className="form-label small fw-semibold">
              Contraseña (para iniciar sesión inmediatamente):
            </label>
            <input
              id="confirm-password"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <div className="form-text small" style={{ fontSize: '0.75rem' }}>
              {password
                ? '✓ Tu contraseña está lista para iniciar sesión automáticamente al confirmar.'
                : 'Ingresa tu contraseña para entrar de inmediato sin tener que volver a iniciar sesión.'}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2 fw-semibold mb-3"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Verificando...
              </>
            ) : (
              'Confirmar e Iniciar Sesión'
            )}
          </button>

          <div className="text-center pt-2 border-top d-flex justify-content-center gap-3">
            <button
              type="button"
              className="btn btn-link p-0 small text-decoration-none"
              onClick={() => switchMode('login')}
            >
              ← Iniciar sesión
            </button>
            <span className="text-muted small">|</span>
            <button
              type="button"
              className="btn btn-link p-0 small text-decoration-none"
              onClick={() => switchMode('register')}
            >
              Crear otra cuenta
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default LoginForm;
