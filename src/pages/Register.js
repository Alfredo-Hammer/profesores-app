import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { collection, query, where, getDocs } from "firebase/firestore";
import { toast } from "react-toastify";

const esEmailValido = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const esEmailUnico = async (email) => {
  const q = query(collection(db, "users"), where("email", "==", email));
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty; // Retorna `true` si el email no existe
};

const Register = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    escuela: "",
    role: "alumno", // Valor por defecto
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const { nombre, apellido, email, password, escuela, role } = formData;

    if (!nombre || !apellido || !email || !password || !escuela || !role) {
      toast.error("Todos los campos son obligatorios");
      return;
    }

    if (!["profesor", "alumno", "padre"].includes(role)) {
      toast.error("Rol inválido seleccionado");
      return;
    }

    console.log("Datos del formulario:", formData);

    try {
      // Crear el usuario en Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Guardar los datos del usuario en la colección "users"
      await setDoc(doc(db, "users", user.uid), {
        nombre,
        apellido,
        email,
        escuela,
        role,
        createdAt: new Date(),
      });

      toast.success("Usuario registrado correctamente");
      localStorage.setItem("role", role);

      // Redirigir al dashboard
      navigate("/dashboard");
      window.location.reload();
    } catch (error) {
      toast.error("Error al registrar usuario");
      console.error("Error al registrar:", error);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-[800px] max-w-xl">
        <h2 className="text-2xl font-bold text-center mb-6">Registro</h2>
        <p className="text-gray-400 text-sm mb-4 text-center pb-3">
          Sistema de Registro para la Plataforma Educativa
        </p>

        <form onSubmit={handleRegister}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300">Nombre</label>
              <input
                type="text"
                name="nombre"
                className="w-full p-3 rounded bg-gray-700"
                placeholder="Tu nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-gray-300">Apellido</label>
              <input
                type="text"
                name="apellido"
                className="w-full p-3 rounded bg-gray-700"
                placeholder="Tu apellido"
                value={formData.apellido}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-gray-300">Correo Electrónico</label>
              <input
                type="email"
                name="email"
                className="w-full p-3 rounded bg-gray-700"
                placeholder="tuemail@ejemplo.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-gray-300">Contraseña</label>
              <input
                type="password"
                name="password"
                className="w-full p-3 rounded bg-gray-700"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-gray-300">Nombre de la Escuela</label>
              <input
                type="text"
                name="escuela"
                className="w-full p-3 rounded bg-gray-700"
                placeholder="Nombre de tu escuela"
                value={formData.escuela}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-gray-300">Rol</label>
              <select
                name="role"
                className="w-full p-3 rounded bg-gray-700 mb-6"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="profesor">Profesor</option>
                <option value="alumno">Alumno</option>
                <option value="padre">Padre</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition"
          >
            Registrarse
          </button>
        </form>

        <p className="text-center text-gray-400 mt-4">
          ¿Ya tienes una cuenta?{" "}
          <a href="/login" className="text-blue-400 hover:underline">
            Inicia sesión aquí
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;
