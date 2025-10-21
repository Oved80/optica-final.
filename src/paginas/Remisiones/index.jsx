import React from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../lib/supabaseClient';
import './style.css';
import ModalEdit from '../../Componentes/ModalEdit';
import DetailModal from '../../Componentes/DetailModal';

const Remisiones = () => {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = React.useState('');
  const [remisiones, setRemisiones] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // No hardcoded test data — show real results or empty state

  React.useEffect(() => {
    let mounted = true;

    const fetchRemisiones = async () => {
      if (!supabase) {
        // Si no hay cliente (dev sin .env), simplemente mostramos lista vacía
        if (mounted) {
          setRemisiones([]);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase.from('remisiones').select('*').order('fecha', { ascending: false });
        if (error) {
          console.error('Error cargando remisiones:', error);
          if (mounted) setRemisiones([]);
        } else {
          if (mounted) setRemisiones(data || []);
        }
      } catch (err) {
        console.error('Excepción al cargar remisiones:', err);
        if (mounted) setRemisiones([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchRemisiones();

    return () => {
      mounted = false;
    };
  }, []);

  const filtradas = remisiones.filter((r) => {
    if (!busqueda) return true;
    const b = busqueda.toLowerCase();
    return (
      (r.nombre && r.nombre.toLowerCase().includes(b)) ||
      (r.especialidad && r.especialidad.toLowerCase().includes(b)) ||
      (r.motivo && r.motivo.toLowerCase().includes(b))
    );
  });

  // Modal state
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailItem, setDetailItem] = React.useState(null);

  const handleEdit = (r) => {
    setSelected(r);
    setModalOpen(true);
  };

  const handleView = (r) => {
    setDetailItem(r);
    setDetailOpen(true);
  };

  const handleSaved = ({ action, item, id }) => {
    if (action === 'saved') {
      setRemisiones((prev) => prev.map((p) => (p.id === item.id ? item : p)));
    } else if (action === 'deleted') {
      setRemisiones((prev) => prev.filter((p) => p.id !== id));
    }
  };

  if (loading) {
    return (
      <main className="pacientes">
        <header className="header">
          <h2>Cargando remisiones...</h2>
        </header>
      </main>
    );
  }

  return (
    <main className="pacientes">
      <header className="header">
        <h2>Gestión de Remisiones</h2>
        <p className="descripcion">Consulta los registros de remisiones realizadas.</p>
      </header>

      <div className="acciones-pacientes">
        <input
          type="text"
          placeholder="Buscar por nombre, especialidad o motivo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input-busqueda"
        />

        <div className="botones-filtro">
          <button className="boton-filtro activo">Todos</button>
          <button className="boton-filtro">Pendientes</button>
          <button className="boton-filtro">Enviadas</button>
        </div>

  <button className="boton-nuevo" onClick={() => navigate('/nuevo-remision')}>+ Nueva Remisión</button>
      </div>

      {filtradas.length === 0 ? (
        <div className="sin-datos-card">
          <p>🧾 No hay remisiones registradas</p>
        </div>
      ) : (
        <div className="grid-pacientes">
          {filtradas.map((r, index) => (
            <div key={r.id ?? index} className="card-paciente">
              <h3>{r.nombre}</h3>
              <p><strong>Fecha:</strong> {r.fecha}</p>
              <p><strong>Especialidad:</strong> {r.especialidad}</p>
              <p><strong>Motivo:</strong> {r.motivo}</p>

              <div className="acciones-card">
                <button className="btn-ver" onClick={() => handleView(r)}>Ver</button>
                <button className="btn-editar" onClick={() => handleEdit(r)}>Editar</button>
                <button className="btn-eliminar" onClick={async () => {
                  if (!confirm('¿Eliminar remisión?')) return;
                  if (supabase) {
                    const { error } = await supabase.from('remisiones').delete().eq('id', r.id);
                    if (error) { console.error(error); alert('Error al eliminar'); return; }
                    setRemisiones((prev) => prev.filter(p => p.id !== r.id));
                  } else {
                    setRemisiones((prev) => prev.filter(p => p.id !== r.id));
                  }
                }}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="paginacion">
        <button>Anterior</button>
        <span>1</span>
        <button>Siguiente</button>
      </div>
      {modalOpen && (
        <ModalEdit
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          item={selected}
          tableName="remisiones"
          fields={[ 'nombre', 'fecha', 'especialidad', 'motivo', 'estado' ]}
          onSaved={handleSaved}
        />
      )}
      {detailOpen && (
        <DetailModal
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          item={detailItem}
          tableName="remisiones"
          fields={[ 'nombre', 'fecha', 'especialidad', 'motivo', 'estado' ]}
          onSaved={(res) => { handleSaved(res); setDetailOpen(false); }}
        />
      )}
    </main>
  );
};

export default Remisiones;


