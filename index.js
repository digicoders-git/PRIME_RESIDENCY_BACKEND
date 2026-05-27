const express = require('express');
const https = require('https');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Enable CORS
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    "https://prime-residency-admin-panel.vercel.app",
    'https://prime-residency-website.vercel.app',
    'https://prime-residency-admin.vercel.app',
    'https://prime-residency-backend.onrender.com',
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));

// Body parser
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Request logging middleware
// app.use((req, res, next) => {
//     console.log(`${req.method} ${req.path}`);
//     next();
// });

// Basic route
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Mount Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/guests', require('./routes/guests'));
app.use('/api/gallery', require('./routes/gallery'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/services', require('./routes/services'));
app.use('/api/room-config', require('./routes/roomConfig'));
app.use('/api/icons', require('./routes/icons'));
app.use('/api/enquiries', require('./routes/enquiryRoutes'));
app.use('/api/revenue', require('./routes/revenue'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/managers', require('./routes/managers'));
app.use('/api/food-items', require('./routes/foodItems'));
app.use('/api/food-orders', require('./routes/foodOrders'));
app.use('/api/test', require('./routes/test'));

// Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Start self-pinging to keep Render free-tier instance alive (prevents cold starts)
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || 'https://prime-residency-backend.onrender.com';
if (RENDER_EXTERNAL_URL && !RENDER_EXTERNAL_URL.includes('localhost') && !RENDER_EXTERNAL_URL.includes('127.0.0.1')) {
    // Wait 10 seconds after server startup before firing the initial ping
    setTimeout(() => {
        console.log(`[Keep-Alive] Initializing self-ping routine targeting: ${RENDER_EXTERNAL_URL}`);
        https.get(RENDER_EXTERNAL_URL, (res) => {
            console.log(`[Keep-Alive] Initial ping successful. Status Code: ${res.statusCode}`);
        }).on('error', (err) => {
            console.error('[Keep-Alive] Initial ping failed:', err.message);
        });

        // Ping every 10 minutes to stay awake
        setInterval(() => {
            https.get(RENDER_EXTERNAL_URL, (res) => {
                console.log(`[Keep-Alive] Self-ping successful. Status Code: ${res.statusCode}`);
            }).on('error', (err) => {
                console.error('[Keep-Alive] Self-ping failed:', err.message);
            });
        }, 10 * 60 * 1000);
    }, 10000);
}
