import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig"; // Configuración de Firebase
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebaseConfig";
import { toast } from "react-toastify";
import Header from "../components/Header";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Turnos = () => {
  const [turnos, setTurnos] = useState([]);
  const [escuelas, setEscuelas] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [materiasFiltradas, setMateriasFiltradas] = useState([]);
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [formData, setFormData] = useState({
    escuela: "",
    grado: "",
    materia: "",
    seccion: "",
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
        toast.error("No se pudieron cargar las materias");
      }
    };

    fetchMaterias();
  }, [user]);

  // Filtrar materias por grado y escuela seleccionados
  useEffect(() => {
    if (!formData.grado || !formData.escuela) {
      setMateriasFiltradas([]);
      return;
    }

    const escuelaSeleccionada = escuelas.find(
      (escuela) => escuela.nombre === formData.escuela
    );

    if (!escuelaSeleccionada) {
      setMateriasFiltradas([]);
      return;
    }

    const gradoSeleccionado = grados.find(
      (grado) => grado.grado === formData.grado
    );

    if (!gradoSeleccionado) {
      setMateriasFiltradas([]);
      return;
    }

    const filtradas = materias.filter(
      (materia) =>
        materia.gradoId === gradoSeleccionado.id &&
        materia.escuelaId === escuelaSeleccionada.id
    );
    setMateriasFiltradas(filtradas);
  }, [formData.grado, formData.escuela, materias, escuelas, grados]);

  // Obtener grados asociados a la escuela seleccionada
  useEffect(() => {
    const fetchGrados = async () => {
      if (!formData.escuela) {
        setGrados([]); // Limpiar grados si no hay escuela seleccionada
        return;
      }

      try {
        const q = query(collection(db, "grados"), where("escuela", "==", formData.escuela));
        const querySnapshot = await getDocs(q);
        const gradosData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setGrados(gradosData);
      } catch (error) {
        toast.error("No se pudieron cargar los grados");
      }
    };

    fetchGrados();
  }, [formData.escuela]);

  // Obtener secciones asociadas al grado seleccionado
  useEffect(() => {
    if (!formData.grado) {
      setSecciones([]);
      return;
    }

    const gradoSeleccionado = grados.find((grado) => grado.grado === formData.grado);
    console.log("Grado seleccionado:", gradoSeleccionado); // Depuración
    setSecciones(gradoSeleccionado?.secciones || []);
  }, [formData.grado, grados]);

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

  useEffect(() => {
    const fetchMateriasFiltradas = async () => {
      if (!formData.grado || !formData.escuela) {
        setMateriasFiltradas([]);
        return;
      }

      try {
        // Obtener el grado seleccionado
        const gradoSeleccionado = grados.find((grado) => grado.grado === formData.grado);

        if (!gradoSeleccionado || !gradoSeleccionado.materias) {
          setMateriasFiltradas([]);
          return;
        }

        // Filtrar las materias del profesor según el array `materias[]` del grado
        const materiasFiltradas = materias.filter((materia) =>
          gradoSeleccionado.materias.includes(materia.id)
        );

        setMateriasFiltradas(materiasFiltradas);
      } catch (error) {
        console.error("Error al filtrar las materias:", error);
        toast.error("No se pudieron filtrar las materias.");
      }
    };

    fetchMateriasFiltradas();
  }, [formData.grado, materias, grados]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "escuela") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        grado: "",
        materia: "",
        seccion: "",
      }));
      return;
    }
    if (name === "grado") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        materia: "",
        seccion: "",
      }));
      return;
    }

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
        grado: "",
        materia: "",
        seccion: "",
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

  const handlePrint = () => {
    window.print();
  };

  const handleGeneratePDF = () => {
    const doc = new jsPDF();

    // Título del documento
    doc.setFontSize(18);
    doc.text("Listado de Turnos", 14, 20);
    doc.setFontSize(12);
    doc.text("Información detallada de los turnos registrados", 14, 30);

    // Configuración de la tabla
    const tableColumn = ["Escuela", "Grado", "Materia", "Día", "Hora", "Sección"];
    const tableRows = turnos.map((turno) => [
      turno.escuela,
      turno.grado,
      turno.materia,
      turno.dia,
      `${turno.horaInicio} - ${turno.horaFin}`,
      turno.seccion,
    ]);

    // Generar la tabla
    autoTable(doc, {
      startY: 40,
      head: [tableColumn],
      body: tableRows,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] }, // Color azul para el encabezado
    });

    // Guardar el PDF
    doc.save("Listado_de_Turnos.pdf");
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-6">
      <Header />
      <div className="w-full flex justify-between items-center mb-6 mt-6">
        <h1 className="text-2xl font-bold">Gestión de Turnos</h1>
        <div className="flex gap-4">
          <button
            onClick={() => {
              setShowForm(true);
              setEditingTurno(null);
              setFormData({
                escuela: "",
                grado: "",
                materia: "",
                seccion: "",
                dia: "",
                horaInicio: "",
                horaFin: "",
              });
            }}
            className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
          >
            Crear Turno
          </button>
          <button
            onClick={handleGeneratePDF}
            className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
          >
            Descargar PDF
          </button>
        </div>
      </div>

      {turnos.length === 0 && !showForm ? (
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-4">No tienes turnos registrados.</p>
        </div>
      ) : showForm ? (
        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
          <h3 className="text-xl font-bold mb-4">{editingTurno ? "Editar Turno" : "Nuevo Turno"}</h3>
          <div className="grid grid-cols-1 gap-4">
            {/* Selección de escuela */}
            <div>
              <label className="block text-gray-300">Escuela</label>
              <select
                name="escuela"
                className="w-full p-3 rounded bg-gray-700"
                value={formData.escuela}
                onChange={handleChange} // Asegurar que el evento onChange esté configurado correctamente
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

            {/* Selección de grado */}
            <div>
              <label className="block text-gray-300">Grado</label>
              <select
                name="grado"
                className="w-full p-3 rounded bg-gray-700"
                value={formData.grado}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar Grado</option>
                {grados.map((grado) => (
                  <option key={grado.id} value={grado.grado}>
                    {grado.grado}
                  </option>
                ))}
              </select>
            </div>

            {/* Selección de sección */}
            <div>
              <label className="block text-gray-300">Sección</label>
              <select
                name="seccion"
                className="w-full p-3 rounded bg-gray-700"
                value={formData.seccion}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar Sección</option>
                {secciones.map((seccion, index) => (
                  <option key={index} value={seccion}>
                    {seccion}
                  </option>
                ))}
              </select>
            </div>

            {/* Selección de materia */}
            <div>
              <label className="block text-gray-300">Materia</label>
              <select
                name="materia"
                className="w-full p-3 rounded bg-gray-700"
                value={formData.materia}
                onChange={handleChange}
                required
                disabled={!formData.grado}
              >
                <option value="">Seleccionar materia</option>
                {materiasFiltradas.map((materia) => (
                  <option key={materia.id} value={materia.nombre}>
                    {materia.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Día */}
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

            {/* Hora de inicio */}
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

            {/* Hora de fin */}
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
                  grado: "",
                  materia: "",
                  seccion: "",
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
        <div id="printable-area" className="w-full bg-gray-800 p-4 rounded-lg shadow-lg">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-white">Listado de Turnos</h2>
            <p className="text-gray-400">Información detallada de los turnos registrados</p>
          </div>
          <table className="table-auto w-full text-left text-gray-300">
            <thead>
              <tr className="bg-gray-700">
                <th className="px-4 py-2">N°</th>
                <th className="px-4 py-2">Escuela</th>
                <th className="px-4 py-2">Grado</th>
                <th className="px-4 py-2">Materia</th>
                <th className="px-4 py-2">Día</th>
                <th className="px-4 py-2">Hora</th>
                <th className="px-4 py-2">Sección</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {turnos.map((turno, index) => (
                <tr
                  key={turno.id}
                  className={`${index % 2 === 0 ? "bg-gray-900" : "bg-gray-800"
                    } hover:bg-gray-700`}
                >
                  <td className="px-4 py-2 text-center">{index + 1}</td>
                  <td className="px-4 py-2">{turno.escuela}</td>
                  <td className="px-4 py-2">{turno.grado}</td>
                  <td className="px-4 py-2">{turno.materia}</td>
                  <td className="px-4 py-2">{turno.dia}</td>
                  <td className="px-4 py-2">
                    {turno.horaInicio} - {turno.horaFin}
                  </td>
                  <td className="px-4 py-2">{turno.seccion}</td>
                  <td className="px-4 py-2 flex gap-2">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Turnos;