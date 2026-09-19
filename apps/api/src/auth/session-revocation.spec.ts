import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { vi } from 'vitest';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { UsersController } from '../users/users.controller.js';
import { UsersService } from '../users/users.service.js';
import { RelationshipsController } from '../relationships/relationships.controller.js';
import { RelationshipsService } from '../relationships/relationships.service.js';
import { CalendarController } from '../calendar/calendar.controller.js';
import { CalendarService } from '../calendar/calendar.service.js';
import { WishlistsController } from '../wishlists/wishlists.controller.js';
import { WishlistsService } from '../wishlists/wishlists.service.js';
import { DayBoardController } from '../day-board/day-board.controller.js';
import { DayBoardService } from '../day-board/day-board.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MailService } from '../mail/mail.service.js';

const routes = ['/auth/me', '/users', '/relationships/me', '/calendar', '/wishlists',
  '/day-board/today', '/day-board/widget', '/day-board/history'];
const secret = 'session-revocation-test-secret';

describe('Отзыв сессий через HTTP', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let user: { id: string; nickname: string; email: string; passwordHash: string; sessionVersion: number };
  let deleted: boolean;
  let resetAvailable: boolean;

  beforeEach(async () => {
    deleted = false;
    resetAvailable = true;
    user = { id: 'user-1', nickname: 'tester', email: 'tester@example.test',
      passwordHash: await bcrypt.hash('Old-password-123', 4), sessionVersion: 0 };
    // Отложенные операции имитируют PrismaPromise внутри транзакции.
    // Пользовательские данные и настоящая БД здесь не используются.
    const prisma = {
      user: {
        findUnique: vi.fn(async () => deleted ? null : { ...user }),
        findFirst: vi.fn(async () => deleted ? null : { ...user }),
        findMany: vi.fn(async () => [{ id: user.id }]),
        update: vi.fn(({ data }: { data: { passwordHash: string; sessionVersion: { increment: number } } }) => () => {
          user.passwordHash = data.passwordHash;
          user.sessionVersion += data.sessionVersion.increment;
          return { ...user };
        }),
        updateMany: vi.fn(async ({ where, data }: {
          where: { id: string; sessionVersion: number };
          data: { sessionVersion: { increment: number } };
        }) => {
          if (where.id !== user.id || where.sessionVersion !== user.sessionVersion) return { count: 0 };
          user.sessionVersion += data.sessionVersion.increment;
          return { count: 1 };
        }),
      },
      passwordResetToken: {
        findUnique: vi.fn(async () => resetAvailable ? {
          id: 'reset-1', userId: user.id, expiresAt: new Date(Date.now() + 60_000),
        } : null),
        deleteMany: vi.fn(() => () => { resetAvailable = false; return { count: 1 }; }),
      },
      $transaction: vi.fn(async (operations: Array<() => unknown>) => operations.map(operation => operation())),
    };
    const module = await Test.createTestingModule({
      imports: [JwtModule.register({ secret, signOptions: { expiresIn: '15m' } })],
      controllers: [AuthController, UsersController, RelationshipsController, CalendarController,
        WishlistsController, DayBoardController],
      providers: [AuthService, UsersService,
        { provide: ConfigService, useValue: { get: () => secret } },
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: {} },
        { provide: RelationshipsService, useValue: { getCurrentRelationship: async () => ({ relationship: null }) } },
        { provide: CalendarService, useValue: { findAll: async () => [] } },
        { provide: WishlistsService, useValue: { findAll: async () => ({ mine: [], partner: [] }) } },
        { provide: DayBoardService, useValue: {
          getToday: async (userId: string) => ({ userId }),
          getWidget: async () => ({}), getHistory: async () => ({ days: [] }),
        } },
      ],
    }).compile();
    jwt = module.get(JwtService);
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterEach(async () => { await app?.close(); });

  async function checkRoutes(token: string, status: number) {
    for (const route of routes) {
      await request(app.getHttpServer()).get(route).auth(token, { type: 'bearer' }).expect(status);
    }
  }

  it.each(['change', 'reset'])('%s: старые сессии закрыты во всех разделах, новый вход работает', async (flow) => {
    const login = await request(app.getHttpServer()).post('/auth/login')
      .send({ login: 'tester', password: 'Old-password-123' }).expect(201);
    const oldToken = login.body.accessToken as string;
    await checkRoutes(oldToken, 200);
    await request(app.getHttpServer()).get('/day-board/today').auth(oldToken, { type: 'bearer' })
      .expect(200, { userId: 'user-1' });
    if (flow === 'change') {
      await request(app.getHttpServer()).patch('/users/me/password').auth(oldToken, { type: 'bearer' })
        .send({ currentPassword: 'Old-password-123', newPassword: 'New-password-456' }).expect(200);
    } else {
      await request(app.getHttpServer()).post('/auth/reset-password')
        .send({ token: 'a'.repeat(64), password: 'New-password-456' }).expect(201);
    }
    await checkRoutes(oldToken, 401);
    await checkRoutes(jwt.sign({ sub: user.id }), 401);
    await request(app.getHttpServer()).post('/auth/login')
      .send({ login: 'tester', password: 'Old-password-123' }).expect(401);
    await request(app.getHttpServer()).post('/auth/reset-password')
      .send({ token: 'a'.repeat(64), password: 'Another-password-789' }).expect(400);
    const newLogin = await request(app.getHttpServer()).post('/auth/login')
      .send({ login: 'tester', password: 'New-password-456' }).expect(201);
    await checkRoutes(newLogin.body.accessToken as string, 200);
  });

  it('сохраняет совместимость старых JWT до первого отзыва', async () => {
    await checkRoutes(jwt.sign({ sub: user.id }), 200);
  });

  it('завершает другие сеансы и сохраняет текущий после проверки пароля', async () => {
    const login = await request(app.getHttpServer()).post('/auth/login')
      .send({ login: 'tester', password: 'Old-password-123' }).expect(201);
    const oldToken = login.body.accessToken as string;

    await request(app.getHttpServer()).post('/auth/sessions/revoke-others')
      .auth(oldToken, { type: 'bearer' })
      .send({ currentPassword: 'wrong-password' }).expect(401);
    await checkRoutes(oldToken, 200);

    const response = await request(app.getHttpServer()).post('/auth/sessions/revoke-others')
      .auth(oldToken, { type: 'bearer' })
      .send({ currentPassword: 'Old-password-123' }).expect(201);
    const currentToken = response.body.accessToken as string;

    await checkRoutes(oldToken, 401);
    await checkRoutes(currentToken, 200);
  });

  it.each(['expired', 'signature', 'deleted', 'missing-sub'])('не принимает токен: %s', async (reason) => {
    const token = reason === 'expired' ? jwt.sign({ sub: user.id }, { expiresIn: -1 })
      : reason === 'signature' ? jwt.sign({ sub: user.id }, { secret: 'wrong-secret' })
      : reason === 'missing-sub' ? jwt.sign({ sessionVersion: 0 }) : jwt.sign({ sub: user.id });
    deleted = reason === 'deleted';
    await checkRoutes(token, 401);
  });

  it('не допускает запросы без токена', async () => {
    for (const route of routes) await request(app.getHttpServer()).get(route).expect(401);
  });
});
