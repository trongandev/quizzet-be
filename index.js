const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const quizRoutes = require("./routes/quiz");
const HistoryRoutes = require("./routes/history");
const AdminRoutes = require("./routes/admin");
const connectDB = require("./config/db");
const app = express();
const dotenv = require("dotenv");
dotenv.config();

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/history", HistoryRoutes);
app.use("/api/admin", AdminRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
