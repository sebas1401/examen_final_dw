import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', password: '', confirm: '', terms: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.terms) return setError('Debes aceptar los términos');
    if (form.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden');
    setLoading(true);
    setError('');
    try {
      await register({ nombre: form.nombre, email: form.email, telefono: form.telefono, password: form.password });
      navigate('/cliente/inicio', { replace: true });
    } catch (err) {
      setError(err.message || 'No se pudo completar el registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="brand-mark">RF</div>
        <h2>Crear cuenta</h2>
        {error && <div className="alert error">{error}</div>}
        <label className="field">
          Nombre completo
          <input name="nombre" value={form.nombre} onChange={handleChange} required />
        </label>
        <label className="field">
          Email
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </label>
        <label className="field">
          Teléfono
          <input name="telefono" value={form.telefono} onChange={handleChange} required />
        </label>
        <label className="field">
          Contraseña <small>(mínimo 8 caracteres)</small>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            minLength={8}
            required
          />
        </label>
        <label className="field">
          Confirmar contraseña
          <input type="password" name="confirm" value={form.confirm} onChange={handleChange} required />
        </label>
        <label className="text-row">
          <input type="checkbox" name="terms" checked={form.terms} onChange={handleChange} />
          Acepto los términos y condiciones
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>
        <div className="auth-divider">¿Ya tienes cuenta?</div>
        <Link to="/login" className="btn btn-secondary auth-full">
          Inicia sesión
        </Link>
      </form>
    </div>
  );
}
