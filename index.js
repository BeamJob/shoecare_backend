const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve static files

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Append extension
    }
});

const upload = multer({ storage: storage });

// MySQL Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});

// Sample Route
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

// Register Endpoint
app.post('/register', (req, res) => {
    const { full_name, email, phone, address, password, is_admin } = req.body;

    // Hash password
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            return res.status(500).json({ error: err });
        }

        // Insert user into database
        const query = 'INSERT INTO users (full_name, email, phone, address, password, is_admin) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(query, [full_name, email, phone, address, hash, is_admin || 0], (err, result) => {
            if (err) {
                return res.status(500).json({ error: err });
            }
            res.status(201).json({ message: 'User registered successfully!' });
        });
    });
});

// Login Endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Find user by email
    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        if (results.length === 0) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const user = results[0];

        bcrypt.compare(password, user.password, (err, result) => {
            if (err) {
                return res.status(500).json({ error: err });
            }
            if (!result) {
                return res.status(401).json({ message: 'Authentication failed' });
            }

            // Simpan informasi pengguna di localStorage di sisi klien
            res.status(200).json({ message: 'Login successful', user: { id: user.id, full_name: user.full_name, is_admin: user.is_admin } });
        });
    });
});

// Add Jasa Endpoint
app.post('/jasa', (req, res) => {
    const { nama_jasa, harga } = req.body;

    const query = 'INSERT INTO jasa (nama_jasa, harga) VALUES (?, ?)';
    db.query(query, [nama_jasa, harga], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.status(201).json({ message: 'Jasa added successfully!' });
    });
});

// // Add Metode Endpoint
// app.post('/metode', (req, res) => {
//     const { nama_metode } = req.body;

//     const query = 'INSERT INTO metode (nama_metode) VALUES (?)';
//     db.query(query, [nama_metode], (err, result) => {
//         if (err) {
//             return res.status(500).json({ error: err });
//         }
//         res.status(201).json({ message: 'Metode added successfully!' });
//     });
// });

// Add Status Endpoint
app.post('/status', (req, res) => {
    const { nama_status } = req.body;

    const query = 'INSERT INTO status (nama_status) VALUES (?)';
    db.query(query, [nama_status], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.status(201).json({ message: 'Status added successfully!' });
    });
});

// Get Jasa Endpoint
app.get('/jasa', (req, res) => {
    const query = 'SELECT * FROM jasa';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.status(200).json(results);
    });
});

// // Get Metode Endpoint
// app.get('/metode', (req, res) => {
//     const query = 'SELECT * FROM metode';
//     db.query(query, (err, results) => {
//         if (err) {
//             return res.status(500).json({ error: err });
//         }
//         res.status(200).json(results);
//     });
// });

// Get Status Endpoint
app.get('/status', (req, res) => {
    const query = 'SELECT * FROM status';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.status(200).json(results);
    });
});

// Update Jasa Endpoint
app.put('/jasa/:id', (req, res) => {
    const { id } = req.params;
    const { nama_jasa, harga } = req.body;

    const query = 'UPDATE jasa SET nama_jasa = ?, harga = ? WHERE id = ?';
    db.query(query, [nama_jasa, harga, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.status(200).json({ message: 'Jasa updated successfully!' });
    });
});

// Delete Jasa Endpoint
app.delete('/jasa/:id', (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM jasa WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.status(200).json({ message: 'Jasa deleted successfully!' });
    });
});

// // Update Metode Endpoint
// app.put('/metode/:id', (req, res) => {
//     const { id } = req.params;
//     const { nama_metode } = req.body;

//     const query = 'UPDATE metode SET nama_metode = ? WHERE id = ?';
//     db.query(query, [nama_metode, id], (err, result) => {
//         if (err) {
//             return res.status(500).json({ error: err });
//         }
//         res.status(200).json({ message: 'Metode updated successfully!' });
//     });
// });

// // Delete Metode Endpoint
// app.delete('/metode/:id', (req, res) => {
//     const { id } = req.params;

//     const query = 'DELETE FROM metode WHERE id = ?';
//     db.query(query, [id], (err, result) => {
//         if (err) {
//             return res.status(500).json({ error: err });
//         }
//         res.status(200).json({ message: 'Metode deleted successfully!' });
//     });
// });

