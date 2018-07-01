'use strict';
const nodemailer = require('nodemailer');

const db = require('./db.js');

db.query("SELECT login, password FROM simpleyth_oauth_botcredentials WHERE service='email'", function (err, result) {
    if (err) {
        console.log(err);
        process.exit(1);
    }
    if (result.length == 0) {
        console.log("Entry Email-Credentials Missing");
        process.exit(1);
    }
    SendMail(result[0]);
});

function SendMail(email_data) {
    nodemailer.createTestAccount((err, account) => {
        let transporter = nodemailer.createTransport({
            host: 'webbox14.server-home.org',
            port: 587,
            secure: false,
            auth: {
                user: email_data.login,
                pass: email_data.password
            }
        });

        let mailOptions = {
            from: '"Simple YTH" <simpleyth@randompeople.de>',
            to: 'sascha.u.kaufmann@googlemail.com',
            subject: 'Testmail',
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
}