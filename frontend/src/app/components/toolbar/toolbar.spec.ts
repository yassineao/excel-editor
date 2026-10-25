import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Toolbar } from './toolbar';

describe('Toolbar', () => {
  let component: Toolbar;
  let fixture: ComponentFixture<Toolbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Toolbar],
    }).compileComponents();

    fixture = TestBed.createComponent(Toolbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  for (const eventName of ['input', 'change']) {
    it(`recognizes a file on ${eventName} and enables importing it`, async () => {
      const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="file"]');
      const button: HTMLButtonElement = fixture.nativeElement.querySelector('dialog button:last-child');
      const file = new File(['workbook'], 'report.xlsx');
      const imported: File[] = [];
      component.importSelected.subscribe(value => imported.push(value));

      expect(button.disabled).toBe(true);
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      input.dispatchEvent(new Event(eventName, { bubbles: true }));
      await fixture.whenStable();

      expect(button.disabled).toBe(false);
      expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('report.xlsx');
      // jsdom does not implement native dialog methods.
      fixture.nativeElement.querySelector('dialog').close = () => {};
      button.click();
      expect(imported).toEqual([file]);

      Object.defineProperty(input, 'files', { value: [] });
      input.dispatchEvent(new Event(eventName, { bubbles: true }));
      await fixture.whenStable();
      expect(button.disabled).toBe(true);
      expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('Keine Datei');
    });
  }
});