// Update Status Endpoint
app.put('/status/:id', (req, res) => {
    const { id } = req.params;
    const { nama_status } = req.body;

    const query = 'UPDATE status SET nama_status = ? WHERE id = ?';
    db.query(query, [nama_status, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.status(200).json({ message: 'Status updated successfully!' });
    });
});

// Delete Status Endpoint
app.delete('/status/:id', (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM status WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.status(200).json({ message: 'Status deleted successfully!' });
    });
});

// Get Users Endpoint
app.get('/users', (req, res) => {
    const query = 'SELECT id, full_name, email, phone, is_admin FROM users';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.status(200).json(results);
    });
});

// Add User Endpoint
app.post('/users', (req, res) => {
    const { full_name, email, phone, password, is_admin } = req.body;

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            return res.status(500).json({ error: err });
        }

        const query = 'INSERT INTO users (full_name, email, phone, password, is_admin) VALUES (?, ?, ?, ?, ?)';
        db.query(query, [full_name, email, phone, hash, is_admin || 0], (err, result) => {
            if (err) {
                return res.status(500).json({ error: err });
            }
            res.status(201).json({ message: 'User added successfully!' });
        });
    });
});

// Update User Endpoint
app.put('/users/:id', (req, res) => {
    const { id } = req.params;
    const { full_name, email, phone, is_admin } = req.body;

    const query = 'UPDATE users SET full_name = ?, email = ?, phone = ?, is_admin = ? WHERE id = ?';
    db.query(query, [full_name, email, phone, is_admin, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.status(200).json({ message: 'User updated successfully!' });
    });
});

// Delete User Endpoint
app.delete('/users/:id', (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM users WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.status(200).json({ message: 'User deleted successfully!' });
    });
});

// Add Order Endpoint with File Upload
app.post('/orders', upload.single('bukti'), (req, res) => {
    const { id_user, nama_sepatu, id_jasa, total } = req.body;
    const bukti = req.file ? `/uploads/${req.file.filename}` : null;

    // Generate invoice number
    const date = new Date();
    const formattedDate = `${date.getDate()}${date.getMonth() + 1}${date.getFullYear()}`;
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const inv_no = `${formattedDate}/${id_user}/${id_jasa}/${randomDigits}`;

    // Set default status to 'Pending'
    const queryStatus = 'SELECT id FROM status WHERE nama_status = "Pending"';
    db.query(queryStatus, (err, statusResults) => {
        if (err || statusResults.length === 0) {
            return res.status(500).json({ error: 'Failed to retrieve status' });
        }
        const id_status = statusResults[0].id;

        // Insert order into database
        const query = 'INSERT INTO orders (id_user, nama_sepatu, inv_no, id_jasa, total, id_status, tgl_order, bukti) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        db.query(query, [id_user, nama_sepatu, inv_no, id_jasa, total, id_status, date, bukti], (err, result) => {
            if (err) {
                return res.status(500).json({ error: err });
            }
            res.status(201).json({ message: 'Order added successfully!' });
        });
    });
});

// Get Orders by User ID Endpoint
app.get('/orders/:id_user', (req, res) => {
    const { id_user } = req.params;
    const query = `
        SELECT orders.inv_no, jasa.nama_jasa AS service, status.nama_status AS status, orders.tgl_order AS date, orders.total AS amount
        FROM orders
        JOIN jasa ON orders.id_jasa = jasa.id
        JOIN status ON orders.id_status = status.id
        WHERE orders.id_user = ?
    `;
    db.query(query, [id_user], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.status(200).json(results);
    });
});

// Get User Statistics Endpoint
app.get('/user-stats/:id_user', (req, res) => {
    const { id_user } = req.params;
    const query = `
    SELECT 
      COUNT(*) AS total_orders,
      MAX(tgl_order) AS last_order_date,
      SUM(total) AS total_spent,
      COUNT(CASE WHEN status.nama_status = 'Pending' THEN 1 END) AS pending_orders
    FROM orders
    JOIN status ON orders.id_status = status.id
    WHERE orders.id_user = ?
  `;
    db.query(query, [id_user], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.status(200).json(results[0]);
    });
});

// Get User Profile Endpoint
app.get('/user-profile/:id_user', (req, res) => {
    const { id_user } = req.params;
    const query = 'SELECT full_name, email, phone, address FROM users WHERE id = ?';

    db.query(query, [id_user], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(results[0]);
    });
});

