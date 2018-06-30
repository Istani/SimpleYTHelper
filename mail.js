'use strict';
const nodemailer = require('nodemailer');

nodemailer.createTestAccount((err, account) => {
    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: '',
            pass: ''
        }
    });

    let mailOptions = {
        from: '"Simple YTH" <s>',
        to: 'sascha.u.kaufmann@googlemail.com',
        subject: 'Hello ✔',
        text: 'Hello world?',
        html: '<b>Hello world?</b>'
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info);
    });
});

