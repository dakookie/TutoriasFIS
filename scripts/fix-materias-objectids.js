// Script para convertir ObjectIds de materias a nombres en usuarios
const identityDb = db.getSiblingDB('identity_db');
const academicDb = db.getSiblingDB('academic_db');

print('=== Convirtiendo ObjectIds de materias a nombres ===\n');

// Obtener todos los tutores
const tutores = identityDb.usuarios.find({ rol: 'Tutor' }).toArray();
print(`Encontrados ${tutores.length} tutores\n`);

let tutoresActualizados = 0;
let materiasConvertidas = 0;

tutores.forEach(tutor => {
  const materiasOriginales = tutor.materias || [];
  const materiasNuevas = [];
  let necesitaActualizacion = false;

  materiasOriginales.forEach(materia => {
    // Verificar si es un ObjectId (string de 24 caracteres hexadecimales)
    if (typeof materia === 'string' && /^[0-9a-f]{24}$/i.test(materia)) {
      // Es un ObjectId, buscar el nombre
      const materiaDoc = academicDb.materias.findOne({ _id: ObjectId(materia) });
      if (materiaDoc) {
        materiasNuevas.push(materiaDoc.nombre);
        necesitaActualizacion = true;
        materiasConvertidas++;
        print(`  ✓ ${tutor.nombre}: ${materia} → ${materiaDoc.nombre}`);
      } else {
        print(`  ⚠ ${tutor.nombre}: No se encontró materia con ID ${materia}`);
        materiasNuevas.push(materia); // Mantener el ID si no se encuentra
      }
    } else {
      // Ya es un nombre, mantener
      materiasNuevas.push(materia);
    }
  });

  // Actualizar solo si hay cambios
  if (necesitaActualizacion) {
    identityDb.usuarios.updateOne(
      { _id: tutor._id },
      { $set: { materias: materiasNuevas } }
    );
    tutoresActualizados++;
  }
});

print(`\n=== Resumen ===`);
print(`Tutores actualizados: ${tutoresActualizados}`);
print(`Materias convertidas: ${materiasConvertidas}`);
