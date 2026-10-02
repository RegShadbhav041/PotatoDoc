import React, { useMemo, useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { API_BASE } from "../hooks/useApi";
import { useColors } from "../theme";
import { useT } from "../i18n";
import { relativeTime } from "../utils/relativeTime";

const FILTERS = [
  { id: "", label: "All" },
  { id: "update", label: "Updates" },
  { id: "announcement", label: "Announcements" },
  { id: "crop_alert", label: "Crop alerts" },
  { id: "new_product", label: "New products" },
  { id: "medicine", label: "Medicines" },
];

const CATEGORY_LABEL = {
  update: "LATEST UPDATE",
  announcement: "Announcement",
  crop_alert: "Crop alert",
  new_product: "New product",
  medicine: "Medicine",
};

const CATEGORY_ICON = {
  update: "sync",
  announcement: "campaign",
  crop_alert: "warning",
  new_product: "inventory-2",
  medicine: "local-pharmacy",
};

const makeStyles = (C) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.pageGreen },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 8,
      gap: 8,
    },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      fontSize: 14,
      fontWeight: "800",
      letterSpacing: 1.2,
      color: C.ink,
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    iconBtnGhost: { width: 36, height: 36 },

    filters: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 16,
      marginTop: 14,
      marginBottom: 4,
    },
    chip: {
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
      borderRadius: 999,
      paddingHorizontal: 13,
      paddingVertical: 7,
    },
    chipOn: { backgroundColor: C.deepGreen, borderColor: C.deepGreen },
    chipText: { fontSize: 12.5, fontWeight: "700", color: C.gray },
    chipTextOn: { color: "#FFFFFF" },
    funnelBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: "auto",
    },
    funnelBtnOn: { backgroundColor: C.deepGreen, borderColor: C.deepGreen },

    banner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: C.deepGreen,
      borderRadius: 14,
      padding: 12,
      marginHorizontal: 16,
      marginTop: 12,
    },
    bannerIcon: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
    },
    bannerText: {
      flex: 1,
      fontSize: 13.5,
      lineHeight: 18,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    bannerAction: { fontSize: 13, fontWeight: "800", color: "#FFFFFF" },

    scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28 },

    errorBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: C.lateBg,
      borderWidth: 1,
      borderColor: C.lateBorder,
      borderRadius: 12,
      padding: 10,
      marginBottom: 12,
    },
    errorText: { flex: 1, fontSize: 13, fontWeight: "600", color: C.lateBlight },

    card: {
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 14,
      marginBottom: 10,
    },
    cardUnread: { borderColor: C.greenDot, backgroundColor: C.cardUnread },
    cardTop: { flexDirection: "row", alignItems: "center", marginBottom: 9 },
    iconTile: {
      width: 27,
      height: 27,
      borderRadius: 8,
      backgroundColor: C.leafBg,
      alignItems: "center",
      justifyContent: "center",
    },
    iconTileUpdate: { backgroundColor: C.updateTile },
    iconTileAlert: { backgroundColor: C.earlyBg },
    iconTileAnn: { backgroundColor: C.annTile },
    catLabel: {
      fontSize: 11.5,
      fontWeight: "800",
      letterSpacing: 0.3,
      color: C.primary,
      marginLeft: 8,
    },
    topSpacer: { flex: 1 },
    timeText: { fontSize: 12, fontWeight: "600", color: C.gray },
    unreadDot: {
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: C.greenDot,
      marginLeft: 7,
    },
    cardTitle: {
      fontSize: 16,
      lineHeight: 21,
      fontWeight: "800",
      color: C.ink,
      letterSpacing: -0.2,
    },
    cardBody: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "500",
      color: C.gray,
      marginTop: 5,
    },
    author: {
      fontSize: 12.5,
      lineHeight: 17,
      fontWeight: "800",
      color: C.primaryDark,
      textDecorationLine: "underline",
      marginTop: 9,
    },
    gallery: { marginTop: 10, marginHorizontal: -2 },
    galleryRow: { gap: 8, paddingHorizontal: 2 },
    galleryImg: {
      width: 190,
      height: 130,
      borderRadius: 12,
      backgroundColor: C.leafBg,
    },

    empty: { alignItems: "center", paddingTop: 60, gap: 8 },
    emptyTitle: { fontSize: 16, fontWeight: "800", color: C.ink },
    emptyText: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "500",
      color: C.gray,
      textAlign: "center",
      paddingHorizontal: 40,
    },
  });

