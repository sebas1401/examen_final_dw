import { useEffect, useState } from 'react';
import { api } from '../../services/api';

export function ClientePerfil() {
  const [perfil, setPerfil] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.getMiPerfil().then(setPerfil);
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setPerfil((prev) => ({
      ...prev,
      usuario: { ...prev.usuario, [name]: value },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setGuardando(true);
    try {
      await api.updateMiPerfil({
        nombre: perfil.usuario.nombre,
        telefono: perfil.usuario.telefono,
      });
      setMensaje('Perfil actualizado correctamente');
    } finally {
      setGuardando(false);
    }
  };

  if (!perfil) return <div className="loading">Cargando perfil...</div>;

  return (
    <div className="cliente-page">
      {mensaje && <div className="alert success">{mensaje}</div>}
      <section className="cliente-card perfil">
        <div className="cliente-card-header">
          <div>
            <p className="eyebrow">Cuenta</p>
            <h3>Información personal</h3>
          </div>
        </div>
        <form className="cliente-profile-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Nombre completo</span>
            <input name="nombre" value={perfil.usuario.nombre} onChange={handleChange} required />
          </label>
          <label className="field">
            <span>Teléfono</span>
            <input name="telefono" value={perfil.usuario.telefono} onChange={handleChange} required />
          </label>
          <label className="field disabled">
            <span>Email</span>
            <input value={perfil.usuario.email} disabled />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
