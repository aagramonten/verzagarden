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

// =======================
// 🔧 AUTO-MIGRATE: add cost_price column if missing
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
ensureCostPriceColumn();

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
    const [rows] = await pool.query('SELECT * FROM clients WHERE slug = ? LIMIT 1', [req.params.slug]);
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

    const { name, category, description, price, cost_price, stock, image_url, light, water, is_featured } = req.body;

    const [result] = await pool.query(
      `INSERT INTO plants (client_id, name, category, description, price, cost_price, stock, image_url, light, water, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [clients[0].id, name, category, description,
       price ?? null, cost_price ?? null,
       stock, image_url, light, water, !!is_featured]
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
      `UPDATE plants 
       SET name=?, category=?, description=?, price=?, cost_price=?, stock=?, image_url=?, light=?, water=?, is_featured=?, is_active=? 
       WHERE id=?`,
      [name, category, description,
       price ?? null, cost_price ?? null,
       stock, image_url, light, water,
       !!is_featured, is_active !== false,
       req.params.id]
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
    if (!req.file) return res.status(400).json({ message: 'No se subió ninguna factura.' });

    const [clients] = await pool.query('SELECT id FROM clients WHERE slug = ? LIMIT 1', [req.params.slug]);
    if (!clients.length) return res.status(404).json({ message: 'Cliente no encontrado' });

    const base64File = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

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
      "unit_cost": 0,
      "total_cost": 0
    }
  ]
}

Reglas:
- Solo incluye plantas
- Ignora IVU, delivery, herramientas, etc
- quantity debe ser número entero
- unit_cost es el costo unitario de compra (precio mayorista)
- total_cost = unit_cost * quantity
- Todos los valores deben ser números
`
            },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64File}` }
            }
          ]
        }
      ],
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

        await pool.query(
          `UPDATE plants SET stock = stock + ?, cost_price = ?, price = ? WHERE id = ?`,
          [quantity, unit_cost ?? null, new_price ?? plant.price, plant.id]
        );

        updates.push({
          matched: plant.name,
          added: quantity,
          cost_price_updated: unit_cost,
          price_updated: new_price
        });

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
// 📊 POS SALES IMPORT
// =======================

// Analyze uploaded POS file (CSV/Excel)
app.post('/api/clients/:slug/pos-import/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No se subió ningún archivo.' });

    const [clients] = await pool.query('SELECT id FROM clients WHERE slug = ? LIMIT 1', [req.params.slug]);
    if (!clients.length) return res.status(404).json({ message: 'Cliente no encontrado' });
    const clientId = clients[0].id;

    const [plants] = await pool.query(
      'SELECT id, name, stock FROM plants WHERE client_id = ? AND is_active = TRUE',
      [clientId]
    );

    const fileContent = req.file.buffer.toString('utf8');
    const lines = fileContent.split(/\r?\n/).filter(l => l.trim());
    if (!lines.length) return res.status(400).json({ message: 'Archivo vacío o inválido.' });

    const headers = lines[0].split(/,|;|\t/).map(h => h.trim().toLowerCase().replace(/['"]/g, ''));

    const nameIdx = headers.findIndex(h => ['producto','nombre','name','item','description','descripcion','product'].some(k => h.includes(k)));
    const qtyIdx  = headers.findIndex(h => ['cantidad','quantity','qty','cant','vendido','sold','units'].some(k => h.includes(k)));

    if (nameIdx === -1 || qtyIdx === -1) {
      return res.status(400).json({ 
        message: 'No se encontraron columnas de producto o cantidad.',
        headers,
        hint: 'El archivo debe tener columnas con nombres como: Producto/Nombre/Item y Cantidad/Qty'
      });
    }

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(/,|;|\t/).map(c => c.trim().replace(/['"]/g, ''));
      if (cols.length <= Math.max(nameIdx, qtyIdx)) continue;
      const productName = cols[nameIdx];
      const qty = parseInt(cols[qtyIdx]) || 0;
      if (!productName || qty <= 0) continue;
      rows.push({ productName, qty });
    }

    const normalize = s => s.toLowerCase().replace(/[^a-z0-9áéíóúñü]/g, ' ').replace(/\s+/g, ' ').trim();

    const results = rows.map(row => {
      const norm = normalize(row.productName);
      
      let match = plants.find(p => p.name.toLowerCase() === row.productName.toLowerCase());
      let status = 'found';

      if (!match) {
        match = plants.find(p => normalize(p.name) === norm);
      }

      if (!match) {
        match = plants.find(p => {
          const pn = normalize(p.name);
          return norm.includes(pn) || pn.includes(norm);
        });
        if (match) status = 'review';
      }

      if (!match) {
        const words = norm.split(' ').filter(w => w.length > 3);
        match = plants.find(p => {
          const pWords = normalize(p.name).split(' ').filter(w => w.length > 3);
          return words.filter(w => pWords.includes(w)).length >= 1;
        });
        if (match) status = 'review';
      }

      if (!match) status = 'not_found';

      const stockAfter = match ? Math.max(0, match.stock - row.qty) : null;
      const overStock = match && row.qty > match.stock;

      return {
        product_name: row.productName,
        qty_sold: row.qty,
        matched_plant_id: match?.id || null,
        matched_plant_name: match?.name || null,
        current_stock: match?.stock ?? null,
        stock_after: stockAfter,
        over_stock: overStock,
        status
      };
    });

    res.json({ items: results, total_rows: results.length });

  } catch (error) {
    console.error('pos-import analyze error:', error.message);
    res.status(500).json({ message: 'Error analizando archivo', error: error.message });
  }
});


// =======================
// ✅ Confirm POS import — deduct stock, save history, return summary
// =======================
app.post('/api/clients/:slug/pos-import/confirm', async (req, res) => {
  try {
    const { items, filename } = req.body;

    const [clients] = await pool.query('SELECT id FROM clients WHERE slug = ? LIMIT 1', [req.params.slug]);
    if (!clients.length) return res.status(404).json({ message: 'Cliente no encontrado' });
    const clientId = clients[0].id;

    // Ensure history table exists
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
        imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

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
        `INSERT INTO pos_import_history (client_id, filename, product_name, matched_plant_id, qty_sold, stock_before, stock_after)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [clientId, filename || 'unknown', item.product_name, item.matched_plant_id, item.qty_sold, stockBefore, stockAfter]
      );

      totalUnits += item.qty_sold || 0;
      updates.push({
        plant_id: item.matched_plant_id,
        product: item.product_name,
        stock_before: stockBefore,
        stock_after: stockAfter
      });
    }

    // ✅ Devuelve resumen para actualizar el frontend
    res.json({
      message: 'Inventario actualizado',
      summary: {
        total_items: updates.length,
        total_units: totalUnits
      },
      updates
    });

  } catch (error) {
    console.error('pos-import confirm error:', error.message);
    res.status(500).json({ message: 'Error confirmando importación', error: error.message });
  }
});

// =======================

const port = process.env.PORT || 3000;

app.listen(port, '0.0.0.0', () => {
  console.log(`VerzaPlants API running on port ${port}`);
});