const Chat = require("../models/Chat");
const Message = require("../models/Message");
const onlineSockets = new Map();

module.exports = function (io) {
  io.on("connection", async (socket) => {
    const user = socket.user;
    onlineSockets.set(
      String(user._id),
      (onlineSockets.get(String(user._id)) || 0) + 1,
    );
    await require("../models/User").findByIdAndUpdate(user._id, {
      online: true,
    });
    io.emit("user_online", { userId: String(user._id) });

    socket.on("join_chat", async (chatId) => {
      const chat = await Chat.findOne({ _id: chatId, participants: user._id });
      if (chat) socket.join(String(chatId));
      else socket.emit("socket_error", { message: "Not a chat member" });
    });
    socket.on("leave_chat", (chatId) => socket.leave(String(chatId)));

    socket.on("send_message", async (data) => {
      try {
        const chat = await Chat.findOne({
          _id: data.chatId,
          participants: user._id,
        });
        if (!chat)
          return socket.emit("socket_error", { message: "Not a chat member" });
        const text = String(data.text || "").trim();
        if (!text) return;
        const m = await Message.create({
          chat: chat._id,
          sender: user._id,
          text,
          readBy: [user._id],
        });
        chat.lastMessage = m._id;
        await chat.save();
        await m.populate("sender", "name email avatar");
        io.to(String(chat._id)).emit("new_message", m);
      } catch (e) {
        socket.emit("socket_error", { message: "Could not send message" });
      }
    });

    socket.on("typing", (data) =>
      socket
        .to(String(data.chatId))
        .emit("user_typing", { chatId: data.chatId, userId: String(user._id) }),
    );
    socket.on("stop_typing", (data) =>
      socket
        .to(String(data.chatId))
        .emit("user_stop_typing", {
          chatId: data.chatId,
          userId: String(user._id),
        }),
    );

    socket.on("message_read", async (data) => {
      try {
        const chat = await Chat.findOne({
          _id: data.chatId,
          participants: user._id,
        });
        if (!chat) return;
        const m = await Message.findOneAndUpdate(
          { _id: data.messageId, chat: data.chatId },
          { $addToSet: { readBy: user._id } },
          { new: true },
        );
        if (m)
          io.to(String(data.chatId)).emit("message_read", {
            messageId: String(m._id),
            userId: String(user._id),
          });
      } catch (e) {}
    });

    socket.on("disconnect", async () => {
      const id = String(user._id),
        count = (onlineSockets.get(id) || 1) - 1;
      if (count <= 0) {
        onlineSockets.delete(id);
        await require("../models/User").findByIdAndUpdate(user._id, {
          online: false,
          lastSeen: new Date(),
        });
        io.emit("user_offline", { userId: id, lastSeen: new Date() });
      } else onlineSockets.set(id, count);
    });
  });
};
