const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const rootDir = path.resolve(__dirname, '..', '..');
const outputDir = path.join(rootDir, 'outputs', 'e2e');
const fixturePath = path.join(rootDir, 'tests', 'fixtures', 'minimal-node.gltf');
const browserPath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function clickMenuItem(page, menuText, itemText) {
  await page.getByText(menuText, { exact: true }).click();
  await page.getByRole('button', { name: itemText, exact: true }).click();
}

async function setInputValue(input, value) {
  await input.click();
  await input.fill(String(value));
  await input.press('Tab');
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    executablePath: browserPath
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 920 } });
  const consoleErrors = [];
  const failedResponses = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('response', (response) => {
    if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) {
      failedResponses.push(`${response.status()} ${response.url()}`);
    }
  });
  page.setDefaultTimeout(10000);

  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
  await page.waitForSelector('.dock-workspace');
  await page.screenshot({ path: path.join(outputDir, '01-home.png'), fullPage: true });

  await clickMenuItem(page, '对象', '创建对象');
  await page.locator('.entity-name').first().click();
  await page.locator('.dock-right .component-section').first().waitFor();

  const inspector = page.locator('.dock-right .dock-body');
  const transformSection = inspector.locator('.component-section').filter({ hasText: '变换' }).first();
  await setInputValue(transformSection.locator('input[type="number"]').first(), 2);

  const materialSection = inspector.locator('.component-section').filter({ hasText: '材质' }).first();
  await setInputValue(materialSection.locator('input').first(), '#ff5533');

  await page.screenshot({ path: path.join(outputDir, '02-inspector-edit.png'), fullPage: true });

  await page.locator('.workspace-switcher button').filter({ hasText: '材质' }).click();
  await page.locator('.workspace-switcher button').filter({ hasText: '动画' }).click();
  await page.locator('.language-button').click();
  await page.waitForSelector('.menu-bar');
  await page.screenshot({ path: path.join(outputDir, '03-language-workspace.png'), fullPage: true });

  await page.locator('.workspace-switcher button').filter({ hasText: 'Modeling' }).click();
  await page.getByRole('button', { name: 'Assets', exact: true }).click();
  const gltfInput = page.locator('.asset-actions input[type="file"]').first();
  await gltfInput.setInputFiles(fixturePath);
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Scene', exact: true }).click();

  const downloadPromise = page.waitForEvent('download');
  await clickMenuItem(page, 'File', 'Export');
  const download = await downloadPromise;
  const exportPath = path.join(outputDir, 'scene.web3d.json');
  await download.saveAs(exportPath);

  await clickMenuItem(page, 'Run', 'Play');
  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  await page.screenshot({ path: path.join(outputDir, '04-runtime-export.png'), fullPage: true });

  const exportedScene = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
  const importedScenePresent = Object.keys(exportedScene.entities).some((id) => id.startsWith('gltf_entity_'));
  const importedAssetPresent = Object.values(exportedScene.assets).some((asset) => asset && asset.name === 'minimal-node.gltf');

  const summary = {
    importedScenePresent,
    importedAssetPresent,
    consoleErrors: consoleErrors.filter((message) => !message.includes('favicon') && !message.includes('Failed to load resource')),
    failedResponses,
    screenshots: [
      path.join(outputDir, '01-home.png'),
      path.join(outputDir, '02-inspector-edit.png'),
      path.join(outputDir, '03-language-workspace.png'),
      path.join(outputDir, '04-runtime-export.png')
    ],
    exportFile: exportPath
  };

  fs.writeFileSync(path.join(outputDir, 'summary.json'), JSON.stringify(summary, null, 2));
  await browser.close();
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
