import { Page } from '@playwright/test';

export class VehicleSelector {
  constructor(private page: Page) {}

  async selectVehicle(year: string, make: string, model: string) {
    await this.page.getByRole('combobox', { name: 'Year' }).selectOption(year);
    await this.page.getByRole('combobox', { name: 'Make' }).selectOption(make);
    await this.page.getByRole('combobox', { name: 'Model' }).selectOption(model);
  }

  async confirmVehicle() {
    await this.page.getByRole('button', { name: 'Confirm' }).click();
  }

  async validateVehicleFits() {
    const warning = this.page.locator('text=Does not fit');
    if ((await warning.count()) > 0) {
      console.warn('Warning: Vehicle does not fit this product!');
    }
  }
}
