import { cognitoConfig } from '../config/cognitoConfig';

/**
 * Calcula el SECRET_HASH requerido por AWS Cognito cuando el App Client tiene Client Secret.
 * Fórmula: Base64(HMAC-SHA256(ClientSecret, Username + ClientId))
 */
export async function computeSecretHash(username, clientId, clientSecret) {
  if (!clientSecret) return undefined;

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(clientSecret);
    const messageData = encoder.encode(username + clientId);

    const subtle = globalThis.crypto?.subtle;
    if (!subtle) {
      console.warn('Web Crypto API no disponible en este entorno.');
      return undefined;
    }

    const key = await subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await subtle.sign('HMAC', key, messageData);
    const hashArray = Array.from(new Uint8Array(signature));
    return btoa(String.fromCharCode.apply(null, hashArray));
  } catch (error) {
    console.error('Error calculando SECRET_HASH de Cognito:', error);
    return undefined;
  }
}

/**
 * Decodifica el payload de un token JWT (ID Token o Access Token)
 */
export function parseJwt(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Error parseando JWT de Cognito:', err);
    return null;
  }
}

export const cognitoService = {
  /**
   * Inicia sesión con Email y Contraseña directamente contra AWS Cognito.
   */
  async loginWithEmailAndPassword(email, password) {
    const { region, clientId, clientSecret, userPoolId } = cognitoConfig;

    if (!email || typeof email !== 'string' || !email.trim()) {
      const error = new Error('Por favor ingresa tu correo electrónico.');
      error.type = 'ValidationError';
      throw error;
    }

    if (!password || typeof password !== 'string') {
      const error = new Error('Por favor ingresa tu contraseña.');
      error.type = 'ValidationError';
      throw error;
    }

    const cleanEmail = email.trim();

    const authParameters = {
      USERNAME: cleanEmail,
      PASSWORD: password,
    };

    const secretHash = await computeSecretHash(cleanEmail, clientId, clientSecret);
    if (secretHash) {
      authParameters.SECRET_HASH = secretHash;
    }

    const endpoint = `https://cognito-idp.${region}.amazonaws.com/`;

    let response;
    let data;

    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
        },
        body: JSON.stringify({
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: clientId,
          AuthParameters: authParameters,
        }),
      });

      data = await response.json();
    } catch (networkError) {
      if (networkError.type === 'ValidationError' || networkError.type === 'ConfigError') {
        throw networkError;
      }
      console.error('Error de conexión con AWS Cognito:', networkError);
      const error = new Error('No se pudo establecer conexión con el servidor de autenticación. Verifica tu conexión a internet.');
      error.type = 'NetworkError';
      error.cause = networkError;
      throw error;
    }

    if (!response.ok) {
      console.error('AWS Cognito InitiateAuth error response:', data);
      const errorType = data.__type || '';
      const rawMessage = data.message || '';
      let friendlyMessage = rawMessage || 'Error al iniciar sesión en AWS Cognito.';

      if (rawMessage.includes('USER_PASSWORD_AUTH') || rawMessage.includes('flow not enabled')) {
        friendlyMessage = `El flujo USER_PASSWORD_AUTH no está habilitado en el App Client de Cognito. Ve a AWS Console > User Pool (${userPoolId || 'tu-user-pool'}) > App integration > Clientes de aplicación (${clientId || 'tu-client-id'}) > Authentication flows y activa ALLOW_USER_PASSWORD_AUTH.`;
      } else if (
        errorType.includes('TooManyFailedAttemptsException') ||
        rawMessage.includes('Password attempts exceeded') ||
        rawMessage.includes('exceeded')
      ) {
        friendlyMessage = 'Has superado el número máximo de intentos fallidos. Por seguridad, tu cuenta ha sido bloqueada temporalmente. Inténtalo más tarde.';
      } else if (
        errorType.includes('TooManyRequestsException') ||
        rawMessage.includes('Too many requests')
      ) {
        friendlyMessage = 'Demasiadas solicitudes al servicio de autenticación. Por favor espera unos momentos antes de volver a intentar.';
      } else if (errorType.includes('PasswordResetRequiredException')) {
        friendlyMessage = 'Tu contraseña ha expirado o requiere ser restablecida antes de iniciar sesión.';
      } else if (
        errorType.includes('UserNotFoundException') ||
        rawMessage.includes('User does not exist')
      ) {
        friendlyMessage = 'El usuario no está registrado. Verifica el correo ingresado o crea una nueva cuenta.';
      } else if (
        errorType.includes('NotAuthorizedException') ||
        rawMessage.includes('Incorrect username or password')
      ) {
        friendlyMessage = 'Correo o contraseña incorrectos. Verifica que tus datos sean correctos e intenta nuevamente.';
      } else if (
        errorType.includes('UserNotConfirmedException') ||
        rawMessage.includes('User is not confirmed')
      ) {
        friendlyMessage = 'El usuario aún no ha confirmado su correo electrónico en Cognito.';
      } else if (errorType.includes('InvalidParameterException')) {
        friendlyMessage = rawMessage || 'Por favor verifica el formato del correo y contraseña.';
      }

      const error = new Error(friendlyMessage);
      error.type = errorType;
      error.raw = data;
      throw error;
    }

    const result = data.AuthenticationResult;
    if (!result) {
      throw new Error('Respuesta inesperada de AWS Cognito (se requiere desafío adicional).');
    }

    const idClaims = parseJwt(result.IdToken) || {};
    const roles = Array.isArray(idClaims['cognito:groups']) ? idClaims['cognito:groups'] : [];

    return {
      accessToken: result.AccessToken,
      idToken: result.IdToken,
      refreshToken: result.RefreshToken,
      user: {
        email: idClaims.email || cleanEmail,
        name: idClaims.name || idClaims.email?.split('@')[0] || cleanEmail.split('@')[0],
        sub: idClaims.sub || '',
        userPoolId: cognitoConfig.userPoolId,
        roles,
      },
      roles,
    };
  },

  /**
   * Registra un nuevo usuario en AWS Cognito (SignUp).
   */
  async signUp(email, password) {
    const { region, clientId, clientSecret } = cognitoConfig;
    const cleanEmail = email.trim();

    const payload = {
      ClientId: clientId,
      Username: cleanEmail,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: cleanEmail },
      ],
    };

    const secretHash = await computeSecretHash(cleanEmail, clientId, clientSecret);
    if (secretHash) {
      payload.SecretHash = secretHash;
    }

    const endpoint = `https://cognito-idp.${region}.amazonaws.com/`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.SignUp',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('AWS Cognito SignUp error response:', data);
      const errorType = data.__type || '';
      const rawMessage = data.message || '';
      let friendlyMessage = rawMessage || 'Error al registrar usuario en AWS Cognito.';

      if (errorType.includes('UsernameExistsException')) {
        friendlyMessage = 'Este correo electrónico ya se encuentra registrado. Si aún no has confirmado tu cuenta, ingresa tu código de verificación o inicia sesión.';
      } else if (errorType.includes('InvalidPasswordException')) {
        if (rawMessage.includes('symbol')) {
          friendlyMessage = 'La contraseña debe incluir al menos un símbolo especial (ej. !@#$%&*).';
        } else if (rawMessage.includes('uppercase')) {
          friendlyMessage = 'La contraseña debe incluir al menos una letra mayúscula.';
        } else if (rawMessage.includes('lowercase')) {
          friendlyMessage = 'La contraseña debe incluir al menos una letra minúscula.';
        } else if (rawMessage.includes('numeric')) {
          friendlyMessage = 'La contraseña debe incluir al menos un número.';
        } else if (rawMessage.includes('not long enough')) {
          friendlyMessage = 'La contraseña debe tener al menos 8 caracteres.';
        } else {
          friendlyMessage = `Política de contraseña: ${rawMessage}`;
        }
      } else if (errorType.includes('InvalidParameterException')) {
        friendlyMessage = rawMessage || 'Por favor verifica los datos ingresados.';
      }

      const error = new Error(friendlyMessage);
      error.type = errorType;
      error.raw = data;
      throw error;
    }

    return {
      userConfirmed: data.UserConfirmed,
      userSub: data.UserSub,
      codeDeliveryDetails: data.CodeDeliveryDetails,
    };
  },

  /**
   * Confirma el registro del usuario mediante el código de verificación (ConfirmSignUp).
   */
  async confirmSignUp(email, code) {
    const { region, clientId, clientSecret } = cognitoConfig;
    const cleanEmail = email.trim();
    const cleanCode = code.trim();

    const payload = {
      ClientId: clientId,
      Username: cleanEmail,
      ConfirmationCode: cleanCode,
    };

    const secretHash = await computeSecretHash(cleanEmail, clientId, clientSecret);
    if (secretHash) {
      payload.SecretHash = secretHash;
    }

    const endpoint = `https://cognito-idp.${region}.amazonaws.com/`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.ConfirmSignUp',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorType = data.__type || '';
      let friendlyMessage = data.message || 'Error al confirmar la cuenta en AWS Cognito.';

      if (errorType.includes('CodeMismatchException')) {
        friendlyMessage = 'El código de verificación es incorrecto.';
      } else if (errorType.includes('ExpiredCodeException')) {
        friendlyMessage = 'El código de verificación ha expirado. Haz clic en "Reenviar código" para recibir uno nuevo.';
      } else if (errorType.includes('NotAuthorizedException')) {
        friendlyMessage = 'La cuenta ya se encuentra confirmada. Inicia sesión con tu correo y contraseña.';
      } else if (errorType.includes('UserNotFoundException')) {
        friendlyMessage = 'El correo ingresado no está registrado.';
      }

      const error = new Error(friendlyMessage);
      error.type = errorType;
      error.raw = data;
      throw error;
    }

    return true;
  },

  /**
   * Reenvía el código de confirmación al correo del usuario (ResendConfirmationCode).
   */
  async resendConfirmationCode(email) {
    const { region, clientId, clientSecret } = cognitoConfig;
    const cleanEmail = email.trim();

    const payload = {
      ClientId: clientId,
      Username: cleanEmail,
    };

    const secretHash = await computeSecretHash(cleanEmail, clientId, clientSecret);
    if (secretHash) {
      payload.SecretHash = secretHash;
    }

    const endpoint = `https://cognito-idp.${region}.amazonaws.com/`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.ResendConfirmationCode',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorType = data.__type || '';
      let friendlyMessage = data.message || 'Error al reenviar el código de verificación.';

      if (errorType.includes('UserNotFoundException')) {
        friendlyMessage = 'El correo ingresado no se encuentra registrado en Cognito.';
      } else if (errorType.includes('InvalidParameterException') && (data.message?.includes('already confirmed') || data.message?.includes('Cannot reset'))) {
        friendlyMessage = 'Esta cuenta ya está confirmada. Inicia sesión directamente.';
      } else if (errorType.includes('LimitExceededException')) {
        friendlyMessage = 'Has superado el límite de intentos. Por favor espera unos minutos antes de solicitar otro código.';
      } else if (errorType.includes('CodeDeliveryFailureException')) {
        friendlyMessage = 'No se pudo enviar el correo de verificación. Revisa que el correo sea válido.';
      }

      const error = new Error(friendlyMessage);
      error.type = errorType;
      error.raw = data;
      throw error;
    }

    return data.CodeDeliveryDetails;
  },
};
