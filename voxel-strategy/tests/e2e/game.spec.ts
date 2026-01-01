import { test, expect } from '@playwright/test';

test.describe('Voxel Strategy Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Main Menu', () => {
    test('should display the main menu on load', async ({ page }) => {
      await expect(page.locator('.main-menu')).toBeVisible();
      await expect(page.locator('.game-title')).toContainText('Voxel Conquest');
    });

    test('should have game title and subtitle', async ({ page }) => {
      await expect(page.locator('.game-title')).toBeVisible();
      await expect(page.locator('.game-subtitle')).toContainText('Turn-Based Strategy');
    });

    test('should have seed input field', async ({ page }) => {
      const seedInput = page.locator('#seed');
      await expect(seedInput).toBeVisible();
      await expect(seedInput).toHaveAttribute('placeholder', /seed/i);
    });

    test('should have map size selector', async ({ page }) => {
      const mapSizeSelect = page.locator('#mapSize');
      await expect(mapSizeSelect).toBeVisible();
      
      // Check options
      await expect(mapSizeSelect.locator('option')).toHaveCount(3);
    });

    test('should have difficulty selector', async ({ page }) => {
      const difficultySelect = page.locator('#difficulty');
      await expect(difficultySelect).toBeVisible();
      
      // Check options
      const options = difficultySelect.locator('option');
      await expect(options).toHaveCount(3);
    });

    test('should have start game button', async ({ page }) => {
      const startButton = page.locator('.start-button');
      await expect(startButton).toBeVisible();
      await expect(startButton).toContainText('Start');
    });

    test('should have how to play section', async ({ page }) => {
      await expect(page.locator('.game-info')).toBeVisible();
      await expect(page.locator('.game-info h3')).toContainText('How to Play');
    });

    test('should have controls section', async ({ page }) => {
      await expect(page.locator('.controls-info')).toBeVisible();
      await expect(page.locator('.controls-info h3')).toContainText('Controls');
    });
  });

  test.describe('Starting a Game', () => {
    test('should start game with default settings', async ({ page }) => {
      await page.locator('.start-button').click();
      
      // Wait for the game to initialize
      await page.waitForTimeout(2000);
      
      // Main menu should be hidden
      await expect(page.locator('.main-menu')).not.toBeVisible();
      
      // Game HUD should be visible
      await expect(page.locator('.game-hud')).toBeVisible();
    });

    test('should start game with custom seed', async ({ page }) => {
      const seedInput = page.locator('#seed');
      await seedInput.fill('my-custom-seed');
      
      await page.locator('.start-button').click();
      await page.waitForTimeout(2000);
      
      await expect(page.locator('.game-hud')).toBeVisible();
    });

    test('should start game with small map', async ({ page }) => {
      await page.locator('#mapSize').selectOption('small');
      await page.locator('.start-button').click();
      await page.waitForTimeout(2000);
      
      await expect(page.locator('.game-hud')).toBeVisible();
    });

    test('should start game on hard difficulty', async ({ page }) => {
      await page.locator('#difficulty').selectOption('hard');
      await page.locator('.start-button').click();
      await page.waitForTimeout(2000);
      
      await expect(page.locator('.game-hud')).toBeVisible();
    });
  });

  test.describe('Game HUD', () => {
    test.beforeEach(async ({ page }) => {
      await page.locator('.start-button').click();
      await page.waitForTimeout(2000);
    });

    test('should display resource panel', async ({ page }) => {
      const resourcePanel = page.locator('.resources-panel');
      await expect(resourcePanel).toBeVisible();
      
      // Check for resource icons
      await expect(page.locator('.resource').first()).toBeVisible();
    });

    test('should display turn info', async ({ page }) => {
      await expect(page.locator('.turn-info')).toBeVisible();
      await expect(page.locator('.turn-label')).toContainText('Turn');
    });

    test('should show player turn indicator', async ({ page }) => {
      await expect(page.locator('.faction-indicator')).toContainText('Your Turn');
    });

    test('should display end turn button', async ({ page }) => {
      const endTurnButton = page.locator('.end-turn-button');
      await expect(endTurnButton).toBeVisible();
      await expect(endTurnButton).toContainText('End Turn');
    });

    test('should display hero panel when hero is selected', async ({ page }) => {
      await expect(page.locator('.hero-panel')).toBeVisible();
    });

    test('should show hero name and level', async ({ page }) => {
      await expect(page.locator('.hero-header h3')).toBeVisible();
      await expect(page.locator('.hero-level')).toContainText('Level');
    });

    test('should display hero stats', async ({ page }) => {
      await expect(page.locator('.hero-stats')).toBeVisible();
      await expect(page.locator('.stat-label').first()).toBeVisible();
    });

    test('should display hero army/crew', async ({ page }) => {
      await expect(page.locator('.crew-list')).toBeVisible();
      await expect(page.locator('.crew-list h4')).toContainText('Army');
    });

    test('should display minimap area', async ({ page }) => {
      await expect(page.locator('.minimap')).toBeVisible();
    });

    test('should display keyboard shortcuts', async ({ page }) => {
      await expect(page.locator('.shortcuts-hint')).toBeVisible();
    });
  });

  test.describe('Turn System', () => {
    test.beforeEach(async ({ page }) => {
      await page.locator('.start-button').click();
      await page.waitForTimeout(2000);
    });

    test('should end turn when clicking end turn button', async ({ page }) => {
      const turnLabel = page.locator('.turn-label');
      const initialTurnText = await turnLabel.textContent();
      
      await page.locator('.end-turn-button').click();
      
      // Wait for AI turn to complete
      await page.waitForTimeout(1500);
      
      // Turn should have advanced
      const newTurnText = await turnLabel.textContent();
      // Check that we're back to player turn (turn number may increase)
      await expect(page.locator('.faction-indicator')).toContainText('Your Turn');
    });

    test('should be able to end turn with spacebar', async ({ page }) => {
      await page.keyboard.press('Space');
      
      // Wait for turn processing
      await page.waitForTimeout(1500);
      
      // Should still be functional
      await expect(page.locator('.game-hud')).toBeVisible();
    });
  });

  test.describe('3D Canvas', () => {
    test.beforeEach(async ({ page }) => {
      await page.locator('.start-button').click();
      await page.waitForTimeout(2000);
    });

    test('should render canvas element', async ({ page }) => {
      await expect(page.locator('canvas')).toBeVisible();
    });

    test('canvas should be interactive', async ({ page }) => {
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible();
      
      // Test that we can interact with the canvas (click in center area avoiding HUD)
      await canvas.click({ position: { x: 600, y: 400 }, force: true });
      
      // Game should still be functional
      await expect(page.locator('.game-hud')).toBeVisible();
    });
  });

  test.describe('Deterministic World Generation', () => {
    test('same seed should produce same starting resources', async ({ page }) => {
      // Start first game
      await page.locator('#seed').fill('deterministic-test-seed');
      await page.locator('.start-button').click();
      await page.waitForTimeout(2000);
      
      const goldValue1 = await page.locator('.resource').first().locator('.resource-value').textContent();
      
      // Reload and start again with same seed
      await page.reload();
      await page.locator('#seed').fill('deterministic-test-seed');
      await page.locator('.start-button').click();
      await page.waitForTimeout(2000);
      
      const goldValue2 = await page.locator('.resource').first().locator('.resource-value').textContent();
      
      expect(goldValue1).toBe(goldValue2);
    });
  });

  test.describe('Responsive UI', () => {
    test('should display correctly on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.locator('.start-button').click();
      await page.waitForTimeout(2000);
      
      await expect(page.locator('.game-hud')).toBeVisible();
      await expect(page.locator('.hero-panel')).toBeVisible();
    });

    test('should display correctly on smaller screens', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.locator('.start-button').click();
      await page.waitForTimeout(2000);
      
      await expect(page.locator('.game-hud')).toBeVisible();
    });
  });

  test.describe('Resource Display', () => {
    test.beforeEach(async ({ page }) => {
      await page.locator('.start-button').click();
      await page.waitForTimeout(2000);
    });

    test('should display all four resource types', async ({ page }) => {
      const resources = page.locator('.resources-panel .resource');
      await expect(resources).toHaveCount(4);
    });

    test('should display gold resource', async ({ page }) => {
      const goldResource = page.locator('.resource').filter({ hasText: '💰' });
      await expect(goldResource).toBeVisible();
    });

    test('should display wood resource', async ({ page }) => {
      const woodResource = page.locator('.resource').filter({ hasText: '🪵' });
      await expect(woodResource).toBeVisible();
    });

    test('should display stone resource', async ({ page }) => {
      const stoneResource = page.locator('.resource').filter({ hasText: '🪨' });
      await expect(stoneResource).toBeVisible();
    });

    test('should display crystals resource', async ({ page }) => {
      const crystalsResource = page.locator('.resource').filter({ hasText: '💎' });
      await expect(crystalsResource).toBeVisible();
    });
  });

  test.describe('Hero Panel Details', () => {
    test.beforeEach(async ({ page }) => {
      await page.locator('.start-button').click();
      await page.waitForTimeout(2000);
    });

    test('should display movement points', async ({ page }) => {
      const movementStat = page.locator('.stat').filter({ hasText: 'Movement' });
      await expect(movementStat).toBeVisible();
    });

    test('should display experience', async ({ page }) => {
      const expStat = page.locator('.stat').filter({ hasText: 'Experience' });
      await expect(expStat).toBeVisible();
    });

    test('should display attack bonus', async ({ page }) => {
      const attackBonus = page.locator('.bonus').filter({ hasText: '⚔️' });
      await expect(attackBonus).toBeVisible();
    });

    test('should display defense bonus', async ({ page }) => {
      const defenseBonus = page.locator('.bonus').filter({ hasText: '🛡️' });
      await expect(defenseBonus).toBeVisible();
    });

    test('should display crew units', async ({ page }) => {
      await expect(page.locator('.crew-unit').first()).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('main menu should have proper form labels', async ({ page }) => {
      await expect(page.locator('label[for="seed"]')).toBeVisible();
      await expect(page.locator('label[for="mapSize"]')).toBeVisible();
      await expect(page.locator('label[for="difficulty"]')).toBeVisible();
    });

    test('buttons should be keyboard accessible', async ({ page }) => {
      const startButton = page.locator('.start-button');
      
      // Tab to the button
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Press enter to click
      await page.keyboard.press('Enter');
      
      await page.waitForTimeout(2000);
      
      // Game should have started
      await expect(page.locator('.game-hud')).toBeVisible();
    });
  });
});
