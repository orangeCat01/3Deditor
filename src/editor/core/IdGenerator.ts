export class IdGenerator {
  private counts = new Map<string, number>();

  next(prefix: string): string {
    const nextValue = (this.counts.get(prefix) ?? 0) + 1;
    this.counts.set(prefix, nextValue);
    return `${prefix}_${nextValue.toString().padStart(4, '0')}`;
  }
}
