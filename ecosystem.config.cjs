module.exports = {
  apps: [
    {
      name: 'ganesh-mule-web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: __dirname,
      // Keep single instance in fork mode so in-memory OTP cache and .data JSON stores stay consistent
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};

