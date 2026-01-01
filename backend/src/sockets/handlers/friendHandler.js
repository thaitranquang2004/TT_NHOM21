import FriendRequest from "../../models/FriendRequest.js";
import User from "../../models/User.js";

export const friendHandler = (io, socket) => {
  // 1. Get Friends List
  const handleGetFriendsList = async () => {
    try {
      const user = await User.findById(socket.user._id).populate(
        "friends",
        "username fullName avatar onlineStatus"
      );
      socket.emit("friendsListFetched", { friends: user.friends });
    } catch (err) {
      console.error("Socket getFriendsList error:", err);
      socket.emit("error", { message: "Failed to fetch friends list" });
    }
  };

  // 2. Get Incoming Requests
  const handleGetIncomingRequests = async () => {
    try {
      const requests = await FriendRequest.find({
        receiver: socket.user._id,
        status: "pending",
      }).populate("sender", "username fullName avatar");
      socket.emit("incomingRequestsFetched", { requests });
    } catch (err) {
      console.error("Socket getIncomingRequests error:", err);
      socket.emit("error", { message: "Failed to fetch incoming requests" });
    }
  };

  // 3. Send Friend Request
  const handleSendFriendRequest = async (data) => {
    try {
      const { receiverId } = data;
      const senderId = socket.user._id;

      if (senderId.toString() === receiverId) {
          return socket.emit("error", { message: "Cannot send request to yourself"});
      }

      const existing = await FriendRequest.findOne({
        sender: senderId,
        receiver: receiverId,
      });

      if (existing) {
        return socket.emit("error", { message: "Request already exists" });
      }

      const request = new FriendRequest({
        sender: senderId,
        receiver: receiverId,
      });
      await request.save();

      // Notify receiver
      io.to(`user_${receiverId}`).emit("friendRequestReceived", {
        requestId: request._id,
        sender: {
            _id: socket.user._id,
            username: socket.user.username,
            fullName: socket.user.fullName,
            avatar: socket.user.avatar
        }
      });
      
      socket.emit("friendRequestSent", { message: "Request sent successfully" });

    } catch (err) {
      console.error("Socket sendFriendRequest error:", err);
      socket.emit("error", { message: "Failed to send friend request" });
    }
  };

  // 4. Accept Friend Request
  const handleAcceptFriendRequest = async (data) => {
    try {
      const { requestId } = data;
      const request = await FriendRequest.findById(requestId);

      if (!request || request.receiver.toString() !== socket.user._id.toString()) {
        return socket.emit("error", { message: "Request not found or unauthorized" });
      }

      request.status = "accepted";
      await request.save();

      // Add to friends lists
      await User.findByIdAndUpdate(socket.user._id, {
        $addToSet: { friends: request.sender },
      });
      await User.findByIdAndUpdate(request.sender, {
        $addToSet: { friends: socket.user._id },
      });

      // Notify sender
      io.to(`user_${request.sender}`).emit("friendRequestAccepted", {
        requestId: request._id,
        accepter: socket.user
      });

      // Notify receiver (current user) to refresh
      socket.emit("friendRequestAccepted", { requestId: request._id });

    } catch (err) {
      console.error("Socket acceptFriendRequest error:", err);
      socket.emit("error", { message: "Failed to accept request" });
    }
  };

  // 5. Decline Friend Request
  const handleDeclineFriendRequest = async (data) => {
    try {
      const { requestId } = data;
      const request = await FriendRequest.findById(requestId);

      if (!request || request.receiver.toString() !== socket.user._id.toString()) {
        return socket.emit("error", { message: "Request not found or unauthorized" });
      }

      await FriendRequest.findByIdAndDelete(requestId);

      io.to(`user_${request.sender}`).emit("friendRequestDeclined", {
        requestId: request._id,
        declinerId: socket.user._id
      });
      
      socket.emit("friendRequestDeclined", { requestId: request._id });

    } catch (err) {
      console.error("Socket declineFriendRequest error:", err);
      socket.emit("error", { message: "Failed to decline request" });
    }
  };

  // 6. Remove Friend
  const handleRemoveFriend = async (data) => {
    try {
      const { friendId } = data;
      const userId = socket.user._id;

      // Remove from both users' friend lists
      await User.findByIdAndUpdate(userId, {
        $pull: { friends: friendId },
      });
      await User.findByIdAndUpdate(friendId, {
        $pull: { friends: userId },
      });

      // Also remove any existing friend requests between them to be clean
      await FriendRequest.deleteMany({
        $or: [
            { sender: userId, receiver: friendId },
            { sender: friendId, receiver: userId }
        ]
      });

      // Notify friend
      io.to(`user_${friendId}`).emit("friendRemoved", {
        removedBy: userId
      });

      // Notify self
      socket.emit("friendRemoved", { removedFriendId: friendId });

    } catch (err) {
      console.error("Socket removeFriend error:", err);
      socket.emit("error", { message: "Failed to remove friend" });
    }
  };

  socket.on("getFriendsList", handleGetFriendsList);
  socket.on("getIncomingRequests", handleGetIncomingRequests);
  socket.on("sendFriendRequest", handleSendFriendRequest);
  socket.on("acceptFriendRequest", handleAcceptFriendRequest);
  socket.on("declineFriendRequest", handleDeclineFriendRequest);
  socket.on("removeFriend", handleRemoveFriend);
};
