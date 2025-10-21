import React from 'react';
import { useNavigate } from 'react-router-dom';
import './style.css';

const Citas = () => {
  const navigate = useNavigate();
  return (
    <main className="citas">
      <div className="citas-center">
        <button className="big-btn" onClick={() => navigate('/citas-registradas')}>🔹 Ver Citas Agendadas</button>
        <button className="big-btn" onClick={() => navigate('/agendar-cita')}>🔹 Agendar Nueva Cita</button>
      </div>
    </main>
  );
};

export default Citas;
