# Sistema de Reservas · Restaurante Familiar

Aplicación web full-stack para administrar mesas, clientes y reservas con disponibilidad en tiempo real. Incluye API REST en Node.js + Express y frontend React (Vite) con panel único para calendario, formulario de reserva y dashboard de ocupación.

## Últimas mejoras aplicadas

- **Diseño admin premium** con fondo animado, glassmorphism en secciones/cards y header + sidebar pegados (sticky) que incluyen dropdown de usuario con logout.
- **Formulario “Nueva reserva”** reordenado en filas de máximo tres columnas, íconos descriptivos, placeholders claros, textarea amplio y botones asimétricos; los mensajes de éxito/error se muestran mediante modal centrado.
- **Calendario admin** bloquea slots pasados, siempre valida en 12h, y autocompleta email/teléfono al reconocer nombres existentes; los avisos usan el portal compartido del cliente.
- **Portal cliente y perfil** organizados con estadísticas, timeline con acciones (ver detalles/repetir), modales comunes y botón “+ Nueva reserva” funcional.
- **API y backend** refinados: error handler captura validaciones Zod, las rutas de clientes están listas, y se refinaron servicios para notificaciones y autollenado.

## 🧱 Tecnologías clave

- **Backend:** Node.js 22, Express 5, Prisma ORM, SQLite (dev) → adaptable a PostgreSQL
- **Frontend:** React 19 + Vite 7, Fetch API y Day.js
- **Validaciones:** Zod para entrada API + reglas de negocio personalizadas
- **Docs:** README + PDF en `docs/entregable.pdf`

## ✅ Reglas de negocio soportadas

- Evita doble reserva para misma mesa y horario
- Respeta horario laboral configurable (`WORK_HOURS_START/END` + intervalos)
- Verifica capacidad de la mesa frente a `numeroPersonas`
- Bloquea reservas canceladas sin borrar historial
- Autocompleta/crea cliente en el alta de reserva (por email o datos básicos)

## 🚀 Puesta en marcha

> Requisitos: Node.js ≥ 18 y npm. El proyecto usa SQLite por defecto; no necesitas servicios adicionales.

### Opción rápida con Docker Compose

```bash
docker compose up --build
```

- API disponible en `http://localhost:4000`
- Frontend Vite en `http://localhost:5173`
- Detén con `docker compose down`

### 1. Backend API

```bash
cd server
copy .env.example .env   # Windows
npm install
npm run prisma:generate
npm run prisma:seed       # crea tablas + mesas demo
npm run dev               # http://localhost:4000
```

- Cambia `DATABASE_URL` si deseas PostgreSQL (ajusta `provider` en `prisma/schema.prisma`).
- El script `prisma:seed` inicializa las mesas base y garantiza que el esquema SQLite exista.

### 2. Frontend

```bash
cd client
copy .env.example .env
npm install
npm run dev               # http://localhost:5173
```

Para producción usa `npm run build` + `npm run preview`.

## 📡 Endpoints principales

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/mesas` | Lista todas las mesas |
| POST | `/api/mesas` | Crea mesa (número, capacidad, ubicación) |
| PUT | `/api/mesas/:id` | Actualiza mesa |
| DELETE | `/api/mesas/:id` | Elimina mesa |
| GET | `/api/reservas` | Todas las reservas con cliente/mesa |
| GET | `/api/reservas/fecha/:fecha` | Reservas por fecha `YYYY-MM-DD` |
| GET | `/api/reservas/disponibilidad?fecha=&hora=` | Matriz disponibilidad |
| GET | `/api/reservas/hoy` | Reservas del día |
| POST | `/api/reservas` | Crea reserva (datos cliente + validaciones) |
| PUT | `/api/reservas/:id` | Modifica reserva/estado |
| DELETE | `/api/reservas/:id` | Cancela (marca estado CANCELADA) |
| GET | `/api/clientes` | Lista clientes |
| GET | `/api/clientes/:id/historial` | Historial completo |
| POST | `/api/clientes` | Alta manual de clientes |

Ejemplo `POST /api/reservas` cuerpo:

```json
{
  "mesaId": 1,
  "fecha": "2025-08-11",
  "hora": "13:00",
  "numeroPersonas": 2,
  "cliente": {
    "nombre": "Ana Pérez",
    "telefono": "555-1234",
    "email": "ana@example.com"
  }
}
```

## 🖥️ Frontend (Vite + React)

- Selector de fecha con recarga rápida
- Tarjetas de métricas: reservas del día, % ocupación, mesas disponibles, pax reservados
- Matriz de disponibilidad por mesa/horario
- Formulario con validación básica y feedback de éxito/error
- Listado de reservas con estado (Confirmada/Cancelada/Completada)

Para capturas solicitadas crea la carpeta `docs/screenshots/` y guarda imágenes generadas desde el navegador; enlázalas en el PDF si lo deseas.

## 📂 Scripts útiles

### Backend (`server/package.json`)

- `npm run dev` → API con nodemon
- `npm run start` → API en modo producción
- `npm run prisma:generate` → genera cliente Prisma (salida en `server/generated/client`)
- `npm run prisma:migrate` → prepara migraciones (ajusta a tu motor preferido)
- `npm run prisma:seed` → crea/actualiza tablas y mesas demo

### Frontend (`client/package.json`)

- `npm run dev` → Vite dev server
- `npm run build` → Compila a producción (`client/dist`)
- `npm run preview` → Previsualiza build
- `npm run lint` → Reglas por defecto de Vite + ESLint

## 🔐 Notas de seguridad

- Usa variables de entorno para credenciales (ya excluidas del repo con `**/.env*`)
- CORS restringido vía `FRONTEND_ORIGIN`
- Validaciones de entrada en backend (Zod) + sanitización mínima en frontend

---

¿Dudas o mejoras? Abre un issue en tu repositorio al publicar este proyecto.
