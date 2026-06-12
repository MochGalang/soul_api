const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const supabase = require('./supabase');

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// --- Authentication Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token tidak tersedia' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token tidak valid atau kedaluwarsa' });
    req.user = user;
    next();
  });
};

// --- Routes: Auth ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    const user = { username };
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user });
  } else {
    res.status(401).json({ error: 'Username atau password salah' });
  }
});

app.get('/api/verify', authenticateToken, (req, res) => {
  res.json({ message: 'Valid token', user: req.user });
});

// --- Routes: Products ---
app.get('/api/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    const { name, description, price, image_url, badge, badge_color, sort_order } = req.body;
    const { data, error } = await supabase
      .from('products')
      .insert([{ name, description, price, image_url, badge, badge_color, sort_order }])
      .select();

    if (error) throw error;
    res.json({ message: 'Produk berhasil ditambahkan', product: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, image_url, badge, badge_color, sort_order } = req.body;
    const { data, error } = await supabase
      .from('products')
      .update({ name, description, price, image_url, badge, badge_color, sort_order })
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json({ message: 'Produk berhasil diubah', product: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Produk berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Routes: Settings ---
app.get('/api/settings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*');

    if (error) throw error;

    // Convert array to object { whatsapp_number: '...', ... }
    const settings = {};
    if (data) {
      data.forEach(item => {
        settings[item.id] = item.value;
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/settings', authenticateToken, async (req, res) => {
  try {
    const settings = req.body; // e.g., { whatsapp_number: '123', instagram_link: '...' }
    const updates = Object.keys(settings).map(key => ({
      id: key,
      value: settings[key]
    }));

    const { error } = await supabase
      .from('settings')
      .upsert(updates);

    if (error) throw error;
    res.json({ message: 'Pengaturan berhasil disimpan' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Routes: Upload ---
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/upload', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Tidak ada file yang diunggah' });
    }

    const file = req.file;
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${fileExt}`;
    const filePath = `public/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('product')
      .getPublicUrl(filePath);

    res.json({ url: data.publicUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Express server berjalan di http://localhost:${port}`);
});
