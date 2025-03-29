import React from "react";
import { Link } from "react-router-dom";
import { Home, Users, BookOpen, FileText, CheckSquare, Calendar, BarChart, Settings, School } from "lucide-react";
const Layout = ({ children }) => {

  return (
    <div className="flex h-screen bg-gray-900 text-gray-200">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 p-5 shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-5">Bilwi Teacher</h2>
        <ul className="space-y-4">
          <MenuItem to="/" icon={<Home size={20} />} text="Dashboard" />
          <MenuItem to="/alumnos" icon={<Users size={20} />} text="Alumnos" />
          <MenuItem to="/materias" icon={<BookOpen size={20} />} text="Materias" />
          <MenuItem to="/clases" icon={<BookOpen size={20} />} text="Clases" />
          <MenuItem to="/escuelas" icon={<School size={20} />} text="Escuelas" />
          <MenuItem to="/tareas" icon={<FileText size={20} />} text="Tareas" />
          <MenuItem to="/asistencias" icon={<CheckSquare size={20} />} text="Asistencias" />
          <MenuItem to="/calendario" icon={<Calendar size={20} />} text="Calendario" />
          <MenuItem to="/reportes" icon={<BarChart size={20} />} text="Reportes" />
          <MenuItem to="/configuracion" icon={<Settings size={20} />} text="Configuración" />
        </ul>

      </div>

      {/* Contenido Principal */}
      <div className="flex-1 p-5">{children}</div>
    </div>
  );
};

// Componente reutilizable para los ítems del menú
const MenuItem = ({ to, icon, text }) => {
  return (
    <li>
      <Link to={to} className="flex items-center space-x-3 p-2 cursor-pointer hover:bg-gray-700 rounded-md transition">
        {icon}
        <span>{text}</span>
      </Link>
    </li>
  );
};

export default Layout;
