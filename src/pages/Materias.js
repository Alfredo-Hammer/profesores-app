import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebaseConfig";
import Header from "../components/Header";
import { toast } from "react-toastify";

const Materias = () => {
  const [user] = useAuthState(auth);
  const [escuelas, setEscuelas] = useState([]);
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [selectedEscuela, setSelectedEscuela] = useState(null);
  const [selectedGrado, setSelectedGrado] = useState(null);
  const [selectedSeccion, setSelectedSeccion] = useState(null);
  const [turnos, setTurnos] = useState([]);
  const [selectedAlumno, setSelectedAlumno] = useState(null);

  const [materiaForm, setMateriaForm] = useState({ nombre: "", descripcion: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [editingMateriaId, setEditingMateriaId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchEscuelas = async () => {
      if (!user) return;

      try {
        const escuelasQuery = query(collection(db, "escuelas"), where("profesorId", "==", user.uid));
        const escuelasSnapshot = await getDocs(escuelasQuery);
        const escuelasData = escuelasSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEscuelas(escuelasData);

        if (escuelasData.length === 1) {
          setSelectedEscuela(escuelasData[0]);
        }
      } catch (error) {
        console.error("Error al obtener las escuelas:", error);
      }
    };

    fetchEscuelas();
  }, [user]);

  useEffect(() => {
    const fetchGradosYTurnos = async () => {
      if (!selectedEscuela) return;

      try {
        const gradosQuery = query(
          collection(db, "grados"),
          where("profesorId", "==", user.uid),
          where("escuela", "==", selectedEscuela.nombre)
        );
        const gradosSnapshot = await getDocs(gradosQuery);
        const gradosData = gradosSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setGrados(gradosData);

        const turnosUnicos = [
          ...new Set(gradosData.map((grado) => grado.turno).filter(Boolean)),
        ];
        setTurnos(turnosUnicos);

        if (gradosData.length === 1) {
          setSelectedGrado(gradosData[0]);
        }
      } catch (error) {
        console.error("Error al obtener los grados y turnos:", error);
      }
    };

    fetchGradosYTurnos();
  }, [selectedEscuela, user]);

  useEffect(() => {
    if (selectedGrado) {
      setSecciones(selectedGrado.secciones || []);
      if (selectedGrado.secciones && selectedGrado.secciones.length === 1) {
        setSelectedSeccion(selectedGrado.secciones[0]);
      }
    }
  }, [selectedGrado]);

  useEffect(() => {
    const fetchMaterias = async () => {
      if (!selectedGrado || !user) return;

      try {
        setMaterias([]);
        const materiasQuery = query(
          collection(db, "materias"),
          where("gradoId", "==", selectedGrado.id),
          where("profesorId", "==", user.uid)
        );
        const materiasSnapshot = await getDocs(materiasQuery);
        const materiasData = materiasSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMaterias(materiasData);
      } catch (error) {
        console.error("Error al obtener las materias:", error);
      }
    };

    fetchMaterias();
  }, [selectedGrado, user]);

  const handleCreateMateria = async () => {
    if (!selectedGrado || !user || !selectedEscuela) return;

    try {
      const newMateria = {
        ...materiaForm,
        turno: selectedGrado.turno || "Matutino",
        alumnoId: selectedAlumno ? selectedAlumno.id : null,
        profesorId: user.uid,
        escuelaId: selectedEscuela.id,
        gradoId: selectedGrado.id,
        nombreGrado: selectedGrado.grado,
        nombreEscuela: selectedEscuela.nombre,
        createdAt: new Date(),
      };

      const materiasRef = collection(db, "materias");
      const docRef = await addDoc(materiasRef, newMateria);

      setMaterias((prevMaterias) => [...prevMaterias, { id: docRef.id, ...newMateria }]);

      setMateriaForm({ nombre: "", descripcion: "", turno: "" });
      setIsModalOpen(false);
      toast.success("Materia creada exitosamente.");
    } catch (error) {
      console.error("Error al crear la materia:", error);
      toast.error("Error al crear la materia.");
    }
  };

  const handleEditMateria = async () => {
    if (!editingMateriaId) return;

    try {
      const materiaRef = doc(db, "materias", editingMateriaId);
      await updateDoc(materiaRef, {
        nombre: materiaForm.nombre,
        descripcion: materiaForm.descripcion,
      });

      setMaterias(
        materias.map((materia) =>
          materia.id === editingMateriaId
            ? { ...materia, ...materiaForm }
            : materia
        )
      );

      setMateriaForm({ nombre: "", descripcion: "", turno: "" });
      setIsEditing(false);
      setEditingMateriaId(null);
      setIsModalOpen(false);
      toast.success("Materia actualizada exitosamente.");
    } catch (error) {
      console.error("Error al editar la materia:", error);
      toast.error("Error al editar la materia.");
    }
  };

  const handleDeleteMateria = async (materiaId) => {
    try {
      const materiaRef = doc(db, "materias", materiaId);
      await deleteDoc(materiaRef);

      setMaterias(materias.filter((materia) => materia.id !== materiaId));
      toast.success("Materia eliminada exitosamente.");
    } catch (error) {
      console.error("Error al eliminar la materia:", error);
      toast.error("Error al eliminar la materia.");
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-6">
      <Header />
      <div className="w-full text-center mb-6">
        <h1 className="text-3xl font-bold text-purple-400">Gestión de Materias</h1>
        <p className="text-gray-400">Consulta las materias organizadas por escuela, grado y sección.</p>
      </div>

      {!selectedEscuela ? (
        <div className="w-full">
          <h2 className="text-2xl font-bold text-purple-400 mb-4">Escuelas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {escuelas.map((escuela) => (
              <div
                key={escuela.id}
                className="bg-gray-800 p-6 rounded-lg shadow-lg border-2 border-gray-700 hover:border-purple-500 transition"
              >
                <h3 className="text-xl font-bold text-purple-400 mb-3 text-center">{escuela.nombre}</h3>
                <p className="text-gray-400 mb-2">
                  <strong>Dirección:</strong> {escuela.direccion || "Sin dirección"}
                </p>
                <button
                  onClick={() => setSelectedEscuela(escuela)}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
                >
                  Ver Grados
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {selectedEscuela && !selectedGrado ? (
        <div className="w-full">
          <h2 className="text-2xl font-bold text-purple-400 mb-4">Grados en {selectedEscuela.nombre}</h2>
          <button
            onClick={() => setSelectedEscuela(null)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md mb-4"
          >
            Volver a Escuelas
          </button>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {grados.map((grado) => (
              <div
                key={grado.id}
                className="bg-gray-800 p-6 rounded-lg shadow-lg border-2 border-gray-700 hover:border-purple-500 transition flex flex-col justify-between"
              >
                <h3 className="text-xl font-bold text-purple-400 mb-3 text-center">{grado.grado}</h3>
                <p className="text-gray-400 mb-2">
                  <strong>Nivel Educativo:</strong> {grado.nivelEducativo}
                </p>
                <p className="text-gray-400 mb-2">
                  <strong>Secciones:</strong> {grado.secciones ? grado.secciones.join(", ") : "No especificado"}
                </p>
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => setSelectedGrado(grado)}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md"
                  >
                    Ver Materias
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {selectedGrado && (
        <div className="w-full">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setSelectedGrado(null)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
            >
              Volver a Grados
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md"
            >
              Crear Materia
            </button>
          </div>
          <h2 className="text-2xl font-bold text-purple-400 mb-4">
            Materias en el Grado {selectedGrado.grado}
          </h2>
          {materias.length === 0 ? (
            <p className="text-gray-400 text-center mt-4">No hay materias disponibles en este grado.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {materias.map((materia) => (
                <div
                  key={materia.id}
                  className="bg-gray-800 p-6 rounded-lg shadow-lg border-2 border-gray-700 hover:border-purple-500 transition"
                >
                  <h3 className="text-xl font-bold text-purple-400 mb-3 text-center">
                    {materia.nombre}
                  </h3>
                  <p className="text-gray-400 mb-2">{materia.descripcion}</p>
                  <p className="text-gray-400 mb-2">
                    <strong>Grado:</strong> {materia.nombreGrado || "No especificado"}
                  </p>
                  <p className="text-gray-400 mb-2">
                    <strong>Escuela:</strong> {materia.nombreEscuela || "No especificado"}
                  </p>
                  <div className="flex justify-between">
                    <button
                      onClick={() => {
                        setMateriaForm({
                          nombre: materia.nombre,
                          descripcion: materia.descripcion,
                        });
                        setIsEditing(true);
                        setEditingMateriaId(materia.id);
                        setIsModalOpen(true);
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteMateria(materia.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-xl font-bold text-purple-400 mb-4">
              {isEditing ? "Editar Materia" : "Crear Materia"}
            </h3>
            <input
              type="text"
              placeholder="Nombre de la materia"
              value={materiaForm.nombre}
              onChange={(e) =>
                setMateriaForm({ ...materiaForm, nombre: e.target.value })
              }
              className="w-full p-2 mb-4 border border-gray-700 rounded bg-gray-900 text-white"
            />
            <textarea
              placeholder="Descripción de la materia"
              value={materiaForm.descripcion}
              onChange={(e) =>
                setMateriaForm({ ...materiaForm, descripcion: e.target.value })
              }
              className="w-full p-2 mb-4 border border-gray-700 rounded bg-gray-900 text-white"
            ></textarea>

            <div className="flex justify-end">
              <button
                onClick={isEditing ? handleEditMateria : handleCreateMateria}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
              >
                {isEditing ? "Guardar Cambios" : "Crear Materia"}
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded ml-4"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Materias;
