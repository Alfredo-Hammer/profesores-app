import React, { useState } from "react";
import { auth, db } from "../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { Dialog } from "@headlessui/react";

const CrearClaseModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    horario: "",
    ubicacion: "",
    capacidad: "",
    materia: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGuardarClase = async (e) => {
    e.preventDefault();
    const profesorId = auth.currentUser?.uid;

    if (!profesorId) {
      console.error("Usuario no autenticado.");
      return;
    }

    try {
      await addDoc(collection(db, "clases"), {
        ...formData,
        profesorId,
        createdAt: new Date(),
      });

      setFormData({
        nombre: "",
        descripcion: "",
        horario: "",
        ubicacion: "",
        capacidad: "",
        materia: "",
      });

      onClose();
    } catch (error) {
      console.error("Error al guardar clase:", error);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-[400px]">
        <h2 className="text-xl font-bold mb-4">Crear Clase</h2>
        <form onSubmit={handleGuardarClase} className="space-y-3">
          <input type="text" name="nombre" placeholder="Nombre de la Clase" value={formData.nombre} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded" required />
          <textarea name="descripcion" placeholder="Descripción" value={formData.descripcion} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded" required />
          <input type="text" name="horario" placeholder="Día y Horario (Ej: Lunes 10:00 AM)" value={formData.horario} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded" required />
          <input type="text" name="ubicacion" placeholder="Ubicación (Aula o Virtual)" value={formData.ubicacion} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded" required />
          <input type="number" name="capacidad" placeholder="Capacidad Máxima" value={formData.capacidad} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded" required />
          <input type="text" name="materia" placeholder="Materia o Asignatura" value={formData.materia} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded" required />

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="bg-gray-600 px-4 py-2 rounded">Cancelar</button>
            <button type="submit" className="bg-blue-600 px-4 py-2 rounded">Guardar</button>
          </div>
        </form>
      </div>
    </Dialog>
  );
};

export default CrearClaseModal;
