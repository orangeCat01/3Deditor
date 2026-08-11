export interface InstanceRegistration {
  id: string;
  geometryId: string;
  materialId: string;
  count: number;
}

export class InstanceManager {
  private readonly registrations = new Map<string, InstanceRegistration>();

  register(id: string, geometryId: string, materialId: string, count: number): void {
    this.registrations.set(id, { id, geometryId, materialId, count });
  }

  get(id: string): InstanceRegistration | undefined {
    const registration = this.registrations.get(id);
    return registration ? { ...registration } : undefined;
  }
}
