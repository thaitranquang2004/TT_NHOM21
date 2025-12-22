export const chatHandler = (io, socket) => {
  const handleNewMessage = (data) => {
    const { chatId, message } = data;
    
    // Ensure message has sender info
    const messageData = {
      ...message,
      sender: {
        _id: socket.user._id,
        username: socket.user.username,
        fullName: socket.user.fullName,
        avatar: socket.user.avatar,
      },
    };

    // Broadcast to others in room
    socket.to(`chat_${chatId}`).emit("newMessage", messageData);
    console.log(`New message in chat ${chatId} from ${socket.user.username}`);
  };

  socket.on("newMessage", handleNewMessage);
};