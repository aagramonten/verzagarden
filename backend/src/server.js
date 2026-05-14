import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { pool } from './db.js';
import OpenAI from 'openai';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import * as XLSX from 'xlsx';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

dotenv.config();

const app = express();

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowed =
      origin === 'https://verzagarden.com' ||
      origin === 'https://www.verzagarden.com' ||
      /^https:\/\/[\w-]+\.verzagarden\.com$/.test(origin);
    if (allowed) {
      callback(null, true);
    } else {
      if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        return callback(null, true);
      }
      callback(new Error(`CORS bloqueado para origin: ${origin}`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// =======================
// 🔧 AUTO-MIGRATE
// =======================
async function ensureCostPriceColumn() {
  try {
    const [rows] = await pool.query(`
      SELECT COUNT(*) as cnt FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'plants' 
      AND COLUMN_NAME = 'cost_price'
    `);
    if (rows[0].cnt === 0) {
      await pool.query(`ALTER TABLE plants ADD COLUMN cost_price DECIMAL(10,2) NULL DEFAULT NULL`);
      console.log('✅ cost_price column added');
    } else {
      console.log('✅ cost_price column already exists');
    }
  } catch (err) {
    console.warn('cost_price migration warning:', err.message);
  }
}

async function ensureWhatsappMessage() {
  try {
    const [rows] = await pool.query(`
      SELECT COUNT(*) as cnt FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'clients' 
      AND COLUMN_NAME = 'whatsapp_message'
    `);
    if (rows[0].cnt === 0) {
      await pool.query(`ALTER TABLE clients ADD COLUMN whatsapp_message TEXT NULL DEFAULT NULL`);
      console.log('✅ whatsapp_message column added');
    } else {
      console.log('✅ whatsapp_message column already exists');
    }
  } catch (err) {
    console.warn('whatsapp_message migration warning:', err.message);
  }
}

async function ensureCategoriesTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        slug VARCHAR(100) NOT NULL,
        name VARCHAR(150) NOT NULL,
        name_en VARCHAR(150),
        icon VARCHAR(80) DEFAULT 'leaf',
        description TEXT,
        description_en TEXT,
        ideal VARCHAR(255),
        ideal_en VARCHAR(255),
        group_type VARCHAR(50) DEFAULT 'plants',
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        UNIQUE KEY unique_client_slug (client_id, slug)
      )
    `);
    console.log('✅ categories table ready');

    // Seed default categories for each client that has none
    const [clients] = await pool.query('SELECT id FROM clients');
    for (const client of clients) {
      const [existing] = await pool.query('SELECT COUNT(*) as cnt FROM categories WHERE client_id = ?', [client.id]);
      if (existing[0].cnt === 0) {
        await seedDefaultCategories(client.id);
        console.log(`✅ Default categories seeded for client ${client.id}`);
      }
    }
  } catch (err) {
    console.warn('categories migration warning:', err.message);
  }
}

async function seedDefaultCategories(clientId) {
  const defaults = [
    { slug: 'arboles',            name: 'Árboles',                name_en: 'Trees',            icon: 'tree-pine',     description: 'Plantas grandes con un tronco principal leñoso que se ramifica a cierta altura.', description_en: 'Large plants with a single woody trunk that branches at a certain height.',        ideal: 'Sombra, estructura y jardines amplios.',                    ideal_en: 'Shade, structure and large gardens.',                         group_type: 'plants',    sort_order: 1 },
    { slug: 'arbustos',           name: 'Arbustos',               name_en: 'Shrubs',           icon: 'leaf',          description: 'Plantas medianas con varios tallos leñosos que crecen desde la base.',            description_en: 'Medium-sized plants with multiple woody stems growing from the base.',            ideal: 'Bordes, divisiones naturales y jardines frondosos.',          ideal_en: 'Borders, natural dividers and lush gardens.',                 group_type: 'plants',    sort_order: 2 },
    { slug: 'flores-estacion',    name: 'Flores de estación',     name_en: 'Seasonal Flowers', icon: 'flower-2',      description: 'Plantas que florecen en épocas específicas del año y aportan color al jardín.',   description_en: 'Plants that bloom at specific times of year and add color to the garden.',       ideal: 'Renovar espacios según la temporada.',                        ideal_en: 'Refreshing spaces according to the season.',                  group_type: 'plants',    sort_order: 3 },
    { slug: 'interior',           name: 'Plantas de interior',    name_en: 'Indoor Plants',    icon: 'home',          description: 'Plantas que se adaptan bien a espacios interiores con luz y humedad controladas.', description_en: 'Plants that thrive indoors with controlled light and humidity.',                  ideal: 'Hogares, oficinas y decoración interior.',                    ideal_en: 'Homes, offices and interior décor.',                          group_type: 'plants',    sort_order: 4 },
    { slug: 'trepadoras',         name: 'Trepadoras',             name_en: 'Climbers',         icon: 'sprout',        description: 'Plantas que necesitan soporte para crecer hacia arriba.',                         description_en: 'Plants that need support to grow upward.',                                        ideal: 'Cubrir paredes, crear sombra y añadir privacidad.',           ideal_en: 'Covering walls, creating shade and adding privacy.',          group_type: 'plants',    sort_order: 5 },
    { slug: 'suculentas',         name: 'Suculentas',             name_en: 'Succulents',       icon: 'sun',           description: 'Plantas que almacenan agua en hojas, tallos o raíces, toleran mejor la sequía.',  description_en: 'Plants that store water in leaves, stems or roots, tolerating drought well.',    ideal: 'Bajo mantenimiento y espacios soleados.',                     ideal_en: 'Low maintenance and sunny spaces.',                           group_type: 'plants',    sort_order: 6 },
    { slug: 'palmas',             name: 'Palmas',                 name_en: 'Palms',            icon: 'tree-palm',     description: 'Plantas tropicales que aportan altura, elegancia y sensación caribeña.',          description_en: 'Tropical plants that add height, elegance and a Caribbean feel.',                 ideal: 'Entradas, patios, terrazas y jardines tropicales.',           ideal_en: 'Entrances, patios, terraces and tropical gardens.',           group_type: 'plants',    sort_order: 7 },
    { slug: 'tiestos-macetas',    name: 'Tiestos y Macetas',      name_en: 'Pots & Planters',  icon: 'archive',       description: 'Envases de barro, plástico, cerámica y materiales reciclados para todo tipo de plantas.', description_en: 'Clay, plastic, ceramic and recycled pots for all types of plants.',          ideal: 'Interior, exterior, balcones y terrazas.',                   ideal_en: 'Indoors, outdoors, balconies and terraces.',                  group_type: 'products',  sort_order: 8 },
    { slug: 'tierra-sustratos',   name: 'Tierra y Sustratos',     name_en: 'Soil & Substrates',icon: 'layers',        description: 'Mezclas de suelo, turba, perlita y sustrato especializado para cada tipo de planta.',     description_en: 'Soil mixes, peat, perlite and specialized substrate for every plant type.',   ideal: 'Siembra, trasplante y jardinería en general.',                ideal_en: 'Planting, transplanting and general gardening.',              group_type: 'products',  sort_order: 9 },
    { slug: 'fertilizantes',      name: 'Fertilizantes y Abonos', name_en: 'Fertilizers',      icon: 'flask-conical', description: 'Abonos orgánicos, líquidos y granulados para estimular el crecimiento y la floración.',   description_en: 'Organic, liquid and granulated fertilizers to boost growth and blooming.',    ideal: 'Nutrición, crecimiento y floración de plantas.',              ideal_en: 'Plant nutrition, growth and blooming.',                       group_type: 'products',  sort_order: 10 },
    { slug: 'herramientas',       name: 'Herramientas',           name_en: 'Tools',            icon: 'hammer',        description: 'Palas, podadoras, guantes, regaderas y todo lo que necesitas para cuidar tu jardín.',    description_en: 'Shovels, pruners, gloves, watering cans and everything for your garden.',     ideal: 'Jardinería, poda, siembra y mantenimiento.',                  ideal_en: 'Gardening, pruning, planting and maintenance.',               group_type: 'products',  sort_order: 11 },
  ];

  for (const cat of defaults) {
    await pool.query(`
      INSERT IGNORE INTO categories 
        (client_id, slug, name, name_en, icon, description, description_en, ideal, ideal_en, group_type, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [clientId, cat.slug, cat.name, cat.name_en, cat.icon, cat.description, cat.description_en, cat.ideal, cat.ideal_en, cat.group_type, cat.sort_order]);
  }
}

