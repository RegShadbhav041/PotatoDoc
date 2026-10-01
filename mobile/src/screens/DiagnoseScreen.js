import React, { useState, useEffect, useCallback } from "react";
import { View, ScrollView, Image, Platform, StyleSheet, Pressable } from "react-native";
import { Text, Button, Card } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import ModelPicker from "../components/ModelPicker";
import ImagePickerSection from "../components/ImagePickerSection";
import LoadingIndicator from "../components/LoadingIndicator";
import PredictionResult from "../components/PredictionResult";
import { useWakeUp, useModels, usePrediction, fetchGradcam } from "../hooks/useApi";
import { COLORS } from "../constants/colors";

export default function DiagnoseScreen({ addEntry, onOpenNews, unread = 0 }) {
  const [imageUri, setImageUri] = useState(null);
  const [selectedModel, setSelectedModel] = useState("convnext_plantvillage");
  const [result, setResult] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [ensembleHeatmaps, setEnsembleHeatmaps] = useState(null);
  const [heatmapPhase, setHeatmapPhase] = useState(false);
  const [saved, setSaved] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);

  const { wakeStatus, warmupProgress, wakeUp } = useWakeUp();
  const { models, modelNames, defaultModel } = useModels();
  const { processing, heatmapsLoading, error, setError, predict, setProcessing, setHeatmapsLoading } =
    usePrediction();

  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        try {
          await ImagePicker.requestCameraPermissionsAsync();
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        } catch (e) {
          console.warn("permission request failed", e);
        }
      }
      await wakeUp(selectedModel);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (defaultModel) setSelectedModel((prev) => (prev === "convnext_plantvillage" ? defaultModel : prev));
  }, [defaultModel]);

  const resetPrediction = useCallback(() => {
    setResult(null);
    setHeatmap(null);
    setEnsembleHeatmaps(null);
    setSaved(false);
    setError(null);
  }, [setError]);

  const handleModelChange = useCallback(
    (id) => {
      setSelectedModel(id);
      resetPrediction();
    },
    [resetPrediction]
  );

  const pickImage = useCallback(
    async (useCamera) => {
      try {
        const opts = { allowsEditing: false, quality: 1 };
        const res = useCamera
          ? await ImagePicker.launchCameraAsync(opts)
          : await ImagePicker.launchImageLibraryAsync(opts);
        if (!res.canceled && res.assets?.[0]?.uri) {
          setImageUri(res.assets[0].uri);
          resetPrediction();
        }
      } catch (e) {
        setError(e?.message || "Image picker failed.");
      }
    },
    [resetPrediction, setError]
  );

  useEffect(() => {
    if (!imageUri) return;
    let cancelled = false;
    (async () => {
      setProcessing(true);
      setHeatmap(null);
      setEnsembleHeatmaps(null);
      setSaved(false);
      setError(null);
      try {
        const data = await predict(imageUri, selectedModel);
        if (cancelled) return;
        setResult(data);
        const unknown = data?.is_unknown || data?.class === "Unknown";
        if (!unknown) {
          setHeatmapPhase(true);
          setHeatmapsLoading(true);
          try {
            const h = await fetchGradcam(imageUri, selectedModel);
            if (cancelled) return;
            if (h?.heatmaps) setEnsembleHeatmaps(h);
            else setHeatmap(h);
          } catch (e) {
            console.warn("gradcam failed (non-fatal)", e?.message);
          } finally {
            if (!cancelled) {
              setHeatmapsLoading(false);
              setHeatmapPhase(false);
            }
          }
        }
      } catch (e) {
        if (!cancelled) console.warn("predict failed", e?.message);
      } finally {
        if (!cancelled) setProcessing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [imageUri, selectedModel]);

  const handleNext = () => {
    setImageUri(null);
    resetPrediction();
  };

  const displayName =
    selectedModel === "ensemble" ? "Ensemble (All Models)" : modelNames[selectedModel] || selectedModel;

  const isUnknown = result?.is_unknown || result?.class === "Unknown";
  const saveable = result && !isUnknown && !saved;

  const handleSave = async () => {
    if (!saveable || !addEntry) return;
    // heatmap intentionally NOT stored: base64 overlays bloat the AsyncStorage
    // row past Android's CursorWindow and made history unreadable before.
    const item = await addEntry({ ...result, model: displayName, imageUri });
    if (item) setSaved(true);
    else setError("History storage could not be read — entry NOT saved (existing data protected).");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.pageGreen }} edges={["top", "left", "right"]}>
      <ScrollView>
        {/* Designer mockup "diagnosis": title + subtitle left, bell right */}
        <View style={s.header}>
          <View style={s.flex}>
            <Text style={s.screenTitle}>Diagnose a leaf</Text>
            <Text style={s.screenSub}>AI-assisted crop check</Text>
          </View>
          <Pressable style={s.bellBtn} onPress={onOpenNews} hitSlop={8}>
            <MaterialIcons name="notifications-none" size={20} color={COLORS.ink} />
            {unread > 0 && (
              <View style={s.bellBadge}>
                <Text style={s.bellBadgeText}>{unread > 9 ? "9+" : unread}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {wakeStatus !== "Ready" && (
          <Card style={{ margin: 16 }}>
            <Card.Content>
              <Text>{wakeStatus || "Connecting..."}</Text>
              {warmupProgress && (
                <Text>
                  Loading models... {warmupProgress.done}/{warmupProgress.total}
                </Text>
              )}
            </Card.Content>
          </Card>
        )}

        <ModelPicker
          models={models.includes("ensemble") ? models : ["ensemble", ...models]}
          modelNames={modelNames}
          selectedModel={selectedModel}
          onSelect={handleModelChange}
        />

        {imageUri && (
          <View style={{ alignItems: "center", marginTop: 12 }}>
            <Image source={{ uri: imageUri }} style={{ width: 220, height: 220, borderRadius: 12 }} />
          </View>
        )}

        <ImagePickerSection onCamera={() => pickImage(true)} onGallery={() => pickImage(false)} />

        {processing && <LoadingIndicator heatmapPhase={heatmapPhase} />}
        {heatmapsLoading && !processing && <LoadingIndicator heatmapPhase />}
        {error && (
          <Card style={{ margin: 16 }}>
            <Card.Content>
              <Text style={{ color: "#B71C1C" }}>{error}</Text>
            </Card.Content>
          </Card>
        )}

        {result && !processing && (
          <PredictionResult
            data={result}
            heatmap={heatmap}
            ensembleHeatmaps={ensembleHeatmaps}
            modelLabel={displayName}
          />
        )}

        {(result || imageUri) && (
          <View style={{ flexDirection: "row", justifyContent: "space-evenly", margin: 16 }}>
            <Button mode="outlined" onPress={handleNext}>
              Next Image
            </Button>
            <Button mode="contained" onPress={handleSave} disabled={!saveable}>
              {saved ? "Saved!" : "Save to History"}
            </Button>
          </View>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 10,
  },
  screenTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: COLORS.ink,
    letterSpacing: -0.3,
  },
  screenSub: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    color: COLORS.gray,
    marginTop: 2,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: COLORS.bellBadge,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.pageGreen,
  },
  bellBadgeText: { fontSize: 10, fontWeight: "800", color: "#FFFFFF" },
});
