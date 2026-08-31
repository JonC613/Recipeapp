# Research: TheMealDB Browse and Import

## Decisions

- Use only documented TheMealDB JSON API endpoints: categories, areas, filter by category/area, search by
  meal name, and lookup by meal identifier.
- Make every API request in the Cloudflare Worker. This keeps provider mechanics outside browser code and
  permits consistent bounds and safe error messages.
- Treat browse/search/detail data as transient. A D1 import record is created only through the explicit
  import route in the later review/save slice.
- Map measurements and ingredients deterministically into `originalText`; do not infer units, quantities,
  instructions, or missing fields.
- Use the provider's documented personal/development access for this owner-only MVP. Before any public or
  multi-user use, reassess key, rate-limit, attribution, and storage terms with the owner.

## Sources

- [TheMealDB API Guide](https://www.themealdb.com/docs_api_guide.php)
- [TheMealDB Terms of Use](https://www.themealdb.com/terms_of_use.php)
