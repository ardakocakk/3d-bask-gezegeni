/**
 * Gelişmiş STL Parser & Slicer Simülatörü
 * 
 * Gerçek bir slicer'ın yaptığına yakın hesaplama:
 * - Signed volume → gerçek model iç hacmi (cm³)
 * - Yüzey alanı → duvar/tavan/taban plastiği (her zaman %100 dolu)
 * - Bounding box → boyut tespiti ve ölçekleme
 * 
 * FDM Gramaj Formülü (slicer benzeri):
 *   perimeter_vol  = surface_area × wall_thickness (2 duvar × 0.4mm)
 *   infill_vol     = (inner_vol) × infill_ratio
 *   top_bottom_vol = bbox_area × layer_height × top_bottom_layers
 *   total_vol      = perimeter_vol + infill_vol + top_bottom_vol
 *   gram           = total_vol × density
 */

// ── Temel geometri yardımcıları ─────────────────────────────────────────────

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function sub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function magnitude(v) {
  return Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
}

/** Üçgenin signed hacim katkısı (divergence theorem) */
function signedVolumeOfTriangle(p1, p2, p3) {
  return (
    p1[0] * (p2[1] * p3[2] - p2[2] * p3[1]) -
    p1[1] * (p2[0] * p3[2] - p2[2] * p3[0]) +
    p1[2] * (p2[0] * p3[1] - p2[1] * p3[0])
  ) / 6.0;
}

/** Üçgenin yüzey alanı (mm²) */
function triangleArea(p1, p2, p3) {
  const ab = sub(p2, p1);
  const ac = sub(p3, p1);
  return magnitude(cross(ab, ac)) / 2.0;
}

// ── STL Parse ───────────────────────────────────────────────────────────────

function isBinarySTL(buffer) {
  if (buffer.byteLength < 84) return false;
  const view = new DataView(buffer);
  const numTriangles = view.getUint32(80, true);
  const expectedSize = 84 + numTriangles * 50;
  // Boyut tam tutuyorsa binary
  if (buffer.byteLength === expectedSize) return true;
  // Header "solid " ile başlıyorsa ASCII
  const header = new Uint8Array(buffer, 0, 6);
  const headerStr = String.fromCharCode(...header);
  return !headerStr.startsWith('solid');
}

function parseBinarySTL(buffer) {
  const view = new DataView(buffer);
  const numTriangles = view.getUint32(80, true);
  const triangles = new Array(numTriangles);

  for (let i = 0; i < numTriangles; i++) {
    const off = 84 + i * 50;
    triangles[i] = [
      [view.getFloat32(off + 12, true), view.getFloat32(off + 16, true), view.getFloat32(off + 20, true)],
      [view.getFloat32(off + 24, true), view.getFloat32(off + 28, true), view.getFloat32(off + 32, true)],
      [view.getFloat32(off + 36, true), view.getFloat32(off + 40, true), view.getFloat32(off + 44, true)],
    ];
  }
  return triangles;
}

function parseAsciiSTL(text) {
  const triangles = [];
  const re = /vertex\s+([\d.eE+\-]+)\s+([\d.eE+\-]+)\s+([\d.eE+\-]+)/g;
  let verts = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    verts.push([parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])]);
    if (verts.length === 3) {
      triangles.push([verts[0], verts[1], verts[2]]);
      verts = [];
    }
  }
  return triangles;
}

// ── Ana Analiz Fonksiyonu ────────────────────────────────────────────────────

/**
 * STL buffer'ını analiz eder.
 * 
 * Döner:
 *   volumeCm3      – gerçek katı model hacmi (cm³)
 *   surfaceAreaCm2 – toplam yüzey alanı (cm²)
 *   boundingBoxMm  – { x, y, z } mm cinsinden
 *   triangleCount  – üçgen sayısı
 *   unitIsLikelyMm – birim tahmini (mm mi inch mi)
 */
