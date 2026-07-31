// Production Unified Entry Point for Render Free Tier (Runs under 60MB RAM)
console.log('[Production Server] Starting all microservices and Gateway in a single Node process...');

import './auth-service/index.js';
import './property-service/index.js';
import './visit-service/index.js';
import './community-service/index.js';
import './gateway/index.js';