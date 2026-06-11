import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import path from 'path';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = 3000;

// Use custom distDir based on environment to avoid collision
const distDir = dev ? '.next-dev' : '.next';

const app = next({ 
  dev, 
  hostname, 
  port,
  conf: {
    distDir
  }
});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url || '', true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
