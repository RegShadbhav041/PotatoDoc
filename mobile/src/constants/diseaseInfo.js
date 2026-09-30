// Disease advice content. Keys must match backend class strings exactly:
// "Early Blight" | "Late Blight" | "Healthy" (plus Unknown handled separately).
export const diseaseInfo = {
  "Early Blight": {
    description:
      "Early blight is caused by the fungus Alternaria solani. It appears as dark brown concentric target spots, usually on older lower leaves first, and spreads upward in warm, humid weather.",
    symptoms: [
      "Dark brown circular spots with concentric rings (target pattern)",
      "Yellow halo around spots",
      "Starts on older, lower leaves",
      "Leaves dry, turn yellow and drop in severe cases",
    ],
    treatment: [
      "Remove and destroy affected leaves (do not compost)",
      "Apply recommended fungicide (e.g. mancozeb or chlorothalonil) per local extension advice",
      "Water at the base, avoid wetting leaves",
      "Rotate crops — avoid planting potato/tomato in the same soil consecutively",
      "Ensure good spacing and airflow between plants",
    ],
  },
  "Late Blight": {
    description:
      "Late blight is caused by Phytophthora infestans — the pathogen behind the Irish Potato Famine. It spreads very fast in cool, wet weather and can destroy a whole field in days.",
    symptoms: [
      "Water-soaked pale-green to brown-black irregular lesions",
      "White mold on leaf underside in humid conditions",
      "Lesions spread rapidly to stems and tubers",
      "Rotting smell in severe infections",
    ],
    treatment: [
      "Act immediately — isolate and destroy infected plants",
      "Apply systemic fungicide (e.g. metalaxyl + mancozeb) per local extension advice",
      "Never overhead-irrigate; improve drainage",
      "Monitor nearby fields — spores spread by wind and rain",
      "Plant certified disease-free seed next season",
    ],
  },
  Healthy: {
    description:
      "The leaf looks healthy with no visible signs of early or late blight. Keep up good practices to keep it that way.",
    symptoms: [
      "Uniform green colour",
      "No spots, lesions or mold",
      "Intact veins and leaf edges",
    ],
    treatment: [
      "Continue regular scouting (check leaves weekly)",
      "Water at the base in the morning",
      "Mulch to prevent soil splash on leaves",
      "Fertilize as recommended — avoid excess nitrogen",
    ],
  },
};
