-- Migration 002: create admins table for Module 3 (Admin Auth)
-- Run this against your existing database. Fresh installs already get this
-- table from schema.sql.

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);
