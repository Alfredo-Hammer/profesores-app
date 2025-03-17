import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { useNavigate, useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { LogOut, User } from "lucide-react";

const menuTitles = {
  "/": "📊 Dashboard",
  "/alumnos": "🎓 Alumnos",
  "/clases": "📚 Clases",
  "/tareas": "📝 Tareas",
  "/escuelas": "🏡 Escuelas",
  "/asistencias": "✅ Asistencias",
  "/calendario": "📅 Calendario",
  "/reportes": "📑 Reportes",
  "/configuracion": "Configuración",
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
    <header className="fixed top-0 left-[250px] w-[calc(100%-250px)] bg-transparent text-white flex justify-between items-center h-16 shadow-lg z-50 transition-all">
      <h1 className="text-xl font-bold px-6">{menuTitles[location.pathname] || "📊 Inicio"}</h1>
      <div className="flex items-center gap-4 px-6">
        <div className="flex items-center gap-2 bg-gray-700 p-2 rounded-lg">
          <User size={24} className="text-blue-400" />
          <span className="font-medium">{userName}</span>
        </div>
        <button onClick={handleLogout} className="text-red-500 hover:text-red-400">
          <LogOut size={28} />
        </button>
      </div>
    </header>
  );
};

export default Header;
