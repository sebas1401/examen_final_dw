import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthService } from '../../services/authService';

export function RecoveryPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const result = await AuthService.recover(email);
      setMessage(result.message || 'Si el correo existe recibirás un mensaje con instrucciones.');
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="brand-mark">RF</div>
        <h2>Recuperar contraseña</h2>
        {message && <div className="alert success">{message}</div>}
        <label className="field">
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <button type="submit" className="btn btn-primary">Enviar instrucciones</button>
        <Link to="/login" className="btn btn-secondary auth-full">Volver al inicio de sesión</Link>
      </form>
    </div>
  );
}
