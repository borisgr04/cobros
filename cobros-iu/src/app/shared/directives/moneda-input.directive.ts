import { Directive, ElementRef, HostBinding, HostListener, OnInit, effect, model } from '@angular/core';

@Directive({
  selector: 'input[appMoneda]',
  standalone: true,
})
export class MonedaInputDirective implements OnInit {
  appMoneda = model<number>(0);

  @HostBinding('attr.inputmode') inputmode = 'numeric';

  private formatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });

  constructor(private el: ElementRef<HTMLInputElement>) {}

  ngOnInit(): void {
    this.el.nativeElement.type = 'text';
    this.el.nativeElement.autocomplete = 'off';
    effect(() => {
      const v = this.appMoneda();
      if (document.activeElement !== this.el.nativeElement) {
        this.el.nativeElement.value = v > 0 ? this.formatter.format(v) : '';
      }
    });
  }

  @HostListener('focus')
  onFocus(): void {
    const v = this.appMoneda();
    this.el.nativeElement.value = v > 0 ? String(v) : '';
    setTimeout(() => this.el.nativeElement.select(), 0);
  }

  @HostListener('blur')
  onBlur(): void {
    const raw = this.el.nativeElement.value;
    const num = this.parse(raw);
    this.appMoneda.set(num);
    this.el.nativeElement.value = num > 0 ? this.formatter.format(num) : '';
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = this.el.nativeElement;
    const raw = input.value;
    const num = this.parse(raw);
    this.appMoneda.set(num);
    if (raw.length > 0) {
      const formatted = num > 0 ? this.formatter.format(num) : '';
      input.value = formatted;
      setTimeout(() => {
        input.setSelectionRange(input.value.length, input.value.length);
      }, 0);
    }
  }

  private parse(raw: string): number {
    const cleaned = raw.replace(/[^0-9]/g, '');
    const n = parseInt(cleaned, 10);
    return isNaN(n) || n < 0 ? 0 : n;
  }
}
