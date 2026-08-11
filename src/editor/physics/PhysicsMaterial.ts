export interface PhysicsMaterial {
  id: string;
  name: string;
  friction: number;
  restitution: number;
}

export function createDefaultPhysicsMaterial(): PhysicsMaterial {
  return { id: 'default_physics_material', name: 'Default Physics Material', friction: 0.5, restitution: 0.1 };
}
