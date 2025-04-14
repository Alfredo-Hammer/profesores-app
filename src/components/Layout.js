import React, { useState } from "react";
import { auth } from "../firebaseConfig";
import { Link, useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  BookOpen,
  FileText,
  CheckSquare,
  Calendar,
  BarChart,
  Settings,
  School,
  GraduationCap,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false); // Estado para colapsar/expandir el sidebar
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-200">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full bg-gray-800 text-white h-16 flex items-center px-4 z-50 shadow-md">
        <h1 className="text-lg font-bold">Bilwi Teacher</h1>
      </header>

      {/* Botón para abrir/cerrar la sidebar en pantallas pequeñas */}
      <button
        className="absolute top-4 left-4 z-50 md:hidden bg-gray-800 text-white p-2 rounded-md"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full ${isCollapsed ? "w-16" : "w-64"
          } bg-gray-800 p-5 shadow-lg transform transition-transform duration-300 z-40 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 md:static md:block overflow-y-auto`}
      >
        {/* Botón para colapsar/expandir el sidebar */}
        <button
          className="absolute top-20 right-4 bg-gray-700 text-white p-2 rounded-md hidden md:block z-50"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>

        {/* Título del sidebar */}
        {!isCollapsed && (
          <h2 className="text-2xl font-bold text-white mb-5">Bilwi Teacher</h2>
        )}

        {/* Menú del sidebar */}
        <ul className="space-y-3 text-gray-300">
          <MenuItem
            to="/"
            icon={<Home size={20} className="text-blue-400" />}
            text="Inicio"
            isCollapsed={isCollapsed}
          />

          <MenuItem
            to="/escuelas"
            icon={<School size={20} className="text-teal-400" />}
            text="Escuelas"
            isCollapsed={isCollapsed}
          />

          <MenuItem
            to="/materias"
            icon={<BookOpen size={20} className="text-purple-400" />}
            text="Materias"
            isCollapsed={isCollapsed}
          />

          <MenuItem
            to="/grados"
            icon={<GraduationCap size={20} className="text-gray-300" />}
            text="Grados"
            isCollapsed={isCollapsed}
          />

          {/* <MenuItem
            to="/clases"
            icon={<School size={20} className="text-yellow-400" />}
            text="Clases"
            isCollapsed={isCollapsed}
          /> */}
          <MenuItem
            to="/turnos"
            icon={<Clock size={20} className="text-purple-400" />}
            text="Turnos"
            isCollapsed={isCollapsed}
          />
          <MenuItem
            to="/alumnos"
            icon={<Users size={20} className="text-green-400" />}
            text="Alumnos"
            isCollapsed={isCollapsed}
          />
          <MenuItem
            to="/calificaciones"
            icon={<BarChart size={20} className="text-pink-400" />}
            text="Calificaciones"
            isCollapsed={isCollapsed}
          />
          <MenuItem
            to="/sabananotas"
            icon={<BookOpen size={20} className="text-green-400" />}
            text="Sábana de Notas"
            isCollapsed={isCollapsed}
          />
          <MenuItem
            to="/tareas"
            icon={<FileText size={20} className="text-orange-400" />}
            text="Tareas"
            isCollapsed={isCollapsed}
          />
          <MenuItem
            to="/asistencias"
            icon={<CheckSquare size={20} className="text-red-400" />}
            text="Asistencias"
            isCollapsed={isCollapsed}
          />
          <MenuItem
            to="/calendario"
            icon={<Calendar size={20} className="text-indigo-400" />}
            text="Calendario"
            isCollapsed={isCollapsed}
          />
          <MenuItem
            to="/reportes"
            icon={<FileText size={20} className="text-cyan-400" />}
            text="Reportes"
            isCollapsed={isCollapsed}
          />
          <MenuItem
            to="/configuracion"
            icon={<Settings size={20} className="text-gray-400" />}
            text="Configuración"
            isCollapsed={isCollapsed}
          />
        </ul>

        {/* Botón de logout en el sidebar */}
        <div className="mt-10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-500 hover:text-red-400 transition w-full p-2 rounded-md"
          >
            <LogOut size={20} />
            {!isCollapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 p-5 overflow-y-auto mt-16">{children}</div>
    </div>
  );
};

// Componente reutilizable para los ítems del menú
const MenuItem = ({ to, icon, text, isCollapsed }) => {
  return (
    <li className="relative group">
      <Link
        to={to}
        className="flex items-center space-x-3 p-2 cursor-pointer hover:bg-gray-700 rounded-md transition group"
      >
        <span>{icon}</span>
        {!isCollapsed && <span className="text-gray-300 group-hover:text-white">{text}</span>}
      </Link>
      {/* Tooltip */}
      {isCollapsed && (
        <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-gray-700 text-white text-sm px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition">
          {text}
        </div>
      )}
    </li>
  );
};

export default Layout;
