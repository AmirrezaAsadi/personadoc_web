-- Create a local PostgreSQL database for PersonaDoc
-- Run this if you're setting up a local database

-- Connect to PostgreSQL and create database
CREATE DATABASE personadoc;

-- Create a user (optional)
CREATE USER personadoc_user WITH PASSWORD 'your_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE personadoc TO personadoc_user;

-- Your DATABASE_URL should be:
-- postgresql://personadoc_user:your_password_here@localhost:5432/personadoc
