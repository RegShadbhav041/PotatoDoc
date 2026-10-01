import React, { useMemo, useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { relativeTime } from "../utils/relativeTime";

const FILTERS = [
  { id: "", label: "All" },
  { id: "update", label: "Updates" },
  { id: "announcement", label: "Announcements" },
  { id: "crop_alert", label: "Crop alerts" },
];

const CATEGORY_LABEL = {
  update: "LATEST UPDATE",
  announcement: "Announcement",
  crop_alert: "Crop alert",
};

const CATEGORY_ICON = {
  update: "sync",
  announcement: "campaign",
  crop_alert: "warning",
};

function NoticeCard({ notice, onPress }) {
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
            color={isUpdate ? "#FFFFFF" : isAlert ? "#F57F17" : "#1565C0"}
          />
        </View>
        <Text
          style={[
            s.catLabel,
            isUpdate && { color: COLORS.primary },
            isAlert && { color: "#F57F17" },
            isAnn && { color: "#1565C0" },
          ]}
        >
          {CATEGORY_LABEL[cat] || "Notice"}
        </Text>
        <View style={s.topSpacer} />
        <Text style={s.timeText}>{relativeTime(notice.created_at)}</Text>
        {unread && <View style={s.unreadDot} />}
      </View>

      <Text style={s.cardTitle}>{notice.title}</Text>
      {!!notice.body && <Text style={s.cardBody}>{notice.body}</Text>}
      <Text style={s.author}>{notice.author_name || "Super Admin"}</Text>
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
  const items = useMemo(
    () => (filter ? notices.filter((n) => n.category === filter) : notices),
    [notices, filter]
  );

  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      {/* Back arrow + centered uppercase title (mockup) */}
      <View style={s.header}>
        <Pressable style={s.iconBtn} onPress={onBack} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={20} color={COLORS.ink} />
        </Pressable>
        <Text style={s.headerTitle}>NEWS &amp; NOTIFICATION</Text>
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
              <Text style={[s.chipText, on && s.chipTextOn]}>{f.label}</Text>
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
            color={filter !== "" ? "#FFFFFF" : COLORS.gray}
          />
        </Pressable>
      </View>

      {/* Dark-green unread banner with Mark all read */}
      {unread > 0 && (
        <View style={s.banner}>
          <View style={s.bannerIcon}>
            <MaterialIcons name="notifications" size={15} color={COLORS.primaryDark} />
          </View>
          <Text style={s.bannerText}>
            {unread} important update{unread === 1 ? " is" : "s are"} unread
          </Text>
          <Pressable onPress={onMarkAllRead} hitSlop={8}>
            <Text style={s.bannerAction}>Mark all read</Text>
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
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {!!error && (
          <View style={s.errorBox}>
            <MaterialIcons name="cloud-off" size={18} color={COLORS.lateBlight} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {loading && notices.length === 0 ? (
          <View style={s.empty}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={s.emptyText}>Loading notices…</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={s.empty}>
            <MaterialIcons name="notifications-none" size={48} color={COLORS.gray} />
            <Text style={s.emptyTitle}>Nothing here yet</Text>
            <Text style={s.emptyText}>
              {filter
                ? "No notices in this category."
                : "News, announcements and crop alerts will show up here."}
            </Text>
          </View>
        ) : (
          items.map((notice) => (
            <NoticeCard key={notice.id} notice={notice} onPress={onMarkRead} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.pageGreen },
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
    color: COLORS.ink,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  chipOn: { backgroundColor: COLORS.authBtn, borderColor: COLORS.authBtn },
  chipText: { fontSize: 12.5, fontWeight: "700", color: COLORS.gray },
  chipTextOn: { color: "#FFFFFF" },
  funnelBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
  funnelBtnOn: { backgroundColor: COLORS.authBtn, borderColor: COLORS.authBtn },

  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.authBtn,
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
    backgroundColor: "#FDECEC",
    borderWidth: 1,
    borderColor: "#F5C6C6",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  errorText: { flex: 1, fontSize: 13, fontWeight: "600", color: COLORS.lateBlight },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 14,
    marginBottom: 10,
  },
  cardUnread: { borderColor: COLORS.greenDot, backgroundColor: "#FDFEFC" },
  cardTop: { flexDirection: "row", alignItems: "center", marginBottom: 9 },
  iconTile: {
    width: 27,
    height: 27,
    borderRadius: 8,
    backgroundColor: COLORS.leafBg,
    alignItems: "center",
    justifyContent: "center",
  },
  iconTileUpdate: { backgroundColor: COLORS.primaryDark },
  iconTileAlert: { backgroundColor: COLORS.earlyBg },
  iconTileAnn: { backgroundColor: "#E3F2FD" },
  catLabel: {
    fontSize: 11.5,
    fontWeight: "800",
    letterSpacing: 0.3,
    color: COLORS.primary,
    marginLeft: 8,
  },
  topSpacer: { flex: 1 },
  timeText: { fontSize: 12, fontWeight: "600", color: COLORS.gray },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.greenDot,
    marginLeft: 7,
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
    color: COLORS.ink,
    letterSpacing: -0.2,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: COLORS.gray,
    marginTop: 5,
  },
  author: {
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: "800",
    color: COLORS.primaryDark,
    textDecorationLine: "underline",
    marginTop: 9,
  },

  empty: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: COLORS.ink },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: COLORS.gray,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
