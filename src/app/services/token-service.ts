import { Injectable } from '@angular/core';

const TOKEN_KEY = 'authToken';

// Sin HttpClient a propósito: se usa dentro de auth-interceptor, que corre "dentro" de HttpClient.
@Injectable({
  providedIn: 'root',
})
export class TokenService {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  // El JWT sólo lleva { sub, iat, exp }, dura 1h y no hay refresh (docs/api/1-auth.md).
  isExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = this.decodePayload(token);
      if (!payload || typeof payload.exp !== 'number') return true;

      return payload.exp <= Date.now() / 1000;
    } catch {
      return true;
    }
  }

  private decodePayload(token: string): { exp?: number; sub?: string; iat?: number } | null {
    const partes = token.split('.');
    if (partes.length !== 3) return null;

    // base64url -> base64
    const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );

    return JSON.parse(json);
  }
}
