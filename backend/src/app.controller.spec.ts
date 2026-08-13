import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('hello', () => {
    it('should return a hello message', () => {
      expect(appController.getHello()).toEqual({
        message:
          'The backend is awake, caffeinated, and mildly suspicious of the frontend ☕',
      });
    });
  });
});
