import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig"; // Configuración de Firebase
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebaseConfig";
import { toast } from "react-toastify";
import Header from "../components/Header";

const Turnos = () => {
  const [turnos, setTurnos] = useState([]);
  const [escuelas, setEscuelas] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [formData, setFormData] = useState({
    escuela: "",
    materia: "",
    dia: "",
    horaInicio: "",
    horaFin: "",
  });
  const [editingTurno, setEditingTurno] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [user] = useAuthState(auth);

  // Obtener escuelas asociadas al profesor
  useEffect(() => {
    const fetchEscuelas = async () => {
      if (!user) return;

      try {
        const q = query(collection(db, "escuelas"), where("profesorId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const escuelasData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setEscuelas(escuelasData);
      } catch (error) {
        console.error("Error al obtener las escuelas:", error);
        toast.error("No se pudieron cargar las escuelas");
      }
    };

    fetchEscuelas();
  }, [user]);

  // Obtener materias asociadas al profesor
  useEffect(() => {
    const fetchMaterias = async () => {
      if (!user) return;

      try {
        const q = query(collection(db, "materias"), where("profesorId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const materiasData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setMaterias(materiasData);
      } catch (error) {
        console.error("Error al obtener las materias:", error);
        toast.error("No se pudieron cargar las materias");
      }
    };

    fetchMaterias();
  }, [user]);

  // Obtener turnos asociados al profesor
  useEffect(() => {
    const fetchTurnos = async () => {
      if (!user) return;

      try {
        const q = query(collection(db, "turnos"), where("profesorId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        // Mapa para ordenar los días de la semana
        const diasSemana = {
          Lunes: 1,
          Martes: 2,
          Miércoles: 3,
          Jueves: 4,
          Viernes: 5,
          Sábado: 6,
          Domingo: 7,
        };

        // Obtener y ordenar los turnos
        const turnosData = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => diasSemana[a.dia] - diasSemana[b.dia]); // Ordenar por el día

        console.log("Turnos ordenados:", turnosData); // Verifica los turnos ordenados
        setTurnos(turnosData);
      } catch (error) {
        console.error("Error al obtener los turnos:", error);
        toast.error("No se pudieron cargar los turnos");
      }
    };

    fetchTurnos();
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("handleSubmit ejecutado"); // Verifica si esta línea aparece en la consola

    if (!user) {
      toast.error("Debes estar autenticado para realizar esta acción");
      return;
    }

    try {
      if (editingTurno) {
        // Actualizar turno existente
        await updateDoc(doc(db, "turnos", editingTurno.id), formData);
        toast.success("Turno actualizado correctamente");
        setTurnos((prev) =>
          prev.map((turno) =>
            turno.id === editingTurno.id ? { ...turno, ...formData } : turno
          )
        );
      } else {
        // Crear nuevo turno
        const docRef = await addDoc(collection(db, "turnos"), {
          ...formData,
          profesorId: user.uid,
        });
        console.log("Datos enviados a Firestore:", {
          ...formData,
          profesorId: user.uid,
        });
        toast.success("Turno guardado correctamente");
        setTurnos((prev) => [...prev, { id: docRef.id, ...formData, profesorId: user.uid }]);
      }

      setFormData({
        escuela: "",
        materia: "",
        dia: "",
        horaInicio: "",
        horaFin: "",
      });
      setShowForm(false);
      setEditingTurno(null);
    } catch (error) {
      console.error("Error al guardar el turno:", error);
      toast.error("No se pudo guardar el turno");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "turnos", id));
      setTurnos((prev) => prev.filter((turno) => turno.id !== id));
      toast.success("Turno eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar el turno:", error);
      toast.error("No se pudo eliminar el turno");
    }
  };

  const handleEdit = (turno) => {
    setFormData(turno);
    setEditingTurno(turno);
    setShowForm(true);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-6">
      <Header />
      <div className="w-full flex justify-end items-center mb-6 mt-6">
        <button
          onClick={() => {
            setShowForm(true);
            setEditingTurno(null);
            setFormData({
              escuela: "",
              materia: "",
              dia: "",
              horaInicio: "",
              horaFin: "",
            });
          }}
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
        >
          Crear Turno
        </button>
      </div>

      {turnos.length === 0 && !showForm ? (
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-4">No tienes turnos registrados.</p>
        </div>
      ) : showForm ? (
        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
          <h3 className="text-xl font-bold mb-4">{editingTurno ? "Editar Turno" : "Nuevo Turno"}</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-gray-300">Escuela</label>
              <select
                name="escuela"
                className="w-full p-3 rounded bg-gray-700"
                value={formData.escuela}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar Escuela</option>
                {escuelas.map((escuela) => (
                  <option key={escuela.id} value={escuela.nombre}>
                    {escuela.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300">Materia</label>
              <select
                name="materia"
                className="w-full p-3 rounded bg-gray-700"
                value={formData.materia}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar Materia</option>
                {materias.map((materia) => (
                  <option key={materia.id} value={materia.nombre}>
                    {materia.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300">Día</label>
              <select
                name="dia"
                className="w-full p-3 rounded bg-gray-700"
                value={formData.dia}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar Día</option>
                <option value="Lunes">Lunes</option>
                <option value="Martes">Martes</option>
                <option value="Miércoles">Miércoles</option>
                <option value="Jueves">Jueves</option>
                <option value="Viernes">Viernes</option>
                <option value="Sábado">Sábado</option>
                <option value="Domingo">Domingo</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300">Hora de Inicio</label>
              <input
                type="time"
                name="horaInicio"
                className="w-full p-3 rounded bg-gray-700"
                value={formData.horaInicio}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-gray-300">Hora de Fin</label>
              <input
                type="time"
                name="horaFin"
                className="w-full p-3 rounded bg-gray-700"
                value={formData.horaFin}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="flex justify-end mt-6 space-x-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
            >
              {editingTurno ? "Actualizar" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingTurno(null);
                setFormData({
                  escuela: "",
                  materia: "",
                  dia: "",
                  horaInicio: "",
                  horaFin: "",
                });
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
          {turnos.map((turno) => (
            <div key={turno.id} className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold mb-2">{turno.materia}</h3>
              <p className="text-gray-400 mb-2">
                <strong>Escuela:</strong> {turno.escuela}
              </p>
              <p className="text-gray-400 mb-2">
                <strong>Día:</strong> {turno.dia}
              </p>
              <p className="text-gray-300">
                <strong>Hora:</strong> {turno.horaInicio} - {turno.horaFin}
              </p>
              <div className="flex justify-end mt-4 space-x-2">
                <button
                  onClick={() => handleEdit(turno)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded transition"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(turno.id)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded transition"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Turnos;