export function parseSTLVolume(buffer) {
  if (!buffer || buffer.byteLength < 84) {
    throw new Error('Geçersiz STL dosyası.');
  }

  const triangles = isBinarySTL(buffer)
    ? parseBinarySTL(buffer)
    : parseAsciiSTL(new TextDecoder().decode(buffer));

  if (triangles.length === 0) {
    throw new Error('STL dosyasında üçgen bulunamadı.');
  }

  let volumeMm3 = 0;
  let surfaceAreaMm2 = 0;
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (const [p1, p2, p3] of triangles) {
    volumeMm3 += signedVolumeOfTriangle(p1, p2, p3);
    surfaceAreaMm2 += triangleArea(p1, p2, p3);

    for (const p of [p1, p2, p3]) {
      if (p[0] < minX) minX = p[0];
      if (p[1] < minY) minY = p[1];
      if (p[2] < minZ) minZ = p[2];
      if (p[0] > maxX) maxX = p[0];
      if (p[1] > maxY) maxY = p[1];
      if (p[2] > maxZ) maxZ = p[2];
    }
  }

  const bbX = maxX - minX;
  const bbY = maxY - minY;
  const bbZ = maxZ - minZ;
  const maxDim = Math.max(bbX, bbY, bbZ);

  // Birim tespiti: çoğu STL mm'dir ama bazıları inch (25.4 kat fark)
  // Eğer en büyük boyut 1000mm'den büyükse muhtemelen inch → mm'ye çevir
  const scaleFactor = maxDim > 1000 ? 25.4 : 1.0;

  const volumeCm3 = Math.abs(volumeMm3) * Math.pow(scaleFactor, 3) / 1000;
  const surfaceAreaCm2 = surfaceAreaMm2 * Math.pow(scaleFactor, 2) / 100;

  const boundingBoxMm = {
    x: bbX * scaleFactor,
    y: bbY * scaleFactor,
    z: bbZ * scaleFactor,
  };

  // ── Mesh Kalitesi ───────────────────────────────────────────────────────────
  const triCount = triangles.length;
  let qualityScore = 100;
  let qualityLabel = 'Mükemmel';
  if (triCount < 100) { qualityScore = 40; qualityLabel = 'Çok Düşük'; }
  else if (triCount < 500) { qualityScore = 60; qualityLabel = 'Düşük'; }
  else if (triCount < 2000) { qualityScore = 75; qualityLabel = 'Orta'; }
  else if (triCount < 10000) { qualityScore = 88; qualityLabel = 'İyi'; }
  else { qualityScore = 96; qualityLabel = 'Mükemmel'; }

  const meshQuality = { qualityScore, qualityLabel };

  // ── Overhang / Destek Analizi ────────────────────────────────────────────────
  const OVERHANG_THRESHOLD = -0.3; // Z bileşeni bu değerden küçükse overhang
  let overhangCount = 0;
  let overhangAreaMm2 = 0;

  for (const [p1, p2, p3] of triangles) {
    const ab = sub(p2, p1);
    const ac = sub(p3, p1);
    const n = cross(ab, ac);
    const len = magnitude(n);
    if (len === 0) continue;
    const nz = n[2] / len; // normalize Z bileşeni
    if (nz < OVERHANG_THRESHOLD) {
      overhangCount++;
      overhangAreaMm2 += triangleArea(p1, p2, p3);
    }
  }

  const overhangRatio = Math.round((overhangCount / triCount) * 100);
  const needsSupport = overhangRatio > 5;
  const supportAreaCm2 = Math.round(overhangAreaMm2 / 100 * 10) / 10;
  let supportComplexity = 'Hafif';
  if (overhangRatio > 30) supportComplexity = 'Ağır';
  else if (overhangRatio > 15) supportComplexity = 'Orta';

  const supports = { needsSupport, overhangRatio, overhangCount, supportAreaCm2, supportComplexity };

  // ── Önerilen Baskı Yönü ─────────────────────────────────────────────────────
  const dims = [
    { axis: 'X', size: boundingBoxMm.x },
    { axis: 'Y', size: boundingBoxMm.y },
    { axis: 'Z', size: boundingBoxMm.z },
  ];
  dims.sort((a, b) => a.size - b.size);
  const suggestedOrientation = `${dims[0].axis} ekseni yukarı (en düz yüzey tabana)`;

  return {
    volumeCm3,
    surfaceAreaCm2,
    boundingBoxMm,
    triangleCount: triCount,
    meshQuality,
    supports,
    suggestedOrientation,
  };
}

