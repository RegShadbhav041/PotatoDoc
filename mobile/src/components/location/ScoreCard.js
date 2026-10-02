// Result header: score ring + band + place + altitude + coords (ss 5).
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "../../theme";
import { fmt } from "../../utils/locationText";

const BAND_EMOJI = { Excellent: "🌞", Good: "😊", Fair: "😐", Poor: "😟" };

export default function ScoreCard({ data, t }) {
  const C = useColors();
  const s = StyleSheet.create({
    card: {
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 16,
      marginBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 18,
    },
    ring: {
      width: 104,
      height: 104,
      borderRadius: 52,
      borderWidth: 4,
      borderColor: C.primary,
      backgroundColor: C.card,
      alignItems: "center",
      justifyContent: "center",
    },
    emoji: { fontSize: 22 },
    score: { fontSize: 30, fontWeight: "900", color: C.primary, lineHeight: 34 },
    outOf: { fontSize: 12.5, fontWeight: "700", color: C.gray },
    info: { flex: 1 },
    band: { fontSize: 22, fontWeight: "900", color: C.primaryDark, marginBottom: 4 },
    place: { fontSize: 15, fontWeight: "700", color: C.ink },
    alt: { fontSize: 15, fontWeight: "700", color: C.healthyText, marginTop: 3 },
    coords: { fontSize: 13, fontWeight: "600", color: C.gray, marginTop: 2 },
  });
  return (
    <View style={s.card}>
      <View style={s.ring}>
        <Text style={s.emoji}>{BAND_EMOJI[data.band] || "🌞"}</Text>
        <Text style={s.score}>{data.score}</Text>
        <Text style={s.outOf}>/100</Text>
      </View>
      <View style={s.info}>
        <Text style={s.band}>{t(data.band)}</Text>
        <Text style={s.place}>📍 {t(data.place)}</Text>
        <Text style={s.alt}>⛰️ {fmt(t("{n}m altitude"), { n: data.altitude_m })}</Text>
        <Text style={s.coords}>
          {data.coords.lat.toFixed(4)}°, {data.coords.lon.toFixed(4)}°
        </Text>
      </View>
    </View>
  );
}
