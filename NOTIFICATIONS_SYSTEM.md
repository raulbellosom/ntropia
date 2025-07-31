# Sistema de Notificaciones en Tiempo Real

Este documento describe, de manera detallada y profesional, el **flujo de trabajo** del sistema de notificaciones en tiempo real para Ntropia, aprovechando **custom hooks**, **endpoints personalizados** de Directus y un **servidor WebSocket** basado en Socket.IO. Se orienta a un público de **Senior Project Manager** y **Senior Developers**.

---

## 1. Visión General

- **Objetivo:** Garantizar que todas las notificaciones relacionadas con invitaciones y cambios de miembros en los workspaces se propaguen _instantáneamente_ a los usuarios afectados, tanto mediante toasts como mediante componentes de UI (dropdown, modales) en el frontend.
- **Tecnologías:**

  - **Backend:** Directus, MySQL, Socket.IO, Node.js
  - **Frontend:** React, ViteJS, React Query, Zustand (opcional para gestión de estado local), React Hot Toast

---

## 2. Arquitectura de Componentes

```plaintext
+----------------+      +----------------------+      +---------------------+
|   Frontend     | <--> |    Socket Server     | <--> |    Directus Hooks   |
| (React/Vite)   |      | (Express + Socket.IO)|      | + Endpoints         |
+----------------+      +----------------------+      +---------------------+
         │                         │                            │
         │ Socket.IO events        │ POST /emit                 │ DB triggers & HTTP
         │ toast, dropdown updates│                            │ logic (custom hooks)
         ▼                         ▼                            ▼
Real-time UI            Broadcast to rooms            CRUD en tablas

```

---

## 3. Modelo de Datos

Las tablas clave para el sistema de notificaciones son:

| Tabla               | Campos relevantes                                                                  |
| ------------------- | ---------------------------------------------------------------------------------- |
| `invitations`       | `id`, `workspace_id`, `email`, `token`, `status`, `date_created`, `viewed` (nuevo) |
| `workspace_members` | `id`, `workspace_id`, `user_id`, `role`, `status`, `date_created`                  |
| `workspaces`        | `id`, `owner`, `name`, `description`, `is_public`, `canvasHeight`, `canvasWidth`   |
| `directus_users`    | `id`, `first_name`, `last_name`, `email`, `avatar`                                 |

> **Nota:** Se recomienda agregar el campo booleano `viewed` en la tabla `invitations` para gestionar cuándo una notificación ya fue visualizada.

---

## 4. Backend

### 4.1. Servidor WebSocket

**Archivo:** `back/socket-server/index.js`

- Inicializa un servidor Socket.IO escuchando en `process.env.SOCKET_SERVER_PORT`.
- Maneja eventos de conexión:

  - `join` (email) → une al usuario a la sala privada por email.
  - `join-workspace` (workspaceId) → une al usuario a la sala `workspace:${workspaceId}`.

- Proporciona endpoint REST **POST** `/emit` para emitir eventos:

```js
io.to(room).emit(type, data);
```

---

### 4.2. Custom Hooks de Directus

**Archivo:** `back/extensions/invitations-hook/index.js`

1. **filter("invitations.items.create")**

   - Genera `token` si no existe.
   - Envía correo de invitación (Nodemailer).
   - Llama a `/emit` en Socket Server para evento `new-invitation`.

2. **action("invitations.items.create")**

   - Después de crear, emite:

     - `new-invitation` al invitado.
     - `invitation-created` a sala `workspace:${workspaceId}`.

3. **filter("invitations.items.delete")**

   - Captura invitaciones antes de borrado.

4. **action("invitations.items.delete")**

   - Emite `invitation-deleted` tanto al invitado como a la sala del workspace.

5. **action("invitations.items.update")**

   - Al aceptar:

     - Inserta registro en `workspace_members`.
     - Emite `invitation-updated` y `workspace-member-added`.

---

### 4.3. Endpoints Personalizados de Directus

#### 4.3.1. Invitaciones

**Ruta:** `back/extensions/endpoint-invitations/src/index.js`

