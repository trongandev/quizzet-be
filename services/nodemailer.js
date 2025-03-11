// const nodemailer = require("nodemailer");
// const { google } = require("googleapis");
// const { HTML_TEMPLATE, CONTRIBUTE_HTML } = require("./html-template");
// const dotenv = require("dotenv");
// dotenv.config();
// const OAuth2 = google.auth.OAuth2;

// const { MAIL_CLIENT_ID, MAIL_CLIENT_SECRET, REDIRECT_URI, MAIL_REFRESH_TOKEN, MAIL_SERVER } = process.env;
// const OAuth2Client = new OAuth2(MAIL_CLIENT_ID, MAIL_CLIENT_SECRET, MAIL_REFRESH_TOKEN, REDIRECT_URI);

// OAuth2Client.setCredentials({ refresh_token: MAIL_REFRESH_TOKEN });

// const accessToken = OAuth2Client.getAccessToken();

// let transporter = nodemailer.createTransport({
//     service: "gmail",
//     host: "smtp.gmail.com",
//     port: 587,
//     secure: false,
//     auth: {
//         type: "OAuth2",
//         user: MAIL_SERVER,
//         clientId: MAIL_CLIENT_ID,
//         accessToken,
//         clientSecret: MAIL_CLIENT_SECRET,
//         refreshToken: MAIL_REFRESH_TOKEN,
//     },
// });

// // Modify the email sending functions to use the async transporter
// const sendForgetPasswordMail = async (user, new_password) => {
//     try {
//         const options = {
//             to: user.email,
//             subject: "Quên mật khẩu",
//             html: HTML_TEMPLATE(user.displayName || "Người ẩn danh", new_password, "Mật khẩu tạm thời", "Vui lòng đăng nhập để thay đổi mật khẩu mới"),
//         };

//         await transporter.sendMail(options);
//     } catch (error) {
//         console.log(error);
//     }
// };

// const sendOTPMail = async (user) => {
//     try {
//         const options = {
//             to: user.email,
//             subject: "Xác thực OTP",
//             html: HTML_TEMPLATE(user.displayName || "Người ẩn danh", user.otp, "Mã OTP", "Mã OTP chỉ có hiệu lực trong 10 phút"),
//         };

//         await transporter.sendMail(options);
//     } catch (error) {
//         console.log(error);
//     }
// };

// const sendFeedbackMail = async (username, feedback) => {
//     try {
//         const options = {
//             to: "trongandev@gmail.com",
//             subject: "Thư cảm ơn bạn đã phản hồi cũng như đóng góp",
//             html: CONTRIBUTE_HTML(username, feedback),
//         };

//         await transporter.sendMail(options);
//     } catch (error) {
//         console.log(error);
//     }
// };

// module.exports = { sendForgetPasswordMail, sendOTPMail, sendFeedbackMail };
