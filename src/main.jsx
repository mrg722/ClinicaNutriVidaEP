
import React from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import App from './App.jsx';

// Este es el único punto donde React toma el control del documento. Importo primero el CSS de
// Bootstrap y después mis estilos, porque el orden decide cuál gana: así mis reglas pueden
// ajustar lo que trae Bootstrap y no al revés.
// Envuelvo la aplicación en StrictMode porque en desarrollo monta los componentes dos veces y
// eso delata los efectos mal escritos; en la versión compilada no se ejecuta.
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
