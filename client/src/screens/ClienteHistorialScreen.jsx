import { useEffect, useState } from 'react';
import { api } from '../services/api';

export function ClienteHistorialScreen() {
  const [clientes, setClientes] = useState([]);
  const [clienteActivo, setClienteActivo] = useState(null);
  const [historial, setHistorial] = useState(null);

  useEffect(() => {
    (async () => {
      const data = await api.getClientes();
      setClientes(data);
      if (data.length) {
        setClienteActivo(data[0].id);
      }
    })();
  }, []);

  useEffect(() => {
    if (!clienteActivo) return;
    (async () => {
      const data = await api.getClienteHistorial(clienteActivo);
      setHistorial(data);
    })();
  }, [clienteActivo]);

  if (!historial) {
    return <div className="loading">Selecciona un cliente...</div>;
  }

  return (
    <section className="screen-card">
      <div className="client-header">
        <div>
          <p className="eyebrow">Historial de cliente</p>
          <h2>{historial.nombre}</h2>
          <p className="micro-copy">Tel: {historial.telefono} · Email: {historial.email || 'Sin registro'}</p>
        </div>
        <select value={clienteActivo} onChange={(e) => setClienteActivo(Number(e.target.value))}>
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="stat-grid">
        <div className="stat-card"><small>Total de visitas</small><strong>{historial.reservas.length}</strong></div>
        <div className="stat-card"><small>Última reserva</small><strong>{historial.reservas[0] ? historial.reservas[0].fecha : 'N/A'}</strong></div>
        <div className="stat-card"><small>Teléfono</small><strong>{historial.telefono}</strong></div>
        <div className="stat-card"><small>Email</small><strong>{historial.email || 'No registrado'}</strong></div>
      </div>
      <div className="timeline">
        {historial.reservas.map((reserva) => (
          <div key={reserva.id} className="timeline-card">
            <strong>{reserva.fechaHora}</strong>
            <p className="micro-copy">Mesa {reserva.mesa.numero} · {reserva.numeroPersonas} personas</p>
            <span className={`badge ${reserva.estado === 'CANCELADA' ? 'danger' : 'success'}`}>
              {reserva.estado}
            </span>
          </div>
        ))}
      </div>
      <button className="fab" type="button">+ Nueva reserva para este cliente</button>
    </section>
  );
}
