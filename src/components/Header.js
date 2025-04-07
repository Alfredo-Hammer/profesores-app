import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { useNavigate, useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { LogOut, User } from "lucide-react";

const menuTitles = {
  "/": "📊 Dashboard",
  "/alumnos": "🎓 Alumnos",
  "/grados": "🏫 Grados",
  "/materias": "📖 Gestión de Materias",
  "/clases": "📚 Clases",
  "/tareas": "📝 Tareas",
  "/escuelas": "🏡 Escuelas",
  "/turnos": "⏰ Turnos",
  "/calificaciones": "📊 Calificaciones",
  "/sabananotas": "📋 Sábana de Notas",
  "/asistencias": "✅ Asistencias",
  "/calendario": "📅 Calendario",
  "/reportes": "📑 Reportes",
  "/configuracion": "⚙️ Configuración",
};

const Header = () => {
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserName(userDoc.data().nombre);
        }
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  return (
    <header className="hidden md:flex fixed top-0 left-0 w-full bg-gray-800 bg-opacity-90 text-white justify-between items-center h-16 shadow-lg z-50 px-4 md:px-6">
      {/* Título dinámico */}
      <h1 className="text-lg md:text-xl font-bold">{menuTitles[location.pathname] || "📊 Inicio"}</h1>

      {/* Contenedor de usuario y logout */}
      <div className="flex items-center gap-4">
        {/* Información del usuario */}
        <div className="flex items-center gap-2 bg-gray-700 p-2 rounded-lg">
          <User size={24} className="text-blue-400" />
          <span className="font-medium hidden sm:block">{userName}</span>
        </div>

        {/* Botón de logout */}
        <button
          onClick={handleLogout}
          className="text-red-500 hover:text-red-400 transition"
        >
          <LogOut size={28} />
        </button>
      </div>
    </header>
  );
};

export default Header;