async function ensureAdminUsersTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        username VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('owner', 'manager', 'vendor') NOT NULL DEFAULT 'vendor',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        UNIQUE KEY unique_client_username (client_id, username)
      )
    `);
    console.log('✅ admin_users table ready');
    const [clients] = await pool.query('SELECT id, admin_user, admin_password FROM clients');
    for (const client of clients) {
      if (!client.admin_user) continue;
      const [existing] = await pool.query(
        'SELECT id FROM admin_users WHERE client_id = ? AND role = "owner" LIMIT 1',
        [client.id]
      );
      if (existing.length === 0) {
        const hashed = await bcrypt.hash(client.admin_password || 'admin123', 10);
        await pool.query(
          `INSERT IGNORE INTO admin_users (client_id, name, username, password, role) VALUES (?, 'Dueño', ?, ?, 'owner')`,
          [client.id, client.admin_user, hashed]
        );
        console.log(`✅ Owner migrado para cliente ${client.id}`);
      }
    }
  } catch (err) { console.warn('admin_users migration warning:', err.message); }
}

ensureCostPriceColumn();
ensureWhatsappMessage();
ensureAdminUsersTable();
ensureCategoriesTable();

// =======================

app.get('/api/health', (req, res) => {
  res.json({ ok: true, app: 'VerzaPlants API' });
});

app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No se subió ninguna imagen' });
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'verzaplants' },
        (error, result) => { if (error) reject(error); else resolve(result); }
      );
      stream.end(req.file.buffer);
    });
    res.json({ url: result.secure_url });
  } catch (error) {
    res.status(500).json({ message: 'Error subiendo imagen', error: error.message });
  }
});

app.post('/api/clients/:slug/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [clients] = await pool.query('SELECT id FROM clients WHERE slug = ? LIMIT 1', [req.params.slug]);
    if (!clients.length) return res.status(404).json({ message: 'Cliente no encontrado' });
    const [users] = await pool.query(
      'SELECT * FROM admin_users WHERE client_id = ? AND username = ? AND is_active = TRUE LIMIT 1',
      [clients[0].id, username]
    );
    if (!users.length) return res.status(401).json({ message: 'Credenciales incorrectas' });
    const user = users[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Credenciales incorrectas' });
    res.json({ ok: true, slug: req.params.slug, user_id: user.id, name: user.name, role: user.role });
  } catch (error) {
    res.status(500).json({ message: 'Error en login', error: error.message });
  }
});

// =======================
// 👥 ADMIN USERS — solo owner
// =======================
app.get('/api/clients/:slug/admin-users', async (req, res) => {
  try {
    if (req.headers['x-user-role'] !== 'owner') return res.status(403).json({ message: 'Solo el dueño puede ver los usuarios' });
    const [clients] = await pool.query('SELECT id FROM clients WHERE slug = ? LIMIT 1', [req.params.slug]);
    if (!clients.length) return res.status(404).json({ message: 'Cliente no encontrado' });
    const [users] = await pool.query(
      'SELECT id, name, username, role, is_active, created_at FROM admin_users WHERE client_id = ? ORDER BY role ASC, name ASC',
      [clients[0].id]
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo usuarios', error: error.message });
  }
});

app.post('/api/clients/:slug/admin-users', async (req, res) => {
  try {
    if (req.headers['x-user-role'] !== 'owner') return res.status(403).json({ message: 'Solo el dueño puede crear usuarios' });
    const [clients] = await pool.query('SELECT id FROM clients WHERE slug = ? LIMIT 1', [req.params.slug]);
    if (!clients.length) return res.status(404).json({ message: 'Cliente no encontrado' });
    const { name, username, password, role } = req.body;
    if (!name || !username || !password || !role) return res.status(400).json({ message: 'Todos los campos son requeridos' });
    if (!['owner','manager','vendor'].includes(role)) return res.status(400).json({ message: 'Rol inválido' });
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO admin_users (client_id, name, username, password, role) VALUES (?, ?, ?, ?, ?)',
      [clients[0].id, name, username, hashed, role]
    );
    res.status(201).json({ id: result.insertId, message: 'Usuario creado' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Ese usuario ya existe' });
    res.status(500).json({ message: 'Error creando usuario', error: error.message });
  }
});

app.put('/api/clients/:slug/admin-users/:id', async (req, res) => {
  try {
    const callerRole = req.headers['x-user-role'];
    const callerId = req.headers['x-user-id'];
    if (callerRole !== 'owner') return res.status(403).json({ message: 'Solo el dueño puede editar usuarios' });
    const [clients] = await pool.query('SELECT id FROM clients WHERE slug = ? LIMIT 1', [req.params.slug]);
    if (!clients.length) return res.status(404).json({ message: 'Cliente no encontrado' });
    if (String(callerId) === String(req.params.id) && req.body.role) {
      return res.status(400).json({ message: 'No puedes cambiar tu propio rol' });
    }
    if (req.body.is_active === false) {
      const [owners] = await pool.query(
        'SELECT COUNT(*) as cnt FROM admin_users WHERE client_id = ? AND role = "owner" AND is_active = TRUE',
        [clients[0].id]
      );
      const [target] = await pool.query('SELECT role FROM admin_users WHERE id = ?', [req.params.id]);
      if (target[0]?.role === 'owner' && owners[0].cnt <= 1) {
        return res.status(400).json({ message: 'Debe haber al menos un dueño activo' });
      }
    }
    const { name, username, password, role, is_active } = req.body;
    const fields = []; const values = [];
    if (name !== undefined)      { fields.push('name = ?');      values.push(name); }
    if (username !== undefined)  { fields.push('username = ?');  values.push(username); }
    if (role !== undefined)      { fields.push('role = ?');      values.push(role); }
    if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active); }
    if (password)                { fields.push('password = ?');  values.push(await bcrypt.hash(password, 10)); }
    if (!fields.length) return res.status(400).json({ message: 'Nada que actualizar' });
    values.push(req.params.id, clients[0].id);
    await pool.query(`UPDATE admin_users SET ${fields.join(', ')} WHERE id = ? AND client_id = ?`, values);
    res.json({ message: 'Usuario actualizado' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Ese usuario ya existe' });
    res.status(500).json({ message: 'Error actualizando usuario', error: error.message });
  }
});

app.get('/api/clients/:slug', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM clients WHERE slug = ? LIMIT 1', [req.params.slug]);
    if (!rows.length) return res.status(404).json({ message: 'Cliente no encontrado' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error buscando cliente', error: error.message });
  }
});

app.put('/api/clients/:slug/logo', async (req, res) => {
  try {
    const { logo_url } = req.body;
    if (!logo_url) return res.status(400).json({ message: 'logo_url es requerido' });
    const [result] = await pool.query(
      'UPDATE clients SET logo_url = ? WHERE slug = ?',
      [logo_url, req.params.slug]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Cliente no encontrado' });
    res.json({ message: 'Logo actualizado', logo_url });
  } catch (error) {
    res.status(500).json({ message: 'Error actualizando logo', error: error.message });
  }
});

app.put('/api/clients/:slug/settings', async (req, res) => {
  try {
    const { whatsapp_message } = req.body;
    const [result] = await pool.query(
      'UPDATE clients SET whatsapp_message = ? WHERE slug = ?',
      [whatsapp_message ?? null, req.params.slug]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Cliente no encontrado' });
    res.json({ message: 'Settings actualizados', whatsapp_message });
  } catch (error) {
    res.status(500).json({ message: 'Error actualizando settings', error: error.message });
  }
});

// =======================
// 📂 CATEGORIES
// =======================
app.get('/api/clients/:slug/categories', async (req, res) => {
  try {
    const [clients] = await pool.query('SELECT id FROM clients WHERE slug = ? LIMIT 1', [req.params.slug]);
    if (!clients.length) return res.status(404).json({ message: 'Cliente no encontrado' });
    const [categories] = await pool.query(
      'SELECT * FROM categories WHERE client_id = ? ORDER BY sort_order ASC, id ASC',
      [clients[0].id]
    );
    // If none exist yet, seed and return
    if (!categories.length) {
      await seedDefaultCategories(clients[0].id);
      const [seeded] = await pool.query(
        'SELECT * FROM categories WHERE client_id = ? ORDER BY sort_order ASC',
        [clients[0].id]
      );
      return res.json(seeded);
    }
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo categorías', error: error.message });
  }
});

app.put('/api/clients/:slug/categories/:id', async (req, res) => {
  try {
    const [clients] = await pool.query('SELECT id FROM clients WHERE slug = ? LIMIT 1', [req.params.slug]);
    if (!clients.length) return res.status(404).json({ message: 'Cliente no encontrado' });
    const { name, name_en, description, description_en, ideal, ideal_en, icon } = req.body;
    const [result] = await pool.query(
      `UPDATE categories SET name=?, name_en=?, description=?, description_en=?, ideal=?, ideal_en=?, icon=?
       WHERE id=? AND client_id=?`,
      [name, name_en, description, description_en, ideal, ideal_en, icon, req.params.id, clients[0].id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Categoría no encontrada' });
    res.json({ message: 'Categoría actualizada' });
  } catch (error) {
    res.status(500).json({ message: 'Error actualizando categoría', error: error.message });
  }
});

// =======================
app.get('/api/clients/:slug/plants', async (req, res) => {
  try {
    const [clients] = await pool.query('SELECT id FROM clients WHERE slug = ? LIMIT 1', [req.params.slug]);
    if (!clients.length) return res.status(404).json({ message: 'Cliente no encontrado' });
    const [plants] = await pool.query(
      `SELECT * FROM plants WHERE client_id = ? AND is_active = TRUE ORDER BY is_featured DESC, name ASC`,
      [clients[0].id]
    );
    res.json(plants);
  } catch (error) {
    res.status(500).json({ message: 'Error buscando plantas', error: error.message });
  }
});

app.post('/api/clients/:slug/plants', async (req, res) => {
  try {
    const [clients] = await pool.query('SELECT id FROM clients WHERE slug = ? LIMIT 1', [req.params.slug]);
    if (!clients.length) return res.status(404).json({ message: 'Cliente no encontrado' });
    const { name, category, description, price, cost_price, stock, image_url, light, water, is_featured } = req.body;
    const [result] = await pool.query(
      `INSERT INTO plants (client_id, name, category, description, price, cost_price, stock, image_url, light, water, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [clients[0].id, name, category, description, price ?? null, cost_price ?? null, stock, image_url, light, water, !!is_featured]
    );
    res.status(201).json({ id: result.insertId, message: 'Planta creada' });
  } catch (error) {
    res.status(500).json({ message: 'Error creando planta', error: error.message });
  }
});

