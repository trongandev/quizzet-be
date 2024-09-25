const nodemailer = require("nodemailer");
// create reusable transporter object using the default SMTP transport

const SENDMAIL = async (mailDetails, callback) => {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.MAIL_SERVER,
            pass: process.env.MAIL_PASS,
        },
    });
    try {
        const info = await transporter.sendMail(mailDetails);
        callback(info);
    } catch (error) {
        console.log(error);
    }
};

module.exports = SENDMAIL;
