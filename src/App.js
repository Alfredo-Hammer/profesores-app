import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Alumnos from "./pages/Alumnos";
import Materias from "./pages/Materias";
import Clases from "./pages/Clases";
import Tareas from "./pages/Tareas";
import Asistencias from "./pages/Asistencias";
import Calendario from "./pages/Calendario";
import Reportes from "./pages/Reportes";
import Configuracion from "./pages/Configuracion";
import Escuelas from "./pages/Escuelas";
import Login from "./pages/Login";
import Grados from "./pages/Grados";
import Turnos from "./pages/Turnos";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import { auth } from "./firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Calificaciones from "./pages/Calificaciones";
import CalificarAlumno from "./pages/CalificarAlumno";
import SabanaNotas from "./pages/SabanaNotas";

function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) return <div className="text-white text-center mt-10">Cargando...</div>;

  return (
    <div>
      <ToastContainer />
      <Router>
        <Routes>
          {/* Si no hay usuario autenticado, redirige al login */}
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />

          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rutas protegidas */}
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/alumnos" element={<ProtectedRoute><Layout><Alumnos /></Layout></ProtectedRoute>} />
          <Route path="/grados" element={<ProtectedRoute><Layout> <Grados /></Layout></ProtectedRoute>} />
          <Route path="/materias" element={<ProtectedRoute><Layout><Materias /></Layout></ProtectedRoute>} />
          <Route path="/clases" element={<ProtectedRoute><Layout><Clases /></Layout></ProtectedRoute>} />
          <Route path="/escuelas" element={<ProtectedRoute><Layout><Escuelas /></Layout></ProtectedRoute>} />
          <Route path="/turnos" element={<ProtectedRoute><Layout> <Turnos /> </Layout></ProtectedRoute>} />
          <Route path="/calificaciones" element={<ProtectedRoute><Layout><Calificaciones /></Layout></ProtectedRoute>} />
          <Route path="/sabananotas" element={<ProtectedRoute><Layout><SabanaNotas /></Layout></ProtectedRoute>} />
          <Route path="/calificar/:id" element={<CalificarAlumno />} />
          <Route path="/tareas" element={<ProtectedRoute><Layout><Tareas /></Layout></ProtectedRoute>} />
          <Route path="/asistencias" element={<ProtectedRoute><Layout><Asistencias /></Layout></ProtectedRoute>} />
          <Route path="/calendario" element={<ProtectedRoute><Layout><Calendario /></Layout></ProtectedRoute>} />
          <Route path="/reportes" element={<ProtectedRoute><Layout><Reportes /></Layout></ProtectedRoute>} />
          <Route path="/configuracion" element={<ProtectedRoute><Layout><Configuracion /></Layout></ProtectedRoute>} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
