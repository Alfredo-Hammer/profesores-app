import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Dialog } from "@headlessui/react";
import { Pencil, Trash2, Plus } from "lucide-react";
import Header from "../components/Header";

const Alumnos = () => {
  const [alumnos, setAlumnos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    edad: "",
    grado: "",
    escuela: "",
    etnia: "",
    direccion: "",
    telefono: "",
    correo: "",
    nombre_padre: "",
    telefono_padre: "",
    correo_padre: "",
    fecha_nacimiento: "",
    genero: "",
    imagen: ""
  });
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [userData, setUserData] = useState(null);
  const [escuelas, setEscuelas] = useState([]);
  const profesorId = auth.currentUser?.uid;

  useEffect(() => {
    fetchAlumnos();
    fetchUserData();
  }, []);

  // Obtener las escuelas del profesor desde Firebase
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

  const handleAddOrUpdateAlumno = async (e) => {
    e.preventDefault();
    if (!profesorId) return;

    try {
      if (editId) {
        await updateDoc(doc(db, "alumnos", editId), formData);
      } else {
        const studentId = generateStudentId();
        await addDoc(collection(db, "alumnos"), { ...formData, studentId, profesorId, createdAt: new Date() });
      }
      setIsModalOpen(false);
      setFormData({ nombre: "", apellido: "", edad: "", grado: "", escuela: "", etnia: "", direccion: "", telefono: "", correo: "", nombre_padre: "", telefono_padre: "", correo_padre: "", fecha_nacimiento: "", genero: "", imagen: "" });
      setEditId(null);
      fetchAlumnos();
    } catch (error) {
      console.error("Error al guardar alumno:", error);
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteDoc(doc(db, "alumnos", deleteId));
    setIsDeleteModalOpen(false);
    setDeleteId(null);
    fetchAlumnos();
  };

  const handleEdit = (alumno) => {
    setFormData(alumno);
    setEditId(alumno.id);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

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
    }
  };



  return (
    <div className={`p-6 bg-gray-900 text-white min-h-screen transition-opacity duration-300 ${isModalOpen || isDeleteModalOpen ? "opacity-50" : "opacity-100"}`}>
      {/* Header */}
      <Header userName={userData?.nombre} />

      {/* Botón Agregar Alumno en la parte superior derecha */}
      <div className="flex justify-end my-4">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2 mt-6"
        >
          <Plus size={18} /> Agregar Alumno
        </button>
      </div>

      {alumnos.length === 0 ? (
        <p className="text-gray-400 text-center">No tienes alumnos registrados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border border-gray-700 rounded-lg">
            <thead className="bg-gray-800 text-gray-500">
              <tr>
                <th className="p-3 text-center">Imagen</th>
                <th className="p-3 text-center">Id</th>
                <th className="p-3 text-center">Nombre</th>
                <th className="p-3 text-center">Apellido</th>
                <th className="p-3 text-center">Edad</th>
                <th className="p-3 text-center">Grado</th>
                <th className="p-3 text-center">Escuela</th>
                <th className="p-3 text-center">Etnia</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {alumnos.map((alumno) => (
                <tr key={alumno.id} className="border-b border-gray-700 text-center">
                  <td className="p-3">
                    {alumno.imagen ? (
                      <img src={alumno.imagen} alt="Foto" className="w-12 h-12 rounded-full mx-auto" />
                    ) : (
                      "Sin imagen"
                    )}
                  </td>
                  <td className="p-3">{alumno.studentId}</td>
                  <td className="p-3">{alumno.nombre}</td>
                  <td className="p-3">{alumno.apellido}</td>
                  <td className="p-3">{alumno.edad}</td>
                  <td className="p-3">{alumno.grado}</td>
                  <td className="p-3">{alumno.escuela}</td>
                  <td className="p-3">{alumno.etnia}</td>
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

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-[700px]">
          <h2 className="text-xl font-bold mb-4">{editId ? "Editar Alumno" : "Agregar Alumno"}</h2>
          <form onSubmit={handleAddOrUpdateAlumno} className="grid grid-cols-2 gap-4">
            <input type="text" name="nombre" placeholder="Nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="p-2 bg-gray-700 rounded w-full" required />
            <input type="text" name="apellido" placeholder="Apellido" value={formData.apellido} onChange={(e) => setFormData({ ...formData, apellido: e.target.value })} className="p-2 bg-gray-700 rounded w-full" required />

            <input type="number" name="edad" placeholder="Edad" value={formData.edad} onChange={(e) => setFormData({ ...formData, edad: e.target.value })} className="p-2 bg-gray-700 rounded w-full" required />
            <input type="text" name="grado" placeholder="Grado" value={formData.grado} onChange={(e) => setFormData({ ...formData, grado: e.target.value })} className="p-2 bg-gray-700 rounded w-full" required />

            {/* Select para elegir la escuela*/}
            <select name="escuela" value={formData.escuela} onChange={(e) => setFormData({ ...formData, escuela: e.target.value })} className="p-2 bg-gray-700 rounded w-full" required>
              <option value="">Seleccionar Escuela</option>
              {escuelas.map((escuela) => (
                <option key={escuela.id} value={escuela.nombre}>
                  {escuela.nombre}
                </option>
              ))}

            </select >


            <input type="text" name="etnia" placeholder="Etnia" value={formData.etnia} onChange={(e) => setFormData({ ...formData, etnia: e.target.value })} className="p-2 bg-gray-700 rounded w-full" required />

            <input type="text" name="direccion" placeholder="Dirección" value={formData.direccion} onChange={(e) => setFormData({ ...formData, direccion: e.target.value })} className="p-2 bg-gray-700 rounded w-full" required />
            <input type="text" name="telefono" placeholder="Teléfono" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} className="p-2 bg-gray-700 rounded w-full" required />

            <input type="email" name="correo" placeholder="Correo" value={formData.correo} onChange={(e) => setFormData({ ...formData, correo: e.target.value })} className="p-2 bg-gray-700 rounded w-full" required />
            <input type="text" name="nombre_padre" placeholder="Nombre del Padre" value={formData.nombre_padre} onChange={(e) => setFormData({ ...formData, nombre_padre: e.target.value })} className="p-2 bg-gray-700 rounded w-full" required />

            <input type="text" name="telefono_padre" placeholder="Teléfono del Padre" value={formData.telefono_padre} onChange={(e) => setFormData({ ...formData, telefono_padre: e.target.value })} className="p-2 bg-gray-700 rounded w-full" required />
            <input type="email" name="correo_padre" placeholder="Correo del Padre" value={formData.correo_padre} onChange={(e) => setFormData({ ...formData, correo_padre: e.target.value })} className="p-2 bg-gray-700 rounded w-full" required />

            <input type="date" name="fecha_nacimiento" placeholder="Fecha de Nacimiento" value={formData.fecha_nacimiento} onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })} className="p-2 bg-gray-700 rounded w-full" required />


            <select name="genero" value={formData.genero} onChange={(e) => setFormData({ ...formData, genero: e.target.value })} className="p-2 bg-gray-700 rounded w-full" required>
              <option value="">Seleccionar Género</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Otro">Otro</option>
            </select>

            <input
              type="text"
              name="id"
              placeholder="ID del Alumno (Generado Automáticamente)"
              value={formData.id || ""}
              readOnly
              className="p-2 bg-gray-700 rounded w-full"
            />




            {/* Input de Imagen */}
            <div className="col-span-2">
              <label className="block text-sm text-gray-400">Imagen del Alumno</label>
              <input type="file" onChange={handleImageUpload} className="w-full p-2 bg-gray-700 rounded" />
            </div>

            {/* Botones de acción */}
            <div className="col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-600 px-4 py-2 rounded">Cancelar</button>
              <button type="submit" className="bg-blue-600 px-4 py-2 rounded">{editId ? "Actualizar" : "Guardar"}</button>
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
