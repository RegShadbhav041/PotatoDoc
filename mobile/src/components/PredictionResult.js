import React, { useMemo, useState } from "react";
import { View, Image, StyleSheet } from "react-native";
import { Text, Card, Divider, List } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { classColors } from "../constants/colors";
import { useColors } from "../theme";
import { useT } from "../i18n";
import { diseaseInfo } from "../constants/diseaseInfo";

const ORDER = ["Early Blight", "Late Blight", "Healthy"];
const BAR_COLORS = {
  "Early Blight": "#C62828",
  "Late Blight": "#E65100",
  Healthy: "#2E7D32",
};

function pct(x) {
  if (x == null) return "—";
  const v = x <= 1 ? x * 100 : x;
  return `${v.toFixed(2)}%`;
}

export default function PredictionResult({ data, heatmap, ensembleHeatmaps, modelLabel }) {
  const [heatmapOpen, setHeatmapOpen] = useState(true);
  const C = useColors();
  const t = useT();
  const styles = useMemo(() => makeStyles(C), [C]);
  const CLASS_COLORS = useMemo(() => classColors(C), [C]);
  if (!data) return null;

  const cls = data.class;
  const isUnknown = data.is_unknown || cls === "Unknown";

  if (isUnknown) {
    return (
      <Card style={styles.card}>
        <Card.Content style={{ alignItems: "center" }}>
          <MaterialCommunityIcons name="alert" size={44} color={C.unknownOrange} />
          <Text style={styles.unknownTitle}>{t("Unknown Image")}</Text>
          <Text>
            {data.message || t("This does not look like a potato leaf the model recognises.")}
          </Text>
          {data.confidence != null && (
            <Text style={{ marginTop: 6 }}>
              {t("Confidence")}: {pct(data.confidence)}
            </Text>
          )}
          <Card style={styles.suggestBox}>
            <Card.Content>
              <Text style={{ fontWeight: "700" }}>{t("Suggestions:")}</Text>
              <Text>
                - Take a clear potato-leaf photo{"\n"}- Fill the frame with the leaf{"\n"}- Use good light{"\n"}- Avoid blurred / non-plant images
              </Text>
            </Card.Content>
          </Card>
        </Card.Content>
      </Card>
    );
  }

  const headerColor = cls === "Healthy" ? C.healthyText : C.lateBlight;
  const probs = data.probabilities || {};
  const conf = data.confidence;
  const lowConf = conf != null && (conf <= 1 ? conf * 100 : conf) < 70;

  const singleOverlay = heatmap?.overlay || heatmap?.heatmap || null;

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={[styles.header, { color: headerColor }]}>
          {t("Prediction Result")}
        </Text>
        <View style={styles.chipRow}>
          <View style={[styles.chip, { backgroundColor: CLASS_COLORS[cls] || C.primary }]}>
            <Text style={styles.chipText}>{cls}</Text>
          </View>
          <Text style={styles.confText}>
            {t("Confidence")} {pct(conf)}
          </Text>
        </View>
        {modelLabel ? (
          <Text style={{ color: C.textLight }}>
            {t("Model")}: {modelLabel}
          </Text>
        ) : null}

        <Text style={styles.section}>{t("Per-Class Probabilities")}</Text>
        {ORDER.map((name) => {
          const p = probs[name] ?? probs[name.toLowerCase()] ?? 0;
          const v = p <= 1 ? p * 100 : p;
          const isPred = name === cls;
          return (
            <View key={name} style={{ marginVertical: 4, opacity: isPred ? 1 : 0.4 }}>
              <View style={styles.probRow}>
                <Text>
                  {name} {isPred ? "←" : ""}
                </Text>
                <Text>{pct(p)}</Text>
              </View>
              <View style={styles.barBg}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${Math.min(100, v)}%`, backgroundColor: BAR_COLORS[name] },
                  ]}
                />
              </View>
            </View>
          );
        })}

        {lowConf && (
          <View style={styles.lowBox}>
            <Text>
              {t(
                "The model is not very confident. Retake the photo with better light and focus, or try another leaf."
              )}
            </Text>
          </View>
        )}

        {Array.isArray(data.individual) && data.individual.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.section}>{t("Ensemble Members")}</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.th}>{t("Model")}</Text>
              <Text style={styles.th}>{t("Label")}</Text>
              <Text style={styles.th}>{t("Confidence")}</Text>
            </View>
            {data.individual.map((m, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.td}>{m.model}</Text>
                <Text style={styles.td}>{m.class}</Text>
                <Text style={styles.td}>{pct(m.confidence)}</Text>
              </View>
            ))}
          </View>
        )}

        <List.Accordion
          title={t("Explainable AI - Heatmap")}
          description={t("Red = high influence on the decision")}
          expanded={heatmapOpen}
          onPress={() => setHeatmapOpen(!heatmapOpen)}
          left={(props) => <List.Icon {...props} icon="fire" />}
        >
          {singleOverlay ? (
            <View style={{ alignItems: "center" }}>
              <Image source={{ uri: singleOverlay }} style={{ width: 200, height: 200 }} resizeMode="contain" />
              <Text style={styles.caption}>{t("Grad-CAM visualization. Red regions influenced the prediction most.")}</Text>
            </View>
          ) : ensembleHeatmaps ? (
            <View>
              {Object.entries(ensembleHeatmaps?.heatmaps || ensembleHeatmaps).map(([name, h]) => {
                const uri = h?.overlay || h?.heatmap || h;
                if (typeof uri !== "string") return null;
                return (
                  <View key={name} style={{ alignItems: "center", marginVertical: 6 }}>
                    <Text style={{ fontWeight: "600" }}>{name}</Text>
                    <Image source={{ uri }} style={{ width: 200, height: 200 }} resizeMode="contain" />
                  </View>
                );
              })}
              <Text style={styles.caption}>{t("Grad-CAM visualization. Red regions influenced the prediction most.")}</Text>
            </View>
          ) : (
            <Text>{t("No heatmap available.")}</Text>
          )}
        </List.Accordion>

        {diseaseInfo[cls] && (
          <View style={{ marginTop: 8 }}>
            <Divider />
            <Text style={styles.section}>{t(`About ${cls}`)}</Text>
            <Text>{diseaseInfo[cls].description}</Text>
            <Text style={styles.sub}>{t("Symptoms:")}</Text>
            {diseaseInfo[cls].symptoms.map((s, i) => (
              <Text key={i}>• {s}</Text>
            ))}
            <Text style={styles.sub}>
              {t(cls === "Healthy" ? "Care Tips:" : "Treatment & Mitigation:")}
            </Text>
            {diseaseInfo[cls].treatment.map((s, i) => (
              <Text key={i}>• {s}</Text>
            ))}
          </View>
        )}
      </Card.Content>
    </Card>
  );
}const makeStyles = (C) =>
  StyleSheet.create({
    card: { margin: 16 },
    header: { fontSize: 20, fontWeight: "800", marginBottom: 8 },
    chipRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
    chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
    chipText: { color: "#fff", fontWeight: "700" },
    confText: { fontWeight: "600" },
    section: { fontWeight: "700", marginTop: 12, marginBottom: 4, color: C.ink },
    sub: { fontWeight: "700", marginTop: 8, color: C.ink },
    probRow: { flexDirection: "row", justifyContent: "space-between" },
    barBg: { height: 8, backgroundColor: C.cardBorder, borderRadius: 4, marginTop: 2 },
    barFill: { height: 8, borderRadius: 4 },
    lowBox: {
      backgroundColor: C.lowConfYellow,
      borderColor: C.lowConfBorder,
      borderWidth: 1,
      borderRadius: 8,
      padding: 10,
      marginTop: 10,
    },
    tableHeader: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
    tableRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
    th: { fontWeight: "700", flex: 1, color: C.ink },
    td: { flex: 1, color: C.ink },
    caption: { color: C.gray, fontSize: 12, textAlign: "center", marginTop: 6 },
    unknownTitle: { fontSize: 20, fontWeight: "800", marginVertical: 8, color: C.ink },
    suggestBox: { marginTop: 12, width: "100%" },
  });
