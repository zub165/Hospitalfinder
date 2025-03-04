const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS for all origins in development
app.use(cors({
    origin: ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
}));

// Validate TomTom API requests
function validateTomTomRequest(req, res, next) {
    if (!process.env.TOMTOM_API_KEY) {
        console.error('TomTom API key not found in environment variables');
        return res.status(500).json({ error: 'TomTom API key not configured' });
    }
    next();
}

// Proxy middleware for TomTom API
app.use('/tomtom', validateTomTomRequest, createProxyMiddleware({
    target: 'https://api.tomtom.com',
    changeOrigin: true,
    pathRewrite: {
        '^/tomtom': '' // remove /tomtom from the url path when redirecting
    },
    onProxyReq: (proxyReq, req) => {
        // Add API key to all requests
        const url = new URL(proxyReq.path, 'https://api.tomtom.com');
        url.searchParams.set('key', process.env.TOMTOM_API_KEY);
        proxyReq.path = url.pathname + url.search;
        
        // Log the proxied request in development
        if (process.env.NODE_ENV === 'development') {
            console.log('Proxying request:', url.toString());
        }
    },
    onError: (err, req, res) => {
        console.error('Proxy Error:', err);
        res.status(500).json({ error: 'Failed to connect to TomTom API' });
    }
}));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        tomtomApiConfigured: !!process.env.TOMTOM_API_KEY,
        version: process.env.TOMTOM_API_VERSION
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
    console.log(`Proxy server listening on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`TomTom API Version: ${process.env.TOMTOM_API_VERSION}`);
});
