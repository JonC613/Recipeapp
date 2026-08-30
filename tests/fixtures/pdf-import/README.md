# PDF import fixtures

Automated PDF route tests use controlled byte payloads plus extractor and parser doubles, so they never
make a paid AI call. `single-recipe.pdf` is reserved for manual and browser acceptance coverage; it must
contain one text-based recipe. Image-only or password-protected inputs are represented by extractor
failure doubles.
