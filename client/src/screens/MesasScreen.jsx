import { useEffect, useState } from 'react';
import { api } from '../services/api';

const initialForm = { numero: '', capacidad: '', ubicacion: 'Interior' };

export function MesasScreen() {
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  async function fetchMesas() {
    setLoading(true);
    const data = await api.getMesas();
    setMesas(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchMesas();
  }, []);

  function openModal(mesa) {
    if (mesa) {
      setForm({ numero: mesa.numero, capacidad: mesa.capacidad, ubicacion: mesa.ubicacion });
      setEditingId(mesa.id);
    } else {
      setForm(initialForm);
      setEditingId(null);
    }
    setModalOpen(true);
  }

  async function handleSave(event) {
    event.preventDefault();
    const payload = { numero: Number(form.numero), capacidad: Number(form.capacidad), ubicacion: form.ubicacion };
    if (editingId) {
      await api.updateMesa(editingId, payload);
    } else {
      await api.createMesa(payload);
    }
    setModalOpen(false);
    fetchMesas();
  }

  async function handleDelete(id) {
    await api.deleteMesa(id);
    fetchMesas();
  }

  return (
    <section className="screen-card">
      <div className="screen-title">
        <div>
          <p className="eyebrow">Control operativo</p>
          <h2>Gestión de mesas</h2>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => openModal(null)}>
          + Nueva mesa
        </button>
      </div>
      {loading ? (
        <div className="loading">Cargando...</div>
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Número</th>
                <th>Capacidad</th>
                <th>Ubicación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {mesas.map((mesa) => (
                <tr key={mesa.id}>
                  <td>{mesa.numero}</td>
                  <td>{mesa.capacidad} personas</td>
                  <td>{mesa.ubicacion}</td>
                  <td>
                    <button className="btn btn-secondary" type="button" onClick={() => openModal(mesa)}>
                      Editar
                    </button>
                    <button className="btn btn-danger" type="button" onClick={() => handleDelete(mesa.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card" style={{ textAlign: 'left' }}>
            <h3>{editingId ? 'Editar mesa' : 'Nueva mesa'}</h3>
            <form className="form-stack" onSubmit={handleSave}>
              <label className="field">
                Número de mesa
                <input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} required />
              </label>
              <label className="field">
                Capacidad
                <input type="number" value={form.capacidad} onChange={(e) => setForm({ ...form, capacidad: e.target.value })} required />
              </label>
              <label className="field">
                Ubicación
                <select value={form.ubicacion} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}>
                  <option>Interior</option>
                  <option>Terraza</option>
                  <option>VIP</option>
                </select>
              </label>
              <div className="form-actions" style={{ marginTop: '12px' }}>
                <button className="btn btn-secondary" type="button" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button className="btn btn-primary" type="submit">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
