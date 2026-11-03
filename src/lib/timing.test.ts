import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseTimelineScript } from "./timing.ts";

describe("parseTimelineScript", () => {
  it("parses the rigid transcript format and preserves scene timing", () => {
    const result = parseTimelineScript(`
* Scene 1 [00:00 - 00:05]
  * Spoken VO: "Pembuka"
  * Visual Anchor: Esa duduk di kamar.
* Scene 2 [00:05 - 00:08]
  * Spoken VO: "Lanjutan"
  * Visual Anchor: Close-up layar HP.
`);

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(result.scenes, [
      { start: 0, end: 5 },
      { start: 5, end: 8 },
    ]);
    assert.equal(result.count, 2);
    assert.equal(result.lastEnd, 8);
  });

  it("rejects missing scene numbers instead of silently misaligning images", () => {
    const result = parseTimelineScript(`
* Scene 1 [00:00 - 00:05]
* Scene 3 [00:05 - 00:08]
`);

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.match(result.error, /Scene 2/);
  });
});
