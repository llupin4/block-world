interface MultiplayerMenuOptions {
  rememberedName(): string;
  navigate(url: string): void;
}

export class MultiplayerMenu {
  private readonly name: HTMLInputElement;
  private readonly code: HTMLInputElement;
  private readonly error: HTMLElement;

  constructor(
    document: Document,
    private readonly options: MultiplayerMenuOptions,
  ) {
    this.name = document.getElementById('mp-name') as HTMLInputElement;
    this.code = document.getElementById('mp-code') as HTMLInputElement;
    this.error = document.getElementById('mp-error')!;
    document.getElementById('mp-host')!.addEventListener('click', () => this.host());
    document.getElementById('mp-join')!.addEventListener('click', () => this.join());
  }

  open(): void {
    this.name.value = this.options.rememberedName();
    this.error.classList.add('hidden');
    this.name.focus();
  }

  private host(): void {
    this.options.navigate(`?host&name=${encodeURIComponent(this.name.value)}`);
  }

  private join(): void {
    const code = this.code.value.trim().toLowerCase();
    if (!code) {
      this.error.textContent = 'paste the room code the host shows';
      this.error.classList.remove('hidden');
      return;
    }
    this.options.navigate(
      `?join=${encodeURIComponent(code)}&name=${encodeURIComponent(this.name.value)}`,
    );
  }
}
