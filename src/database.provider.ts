import { DataSource, DataSourceOptions } from 'typeorm';
import { Logger } from '@nestjs/common';

const logger = new Logger('DatabaseProvider');

export async function createDatabaseIfNotExists() {
  const adminConfig: DataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
    database: 'postgres',
  };

  const adminDataSource = new DataSource(adminConfig);

  try {
    await adminDataSource.initialize();
    logger.log('Connected to PostgreSQL admin database');

    const dbName = process.env.DB_NAME || 'products_db';
    const result: Array<{ exists: boolean }> = await adminDataSource.query(
      `SELECT 1 FROM pg_database WHERE datname = '${dbName}'`,
    );

    if (result.length === 0) {
      logger.log(`Creating database: ${dbName}`);
      await adminDataSource.query(`CREATE DATABASE "${dbName}"`);
      logger.log(`Database ${dbName} created successfully`);
    } else {
      logger.log(`Database ${dbName} already exists`);
    }

    await adminDataSource.destroy();
  } catch (error) {
    logger.error('Error creating database', error);
    throw error;
  }
}
