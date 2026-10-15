// Curated subset only; raw 77-file downloads remain outside the production app.
export const libraryClipDefinitions={
 DeskIdle:{file:'Seated Idle With Hands On A Table.fbx',purpose:'table idle',runtime:true},
 SitToType:{file:'Sit To Type (Sitting To Typing).fbx',purpose:'enter typing',runtime:true},
 TypeToSit:{file:'Type To Sit.fbx',purpose:'finish typing',runtime:true},
 Mouse:{file:'Typing With Mouse Move.fbx',purpose:'authored typing and mouse sequence',runtime:true},
 WalkCandidate:{file:'Walking (preferred 2 male).fbx',purpose:'selected corporate walk',runtime:true},
} as const;
export type LibraryClipName=keyof typeof libraryClipDefinitions;
