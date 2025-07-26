import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("🔌 Nuevo cliente conectado:", socket.id);

  socket.on("join", (email) => {
    console.log(`📨 Usuario ${email} se unió a su sala`);
    socket.join(email);
  });

  socket.on("disconnect", () => {
    console.log("❌ Cliente desconectado:", socket.id);
  });
});

// Endpoint para emitir desde Directus
app.use(express.json());
app.post("/emit", (req, res) => {
  const { to, type, data } = req.body;
  if (!to || !type || !data) {
    return res.status(400).json({ error: "Faltan parámetros" });
  }

  io.to(to).emit(type, data);
  console.log(`📣 Emitiendo evento '${type}' a ${to}`);
  res.json({ success: true });
});

const PORT = process.env.SOCKET_SERVER_PORT || 4010;

server.listen(PORT, () => {
  console.log(`🚀 Socket server escuchando en puerto ${PORT}`);
});