app.put('/api/plants/:id', async (req, res) => {
  try {
    const { name, category, description, price, cost_price, stock, image_url, light, water, is_featured, is_active } = req.body;
    await pool.query(
      `UPDATE plants SET name=?, category=?, description=?, price=?, cost_price=?, stock=?, image_url=?, light=?, water=?, is_featured=?, is_active=? WHERE id=?`,
      [name, category, description, price ?? null, cost_price ?? null, stock, image_url, light, water, !!is_featured, is_active !== false, req.params.id]
    );
    res.json({ message: 'Planta actualizada' });
  } catch (error) {
    res.status(500).json({ message: 'Error actualizando planta', error: error.message });
  }
});

app.patch('/api/plants/:id/vendor-update', async (req, res) => {
  try {
    const { name, description, image_url } = req.body;
    await pool.query('UPDATE plants SET name=?, description=?, image_url=? WHERE id=?', [name, description, image_url, req.params.id]);
    res.json({ message: 'Planta actualizada' });
  } catch (error) {
    res.status(500).json({ message: 'Error actualizando planta', error: error.message });
  }
});

app.delete('/api/plants/:id', async (req, res) => {
  try {
    await pool.query('UPDATE plants SET is_active = FALSE WHERE id = ?', [req.params.id]);
    res.json({ message: 'Planta desactivada' });
  } catch (error) {
    res.status(500).json({ message: 'Error eliminando planta', error: error.message });
  }
});

