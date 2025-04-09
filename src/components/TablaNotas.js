// components/TablaNotas.jsx
import { convertirNotaACualitativa } from "../utils/notas";

const TablaNotas = ({ alumnos }) => {
  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-4">Lista de Alumnos y Notas</h2>
      <table className="table-auto border-collapse border border-gray-300 w-full text-left">
        <thead>
          <tr>
            <th className="border border-gray-300 px-4 py-2">Nombre y Apellido</th>
            <th className="border border-gray-300 px-4 py-2">Código MINED</th>
            <th className="border border-gray-300 px-4 py-2">Materia</th>
            <th className="border border-gray-300 px-4 py-2">I Bim</th>
            <th className="border border-gray-300 px-4 py-2">II Bim</th>
            <th className="border border-gray-300 px-4 py-2">I Sem</th>
          </tr>
        </thead>
        <tbody>
          {alumnos.map((alumno) =>
            alumno.materias.map((materia) => (
              <tr key={`${alumno.id}-${materia.id}`}>
                <td className="border border-gray-300 px-4 py-2">{alumno.nombre} {alumno.apellidos}</td>
                <td className="border border-gray-300 px-4 py-2">{alumno.codigo_mined}</td>
                <td className="border border-gray-300 px-4 py-2">{materia.nombre}</td>
                {["I", "II", "semestre1"].map((key) => {
                  const nota = materia.calificaciones?.[key];
                  const cualitativa = convertirNotaACualitativa(nota);
                  return (
                    <td
                      key={key}
                      className={`border border-gray-300 px-4 py-2 text-center ${nota < 60 ? "text-red-500 font-bold" : ""
                        }`}
                    >
                      {nota || "N/A"} <br />
                      <span className="text-xs text-gray-400">{cualitativa}</span>
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TablaNotas;
