// import { Injectable } from '@nestjs/common';
// import * as nodemailer from 'nodemailer';

// @Injectable()
// export class MailService {
//   private transporter: nodemailer.Transporter;

//   constructor() {
//     this.transporter = nodemailer.createTransport({
//       host: process.env.EMAIL_HOST || 'smtp.gmail.com',
//       port: Number(process.env.EMAIL_PORT || 587),
//       secure: false,
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });
//   }

//   async sendMail(to: string, subject: string, html: string) {
//     if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
//       throw new Error('Email credentials are not configured');
//     }

//     await this.transporter.sendMail({
//       from: `"Salwa Trading" <${process.env.EMAIL_USER}>`,
//       to,
//       subject,
//       html,
//     });
//   }
// }

import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT || 465),
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
  }

  async sendMail(to: string, subject: string, html: string) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Email credentials are not configured');
    }

    await this.transporter.sendMail({
      from: `"Salwa Trading" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  }
}