import React, { useEffect, useState } from 'react';
import supabase from '../../lib/supabaseClient';
import usuariosService from '../../services/usuarios';
import './style.css';

export default function AdminUsers() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('paciente');
  const [especialidad, setEspecialidad] = useState('optometra');
  const [loading, setLoading] = useState(false);
  // Roles permitidos según requerimiento
  const rolesExample = ['paciente', 'especialista', 'administrador'];
  const [message, setMessage] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!nombre || !email || !password) {
      setMessage('Completa nombre, correo y contraseña.');
      return;
    }
    setLoading(true);
    try {
      // Create auth user
      const { data, error: supError } = await supabase.auth.signUp({ email, password });
      if (supError) {
        setMessage('Error creando credenciales: ' + supError.message);
        setLoading(false);
        return;
      }
      const userId = data.user?.id;
      if (!userId) {
        // Possibly requires email confirmation; Supabase may not return user id immediately
        setMessage('Usuario creado. Verifica su correo para activar la cuenta.');
        setLoading(false);
        return;
      }

      // Create profile in usuarios table
    // Create profile in usuarios table (si es especialista, incluimos especialidad)
    await usuariosService.createUsuarioProfile({ id: userId, nombre, email, telefono, rol, especialidad: rol === 'especialista' ? especialidad : null });
  setMessage('Usuario creado correctamente con rol ' + rol);
  setNombre(''); setEmail(''); setTelefono(''); setPassword(''); setRol('paciente');
    } catch (err) {
      console.error('Error creando usuario', err);
      setMessage('Error creando usuario: ' + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const [usuarios, setUsuarios] = useState([]);

  const loadUsuarios = async () => {
    try {
      const rows = await usuariosService.listUsuarios();
      setUsuarios(rows || []);
    } catch (err) {
      console.error('Error loading usuarios', err);
    }
  };

  useEffect(() => { loadUsuarios(); }, []);

  const handleChangeRole = async (userId, newRole) => {
    try {
      await usuariosService.updateUsuarioRole(userId, newRole);
      await loadUsuarios();
    } catch (err) {
      console.error('Error updating role', err);
      setMessage('No fue posible actualizar el rol.');
    }
  };

  return (
    <div className="admin-users-page">
      <div className="admin-card">
        <h2>Panel de Usuarios (Admin)</h2>
        {message && <div className="form-info">{message}</div>}
        <form onSubmit={handleCreate}>
          <input className="form-input" placeholder="Nombre completo" value={nombre} onChange={(e)=>setNombre(e.target.value)} />
          <input className="form-input" type="email" placeholder="Correo" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input className="form-input" placeholder="Teléfono" value={telefono} onChange={(e)=>setTelefono(e.target.value)} />
          <input className="form-input" type="password" placeholder="Contraseña" value={password} onChange={(e)=>setPassword(e.target.value)} />
          <select className="form-input" value={rol} onChange={(e)=>setRol(e.target.value)}>
            {rolesExample.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
            {rol === 'especialista' && (
              <select className="form-input" value={especialidad} onChange={(e) => setEspecialidad(e.target.value)}>
                <option value="ortopedista">ortopedista</option>
                <option value="optometra">optometra</option>
              </select>
            )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear usuario'}</button>
          </div>
        </form>

        <hr style={{ margin: '18px 0' }} />
        <h3>Usuarios registrados</h3>
        <div>
          {usuarios.length === 0 && <div>No hay usuarios.</div>}
          {usuarios.map(u => (
            <div key={u.id} style={{ display:'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <div style={{ flex: 1 }}>{u.nombre} — {u.email}</div>
              <select value={u.rol} onChange={(e)=>handleChangeRole(u.id, e.target.value)}>
                {rolesExample.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
