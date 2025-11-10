import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import './LoginPage.css';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const data = await login({ email: form.email, password: form.password });
      if (data.usuario.rol === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/cliente/inicio', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Credenciales inválidas. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-container">
        <div className="logo-circle">RF</div>
        <h1 className="login-title">Iniciar sesión</h1>

        {error && <div className="error-message">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="form-input"
              type="email"
              name="email"
              placeholder="tu@email.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group password-group">
            <label className="form-label" htmlFor="password">
              Contraseña
            </label>
            <div className="input-with-icon">
              <input
                id="password"
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="********"
                value={form.password}
                onChange={handleChange}
                required
              />
              <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </span>
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input type="checkbox" name="remember" className="checkbox-input" checked={form.remember} onChange={handleChange} />
              Recordarme
            </label>
            <Link to="/recuperar" className="forgot-password-link">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="signup-text">¿No tienes cuenta?</p>

        <Link to="/registro" className="signup-link">
          Crear cuenta
        </Link>
      </div>
    </div>
  );
}
