# AZRE Virtual Headquarters

Local visual redesign based on the supplied luxury office floor-plan and company logos. Business integration is deferred: no live CRM data, task execution, outbound messages, approvals, or company record writes are connected.

## Run

Use Node.js 22.12+ and npm. Run `npm install`, then `npm run dev -- --host 127.0.0.1`. Open http://127.0.0.1:3000. `npm run lint` checks TypeScript and `npm run build` creates the static production build.

## Visual scope

- Central reception and lounge; rear CEO office.
- Acquisitions on the left, Dispositions upper right, Operations lower right.
- Exactly one idle AI avatar and workstation per department.
- Expanded conference suite occupies the full lower-left wing, with a wall TV and ten inward-facing chairs.
- Cream stone, procedural black-marble texture, walnut ceiling slats, brass details, glass partitions and warm lighting.
- Default free-roam entry, overview and room cameras; pointer orbit/zoom; workstation selection; arrow-key free roam (Up/Down walk, Left/Right turn, Escape opens the floor overview); ceiling and shadow controls; reference viewer with Escape dismissal.
- Supplied emblem and dark-lettered wordmark are loaded from `public/brand`. The original white-lettered asset is retained for later preparation but is not currently placed on dark surfaces because its background is opaque.

`LuxuryOffice.tsx` owns geometry, reusable materials, camera and resource cleanup. `App.tsx` owns the visual navigation interface. Older demo panels remain in the source for reference but are not mounted in the active application.

## Limitations

This is a first native-geometry implementation, not a photorealistic recreation. Plants, people, skyline and furniture are stylized; TV content is a branded standby display. True polished-floor reflections, detailed purchased/modelled furniture, baked lighting, full walk/collision navigation and high-end avatar rigs are not implemented. Logos retain their supplied image treatment. No licensed external asset purchases were made.

Source imported from EchoAIOnline/AZRE_Business_Game commit 1346948eaf916524100ebbee29bed7a4ea8a31f9. Changes are local and have not been deployed or pushed to GitHub.

## Free roam

Arrow keys work immediately on entry. Select **Free roam · Arrow keys** to return from other views. Up and Down walk forward/backward; Left and Right turn. Free roam is the default entry view; Escape opens the floor overview. Switching modes resets held keys, and blur, background tabs, and the reference dialog pause movement. Movement uses elapsed time and a fixed 1.7-unit eye height. The camera is constrained to the outer floor boundary; interior wall/furniture collision is not implemented. Mouse orbit and workstation clicks are disabled while roaming; room buttons remain available.

Reception-side plants removed. Suite doors have full-height black frames, glass leaves at 90° open, brass pulls and visible hinges.

## Latest visual revisions

Acquisitions and Dispositions doors are hinged from the opposite jamb and remain open into the suite. All department signs are thin lobby-facing plaques. Entrance double doors include glass leaves, perimeter frames, transom, handles, hinges and closer housings. In free roam, hold the left mouse button and drag to look horizontally and vertically; arrow movement remains horizontal at fixed eye height. Mouse capture ends on release, cancellation, mode changes or focus loss.

Lobby revision: central bay widened from 11 to 19 scene units (about 73 percent). Side suites moved outward without scaling furniture; lounge seating, rug, ceiling, exterior shell, camera presets and free-roam bounds adjusted.

CEO suite revision: new rear wing spans the full 36-unit office width, behind the department rear line at z=-14, with a 13-unit depth to z=-27. Floor, roof, windows, backdrop, lighting, furnishings, overview and free-roam limits extended accordingly.
