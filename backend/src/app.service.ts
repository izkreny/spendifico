import { Injectable } from '@nestjs/common';

/**
 * Shape of the `/api/hello` response. The backend owns this contract; the
 * frontend consumes the same shape (see frontend/src/app/page.tsx).
 */
export interface HelloResponse {
  message: string;
}

@Injectable()
export class AppService {
  getHello(): HelloResponse {
    return {
      message:
        'The backend is awake, caffeinated, and mildly suspicious of the frontend ☕',
    };
  }
}
