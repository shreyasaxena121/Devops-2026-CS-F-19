/**
 * WebSocket Server for Real-Time CampusCart Communications
 * Implements RFC 6455 WebSocket protocol using native Node.js HTTP and Crypto.
 * Supports:
 * - Live product upload announcements
 * - Real-time order/request notifications
 * - Active online student count & Prometheus metrics integration
 */

const crypto = require('crypto');
const { registry } = require('../metrics/prometheus');

const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

class CampusCartSocketServer {
  constructor() {
    this.clients = new Set();
  }

  attach(server) {
    server.on('upgrade', (req, socket, head) => {
      // Only handle /ws or socket paths
      const url = new URL(req.url, `http://${req.headers.host}`);
      if (url.pathname !== '/ws' && url.pathname !== '/socket.io/') {
        socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
        socket.destroy();
        return;
      }

      const key = req.headers['sec-websocket-key'];
      if (!key) {
        socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
        socket.destroy();
        return;
      }

      // Generate Sec-WebSocket-Accept hash
      const acceptValue = crypto
        .createHash('sha1')
        .update(key + WS_GUID)
        .digest('base64');

      const headers = [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${acceptValue}`,
        '\r\n'
      ];

      socket.write(headers.join('\r\n'));

      // Add to connected clients
      this.clients.add(socket);
      registry.activeConnections.set(this.clients.size);
      console.log(`[WebSocket] Client connected. Total active: ${this.clients.size}`);

      // Send initial welcome & connected state
      this.sendTo(socket, {
        type: 'CONNECTED',
        message: 'Connected to CampusCart Real-time Network',
        activeClients: this.clients.size
      });

      // Handle socket incoming data
      socket.on('data', (buffer) => {
        try {
          const message = this.decodeFrame(buffer);
          if (message) {
            this.handleMessage(socket, message);
          }
        } catch (err) {
          // Ignore malformed frames
        }
      });

      socket.on('close', () => {
        this.clients.delete(socket);
        registry.activeConnections.set(this.clients.size);
        console.log(`[WebSocket] Client disconnected. Total active: ${this.clients.size}`);
      });

      socket.on('error', (err) => {
        this.clients.delete(socket);
        registry.activeConnections.set(this.clients.size);
      });
    });
  }

  handleMessage(socket, rawMessage) {
    try {
      const data = JSON.parse(rawMessage);
      if (data.type === 'PING') {
        this.sendTo(socket, { type: 'PONG', timestamp: Date.now() });
      }
    } catch {
      // Fallback for non-JSON text
      if (rawMessage === 'ping') {
        this.sendTo(socket, { type: 'PONG' });
      }
    }
  }

  // Encode payload into an RFC 6455 WebSocket frame (Server-to-Client is unmasked)
  encodeFrame(data) {
    const payload = Buffer.from(typeof data === 'string' ? data : JSON.stringify(data));
    const length = payload.length;

    let header;
    if (length <= 125) {
      header = Buffer.alloc(2);
      header[0] = 0x81; // FIN + text opcode (1)
      header[1] = length;
    } else if (length <= 65535) {
      header = Buffer.alloc(4);
      header[0] = 0x81;
      header[1] = 126;
      header.writeUInt16BE(length, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x81;
      header[1] = 127;
      header.writeBigUInt64BE(BigInt(length), 2);
    }

    return Buffer.concat([header, payload]);
  }

  // Decode standard masked frame from client
  decodeFrame(buffer) {
    if (buffer.length < 2) return null;
    const opcode = buffer[0] & 0x0f;
    // 0x8 is close, 0x9 is ping, 0xA is pong, 0x1 is text
    if (opcode === 0x8) return null;

    const isMasked = (buffer[1] & 0x80) === 0x80;
    let length = buffer[1] & 0x7f;
    let offset = 2;

    if (length === 126) {
      length = buffer.readUInt16BE(offset);
      offset += 2;
    } else if (length === 127) {
      length = Number(buffer.readBigUInt64BE(offset));
      offset += 8;
    }

    let mask = null;
    if (isMasked) {
      mask = buffer.slice(offset, offset + 4);
      offset += 4;
    }

    const payload = buffer.slice(offset, offset + length);
    if (isMasked && mask) {
      for (let i = 0; i < payload.length; i++) {
        payload[i] ^= mask[i % 4];
      }
    }

    return payload.toString('utf8');
  }

  sendTo(socket, data) {
    if (socket.writable) {
      socket.write(this.encodeFrame(data));
    }
  }

  // Broadcast event to all connected clients (e.g. new product, new trade alert)
  broadcast(event, payload = {}) {
    const message = {
      event,
      timestamp: new Date().toISOString(),
      ...payload
    };
    const frame = this.encodeFrame(message);

    for (const client of this.clients) {
      if (client.writable) {
        client.write(frame);
      }
    }
  }

  getConnectedCount() {
    return this.clients.size;
  }
}

const socketServer = new CampusCartSocketServer();

module.exports = socketServer;
