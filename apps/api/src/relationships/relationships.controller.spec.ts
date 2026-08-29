import { Test, TestingModule } from '@nestjs/testing';
import { RelationshipsController } from './relationships.controller.js';

describe('RelationshipsController', () => {
  let controller: RelationshipsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RelationshipsController],
    }).compile();

    controller = module.get<RelationshipsController>(RelationshipsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
