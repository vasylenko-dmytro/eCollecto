/**
 * Re-exports the generated TariffsDto schema under the legacy name used by the codebase.
 * Schema shape is derived from backend/ecollecto-backend/openapi.yaml via openapi-zod-client.
 * Run `npm run generate` after any backend DTO change to keep this in sync.
 */
import { schemas } from '../schemas.generated';

export const TariffsSchema = schemas.TariffsDto;