// Update User Profile Endpoint
app.put('/user-profile/:id_user', (req, res) => {
    const { id_user } = req.params;
    const { full_name, email, phone, address } = req.body;

    const query = 'UPDATE users SET full_name = ?, email = ?, phone = ?, address = ? WHERE id = ?';

    db.query(query, [full_name, email, phone, address, id_user], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'Profile updated successfully!' });
    });
});

// Change Password Endpoint
app.put('/change-password/:id_user', (req, res) => {
    const { id_user } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Logika untuk memverifikasi password saat ini dan mengupdate ke password baru
    const query = 'SELECT password FROM users WHERE id = ?';

    db.query(query, [id_user], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = results[0];
        // Di sini Anda biasanya membandingkan currentPassword dengan password yang disimpan
        // Menggunakan fungsi untuk membandingkan password
        bcrypt.compare(currentPassword, user.password, (err, isMatch) => {
            if (err) {
                return res.status(500).json({ error: err });
            }
            if (!isMatch) {
                return res.status(401).json({ message: 'Current password is incorrect' });
            }

            // Mengupdate password
            const updateQuery = 'UPDATE users SET password = ? WHERE id = ?';
            bcrypt.hash(newPassword, 10, (err, hash) => {
                if (err) {
                    return res.status(500).json({ error: err });
                }
                db.query(updateQuery, [hash, id_user], (err) => {
                    if (err) {
                        return res.status(500).json({ error: err });
                    }
                    res.status(200).json({ message: 'Password changed successfully!' });
                });
            });
        });
    });
});

// Get All Orders Endpoint
app.get('/orders', (req, res) => {
    const query = `
        SELECT orders.id, orders.inv_no, users.full_name AS customer, users.address AS customerAddress, users.phone AS customerPhone, jasa.nama_jasa AS service, 
               status.nama_status AS status, orders.tgl_order AS date, orders.total AS amount, orders.bukti
        FROM orders
        JOIN users ON orders.id_user = users.id
        JOIN jasa ON orders.id_jasa = jasa.id
        JOIN status ON orders.id_status = status.id
        ORDER BY orders.tgl_order DESC
    `;
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.status(200).json(results);
    });
});

// Update Order Status Endpoint
app.put('/orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { id_status } = req.body;

    const query = 'UPDATE orders SET id_status = ? WHERE id = ?';
    db.query(query, [id_status, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.status(200).json({ message: 'Order status updated successfully!' });
    });
});

// Get Admin Dashboard Statistics Endpoint
app.get('/admin-stats', (req, res) => {
    const statsQuery = `
        SELECT 
            (SELECT COUNT(*) FROM orders) AS total_orders,
            (SELECT COUNT(DISTINCT id_user) FROM orders) AS total_customers,
            (SELECT SUM(total) FROM orders WHERE id_status = (SELECT id FROM status WHERE nama_status = 'Completed')) AS total_revenue,
            (SELECT COUNT(*) FROM orders WHERE id_status = (SELECT id FROM status WHERE nama_status = 'Completed')) AS shoes_cleaned
    `;

    db.query(statsQuery, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.status(200).json(results[0]);
    });
});

// Get Recent Orders Endpoint
app.get('/recent-orders', (req, res) => {
    const query = `
        SELECT orders.id, orders.inv_no, users.full_name AS customer, jasa.nama_jasa AS service, 
               status.nama_status AS status, orders.tgl_order AS date, orders.total AS amount
        FROM orders
        JOIN users ON orders.id_user = users.id
        JOIN jasa ON orders.id_jasa = jasa.id
        JOIN status ON orders.id_status = status.id
        ORDER BY orders.tgl_order DESC
        LIMIT 5
    `;
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.status(200).json(results);
    });
});

// Get Order Details Endpoint
app.get('/order/:id', (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT orders.id, orders.inv_no, orders.tgl_order AS orderDate, users.full_name AS customerName,
               users.email AS customerEmail, users.phone AS customerPhone, users.address AS customerAddress, jasa.nama_jasa AS service,
               orders.total AS amount
        FROM orders
        JOIN users ON orders.id_user = users.id
        JOIN jasa ON orders.id_jasa = jasa.id
        WHERE orders.id = ?
    `;

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error fetching order:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.status(200).json(results[0]);
    });
});

// Start Server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
