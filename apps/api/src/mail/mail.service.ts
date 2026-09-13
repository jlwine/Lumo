import {
  Injectable,
  Logger,
} from '@nestjs/common';

import {
  ConfigService,
} from '@nestjs/config';

import * as nodemailer from 'nodemailer';

type MailContent = {
  to: string;
  subject: string;
  text: string;
  html: string;
  developmentUrl?: string;
};

@Injectable()
export class MailService {
  private readonly logger =
    new Logger(
      MailService.name,
    );

  private readonly transporter:
    nodemailer.Transporter | null;

  private readonly from:
    string | null;

  private readonly isProduction:
    boolean;

  constructor(
    private readonly configService:
      ConfigService,
  ) {
    this.isProduction =
      this.configService.get<string>(
        'NODE_ENV',
      ) ===
      'production';

    const host =
      this.configService.get<string>(
        'SMTP_HOST',
      )?.trim() ||
      '';

    const rawPort =
      this.configService.get<string>(
        'SMTP_PORT',
      )?.trim() ||
      '';

    const port =
      Number(
        rawPort,
      );

    const secure =
      this.configService.get<string>(
        'SMTP_SECURE',
      )?.trim()
        .toLowerCase() ===
      'true';

    const user =
      this.configService.get<string>(
        'SMTP_USER',
      )?.trim() ||
      '';

    const password =
      this.configService.get<string>(
        'SMTP_PASSWORD',
      ) ??
      '';

    const configuredFrom =
      this.configService.get<string>(
        'MAIL_FROM',
      )?.trim() ||
      '';

    this.from =
      configuredFrom ||
      (
        user
          ? `Lumo <${user}>`
          : null
      );

    if (
      !host ||
      !Number.isFinite(
        port,
      ) ||
      port <= 0 ||
      !this.from
    ) {
      this.transporter =
        null;

      this.logger.warn(
        'SMTP не настроен. В development ссылки будут выводиться в консоль.',
      );

      return;
    }

    const hasAuth =
      Boolean(
        user &&
        password,
      );

    this.transporter =
      nodemailer.createTransport({
        host,
        port,
        secure,

        ...(hasAuth
          ? {
              auth: {
                user,
                pass:
                  password,
              },
            }
          : {}),
      });
  }

  async sendEmailVerification(
    to: string,
    url: string,
  ) {
    return this.send({
      to,

      subject:
        'Подтвердите email в Lumo',

      text:
        [
          'Подтвердите ваш email в Lumo.',
          '',
          `Откройте ссылку: ${url}`,
          '',
          'Ссылка действует 24 часа.',
          'Если вы не создавали аккаунт Lumo, просто проигнорируйте это письмо.',
        ].join(
          '\n',
        ),

      html:
        this.buildEmailHtml({
          eyebrow:
            'Подтверждение email',

          title:
            'Подтвердите ваш адрес',

          description:
            'Перейдите по ссылке ниже, чтобы подтвердить email и завершить настройку аккаунта Lumo.',

          buttonLabel:
            'Подтвердить email',

          buttonUrl:
            url,

          footer:
            'Ссылка действует 24 часа. Если вы не создавали аккаунт Lumo, это письмо можно проигнорировать.',
        }),

      developmentUrl:
        url,
    });
  }

  async sendPasswordReset(
    to: string,
    url: string,
  ) {
    return this.send({
      to,

      subject:
        'Восстановление пароля в Lumo',

      text:
        [
          'Вы запросили восстановление пароля в Lumo.',
          '',
          `Создать новый пароль: ${url}`,
          '',
          'Ссылка действует 30 минут.',
          'Если это были не вы, просто проигнорируйте письмо.',
        ].join(
          '\n',
        ),

      html:
        this.buildEmailHtml({
          eyebrow:
            'Безопасность',

          title:
            'Создайте новый пароль',

          description:
            'Мы получили запрос на восстановление доступа к вашему аккаунту Lumo.',

          buttonLabel:
            'Создать новый пароль',

          buttonUrl:
            url,

          footer:
            'Ссылка действует 30 минут. Если вы не запрашивали восстановление пароля, ничего делать не нужно.',
        }),

      developmentUrl:
        url,
    });
  }

  private async send(
    content:
      MailContent,
  ) {
    if (
      !this.transporter ||
      !this.from
    ) {
      this.logDevelopmentFallback(
        content,
      );

      return false;
    }

    try {
      await this.transporter.sendMail({
        from:
          this.from,

        to:
          content.to,

        subject:
          content.subject,

        text:
          content.text,

        html:
          content.html,
      });

      this.logger.log(
        `Письмо "${content.subject}" отправлено на ${content.to}`,
      );

      return true;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(
              error,
            );

      this.logger.error(
        `Не удалось отправить письмо на ${content.to}: ${message}`,
      );

      this.logDevelopmentFallback(
        content,
      );

      return false;
    }
  }

  private logDevelopmentFallback(
    content:
      MailContent,
  ) {
    if (
      this.isProduction ||
      !content.developmentUrl
    ) {
      return;
    }

    this.logger.warn(
      [
        '',
        '========================================',
        `Lumo development mail: ${content.subject}`,
        `Email: ${content.to}`,
        `Ссылка: ${content.developmentUrl}`,
        '========================================',
      ].join(
        '\n',
      ),
    );
  }

  private buildEmailHtml({
    eyebrow,
    title,
    description,
    buttonLabel,
    buttonUrl,
    footer,
  }: {
    eyebrow: string;
    title: string;
    description: string;
    buttonLabel: string;
    buttonUrl: string;
    footer: string;
  }) {
    const safeUrl =
      escapeHtml(
        buttonUrl,
      );

    return `
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>

  <body style="margin:0;padding:0;background:#fff8f6;font-family:Arial,Helvetica,sans-serif;color:#554442;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fff8f6;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #eeddda;border-radius:28px;overflow:hidden;">
            <tr>
              <td style="padding:34px 36px 18px;">
                <div style="font-size:28px;font-weight:700;letter-spacing:-0.6px;color:#69514f;">
                  ☾ Lumo
                </div>

                <div style="margin-top:30px;font-size:13px;font-weight:700;color:#c8757c;">
                  ${escapeHtml(eyebrow)}
                </div>

                <h1 style="margin:8px 0 0;font-size:28px;line-height:1.25;color:#554442;">
                  ${escapeHtml(title)}
                </h1>

                <p style="margin:16px 0 0;font-size:15px;line-height:1.7;color:#8f7974;">
                  ${escapeHtml(description)}
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:10px 36px 8px;">
                <a href="${safeUrl}" style="display:inline-block;background:#df8e94;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 22px;border-radius:16px;">
                  ${escapeHtml(buttonLabel)}
                </a>
              </td>
            </tr>

            <tr>
              <td style="padding:22px 36px 34px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#aa9690;">
                  ${escapeHtml(footer)}
                </p>

                <p style="margin:18px 0 0;font-size:11px;line-height:1.6;color:#b8a5a0;word-break:break-all;">
                  Если кнопка не работает, откройте эту ссылку:<br />
                  <a href="${safeUrl}" style="color:#b96b72;">${safeUrl}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
  }
}

function escapeHtml(
  value: string,
) {
  return value
    .replaceAll(
      '&',
      '&amp;',
    )
    .replaceAll(
      '<',
      '&lt;',
    )
    .replaceAll(
      '>',
      '&gt;',
    )
    .replaceAll(
      '"',
      '&quot;',
    )
    .replaceAll(
      "'",
      '&#039;',
    );
}
