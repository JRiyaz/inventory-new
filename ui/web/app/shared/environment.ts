export const environment = {
  production: false,
  apiUrl: (window as any).API_URL || 'http://localhost:3000/api',
  wsUrl: (window as any).WS_URL || 'ws://localhost:3000/api/chat/ws',
  healthUrl: (window as any).HEALTH_URL || 'http://localhost:3000/health',
};
