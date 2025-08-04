const upload = document.getElementById('upload');
const canvas = document.getElementById('canvas');
const result = document.getElementById('result');
const downloadBtn = document.getElementById('downloadBtn');

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

        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        ctx.font = "28px Arial";
        ctx.fillStyle = "yellow";
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