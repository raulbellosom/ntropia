# Sistema de Notificaciones en Tiempo Real - Ntropia

## Descripción

Este sistema implementa notificaciones en tiempo real para invitaciones de workspace usando WebSockets. Las notificaciones se muestran tanto como toasts temporales como en un dropdown persistente de notificaciones.

## Arquitectura

### Frontend

#### 1. Store de Notificaciones (`useNotificationStore.js`)

- **Zustand store** que maneja el estado global de notificaciones
- **Persistencia** con localStorage
- **Funciones principales**:
  - `addNotification`: Agregar nueva notificación
  - `markAsRead`: Marcar como leída
  - `removeNotification`: Eliminar notificación
  - `removeNotificationByInvitationId`: Limpiar por ID de invitación
  - `markAllAsRead`: Marcar todas como leídas

#### 2. Socket Client (`useSocketClient.js`)

- **Singleton pattern** para manejar la conexión WebSocket
- **Gestión automática** de reconexión
- **Salas por email** del usuario para notificaciones personales

#### 3. Socket Notifications (`useSocketNotifications.jsx`)

- **Hook principal** que escucha eventos WebSocket
- **Integra** con el store de notificaciones
- **Eventos que maneja**:
  - `new-invitation`: Nueva invitación recibida
  - `invitation-updated`: Invitación aceptada/rechazada
  - `invitation-created`: Nueva invitación en workspace
  - `invitation-deleted`: Invitación eliminada
  - `workspace-member-added`: Nuevo miembro agregado
  - `workspace-member-updated`: Miembro actualizado
  - `workspace-member-removed`: Miembro eliminado

#### 4. Unified Notifications (`useNotifications.js`)

- **Hook unificado** que combina:
  - Invitaciones pendientes (API)
  - Notificaciones del store
- **Elimina duplicados** automáticamente
- **Formateo** de tiempo relativo

#### 5. Componentes

- **NotificationsDropdown**: Dropdown con todas las notificaciones
- **Integración en layouts**: MainLayout y CanvasLayout

### Backend

#### 1. Socket Server (`back/socket-server/index.js`)

- **Express + Socket.IO** server
- **Salas por email**: Para notificaciones personales
- **Salas por workspace**: Para eventos colaborativos
- **Endpoint POST /emit**: Para emitir eventos desde extensiones

#### 2. Hook de Invitaciones (`back/extensions/hook-invitations/src/index.js`)

- **Hook de Directus** que se ejecuta en operaciones CRUD
- **Envío de emails** con nodemailer
- **Eventos WebSocket**:
  - `new-invitation`: Al crear invitación
  - `invitation-created`: Para actualizar workspace

#### 3. Endpoint de Invitaciones (`back/extensions/endpoint-invitations/src/index.js`)

- **API REST** para aceptar/rechazar invitaciones
- **Eventos WebSocket**:
  - `invitation-updated`: Al cambiar estado
  - `workspace-member-added`: Al aceptar invitación

## Flujo de Funcionamiento

### 1. Crear Invitación

1. Usuario crea invitación en modal de configuración
2. **Hook backend** se ejecuta (`invitations.items.create`)
3. Se envía **email** al invitado
4. Se emite evento **`new-invitation`** al email del invitado
5. Se emite evento **`invitation-created`** al workspace

### 2. Recibir Invitación

1. Usuario invitado tiene WebSocket conectado
2. Recibe evento **`new-invitation`**
3. Se **agrega notificación** al store
4. Se muestra **toast temporal**
5. Se **actualiza** dropdown de notificaciones
6. Se **invalida cache** de invitaciones pendientes

### 3. Aceptar/Rechazar Invitación

1. Usuario hace clic en "Ver solicitud"
2. Navega a página de aceptación
3. Al aceptar/rechazar:
   - Se llama **endpoint** correspondiente
   - Se emite **`invitation-updated`**
   - Se **remueve notificación** del store
   - Se emite **`workspace-member-added`** (si acepta)

### 4. Workspace en Tiempo Real

1. **Modal de configuración** escucha eventos:
   - `invitation-created`: Actualiza lista de pendientes
   - `invitation-deleted`: Remueve de lista
   - `workspace-member-added`: Actualiza miembros
2. **Invalidación automática** de queries con React Query

## Configuración de Variables de Entorno

### Backend

```env
SOCKET_SERVER_PORT=4010
SOCKET_SERVER_URL=http://localhost:4010
FRONTEND_URL=http://localhost:5173
```

### Frontend

```env
VITE_SOCKET_URL=http://localhost:4010
```

## Eventos WebSocket

### Para Usuario (Sala: email)

- `new-invitation`: Nueva invitación recibida
- `invitation-updated`: Estado de invitación cambió

### Para Workspace (Sala: workspace:ID)

- `invitation-created`: Nueva invitación en workspace
- `invitation-deleted`: Invitación eliminada
- `workspace-member-added`: Nuevo miembro
- `workspace-member-updated`: Miembro actualizado
- `workspace-member-removed`: Miembro eliminado

## Estructura de Datos

### Notificación

```javascript
{
  id: string,
  type: "invitation" | "other",
  title: string,
  message: string,
  timestamp: string,
  read: boolean,
  data: {
    invitationId: number,
    token: string,
    workspaceName: string,
    inviterName: string,
    workspaceId: number
  }
}
```

### Evento new-invitation

```javascript
{
  invitationId: number,
  workspaceName: string,
  inviterName: string,
  token: string,
  workspaceId: number
}
```

## Características Principales

- ✅ **Tiempo real**: WebSockets para actualizaciones instantáneas
- ✅ **Persistencia**: Notificaciones guardadas en localStorage
- ✅ **Sin duplicados**: Sistema inteligente de deduplicación
- ✅ **Estado leído/no leído**: Gestión completa de estados
- ✅ **Auto-limpieza**: Notificaciones se eliminan al aceptar/rechazar
- ✅ **Formato tiempo**: Tiempo relativo (hace 5m, 2h, etc.)
- ✅ **Reconexión**: Manejo automático de desconexiones
- ✅ **Salas dinámicas**: Por email y workspace
- ✅ **Toast + Dropdown**: Doble sistema de notificaciones

## Uso

### En Layouts

```javascript
import { useSocketNotifications } from "../hooks/useSocketNotifications";

export default function MainLayout() {
  // Inicializar WebSocket global para notificaciones
  useSocketNotifications();

  return (
    <div>
      <NotificationsDropdown />
      {/* resto del layout */}
    </div>
  );
}
```

### En Componentes

```javascript
import useNotifications from "../hooks/useNotifications";

export default function MyComponent() {
  const { notifications, unreadCount, markAsRead, removeNotification } =
    useNotifications();

  return (
    <div>
      <span>Notificaciones sin leer: {unreadCount}</span>
      {/* resto del componente */}
    </div>
  );
}
```
