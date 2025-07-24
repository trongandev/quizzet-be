const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const compression = require("compression");
const morgan = require("morgan");
const dotenv = require("dotenv");

const connectDB = require("./config/db");

dotenv.config();
const app = express();

connectDB();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// dùng để log ra các request đến server
app.use(morgan("dev"));
// dùng để nén dữ liệu trước khi gửi về client
app.use(compression());

// Cấu hình session
app.use(
    session({
        secret: process.env.SECRET_KEY, // Sử dụng một secret mạnh
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === "production", // Chỉ sử dụng secure cookie ở production
            maxAge: 24 * 60 * 60 * 1000, // 24 giờ
        },
    })
);

// Middleware Passport
app.use(passport.initialize());
app.use(passport.session());

require("./config/auth"); // Import cấu hình Passport
app.use(require("./routes/google"));

app.use(require("./routes/index"));
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.error(`Server running on port ${PORT}`));
