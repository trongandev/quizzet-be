// const mongoose = require("mongoose");

// // Schema cho Message
// const messageSchema = new mongoose.Schema({
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Tham chiếu đến User
//     message: { type: String },
//     image: { type: String },
//     isEdit: { type: Boolean, default: false }, // Có phải tin nhắn đã chỉnh sửa không
//     replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null }, // Tham chiếu đến Message khác
//     reactions: [
//         {
//             userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//             emoji: String,
//         },
//     ],
//     unsend: { type: Boolean, default: false },
//     timestamp: { type: Date, default: Date.now },
// });

// // Schema cho ChatCommunity
// const chatCommunitySchema = new mongoose.Schema({
//     room: { type: String, default: "community", unique: true }, // Tên phòng, mặc định là "community"
//     messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }], // Tham chiếu đến Message
// });

// // Tạo Model
// const Message = mongoose.model("Message", messageSchema);
// const ChatCommunity = mongoose.model("ChatCommunity", chatCommunitySchema);

// module.exports = { Message, ChatCommunity };