function NoticeCard({ s, t, C, notice, onPress }) {
  const unread = !notice.read;
  const cat = notice.category;
  const isUpdate = cat === "update";
  const isAlert = cat === "crop_alert";
  const isAnn = cat === "announcement";
  return (
    <Pressable
      style={[s.card, unread && s.cardUnread]}
      onPress={() => onPress(notice)}
    >
      <View style={s.cardTop}>
        <View
          style={[
            s.iconTile,
            isUpdate && s.iconTileUpdate,
            isAlert && s.iconTileAlert,
            isAnn && s.iconTileAnn,
          ]}
        >
          <MaterialIcons
            name={CATEGORY_ICON[cat] || "notifications"}
            size={15}
            color={isUpdate ? "#FFFFFF" : isAlert ? C.alertInk : C.annInk}
          />
        </View>
        <Text
          style={[
            s.catLabel,
            isUpdate && { color: C.primary },
            isAlert && { color: C.alertInk },
            isAnn && { color: C.annInk },
          ]}
        >
          {t(CATEGORY_LABEL[cat] || "Notice")}
        </Text>
        <View style={s.topSpacer} />
        <Text style={s.timeText}>{relativeTime(notice.created_at)}</Text>
        {unread && <View style={s.unreadDot} />}
      </View>

      {/* Notice title/body are admin-authored content — never translated. */}
      <Text style={s.cardTitle}>{notice.title}</Text>
      {!!notice.body && <Text style={s.cardBody}>{notice.body}</Text>}
      {/* Notice pictures: horizontal strip, loaded lazily from the public route. */}
      {notice.image_count > 0 && (
        <ScrollView
          horizontal
          style={s.gallery}
          contentContainerStyle={s.galleryRow}
          showsHorizontalScrollIndicator={false}
        >
          {Array.from({ length: notice.image_count }, (_, i) => (
            <Image
              key={i}
              source={{ uri: `${API_BASE}/notices/${notice.id}/images/${i}` }}
              style={s.galleryImg}
            />
          ))}
        </ScrollView>
      )}
      <Text style={s.author}>{notice.author_name || t("Super Admin")}</Text>
    </Pressable>
  );
}

export default function NewsScreen({
  notices,
  unread,
  loading,
  refreshing,
  error,
  onRefresh,
  onMarkRead,
  onMarkAllRead,
  onBack,
}) {
  const [filter, setFilter] = useState("");
  const C = useColors();
  const t = useT();
  const s = useMemo(() => makeStyles(C), [C]);
  const items = useMemo(
    () => (filter ? notices.filter((n) => n.category === filter) : notices),
    [notices, filter]
  );

  const bannerKey =
    unread === 1 ? "{n} important update is unread" : "{n} important updates are unread";

  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      {/* Back arrow + centered uppercase title (mockup) */}
      <View style={s.header}>
        <Pressable style={s.iconBtn} onPress={onBack} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={20} color={C.ink} />
        </Pressable>
        <Text style={s.headerTitle}>{t("NEWS & NOTIFICATION")}</Text>
        <View style={s.iconBtnGhost} />
      </View>

      {/* Category chips + funnel (clears the filter) */}
      <View style={s.filters}>
        {FILTERS.map((f) => {
          const on = filter === f.id;
          return (
            <Pressable
              key={f.id || "all"}
              style={[s.chip, on && s.chipOn]}
              onPress={() => setFilter(f.id)}
            >
              <Text style={[s.chipText, on && s.chipTextOn]}>{t(f.label)}</Text>
            </Pressable>
          );
        })}
        <Pressable
          style={[s.funnelBtn, filter !== "" && s.funnelBtnOn]}
          onPress={() => setFilter("")}
          hitSlop={8}
        >
          <MaterialIcons
            name="filter-list"
            size={16}
            color={filter !== "" ? "#FFFFFF" : C.gray}
          />
        </Pressable>
      </View>

      {/* Dark-green unread banner with Mark all read */}
      {unread > 0 && (
        <View style={s.banner}>
          <View style={s.bannerIcon}>
            <MaterialIcons name="notifications" size={15} color={C.primaryDark} />
          </View>
          <Text style={s.bannerText}>{t(bannerKey).replace("{n}", String(unread))}</Text>
          <Pressable onPress={onMarkAllRead} hitSlop={8}>
            <Text style={s.bannerAction}>{t("Mark all read")}</Text>
          </Pressable>
        </View>
      )}

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
      >
        {!!error && (
          <View style={s.errorBox}>
            <MaterialIcons name="cloud-off" size={18} color={C.lateBlight} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {loading && notices.length === 0 ? (
          <View style={s.empty}>
            <ActivityIndicator color={C.primary} />
            <Text style={s.emptyText}>{t("Loading notices…")}</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={s.empty}>
            <MaterialIcons name="notifications-none" size={48} color={C.gray} />
            <Text style={s.emptyTitle}>{t("Nothing here yet")}</Text>
            <Text style={s.emptyText}>
              {filter
                ? t("No notices in this category.")
                : t("News, announcements and crop alerts will show up here.")}
            </Text>
          </View>
        ) : (
          items.map((notice) => (
            <NoticeCard
              key={notice.id}
              s={s}
              t={t}
              C={C}
              notice={notice}
              onPress={onMarkRead}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
