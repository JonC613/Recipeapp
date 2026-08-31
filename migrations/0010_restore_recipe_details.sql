-- Repair only the nine approved recipes whose child rows were removed by the
-- 0009 parent-table rebuild. Values come from their immutable approved-import
-- snapshots; recipe titles, notes, timestamps, sources, and newer recipes are untouched.

INSERT INTO recipe_ingredients (id, recipe_id, position, original_text, quantity, quantity_text, unit, ingredient, preparation, optional)
SELECT lower(hex(randomblob(16))), ri.approved_recipe_id, CAST(item.key AS INTEGER),
  json_extract(item.value, '$.originalText'), json_extract(item.value, '$.quantity'),
  json_extract(item.value, '$.quantityText'), json_extract(item.value, '$.unit'),
  json_extract(item.value, '$.ingredient'), json_extract(item.value, '$.preparation'),
  COALESCE(json_extract(item.value, '$.optional'), 0)
FROM recipe_imports ri
JOIN recipes r ON r.id = ri.approved_recipe_id
JOIN json_each(ri.parsed_recipe_json, '$.ingredients') item
WHERE ri.approved_recipe_id IN (
  '59e1e54c-3c10-4a68-85f0-12707649eb61', 'f1643508-4a12-4088-8ab2-6ece38a80eeb',
  'a2921eb8-3c91-4021-8ec0-0a12fd5a3fc1', '290eb4e8-a05e-40a3-9b0d-07d74f0bc592',
  'd98ac3ef-1385-4f30-8ad4-f59737821f90', '1168d54c-045b-4432-affc-ff0ea705039d',
  '7710c3b3-3fbb-49f6-acd1-fc18727b11cb', '707c2b37-0e0d-4a36-ad04-d08ee11413cc',
  '5bb1e3c8-5c78-4b69-bfd6-165cef11b25a'
);

INSERT INTO recipe_instructions (id, recipe_id, step_number, text)
SELECT lower(hex(randomblob(16))), ri.approved_recipe_id, CAST(step.key AS INTEGER) + 1,
  json_extract(step.value, '$.text')
FROM recipe_imports ri
JOIN recipes r ON r.id = ri.approved_recipe_id
JOIN json_each(ri.parsed_recipe_json, '$.instructions') step
WHERE ri.approved_recipe_id IN (
  '59e1e54c-3c10-4a68-85f0-12707649eb61', 'f1643508-4a12-4088-8ab2-6ece38a80eeb',
  'a2921eb8-3c91-4021-8ec0-0a12fd5a3fc1', '290eb4e8-a05e-40a3-9b0d-07d74f0bc592',
  'd98ac3ef-1385-4f30-8ad4-f59737821f90', '1168d54c-045b-4432-affc-ff0ea705039d',
  '7710c3b3-3fbb-49f6-acd1-fc18727b11cb', '707c2b37-0e0d-4a36-ad04-d08ee11413cc',
  '5bb1e3c8-5c78-4b69-bfd6-165cef11b25a'
);

INSERT INTO recipe_tags (recipe_id, tag)
SELECT ri.approved_recipe_id, CAST(tag.value AS TEXT)
FROM recipe_imports ri
JOIN recipes r ON r.id = ri.approved_recipe_id
JOIN json_each(ri.parsed_recipe_json, '$.tags') tag
WHERE ri.approved_recipe_id IN (
  '59e1e54c-3c10-4a68-85f0-12707649eb61', 'f1643508-4a12-4088-8ab2-6ece38a80eeb',
  'a2921eb8-3c91-4021-8ec0-0a12fd5a3fc1', '290eb4e8-a05e-40a3-9b0d-07d74f0bc592',
  'd98ac3ef-1385-4f30-8ad4-f59737821f90', '1168d54c-045b-4432-affc-ff0ea705039d',
  '7710c3b3-3fbb-49f6-acd1-fc18727b11cb', '707c2b37-0e0d-4a36-ad04-d08ee11413cc',
  '5bb1e3c8-5c78-4b69-bfd6-165cef11b25a'
);
