import { Page } from '@playwright/test';
import { SelfHealingPage } from './SelfHealingPage';
import { HealingEngine } from './HealingEngine';
import { HealingLog } from './HealingLog';
import { DataTestIdStrategy } from '../strategies/DataTestIdStrategy';
import { AriaLabelStrategy } from '../strategies/AriaLabelStrategy';
import { RoleStrategy } from '../strategies/RoleStrategy';
import { TextContentStrategy } from '../strategies/TextContentStrategy';
import { RelativePositionStrategy } from '../strategies/RelativePositionStrategy';

export function createSelfHealingPage(page: Page, log: HealingLog): SelfHealingPage {
  const engine = new HealingEngine([
    new DataTestIdStrategy(),
    new AriaLabelStrategy(),
    new RoleStrategy(),
    new TextContentStrategy(),
    new RelativePositionStrategy(),
  ]);
  return new SelfHealingPage(page, engine, log);
}
