const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `codemax <${process.env.EMAIL_FROM}>`;
    }

    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            return nodemailer.createTransport({
                service: 'mailgun',
                auth: {
                    user: process.env.MAILGUN_USER,
                    pass: process.env.MAILGUN_PASS
                }
        });
        }

        return nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT,
                auth: {
                    user: process.env.EMAIL_USERNAME,
                    pass: process.env.EMAIL_PASSWORD
                }
        });
    }

    // Send the actual mail
    async send(template, subject) {
        // 1) Render HTML based on pug template
        const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject
        });


        // 2) Define email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText.fromString(html)
        }

        // 3) Create a transport and Send email
        await this.newTransport().sendMail(mailOptions);
    }

    async sendWelcome() {
        await this.send('welcome', 'Welcome to the Natours Family');
    }

    async sendPasswordReset() {
        await this.send('passwordReset', 'Your password rest token (valid for 10mins)');
    }
}

// const sendEmail = async(options) => {
//     //1) create a transporter 
//     const transporter = nodemailer.createTransport({
//         host: process.env.EMAIL_HOST,
//         port: process.env.EMAIL_PORT,
//         auth: {
//             user: process.env.EMAIL_USERNAME,
//             pass: process.env.EMAIL_PASSWORD
//         }
//     })

//     //2) define email options
//     const mailOptions = {
//         from: 'codemax <ogbujigodwinmax@gmail.com>',
//         to: options.email,
//         subject: options.subject,
//         text: options.message
//         // html: ''
//     }

//     //3) Actually send the email
//     const msg = await transporter.sendMail(mailOptions);
//     console.log(msg.messageId)
// }

// module.exports = sendEmail;