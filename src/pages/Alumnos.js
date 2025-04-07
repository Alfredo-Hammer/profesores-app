import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Dialog } from "@headlessui/react";
import { Pencil, Trash2, Plus } from "lucide-react";
import Header from "../components/Header";
import autoTable from "jspdf-autotable";
import jsPDF from "jspdf";
import { toast } from "react-toastify";

import placeholderImage from "../assets/images/user.png"; // Importa la imagen de placeholder

const Alumnos = () => {
  const [alumnos, setAlumnos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    // Datos del Alumno
    nombre: "",
    apellido: "",
    codigo_mined: "",
    edad: "",
    genero: "",
    grado: "",
    seccion: "", // Nuevo campo
    escuela: "",
    turno: "", // Nuevo campo
    etnia: "",
    fecha_nacimiento: "",
    imagen: placeholderImage, // Imagen local como valor predeterminado
    movil_alumno: "", // Nuevo campo

    // Contacto con los Padres
    nombre_padre: "",
    telefono_padre: "",
    correo_padre: "",

    // Datos de Residencia
    departamento: "",
    municipio: "",
    direccion_exacta: "",
    codigo_postal: "",
    fecha_ingreso: "",
    fecha_egreso: "",
  });
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [userData, setUserData] = useState(null);
  const [escuelas, setEscuelas] = useState([]);
  const [grados, setGrados] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const profesorId = auth.currentUser?.uid;

  useEffect(() => {
    fetchAlumnos();
    fetchUserData();
  }, []);

  useEffect(() => {
    if (!profesorId) return;

    const fetchEscuelas = async () => {
      try {
        const q = query(collection(db, "escuelas"), where("profesorId", "==", profesorId));
        const querySnapshot = await getDocs(q);
        const escuelasList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEscuelas(escuelasList);
      } catch (error) {
        console.error("Error al obtener escuelas:", error);
      }
    };

    fetchEscuelas();
  }, [profesorId]);

  useEffect(() => {
    const fetchGrados = async () => {
      if (!profesorId) return;

      try {
        const q = query(collection(db, "grados"), where("profesorId", "==", profesorId));
        const querySnapshot = await getDocs(q);
        const gradosData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setGrados(gradosData);
      } catch (error) {
        console.error("Error al obtener grados:", error);
      }
    };

    fetchGrados();
  }, [profesorId]);

  const fetchAlumnos = async () => {
    if (!profesorId) return;
    const q = query(collection(db, "alumnos"), where("profesorId", "==", profesorId));
    const querySnapshot = await getDocs(q);
    const alumnosData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setAlumnos(alumnosData);
  };

  const fetchUserData = async () => {
    if (!profesorId) return;
    const q = query(collection(db, "users"), where("uid", "==", profesorId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      setUserData(querySnapshot.docs[0].data());
    }
  };

  const generateStudentId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Genera un número de 6 dígitos
  };

  const isCodigoMinedUnique = async (codigoMined) => {
    const q = query(collection(db, "alumnos"), where("codigo_mined", "==", codigoMined));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty; // Retorna true si no existe
  };

  const handleAddOrUpdateAlumno = async (e) => {
    e.preventDefault();
    if (!profesorId) return;

    try {
      // Validar que el código MINED sea único
      if (!editId || formData.codigo_mined !== alumnos.find((a) => a.id === editId)?.codigo_mined) {
        const isUnique = await isCodigoMinedUnique(formData.codigo_mined);
        if (!isUnique) {
          toast.error("El código MINED ya está registrado.");
          return;
        }
      }

      // Consulta para obtener las materias según la escuela, grado y sección del alumno
      const materiasQuery = query(
        collection(db, "materias"),
        where("escuelaId", "==", formData.escuela),
        where("gradoId", "==", formData.grado),
        where("seccion", "==", formData.seccion),
        where("profesorId", "==", profesorId)
      );

      const materiasSnapshot = await getDocs(materiasQuery);
      const materias = materiasSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("Materias obtenidas para el alumno:", materias); // Depuración

      // Agregar las materias al documento del alumno
      const alumnoData = {
        ...formData,
        gradoId: grados.find((grado) => grado.grado === formData.grado && grado.escuela === formData.escuela)?.id || null, // Agregar gradoId
        materias, // Agregar las materias al documento del alumno
        profesorId,
        createdAt: new Date(),
      };

      if (editId) {
        await updateDoc(doc(db, "alumnos", editId), alumnoData);
        toast.success("Alumno actualizado correctamente");
      } else {
        const studentId = generateStudentId();
        await addDoc(collection(db, "alumnos"), { ...alumnoData, studentId });
        toast.success("Alumno agregado correctamente");
      }

      setIsModalOpen(false);
      setFormData({
        // Restablecer el formulario
        nombre: "",
        apellido: "",
        codigo_mined: "",
        edad: "",
        genero: "",
        grado: "",
        seccion: "",
        escuela: "",
        turno: "",
        fecha_nacimiento: "",
        imagen: placeholderImage,
        movil_alumno: "",
        nombre_padre: "",
        telefono_padre: "",
        correo_padre: "",
        departamento: "",
        municipio: "",
        direccion_exacta: "",
        codigo_postal: "",
        fecha_ingreso: "",
        fecha_egreso: "",
      });
      setEditId(null);
      fetchAlumnos();
    } catch (error) {
      toast.error("Error al guardar alumno");
      console.error("Error al guardar alumno:", error);
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDoc(doc(db, "alumnos", deleteId));
      toast.success("Alumno eliminado correctamente");
      setIsDeleteModalOpen(false);
      setDeleteId(null);
      fetchAlumnos();
    } catch (error) {
      toast.error("Ocurrió un error al eliminar el alumno");
      console.error("Error al eliminar alumno:", error);
    }
  };

  const handleEdit = (alumno) => {
    setFormData(alumno);
    setEditId(alumno.id);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setFormData((prevData) => ({ ...prevData, imagen: placeholderImage })); // Usar placeholder si no hay imagen
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("https://api.imgbb.com/1/upload?key=69b118d3f4ced272162ffd639bde5ce2", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setFormData((prevData) => ({ ...prevData, imagen: data.data.url }));
      }
    } catch (error) {
      console.error("Error al subir la imagen:", error);
      setFormData((prevData) => ({ ...prevData, imagen: placeholderImage })); // Usar placeholder en caso de error
    }
  };

  const handlePrintPDF = (alumno) => {
    const doc = new jsPDF();

    // Título del PDF
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Información del Alumno", 105, 15, { align: "center" });

    // Subtítulos
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Centro educativo: ${alumno.escuela}`, 105, 25, { align: "center" });
    doc.text(`Alumno: ${alumno.nombre} ${alumno.apellido}`, 105, 30, { align: "center" });

    // Ajustar la posición inicial de la tabla para evitar superposición
    const startY = 40; // Espacio suficiente debajo de los subtítulos

    // Datos del alumno en formato de dos columnas
    const tableData = [
      ["ID del Alumno", alumno.studentId || "N/A"],
      ["Código MINED", alumno.codigo_mined || "N/A"],
      ["Nombre", alumno.nombre || "N/A"],
      ["Apellido", alumno.apellido || "N/A"],
      ["Edad", alumno.edad || "N/A"],
      ["Fecha de Nacimiento", alumno.fecha_nacimiento || "N/A"],
      ["Género", alumno.genero || "N/A"],
      ["Grado", alumno.grado || "N/A"],
      ["Escuela", alumno.escuela || "N/A"],
      ["Turno", alumno.turno || "N/A"],
      ["Sección", alumno.seccion || "N/A"],
      ["Móvil Alumno", alumno.movil_alumno || "N/A"],
      ["Nombre del Padre", alumno.nombre_padre || "N/A"],
      ["Teléfono del Padre", alumno.telefono_padre || "N/A"],
      ["Correo del Padre", alumno.correo_padre || "N/A"],
      ["Departamento", alumno.departamento || "N/A"],
      ["Municipio", alumno.municipio || "N/A"],
      ["Dirección Exacta", alumno.direccion_exacta || "N/A"],
      ["Código Postal", alumno.codigo_postal || "N/A"],
      ["Fecha de Ingreso", alumno.fecha_ingreso || "N/A"],
      ["Fecha de Egreso", alumno.fecha_egreso || "N/A"],
    ];

    // Configuración de la tabla
    autoTable(doc, {
      startY, // Posición inicial de la tabla ajustada
      head: [["Campo", "Valor"]], // Encabezados de la tabla
      body: tableData,
      styles: {
        font: "helvetica",
        fontSize: 10,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [41, 128, 185], // Azul bonito para el encabezado
        textColor: [255, 255, 255], // Texto blanco
        fontSize: 12,
      },
      columnStyles: {
        0: { cellWidth: 70 }, // Ancho de la primera columna
        1: { cellWidth: 120 }, // Ancho de la segunda columna
      },
    });

    // Descargar el PDF
    doc.save(`Alumno_${alumno.nombre}_${alumno.apellido}.pdf`);
  };

  const handlePrintAlumnosPDF = () => {
    const doc = new jsPDF();

    // Título del PDF
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Lista de Alumnos", 105, 15, { align: "center" });

    // Subtítulos
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Centro educativo: Nombre del Centro", 105, 25, { align: "center" });
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 105, 30, { align: "center" });

    // Datos de la tabla
    const tableData = alumnos.map((alumno, index) => [
      index + 1, // Número de fila
      alumno.studentId || "N/A",
      alumno.codigo_mined || "N/A",
      `${alumno.nombre} ${alumno.apellido}` || "N/A",
      alumno.edad || "N/A",
      alumno.grado || "N/A",
      alumno.seccion || "N/A",
      alumno.escuela || "N/A",
    ]);

    // Configuración de la tabla
    autoTable(doc, {
      startY: 40, // Posición inicial de la tabla
      head: [
        [
          "N°",
          "ID del Alumno",
          "Código MINED",
          "Nombre Completo",
          "Edad",
          "Grado",
          "Sección",
          "Escuela",
        ],
      ],
      body: tableData,
      styles: {
        font: "helvetica",
        fontSize: 10,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [41, 128, 185], // Azul bonito para el encabezado
        textColor: [255, 255, 255], // Texto blanco
        fontSize: 12,
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240], // Color gris claro para filas alternas
      },
      columnStyles: {
        0: { cellWidth: 10 }, // Número
        1: { cellWidth: 30 }, // ID del Alumno
        2: { cellWidth: 30 }, // Código MINED
        3: { cellWidth: 50 }, // Nombre Completo
        4: { cellWidth: 15 }, // Edad
        5: { cellWidth: 20 }, // Grado
        6: { cellWidth: 20 }, // Sección
        7: { cellWidth: 30 }, // Escuela
      },
    });

    // Descargar el PDF
    doc.save("Lista_Alumnos.pdf");
  };

  const handleSchoolSelection = (schoolId) => {
    const selectedSchool = escuelas.find((escuela) => escuela.id === schoolId);
    setFormData({
      ...formData,
      escuela: selectedSchool?.nombre || "",
      escuelaId: selectedSchool?.id || "", // Agregar el ID de la escuela
      grado: "",
      seccion: "",
      turno: "",
    });
  };

  const filteredAlumnos = alumnos.filter((alumno) =>
    alumno.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alumno.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`p-6 mt-8 bg-gray-900 text-white min-h-screen transition-opacity duration-300 ${isModalOpen || isDeleteModalOpen ? "opacity-50" : "opacity-100"}`}>
      {/* Título principal */}
      <h1 className="text-2xl font-bold text-center text-blue-400">Lista de Alumnos</h1>
      <p className="text-gray-400 text-center mb-4">"Por una educación más organizada y accesible."</p>


      {/* Header */}
      <Header userName={userData?.nombre} />

      {/* Barra de búsqueda y botones */}
      <div className="flex justify-between items-center my-4">
        {/* Input de búsqueda */}
        <input
          type="text"
          placeholder="Buscar por ID o Nombre"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 bg-gray-700 rounded w-full max-w-md text-white"
        />

        {/* Botones */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={18} /> Registrar Alumno
          </button>
          <button
            onClick={handlePrintAlumnosPDF}
            className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
          >
            Imprimir Lista
          </button>
        </div>
      </div>

      {/* Tabla de alumnos */}
      {alumnos.length === 0 ? (
        <p className="text-gray-400 text-center">No tienes alumnos registrados.</p>
      ) : filteredAlumnos.length === 0 ? (
        <p className="text-gray-400 text-center mt-4">No se encontraron alumnos que coincidan con la búsqueda.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border border-gray-700 rounded-lg">
            <thead className="bg-gray-800 text-gray-500">
              <tr>
                <th className="p-3 text-center">Imagen</th>
                <th className="p-3 text-center">ID</th>
                <th className="p-3 text-center">Código MINED</th>
                <th className="p-3 text-center">Nombres</th>
                <th className="p-3 text-center">Apellido</th>
                <th className="p-3 text-center">Edad</th>
                <th className="p-3 text-center">Grado</th>
                <th className="p-3 text-center">Escuela</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlumnos.map((alumno) => (
                <tr key={alumno.id} className="border-b border-gray-700 text-center">
                  <td className="p-3">
                    <img
                      src={alumno.imagen || placeholderImage} // Mostrar placeholder si no hay imagen
                      alt="Foto"
                      className="w-12 h-12 rounded-full mx-auto"
                    />
                  </td>
                  <td className="p-3">{alumno.studentId}</td>
                  <td className="p-3">{alumno.codigo_mined}</td>
                  <td className="p-3">{alumno.nombre}</td>
                  <td className="p-3">{alumno.apellido}</td>
                  <td className="p-3">{alumno.edad}</td>
                  <td className="p-3">{alumno.grado}</td>
                  <td className="p-3">{alumno.escuela}</td>

                  <td className="p-3 flex justify-center gap-2">
                    <button onClick={() => handleEdit(alumno)} className="text-yellow-400 hover:text-yellow-300">
                      <Pencil size={20} />
                    </button>
                    <button onClick={() => confirmDelete(alumno.id)} className="text-red-500 hover:text-red-300">
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de formulario */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-[90%] max-w-full md:max-w-2xl lg:max-w-4xl max-h-[calc(100vh-100px)] overflow-y-auto text-gray-300">
          <h2 className="text-2xl font-bold mb-4 text-orange-400 text-center p-2">{editId ? "Editar Alumno" : "Registrar Alumno"}</h2>
          <form onSubmit={handleAddOrUpdateAlumno} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sección: Datos del Alumno */}
            <div className="col-span-2">
              <h3 className="text-lg font-bold text-orange-400 mb-2">Datos del Alumno</h3>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">ID del Alumno:</label>
              <input
                type="text"
                name="studentId"
                value={formData.studentId || generateStudentId()} // Generar automáticamente si no existe
                readOnly
                className="p-2 bg-gray-700 rounded w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Código MINED:</label>
              <input
                type="text"
                name="codigo_mined"
                value={formData.codigo_mined}
                onChange={(e) => setFormData({ ...formData, codigo_mined: e.target.value })}
                className="p-2 bg-gray-700 rounded w-full"
                readOnly={!!editId} // Campo en modo de lectura si se está editando
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nombre:</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="p-2 bg-gray-700 rounded w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Apellido:</label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                className="p-2 bg-gray-700 rounded w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Edad:</label>
              <input
                type="number"
                name="edad"
                value={formData.edad}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (!isNaN(value) && value > 0) {
                    setFormData({ ...formData, edad: value });
                  } else if (e.target.value === "") {
                    setFormData({ ...formData, edad: "" });
                  }
                }}
                className="p-2 bg-gray-700 rounded w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Fecha de Nacimiento:</label>
              <input
                type="date"
                name="fecha_nacimiento"
                value={formData.fecha_nacimiento}
                onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                className="p-2 bg-gray-700 rounded w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Género:</label>
              <select
                name="genero"
                value={formData.genero}
                onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                className="p-2 bg-gray-700 rounded w-full"
                required
              >
                <option value="">Seleccionar Género</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            {/* Selector de escuelas */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Escuela:</label>
              <select
                value={formData.escuelaId || ""}
                onChange={(e) => handleSchoolSelection(e.target.value)}
                className="p-2 bg-gray-700 rounded w-full"
                required
              >
                <option value="">Seleccionar Escuela</option>
                {escuelas.map((escuela) => (
                  <option key={escuela.id} value={escuela.id}>
                    {escuela.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Nivel Educativo */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nivel Educativo:</label>
              <select
                value={formData.nivel_educativo}
                onChange={(e) => {
                  setFormData({ ...formData, nivel_educativo: e.target.value });
                }}
                className="p-2 bg-gray-700 rounded w-full"
                required
              >
                <option value="">Seleccionar Nivel Educativo</option>
                {[...new Set(grados.map((grado) => grado.nivelEducativo))].map((nivel, index) => (
                  <option key={index} value={nivel}>
                    {nivel}
                  </option>
                ))}
              </select>
            </div>

            {/*Selector  de grados  */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Grado:</label>
              <select
                value={formData.grado}
                onChange={(e) => {
                  setFormData({ ...formData, grado: e.target.value, seccion: "", turno: "" });
                }}
                className="p-2 bg-gray-700 rounded w-full"
                required
                disabled={!formData.escuela} // Deshabilitar si no se selecciona una escuela
              >
                <option value="">Seleccionar Grado</option>
                {grados
                  .filter((grado) => grado.escuela === formData.escuela)
                  .map((grado) => (
                    <option key={grado.id} value={grado.grado}>
                      {grado.grado}
                    </option>
                  ))}
              </select>
            </div>
            {/*Selector  de secciones  */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Sección:</label>
              <select
                value={formData.seccion}
                onChange={(e) => setFormData({ ...formData, seccion: e.target.value })}
                className="p-2 bg-gray-700 rounded w-full"
                required
                disabled={!formData.grado} // Deshabilitar si no se selecciona un grado
              >
                <option value="">Seleccionar Sección</option>
                {grados
                  .find((grado) => grado.grado === formData.grado && grado.escuela === formData.escuela)?.secciones?.map(
                    (seccion, index) => (
                      <option key={index} value={seccion}>
                        {seccion}
                      </option>
                    )
                  )}
              </select>
            </div>
            {/*Selector  de turnos  */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Turno:</label>
              <select
                value={formData.turno}
                onChange={(e) => setFormData({ ...formData, turno: e.target.value })}
                className="p-2 bg-gray-700 rounded w-full"
                required
                disabled={!formData.grado} // Deshabilitar si no se selecciona un grado
              >
                <option value="">Seleccionar Turno</option>
                {/* Obtener los turnos únicos de los grados */}
                {[...new Set(grados
                  .filter((grado) => grado.grado === formData.grado && grado.escuela === formData.escuela)
                  .map((grado) => grado.turno)
                )].map((turno, index) => (
                  <option key={index} value={turno}>
                    {turno}
                  </option>
                ))}
              </select>
            </div>
            {/*Selector  de móviles  */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Móvil Alumno:</label>
              <input
                type="text"
                name="movil_alumno"
                value={formData.movil_alumno}
                onChange={(e) => setFormData({ ...formData, movil_alumno: e.target.value })}
                className="p-2 bg-gray-700 rounded w-full"
                placeholder="Número de móvil del alumno"
              />
            </div>

            {/* Sección: Contacto con los Padres */}
            <div className="col-span-2">
              <h3 className="text-lg font-bold text-orange-400 mb-2">Contacto con los Padres</h3>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nombre del Padre:</label>
              <input
                type="text"
                name="nombre_padre"
                value={formData.nombre_padre}
                onChange={(e) => setFormData({ ...formData, nombre_padre: e.target.value })}
                className="p-2 bg-gray-700 rounded w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Teléfono del Padre:</label>
              <input
                type="text"
                name="telefono_padre"
                value={formData.telefono_padre}
                onChange={(e) => setFormData({ ...formData, telefono_padre: e.target.value })}
                className="p-2 bg-gray-700 rounded w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Correo del Padre:</label>
              <input
                type="email"
                name="correo_padre"
                value={formData.correo_padre}
                onChange={(e) => setFormData({ ...formData, correo_padre: e.target.value })}
                className="p-2 bg-gray-700 rounded w-full"
                required
              />
            </div>

            {/* Sección: Datos de Residencia */}
            <div className="col-span-2">
              <h3 className="text-lg font-bold text-orange-400 mb-2">Datos de Residencia</h3>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Departamento:</label>
              <input
                type="text"
                name="departamento"
                value={formData.departamento}
                onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                className="p-2 bg-gray-700 rounded w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Municipio:</label>
              <input
                type="text"
                name="municipio"
                value={formData.municipio}
                onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                className="p-2 bg-gray-700 rounded w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Dirección Exacta:</label>
              <input
                type="text"
                name="direccion_exacta"
                value={formData.direccion_exacta}
                onChange={(e) => setFormData({ ...formData, direccion_exacta: e.target.value })}
                className="p-2 bg-gray-700 rounded w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Código Postal:</label>
              <input
                type="text"
                name="codigo_postal"
                value={formData.codigo_postal}
                onChange={(e) => setFormData({ ...formData, codigo_postal: e.target.value })}
                className="p-2 bg-gray-700 rounded w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Fecha de Ingreso:</label>
              <input
                type="date"
                name="fecha_ingreso"
                value={formData.fecha_ingreso}
                onChange={(e) => setFormData({ ...formData, fecha_ingreso: e.target.value })}
                className="p-2 bg-gray-700 rounded w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Fecha de Egreso:</label>
              <input
                type="date"
                name="fecha_egreso"
                value={formData.fecha_egreso}
                onChange={(e) => setFormData({ ...formData, fecha_egreso: e.target.value })}
                className="p-2 bg-gray-700 rounded w-full"
              />
            </div>

            {/* Campo para subir imagen */}
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Imagen del Alumno:</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="p-2 bg-gray-700 rounded w-full text-white"
              />
              <div className="mt-4">
                <p className="text-sm text-gray-400">Vista previa:</p>
                <img
                  src={formData.imagen || placeholderImage} // Mostrar placeholder si no hay imagen
                  alt="Vista previa"
                  className="w-32 h-32 rounded-full mx-auto"
                />
              </div>
            </div>

            {/* Botones */}
            <div className="col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-600 px-4 py-2 rounded"
              >
                Cancelar
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={() => handlePrintPDF(formData)}
                  className="bg-orange-300 px-4 py-2 rounded flex items-center gap-2"
                >
                  Imprimir PDF
                </button>
              )}
              <button
                type="submit"
                className="bg-blue-600 px-4 py-2 rounded"
              >
                {editId ? "Actualizar" : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      </Dialog>

      {/* Modal de eliminación */}
      <Dialog open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-25">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-[350px]">
          <h2 className="text-lg font-bold mb-4 text-center">¿Seguro que quieres eliminar el alumno?</h2>
          <div className="flex justify-center gap-2">
            <button onClick={() => setIsDeleteModalOpen(false)} className="bg-gray-600 px-4 py-2 rounded">Cancelar</button>
            <button onClick={handleDelete} className="bg-red-600 px-4 py-2 rounded">Eliminar</button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Alumnos;
