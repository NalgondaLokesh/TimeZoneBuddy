const API_KEY = '	JN3ZTOE9RTGY';  // 🔁 Replace with your TimeZoneDB API key

function addField() {
  const div = document.getElementById("moreFields");
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Enter another city";
  input.required = true;
  div.appendChild(input);
}

document.getElementById("timezoneForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const inputs = Array.from(document.querySelectorAll("input")).map(i => i.value.trim());
  const results = document.getElementById("results");
  results.innerHTML = "Calculating...";

  try {
    const utcRanges = [];

    for (const city of inputs) {
      const geo = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${city}`);
      const geoData = await geo.json();
      if (!geoData.length) throw new Error(`City not found: ${city}`);
      
      const lat = geoData[0].lat;
      const lon = geoData[0].lon;

      const tzRes = await fetch(`https://api.timezonedb.com/v2.1/get-time-zone?key=${API_KEY}&format=json&by=position&lat=${lat}&lng=${lon}`);
      const tzData = await tzRes.json();
      if (tzData.status !== 'OK') throw new Error(`Timezone fetch failed for ${city}`);

      const gmtOffset = tzData.gmtOffset; // in seconds
      const startUTC = 9 * 3600 - gmtOffset;
      const endUTC = 20 * 3600 - gmtOffset;

      utcRanges.push({
        city,
        gmtOffset,
        localStart: 9,
        localEnd: 20,
        utcStart: startUTC,
        utcEnd: endUTC
      });
    }

    const latestStart = Math.max(...utcRanges.map(r => r.utcStart));
    const earliestEnd = Math.min(...utcRanges.map(r => r.utcEnd));

    if (latestStart >= earliestEnd) {
      results.innerHTML = "<p>No common time slot between 9 AM and 8 PM in all time zones.</p>";
      return;
    }

    const suggestedUTC = latestStart;

    let html = "<h3>Suggested Meeting Time</h3><ul>";
    for (const r of utcRanges) {
      const localTime = new Date((suggestedUTC + r.gmtOffset) * 1000);
      const hours = localTime.getUTCHours().toString().padStart(2, '0');
      const minutes = localTime.getUTCMinutes().toString().padStart(2, '0');
      html += `<li>${r.city}: ${hours}:${minutes}</li>`;
    }
    html += "</ul>";
    results.innerHTML = html;

  } catch (err) {
    results.innerHTML = `Error: ${err.message}`;
  }
});
