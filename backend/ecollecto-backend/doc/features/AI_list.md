# AI Features for eCollecto

## Overall direction
Given eCollecto is about collections (stamps, first day covers, designers, tariffs), the most valuable AI features revolve around recognition, enrichment, recommendation, and assistance. The target architecture should not keep all AI logic inside the current backend forever: the long-term direction is a separate `ecollecto-ai-service`, fronted by an API gateway/BFF, with supporting services added as AI capabilities become more advanced.

## 1. AI stamp recognition from images
**What it does**: User uploads a stamp photo, and the system identifies the stamp (or top-N candidates), filling in catalog fields (name, year, country, value, condition hints).

**UX**
- "Identify this stamp" button in the collection screen.
- Drag-and-drop or mobile camera capture, then show candidate matches with confidence scores.

**Backend design**
- New endpoint: `POST /api/ai/stamp-identification` (multipart: image).
- Requests should be routed through the API gateway to `ecollecto-ai-service`.
- `ecollecto-ai-service` can call an external vision API (Google Vision, AWS Rekognition, Azure Custom Vision) or a later custom model.
- AI returns: candidate `stampIds` with probabilities plus extracted text.
- `ecollecto-backend` remains the owner of catalog/domain data and can enrich the final response with existing stamp metadata if needed.

**Model options**
- Phase 1: Use a generic vision API plus some text/OCR-based filtering on country, year, value.
- Phase 2: Custom fine-tuned image classifier (e.g., CLIP-based) trained on existing stamp images and labels.

## 2. Intelligent collection recommendations
**What it does**: Personalized suggestions for what to collect next (complete a series, other covers from the same designer, stamps matching themes).

**UX**
- "Recommended for you" section on the home page.
- Inline recommendations on a product page: "Because you own X, you might like Y."

**Backend design**
- New endpoints: `GET /api/ai/recommendations` (user-based) and `GET /api/ai/recommendations/{stampId}` (item-based).
- Use user's Mongo-backed collection data (owned stamps, wishlists, views) plus stamp metadata.
- Implement a service that:
  - Phase 1: Uses heuristic rules (same series, country, year, tags).
  - Phase 2: Uses a recommendation model (embeddings via OpenAI/Vertex AI or a local model handled by `ecollecto-ai-service`).

**Data flow**
- Nightly job builds item embeddings (stamp to vector) and user embeddings (user's collection to vector).
- Store structured source-of-truth data in Mongo.
- Store embeddings in a vector database such as Qdrant once semantic recommendations become real.

## 3. Natural language search and filters
**What it does**: Let users search by free text, such as "show me Ukrainian stamps about space from the 1960s" instead of manual filters.

**UX**
- A "Smart search" input with examples or hints.

**Backend design**
- Endpoint: `GET /api/ai/search?q=...`
- Pipeline:
  - Use an LLM (API call) to parse the natural query into structured filters (country, year range, theme, designer).
  - Map to a Mongo query against `StampDocument` and `FirstDayCoverDocument`.

**Future enhancement**
- Add semantic search using embeddings:
  - Pre-compute text embeddings for stamp descriptions, themes, designers.
  - At query time, embed the query and retrieve top-k similar items from Qdrant or another vector store.

## 4. AI metadata enrichment and cleaning
**What it does**: Automatically generate or clean up descriptions, keywords/tags, and fields for stamps and covers.

**Use cases**
- Generate missing descriptions from raw catalog data.
- Suggest standardized tags/themes (e.g., "flora", "space", "historical figures").

**Backend design**
- Admin-only endpoint: `POST /api/admin/ai/enrich-stamp/{id}`.
- Admin requests should be routed through the API gateway to `ecollecto-ai-service`.
- `ecollecto-ai-service` calls an LLM with the stamp's raw data and gets back structured JSON with:
  - Improved description.
  - List of tags.
  - Optional hint for catalog value (with confidence).
- Store enriched fields back in Mongo (keeping original data as source of truth).
- Use asynchronous processing for large enrichment batches once RabbitMQ is introduced.

## 5. Collection assistant chatbot
**What it does**: Conversational assistant that understands the catalog and the user's collection.

**Example questions**
- "Do I have all stamps from the Europa 1983 series?"
- "Which missing stamps complete my 'space exploration' theme?"

**UX**
- Chat widget in the UI that can open from the navbar.

**Backend design**
- Endpoint: `POST /api/ai/chat` (message history, `userId`).
- The preferred implementation is inside `ecollecto-ai-service`, not in the catalog backend.
- AI orchestration should:
  - inject relevant Mongo-backed data (user's collection, series data) as context
  - use retrieval-augmented generation (RAG): query the embedding store for related stamps or series and feed them into the LLM prompt

**Data**
- Build a small knowledge base from Mongo documents (series, designers, tariffs) and keep it refreshed.
- Keep short-lived conversational state in Redis.

## 6. Price estimation and market insights (advanced)
**What it does**: Suggest a rough market value range or rarity for a stamp given its ID plus condition (or photo).

**UX**
- On product page: "Estimated value: 10-15 EUR (low confidence)" with a disclaimer.

**Backend design**
- `POST /api/ai/valuation/{stampId}` with optional condition and photo.
- Use external data sources (scraped auction sites or marketplaces) plus a regression model.

**Risk and mitigation**
- Make it explicitly advisory, with a confidence score and "not financial advice" text.

## 7. Implementation strategy and priorities
**Phase A (low risk, high value, minimal infra)**
- AI search (LLM to filters) and heuristic recommendations.
- Admin metadata enrichment using LLM APIs.
- Introduce `ecollecto-ai-service` as the target runtime boundary even if the first implementation is small.
- Introduce Redis for:
  - AI response caching
  - rate limiting
  - short-lived conversational state
  - small async job status objects

**Phase B (medium effort)**
- Chat assistant with RAG over Mongo data.
- API gateway introduction as the single browser-facing entry point for multi-service traffic.
- BFF model for browser-facing authentication flows:
  - gateway exchanges the authorization code with Keycloak
  - browser session is maintained with Secure HttpOnly cookies

**Phase C (higher effort)**
- Stamp image recognition.
- Price estimation.
- RabbitMQ for async enrichment and background AI workflows.
- Observability stack for metrics, logs, tracing, latency, token usage, and cost visibility.
- Qdrant or another vector database for semantic retrieval, RAG, and similarity recommendations.

**Technical integration pattern**
- Preferred target topology:
  - frontend
  - API gateway / BFF
  - `ecollecto-backend`
  - `ecollecto-ai-service`
- Keep `ecollecto-backend` responsible for catalog/domain APIs and user-owned data.
- Keep `ecollecto-ai-service` responsible for:
  - prompt orchestration
  - provider integrations
  - embeddings and vector search
  - RAG flows
  - inference-heavy processing
- Use the API gateway as the bridge between the frontend and backend services.
- Add Circuit Breaker and Fallback patterns in the gateway or the calling backend boundary so AI failures do not affect the core stamp catalog.
- Communicate between services via HTTP/REST initially; add asynchronous messaging where it becomes necessary.
