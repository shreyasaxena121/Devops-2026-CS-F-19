/**
 * Prometheus Metrics Collection & Exposition for CampusCart Backend
 * Implements Prometheus Metric Types: Counter, Gauge, Histogram
 * Follows Prometheus text exposition format (version 0.0.4)
 */

class Counter {
  constructor(name, help, labelNames = []) {
    this.name = name;
    this.help = help;
    this.labelNames = labelNames;
    this.values = new Map();
  }

  _getKey(labels = {}) {
    return this.labelNames.map(l => `${l}="${labels[l] || ''}"`).join(',');
  }

  inc(labels = {}, value = 1) {
    if (value < 0) throw new Error('Counter cannot be decremented');
    const key = this._getKey(labels);
    const current = this.values.get(key) || 0;
    this.values.set(key, current + value);
  }

  reset() {
    this.values.clear();
  }

  toPrometheusString() {
    let output = `# HELP ${this.name} ${this.help}\n# TYPE ${this.name} counter\n`;
    if (this.values.size === 0) {
      output += `${this.name} 0\n`;
      return output;
    }
    for (const [labels, val] of this.values.entries()) {
      if (labels) {
        output += `${this.name}{${labels}} ${val}\n`;
      } else {
        output += `${this.name} ${val}\n`;
      }
    }
    return output;
  }
}

class Gauge {
  constructor(name, help, labelNames = []) {
    this.name = name;
    this.help = help;
    this.labelNames = labelNames;
    this.values = new Map();
  }

  _getKey(labels = {}) {
    return this.labelNames.map(l => `${l}="${labels[l] || ''}"`).join(',');
  }

  set(labels = {}, value) {
    if (typeof labels === 'number') {
      value = labels;
      labels = {};
    }
    const key = this._getKey(labels);
    this.values.set(key, value);
  }

  inc(labels = {}, value = 1) {
    const key = this._getKey(labels);
    const current = this.values.get(key) || 0;
    this.values.set(key, current + value);
  }

  dec(labels = {}, value = 1) {
    const key = this._getKey(labels);
    const current = this.values.get(key) || 0;
    this.values.set(key, current - value);
  }

  toPrometheusString() {
    let output = `# HELP ${this.name} ${this.help}\n# TYPE ${this.name} gauge\n`;
    if (this.values.size === 0) {
      output += `${this.name} 0\n`;
      return output;
    }
    for (const [labels, val] of this.values.entries()) {
      if (labels) {
        output += `${this.name}{${labels}} ${val}\n`;
      } else {
        output += `${this.name} ${val}\n`;
      }
    }
    return output;
  }
}

class Histogram {
  constructor(name, help, buckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10], labelNames = []) {
    this.name = name;
    this.help = help;
    this.buckets = [...buckets].sort((a, b) => a - b);
    this.labelNames = labelNames;
    this.records = new Map();
  }

  _getKey(labels = {}) {
    return this.labelNames.map(l => `${l}="${labels[l] || ''}"`).join(',');
  }

  observe(labels = {}, value) {
    if (typeof labels === 'number') {
      value = labels;
      labels = {};
    }
    const key = this._getKey(labels);
    let record = this.records.get(key);
    if (!record) {
      record = {
        sum: 0,
        count: 0,
        bucketCounts: new Map(this.buckets.map(b => [b, 0]))
      };
      this.records.set(key, record);
    }

    record.sum += value;
    record.count += 1;

    for (const b of this.buckets) {
      if (value <= b) {
        record.bucketCounts.set(b, record.bucketCounts.get(b) + 1);
      }
    }
  }

  toPrometheusString() {
    let output = `# HELP ${this.name} ${this.help}\n# TYPE ${this.name} histogram\n`;
    if (this.records.size === 0) {
      output += `${this.name}_count 0\n${this.name}_sum 0\n`;
      return output;
    }
    for (const [labelStr, record] of this.records.entries()) {
      const labelPrefix = labelStr ? `${labelStr},` : '';
      for (const b of this.buckets) {
        output += `${this.name}_bucket{${labelPrefix}le="${b}"} ${record.bucketCounts.get(b)}\n`;
      }
      output += `${this.name}_bucket{${labelPrefix}le="+Inf"} ${record.count}\n`;
      if (labelStr) {
        output += `${this.name}_sum{${labelStr}} ${record.sum.toFixed(6)}\n`;
        output += `${this.name}_count{${labelStr}} ${record.count}\n`;
      } else {
        output += `${this.name}_sum ${record.sum.toFixed(6)}\n`;
        output += `${this.name}_count ${record.count}\n`;
      }
    }
    return output;
  }
}

