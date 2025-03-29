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

      if (editId) {
        await updateDoc(doc(db, "alumnos", editId), formData);
        toast.success("Alumno actualizado correctamente");
      } else {
        const studentId = generateStudentId();
        await addDoc(collection(db, "alumnos"), { ...formData, studentId, profesorId, createdAt: new Date() });
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
    doc.setFontSize(18);
    doc.text("Información del Alumno", 14, 20);

    // Datos del alumno en formato de tabla
    autoTable(doc, {
      startY: 30,
      head: [["Campo", "Valor"]],
      body: Object.entries(alumno).map(([key, value]) => [key, value || ""]),
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    // Descargar el PDF
    doc.save(`Alumno_${alumno.nombre}_${alumno.apellido}.pdf`);
  };

  const filteredAlumnos = alumnos.filter((alumno) =>
    alumno.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alumno.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`p-6 mt-8 bg-gray-900 text-white min-h-screen transition-opacity duration-300 ${isModalOpen || isDeleteModalOpen ? "opacity-50" : "opacity-100"}`}>
      {/* Header */}
      <Header userName={userData?.nombre} />

      {/* Botón Agregar Alumno */}
      <div className="flex justify-between items-center my-4">
        <input
          type="text"
          placeholder="Buscar por ID o Nombre"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 bg-gray-700 rounded w-full max-w-md text-white"
        />
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={18} /> Registrar Alumno
        </button>
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
                <th className="p-3 text-center">Código MINED</th> {/* Nueva columna */}
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
                  <td className="p-3">{alumno.codigo_mined}</td> {/* Mostrar Código MINED */}
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
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-[90%] max-w-full md:max-w-2xl lg:max-w-4xl max-h-[calc(100vh-100px)] overflow-y-auto">
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
            <div>
              <label className="block text-sm text-gray-400 mb-1">Grado:</label>
              <input
                type="text"
                name="grado"
                value={formData.grado}
                onChange={(e) => setFormData({ ...formData, grado: e.target.value })}
                className="p-2 bg-gray-700 rounded w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Escuela:</label>
              <select
                name="escuela"
                value={formData.escuela}
                onChange={(e) => setFormData({ ...formData, escuela: e.target.value })}
                className="p-2 bg-gray-700 rounded w-full"
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
              <label className="block text-sm text-gray-400 mb-1">Turno:</label>
              <select
                name="turno"
                value={formData.turno}
                onChange={(e) => setFormData({ ...formData, turno: e.target.value })}
                className="p-2 bg-gray-700 rounded w-full"
                required
              >
                <option value="">Seleccionar Turno</option>
                <option value="Matutino">Matutino</option>
                <option value="Vespertino">Vespertino</option>
                <option value="Nocturno">Nocturno</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Sección:</label>
              <select
                name="seccion"
                value={formData.seccion}
                onChange={(e) => setFormData({ ...formData, seccion: e.target.value })}
                className="p-2 bg-gray-700 rounded w-full"
                required
              >
                <option value="">Seleccionar Sección</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
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
