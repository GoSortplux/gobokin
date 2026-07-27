const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';

// Parse port correctly for Passenger (Passenger passes a Unix socket file path instead of a port number)
const rawPort = process.env.PORT || 3000;
const isSocket = isNaN(rawPort);
const port = isSocket ? rawPort : parseInt(rawPort, 10);

const hostname = 'localhost';
const app = next({ dev, hostname, port: isSocket ? 3000 : port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on ${isSocket ? port : 'http://' + hostname + ':' + port}`);
    });
});
