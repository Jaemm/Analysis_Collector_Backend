module.exports = {
  apps: [
    {
      name: 'analysis-collector',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      cwd: __dirname,

      env: {
        NODE_ENV: 'development',
      },

      env_production: {
        NODE_ENV: 'production',
      },

      env_staging: {
        NODE_ENV: 'production',
        APP_ENV: 'staging',
        STAGING_MASTER_TOKEN_ENABLED: 'true',
      },

      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',

      autorestart: true,
      max_memory_restart: '300M',
    },
  ],
};
