function analyzeAltitude(altitudeM) {
  let score = 0;
  let rating = "not_suitable";
  let explanation = "";
  let explanationNe = "";
  if (altitudeM >= 1500 && altitudeM <= 3e3) {
    score = 95;
    rating = "excellent";
    explanation = `Altitude of ${altitudeM}m is ideal for potato cultivation. Cool temperatures at this elevation reduce disease pressure and produce high-quality tubers with excellent starch content.`;
    explanationNe = `${altitudeM}\u092E\u093F \u0909\u091A\u093E\u0907 \u0906\u0932\u0941 \u0916\u0947\u0924\u0940\u0915\u094B \u0932\u093E\u0917\u093F \u0906\u0926\u0930\u094D\u0936 \u091B\u0964 \u092F\u0938 \u0909\u091A\u093E\u0907\u092E\u093E \u091A\u093F\u0938\u094B \u0924\u093E\u092A\u092E\u093E\u0928\u0932\u0947 \u0930\u094B\u0917\u0915\u094B \u0926\u092C\u093E\u0935 \u0915\u092E \u0917\u0930\u094D\u091B \u0930 \u0909\u0924\u094D\u0915\u0943\u0937\u094D\u091F \u0938\u094D\u091F\u093E\u0930\u094D\u091A \u0938\u093E\u092E\u0917\u094D\u0930\u0940\u0938\u0939\u093F\u0924 \u0909\u091A\u094D\u091A \u0917\u0941\u0923\u0938\u094D\u0924\u0930\u0915\u093E \u0915\u0928\u094D\u0926\u0939\u0930\u0942 \u0909\u0924\u094D\u092A\u093E\u0926\u0928 \u0917\u0930\u094D\u091B\u0964`;
  } else if (altitudeM >= 800 && altitudeM < 1500) {
    score = 78;
    rating = "good";
    explanation = `Altitude of ${altitudeM}m is suitable for potato growing. Slightly warmer than optimal, but good yields are achievable with proper variety selection and irrigation management.`;
    explanationNe = `${altitudeM}\u092E\u093F \u0909\u091A\u093E\u0907 \u0906\u0932\u0941 \u0916\u0947\u0924\u0940\u0915\u094B \u0932\u093E\u0917\u093F \u0909\u092A\u092F\u0941\u0915\u094D\u0924 \u091B\u0964 \u0907\u0937\u094D\u091F\u0924\u092E \u092D\u0928\u094D\u0926\u093E \u0925\u094B\u0930\u0948 \u0928\u094D\u092F\u093E\u0928\u094B, \u0924\u0930 \u0909\u091A\u093F\u0924 \u0915\u093F\u0938\u094D\u092E \u091A\u092F\u0928 \u0930 \u0938\u093F\u0901\u091A\u093E\u0907 \u0935\u094D\u092F\u0935\u0938\u094D\u0925\u093E\u092A\u0928\u0932\u0947 \u0930\u093E\u092E\u094D\u0930\u094B \u0909\u092A\u091C \u092A\u094D\u0930\u093E\u092A\u094D\u0924 \u0917\u0930\u094D\u0928 \u0938\u0915\u093F\u0928\u094D\u091B\u0964`;
  } else if (altitudeM >= 3e3 && altitudeM <= 4e3) {
    score = 65;
    rating = "moderate";
    explanation = `Altitude of ${altitudeM}m is marginal for potato cultivation. Short growing seasons and frost risk require cold-tolerant varieties and careful timing.`;
    explanationNe = `${altitudeM}\u092E\u093F \u0909\u091A\u093E\u0907 \u0906\u0932\u0941 \u0916\u0947\u0924\u0940\u0915\u094B \u0932\u093E\u0917\u093F \u0938\u0940\u092E\u093E\u0928\u094D\u0924 \u091B\u0964 \u091B\u094B\u091F\u094B \u0909\u0924\u094D\u092A\u093E\u0926\u0928 \u092E\u094C\u0938\u092E \u0930 \u0939\u093F\u092E\u092A\u093E\u0924\u0915\u094B \u091C\u094B\u0916\u093F\u092E\u0932\u0947 \u091A\u093F\u0938\u094B-\u0938\u0939\u093F\u0937\u094D\u0923\u0941 \u0915\u093F\u0938\u094D\u092E\u0939\u0930\u0942 \u0930 \u0938\u093E\u0935\u0927\u093E\u0928\u0940\u092A\u0942\u0930\u094D\u0935\u0915 \u0938\u092E\u092F \u091A\u093E\u0939\u093F\u0928\u094D\u091B\u0964`;
  } else if (altitudeM >= 300 && altitudeM < 800) {
    score = 50;
    rating = "moderate";
    explanation = `Altitude of ${altitudeM}m is marginal. Heat stress and higher disease pressure at lower elevations reduce yield potential. Heat-tolerant varieties and cool-season planting are recommended.`;
    explanationNe = `${altitudeM}\u092E\u093F \u0909\u091A\u093E\u0907 \u0938\u0940\u092E\u093E\u0928\u094D\u0924 \u091B\u0964 \u0915\u092E \u0909\u091A\u093E\u0907\u092E\u093E \u0917\u0930\u094D\u092E\u0940\u0915\u094B \u0924\u0928\u093E\u0935 \u0930 \u092C\u0922\u0940 \u0930\u094B\u0917\u0915\u094B \u0926\u092C\u093E\u0935\u0932\u0947 \u0909\u092A\u091C \u0915\u094D\u0937\u092E\u0924\u093E \u0918\u091F\u093E\u0909\u0901\u091B\u0964 \u0917\u0930\u094D\u092E\u0940-\u0938\u0939\u093F\u0937\u094D\u0923\u0941 \u0915\u093F\u0938\u094D\u092E\u0939\u0930\u0942 \u0930 \u091A\u093F\u0938\u094B-\u092E\u094C\u0938\u092E \u0930\u094B\u092A\u093E\u0907\u0915\u094B \u0938\u093F\u092B\u093E\u0930\u093F\u0938 \u0917\u0930\u093F\u0928\u094D\u091B\u0964`;
  } else if (altitudeM > 4e3) {
    score = 30;
    rating = "poor";
    explanation = `Altitude of ${altitudeM}m is too high for reliable potato production. Extreme cold, short growing seasons, and frost risk severely limit cultivation.`;
    explanationNe = `${altitudeM}\u092E\u093F \u0909\u091A\u093E\u0907 \u092D\u0930\u092A\u0930\u094D\u0926\u094B \u0906\u0932\u0941 \u0909\u0924\u094D\u092A\u093E\u0926\u0928\u0915\u094B \u0932\u093E\u0917\u093F \u0927\u0947\u0930\u0948 \u0909\u091A\u094D\u091A \u091B\u0964 \u0905\u0924\u094D\u092F\u0927\u093F\u0915 \u091A\u093F\u0938\u094B, \u091B\u094B\u091F\u094B \u0909\u0924\u094D\u092A\u093E\u0926\u0928 \u092E\u094C\u0938\u092E, \u0930 \u0939\u093F\u092E\u092A\u093E\u0924\u0915\u094B \u091C\u094B\u0916\u093F\u092E\u0932\u0947 \u0916\u0947\u0924\u0940\u0932\u093E\u0908 \u0917\u092E\u094D\u092D\u0940\u0930 \u0930\u0942\u092A\u092E\u093E \u0938\u0940\u092E\u093F\u0924 \u0917\u0930\u094D\u091B\u0964`;
  } else {
    score = 20;
    rating = "not_suitable";
    explanation = `Altitude of ${altitudeM}m (below 300m) is generally not suitable for potato cultivation due to excessive heat and humidity, which promote disease and reduce tuber quality.`;
    explanationNe = `${altitudeM}\u092E\u093F \u0909\u091A\u093E\u0907 (\u0969\u0966\u0966 \u092E\u093F \u092D\u0928\u094D\u0926\u093E \u0915\u092E) \u0938\u093E\u092E\u093E\u0928\u094D\u092F\u0924\u0903 \u0906\u0932\u0941 \u0916\u0947\u0924\u0940\u0915\u094B \u0932\u093E\u0917\u093F \u0909\u092A\u092F\u0941\u0915\u094D\u0924 \u091B\u0948\u0928 \u0915\u093F\u0928\u092D\u0928\u0947 \u0905\u0924\u094D\u092F\u0927\u093F\u0915 \u0917\u0930\u094D\u092E\u0940 \u0930 \u0906\u0930\u094D\u0926\u094D\u0930\u0924\u093E\u0932\u0947 \u0930\u094B\u0917 \u092C\u0922\u093E\u0935\u093E \u0926\u093F\u0928\u094D\u091B \u0930 \u0915\u0928\u094D\u0926\u0915\u094B \u0917\u0941\u0923\u0938\u094D\u0924\u0930 \u0918\u091F\u093E\u0909\u0901\u091B\u0964`;
  }
  return {
    name: "Altitude",
    nameNe: "\u0909\u091A\u093E\u0907",
    value: `${altitudeM.toFixed(0)}m`,
    valueNe: `${altitudeM.toFixed(0)}\u092E\u093F`,
    score,
    rating,
    explanation,
    explanationNe,
    icon: "\u26F0\uFE0F"
  };
}
function analyzeLatitude(lat) {
  const absLat = Math.abs(lat);
  let score = 0;
  let rating = "not_suitable";
  let explanation = "";
  let explanationNe = "";
  let zone = "";
  let zoneNe = "";
  if (absLat >= 20 && absLat <= 60) {
    score = 85;
    rating = "good";
    zone = "Temperate";
    zoneNe = "\u0938\u092E\u0936\u0940\u0924\u094B\u0937\u094D\u0923";
    explanation = "Temperate climate zone is well-suited for potato cultivation with distinct seasons enabling proper dormancy and tuber development.";
    explanationNe = "\u0938\u092E\u0936\u0940\u0924\u094B\u0937\u094D\u0923 \u091C\u0932\u0935\u093E\u092F\u0941 \u0915\u094D\u0937\u0947\u0924\u094D\u0930 \u0906\u0932\u0941 \u0916\u0947\u0924\u0940\u0915\u094B \u0932\u093E\u0917\u093F \u0909\u092A\u092F\u0941\u0915\u094D\u0924 \u091B \u091C\u0938\u092E\u093E \u0909\u091A\u093F\u0924 \u0938\u0941\u0937\u0941\u092A\u094D\u0924\u0924\u093E \u0930 \u0915\u0928\u094D\u0926 \u0935\u093F\u0915\u093E\u0938\u0915\u094B \u0932\u093E\u0917\u093F \u0938\u094D\u092A\u0937\u094D\u091F \u092E\u094C\u0938\u092E\u0939\u0930\u0942 \u091B\u0928\u094D\u0964";
  } else if (absLat >= 10 && absLat < 20) {
    score = 60;
    rating = "moderate";
    zone = "Subtropical";
    zoneNe = "\u0909\u092A\u094B\u0937\u094D\u0923\u0915\u091F\u093F\u092C\u0902\u0927\u0940\u092F";
    explanation = "Subtropical zone can support potato cultivation at higher altitudes during cooler months. Heat-tolerant varieties and careful seasonal timing are essential.";
    explanationNe = "\u0909\u092A\u094B\u0937\u094D\u0923\u0915\u091F\u093F\u092C\u0902\u0927\u0940\u092F \u0915\u094D\u0937\u0947\u0924\u094D\u0930\u0932\u0947 \u091A\u093F\u0938\u094B \u092E\u0939\u093F\u0928\u093E\u0939\u0930\u0942\u092E\u093E \u0909\u091A\u094D\u091A \u0909\u091A\u093E\u0907\u092E\u093E \u0906\u0932\u0941 \u0916\u0947\u0924\u0940\u0932\u093E\u0908 \u0938\u092E\u0930\u094D\u0925\u0928 \u0917\u0930\u094D\u0928 \u0938\u0915\u094D\u091B\u0964 \u0917\u0930\u094D\u092E\u0940-\u0938\u0939\u093F\u0937\u094D\u0923\u0941 \u0915\u093F\u0938\u094D\u092E\u0939\u0930\u0942 \u0930 \u0938\u093E\u0935\u0927\u093E\u0928\u0940\u092A\u0942\u0930\u094D\u0935\u0915 \u092E\u094C\u0938\u092E\u0940 \u0938\u092E\u092F \u0906\u0935\u0936\u094D\u092F\u0915 \u091B\u0964";
  } else if (absLat < 10) {
    score = 35;
    rating = "poor";
    zone = "Tropical";
    zoneNe = "\u0909\u0937\u094D\u0923\u0915\u091F\u093F\u092C\u0902\u0927\u0940\u092F";
    explanation = "Tropical zone is generally challenging for potato cultivation due to high temperatures and humidity. Only possible at high altitudes (>1500m) with specialized varieties.";
    explanationNe = "\u0909\u0937\u094D\u0923\u0915\u091F\u093F\u092C\u0902\u0927\u0940\u092F \u0915\u094D\u0937\u0947\u0924\u094D\u0930 \u0909\u091A\u094D\u091A \u0924\u093E\u092A\u092E\u093E\u0928 \u0930 \u0906\u0930\u094D\u0926\u094D\u0930\u0924\u093E\u0915\u093E \u0915\u093E\u0930\u0923 \u0906\u0932\u0941 \u0916\u0947\u0924\u0940\u0915\u094B \u0932\u093E\u0917\u093F \u0938\u093E\u092E\u093E\u0928\u094D\u092F\u0924\u0903 \u091A\u0941\u0928\u094C\u0924\u0940\u092A\u0942\u0930\u094D\u0923 \u091B\u0964 \u0935\u093F\u0936\u0947\u0937 \u0915\u093F\u0938\u094D\u092E\u0939\u0930\u0942\u0938\u0939\u093F\u0924 \u0909\u091A\u094D\u091A \u0909\u091A\u093E\u0907 (>\u0967\u096B\u0966\u0966 \u092E\u093F) \u092E\u093E \u092E\u093E\u0924\u094D\u0930 \u0938\u092E\u094D\u092D\u0935 \u091B\u0964";
  } else {
    score = 70;
    rating = "good";
    zone = "Cool Temperate";
    zoneNe = "\u091A\u093F\u0938\u094B \u0938\u092E\u0936\u0940\u0924\u094B\u0937\u094D\u0923";
    explanation = "Cool temperate zone provides excellent conditions for potato cultivation with natural cold periods for dormancy and reduced disease pressure.";
    explanationNe = "\u091A\u093F\u0938\u094B \u0938\u092E\u0936\u0940\u0924\u094B\u0937\u094D\u0923 \u0915\u094D\u0937\u0947\u0924\u094D\u0930\u0932\u0947 \u0938\u0941\u0937\u0941\u092A\u094D\u0924\u0924\u093E\u0915\u094B \u0932\u093E\u0917\u093F \u092A\u094D\u0930\u093E\u0915\u0943\u0924\u093F\u0915 \u091A\u093F\u0938\u094B \u0905\u0935\u0927\u093F \u0930 \u0915\u092E \u0930\u094B\u0917\u0915\u094B \u0926\u092C\u093E\u0935\u0938\u0939\u093F\u0924 \u0906\u0932\u0941 \u0916\u0947\u0924\u0940\u0915\u094B \u0932\u093E\u0917\u093F \u0909\u0924\u094D\u0915\u0943\u0937\u094D\u091F \u0905\u0935\u0938\u094D\u0925\u093E \u092A\u094D\u0930\u0926\u093E\u0928 \u0917\u0930\u094D\u091B\u0964";
  }
  return {
    name: "Climate Zone",
    nameNe: "\u091C\u0932\u0935\u093E\u092F\u0941 \u0915\u094D\u0937\u0947\u0924\u094D\u0930",
    value: zone,
    valueNe: zoneNe,
    score,
    rating,
    explanation,
    explanationNe,
    icon: "\u{1F30D}"
  };
}
function estimateTemperature(lat, altitudeM) {
  const absLat = Math.abs(lat);
  let baseTemp = 30 - absLat * 0.4;
  const altitudeCorrection = altitudeM / 1e3 * 6.5;
  const tempC = Math.round(baseTemp - altitudeCorrection);
  let label = "";
  let labelNe = "";
  if (tempC < 5) {
    label = `~${tempC}\xB0C (Very Cold)`;
    labelNe = `~${tempC}\xB0\u0938\u0947 (\u0927\u0947\u0930\u0948 \u091A\u093F\u0938\u094B)`;
  } else if (tempC < 10) {
    label = `~${tempC}\xB0C (Cold)`;
    labelNe = `~${tempC}\xB0\u0938\u0947 (\u091A\u093F\u0938\u094B)`;
  } else if (tempC < 18) {
    label = `~${tempC}\xB0C (Cool \u2014 Ideal)`;
    labelNe = `~${tempC}\xB0\u0938\u0947 (\u091A\u093F\u0938\u094B \u2014 \u0906\u0926\u0930\u094D\u0936)`;
  } else if (tempC < 25) {
    label = `~${tempC}\xB0C (Warm)`;
    labelNe = `~${tempC}\xB0\u0938\u0947 (\u0928\u094D\u092F\u093E\u0928\u094B)`;
  } else {
    label = `~${tempC}\xB0C (Hot)`;
    labelNe = `~${tempC}\xB0\u0938\u0947 (\u0917\u0930\u094D\u092E)`;
  }
  return { tempC, label, labelNe };
}
function analyzeTemperature(tempC) {
  let score = 0;
  let rating = "not_suitable";
  let explanation = "";
  let explanationNe = "";
  if (tempC >= 10 && tempC <= 20) {
    score = 95;
    rating = "excellent";
    explanation = `Estimated temperature of ${tempC}\xB0C is optimal for potato growth. Potatoes thrive between 10-20\xB0C with cool nights promoting starch accumulation in tubers.`;
    explanationNe = `\u0905\u0928\u0941\u092E\u093E\u0928\u093F\u0924 \u0924\u093E\u092A\u092E\u093E\u0928 ${tempC}\xB0\u0938\u0947 \u0906\u0932\u0941\u0915\u094B \u0935\u0943\u0926\u094D\u0927\u093F\u0915\u094B \u0932\u093E\u0917\u093F \u0907\u0937\u094D\u091F\u0924\u092E \u091B\u0964 \u0906\u0932\u0941 \u0967\u0966-\u0968\u0966\xB0\u0938\u0947 \u092C\u0940\u091A \u0930\u093E\u092E\u094D\u0930\u094B\u0938\u0901\u0917 \u092C\u0922\u094D\u091B \u0930 \u091A\u093F\u0938\u094B \u0930\u093E\u0924\u0939\u0930\u0942\u0932\u0947 \u0915\u0928\u094D\u0926\u092E\u093E \u0938\u094D\u091F\u093E\u0930\u094D\u091A \u0938\u0902\u091A\u092F\u0932\u093E\u0908 \u092C\u0922\u093E\u0935\u093E \u0926\u093F\u0928\u094D\u091B\u0964`;
  } else if (tempC >= 7 && tempC < 10) {
    score = 75;
    rating = "good";
    explanation = `Estimated temperature of ${tempC}\xB0C is cool but suitable. Slower growth but excellent tuber quality. Frost protection may be needed during extreme cold spells.`;
    explanationNe = `\u0905\u0928\u0941\u092E\u093E\u0928\u093F\u0924 \u0924\u093E\u092A\u092E\u093E\u0928 ${tempC}\xB0\u0938\u0947 \u091A\u093F\u0938\u094B \u0924\u0930 \u0909\u092A\u092F\u0941\u0915\u094D\u0924 \u091B\u0964 \u0922\u093F\u0932\u094B \u0935\u0943\u0926\u094D\u0927\u093F \u0924\u0930 \u0909\u0924\u094D\u0915\u0943\u0937\u094D\u091F \u0915\u0928\u094D\u0926 \u0917\u0941\u0923\u0938\u094D\u0924\u0930\u0964 \u0905\u0924\u094D\u092F\u0927\u093F\u0915 \u091A\u093F\u0938\u094B \u0905\u0935\u0927\u093F\u092E\u093E \u0939\u093F\u092E\u092A\u093E\u0924 \u0938\u0941\u0930\u0915\u094D\u0937\u093E \u0906\u0935\u0936\u094D\u092F\u0915 \u0939\u0941\u0928 \u0938\u0915\u094D\u091B\u0964`;
  } else if (tempC >= 20 && tempC <= 25) {
    score = 65;
    rating = "moderate";
    explanation = `Estimated temperature of ${tempC}\xB0C is slightly warm. Irrigation and mulching can help manage heat stress. Choose heat-tolerant varieties.`;
    explanationNe = `\u0905\u0928\u0941\u092E\u093E\u0928\u093F\u0924 \u0924\u093E\u092A\u092E\u093E\u0928 ${tempC}\xB0\u0938\u0947 \u0925\u094B\u0930\u0948 \u0928\u094D\u092F\u093E\u0928\u094B \u091B\u0964 \u0938\u093F\u0901\u091A\u093E\u0907 \u0930 \u092E\u0932\u094D\u091A\u093F\u0919\u0932\u0947 \u0917\u0930\u094D\u092E\u0940\u0915\u094B \u0924\u0928\u093E\u0935 \u0935\u094D\u092F\u0935\u0938\u094D\u0925\u093E\u092A\u0928 \u0917\u0930\u094D\u0928 \u092E\u0926\u094D\u0926\u0924 \u0917\u0930\u094D\u0928 \u0938\u0915\u094D\u091B\u0964 \u0917\u0930\u094D\u092E\u0940-\u0938\u0939\u093F\u0937\u094D\u0923\u0941 \u0915\u093F\u0938\u094D\u092E\u0939\u0930\u0942 \u091B\u093E\u0928\u094D\u0928\u0941\u0939\u094B\u0938\u094D\u0964`;
  } else if (tempC >= 25 && tempC <= 30) {
    score = 40;
    rating = "poor";
    explanation = `Estimated temperature of ${tempC}\xB0C is too warm for optimal potato production. Heat stress reduces tuber set and increases disease susceptibility.`;
    explanationNe = `\u0905\u0928\u0941\u092E\u093E\u0928\u093F\u0924 \u0924\u093E\u092A\u092E\u093E\u0928 ${tempC}\xB0\u0938\u0947 \u0907\u0937\u094D\u091F\u0924\u092E \u0906\u0932\u0941 \u0909\u0924\u094D\u092A\u093E\u0926\u0928\u0915\u094B \u0932\u093E\u0917\u093F \u0927\u0947\u0930\u0948 \u0928\u094D\u092F\u093E\u0928\u094B \u091B\u0964 \u0917\u0930\u094D\u092E\u0940\u0915\u094B \u0924\u0928\u093E\u0935\u0932\u0947 \u0915\u0928\u094D\u0926 \u0938\u0947\u091F \u0918\u091F\u093E\u0909\u0901\u091B \u0930 \u0930\u094B\u0917\u0915\u094B \u0938\u0902\u0935\u0947\u0926\u0928\u0936\u0940\u0932\u0924\u093E \u092C\u0922\u093E\u0909\u0901\u091B\u0964`;
  } else if (tempC < 5) {
    score = 30;
    rating = "poor";
    explanation = `Estimated temperature of ${tempC}\xB0C is too cold. Risk of frost damage to foliage and tubers. Only frost-resistant varieties with protective measures are viable.`;
    explanationNe = `\u0905\u0928\u0941\u092E\u093E\u0928\u093F\u0924 \u0924\u093E\u092A\u092E\u093E\u0928 ${tempC}\xB0\u0938\u0947 \u0927\u0947\u0930\u0948 \u091A\u093F\u0938\u094B \u091B\u0964 \u092A\u093E\u0924 \u0930 \u0915\u0928\u094D\u0926\u092E\u093E \u0939\u093F\u092E\u092A\u093E\u0924 \u0915\u094D\u0937\u0924\u093F\u0915\u094B \u091C\u094B\u0916\u093F\u092E\u0964 \u0938\u0941\u0930\u0915\u094D\u0937\u093E\u0924\u094D\u092E\u0915 \u0909\u092A\u093E\u092F\u0939\u0930\u0942\u0938\u0939\u093F\u0924 \u0939\u093F\u092E\u092A\u093E\u0924-\u092A\u094D\u0930\u0924\u093F\u0930\u094B\u0927\u0940 \u0915\u093F\u0938\u094D\u092E\u0939\u0930\u0942 \u092E\u093E\u0924\u094D\u0930 \u0935\u094D\u092F\u093E\u0935\u0939\u093E\u0930\u093F\u0915 \u091B\u0928\u094D\u0964`;
  } else {
    score = 15;
    rating = "not_suitable";
    explanation = `Estimated temperature of ${tempC}\xB0C is too hot for potato cultivation. Temperatures above 30\xB0C cause tuber deformation and complete crop failure.`;
    explanationNe = `\u0905\u0928\u0941\u092E\u093E\u0928\u093F\u0924 \u0924\u093E\u092A\u092E\u093E\u0928 ${tempC}\xB0\u0938\u0947 \u0906\u0932\u0941 \u0916\u0947\u0924\u0940\u0915\u094B \u0932\u093E\u0917\u093F \u0927\u0947\u0930\u0948 \u0917\u0930\u094D\u092E \u091B\u0964 \u0969\u0966\xB0\u0938\u0947 \u092D\u0928\u094D\u0926\u093E \u092C\u0922\u0940 \u0924\u093E\u092A\u092E\u093E\u0928\u0932\u0947 \u0915\u0928\u094D\u0926 \u0935\u093F\u0915\u0943\u0924\u093F \u0930 \u092A\u0942\u0930\u094D\u0923 \u092C\u093E\u0932\u0940 \u0935\u093F\u092B\u0932\u0924\u093E \u0928\u093F\u092E\u094D\u0924\u094D\u092F\u093E\u0909\u0901\u091B\u0964`;
  }
  return {
    name: "Est. Temperature",
    nameNe: "\u0905\u0928\u0941\u092E\u093E\u0928\u093F\u0924 \u0924\u093E\u092A\u092E\u093E\u0928",
    value: `~${tempC}\xB0C`,
    valueNe: `~${tempC}\xB0\u0938\u0947`,
    score,
    rating,
    explanation,
    explanationNe,
    icon: "\u{1F321}\uFE0F"
  };
}
function estimateRainfallZone(lat, altitudeM) {
  const absLat = Math.abs(lat);
  let mmPerYear = 0;
  let zone = "";
  let zoneNe = "";
  if (absLat < 10) {
    mmPerYear = 2e3 + (altitudeM > 1e3 ? 500 : 0);
    zone = "Tropical High Rainfall";
    zoneNe = "\u0909\u0937\u094D\u0923\u0915\u091F\u093F\u092C\u0902\u0927\u0940\u092F \u0909\u091A\u094D\u091A \u0935\u0930\u094D\u0937\u093E";
  } else if (absLat < 20) {
    mmPerYear = 1200 + (altitudeM > 1e3 ? 400 : 0);
    zone = "Subtropical Monsoon";
    zoneNe = "\u0909\u092A\u094B\u0937\u094D\u0923\u0915\u091F\u093F\u092C\u0902\u0927\u0940\u092F \u092E\u0928\u0938\u0941\u0928";
  } else if (absLat < 35) {
    mmPerYear = 600 + (altitudeM > 1500 ? 300 : 0);
    zone = "Warm Temperate";
    zoneNe = "\u0928\u094D\u092F\u093E\u0928\u094B \u0938\u092E\u0936\u0940\u0924\u094B\u0937\u094D\u0923";
  } else if (absLat < 55) {
    mmPerYear = 700 + (altitudeM > 500 ? 200 : 0);
    zone = "Cool Temperate";
    zoneNe = "\u091A\u093F\u0938\u094B \u0938\u092E\u0936\u0940\u0924\u094B\u0937\u094D\u0923";
  } else {
    mmPerYear = 400;
    zone = "Subarctic";
    zoneNe = "\u0909\u092A-\u0906\u0930\u094D\u0915\u091F\u093F\u0915";
  }
  return { zone, zoneNe, mmPerYear };
}
function analyzeRainfall(mmPerYear, zone, zoneNe) {
  let score = 0;
  let rating = "not_suitable";
  let explanation = "";
  let explanationNe = "";
  if (mmPerYear >= 500 && mmPerYear <= 1200) {
    score = 85;
    rating = "good";
    explanation = `Estimated rainfall of ~${mmPerYear}mm/year is well-suited for potato cultivation. Potatoes require 500-700mm during the growing season, achievable with supplemental irrigation.`;
    explanationNe = `\u0905\u0928\u0941\u092E\u093E\u0928\u093F\u0924 \u0935\u0930\u094D\u0937\u093E ~${mmPerYear}\u092E\u093F\u092E\u093F/\u0935\u0930\u094D\u0937 \u0906\u0932\u0941 \u0916\u0947\u0924\u0940\u0915\u094B \u0932\u093E\u0917\u093F \u0909\u092A\u092F\u0941\u0915\u094D\u0924 \u091B\u0964 \u0906\u0932\u0941\u0932\u093E\u0908 \u0909\u0924\u094D\u092A\u093E\u0926\u0928 \u092E\u094C\u0938\u092E\u092E\u093E \u096B\u0966\u0966-\u096D\u0966\u0966 \u092E\u093F\u092E\u093F \u091A\u093E\u0939\u093F\u0928\u094D\u091B, \u092A\u0942\u0930\u0915 \u0938\u093F\u0901\u091A\u093E\u0907\u0938\u0939\u093F\u0924 \u092A\u094D\u0930\u093E\u092A\u094D\u0924 \u0917\u0930\u094D\u0928 \u0938\u0915\u093F\u0928\u094D\u091B\u0964`;
  } else if (mmPerYear > 1200 && mmPerYear <= 2e3) {
    score = 65;
    rating = "moderate";
    explanation = `High rainfall (~${mmPerYear}mm/year) increases disease pressure, especially Late Blight. Good drainage and preventive fungicide applications are essential.`;
    explanationNe = `\u0909\u091A\u094D\u091A \u0935\u0930\u094D\u0937\u093E (~${mmPerYear}\u092E\u093F\u092E\u093F/\u0935\u0930\u094D\u0937) \u0930\u094B\u0917\u0915\u094B \u0926\u092C\u093E\u0935 \u092C\u0922\u093E\u0909\u0901\u091B, \u0935\u093F\u0936\u0947\u0937 \u0917\u0930\u0940 \u0922\u093F\u0932\u094B \u091D\u0941\u0932\u0938\u093E\u0964 \u0930\u093E\u092E\u094D\u0930\u094B \u091C\u0932\u0928\u093F\u0915\u093E\u0938 \u0930 \u0928\u093F\u0935\u093E\u0930\u0915 \u0922\u0941\u0938\u0940\u0928\u093E\u0936\u0915 \u092A\u094D\u0930\u092F\u094B\u0917 \u0906\u0935\u0936\u094D\u092F\u0915 \u091B\u0964`;
  } else if (mmPerYear > 2e3) {
    score = 40;
    rating = "poor";
    explanation = `Very high rainfall (>${mmPerYear}mm/year) creates severe disease pressure and waterlogging risk. Raised beds, excellent drainage, and intensive disease management are required.`;
    explanationNe = `\u0927\u0947\u0930\u0948 \u0909\u091A\u094D\u091A \u0935\u0930\u094D\u0937\u093E (>${mmPerYear}\u092E\u093F\u092E\u093F/\u0935\u0930\u094D\u0937) \u0917\u092E\u094D\u092D\u0940\u0930 \u0930\u094B\u0917\u0915\u094B \u0926\u092C\u093E\u0935 \u0930 \u091C\u0932\u092D\u0930\u093E\u0935 \u091C\u094B\u0916\u093F\u092E \u0938\u093F\u0930\u094D\u091C\u0928\u093E \u0917\u0930\u094D\u091B\u0964 \u0909\u0920\u093E\u0907\u090F\u0915\u093E \u092C\u0947\u0921, \u0909\u0924\u094D\u0915\u0943\u0937\u094D\u091F \u091C\u0932\u0928\u093F\u0915\u093E\u0938, \u0930 \u0917\u0939\u0928 \u0930\u094B\u0917 \u0935\u094D\u092F\u0935\u0938\u094D\u0925\u093E\u092A\u0928 \u0906\u0935\u0936\u094D\u092F\u0915 \u091B\u0964`;
  } else {
    score = 50;
    rating = "moderate";
    explanation = `Low rainfall (~${mmPerYear}mm/year) requires irrigation. Drip or furrow irrigation can supplement rainfall to meet potato water requirements of 500-700mm/season.`;
    explanationNe = `\u0915\u092E \u0935\u0930\u094D\u0937\u093E (~${mmPerYear}\u092E\u093F\u092E\u093F/\u0935\u0930\u094D\u0937) \u0938\u093F\u0901\u091A\u093E\u0907 \u091A\u093E\u0939\u093F\u0928\u094D\u091B\u0964 \u0921\u094D\u0930\u093F\u092A \u0935\u093E \u092B\u0930\u094B \u0938\u093F\u0901\u091A\u093E\u0907\u0932\u0947 \u0906\u0932\u0941\u0915\u094B \u092A\u093E\u0928\u0940 \u0906\u0935\u0936\u094D\u092F\u0915\u0924\u093E \u096B\u0966\u0966-\u096D\u0966\u0966 \u092E\u093F\u092E\u093F/\u092E\u094C\u0938\u092E \u092A\u0942\u0930\u093E \u0917\u0930\u094D\u0928 \u0935\u0930\u094D\u0937\u093E\u0932\u093E\u0908 \u092A\u0942\u0930\u0915 \u092C\u0928\u093E\u0909\u0928 \u0938\u0915\u094D\u091B\u0964`;
  }
  return {
    name: "Rainfall Zone",
    nameNe: "\u0935\u0930\u094D\u0937\u093E \u0915\u094D\u0937\u0947\u0924\u094D\u0930",
    value: zone,
    valueNe: zoneNe,
    score,
    rating,
    explanation,
    explanationNe,
    icon: "\u{1F327}\uFE0F"
  };
}
function estimateSoilType(lat, altitudeM) {
  const absLat = Math.abs(lat);
  if (altitudeM > 3e3) return { soilType: "Alpine/Rocky Soil", soilTypeNe: "\u0905\u0932\u094D\u092A\u093E\u0907\u0928/\u091A\u091F\u094D\u091F\u093E\u0928\u0940 \u092E\u093E\u091F\u094B" };
  if (altitudeM > 1500) return { soilType: "Mountain Loam", soilTypeNe: "\u092A\u0939\u093E\u0921\u0940 \u0926\u094B\u092E\u091F \u092E\u093E\u091F\u094B" };
  if (absLat < 10 && altitudeM < 500) return { soilType: "Tropical Clay-Loam", soilTypeNe: "\u0909\u0937\u094D\u0923\u0915\u091F\u093F\u092C\u0902\u0927\u0940\u092F \u092E\u093E\u091F\u093F\u0932\u094B-\u0926\u094B\u092E\u091F" };
  if (absLat < 20) return { soilType: "Alluvial Loam", soilTypeNe: "\u091C\u0932\u094B\u0922 \u0926\u094B\u092E\u091F \u092E\u093E\u091F\u094B" };
  if (absLat < 35) return { soilType: "Sandy Loam", soilTypeNe: "\u092C\u0932\u094C\u091F\u0947 \u0926\u094B\u092E\u091F \u092E\u093E\u091F\u094B" };
  if (absLat < 55) return { soilType: "Loam / Clay-Loam", soilTypeNe: "\u0926\u094B\u092E\u091F / \u092E\u093E\u091F\u093F\u0932\u094B-\u0926\u094B\u092E\u091F" };
  return { soilType: "Peat / Sandy Soil", soilTypeNe: "\u092A\u093F\u091F / \u092C\u0932\u094C\u091F\u0947 \u092E\u093E\u091F\u094B" };
}
function analyzeSoil(soilType, soilTypeNe) {
  let score = 0;
  let rating = "not_suitable";
  let explanation = "";
  let explanationNe = "";
  if (soilType.includes("Loam") || soilType.includes("\u0926\u094B\u092E\u091F")) {
    score = 90;
    rating = "excellent";
    explanation = `${soilType} is ideal for potato cultivation. Well-drained, loose-textured soils allow easy tuber expansion, good aeration, and proper moisture retention.`;
    explanationNe = `${soilTypeNe} \u0906\u0932\u0941 \u0916\u0947\u0924\u0940\u0915\u094B \u0932\u093E\u0917\u093F \u0906\u0926\u0930\u094D\u0936 \u091B\u0964 \u0930\u093E\u092E\u094D\u0930\u094B\u0938\u0901\u0917 \u0928\u093F\u0915\u093E\u0938\u0940 \u092D\u090F\u0915\u094B, \u0922\u093F\u0932\u094B-\u092C\u0928\u093E\u0935\u091F\u0915\u094B \u092E\u093E\u091F\u094B\u0932\u0947 \u0915\u0928\u094D\u0926 \u0935\u093F\u0938\u094D\u0924\u093E\u0930, \u0930\u093E\u092E\u094D\u0930\u094B \u0935\u093E\u092F\u0941\u0938\u091E\u094D\u091A\u093E\u0930, \u0930 \u0909\u091A\u093F\u0924 \u0906\u0930\u094D\u0926\u094D\u0930\u0924\u093E \u0927\u093E\u0930\u0923\u0932\u093E\u0908 \u0938\u0939\u091C \u092C\u0928\u093E\u0909\u0901\u091B\u0964`;
  } else if (soilType.includes("Sandy") || soilType.includes("\u092C\u0932\u094C\u091F\u0947")) {
    score = 70;
    rating = "good";
    explanation = `${soilType} drains well and warms quickly, which is beneficial for early planting. However, it requires more frequent irrigation and fertilization due to lower water and nutrient retention.`;
    explanationNe = `${soilTypeNe} \u0930\u093E\u092E\u094D\u0930\u094B\u0938\u0901\u0917 \u0928\u093F\u0915\u093E\u0938\u0940 \u0939\u0941\u0928\u094D\u091B \u0930 \u091B\u093F\u091F\u094D\u091F\u0948 \u0928\u094D\u092F\u093E\u0928\u094B \u0939\u0941\u0928\u094D\u091B, \u091C\u0941\u0928 \u092A\u094D\u0930\u093E\u0930\u092E\u094D\u092D\u093F\u0915 \u0930\u094B\u092A\u093E\u0907\u0915\u094B \u0932\u093E\u0917\u093F \u092B\u093E\u0907\u0926\u093E\u091C\u0928\u0915 \u091B\u0964 \u0924\u0930, \u0915\u092E \u092A\u093E\u0928\u0940 \u0930 \u092A\u094B\u0937\u0915 \u0924\u0924\u094D\u0935 \u0927\u093E\u0930\u0923\u0915\u093E \u0915\u093E\u0930\u0923 \u092C\u0922\u0940 \u092C\u093E\u0930\u092E\u094D\u092C\u093E\u0930 \u0938\u093F\u0901\u091A\u093E\u0907 \u0930 \u092E\u0932\u0916\u093E\u0926 \u091A\u093E\u0939\u093F\u0928\u094D\u091B\u0964`;
  } else if (soilType.includes("Clay") || soilType.includes("\u092E\u093E\u091F\u093F\u0932\u094B")) {
    score = 55;
    rating = "moderate";
    explanation = `${soilType} can support potato cultivation but may cause waterlogging and restrict tuber expansion. Raised beds and organic matter addition improve drainage and soil structure.`;
    explanationNe = `${soilTypeNe} \u0906\u0932\u0941 \u0916\u0947\u0924\u0940\u0932\u093E\u0908 \u0938\u092E\u0930\u094D\u0925\u0928 \u0917\u0930\u094D\u0928 \u0938\u0915\u094D\u091B \u0924\u0930 \u091C\u0932\u092D\u0930\u093E\u0935 \u0928\u093F\u092E\u094D\u0924\u094D\u092F\u093E\u0909\u0928 \u0930 \u0915\u0928\u094D\u0926 \u0935\u093F\u0938\u094D\u0924\u093E\u0930 \u092A\u094D\u0930\u0924\u093F\u092C\u0928\u094D\u0927\u093F\u0924 \u0917\u0930\u094D\u0928 \u0938\u0915\u094D\u091B\u0964 \u0909\u0920\u093E\u0907\u090F\u0915\u093E \u092C\u0947\u0921 \u0930 \u091C\u0948\u0935\u093F\u0915 \u092A\u0926\u093E\u0930\u094D\u0925 \u0925\u092A\u094D\u0926\u093E \u091C\u0932\u0928\u093F\u0915\u093E\u0938 \u0930 \u092E\u093E\u091F\u094B\u0915\u094B \u0938\u0902\u0930\u091A\u0928\u093E \u0938\u0941\u0927\u093E\u0930 \u0939\u0941\u0928\u094D\u091B\u0964`;
  } else if (soilType.includes("Alpine") || soilType.includes("Rocky") || soilType.includes("\u0905\u0932\u094D\u092A\u093E\u0907\u0928") || soilType.includes("\u091A\u091F\u094D\u091F\u093E\u0928\u0940")) {
    score = 35;
    rating = "poor";
    explanation = `${soilType} is shallow and rocky, limiting root development and tuber expansion. Soil improvement with organic matter and raised bed cultivation are necessary.`;
    explanationNe = `${soilTypeNe} \u0909\u0925\u0932\u094B \u0930 \u091A\u091F\u094D\u091F\u093E\u0928\u0940 \u091B, \u091C\u0930\u093E \u0935\u093F\u0915\u093E\u0938 \u0930 \u0915\u0928\u094D\u0926 \u0935\u093F\u0938\u094D\u0924\u093E\u0930 \u0938\u0940\u092E\u093F\u0924 \u0917\u0930\u094D\u091B\u0964 \u091C\u0948\u0935\u093F\u0915 \u092A\u0926\u093E\u0930\u094D\u0925\u0938\u0939\u093F\u0924 \u092E\u093E\u091F\u094B \u0938\u0941\u0927\u093E\u0930 \u0930 \u0909\u0920\u093E\u0907\u090F\u0915\u094B \u092C\u0947\u0921 \u0916\u0947\u0924\u0940 \u0906\u0935\u0936\u094D\u092F\u0915 \u091B\u0964`;
  } else {
    score = 60;
    rating = "moderate";
    explanation = `${soilType} can support potato cultivation with proper management. Soil testing and amendment with organic matter and balanced fertilizers will optimize yields.`;
    explanationNe = `${soilTypeNe} \u0909\u091A\u093F\u0924 \u0935\u094D\u092F\u0935\u0938\u094D\u0925\u093E\u092A\u0928\u0938\u0939\u093F\u0924 \u0906\u0932\u0941 \u0916\u0947\u0924\u0940\u0932\u093E\u0908 \u0938\u092E\u0930\u094D\u0925\u0928 \u0917\u0930\u094D\u0928 \u0938\u0915\u094D\u091B\u0964 \u092E\u093E\u091F\u094B \u092A\u0930\u0940\u0915\u094D\u0937\u0923 \u0930 \u091C\u0948\u0935\u093F\u0915 \u092A\u0926\u093E\u0930\u094D\u0925 \u0930 \u0938\u0928\u094D\u0924\u0941\u0932\u093F\u0924 \u092E\u0932\u0916\u093E\u0926\u0938\u0939\u093F\u0924 \u0938\u0902\u0936\u094B\u0927\u0928\u0932\u0947 \u0909\u092A\u091C \u0905\u0928\u0941\u0915\u0942\u0932\u093F\u0924 \u0917\u0930\u094D\u0928\u0947\u091B\u0964`;
  }
  return {
    name: "Est. Soil Type",
    nameNe: "\u0905\u0928\u0941\u092E\u093E\u0928\u093F\u0924 \u092E\u093E\u091F\u094B\u0915\u094B \u092A\u094D\u0930\u0915\u093E\u0930",
    value: soilType,
    valueNe: soilTypeNe,
    score,
    rating,
    explanation,
    explanationNe,
    icon: "\u{1FAA8}"
  };
}
function analyzeFrostRisk(tempC, altitudeM) {
  let score = 0;
  let rating = "not_suitable";
  let explanation = "";
  let explanationNe = "";
  let riskLabel = "";
  let riskLabelNe = "";
  if (tempC > 10) {
    score = 90;
    rating = "excellent";
    riskLabel = "Low Frost Risk";
    riskLabelNe = "\u0915\u092E \u0939\u093F\u092E\u092A\u093E\u0924 \u091C\u094B\u0916\u093F\u092E";
    explanation = "Low frost risk allows flexible planting windows and reduces crop loss from cold damage.";
    explanationNe = "\u0915\u092E \u0939\u093F\u092E\u092A\u093E\u0924 \u091C\u094B\u0916\u093F\u092E\u0932\u0947 \u0932\u091A\u093F\u0932\u094B \u0930\u094B\u092A\u093E\u0907 \u0935\u093F\u0928\u094D\u0921\u094B \u0905\u0928\u0941\u092E\u0924\u093F \u0926\u093F\u0928\u094D\u091B \u0930 \u091A\u093F\u0938\u094B \u0915\u094D\u0937\u0924\u093F\u092C\u093E\u091F \u092C\u093E\u0932\u0940 \u0939\u093E\u0928\u093F \u0915\u092E \u0917\u0930\u094D\u091B\u0964";
  } else if (tempC >= 5 && tempC <= 10) {
    score = 70;
    rating = "good";
    riskLabel = "Moderate Frost Risk";
    riskLabelNe = "\u092E\u0927\u094D\u092F\u092E \u0939\u093F\u092E\u092A\u093E\u0924 \u091C\u094B\u0916\u093F\u092E";
    explanation = "Moderate frost risk. Plant after last frost date and use row covers or mulching for protection during cold snaps.";
    explanationNe = "\u092E\u0927\u094D\u092F\u092E \u0939\u093F\u092E\u092A\u093E\u0924 \u091C\u094B\u0916\u093F\u092E\u0964 \u0905\u0928\u094D\u0924\u093F\u092E \u0939\u093F\u092E\u092A\u093E\u0924 \u092E\u093F\u0924\u093F\u092A\u091B\u093F \u0930\u094B\u092A\u094D\u0928\u0941\u0939\u094B\u0938\u094D \u0930 \u091A\u093F\u0938\u094B \u0905\u0935\u0927\u093F\u092E\u093E \u0938\u0941\u0930\u0915\u094D\u0937\u093E\u0915\u094B \u0932\u093E\u0917\u093F \u092A\u0919\u094D\u0915\u094D\u0924\u093F \u0906\u0935\u0930\u0923 \u0935\u093E \u092E\u0932\u094D\u091A\u093F\u0919 \u092A\u094D\u0930\u092F\u094B\u0917 \u0917\u0930\u094D\u0928\u0941\u0939\u094B\u0938\u094D\u0964";
  } else if (tempC >= 0 && tempC < 5) {
    score = 45;
    rating = "moderate";
    riskLabel = "High Frost Risk";
    riskLabelNe = "\u0909\u091A\u094D\u091A \u0939\u093F\u092E\u092A\u093E\u0924 \u091C\u094B\u0916\u093F\u092E";
    explanation = "High frost risk. Frost-tolerant varieties and protective measures (row covers, cold frames) are essential. Short growing window.";
    explanationNe = "\u0909\u091A\u094D\u091A \u0939\u093F\u092E\u092A\u093E\u0924 \u091C\u094B\u0916\u093F\u092E\u0964 \u0939\u093F\u092E\u092A\u093E\u0924-\u0938\u0939\u093F\u0937\u094D\u0923\u0941 \u0915\u093F\u0938\u094D\u092E\u0939\u0930\u0942 \u0930 \u0938\u0941\u0930\u0915\u094D\u0937\u093E\u0924\u094D\u092E\u0915 \u0909\u092A\u093E\u092F\u0939\u0930\u0942 (\u092A\u0919\u094D\u0915\u094D\u0924\u093F \u0906\u0935\u0930\u0923, \u091A\u093F\u0938\u094B \u092B\u094D\u0930\u0947\u092E) \u0906\u0935\u0936\u094D\u092F\u0915 \u091B\u0928\u094D\u0964 \u091B\u094B\u091F\u094B \u0909\u0924\u094D\u092A\u093E\u0926\u0928 \u0935\u093F\u0928\u094D\u0921\u094B\u0964";
  } else {
    score = 20;
    rating = "poor";
    riskLabel = "Severe Frost Risk";
    riskLabelNe = "\u0917\u092E\u094D\u092D\u0940\u0930 \u0939\u093F\u092E\u092A\u093E\u0924 \u091C\u094B\u0916\u093F\u092E";
    explanation = "Severe frost risk makes potato cultivation very challenging. Only specialized cold-hardy varieties in protected environments are viable.";
    explanationNe = "\u0917\u092E\u094D\u092D\u0940\u0930 \u0939\u093F\u092E\u092A\u093E\u0924 \u091C\u094B\u0916\u093F\u092E\u0932\u0947 \u0906\u0932\u0941 \u0916\u0947\u0924\u0940\u0932\u093E\u0908 \u0927\u0947\u0930\u0948 \u091A\u0941\u0928\u094C\u0924\u0940\u092A\u0942\u0930\u094D\u0923 \u092C\u0928\u093E\u0909\u0901\u091B\u0964 \u0938\u0902\u0930\u0915\u094D\u0937\u093F\u0924 \u0935\u093E\u0924\u093E\u0935\u0930\u0923\u092E\u093E \u0935\u093F\u0936\u0947\u0937 \u091A\u093F\u0938\u094B-\u0915\u0920\u094B\u0930 \u0915\u093F\u0938\u094D\u092E\u0939\u0930\u0942 \u092E\u093E\u0924\u094D\u0930 \u0935\u094D\u092F\u093E\u0935\u0939\u093E\u0930\u093F\u0915 \u091B\u0928\u094D\u0964";
  }
  return {
    name: "Frost Risk",
    nameNe: "\u0939\u093F\u092E\u092A\u093E\u0924 \u091C\u094B\u0916\u093F\u092E",
    value: riskLabel,
    valueNe: riskLabelNe,
    score,
    rating,
    explanation,
    explanationNe,
    icon: "\u2744\uFE0F"
  };
}
function estimateGrowingSeason(lat, altitudeM, tempC) {
  const absLat = Math.abs(lat);
  const isNepal = lat >= 26 && lat <= 30 && absLat < 35;
  if (isNepal) {
    if (altitudeM > 2e3) return { season: "Spring (Feb\u2013May) & Autumn (Sep\u2013Nov)", seasonNe: "\u0935\u0938\u0928\u094D\u0924 (\u092B\u0947\u092C\u094D\u0930\u0941\u2013\u092E\u0947) \u0930 \u0936\u0930\u0926 (\u0938\u0947\u092A\u094D\u091F\u2013\u0928\u094B\u092D\u0947)" };
    if (altitudeM > 800) return { season: "Winter (Oct\u2013Feb) & Spring (Feb\u2013May)", seasonNe: "\u091C\u093E\u0921\u094B (\u0905\u0915\u094D\u091F\u094B\u2013\u092B\u0947\u092C\u094D\u0930\u0941) \u0930 \u0935\u0938\u0928\u094D\u0924 (\u092B\u0947\u092C\u094D\u0930\u0941\u2013\u092E\u0947)" };
    return { season: "Winter (Nov\u2013Mar)", seasonNe: "\u091C\u093E\u0921\u094B (\u0928\u094B\u092D\u0947\u2013\u092E\u093E\u0930\u094D\u091A)" };
  }
  if (tempC < 5) return { season: "Short Summer (Jun\u2013Aug)", seasonNe: "\u091B\u094B\u091F\u094B \u0917\u0930\u094D\u092E\u0940 (\u091C\u0941\u0928\u2013\u0905\u0917\u0938\u094D\u091F)" };
  if (tempC >= 5 && tempC < 12) return { season: "Spring\u2013Summer (Apr\u2013Sep)", seasonNe: "\u0935\u0938\u0928\u094D\u0924\u2013\u0917\u0930\u094D\u092E\u0940 (\u0905\u092A\u094D\u0930\u093F\u0932\u2013\u0938\u0947\u092A\u094D\u091F)" };
  if (tempC >= 12 && tempC <= 20) return { season: "Year-round (with 2 crops)", seasonNe: "\u0935\u0930\u094D\u0937\u092D\u0930\u093F (\u0968 \u092C\u093E\u0932\u0940 \u0938\u0939\u093F\u0924)" };
  return { season: "Cool Season (Oct\u2013Mar)", seasonNe: "\u091A\u093F\u0938\u094B \u092E\u094C\u0938\u092E (\u0905\u0915\u094D\u091F\u094B\u2013\u092E\u093E\u0930\u094D\u091A)" };
}
function getRecommendedVarieties(altitudeM, tempC, lat) {
  const isNepal = lat >= 26 && lat <= 30;
  if (isNepal) {
    if (altitudeM > 2500) return {
      varieties: ["Desiree", "Cardinal", "Janakdev", "Khumal Lal"],
      varietiesNe: ["\u0921\u0947\u091C\u093F\u0930\u0940", "\u0915\u093E\u0930\u094D\u0921\u093F\u0928\u0932", "\u091C\u0928\u0915\u0926\u0947\u0935", "\u0916\u0941\u092E\u093E\u0932 \u0932\u093E\u0932"]
    };
    if (altitudeM > 1e3) return {
      varieties: ["Khumal Seto-1", "Khumal Lal", "Desiree", "Janakdev", "Cardinal"],
      varietiesNe: ["\u0916\u0941\u092E\u093E\u0932 \u0938\u0947\u0924\u094B-\u0967", "\u0916\u0941\u092E\u093E\u0932 \u0932\u093E\u0932", "\u0921\u0947\u091C\u093F\u0930\u0940", "\u091C\u0928\u0915\u0926\u0947\u0935", "\u0915\u093E\u0930\u094D\u0921\u093F\u0928\u0932"]
    };
    return {
      varieties: ["Khumal Seto-1", "Desiree", "Janakdev", "Diamant"],
      varietiesNe: ["\u0916\u0941\u092E\u093E\u0932 \u0938\u0947\u0924\u094B-\u0967", "\u0921\u0947\u091C\u093F\u0930\u0940", "\u091C\u0928\u0915\u0926\u0947\u0935", "\u0921\u093E\u092F\u092E\u0928\u094D\u091F"]
    };
  }
  if (tempC > 20) return {
    varieties: ["Atlantic", "Kennebec", "Granola", "Diamant"],
    varietiesNe: ["\u090F\u091F\u0932\u093E\u0928\u094D\u091F\u093F\u0915", "\u0915\u0947\u0928\u0947\u092C\u0947\u0915", "\u0917\u094D\u0930\u093E\u0928\u094B\u0932\u093E", "\u0921\u093E\u092F\u092E\u0928\u094D\u091F"]
  };
  if (tempC < 8) return {
    varieties: ["Desiree", "Maris Piper", "King Edward", "Rooster"],
    varietiesNe: ["\u0921\u0947\u091C\u093F\u0930\u0940", "\u092E\u093E\u0930\u093F\u0938 \u092A\u093E\u0907\u092A\u0930", "\u0915\u093F\u0919 \u090F\u0921\u0935\u0930\u094D\u0921", "\u0930\u0941\u0938\u094D\u091F\u0930"]
  };
  return {
    varieties: ["Russet Burbank", "Yukon Gold", "Red Pontiac", "Desiree", "Atlantic"],
    varietiesNe: ["\u0930\u0938\u0947\u091F \u092C\u0930\u094D\u092C\u0948\u0902\u0915", "\u092F\u0941\u0915\u094B\u0928 \u0917\u094B\u0932\u094D\u0921", "\u0930\u0947\u0921 \u092A\u094B\u0928\u094D\u091F\u093F\u092F\u093E\u0915", "\u0921\u0947\u091C\u093F\u0930\u0940", "\u090F\u091F\u0932\u093E\u0928\u094D\u091F\u093F\u0915"]
  };
}
function getLocalChallenges(altitudeM, tempC, mmPerYear, lat) {
  const challenges = [];
  const challengesNe = [];
  if (tempC > 22) {
    challenges.push("Heat stress during tuber initiation");
    challengesNe.push("\u0915\u0928\u094D\u0926 \u092A\u094D\u0930\u093E\u0930\u092E\u094D\u092D \u0926\u094C\u0930\u093E\u0928 \u0917\u0930\u094D\u092E\u0940\u0915\u094B \u0924\u0928\u093E\u0935");
  }
  if (tempC < 5) {
    challenges.push("Frost damage risk to foliage and tubers");
    challengesNe.push("\u092A\u093E\u0924 \u0930 \u0915\u0928\u094D\u0926\u092E\u093E \u0939\u093F\u092E\u092A\u093E\u0924 \u0915\u094D\u0937\u0924\u093F\u0915\u094B \u091C\u094B\u0916\u093F\u092E");
  }
  if (mmPerYear > 1500) {
    challenges.push("High Late Blight pressure due to humidity");
    challengesNe.push("\u0906\u0930\u094D\u0926\u094D\u0930\u0924\u093E\u0915\u093E \u0915\u093E\u0930\u0923 \u0909\u091A\u094D\u091A \u0922\u093F\u0932\u094B \u091D\u0941\u0932\u0938\u093E\u0915\u094B \u0926\u092C\u093E\u0935");
  }
  if (mmPerYear > 1500) {
    challenges.push("Waterlogging risk in poorly drained soils");
    challengesNe.push("\u0915\u092E\u091C\u094B\u0930 \u091C\u0932\u0928\u093F\u0915\u093E\u0938 \u092D\u090F\u0915\u094B \u092E\u093E\u091F\u094B\u092E\u093E \u091C\u0932\u092D\u0930\u093E\u0935\u0915\u094B \u091C\u094B\u0916\u093F\u092E");
  }
  if (mmPerYear < 400) {
    challenges.push("Water scarcity requiring irrigation");
    challengesNe.push("\u0938\u093F\u0901\u091A\u093E\u0907 \u0906\u0935\u0936\u094D\u092F\u0915 \u092A\u0930\u094D\u0928\u0947 \u092A\u093E\u0928\u0940\u0915\u094B \u0905\u092D\u093E\u0935");
  }
  if (altitudeM > 3e3) {
    challenges.push("Short growing season due to high altitude");
    challengesNe.push("\u0909\u091A\u094D\u091A \u0909\u091A\u093E\u0907\u0915\u093E \u0915\u093E\u0930\u0923 \u091B\u094B\u091F\u094B \u0909\u0924\u094D\u092A\u093E\u0926\u0928 \u092E\u094C\u0938\u092E");
  }
  if (altitudeM > 2e3) {
    challenges.push("UV radiation damage at high altitude");
    challengesNe.push("\u0909\u091A\u094D\u091A \u0909\u091A\u093E\u0907\u092E\u093E UV \u0935\u093F\u0915\u093F\u0930\u0923 \u0915\u094D\u0937\u0924\u093F");
  }
  if (lat >= 26 && lat <= 30) {
    challenges.push("Monsoon disease pressure (Jun\u2013Sep)");
    challengesNe.push("\u092E\u0928\u0938\u0941\u0928 \u0930\u094B\u0917\u0915\u094B \u0926\u092C\u093E\u0935 (\u091C\u0941\u0928\u2013\u0938\u0947\u092A\u094D\u091F)");
  }
  if (challenges.length === 0) {
    challenges.push("Generally favorable conditions \u2014 standard pest monitoring recommended");
    challengesNe.push("\u0938\u093E\u092E\u093E\u0928\u094D\u092F\u0924\u0903 \u0905\u0928\u0941\u0915\u0942\u0932 \u0905\u0935\u0938\u094D\u0925\u093E \u2014 \u092E\u093E\u0928\u0915 \u0915\u0940\u091F \u0905\u0928\u0941\u0917\u092E\u0928 \u0938\u093F\u092B\u093E\u0930\u093F\u0938 \u0917\u0930\u093F\u0928\u094D\u091B");
  }
  return { challenges, challengesNe };
}
function getGrowingTips(altitudeM, tempC, mmPerYear, lat) {
  const tips = [];
  const tipsNe = [];
  if (altitudeM > 1500) {
    tips.push("Use certified disease-free seed potatoes from reputable sources");
    tipsNe.push("\u092A\u094D\u0930\u0924\u093F\u0937\u094D\u0920\u093F\u0924 \u0938\u094D\u0930\u094B\u0924\u0939\u0930\u0942\u092C\u093E\u091F \u092A\u094D\u0930\u092E\u093E\u0923\u093F\u0924 \u0930\u094B\u0917-\u092E\u0941\u0915\u094D\u0924 \u092C\u0940\u091C \u0906\u0932\u0941 \u092A\u094D\u0930\u092F\u094B\u0917 \u0917\u0930\u094D\u0928\u0941\u0939\u094B\u0938\u094D");
  }
  if (tempC >= 10 && tempC <= 20) {
    tips.push("Plant in well-prepared ridges or raised beds for optimal drainage");
    tipsNe.push("\u0907\u0937\u094D\u091F\u0924\u092E \u091C\u0932\u0928\u093F\u0915\u093E\u0938\u0915\u094B \u0932\u093E\u0917\u093F \u0930\u093E\u092E\u094D\u0930\u094B\u0938\u0901\u0917 \u0924\u092F\u093E\u0930 \u0917\u0930\u093F\u090F\u0915\u093E \u0930\u093F\u091C \u0935\u093E \u0909\u0920\u093E\u0907\u090F\u0915\u093E \u092C\u0947\u0921\u092E\u093E \u0930\u094B\u092A\u094D\u0928\u0941\u0939\u094B\u0938\u094D");
  }
  if (mmPerYear > 1200) {
    tips.push("Apply preventive fungicide (Mancozeb) every 7-10 days during wet season");
    tipsNe.push("\u092D\u093F\u091C\u0947\u0915\u094B \u092E\u094C\u0938\u092E\u092E\u093E \u0939\u0930\u0947\u0915 \u096D-\u0967\u0966 \u0926\u093F\u0928\u092E\u093E \u0928\u093F\u0935\u093E\u0930\u0915 \u0922\u0941\u0938\u0940\u0928\u093E\u0936\u0915 (\u092E\u094D\u092F\u093E\u0928\u094D\u0915\u094B\u091C\u0947\u092C) \u0932\u0917\u093E\u0909\u0928\u0941\u0939\u094B\u0938\u094D");
  }
  if (mmPerYear < 600) {
    tips.push("Install drip irrigation for consistent moisture (25-30mm/week)");
    tipsNe.push("\u0928\u093F\u0930\u0928\u094D\u0924\u0930 \u0906\u0930\u094D\u0926\u094D\u0930\u0924\u093E\u0915\u094B \u0932\u093E\u0917\u093F \u0921\u094D\u0930\u093F\u092A \u0938\u093F\u0901\u091A\u093E\u0907 \u0938\u094D\u0925\u093E\u092A\u0928\u093E \u0917\u0930\u094D\u0928\u0941\u0939\u094B\u0938\u094D (\u0968\u096B-\u0969\u0966 \u092E\u093F\u092E\u093F/\u0939\u092A\u094D\u0924\u093E)");
  }
  tips.push("Hill up soil around plants when they reach 20-25cm to prevent greening");
  tipsNe.push("\u0939\u0930\u093F\u092F\u094B \u0939\u0941\u0928\u092C\u093E\u091F \u0930\u094B\u0915\u094D\u0928 \u092C\u093F\u0930\u0941\u0935\u093E\u0939\u0930\u0942 \u0968\u0966-\u0968\u096B \u0938\u0947\u092E\u093F \u092A\u0941\u0917\u094D\u0926\u093E \u0935\u0930\u093F\u092A\u0930\u093F \u092E\u093E\u091F\u094B \u0925\u0941\u092A\u093E\u0930\u094D\u0928\u0941\u0939\u094B\u0938\u094D");
  tips.push("Rotate crops \u2014 avoid planting potatoes in the same field for 3+ years");
  tipsNe.push("\u092C\u093E\u0932\u0940 \u0918\u0941\u092E\u093E\u0909\u0928\u0941\u0939\u094B\u0938\u094D \u2014 \u0969+ \u0935\u0930\u094D\u0937\u0938\u092E\u094D\u092E \u090F\u0909\u091F\u0948 \u0916\u0947\u0924\u092E\u093E \u0906\u0932\u0941 \u0928\u0930\u094B\u092A\u094D\u0928\u0941\u0939\u094B\u0938\u094D");
  tips.push("Test soil pH (ideal: 5.5\u20136.5) and adjust with lime or sulfur as needed");
  tipsNe.push("\u092E\u093E\u091F\u094B\u0915\u094B pH \u092A\u0930\u0940\u0915\u094D\u0937\u0923 \u0917\u0930\u094D\u0928\u0941\u0939\u094B\u0938\u094D (\u0906\u0926\u0930\u094D\u0936: \u096B.\u096B\u2013\u096C.\u096B) \u0930 \u0906\u0935\u0936\u094D\u092F\u0915\u0924\u093E\u0928\u0941\u0938\u093E\u0930 \u091A\u0941\u0928 \u0935\u093E \u0938\u0932\u094D\u092B\u0930\u0932\u0947 \u0938\u092E\u093E\u092F\u094B\u091C\u0928 \u0917\u0930\u094D\u0928\u0941\u0939\u094B\u0938\u094D");
  if (lat >= 26 && lat <= 30) {
    tips.push("In Nepal: plant Khumal varieties for best local adaptation and yield");
    tipsNe.push("\u0928\u0947\u092A\u093E\u0932\u092E\u093E: \u0909\u0924\u094D\u0924\u092E \u0938\u094D\u0925\u093E\u0928\u0940\u092F \u0905\u0928\u0941\u0915\u0942\u0932\u0928 \u0930 \u0909\u092A\u091C\u0915\u094B \u0932\u093E\u0917\u093F \u0916\u0941\u092E\u093E\u0932 \u0915\u093F\u0938\u094D\u092E\u0939\u0930\u0942 \u0930\u094B\u092A\u094D\u0928\u0941\u0939\u094B\u0938\u094D");
  }
  return { tips, tipsNe };
}
function computeOverall(factors) {
  const weights = [0.3, 0.2, 0.2, 0.15, 0.1, 0.05];
  const score = Math.round(
    factors.reduce((sum, f, i) => sum + f.score * (weights[i] ?? 0.1), 0)
  );
  let rating = "not_suitable";
  if (score >= 80) rating = "excellent";
  else if (score >= 65) rating = "good";
  else if (score >= 50) rating = "moderate";
  else if (score >= 30) rating = "poor";
  return { score, rating };
}
function getRecommendation(rating, altitudeM, lat) {
  const isNepal = lat >= 26 && lat <= 30;
  switch (rating) {
    case "excellent":
      return {
        rec: `Your location is excellent for potato cultivation${isNepal ? " \u2014 typical of Nepal's mid-hills" : ""}. Conditions closely match the ideal agronomic requirements. Focus on disease prevention and variety selection for maximum yield.`,
        recNe: `\u0924\u092A\u093E\u0908\u0902\u0915\u094B \u0938\u094D\u0925\u093E\u0928 \u0906\u0932\u0941 \u0916\u0947\u0924\u0940\u0915\u094B \u0932\u093E\u0917\u093F \u0909\u0924\u094D\u0915\u0943\u0937\u094D\u091F \u091B${isNepal ? " \u2014 \u0928\u0947\u092A\u093E\u0932\u0915\u094B \u092E\u0927\u094D\u092F-\u092A\u0939\u093E\u0921\u0915\u094B \u0935\u093F\u0936\u093F\u0937\u094D\u091F" : ""}\u0964 \u0905\u0935\u0938\u094D\u0925\u093E\u0939\u0930\u0942 \u0906\u0926\u0930\u094D\u0936 \u0915\u0943\u0937\u093F \u0906\u0935\u0936\u094D\u092F\u0915\u0924\u093E\u0939\u0930\u0942\u0938\u0901\u0917 \u0928\u091C\u093F\u0915\u092C\u093E\u091F \u092E\u0947\u0932 \u0916\u093E\u0928\u094D\u091B\u0928\u094D\u0964 \u0905\u0927\u093F\u0915\u0924\u092E \u0909\u092A\u091C\u0915\u094B \u0932\u093E\u0917\u093F \u0930\u094B\u0917 \u0930\u094B\u0915\u0925\u093E\u092E \u0930 \u0915\u093F\u0938\u094D\u092E \u091A\u092F\u0928\u092E\u093E \u0927\u094D\u092F\u093E\u0928 \u0915\u0947\u0928\u094D\u0926\u094D\u0930\u093F\u0924 \u0917\u0930\u094D\u0928\u0941\u0939\u094B\u0938\u094D\u0964`
      };
    case "good":
      return {
        rec: "Your location is well-suited for potato cultivation with minor management adjustments. Select appropriate varieties and follow recommended agronomic practices for good yields.",
        recNe: "\u0924\u092A\u093E\u0908\u0902\u0915\u094B \u0938\u094D\u0925\u093E\u0928 \u092E\u093E\u092E\u0942\u0932\u0940 \u0935\u094D\u092F\u0935\u0938\u094D\u0925\u093E\u092A\u0928 \u0938\u092E\u093E\u092F\u094B\u091C\u0928\u0938\u0939\u093F\u0924 \u0906\u0932\u0941 \u0916\u0947\u0924\u0940\u0915\u094B \u0932\u093E\u0917\u093F \u0909\u092A\u092F\u0941\u0915\u094D\u0924 \u091B\u0964 \u0930\u093E\u092E\u094D\u0930\u094B \u0909\u092A\u091C\u0915\u094B \u0932\u093E\u0917\u093F \u0909\u092A\u092F\u0941\u0915\u094D\u0924 \u0915\u093F\u0938\u094D\u092E\u0939\u0930\u0942 \u091B\u093E\u0928\u094D\u0928\u0941\u0939\u094B\u0938\u094D \u0930 \u0938\u093F\u092B\u093E\u0930\u093F\u0938 \u0917\u0930\u093F\u090F\u0915\u093E \u0915\u0943\u0937\u093F \u0905\u092D\u094D\u092F\u093E\u0938\u0939\u0930\u0942 \u092A\u093E\u0932\u0928\u093E \u0917\u0930\u094D\u0928\u0941\u0939\u094B\u0938\u094D\u0964"
      };
    case "moderate":
      return {
        rec: "Potato cultivation is possible at your location with careful management. Address limiting factors (temperature, drainage, or irrigation) and choose adapted varieties to achieve acceptable yields.",
        recNe: "\u0924\u092A\u093E\u0908\u0902\u0915\u094B \u0938\u094D\u0925\u093E\u0928\u092E\u093E \u0938\u093E\u0935\u0927\u093E\u0928\u0940\u092A\u0942\u0930\u094D\u0935\u0915 \u0935\u094D\u092F\u0935\u0938\u094D\u0925\u093E\u092A\u0928\u0938\u0939\u093F\u0924 \u0906\u0932\u0941 \u0916\u0947\u0924\u0940 \u0938\u092E\u094D\u092D\u0935 \u091B\u0964 \u0938\u094D\u0935\u0940\u0915\u093E\u0930\u094D\u092F \u0909\u092A\u091C \u092A\u094D\u0930\u093E\u092A\u094D\u0924 \u0917\u0930\u094D\u0928 \u0938\u0940\u092E\u093F\u0924 \u0915\u093E\u0930\u0915\u0939\u0930\u0942 (\u0924\u093E\u092A\u092E\u093E\u0928, \u091C\u0932\u0928\u093F\u0915\u093E\u0938, \u0935\u093E \u0938\u093F\u0901\u091A\u093E\u0907) \u0938\u092E\u094D\u092C\u094B\u0927\u0928 \u0917\u0930\u094D\u0928\u0941\u0939\u094B\u0938\u094D \u0930 \u0905\u0928\u0941\u0915\u0942\u0932\u093F\u0924 \u0915\u093F\u0938\u094D\u092E\u0939\u0930\u0942 \u091B\u093E\u0928\u094D\u0928\u0941\u0939\u094B\u0938\u094D\u0964"
      };
    case "poor":
      return {
        rec: "Potato cultivation at your location faces significant challenges. Specialized varieties, intensive management, and infrastructure (irrigation, drainage, frost protection) are required for viable production.",
        recNe: "\u0924\u092A\u093E\u0908\u0902\u0915\u094B \u0938\u094D\u0925\u093E\u0928\u092E\u093E \u0906\u0932\u0941 \u0916\u0947\u0924\u0940\u0932\u0947 \u092E\u0939\u0924\u094D\u0935\u092A\u0942\u0930\u094D\u0923 \u091A\u0941\u0928\u094C\u0924\u0940\u0939\u0930\u0942\u0915\u094B \u0938\u093E\u092E\u0928\u093E \u0917\u0930\u094D\u091B\u0964 \u0935\u094D\u092F\u093E\u0935\u0939\u093E\u0930\u093F\u0915 \u0909\u0924\u094D\u092A\u093E\u0926\u0928\u0915\u094B \u0932\u093E\u0917\u093F \u0935\u093F\u0936\u0947\u0937 \u0915\u093F\u0938\u094D\u092E\u0939\u0930\u0942, \u0917\u0939\u0928 \u0935\u094D\u092F\u0935\u0938\u094D\u0925\u093E\u092A\u0928, \u0930 \u092A\u0942\u0930\u094D\u0935\u093E\u0927\u093E\u0930 (\u0938\u093F\u0901\u091A\u093E\u0907, \u091C\u0932\u0928\u093F\u0915\u093E\u0938, \u0939\u093F\u092E\u092A\u093E\u0924 \u0938\u0941\u0930\u0915\u094D\u0937\u093E) \u0906\u0935\u0936\u094D\u092F\u0915 \u091B\u0964"
      };
    default:
      return {
        rec: "Your location is not suitable for potato cultivation under current conditions. Consider alternative crops better adapted to your environment, or consult an agricultural extension officer for specialized advice.",
        recNe: "\u0924\u092A\u093E\u0908\u0902\u0915\u094B \u0938\u094D\u0925\u093E\u0928 \u0939\u093E\u0932\u0915\u094B \u0905\u0935\u0938\u094D\u0925\u093E\u092E\u093E \u0906\u0932\u0941 \u0916\u0947\u0924\u0940\u0915\u094B \u0932\u093E\u0917\u093F \u0909\u092A\u092F\u0941\u0915\u094D\u0924 \u091B\u0948\u0928\u0964 \u0924\u092A\u093E\u0908\u0902\u0915\u094B \u0935\u093E\u0924\u093E\u0935\u0930\u0923\u092E\u093E \u0930\u093E\u092E\u094D\u0930\u094B\u0938\u0901\u0917 \u0905\u0928\u0941\u0915\u0942\u0932\u093F\u0924 \u0935\u0948\u0915\u0932\u094D\u092A\u093F\u0915 \u092C\u093E\u0932\u0940\u0939\u0930\u0942 \u0935\u093F\u091A\u093E\u0930 \u0917\u0930\u094D\u0928\u0941\u0939\u094B\u0938\u094D, \u0935\u093E \u0935\u093F\u0936\u0947\u0937 \u0938\u0932\u094D\u0932\u093E\u0939\u0915\u094B \u0932\u093E\u0917\u093F \u0915\u0943\u0937\u093F \u0935\u093F\u0938\u094D\u0924\u093E\u0930 \u0905\u0927\u093F\u0915\u093E\u0930\u0940\u0938\u0901\u0917 \u092A\u0930\u093E\u092E\u0930\u094D\u0936 \u0917\u0930\u094D\u0928\u0941\u0939\u094B\u0938\u094D\u0964"
      };
  }
}
function analyzePotatoSuitability(latitude, longitude, altitudeM) {
  const { tempC, label: tempLabel, labelNe: tempLabelNe } = estimateTemperature(latitude, altitudeM);
  const { zone: rainfallZone, zoneNe: rainfallZoneNe, mmPerYear } = estimateRainfallZone(latitude, altitudeM);
  const { soilType, soilTypeNe } = estimateSoilType(latitude, altitudeM);
  const { season, seasonNe } = estimateGrowingSeason(latitude, altitudeM, tempC);
  const { varieties, varietiesNe } = getRecommendedVarieties(altitudeM, tempC, latitude);
  const { challenges, challengesNe } = getLocalChallenges(altitudeM, tempC, mmPerYear, latitude);
  const { tips, tipsNe } = getGrowingTips(altitudeM, tempC, mmPerYear, latitude);
  const factors = [
    analyzeAltitude(altitudeM),
    analyzeTemperature(tempC),
    analyzeRainfall(mmPerYear, rainfallZone, rainfallZoneNe),
    analyzeSoil(soilType, soilTypeNe),
    analyzeLatitude(latitude),
    analyzeFrostRisk(tempC, altitudeM)
  ];
  const { score, rating } = computeOverall(factors);
  const { rec, recNe } = getRecommendation(rating, altitudeM, latitude);
  const isNepal = latitude >= 26 && latitude <= 30 && longitude >= 80 && longitude <= 88;
  const locationName = isNepal ? "Nepal" : `${latitude.toFixed(2)}\xB0, ${longitude.toFixed(2)}\xB0`;
  return {
    overallScore: score,
    overallRating: rating,
    recommendation: rec,
    recommendationNe: recNe,
    factors,
    recommendedVarieties: varieties,
    recommendedVarietiesNe: varietiesNe,
    localChallenges: challenges,
    localChallengesNe: challengesNe,
    growingTips: tips,
    growingTipsNe: tipsNe,
    growingSeason: season,
    growingSeasonNe: seasonNe,
    estimatedTemperature: tempLabel,
    soilType,
    soilTypeNe,
    rainfallZone,
    rainfallZoneNe,
    latitude,
    longitude,
    altitude: altitudeM,
    locationName
  };
}
function getRatingColor(rating) {
  switch (rating) {
    case "excellent":
      return "#2E7D32";
    case "good":
      return "#558B2F";
    case "moderate":
      return "#F57F17";
    case "poor":
      return "#E65100";
    case "not_suitable":
      return "#B71C1C";
  }
}
function getRatingEmoji(rating) {
  switch (rating) {
    case "excellent":
      return "\u{1F31F}";
    case "good":
      return "\u2705";
    case "moderate":
      return "\u26A0\uFE0F";
    case "poor":
      return "\u274C";
    case "not_suitable":
      return "\u{1F6AB}";
  }
}
export {
  analyzePotatoSuitability,
  getRatingColor,
  getRatingEmoji
};
