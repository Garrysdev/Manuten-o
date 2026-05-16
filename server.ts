import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me";
const db = new Database("database.sqlite");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    displayName TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'technician',
    status TEXT DEFAULT 'Off-duty',
    joined TEXT,
    location TEXT,
    metrics TEXT,
    avatar TEXT
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    equipment TEXT NOT NULL,
    technicianId TEXT,
    technicianName TEXT,
    priority TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'Preventiva',
    status TEXT NOT NULL DEFAULT 'PENDING',
    scheduledDate TEXT,
    dueDate TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    assignedBy TEXT,
    revisionCount INTEGER DEFAULT 0,
    notes TEXT,
    checklist TEXT, -- JSON string
    materials TEXT,  -- JSON string
    photos TEXT,     -- JSON array of data URLs
    startedAt TEXT,
    events TEXT      -- JSON array of {type, timestamp, reason}
  );

  CREATE TABLE IF NOT EXISTS order_revisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId TEXT NOT NULL,
    status TEXT NOT NULL,
    technicianId TEXT,
    updatedAt TEXT NOT NULL,
    notes TEXT,
    data TEXT, -- JSON snapshot of the order details at that time
    FOREIGN KEY (orderId) REFERENCES orders(id)
  );
`);

// Migration: ensure avatar and profile metadata columns exist
try {
  db.prepare("ALTER TABLE users ADD COLUMN avatar TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE users ADD COLUMN location TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE users ADD COLUMN profile_initialized INTEGER DEFAULT 0").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE users ADD COLUMN avatar_pos TEXT").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE orders ADD COLUMN notes TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE orders ADD COLUMN checklist TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE orders ADD COLUMN materials TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE orders ADD COLUMN type TEXT DEFAULT 'Preventiva'").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE orders ADD COLUMN photos TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE orders ADD COLUMN startedAt TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE orders ADD COLUMN events TEXT").run();
} catch (e) {}

// Seed Database
async function seedDatabase() {
  const usersCount = (db.prepare("SELECT COUNT(*) as count FROM users").get() as any).count;
  
  if (usersCount === 0) {
    console.log("Seeding database...");
    const adminPassword = await bcrypt.hash("admin123", 10);
    const techPassword = await bcrypt.hash("tech123", 10);
    
    // Seed the user from metadata as admin
    db.prepare("INSERT INTO users (id, name, displayName, email, password, role, status, joined, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run("admin-001", "Rui Garrido", "Rui Garrido", "garrido.rui@gmail.com", adminPassword, "admin", "Online", new Date().toISOString(), "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop");

    // Fallback admin for simple 'admin' login
    db.prepare("INSERT INTO users (id, name, displayName, email, password, role, status, joined, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run("admin-002", "Default Admin", "Admin", "admin@rgm.internal", adminPassword, "admin", "Online", new Date().toISOString(), "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100&h=100&fit=crop");

    // Seed a dummy technician
    db.prepare("INSERT INTO users (id, name, displayName, email, password, role, status, joined, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run("tech-001", "Technician Alpha", "Tech Alpha", "tech@rgm.internal", techPassword, "technician", "Online", new Date().toISOString(), "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop");

    // --- Seed Dummy Tasks for Filtering Tests ---
    const techId = "tech-001";
    const now = new Date();
    const isoNow = now.toISOString();

    // 1. Task for Today
    db.prepare("INSERT INTO orders (id, equipment, technicianId, technicianName, priority, status, scheduledDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run("WR-TODAY", "Manutenção Preventiva AC-01", techId, "Tech Alpha", "MEDIUM", "PENDING", isoNow, isoNow, isoNow);

    // 2. Task for Next Week
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    db.prepare("INSERT INTO orders (id, equipment, technicianId, technicianName, priority, status, scheduledDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run("WR-WEEK", "Inspeção Elevador Social", techId, "Tech Alpha", "MEDIUM", "PENDING", nextWeek.toISOString(), isoNow, isoNow);

    // 3. Task for Next Month
    const nextMonth = new Date();
    nextMonth.setMonth(now.getMonth() + 1);
    db.prepare("INSERT INTO orders (id, equipment, technicianId, technicianName, priority, status, scheduledDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run("WR-MONTH", "Revisão Caldeira Central", techId, "Tech Alpha", "HIGH", "PENDING", nextMonth.toISOString(), isoNow, isoNow);

    // 4. Task for Next Year
    const nextYear = new Date();
    nextYear.setFullYear(now.getFullYear() + 1);
    db.prepare("INSERT INTO orders (id, equipment, technicianId, technicianName, priority, status, scheduledDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run("WR-YEAR", "Certificação Anual Geradores", techId, "Tech Alpha", "LOW", "PENDING", nextYear.toISOString(), isoNow, isoNow);

    // 5. Completed Task (Yesterday)
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    db.prepare("INSERT INTO orders (id, equipment, technicianId, technicianName, priority, status, scheduledDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run("WR-HIST-1", "Reparação Iluminação Pátio", techId, "Tech Alpha", "LOW", "COMPLETED", yesterday.toISOString(), isoNow, yesterday.toISOString());

    // 6. Completed Task (Last Month)
    const lastMonth = new Date();
    lastMonth.setMonth(now.getMonth() - 1);
    db.prepare("INSERT INTO orders (id, equipment, technicianId, technicianName, priority, status, scheduledDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run("WR-HIST-2", "Limpeza Painéis Solares", techId, "Tech Alpha", "LOW", "COMPLETED", lastMonth.toISOString(), isoNow, lastMonth.toISOString());

    console.log("Database seeded successfully.");
  }
}

async function startServer() {
  await seedDatabase();
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ limit: "5mb", extended: true }));

  // --- Auth Routes ---
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = Math.random().toString(36).substring(2, 11);
    
    try {
      db.prepare("INSERT INTO users (id, name, displayName, email, password, role, status, joined) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .run(id, name, name, email, hashedPassword, role || 'technician', 'Online', new Date().toISOString());
      
      const token = jwt.sign({ id, email, role }, JWT_SECRET);
      res.json({ token, user: { id, name, email, role } });
    } catch (e: any) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Middleware to protect routes
  const authenticate = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });
    
    const token = authHeader.split(" ")[1];
    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) return res.status(401).json({ error: "Invalid token" });
      req.user = decoded;
      next();
    });
  };

  app.get("/api/auth/me", authenticate, (req: any, res) => {
    const user: any = db.prepare("SELECT id, name, displayName, email, role, status, joined, location, metrics, avatar, avatar_pos, profile_initialized FROM users WHERE id = ?").get(req.user.id);
    res.json(user);
  });

  app.patch("/api/auth/me", authenticate, (req: any, res) => {
    const { name, displayName, email, avatar, location, avatar_pos, profile_initialized } = req.body;
    const userId = req.user.id;
    
    try {
      db.prepare(`
        UPDATE users 
        SET name = COALESCE(?, name), 
            displayName = COALESCE(?, displayName), 
            email = COALESCE(?, email), 
            avatar = COALESCE(?, avatar),
            location = COALESCE(?, location),
            avatar_pos = COALESCE(?, avatar_pos),
            profile_initialized = COALESCE(?, profile_initialized)
        WHERE id = ?
      `).run(name, displayName, email, avatar, location, avatar_pos, profile_initialized, userId);
      
      const updatedUser = db.prepare("SELECT id, name, displayName, email, role, avatar, location, avatar_pos, profile_initialized FROM users WHERE id = ?").get(userId);
      res.json(updatedUser);
    } catch (e: any) {
      res.status(400).json({ error: "Email already exists or invalid data" });
    }
  });

  // --- Orders Routes ---
  app.get("/api/orders", authenticate, (req: any, res) => {
    let orders;
    if (req.user.role === 'admin') {
      orders = db.prepare("SELECT * FROM orders ORDER BY createdAt DESC").all();
    } else {
      orders = db.prepare("SELECT * FROM orders WHERE technicianId = ? ORDER BY createdAt DESC").all(req.user.id);
    }
    res.json(orders);
  });

  app.post("/api/orders", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    
    const { equipment, technicianId, technicianName, priority, type, scheduledDate } = req.body;
    const id = 'WR-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const now = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO orders (id, equipment, technicianId, technicianName, priority, type, scheduledDate, createdAt, updatedAt, assignedBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, equipment, technicianId, technicianName, priority, type || 'Preventiva', scheduledDate, now, now, req.user.name);
    
    const newOrder = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    res.json(newOrder);
  });

  app.patch("/api/orders/:id", authenticate, (req: any, res) => {
    const { status, updatedAt, startedAt, events, notes, checklist, materials, photos } = req.body;
    const orderId = req.params.id;
    
    // Check if user is assigned to this order or is admin
    const order: any = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (req.user.role !== 'admin' && order.technicianId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    db.prepare(`
      UPDATE orders 
      SET status = COALESCE(?, status), 
          updatedAt = ?, 
          startedAt = COALESCE(?, startedAt),
          events = COALESCE(?, events),
          notes = COALESCE(?, notes),
          checklist = COALESCE(?, checklist),
          materials = COALESCE(?, materials),
          photos = COALESCE(?, photos)
      WHERE id = ?
    `).run(status, updatedAt || new Date().toISOString(), startedAt, events, notes, checklist, materials, photos, orderId);
    
    // If completed, save a revision snapshot
    if (status === 'COMPLETED') {
      const updatedOrder: any = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
      db.prepare(`
        INSERT INTO order_revisions (orderId, status, technicianId, updatedAt, data)
        VALUES (?, ?, ?, ?, ?)
      `).run(orderId, status, updatedOrder.technicianId, updatedOrder.updatedAt, JSON.stringify(updatedOrder));
    }

    res.json({ success: true });
  });

  app.post("/api/orders/:id/reopen", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    
    const orderId = req.params.id;
    const { status = 'PENDING' } = req.body;
    const order: any = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
    
    if (!order) return res.status(404).json({ error: "Order not found" });
    
    const now = new Date().toISOString();
    db.prepare("UPDATE orders SET status = ?, updatedAt = ?, revisionCount = revisionCount + 1 WHERE id = ?").run(status, now, orderId);
    
    // Log the reopen action in revisions
    db.prepare(`
      INSERT INTO order_revisions (orderId, status, technicianId, updatedAt, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(orderId, 'REOPENED', order.technicianId, now, `Reabertura autorizada pelo administrador. Novo estado: ${status}`);
    
    res.json({ success: true, message: "Ordem reaberta com sucesso" });
  });

  app.get("/api/orders/:id/revisions", authenticate, (req: any, res) => {
    const revisions = db.prepare("SELECT * FROM order_revisions WHERE orderId = ? ORDER BY updatedAt DESC").all(req.params.id);
    res.json(revisions);
  });

  app.get("/api/users", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    const users = db.prepare("SELECT id, name, displayName, email, role, status FROM users").all();
    res.json(users);
  });

  // --- Vite Middleware & Static Assets ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
