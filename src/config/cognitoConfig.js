/**
 * Configuración de AWS Cognito para cn1_front_public
 */
export const cognitoConfig = {
  region: import.meta.env.VITE_COGNITO_REGION || 'us-east-1',
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'us-east-1_KtdUxURf6',
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '5r7v7nnaqhkjp8gs5muaovked2',
  clientSecret: import.meta.env.VITE_COGNITO_CLIENT_SECRET || '1920g08dn6g6p6bnfe4ol7iqrvkjd55a57aotsqctnmhltkhid4n',
  requiredRole: import.meta.env.VITE_REQUIRED_ROLE || 'usuarios',
};
