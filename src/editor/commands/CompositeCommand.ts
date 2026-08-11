import type { Command } from './Command';

export class CompositeCommand implements Command {
  constructor(readonly name: string, private readonly commands: Command[]) {}

  execute(): void {
    this.commands.forEach((command) => command.execute());
  }

  undo(): void {
    [...this.commands].reverse().forEach((command) => command.undo());
  }

  redo(): void {
    this.execute();
  }
}
