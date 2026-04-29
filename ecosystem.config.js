module.exports = {
  apps: [
    {
      name: "medfreela",
      script: "node_modules/.bin/next",
      args: "start --port 3000",
      cwd: "/var/www/medfreela",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};
