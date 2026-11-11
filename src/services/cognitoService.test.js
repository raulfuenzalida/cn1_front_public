import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cognitoService, parseJwt, computeSecretHash } from './cognitoService';

describe('cognitoService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseJwt', () => {
    it('should parse valid JWT payload', () => {
      const payload = {
        sub: 'user-123',
        email: 'test@printworks.cl',
        'cognito:groups': ['usuarios'],
      };
      const base64Payload = btoa(JSON.stringify(payload));
      const fakeToken = `header.${base64Payload}.signature`;

      const parsed = parseJwt(fakeToken);
      expect(parsed).toEqual(payload);
    });

    it('should return null for invalid token format', () => {
      expect(parseJwt('')).toBeNull();
      expect(parseJwt('invalid-token')).toBeNull();
      expect(parseJwt(null)).toBeNull();
    });
  });

  describe('computeSecretHash', () => {
    it('should return undefined if clientSecret is empty', async () => {
      const hash = await computeSecretHash('user@test.cl', 'client-id', '');
      expect(hash).toBeUndefined();
    });

    it('should compute base64 hash when secret is provided', async () => {
      const hash = await computeSecretHash('user@test.cl', 'client-123', 'secret-456');
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  describe('loginWithEmailAndPassword', () => {
    it('should successfully authenticate and return user info and roles', async () => {
      const fakeIdPayload = {
        sub: 'sub-cognito-99',
        email: 'raul@printworks.cl',
        'cognito:groups': ['usuarios'],
      };
      const fakeIdToken = `h.${btoa(JSON.stringify(fakeIdPayload))}.s`;

      const mockResponse = {
        AuthenticationResult: {
          AccessToken: 'access-token-123',
          IdToken: fakeIdToken,
          RefreshToken: 'refresh-token-123',
        },
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await cognitoService.loginWithEmailAndPassword(
        'raul@printworks.cl',
        'Password123!'
      );

      expect(result.accessToken).toBe('access-token-123');
      expect(result.idToken).toBe(fakeIdToken);
      expect(result.user.email).toBe('raul@printworks.cl');
      expect(result.user.sub).toBe('sub-cognito-99');
      expect(result.roles).toEqual(['usuarios']);
    });

    it('should handle NotAuthorizedException with friendly error message', async () => {
      const mockErrorResponse = {
        __type: 'NotAuthorizedException',
        message: 'Incorrect username or password.',
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => mockErrorResponse,
      });

      await expect(
        cognitoService.loginWithEmailAndPassword('wrong@test.cl', 'wrongpass')
      ).rejects.toThrow('Correo o contraseña incorrectos.');
    });

    it('should handle UserNotFoundException with friendly error message', async () => {
      const mockErrorResponse = {
        __type: 'UserNotFoundException',
        message: 'User does not exist.',
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => mockErrorResponse,
      });

      await expect(
        cognitoService.loginWithEmailAndPassword('unknown@test.cl', 'anypass')
      ).rejects.toThrow('El usuario no está registrado.');
    });

    it('should handle USER_PASSWORD_AUTH flow not enabled with clear instructions', async () => {
      const mockErrorResponse = {
        __type: 'InvalidParameterException',
        message: 'USER_PASSWORD_AUTH flow not enabled for this client',
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => mockErrorResponse,
      });

      await expect(
        cognitoService.loginWithEmailAndPassword('user@test.cl', 'Pass123!')
      ).rejects.toThrow('El flujo USER_PASSWORD_AUTH no está habilitado');
    });
  });

  describe('signUp', () => {
    it('should successfully call SignUp and return user confirmation details', async () => {
      const mockResponse = {
        UserConfirmed: false,
        UserSub: 'sub-new-123',
        CodeDeliveryDetails: {
          AttributeName: 'email',
          DeliveryMedium: 'EMAIL',
          Destination: 'n***@p***.cl',
        },
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await cognitoService.signUp('nuevo@printworks.cl', 'SecretPass123!');

      expect(result.userConfirmed).toBe(false);
      expect(result.userSub).toBe('sub-new-123');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('cognito-idp.us-east-1.amazonaws.com'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-Amz-Target': 'AWSCognitoIdentityProviderService.SignUp',
          }),
        })
      );
    });

    it('should handle UsernameExistsException with friendly error message', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          __type: 'UsernameExistsException',
          message: 'An account with the given email already exists.',
        }),
      });

      await expect(
        cognitoService.signUp('existente@printworks.cl', 'Pass123!')
      ).rejects.toThrow('Este correo electrónico ya se encuentra registrado');
    });

    it('should handle InvalidPasswordException missing symbol with specific message', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          __type: 'InvalidPasswordException',
          message: 'Password did not conform with policy: Password must have symbol characters',
        }),
      });

      await expect(
        cognitoService.signUp('test@printworks.cl', 'Pass1234')
      ).rejects.toThrow('símbolo especial');
    });

    it('should handle InvalidPasswordException missing uppercase with specific message', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          __type: 'InvalidPasswordException',
          message: 'Password did not conform with policy: Password must have uppercase characters',
        }),
      });

      await expect(
        cognitoService.signUp('test@printworks.cl', 'pass1234!')
      ).rejects.toThrow('mayúscula');
    });
  });

  describe('confirmSignUp', () => {
    it('should successfully call ConfirmSignUp', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const result = await cognitoService.confirmSignUp('nuevo@printworks.cl', '123456');

      expect(result).toBe(true);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('cognito-idp.us-east-1.amazonaws.com'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Amz-Target': 'AWSCognitoIdentityProviderService.ConfirmSignUp',
          }),
        })
      );
    });

    it('should handle CodeMismatchException with friendly error message', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          __type: 'CodeMismatchException',
          message: 'Invalid verification code provided.',
        }),
      });

      await expect(
        cognitoService.confirmSignUp('nuevo@printworks.cl', '999999')
      ).rejects.toThrow('El código de verificación es incorrecto.');
    });
  });

  describe('resendConfirmationCode', () => {
    it('should successfully call ResendConfirmationCode', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          CodeDeliveryDetails: {
            DeliveryMedium: 'EMAIL',
            Destination: 'n***@p***.cl',
          },
        }),
      });

      const result = await cognitoService.resendConfirmationCode('nuevo@printworks.cl');

      expect(result.DeliveryMedium).toBe('EMAIL');
    });
  });
});
