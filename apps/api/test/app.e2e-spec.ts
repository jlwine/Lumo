import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { MailService } from '../src/mail/mail.service.js';

// Проверяем настоящую сборку модулей, не подключая БД и SMTP.
 describe('AppModule (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService).useValue({ user: {
        findUnique: async () => ({ id: 'user-1', sessionVersion: 1 }),
      } })
      .overrideProvider(MailService).useValue({})
      .overrideProvider(ConfigService).useValue({ get: () => 'app-module-test-secret' })
      .compile();
    jwt = module.get(JwtService);
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });
  afterAll(async () => { await app?.close(); });

  it.each(['/auth/me', '/users', '/relationships/me', '/calendar', '/wishlists',
    '/day-board/today', '/day-board/widget', '/day-board/history'])('%s требует авторизации и отклоняет отозванную сессию', async (route) => {
    await request(app.getHttpServer()).get(route).expect(401);
    const token = jwt.sign({ sub: 'user-1', sessionVersion: 0 });
    await request(app.getHttpServer()).get(route).auth(token, { type: 'bearer' }).expect(401);
  });

  it('проверяет входные данные входа', async () => {
    await request(app.getHttpServer()).post('/auth/login').send({}).expect(400);
  });
});