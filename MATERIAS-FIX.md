# Solución de Materias como ObjectIds

## Problema Original
Las materias de los tutores se estaban guardando como ObjectIds en lugar de strings (nombres), lo que causaba que en el dashboard de admin se mostraran IDs en lugar de nombres de materias.

## Soluciones Implementadas

### 1. Schema de Mongoose - Prevención de Auto-Conversión ✅
**Archivo:** `backend/identity-service/src/modules/usuarios/schemas/usuario.schema.ts`

**Cambio:**
```typescript
// ANTES (permitía auto-conversión)
@Prop([String])
materias: string[];

// DESPUÉS (previene auto-conversión)
@Prop([{ type: String }])
materias: string[];
```

**Por qué:** Mongoose con `[String]` intenta convertir automáticamente strings que parecen ObjectIds válidos (24 caracteres hexadecimales) al tipo ObjectId. Con `[{ type: String }]` forzamos tipo string estricto.

### 2. Backend - Conversión Automática en Registro ✅
**Archivo:** `backend/identity-service/src/modules/auth/auth.service.ts`

**Funcionalidad agregada:**
- Detecta si las materias recibidas son ObjectIds (regex `/^[0-9a-f]{24}$/i`)
- Si detecta IDs, hace una petición al academic-service para obtener los nombres
- Convierte automáticamente los IDs a nombres antes de guardar

**Código:**
```typescript
// En el método registro()
if (createUsuarioDto.rol === 'Tutor' && createUsuarioDto.materias?.length > 0) {
  materiasProcessed = await this.convertMateriaIdsToNames(createUsuarioDto.materias);
}

// Método auxiliar
private async convertMateriaIdsToNames(materias: string[]): Promise<string[]> {
  const objectIdRegex = /^[0-9a-f]{24}$/i;
  // ... lógica de conversión llamando a academic-service
}
```

### 3. Academic Service - Endpoint de Conversión ✅
**Archivos:**
- `backend/academic-service/src/modules/materias/materias.controller.ts`
- `backend/academic-service/src/modules/materias/materias.service.ts`

**Endpoint creado:**
```typescript
POST /materias/ids-to-names
Body: { ids: string[] }
Response: [{ _id: string, nombre: string }]
```

Este endpoint recibe un array de IDs de materias y devuelve sus nombres.

### 4. Script de Corrección de Datos Existentes ✅
**Archivo:** `scripts/fix-materias-objectids.js`

**Función:** Convierte todos los ObjectIds existentes en la base de datos a nombres de materias.

**Uso:**
```bash
docker exec tutorias_db mongosh /tmp/fix-materias.js
```

**Ejecutado:** Corrigió 12 tutores (activos y pendientes) con un total de múltiples conversiones.

### 5. Frontend - Conversión de IDs a Nombres ✅
**Archivos modificados:**
- `frontend/src/app/registro/page.tsx` (React)
- `public/js/registro.js` (HTML estático)

**Cambio:** Antes de enviar el formulario, los IDs de materias seleccionadas se convierten a nombres:

```javascript
// En registro.js
const materiasArray = rol === 'Tutor' 
  ? materiasSeleccionadas.map(id => {
      const materia = materiasDisponibles.find(m => m._id === id);
      return materia ? materia.nombre : id;
    })
  : [];
```

## Capas de Protección Activas

1. **Capa Frontend:** Convierte IDs a nombres antes de enviar
2. **Capa Backend (auth.service):** Detecta y convierte IDs que lleguen
3. **Capa Schema:** Previene auto-conversión de Mongoose
4. **Capa de Datos:** Script de corrección para datos existentes

## Estado Actual

✅ **Todos los tutores activos:** Materias como strings (nombres)
✅ **Todos los tutores pendientes:** Materias como strings (nombres)
✅ **Nuevos registros:** Se guardarán automáticamente como strings
✅ **Servicios activos:** identity-service, academic-service, api-gateway, frontend

## Verificación

Para verificar que todo funciona correctamente:

```bash
# Ver tutores activos
docker exec tutorias_db mongosh --eval "db.getSiblingDB('identity_db').usuarios.find({rol: 'Tutor', activo: true}, {nombre: 1, materias: 1}).pretty()"

# Ver tutores pendientes
docker exec tutorias_db mongosh --eval "db.getSiblingDB('identity_db').usuarios.find({rol: 'Tutor', activo: false}, {nombre: 1, materias: 1}).pretty()"

# Ejecutar corrección si es necesario
docker exec tutorias_db mongosh /tmp/fix-materias.js
```

## Resumen de Tutores Corregidos

Total: 12 tutores
- 10 tutores activos
- 2 tutores pendientes (Luis, Maria)

Todos ahora tienen materias almacenadas como strings con los nombres completos (ej: "Programación I", "Álgebra Lineal", "Metodologías Ágiles", etc.)

## Mantenimiento Futuro

**Si aparecen nuevos ObjectIds:**
1. Ejecutar el script de corrección: `docker exec tutorias_db mongosh /tmp/fix-materias.js`
2. Verificar que los servicios estén actualizados y corriendo
3. Limpiar caché del navegador (CTRL+F5)
4. Reiniciar servicios si es necesario:
   ```bash
   docker-compose restart identity-service academic-service api-gateway frontend
   ```

**Prevención:**
- El backend ahora convierte automáticamente IDs a nombres durante el registro
- El schema previene la auto-conversión de Mongoose
- Múltiples capas de protección garantizan integridad de datos
