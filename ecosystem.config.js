module.exports = {
  apps: [
    {
      name: 'escuchodromo-backend',
      script: 'dist/apps/backend/main.js',
      cwd: '/ruta/a/tu/proyecto',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3333
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3333,
        // Variables de entorno de producción
      },
      log_file: 'logs/combined.log',
      out_file: 'logs/out.log',
      error_file: 'logs/error.log',
      time: true,
      restart_delay: 4000,
      max_restarts: 5,
      min_uptime: '2s'
    },
    {
      name: 'escuchodromo-web',
      script: 'npm',
      args: 'start',
      cwd: '/ruta/a/tu/proyecto/apps/web',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      log_file: 'logs/web-combined.log',
      out_file: 'logs/web-out.log',
      error_file: 'logs/web-error.log',
      time: true
    }
  ]
};