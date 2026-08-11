export class RuntimeClock {
  currentTime = 0;
  deltaTime = 0;
  elapsedTime = 0;
  playSpeed = 1;
  paused = true;

  play(): void {
    this.paused = false;
  }

  pause(): void {
    this.paused = true;
    this.deltaTime = 0;
  }

  reset(): void {
    this.currentTime = 0;
    this.deltaTime = 0;
    this.elapsedTime = 0;
    this.paused = true;
  }

  update(deltaMs: number): void {
    if (this.paused) {
      this.deltaTime = 0;
      return;
    }
    this.deltaTime = deltaMs * this.playSpeed;
    this.currentTime += this.deltaTime;
    this.elapsedTime += this.deltaTime;
  }
}
