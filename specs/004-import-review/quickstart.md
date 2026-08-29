# Quickstart: Validate Import Review and Save

Run local migrations and the usual component, Worker, integration, and browser suites. Use a controlled
ready URL import fixture; do not rely on a third-party site for acceptance tests.

Expected journeys:

1. Open a ready draft, save it unchanged, and verify one normal recipe appears while the import source
   and extraction snapshot remain unchanged.
2. Edit title, metadata, ingredients, and instructions; save and verify only the approved recipe has
   those edits.
3. Cancel review and verify no recipe appears while the import remains retrievable.
4. Attempt missing, failed, non-ready, invalid, and duplicate approval paths; verify safe recovery and
   no extra recipe.

Verify review, validation, save, cancel, and recovery at 320, 768, and 1440 CSS pixels with no
horizontal page overflow.

Validation completed locally on 2026-08-29: review/save, edited approval, cancel, and recovery
journeys passed at 320, 768, and 1440 CSS pixels with no horizontal page overflow.
