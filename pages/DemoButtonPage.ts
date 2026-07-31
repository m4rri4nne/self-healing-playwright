import { Page, Locator } from '@playwright/test';
import { SelfHealingPage } from '../src/core/SelfHealingPage';

// self-contained page standing in for a real app under test
export class DemoButtonPage {
  private readonly brokenSubmitId = '#wrong-submit-id';

  constructor(private readonly page: Page, private readonly shPage: SelfHealingPage) {}

  async render() {
    await this.page.setContent(`<button aria-label="Submit Form">Send</button>`);
  }

  // "wrong" selector — this id does not exist on the page
  async locateSubmitButton(): Promise<Locator> {
    return this.shPage.locate(this.brokenSubmitId, { labelHint: 'Submit Form' });
  }
}
