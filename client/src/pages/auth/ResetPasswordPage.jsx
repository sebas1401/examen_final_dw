import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthService } from '../../services/authService';

export function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [message, setMessage] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirm) {
      return setMessage('Las contraseñas no coinciden');
    }
    try {
      await AuthService.resetPassword(token, form.password);
      setMessage('Contraseña actualizada, redirigiendo...');
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (err) {
      setMessage(err.message || 'Token inválido');
    }
  };

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="brand-mark">RF</div>
        <h2>Cambiar contraseña</h2>
        {message && <div className="alert info">{message}</div>}
        <label className="field">
          Nueva contraseña
          <input type="password" name="password" value={form.password} onChange={handleChange} required />
        </label>
        <label className="field">
          Confirmar contraseña
          <input type="password" name="confirm" value={form.confirm} onChange={handleChange} required />
        </label>
        <button type="submit" className="btn btn-primary">Actualizar</button>
      </form>
    </div>
  );
}