// =======================
// 🤖 AI ANALYZE INVOICE
// =======================
app.post('/api/clients/:slug/invoices/analyze', upload.single('invoice'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No se subió ninguna factura.' });
    const [clients] = await pool.query('SELECT id FROM clients WHERE slug = ? LIMIT 1', [req.params.slug]);
    if (!clients.length) return res.status(404).json({ message: 'Cliente no encontrado' });
    const base64File = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: `Analiza esta factura de compra para un vivero.\nDevuelve SOLO JSON válido con esta estructura:\n{\n  "items": [\n    {\n      "plant_name": "",\n      "quantity": 0,\n      "unit_cost": 0,\n      "total_cost": 0\n    }\n  ]\n}\nReglas:\n- Solo incluye plantas\n- Ignora IVU, delivery, herramientas, etc\n- quantity debe ser número entero\n- unit_cost es el costo unitario de compra\n- total_cost = unit_cost * quantity\n- Todos los valores deben ser números` },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64File}` } }
        ]
      }],
      response_format: { type: 'json_object' }
    });
    const parsed = JSON.parse(response.choices[0].message.content);
    res.json({ message: 'Factura analizada', items: parsed.items || [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error analizando factura', error: error.message });
  }
});

// =======================
// 📦 CONFIRM RESTOCK
// =======================
app.post('/api/clients/:slug/invoices/confirm-restock', async (req, res) => {
  try {
    const { items } = req.body;
    const [clients] = await pool.query('SELECT id FROM clients WHERE slug = ? LIMIT 1', [req.params.slug]);
    if (!clients.length) return res.status(404).json({ message: 'Cliente no encontrado' });
    const clientId = clients[0].id;
    const updates = [];
    for (const item of items) {
      const { plant_name, quantity, unit_cost, new_price } = item;
      const [plants] = await pool.query(
        `SELECT id, name, price FROM plants WHERE client_id = ? AND name LIKE ? AND is_active = TRUE LIMIT 1`,
        [clientId, `%${plant_name}%`]
      );
      if (plants.length) {
        const plant = plants[0];
        await pool.query(`UPDATE plants SET stock = stock + ?, cost_price = ?, price = ? WHERE id = ?`,
          [quantity, unit_cost ?? null, new_price ?? plant.price, plant.id]);
        updates.push({ matched: plant.name, added: quantity, cost_price_updated: unit_cost, price_updated: new_price });
      } else {
        updates.push({ unmatched: plant_name });
      }
    }
    res.json({ message: 'Inventario actualizado', updates });
  } catch (error) {
    console.error('confirm-restock error:', error.message, error.stack);
    res.status(500).json({ message: 'Error actualizando inventario', error: error.message });
  }
});

// =======================
// 📊 POS IMPORT — Analyze
// =======================
app.post('/api/clients/:slug/pos-import/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No se subió ningún archivo.' });
    const [clients] = await pool.query('SELECT id FROM clients WHERE slug = ? LIMIT 1', [req.params.slug]);
    if (!clients.length) return res.status(404).json({ message: 'Cliente no encontrado' });
    const clientId = clients[0].id;
    const [plants] = await pool.query('SELECT id, name, stock FROM plants WHERE client_id = ? AND is_active = TRUE', [clientId]);
    // Soporta CSV y Excel (.xlsx, .xls)
    let rows = [];
    const isExcel = req.file.mimetype.includes('spreadsheet') || 
                    req.file.mimetype.includes('excel') ||
                    req.file.originalname?.match(/\.xlsx?$/i);

    if (isExcel) {
      // Leer Excel con SheetJS
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      if (!jsonData.length) return res.status(400).json({ message: 'Archivo Excel vacío.' });

      const headerRow = jsonData[0].map(h => String(h).trim().toLowerCase());
      const nameIdx = headerRow.findIndex(h => ['producto','nombre','name','item','description','descripcion','product'].some(k => h.includes(k)));
      const qtyIdx  = headerRow.findIndex(h => ['cantidad','quantity','qty','cant','vendido','sold','units'].some(k => h.includes(k)));

      if (nameIdx === -1 || qtyIdx === -1) {
        return res.status(400).json({ message: 'No se encontraron columnas de producto o cantidad.', headers: headerRow });
      }

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        const productName = String(row[nameIdx] || '').trim();
        const qty = parseInt(row[qtyIdx]) || 0;
        if (!productName || qty <= 0) continue;
        rows.push({ productName, qty });
      }
    } else {
      // Leer CSV
      const fileContent = req.file.buffer.toString('utf8');
      const lines = fileContent.split(/\r?\n/).filter(l => l.trim());
      if (!lines.length) return res.status(400).json({ message: 'Archivo vacío o inválido.' });
      const headers = lines[0].split(/,|;|\t/).map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
      const nameIdx = headers.findIndex(h => ['producto','nombre','name','item','description','descripcion','product'].some(k => h.includes(k)));
      const qtyIdx  = headers.findIndex(h => ['cantidad','quantity','qty','cant','vendido','sold','units'].some(k => h.includes(k)));
      if (nameIdx === -1 || qtyIdx === -1) {
        return res.status(400).json({ message: 'No se encontraron columnas de producto o cantidad.', headers });
      }
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/,|;|\t/).map(c => c.trim().replace(/['"]/g, ''));
        if (cols.length <= Math.max(nameIdx, qtyIdx)) continue;
        const productName = cols[nameIdx];
        const qty = parseInt(cols[qtyIdx]) || 0;
        if (!productName || qty <= 0) continue;
        rows.push({ productName, qty });
      }
    }
    const normalize = s => s.toLowerCase().replace(/[^a-z0-9áéíóúñü]/g, ' ').replace(/\s+/g, ' ').trim();
    const results = rows.map(row => {
      const norm = normalize(row.productName);
      let match = plants.find(p => p.name.toLowerCase() === row.productName.toLowerCase());
      let status = 'found';
      if (!match) match = plants.find(p => normalize(p.name) === norm);
      if (!match) { match = plants.find(p => { const pn = normalize(p.name); return norm.includes(pn) || pn.includes(norm); }); if (match) status = 'review'; }
      if (!match) { const words = norm.split(' ').filter(w => w.length > 3); match = plants.find(p => { const pWords = normalize(p.name).split(' ').filter(w => w.length > 3); return words.filter(w => pWords.includes(w)).length >= 1; }); if (match) status = 'review'; }
      if (!match) status = 'not_found';
      const stockAfter = match ? Math.max(0, match.stock - row.qty) : null;
      const overStock = match && row.qty > match.stock;
      return { product_name: row.productName, qty_sold: row.qty, matched_plant_id: match?.id || null, matched_plant_name: match?.name || null, current_stock: match?.stock ?? null, stock_after: stockAfter, over_stock: overStock, status };
    });
    res.json({ items: results, total_rows: results.length });
  } catch (error) {
    console.error('pos-import analyze error:', error.message);
    res.status(500).json({ message: 'Error analizando archivo', error: error.message });
  }
});

// =======================
// ✅ POS IMPORT — Confirm
// =======================
app.post('/api/clients/:slug/pos-import/confirm', async (req, res) => {
  try {
    const { items, filename } = req.body;
    const [clients] = await pool.query('SELECT id FROM clients WHERE slug = ? LIMIT 1', [req.params.slug]);
    if (!clients.length) return res.status(404).json({ message: 'Cliente no encontrado' });
    const clientId = clients[0].id;

    await pool.query(`
      CREATE TABLE IF NOT EXISTS pos_import_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        filename VARCHAR(255),
        product_name VARCHAR(255),
        matched_plant_id INT,
        qty_sold INT,
        stock_before INT,
        stock_after INT,
        method VARCHAR(50) DEFAULT 'POS_IMPORT',
        imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        import_session_id VARCHAR(36) NULL
      )
    `);

    const import_session_id = crypto.randomUUID();
    const updates = [];
    let totalUnits = 0;

    for (const item of items) {
      if (!item.matched_plant_id || item.skip) continue;
      const [plants] = await pool.query('SELECT id, stock FROM plants WHERE id = ? LIMIT 1', [item.matched_plant_id]);
      if (!plants.length) continue;
      const plant = plants[0];
      const stockBefore = plant.stock;
      const stockAfter = Math.max(0, stockBefore - item.qty_sold);

      await pool.query('UPDATE plants SET stock = ? WHERE id = ?', [stockAfter, plant.id]);
      await pool.query(
        `INSERT INTO pos_import_history 
         (client_id, filename, product_name, matched_plant_id, qty_sold, stock_before, stock_after, import_session_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [clientId, filename || 'unknown', item.product_name, item.matched_plant_id,
         item.qty_sold, stockBefore, stockAfter, import_session_id]
      );

      totalUnits += item.qty_sold || 0;
      updates.push({ plant_id: item.matched_plant_id, product: item.product_name, stock_before: stockBefore, stock_after: stockAfter });
    }

    res.json({
      message: 'Inventario actualizado',
      summary: { total_items: updates.length, total_units: totalUnits },
      updates
    });
  } catch (error) {
    console.error('pos-import confirm error:', error.message);
    res.status(500).json({ message: 'Error confirmando importación', error: error.message });
  }
});

