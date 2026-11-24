
## Server-rendered product card (scripts/postbuild.cjs)
- Product card head/JSON-LD/body rules exist twice: TS (src/utils/seo/productMeta.ts, generateProductSchema.ts, productPricing.ts, productImageAlt.ts) and PHP in scripts/postbuild.cjs. Change both and run `bun scripts/check-ssr-parity.ts` against `php -S` on dist — why: bots without JS read the PHP version.
- Inside the postbuild JS template literal avoid `${` and double every backslash — why: the PHP block is a JS template string.
