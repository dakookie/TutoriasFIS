// Script para migrar datos de tutorias_fis a bases de datos separadas por microservicio

// Conectar a la base de datos original
db = db.getSiblingDB('tutorias_fis');

print('=== Migrando a Identity DB ===');
const identityDb = db.getSiblingDB('identity_db');

// Copiar colección de usuarios
if (db.usuarios.countDocuments() > 0) {
  const usuarios = db.usuarios.find().toArray();
  identityDb.usuarios.insertMany(usuarios);
  print(`✓ Migrados ${usuarios.length} usuarios a identity_db`);
} else {
  print('⚠ No hay usuarios para migrar');
}

print('\n=== Migrando a Academic DB ===');
const academicDb = db.getSiblingDB('academic_db');

// Copiar colecciones académicas
const collectionesToAcademic = ['materias', 'tutorias', 'solicitudes', 'bibliografias', 'preguntas', 'respuestas', 'publicaciones'];

collectionesToAcademic.forEach(collectionName => {
  const count = db.getCollection(collectionName).countDocuments();
  if (count > 0) {
    const docs = db.getCollection(collectionName).find().toArray();
    academicDb.getCollection(collectionName).insertMany(docs);
    print(`✓ Migrados ${docs.length} documentos de ${collectionName} a academic_db`);
  } else {
    print(`⚠ No hay documentos en ${collectionName}`);
  }
});

print('\n=== Migrando a Messaging DB ===');
const messagingDb = db.getSiblingDB('messaging_db');

// Copiar colección de mensajes
if (db.mensajes.countDocuments() > 0) {
  const mensajes = db.mensajes.find().toArray();
  messagingDb.mensajes.insertMany(mensajes);
  print(`✓ Migrados ${mensajes.length} mensajes a messaging_db`);
} else {
  print('⚠ No hay mensajes para migrar');
}

print('\n=== Migración completada ===');
print('Bases de datos creadas:');
print('- identity_db: usuarios');
print('- academic_db: materias, tutorias, solicitudes, etc.');
print('- messaging_db: mensajes');
