/**
 * Configuración de AWS Cognito para cn1_front_public
 * Lee las variables desde import.meta.env (.env de Vite)
 */
export const cognitoConfig = {
  region: import.meta.env.VITE_COGNITO_REGION || 'us-east-1',
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
  clientSecret: import.meta.env.VITE_COGNITO_CLIENT_SECRET || '',
  requiredRole: import.meta.env.VITE_REQUIRED_ROLE || '',
};