// Registry singleton
class MetricsRegistry {
  constructor() {
    // 1. Counter: Total HTTP requests
    this.httpRequestsTotal = new Counter(
      'http_requests_total',
      'Total number of HTTP requests processed by CampusCart API',
      ['method', 'route', 'status_code']
    );

    // 2. Histogram: HTTP request latency
    this.httpRequestDuration = new Histogram(
      'http_request_duration_seconds',
      'HTTP request latency duration in seconds',
      [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      ['method', 'route', 'status_code']
    );

    // 3. Gauge: Active WebSocket connections
    this.activeConnections = new Gauge(
      'campuscart_active_connections',
      'Current active WebSocket real-time connections'
    );

    // 4. Gauge: Database health status
    this.dbStatus = new Gauge(
      'campuscart_db_status',
      'MongoDB database connection status (1 = connected, 0 = disconnected)'
    );

    // 5. Counter: Business metrics
    this.ordersCreatedTotal = new Counter(
      'campuscart_orders_created_total',
      'Total number of orders created'
    );

    this.productsCreatedTotal = new Counter(
      'campuscart_products_created_total',
      'Total number of products listed'
    );
  }

  // Middleware to auto-capture Express requests
  middleware() {
    return (req, res, next) => {
      if (req.path === '/metrics') {
        return next();
      }

      const start = process.hrtime();

      res.on('finish', () => {
        const diff = process.hrtime(start);
        const durationSeconds = diff[0] + diff[1] / 1e9;
        
        // Normalize route pattern to avoid metric label explosion
        const route = req.baseUrl || req.route?.path || req.path || 'unknown';
        const labels = {
          method: req.method,
          route: route.replace(/\/[0-9a-fA-F]{24}/g, '/:id'),
          status_code: String(res.statusCode)
        };

        this.httpRequestsTotal.inc(labels);
        this.httpRequestDuration.observe(labels, durationSeconds);
      });

      next();
    };
  }

  // Generate standard Prometheus metric text
  exportMetrics() {
    const mem = process.memoryUsage();
    let text = '';

    // Custom Application Metrics
    text += this.httpRequestsTotal.toPrometheusString() + '\n';
    text += this.httpRequestDuration.toPrometheusString() + '\n';
    text += this.activeConnections.toPrometheusString() + '\n';
    text += this.dbStatus.toPrometheusString() + '\n';
    text += this.ordersCreatedTotal.toPrometheusString() + '\n';
    text += this.productsCreatedTotal.toPrometheusString() + '\n';

    // Standard Node.js Process Runtime Metrics
    text += `# HELP process_uptime_seconds Total process uptime in seconds\n# TYPE process_uptime_seconds gauge\nprocess_uptime_seconds ${process.uptime().toFixed(2)}\n\n`;
    text += `# HELP nodejs_heap_size_used_bytes Process memory heap used in bytes\n# TYPE nodejs_heap_size_used_bytes gauge\nnodejs_heap_size_used_bytes ${mem.heapUsed}\n\n`;
    text += `# HELP nodejs_heap_size_total_bytes Process memory heap total in bytes\n# TYPE nodejs_heap_size_total_bytes gauge\nnodejs_heap_size_total_bytes ${mem.heapTotal}\n\n`;
    text += `# HELP process_resident_memory_bytes Resident memory size in bytes\n# TYPE process_resident_memory_bytes gauge\nprocess_resident_memory_bytes ${mem.rss}\n`;

    return text;
  }
}

const registry = new MetricsRegistry();

module.exports = {
  registry,
  Counter,
  Gauge,
  Histogram
};
