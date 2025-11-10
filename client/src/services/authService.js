import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function storeUser(usuario) {
  if (usuario) localStorage.setItem(USER_KEY, JSON.stringify(usuario));
  else localStorage.removeItem(USER_KEY);
}

export const AuthService = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  },
  getStoredUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  decodeToken() {
    const token = this.getToken();
    if (!token) return null;
    try {
      return jwtDecode(token);
    } catch (err) {
      return null;
    }
  },
  isAuthenticated() {
    const decoded = this.decodeToken();
    if (!decoded) return false;
    return decoded.exp * 1000 > Date.now();
  },
  hasRole(role) {
    const decoded = this.decodeToken();
    if (!decoded) return false;
    return decoded.rol === role;
  },
  async login(credentials) {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) throw new Error('Credenciales invalidas');
      const data = await response.json();
      this.setToken(data.token);
      storeUser(data.usuario);
      return data;
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        throw new Error('No se pudo conectar con el servidor (¿API levantada en http://localhost:4000?).');
      }
      throw err;
    }
  },
  async register(payload) {
    try {
      const response = await fetch(`${API_URL}/auth/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      this.setToken(data.token);
      storeUser(data.usuario);
      return data;
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        throw new Error('No se pudo conectar con el servidor (¿API activa?).');
      }
      throw err;
    }
  },
  async recover(email) {
    try {
      const response = await fetch(`${API_URL}/auth/recuperar-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error('No se pudo procesar la solicitud');
      return response.json();
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        throw new Error('No se pudo contactar con la API para enviar el correo.');
      }
      throw err;
    }
  },
  async resetPassword(token, nuevaPassword) {
    try {
      const response = await fetch(`${API_URL}/auth/resetear-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, nuevaPassword }),
      });
      if (!response.ok) throw new Error('Token no valido');
      return response.json();
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        throw new Error('No se pudo completar el cambio de password. Verifica la API.');
      }
      throw err;
    }
  },
  async logout() {
    const token = this.getToken();
    if (token) {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    this.setToken(null);
    storeUser(null);
  },
};
