const upload = document.getElementById('upload');
const canvas = document.getElementById('canvas');
const result = document.getElementById('result');
const downloadBtn = document.getElementById('downloadBtn');
const info = document.getElementById('info');

function toDecimal(coord, ref) {
  const degrees = coord[0].numerator / coord[0].denominator;
  const minutes = coord[1].numerator / coord[1].denominator;
  const seconds = coord[2].numerator / coord[2].denominator;
  let decimal = degrees + minutes / 60 + seconds / 3600;
  if (ref === "S" || ref === "W") decimal *= -1;
  return decimal;
}

async function getLocation(lat, lon) {
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
  const data = await response.json();
  return data.display_name || "Location not available";
}

upload.addEventListener('change', async function () {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = async function () {
      EXIF.getData(img, async function () {
        const date = EXIF.getTag(this, "DateTimeOriginal") || "Date not available";
        const lat = EXIF.getTag(this, "GPSLatitude");
        const lon = EXIF.getTag(this, "GPSLongitude");
        const latRef = EXIF.getTag(this, "GPSLatitudeRef");
        const lonRef = EXIF.getTag(this, "GPSLongitudeRef");

        let locationText = "Location not available";
        if (lat && lon && latRef && lonRef) {
          const latitude = toDecimal(lat, latRef);
          const longitude = toDecimal(lon, lonRef);
          locationText = await getLocation(latitude, longitude);
        }

        let latitudeText = "Latitude: tidak tersedia";
        let longitudeText = "Longitude: tidak tersedia";
        if (lat && lon && latRef && lonRef) {
          const latitude = toDecimal(lat, latRef);
          const longitude = toDecimal(lon, lonRef);
          latitudeText = `Latitude: ${latitude.toFixed(6)}`;
          longitudeText = `Longitude: ${longitude.toFixed(6)}`;
        }
        info.innerHTML = `
          <strong>Timestamp:</strong> ${date}<br>
          <strong>${latitudeText}</strong><br>
          <strong>${longitudeText}</strong>
        `;

        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        ctx.font = "28px Arial";
        ctx.fillStyle = "yellow";

        // Cetak Latitude & Longitude di foto
        let latlonText = "Latitude: tidak tersedia, Longitude: tidak tersedia";
        if (lat && lon && latRef && lonRef) {
          const latitude = toDecimal(lat, latRef);
          const longitude = toDecimal(lon, lonRef);
          latlonText = `Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`;
          ctx.fillText(latlonText, 20, img.height - 90);
        }

        // Cetak waktu dan lokasi seperti sebelumnya
        ctx.fillText(date, 20, img.height - 60);
        ctx.fillText(locationText, 20, img.height - 30);
        
        const dataURL = canvas.toDataURL("image/jpeg");
        result.src = dataURL;
        downloadBtn.href = dataURL;
        downloadBtn.style.display = "inline-block";
      });
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

/**
 * Membagi teks menjadi beberapa baris agar tidak melebihi maxWidth
 */
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

/**
 * Contoh penggunaan saat menggambar overlay di canvas
 */
function drawOverlayText(ctx, text, position, fontSize, fontFamily, fontColor, canvasWidth, canvasHeight) {
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = fontColor;
  ctx.textBaseline = 'top';

  // Padding dari tepi gambar
  const padding = 16;
  const maxWidth = canvasWidth - 2 * padding;
  const lineHeight = fontSize * 1.3;

  // Tentukan posisi X dan Y awal sesuai pilihan user
  let x = padding, y = padding;
  if (position.includes('bottom')) y = canvasHeight - padding - lineHeight; // akan disesuaikan di bawah
  if (position.includes('center')) x = canvasWidth / 2;
}

/**
 * Ketika menggambar teks di canvas, gunakan pengaturan ini:
 */
function getTextSettings() {
  const position = document.getElementById('textPosition').value;
  const showTimestamp = document.getElementById('showTimestamp').value === 'yes';
  const timestampFormat = document.getElementById('timestampFormat').value;
  let fontFamily = document.getElementById('fontFamily').value;
  if (fontFamily === 'custom') fontFamily = document.getElementById('customFont').value || 'Arial';
  const fontSize = parseInt(document.getElementById('fontSize').value, 10) || 22;
  let fontColor = document.getElementById('fontColor').value;
  if (fontColor === 'custom') fontColor = document.getElementById('customColor').value || '#000000';
  return { position, showTimestamp, timestampFormat, fontFamily, fontSize, fontColor };
}

document.getElementById('fontFamily').addEventListener('change', function() {
  document.getElementById('customFont').classList.toggle('hidden', this.value !== 'custom');
});
document.getElementById('fontColor').addEventListener('change', function() {
  document.getElementById('customColor').classList.toggle('hidden', this.value !== 'custom');
});