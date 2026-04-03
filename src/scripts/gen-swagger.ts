import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import swaggerJSDoc from 'swagger-jsdoc';
import { swaggerOptions } from '../config/swagger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generates the static Swagger/OpenAPI specification.
 * 
 * Logic:
 * 1. Uses 'swagger-jsdoc' to extract @swagger annotations from the source.
 * 2. Ensures the destination folder 'src/generated' exists.
 * 3. Writes the resulting specification to 'swagger.json'.
 */
const generateSwagger = () => {
  console.log('🏁 Generating static Swagger documentation...');

  try {
    const spec = swaggerJSDoc(swaggerOptions);
    const srcPath = path.join(__dirname, '../generated/swagger/spec.json');
    const distPath = path.join(__dirname, '../../dist/generated/swagger/spec.json');

    // Helper to ensure directory exists and write file
    const writeToRoot = (outputPath: string) => {
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2), 'utf-8');
      console.log(`✅ Swagger spec saved at: ${outputPath}`);
    };

    // Always write to src for persistence
    writeToRoot(srcPath);

    // Write to dist if it exists (for local 'pnpm start' support)
    if (fs.existsSync(path.join(__dirname, '../../dist'))) {
      writeToRoot(distPath);
    }
  } catch (error) {
    console.error('❌ Failed to generate Swagger documentation:', error);
    process.exit(1);
  }
};

generateSwagger();
