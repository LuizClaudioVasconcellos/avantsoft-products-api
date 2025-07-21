import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createDatabaseIfNotExists } from './database.provider';

async function bootstrap() {
  try {
    await createDatabaseIfNotExists();

    const app = await NestFactory.create(AppModule);

    app.enableCors({
      origin: ['http://localhost:3001', 'http://127.0.0.1:3001'],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      allowedHeaders: 'Content-Type,Authorization',
      credentials: true,
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });

    await app.listen(process.env.PORT ?? 3000);
    console.log(`Application is running on: ${await app.getUrl()}`);
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();
