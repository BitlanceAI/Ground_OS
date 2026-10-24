module.exports = {
  apps: [
    {
      name: "ground-os-api",
      script: "services/api/dist/server.js",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        API_PORT: 4000,
      },
    },
    {
      name: "ground-os-realtime",
      script: "services/realtime/dist/index.js",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
        REALTIME_PORT: 4001,
      },
    },
    {
      name: "ground-os-worker",
      script: "services/worker/dist/index.js",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        WORKER_PORT: 4002,
      },
    },
  ],
};
