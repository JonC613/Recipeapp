# Manual Checks

1. Open **Add Recipe** and choose **Image or screenshot**.
2. Select one JPEG, PNG, WebP, or HEIC file smaller than 10 MiB. Confirm the filename and preview or
   fallback appear, plus the AI-credit notice. Do not select **Extract recipe** yet.
3. Reload or leave the page: confirm no recipe was added. Reopen the retained import only through its safe
   application route; no R2 URL should appear.
4. Select **Extract recipe** once. Confirm progress appears and a valid source opens the existing review
   form. A second click must not make a second provider request.
5. Edit one review field, save, and confirm one recipe appears with an image source label. Verify the
   original import is still separate from the edited saved recipe.
6. Try an oversized, wrong-type, and renamed/spoofed file. Each must be rejected before an AI call.
