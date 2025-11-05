/**
 * PM2 Process Manager Configuration
 *
 * This configuration enables production deployment with PM2.
 * PM2 provides process management, clustering, and monitoring.
 *
 * Usage:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 restart qwen-proxy
 *   pm2 stop qwen-proxy
 *   pm2 delete qwen-proxy
 *   pm2 logs qwen-proxy
 *   pm2 monit
 */

module.exports = {
  apps: [{
    name: 'qwen-proxy',
    script: 'src/index.js',

    // Cluster mode - run multiple instances
    instances: 'max', // or specific number like 4
    exec_mode: 'cluster',

    // Environment variables
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 3000
    },

    // Logging
    error_file: 'logs/pm2-error.log',
    out_file: 'logs/pm2-out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

    // Restart behavior
    autorestart: true,
    watch: false, // Set to true in development
    max_memory_restart: '1G',

    // Startup parameters
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,

    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,

    // Advanced features
    instance_var: 'INSTANCE_ID',

    // Source map support
    source_map_support: true,

    // Interpreter args (Node.js flags)
    node_args: [
      '--max-old-space-size=1024',
      '--max-http-header-size=16384'
    ],

    // Process monitoring
    monitor: {
      cpu: true,
      memory: true,
      network: true
    }
  }],

  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/qwen-proxy.git',
      path: '/opt/qwen-proxy',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
