import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'tests/e2e',fullyParallel:false,workers:1,timeout:45000,
  outputDir:'output/playwright/results',reporter:'list',
  use:{baseURL:'http://127.0.0.1:5176',channel:'msedge',trace:'off'},
  webServer:{command:'npm run preview -- --host 127.0.0.1 --port 5176 --strictPort',url:'http://127.0.0.1:5176',reuseExistingServer:false,timeout:30000},
});
