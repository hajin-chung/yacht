export type RAPIER = typeof import("@dimforge/rapier3d-compat");
export let rapier: RAPIER

export async function initRapier() {
  rapier = await import("@dimforge/rapier3d-compat");
  await rapier.init();
}