// =======================
// 📈 SALES REPORT
// =======================
app.get('/api/clients/:slug/sales-report', async (req, res) => {
  try {
    const [clients] = await pool.query('SELECT id FROM clients WHERE slug = ? LIMIT 1', [req.params.slug]);
    if (!clients.length) return res.status(404).json({ message: 'Cliente no encontrado' });
    const clientId = clients[0].id;

    const period = req.query.period || 'month';
    let dateFilter = '';
    switch (period) {
      case 'today': dateFilter = `AND DATE(h.imported_at) = CURDATE()`;                    break;
      case 'week':  dateFilter = `AND h.imported_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`;   break;
      case 'month': dateFilter = `AND h.imported_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`;  break;
      case 'year':  dateFilter = `AND h.imported_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)`;  break;
      default:      dateFilter = '';
    }

    const [summary] = await pool.query(`
      SELECT
        COUNT(DISTINCT h.import_session_id)                             AS total_transactions,
        COALESCE(SUM(h.qty_sold), 0)                                    AS total_units,
        COALESCE(SUM(h.qty_sold * p.price), 0)                          AS total_revenue,
        COALESCE(SUM(h.qty_sold * COALESCE(p.cost_price, 0)), 0)        AS total_cost
      FROM pos_import_history h
      LEFT JOIN plants p ON p.id = h.matched_plant_id
      WHERE h.client_id = ? ${dateFilter}
    `, [clientId]);

    const totalRevenue = parseFloat(summary[0].total_revenue) || 0;
    const totalCost    = parseFloat(summary[0].total_cost)    || 0;
    const totalProfit  = totalRevenue - totalCost;
    const marginPct    = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    const [topPlants] = await pool.query(`
      SELECT
        p.name, p.category, p.image_url,
        SUM(h.qty_sold)                                 AS units_sold,
        SUM(h.qty_sold * p.price)                       AS revenue,
        SUM(h.qty_sold * COALESCE(p.cost_price, 0))     AS cost
      FROM pos_import_history h
      LEFT JOIN plants p ON p.id = h.matched_plant_id
      WHERE h.client_id = ? ${dateFilter}
      GROUP BY h.matched_plant_id, p.name, p.category, p.image_url
      ORDER BY units_sold DESC
      LIMIT 8
    `, [clientId]);

    const [chartData] = await pool.query(`
      SELECT
        DATE(h.imported_at)       AS day,
        SUM(h.qty_sold)           AS units,
        SUM(h.qty_sold * p.price) AS revenue
      FROM pos_import_history h
      LEFT JOIN plants p ON p.id = h.matched_plant_id
      WHERE h.client_id = ? AND h.imported_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
      GROUP BY DATE(h.imported_at)
      ORDER BY day ASC
    `, [clientId]);

    const [recentImports] = await pool.query(`
      SELECT
        h.id, h.filename, h.product_name, h.qty_sold,
        h.stock_before, h.stock_after, h.imported_at,
        p.name AS plant_name, p.price, p.image_url, p.category,
        p.cost_price
      FROM pos_import_history h
      LEFT JOIN plants p ON p.id = h.matched_plant_id
      WHERE h.client_id = ? ${dateFilter}
      ORDER BY h.imported_at DESC
      LIMIT 50
    `, [clientId]);

    res.json({
      period,
      summary: {
        total_transactions: parseInt(summary[0].total_transactions),
        total_units:        parseInt(summary[0].total_units),
        total_revenue:      totalRevenue,
        total_cost:         totalCost,
        total_profit:       totalProfit,
        margin_pct:         marginPct
      },
      top_plants: topPlants.map(p => ({
        name:       p.name,
        category:   p.category,
        image_url:  p.image_url,
        units_sold: parseInt(p.units_sold),
        revenue:    parseFloat(p.revenue)  || 0,
        cost:       parseFloat(p.cost)     || 0,
        profit:    (parseFloat(p.revenue)  || 0) - (parseFloat(p.cost) || 0)
      })),
      chart_data: chartData.map(d => ({
        day:     d.day,
        units:   parseInt(d.units),
        revenue: parseFloat(d.revenue) || 0
      })),
      recent_imports: recentImports
    });

  } catch (error) {
    console.error('sales-report error:', error.message);
    res.status(500).json({ message: 'Error generando reporte', error: error.message });
  }
});

// =======================

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`VerzaPlants API running on port ${port}`);
});