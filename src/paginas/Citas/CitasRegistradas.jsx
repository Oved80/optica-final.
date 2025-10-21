import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../lib/supabaseClient';
import DetailModal from '../../Componentes/DetailModal';
import ModalCancelarCita from '../../Componentes/ModalCancelarCita';
import './style.css';

const CitasRegistradas = () => {
  const navigate = useNavigate();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [selectedCancel, setSelectedCancel] = useState(null);

  const ejemplo = [
    { id: 1, fecha: '2025-10-20', hora: '09:00', doctor: 'Dr. Ruiz', motivo: 'Consulta general' },
    { id: 2, fecha: '2025-10-20', hora: '10:00', doctor: 'Dra. Morales', motivo: 'Control' },
    { id: 3, fecha: '2025-10-21', hora: '14:30', doctor: 'Dr. Torres', motivo: 'Seguimiento' },
  ];

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      if (!supabase) {
        if (mounted) { setCitas(ejemplo); setLoading(false); }
        return;
      }
      try {
        setLoading(true);
        const { data, error } = await supabase.from('citas').select('*').order('fecha', { ascending: true });
        if (error) { console.error(error); if (mounted) setCitas(ejemplo); }
        else if (mounted) setCitas(data || ejemplo);
      } catch (err) {
        console.error(err); if (mounted) setCitas(ejemplo);
      } finally { if (mounted) setLoading(false); }
    };
    fetch();
    return () => { mounted = false; };
  }, []);

  const filtradas = citas.filter(c => {
    if (!filtro) return true;
    const b = filtro.toLowerCase();
    return (c.doctor && c.doctor.toLowerCase().includes(b)) || (c.fecha && c.fecha.includes(b));
  });

  const handleView = (c) => { setDetailItem(c); setDetailOpen(true); };
  const handleCancel = (c) => { setSelectedCancel(c); setCancelOpen(true); };

  const submitCancel = async (motivo) => {
    if (!motivo.trim()) {
      alert('Por favor ingresa un motivo para la cancelación.');
      return;
    }
    if (supabase) {
      const { error } = await supabase.from('citas').delete().eq('id', selectedCancel.id);
      if (error) { alert('Error al cancelar la cita'); console.error(error); return; }
      setCitas(prev => prev.filter(x => x.id !== selectedCancel.id));
    } else {
      setCitas(prev => prev.filter(x => x.id !== selectedCancel.id));
    }
    alert('Cita cancelada correctamente');
    setCancelOpen(false);
    setSelectedCancel(null);
  };

  return (
    <main className="citas-registradas">
      <header className="header">
        <h2>Gestión de Citas</h2>
        <p className="descripcion">Consulta los registros de citas agendadas.</p>
      </header>

      <div className="acciones-citas">
        <input
          className="input-busqueda"
          placeholder="Buscar por fecha o doctor..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
        <button className="boton-nuevo" onClick={() => navigate('/agendar-cita')}>+ Agendar Cita</button>
      </div>

      {loading ? (
        <div className="sin-datos-card">
          <p>Cargando...</p>
        </div>
      ) : filtradas.length === 0 ? (
        <div className="sin-datos-card">
          <p>📅 No hay citas registradas</p>
        </div>
      ) : (
        <div className="grid-citas">
          {filtradas.map(c => (
            <div key={c.id} className="card-cita">
              <h3>{c.doctor}</h3>
              <p><strong>Fecha:</strong> {c.fecha}</p>
              <p><strong>Hora:</strong> {c.hora}</p>
              <p><strong>Motivo:</strong> {c.motivo}</p>

              <div className="acciones-card">
                <button className="btn-ver" onClick={() => handleView(c)}>Ver</button>
                <button className="btn-eliminar" onClick={() => handleCancel(c)}>Cancelar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {detailOpen && (
        <DetailModal
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          item={detailItem}
          tableName="citas"
          fields={[ 'fecha', 'hora', 'doctor', 'motivo' ]}
        />
      )}

      <ModalCancelarCita
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onSubmit={submitCancel}
      />
    </main>
  );
};

export default CitasRegistradas;
