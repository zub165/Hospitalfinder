const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const port = 3000;

// Enable CORS for your frontend origin
app.use(cors({
  origin: 'http://127.0.0.1:5500' // Allow requests from your frontend
}));

// Proxy middleware for TomTom API
app.use('/tomtom', createProxyMiddleware({
  target: 'https://api.tomtom.com',
  changeOrigin: true,
  pathRewrite: {
    '^/tomtom': '' // remove /tomtom from the url path when redirecting
  }
}));

app.listen(port, () => {
  console.log(`Proxy server listening on port ${port}`);
});
