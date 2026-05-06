/**
 * STL dosyasını parse edip gerçek mesh hacmini (cm³) hesaplar.
 * Signed volume (divergence theorem) yöntemi kullanılır.
 * Binary ve ASCII STL desteklenir.
 * STL birimleri genellikle mm'dir → cm³'e çevirmek için /1000
 */

function signedVolumeOfTriangle(p1, p2, p3) {
  return (
    (p1[0] * (p2[1] * p3[2] - p2[2] * p3[1]) -
     p1[1] * (p2[0] * p3[2] - p2[2] * p3[0]) +
     p1[2] * (p2[0] * p3[1] - p2[1] * p3[0])) / 6.0
  );
}

function parseBinarySTL(buffer) {
  const view = new DataView(buffer);
  const numTriangles = view.getUint32(80, true);
  const triangles = [];

  for (let i = 0; i < numTriangles; i++) {
    const offset = 84 + i * 50;
    // skip normal (12 bytes), read 3 vertices (9 floats)
    const p1 = [
      view.getFloat32(offset + 12, true),
      view.getFloat32(offset + 16, true),
      view.getFloat32(offset + 20, true),
    ];
    const p2 = [
      view.getFloat32(offset + 24, true),
      view.getFloat32(offset + 28, true),
      view.getFloat32(offset + 32, true),
    ];
    const p3 = [
      view.getFloat32(offset + 36, true),
      view.getFloat32(offset + 40, true),
      view.getFloat32(offset + 44, true),
    ];
    triangles.push([p1, p2, p3]);
  }
  return triangles;
}

function parseAsciiSTL(text) {
  const triangles = [];
  const vertexRegex = /vertex\s+([\d.eE+\-]+)\s+([\d.eE+\-]+)\s+([\d.eE+\-]+)/g;
  let vertices = [];
  let match;

  while ((match = vertexRegex.exec(text)) !== null) {
    vertices.push([parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3])]);
    if (vertices.length === 3) {
      triangles.push([vertices[0], vertices[1], vertices[2]]);
      vertices = [];
    }
  }
  return triangles;
}

function isBinarySTL(buffer) {
  // ASCII STL starts with "solid"
  const header = new Uint8Array(buffer, 0, 5);
  const text = String.fromCharCode(...header);
  if (text !== 'solid') return true;

  // But some binary files also start with "solid" — check size consistency
  const view = new DataView(buffer);
  const numTriangles = view.getUint32(80, true);
  const expectedSize = 84 + numTriangles * 50;
  return buffer.byteLength === expectedSize;
}

/**
 * Returns { volumeCm3, boundingBoxMm: {x, y, z} }
 */
export function parseSTLVolume(buffer) {
  let triangles;

  if (isBinarySTL(buffer)) {
    triangles = parseBinarySTL(buffer);
  } else {
    const text = new TextDecoder().decode(buffer);
    triangles = parseAsciiSTL(text);
  }

  if (triangles.length === 0) {
    throw new Error('STL dosyasında üçgen bulunamadı.');
  }

  // Hacim hesabı (mm³)
  let volumeMm3 = 0;
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (const [p1, p2, p3] of triangles) {
    volumeMm3 += signedVolumeOfTriangle(p1, p2, p3);
    for (const p of [p1, p2, p3]) {
      if (p[0] < minX) minX = p[0];
      if (p[1] < minY) minY = p[1];
      if (p[2] < minZ) minZ = p[2];
      if (p[0] > maxX) maxX = p[0];
      if (p[1] > maxY) maxY = p[1];
      if (p[2] > maxZ) maxZ = p[2];
    }
  }

  const volumeCm3 = Math.abs(volumeMm3) / 1000; // mm³ → cm³

  const boundingBoxMm = {
    x: maxX - minX,
    y: maxY - minY,
    z: maxZ - minZ,
  };

  return { volumeCm3, boundingBoxMm };
}