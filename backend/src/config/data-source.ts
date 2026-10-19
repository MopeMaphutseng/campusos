import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'campusos',
  password: process.env.DB_PASSWORD || 'campusos_dev',
  database: process.env.DB_NAME || 'campusos',
  schema: process.env.DB_SCHEMA || 'public',
  logging: process.env.NODE_ENV === 'development',
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  migrationsRun:
    process.env.DB_SYNCHRONIZE === 'true'
      ? false
      : process.env.DB_MIGRATIONS_RUN !== 'false',
  entities: [path.join(__dirname, '..', 'modules', '**', '*.entity.{ts,js}'), path.join(__dirname, '..', 'common', '**', '*.entity.{ts,js}')],
  migrations: [path.join(__dirname, '..', 'database', 'migrations', '*{.ts,.js}')],
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

export default new DataSource(dataSourceOptions);
