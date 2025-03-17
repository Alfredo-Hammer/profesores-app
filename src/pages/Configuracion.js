import React, { useState, useEffect } from "react";
import { db, auth } from "../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getAuth, updatePassword } from "firebase/auth";

const ConfiguracionesPage = () => {
  const [perfil, setPerfil] = useState({ nombre: "", correo: "", foto: "", rol: "" });
  const [password, setPassword] = useState("");
  const [temaOscuro, setTemaOscuro] = useState(false);
  const [notificaciones, setNotificaciones] = useState(false);

  useEffect(() => {
    const cargarConfiguraciones = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.rol === "profesor") { // Solo cargar configuraciones si el usuario es profesor
            setPerfil({ nombre: data.nombre, correo: data.correo, foto: data.foto || "", rol: data.rol });
            setTemaOscuro(data.temaOscuro || false);
            setNotificaciones(data.notificaciones || false);
          }
        }
      }
    };
    cargarConfiguraciones();
  }, []);

  const actualizarPerfil = async () => {
    const user = auth.currentUser;
    if (user && perfil.rol === "profesor") {
      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, { ...perfil, temaOscuro, notificaciones });
      alert("Perfil actualizado");
    }
  };

  const cambiarContraseña = () => {
    const user = auth.currentUser;
    if (user && password) {
      updatePassword(user, password)
        .then(() => alert("Contraseña actualizada"))
        .catch(error => alert(error.message));
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto bg-gray-100 dark:bg-gray-900 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Configuraciones</h2>
      {perfil.rol === "profesor" ? (
        <>
          <label className="block mb-2 text-gray-700 dark:text-gray-300">Nombre:</label>
          <input
            type="text"
            value={perfil.nombre}
            onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })}
            className="w-full p-2 border rounded"
          />

          <label className="block mt-4 mb-2 text-gray-700 dark:text-gray-300">Correo:</label>
          <input type="email" value={perfil.correo} disabled className="w-full p-2 border rounded bg-gray-200" />

          <label className="block mt-4 mb-2 text-gray-700 dark:text-gray-300">Nueva Contraseña:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <button onClick={cambiarContraseña} className="mt-2 bg-blue-500 text-white px-4 py-2 rounded">Cambiar Contraseña</button>

          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={temaOscuro}
                onChange={() => setTemaOscuro(!temaOscuro)}
                className="mr-2"
              />
              Modo Oscuro
            </label>
            <label className="flex items-center mt-2">
              <input
                type="checkbox"
                checked={notificaciones}
                onChange={() => setNotificaciones(!notificaciones)}
                className="mr-2"
              />
              Notificaciones
            </label>
          </div>

          <button onClick={actualizarPerfil} className="mt-4 bg-green-500 text-white px-4 py-2 rounded">Guardar Configuración</button>
        </>
      ) : (
        <p className="text-red-500">No tienes permisos para acceder a esta configuración.</p>
      )}
    </div>
  );
};

export default ConfiguracionesPage;
