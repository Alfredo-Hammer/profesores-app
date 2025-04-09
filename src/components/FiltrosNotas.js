
// components/FiltrosNotas.jsx
const FiltrosNotas = ({
  escuelas,
  grados,
  secciones,
  escuelaSeleccionada,
  gradoSeleccionado,
  seccionSeleccionada,
  setEscuelaSeleccionada,
  setGradoSeleccionado,
  setSeccionSeleccionada,
  onBuscar,
}) => {
  return (
    <div className="flex justify-center gap-4 mb-6">
      <select
        value={escuelaSeleccionada}
        onChange={(e) => setEscuelaSeleccionada(e.target.value)}
        className="p-2 border border-gray-500 rounded-lg bg-gray-800 text-gray-300"
      >
        <option value="">Seleccionar Escuela</option>
        {escuelas.map((escuela) => (
          <option key={escuela} value={escuela}>{escuela}</option>
        ))}
      </select>

      <select
        value={gradoSeleccionado}
        onChange={(e) => setGradoSeleccionado(e.target.value)}
        className="p-2 border border-gray-500 rounded-lg bg-gray-800 text-gray-300"
      >
        <option value="">Seleccionar Grado</option>
        {grados.map((grado) => (
          <option key={grado} value={grado}>{grado}</option>
        ))}
      </select>

      <select
        value={seccionSeleccionada}
        onChange={(e) => setSeccionSeleccionada(e.target.value)}
        className="p-2 border border-gray-500 rounded-lg bg-gray-800 text-gray-300"
      >
        <option value="">Seleccionar Sección</option>
        {secciones.map((seccion) => (
          <option key={seccion} value={seccion}>{seccion}</option>
        ))}
      </select>

      <button
        onClick={onBuscar}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Mostrar
      </button>
    </div>
  );
};

export default FiltrosNotas;
