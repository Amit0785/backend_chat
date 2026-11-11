require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const { socketAuth } = require("./middleware/socketAuth");
const setupSockets = require("./socket/chatSocket");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");

async function start() {
  await connectDB();
  const app = express();
  app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*", credentials: true }));
  app.use(express.json());

  app.get("/health", (req,res)=>res.json({ok:true}));
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/chats", chatRoutes);
  app.use("/api", messageRoutes);

  app.use((err,req,res,next)=>{
    console.error(err);
    res.status(err.status || 500).json({message: err.message || "Server error"});
  });

  const server=http.createServer(app);
  const io=new Server(server,{cors:{origin:process.env.CLIENT_ORIGIN || "*",credentials:true}});
  io.use(socketAuth);
  setupSockets(io);

  const port=process.env.PORT || 5000;
  server.listen(port,()=>console.log(`API listening on ${port}`));
}
start().catch(err=>{console.error(err);process.exit(1)});