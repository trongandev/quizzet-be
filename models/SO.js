const mongoose = require("mongoose");

const SOSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    version: {
        type: Number,
        default: 1,
    },
    slug: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        trim: true,
    },
    image: {
        type: String,
        default: "https://www.its.ac.id/tmesin/wp-content/uploads/sites/22/2022/07/no-image.png",
    },
    link: {
        type: String,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    lenght: {
        type: Number,
        default: 0,
    },
    view: {
        type: Number,
        default: 1,
    },
    type: {
        type: String,
        enum: ["txt", "pdf", "xlsx", "docx"],
        required: true,
        default: "txt",
    },
    subject: {
        type: String,
        required: true,
        default: "none",
    },
    quest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DataSO",
    },
});

const DataSOSchema = new mongoose.Schema({
    data_so: {
        type: Array,
        required: true,
    },
});

module.exports = {
    SOModel: mongoose.model("SO", SOSchema),
    DataSOModel: mongoose.model("DataSO", DataSOSchema),
};
