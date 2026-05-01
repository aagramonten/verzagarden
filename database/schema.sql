CREATE DATABASE IF NOT EXISTS verzaplants;
USE verzaplants;

CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  business_name VARCHAR(150) NOT NULL,
  whatsapp_number VARCHAR(30) NOT NULL,
  logo_url VARCHAR(255),
  primary_color VARCHAR(20) DEFAULT '#1f7a4d',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  image_url VARCHAR(255),
  light VARCHAR(80),
  water VARCHAR(80),
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

INSERT INTO clients (slug, business_name, whatsapp_number, logo_url, primary_color)
VALUES ('demo-garden', 'Demo Garden PR', '17876195211', '', '#1f7a4d')
ON DUPLICATE KEY UPDATE business_name = business_name;

INSERT INTO plants (client_id, name, category, description, price, stock, image_url, light, water, is_featured)
SELECT id, 'Monstera Deliciosa', 'Interior', 'Planta tropical perfecta para interior con luz indirecta.', 28.00, 12, 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=900', 'Luz indirecta', 'Moderada', TRUE FROM clients WHERE slug='demo-garden'
UNION ALL
SELECT id, 'Ave del Paraíso', 'Exterior', 'Ideal para jardines tropicales y entradas modernas.', 45.00, 7, 'https://images.unsplash.com/photo-1598880940080-ff9a29891b85?q=80&w=900', 'Sol parcial', 'Moderada', TRUE FROM clients WHERE slug='demo-garden'
UNION ALL
SELECT id, 'Sansevieria', 'Interior', 'Resistente, moderna y de bajo mantenimiento.', 18.00, 20, 'https://images.unsplash.com/photo-1593482892290-f54927ae2b7f?q=80&w=900', 'Baja a media', 'Poca', FALSE FROM clients WHERE slug='demo-garden';
