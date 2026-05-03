import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db.js';
import OpenAI from 'openai';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

dotenv.config();

const app = express();

app.use(cors({
  origin: ['https://www.verzagarden.com', 'https://verzagarden.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, app: 'VerzaPlants API' });
});

app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No se subió ninguna imagen' });

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'verzaplants' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
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

    const [rows] = await pool.query(
      'SELECT * FROM clients WHERE slug = ? LIMIT 1',
      [req.params.slug]
    );

    if (!rows.length) return res.status(404).json({ message: 'Cliente no encontrado' });

    const client = rows[0];

    if (client.admin_user !== username || client.admin_password !== password) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    res.json({ ok: true, slug: client.slug });

  } catch (error) {
    res.status(500).json({ message: 'Error en login', error: error.message });
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

    const { name, category, description, price, stock, image_url, light, water, is_featured } = req.body;

    const [result] = await pool.query(
      `INSERT INTO plants (client_id, name, category, description, price, stock, image_url, light, water, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [clients[0].id, name, category, description, price, stock, image_url, light, water, !!is_featured]
    );

    res.status(201).json({ id: result.insertId, message: 'Planta creada' });

  } catch (error) {
    res.status(500).json({ message: 'Error creando planta', error: error.message });
  }
});

app.put('/api/plants/:id', async (req, res) => {
  try {
    const { name, category, description, price, stock, image_url, light, water, is_featured, is_active } = req.body;

    await pool.query(
      `UPDATE plants 
       SET name=?, category=?, description=?, price=?, stock=?, image_url=?, light=?, water=?, is_featured=?, is_active=? 
       WHERE id=?`,
      [name, category, description, price, stock, image_url, light, water, !!is_featured, is_active !== false, req.params.id]
    );

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
    if (!req.file) {
      return res.status(400).json({ message: 'No se subió ninguna factura.' });
    }

    const [clients] = await pool.query(
      'SELECT id FROM clients WHERE slug = ? LIMIT 1',
      [req.params.slug]
    );

    if (!clients.length) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    const base64File = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    // ✅ Corregido el uso oficial de OpenAI v4 para lectura multimodal y JSON estructurado
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `
Analiza esta factura de compra para un vivero.

Devuelve SOLO JSON válido con esta estructura:

{
  "items": [
    {
      "plant_name": "",
      "quantity": 0,
      "unit_cost": 0
    }
  ]
}

Reglas:
- Solo incluye plantas
- Ignora IVU, delivery, herramientas, etc
- quantity debe ser número
- unit_cost debe ser número
`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64File}`
              }
            }
          ]
        }
      ],
      response_format: { type: 'json_object' }
    });

    const parsed = JSON.parse(response.choices[0].message.content);

    res.json({
      message: 'Factura analizada',
      result: parsed
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error analizando factura',
      error: error.message
    });
  }
});


// =======================
// 📦 CONFIRM RESTOCK
// =======================

app.post('/api/clients/:slug/invoices/confirm-restock', async (req, res) => {
  try {
    const { items } = req.body;

    const [clients] = await pool.query(
      'SELECT id FROM clients WHERE slug = ? LIMIT 1',
      [req.params.slug]
    );

    if (!clients.length) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    const clientId = clients[0].id;

    let updates = [];

    for (const item of items) {
      const { plant_name, quantity } = item;

      const [plants] = await pool.query(
        `SELECT id, name FROM plants 
         WHERE client_id = ? AND name LIKE ? LIMIT 1`,
        [clientId, `%${plant_name}%`]
      );

      if (plants.length) {
        await pool.query(
          `UPDATE plants SET stock = stock + ? WHERE id = ?`,
          [quantity, plants[0].id]
        );

        updates.push({
          matched: plants[0].name,
          added: quantity
        });

      } else {
        updates.push({
          unmatched: plant_name
        });
      }
    }

    res.json({
      message: 'Inventario actualizado',
      updates
    });

  } catch (error) {
    res.status(500).json({
      message: 'Error actualizando inventario',
      error: error.message
    });
  }
});


// =======================

const port = process.env.PORT || 3000;

// ✅ Corregido: '0.0.0.0' para que Railway lo exponga a internet
app.listen(port, '0.0.0.0', () => {
  console.log(`VerzaPlants API running on port ${port}`);
});