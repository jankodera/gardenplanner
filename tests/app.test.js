import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const html = readFileSync(path.join(process.cwd(), 'index.html'), 'utf-8');
const sampleData = JSON.parse(readFileSync(path.join(process.cwd(), 'data-spec.json'), 'utf-8'));

const ctxStub = {
  save() {},
  restore() {},
  clearRect() {},
  translate() {},
  scale() {},
  rotate() {},
  beginPath() {},
  moveTo() {},
  lineTo() {},
  closePath() {},
  fill() {},
  stroke() {},
  fillRect() {},
  strokeRect() {},
  arc() {},
  fillText() {},
  setLineDash() {},
  createPattern() { return {}; },
  drawImage() {},
};

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

const buildDom = () => new Promise(resolve => {
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable',
    url: 'http://localhost/',
    pretendToBeVisual: true,
    beforeParse(window) {
      window.crypto = webcrypto;
      window.fetch = vi.fn(() => Promise.resolve({ json: () => Promise.resolve(JSON.parse(JSON.stringify(sampleData))) }));
      window.HTMLCanvasElement.prototype.getContext = () => ctxStub;
      window.HTMLCanvasElement.prototype.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 600 });
      window.HTMLCanvasElement.prototype.toBlob = function(callback) { callback(new Blob(['image'], { type: 'image/png' })); };
    },
  });
  dom.window.addEventListener('load', () => resolve(dom));
});

describe('Garden planner controls', () => {
  let dom;

  beforeEach(async () => {
    dom = await buildDom();
    dom.window.app.renderer.renderFrame = vi.fn();
  });

  afterEach(() => {
    dom?.window?.close();
  });

  it('loads the sample plan via the Load button', async () => {
    const { document, app } = dom.window;
    document.getElementById('btn-load').click();
    await flush();

    expect(app.plan.width).toBe(sampleData.scene.width);
    expect(app.plan.height).toBe(sampleData.scene.height);
    expect(app.plan.getObjects()).toHaveLength(3);
    expect(document.getElementById('status').textContent).toContain('Sample GDF plan loaded');
  });

  it('exports JSON when Export JSON is clicked', async () => {
    const { document, app } = dom.window;
    const downloadSpy = vi.fn();
    app.downloadBlob = downloadSpy;

    document.getElementById('btn-save').click();

    expect(downloadSpy).toHaveBeenCalledTimes(1);
    const blob = downloadSpy.mock.calls[0][0];
    const json = JSON.parse(await blob.text());
    expect(json.scene.width).toBe(app.plan.width);
    expect(downloadSpy.mock.calls[0][1]).toBe('garden-plan.gdf.json');
  });

  it('exports BOM CSV when Export BOM is clicked', async () => {
    const { document, app, AssetObject } = dom.window;
    const downloadSpy = vi.fn();
    app.downloadBlob = downloadSpy;
    app.plan.addObject(new AssetObject({ id: 'a1', catalogItemId: 'chair-001', position: { x: 0, y: 0 }, dimensions: { x: 1, y: 1 } }), 'objects');

    document.getElementById('btn-bom').click();

    expect(downloadSpy).toHaveBeenCalledTimes(1);
    const blob = downloadSpy.mock.calls[0][0];
    expect(downloadSpy.mock.calls[0][1]).toBe('bill-of-materials.csv');
    expect(await blob.text()).toContain('chair-001');
  });

  it('exports PNG when Download PNG is clicked', async () => {
    const { document, app } = dom.window;
    const downloadSpy = vi.fn();
    app.downloadBlob = downloadSpy;

    document.getElementById('btn-screenshot').click();
    expect(downloadSpy).toHaveBeenCalledTimes(1);

    const blobOrPromise = downloadSpy.mock.calls[0][0];
    const blob = blobOrPromise instanceof Promise ? await blobOrPromise : blobOrPromise;
    expect(downloadSpy.mock.calls[0][1]).toBe('garden-plan.png');
    expect(blob).toBeInstanceOf(Blob);
  });

  it('resets the scene when Reset is clicked', () => {
    const { document, app, AssetObject } = dom.window;
    app.plan.addObject(new AssetObject({ id: 'b1', catalogItemId: 'chair-001', position: { x: 0, y: 0 }, dimensions: { x: 1, y: 1 } }), 'objects');

    document.getElementById('btn-reset').click();

    expect(app.plan.getObjects()).toHaveLength(0);
    expect(document.getElementById('status').textContent).toContain('Scene reset');
  });
});
