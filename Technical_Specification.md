# Technická Specifikace: Garden Planner Application

## 1. Úvod
Cílem je vytvořit webovou aplikaci (SPA) pro navrhování zahrad, inspirovanou nástrojem Gardena myGarden. Aplikace využívá HTML5 Canvas pro renderování a React/Vue pro UI.

## 2. Klíčové komponenty

### 2.1 Canvas Rendering Engine
Jádro aplikace. Musí podporovat překreslování scény (60 FPS při interakci).
- **Z-Index System:** Nutné řadit objekty (tráva < dlažba < nábytek < stromy).
- **Viewport:** Třída zajišťující transformaci souřadnic. Musí přepočítávat `MouseEvents` (pixely) na `WorldCoordinates` (metry).

### 2.2 Asset Management
Aplikace pracuje s velkým množstvím grafiky.
- **Lazy Loading:** Ikony v menu se načítají hned, textury ve vysokém rozlišení pro plátno až při použití.
- **Caching:** `AssetLoader` drží reference na načtené `Image` objekty, aby se nestahovaly opakovaně.

### 2.3 Editační logika (Tools)
Aplikace funguje na bázi stavového automatu (State Machine) řízeného `ToolManagerem`.
- **Draw Tool:** Pro kreslení polygonů (trávník). Klik = nový bod, DblClick = uzavření tvaru.
- **Place Tool:** Drag & Drop z menu.
- **Select/Edit Tool:** Zobrazuje `TransformGizmo` (ovládací prvky) kolem aktivního objektu.

### 2.4 Smart Guides (Inteligentní kótování)
Při posunu objektu systém v reálném čase počítá vzdálenost `bounding boxu` objektu k nejbližším sousedům. Pokud je vzdálenost pod určitý práh (např. 5m), vykreslí se kótovací čára.

## 3. Data a Export

### 3.1 GDF Formát (JSON)
Interní formát pro ukládání. Viz soubor `data-spec.json`. Odděluje definici geometrie od vizuálních vlastností (textur).

### 3.2 Exportní strategie
- **Obrázek:** Canvas metoda `.toDataURL()` pro generování PNG/JPG.
- **Nákupní seznam:** Iterace přes seznam objektů v `GardenPlan`, seskupení podle `sku` (katalogové číslo) a export do CSV.
- **DXF (CAD):** Volitelný export pro profesionály. Knihovna pro převod JSON geometrie na DXF entity (LINE, CIRCLE).

## 4. Technologie
- **Frontend:** React / Vue / Svelte (pro UI menu)
- **Grafika:** HTML5 Canvas API (případně Konva.js nebo Fabric.js pro zjednodušení eventů, ale architektura výše popisuje "custom" řešení).
- **Backend:** Node.js / Python (pouze pro ukládání JSON blobů a poskytování statických assetů).
