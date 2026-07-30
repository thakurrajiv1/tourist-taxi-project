-- Migration 005: create enquiries table for the WhatsApp lead-capture widget

CREATE TABLE IF NOT EXISTS enquiries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  message TEXT,
  source_page VARCHAR(255),
  created_at TIMESTAMP DEFAULT now()
);