- **GET /**?token=... → Obtiene datos de invitación y workspace.
- **POST /** → Acepta/Rechaza invitación (query `action=accept|reject`). Emite `invitation-updated` y, si aplica, `workspace-member-added`.
- **POST /validate** → Valida si se puede invitar (códigos de error `ALREADY_MEMBER`, `PENDING_INVITATION`, `OWNER_EMAIL`).
- **GET /workspace/\:workspaceId** → Lista invitaciones del workspace (solo `owner` o miembros).

#### 4.3.2. Workspaces & Miembros

**Ruta:** `back/extensions/endpoint-workspaces/src/index.js`

- **GET /** → Combina workspaces propios y donde es miembro.
- **GET /\:id** → Detalle + miembros.
- **POST /\:workspaceId/members/\:memberId/role** → Cambiar rol; emite `workspace-member-updated`.
- **DELETE /\:workspaceId/members/\:memberId** → Eliminar miembro; emite `workspace-member-removed`.

---

## 5. Flujo de Eventos

1. **Envío de Invitación**

   - Frontend → `POST /endpoint-invitations/validate` → `POST /endpoint-invitations`.
   - Directus Hook (`filter`) genera token + envía email + `new-invitation` vía WebSocket.
   - Hook (`action`) emite también `invitation-created` a sala de workspace.
   - Frontend:

     - `useSocketNotifications` recibe `new-invitation` → muestra toast.
     - Dropdown y Modal escuchan `invitation-created` → actualizan lista en tiempo real.

2. **Aceptación/Rechazo**

   - Frontend → `POST /endpoint-invitations?action=accept|reject`.
   - Directus Endpoint actualiza estado, crea `workspace_member` (si acepta).
   - Emite:

     - `invitation-updated` → refresca dropdown y modal.
     - `workspace-member-added` (si acepta) → actualiza lista de miembros.

3. **Cancelación de Invitación**

   - Frontend → Directus SDK `deleteInvitation` → hook `invitations.items.delete` → emite `invitation-deleted`.
   - Frontend recibe → elimina de dropdown & modal.

4. **Modificación de Rol / Eliminación de Miembro**

   - Frontend → Endpoints de workspace → emiten `workspace-member-updated` o `workspace-member-removed`.
   - Modal de configuración recibe → actualiza lista sin recarga.

---

## 6. Frontend Implementation

### 6.1. Hook de Socket

**Archivo:** `src/hooks/useSocketNotifications.js` fileciteturn0file1

- Conecta a `VITE_SOCKET_URL`.
- `on("new-invitation")` → toast personalizado.
- Debe extenderse para escuchar:

  - `invitation-created`
  - `invitation-updated`
  - `invitation-deleted`
  - `workspace-member-added`
  - `workspace-member-removed`

### 6.2. Dropdown de Notificaciones

**Archivo:** `src/components/common/NotificationsDropdown.jsx` fileciteturn0file2

- Reemplazar polling por **suscripción directa** al estado (Zustand o React Context).
- **Al recibir** evento `invitation-created` o `invitation-updated`:

  ```js
  setNotifications((prev) => updateList(prev, eventData));
  ```

- **Al abrir/hover** sobre cada notificación:

  1. Llamar a `PATCH /items/invitations/{id}` para marcar `viewed: true`.
  2. Dispatch `markAsRead(id)` en store.

### 6.3. Modal de Configuración

**Archivo:** `src/components/WorkspaceConfigModal.jsx` fileciteturn0file0

- Suscribirse a sala `workspace:${workspace.id}` tras abrir modal.
- En cada evento:

  - `invitation-created` → `queryClient.setQueryData(["workspaceInvitations", id], (old) => [...old, newInv])`.
  - `invitation-updated` / `invitation-deleted` → modificar o filtrar.
  - `workspace-member-added` / `workspace-member-removed` → actualizar lista de miembros via `setQueryData(["workspaceMembers", id])`.

---

## 7. Gestión de Estado y Marca de "Visto"

1. **Campo `viewed`** en `invitations` (booleano, default `false`).
2. **UI:** contador de notificaciones = invitaciones con `status = pending` **&&** `viewed = false`.
3. **Evento**: al abrir dropdown o hacer hover → actualizar `viewed` a `true` vía Directus SDK.
4. **Hook de socket** recibe `invitation-updated` con `viewed = true` → quitar de lista en tiempo real.

---

## 8. Buenas Prácticas e Integración

- **React Query**: mantener datos frescos, usar `queryClient.setQueryData` en lugar de invalidate cuando sea posible.
- **Zustand**: manejar estado global de notificaciones para desacoplar UI de componente.
- **Optimización**: evitar renderizados innecesarios, filtrar salas en el servidor WebSocket.
- **Seguridad**: validar siempre `req.accountability.user` en endpoints y hooks.

---

## 9. Conclusión

Este flujo garantiza:

- **Latencia mínima** en la propagación de eventos.
- **Consistencia** entre email, toast y componentes de UI.
- **Escalabilidad**, aprovechando Socket.IO y Directus customizations.
- **Mantenibilidad** con una capa clara de responsabilidades entre backend y frontend.

Con esta especificación, el equipo de desarrollo podrá implementar y extender el sistema de notificaciones en tiempo real de forma sólida y coherente.
