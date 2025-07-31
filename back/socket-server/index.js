// back/socket-server/index.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import { Server } from "socket.io";

// Variables de entorno
const PORT = process.env.SOCKET_SERVER_PORT || 4010;
const FRONTEND_URL = process.env.FRONTEND_URL || "*";

// Inicialización de Express
const app = express();
app.use(express.json());

// Creación del servidor HTTP y Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
  },
});

// Manejo de conexiones de clientes
io.on("connection", (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);

  // Sala de notificaciones por email (invitaciones)
  socket.on("join", (email) => {
    socket.join(email);
    console.log(`📨 ${socket.id} se unió a sala de email: ${email}`);
    console.log(
      `🔍 [DEBUG] Salas actuales del socket:`,
      Array.from(socket.rooms)
    );
  });

  // Sala de colaboración por workspace
  socket.on("join-workspace", (workspaceId) => {
    const room = `workspace:${workspaceId}`;
    socket.join(room);
    console.log(`📨 ${socket.id} se unió a sala de workspace: ${room}`);
  });

  socket.on("disconnect", (reason) => {
    console.log(`❌ Cliente desconectado: ${socket.id} (${reason})`);
  });
});

// Endpoint para emitir eventos
app.post("/emit", (req, res) => {
  const { to, workspaceId, type, data } = req.body;

  // Definir la sala de emisión
  let room;
  if (to) {
    room = to; // Para notificaciones por email
  } else if (workspaceId) {
    room = `workspace:${workspaceId}`; // Para eventos de canvas
  } else {
    return res
      .status(400)
      .json({ error: 'Falta parámetro "to" o "workspaceId"' });
  }

  // Emitir evento a la sala correspondiente
  console.log(`🔍 [DEBUG] Emitiendo evento "${type}" a sala: ${room}`);
  console.log(
    `🔍 [DEBUG] Sockets en sala "${room}":`,
    io.sockets.adapter.rooms.get(room) || new Set()
  );
  io.to(room).emit(type, data);
  console.log(`📣 Evento "${type}" emitido a sala: ${room}`, data);
  return res.status(200).json({ success: true });
});

// Arranque del servidor
server.listen(PORT, () => {
  console.log(`🚀 Socket server escuchando en puerto ${PORT}`);
});
