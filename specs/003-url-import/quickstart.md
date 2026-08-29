# Quickstart: Validate URL Recipe Import

Run the existing local prerequisites and migration command, then execute the Worker, integration,
component, and browser suites. Use controlled HTML fixtures; never make acceptance tests depend on
third-party recipe sites.

Expected journeys: a supported fixture yields a ready unsaved draft with preserved source fields; an
invalid, disallowed, non-recipe, or unavailable fixture gives a safe recovery outcome; no journey
creates a library recipe. Verify UI at 320, 768, and 1440 CSS pixels.

Validation completed locally on 2026-08-29: the URL-submit ready-draft and unavailable-page recovery
journeys passed at 320, 768, and 1440 CSS pixels with no horizontal page overflow.
