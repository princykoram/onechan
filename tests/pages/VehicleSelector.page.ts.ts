import { Page, Locator } from '@playwright/test';

export class VehicleSelector {
  readonly year: Locator;
  readonly make: Locator;
  readonly model: Locator;
  readonly engine: Locator;
  readonly confirmBtn: Locator;

  constructor(private page: Page) {
    this.year = page.locator('[data-testid="vehicle-year"]');
    this.make = page.locator('[data-testid="vehicle-make"]');
    this.model = page.locator('[data-testid="vehicle-model"]');
    this.engine = page.locator('[data-testid="vehicle-engine"]');
    this.confirmBtn = page.locator('[data-testid="confirm-vehicle"]');
  }

  async selectVehicle(year: string, make: string, model: string, engine: string) {
    await this.year.selectOption(year);
    await this.make.selectOption(make);
    await this.model.selectOption(model);
    await this.engine.selectOption(engine);
    await this.confirmBtn.click();
  }
}
