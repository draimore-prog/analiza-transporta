const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processIcon() {
  const inputPath = "C:\\Users\\silvio.suljic\\.gemini\\antigravity-ide\\brain\\bf5972bd-9a1e-4eac-a198-f6018c976e4f\\.user_uploaded\\media_1789139658270.jpg";
  
  const image = sharp(inputPath);
  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  
  const { width, height, channels } = info;
  const visited = new Uint8Array(width * height);
  const queue = [];

  function addPixel(x, y) {
    const idx = y * width + x;
    if (visited[idx]) return;
    const offset = idx * channels;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];

    // Check if it's outer dark/black background
    if (r < 40 && g < 40 && b < 40) {
      visited[idx] = 1;
      queue.push(idx);
    }
  }

  // Add perimeter
  for (let x = 0; x < width; x++) {
    addPixel(x, 0);
    addPixel(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    addPixel(0, y);
    addPixel(width - 1, y);
  }

  // 8-way BFS flood fill
  const dx = [1, -1, 0, 0, 1, -1, 1, -1];
  const dy = [0, 0, 1, -1, 1, 1, -1, -1];

  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    const cx = curr % width;
    const cy = Math.floor(curr / width);

    for (let i = 0; i < 8; i++) {
      const nx = cx + dx[i];
      const ny = cy + dy[i];
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        addPixel(nx, ny);
      }
    }
  }

  // Set alpha to 0 for all flood-filled outer black pixels
  for (let i = 0; i < width * height; i++) {
    if (visited[i]) {
      data[i * channels + 3] = 0; // Transparent
    }
  }

  // Create processed buffer
  const processedBuffer = await sharp(data, {
    raw: {
      width,
      height,
      channels
    }
  })
    .trim() // Tightly trim transparent edges
    .toFormat('png')
    .toBuffer();

  const targetPaths = [
    path.join(__dirname, '..', 'public', 'icon.png'),
    path.join(__dirname, '..', 'public', 'favicon.png'),
    path.join(__dirname, '..', 'src', 'app', 'icon.png'),
    path.join(__dirname, '..', 'servis-mobilna-app', 'assets', 'icon.png'),
    path.join(__dirname, '..', 'servis-mobilna-app', 'assets', 'android-icon-foreground.png'),
    path.join(__dirname, '..', 'servis-mobilna-app', 'assets', 'splash-icon.png'),
    path.join(__dirname, '..', 'servis-mobilna-app', 'assets', 'favicon.png')
  ];

  for (const target of targetPaths) {
    fs.writeFileSync(target, processedBuffer);
    console.log(`Saved: ${target}`);
  }

  console.log('Final transparent icon processed and distributed successfully.');
}

processIcon().catch(console.error);