// ── Slicer Simülasyonu ───────────────────────────────────────────────────────

/**
 * Gerçek slicer'a yakın gramaj hesabı.
 * 
 * Parametreler:
 *   volumeCm3      – modelin katı hacmi
 *   surfaceAreaCm2 – modelin yüzey alanı
 *   boundingBoxMm  – bounding box
 *   targetMaxCm    – kullanıcının istediği en büyük kenar (cm)
 *   infillRatio    – 0.0–1.0
 *   nozzleDiamMm   – nozul çapı (varsayılan 0.4mm)
 *   layerHeightMm  – katman yüksekliği (varsayılan 0.2mm)
 *   wallCount      – duvar sayısı (varsayılan 2)
 *   topBottomLayers– tavan/taban katman sayısı (varsayılan 4)
 */
export function slicerEstimate({
  volumeCm3,
  surfaceAreaCm2,
  boundingBoxMm,
  supports,
  targetMaxCm,
  infillRatio,
  nozzleDiamMm = 0.4,
  layerHeightMm = 0.2,
  wallCount = 2,
  topBottomLayers = 4,
}) {
  const originalMaxMm = Math.max(boundingBoxMm.x, boundingBoxMm.y, boundingBoxMm.z);
  const targetMaxMm = targetMaxCm * 10;
  const scale = targetMaxMm / originalMaxMm;

  // Ölçeklenmiş değerler
  const scaledVolumeCm3 = volumeCm3 * Math.pow(scale, 3);
  const scaledSurfaceAreaCm2 = surfaceAreaCm2 * Math.pow(scale, 2);
  const scaledBB = {
    x: boundingBoxMm.x * scale,
    y: boundingBoxMm.y * scale,
    z: boundingBoxMm.z * scale,
  };

  // ── Duvar (perimeter) hacmi ──────────────────────────────────
  // Her duvar = extrusion_width ≈ nozzle_diam
  // Yüzey alanı × duvar kalınlığı
  const wallThicknessCm = (nozzleDiamMm * wallCount) / 10;
  const perimeterVolCm3 = scaledSurfaceAreaCm2 * wallThicknessCm;

  // ── Tavan / Taban hacmi ──────────────────────────────────────
  // XY kesit alanı = bounding box X×Y (yaklaşık ortalama kesit)
  // Gerçekte modelin kesit alanı değişir; ortalama = hacim / yükseklik
  const heightCm = scaledBB.z / 10;
  const avgCrossSectionCm2 = heightCm > 0 ? scaledVolumeCm3 / heightCm : 0;
  const topBottomThicknessCm = (topBottomLayers * layerHeightMm) / 10;
  const topBottomVolCm3 = avgCrossSectionCm2 * topBottomThicknessCm * 2; // tavan + taban

  // ── İç hacim (infill) ────────────────────────────────────────
  // Duvar ve tavan/taban haricindeki iç hacim
  const shellVolCm3 = perimeterVolCm3 + topBottomVolCm3;
  const innerVolCm3 = Math.max(0, scaledVolumeCm3 - shellVolCm3);
  const infillVolCm3 = innerVolCm3 * infillRatio;

  // Toplam plastik hacmi
  const totalPlasticCm3 = Math.min(
    perimeterVolCm3 + topBottomVolCm3 + infillVolCm3,
    scaledVolumeCm3 // hiçbir zaman modelin kendisinden fazla olamaz
  );

  // Destek materyali tahmini (supports varsa bounding box'un ~%8'i kadar)
  const supportVolCm3 = supports?.needsSupport
    ? Math.round(scaledVolumeCm3 * (supports.overhangRatio / 100) * 0.15 * 100) / 100
    : 0;

  return {
    scaledVolumeCm3: Math.round(scaledVolumeCm3 * 10) / 10,
    perimeterVolCm3: Math.round(perimeterVolCm3 * 100) / 100,
    infillVolCm3: Math.round(infillVolCm3 * 100) / 100,
    topBottomVolCm3: Math.round(topBottomVolCm3 * 100) / 100,
    totalPlasticCm3: Math.round(totalPlasticCm3 * 100) / 100,
    supportVolCm3,
    scaledBB,
    scale,
  };
}