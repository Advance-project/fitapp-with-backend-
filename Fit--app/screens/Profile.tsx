import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  TextInput,
  Alert,
  Platform,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { deleteAccount } from "./userStore";
import { authApi, clearToken } from "../services/api";
import { BarChart } from "react-native-chart-kit";

const MUSCLE_GROUPS = [
  "Back",
  "Biceps",
  "Chest",
  "Triceps",
  "Shoulder",
  "Abs",
  "Legs",
  "Cardio",
] as const;

const CHART_LABELS = ["Back", "Bcps", "Chst", "Tri", "Shld", "Abs", "Legs", "Crdo"];

const WEEKLY_SUMMARY = [
  {
    title: "Last Week",
    sets: [8, 6, 10, 5, 7, 4, 12, 3],
  },
  {
    title: "Current Week",
    sets: [6, 4, 8, 6, 5, 3, 9, 2],
  },
  {
    title: "Upcoming Week",
    sets: [7, 5, 9, 5, 6, 4, 10, 3],
  },
] as const;

// Returns a segment count so Y-axis ticks land on round numbers
function getChartSegments(sets: readonly number[]): number {
  const max = Math.max(...sets);
  if (max <= 5)  return 5;   // step = 1
  if (max <= 10) return 5;   // step = 2
  if (max <= 20) return 4;   // step = 5
  if (max <= 50) return 5;   // step = 10
  return 5;                  // step = max/5
}

export default function Profile() {
  const navigation = useNavigation<any>();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.max(screenWidth - 28, 0);

  const [weeklyIndex, setWeeklyIndex] = useState(1);
  const [weeklyChartWidth, setWeeklyChartWidth] = useState(0);
  const [me, setMe] = useState<{ email: string; username: string } | null>(null);
  const [draftEmail, setDraftEmail] = useState("");
  const [draftUsername, setDraftUsername] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const weeklyScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!cardWidth) return;
    weeklyScrollRef.current?.scrollTo({ x: cardWidth, animated: false });
  }, [cardWidth]);

  useEffect(() => {
    let mounted = true;
    authApi
      .getMe()
      .then((u) => {
        if (!mounted) return;
        setMe({ email: u.email, username: u.username });
        setDraftEmail(u.email);
        setDraftUsername(u.username);
      })
      .catch(() => {
        // Keep profile usable even if /auth/me temporarily fails.
      });
    return () => {
      mounted = false;
    };
  }, []);

  const startEditingProfile = () => {
    if (!me) return;
    setDraftEmail(me.email);
    setDraftUsername(me.username);
    setEditOpen(true);
  };

  const cancelEditingProfile = () => {
    if (!me) return;
    setDraftEmail(me.email);
    setDraftUsername(me.username);
    setEditOpen(false);
  };

  const saveProfile = async () => {
    if (!me) return;
    const fields: { email?: string; username?: string } = {};
    if (draftEmail.trim() && draftEmail.trim() !== me.email) {
      fields.email = draftEmail.trim();
    }
    if (draftUsername.trim() && draftUsername.trim() !== me.username) {
      fields.username = draftUsername.trim();
    }
    if (Object.keys(fields).length === 0) {
      setEditOpen(false);
      return;
    }
    try {
      setSavingProfile(true);
      const updated = await authApi.updateMe(fields);
      setMe({ email: updated.email, username: updated.username });
      setDraftEmail(updated.email);
      setDraftUsername(updated.username);
      setEditOpen(false);
    } catch (e: any) {
      Alert.alert("Profile Update Failed", e?.message ?? "Could not update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    const performDelete = async () => {
      try {
        await authApi.deleteMe();
      } catch (_) {
        // proceed even if the server call fails (e.g. token already expired)
      }
      await clearToken();
      deleteAccount();
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    };

    if (Platform.OS === "web") {
      const confirmed = globalThis.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      );
      if (!confirmed) return;
      await performDelete();
      return;
    }

    Alert.alert(
      "Delete account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: performDelete,
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerLeft}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Profile</Text>

          <TouchableOpacity style={styles.headerRight} onPress={startEditingProfile}>
            <Text style={styles.headerLink}>Edit</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          
          <View style={styles.profileCard}>
            <View style={styles.profileTop}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>U</Text>
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.userName}>{me?.username || "User"}</Text>
                <Text style={styles.userSub}>{me?.email || "user@example.com"}</Text>
              </View>
            </View>

          </View>

          <Text style={styles.weeklyTitle}>Weekly Sets Summary</Text>

          <ScrollView
            ref={weeklyScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / cardWidth);
              setWeeklyIndex(index);
            }}
          >
            {WEEKLY_SUMMARY.map((week) => (
              <View key={week.title} style={[styles.weeklyCard, { width: cardWidth }]}>
                <Text style={styles.weeklyCardTitle}>{week.title}</Text>
                <View
                  style={styles.weeklyChartWrap}
                  onLayout={(e) => {
                    const nextWidth = Math.floor(e.nativeEvent.layout.width);
                    if (nextWidth > 0 && nextWidth !== weeklyChartWidth) {
                      setWeeklyChartWidth(nextWidth);
                    }
                  }}
                >
                  {weeklyChartWidth > 0 ? (
                    <BarChart
                      key={`${week.title}-${weeklyChartWidth}`}
                      data={{
                        labels: CHART_LABELS,
                        datasets: [{ data: [...week.sets] }],
                      }}
                      width={weeklyChartWidth}
                      height={200}
                      yAxisLabel=""
                      yAxisSuffix=" sets"
                      fromZero
                      segments={getChartSegments(week.sets)}
                      showValuesOnTopOfBars
                      chartConfig={{
                        backgroundColor: "#fff",
                        backgroundGradientFrom: "#fff",
                        backgroundGradientTo: "#fff",
                        decimalPlaces: 0,
                        color: () => "#1e88e5",
                        labelColor: () => "#7a889c",
                        barPercentage: 0.35,
                        propsForBackgroundLines: {
                          stroke: "#e9eef6",
                          strokeWidth: 1,
                        },
                        propsForLabels: {
                          fontSize: 9,
                          fontWeight: "700",
                        },
                      }}
                      style={styles.weeklyChart}
                    />
                  ) : null}
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.dotsRow}>
            {WEEKLY_SUMMARY.map((_, i) => (
              <View key={i} style={[styles.dot, i === weeklyIndex && styles.dotActive]} />
            ))}
          </View>

          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.85}
            onPress={() => navigation.replace("Login")}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            activeOpacity={0.85}
            onPress={handleDeleteAccount}
          >
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>

          <View style={{ height: 30 }} />
        </ScrollView>

        <Modal transparent visible={editOpen} animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={cancelEditingProfile}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <View style={styles.modalTop}>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={cancelEditingProfile}>
                  <Text style={styles.modalClose}>X</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                value={draftUsername}
                onChangeText={setDraftUsername}
                autoCapitalize="none"
                style={styles.input}
                placeholder="Username"
              />

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                value={draftEmail}
                onChangeText={setDraftEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                placeholder="Email"
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={cancelEditingProfile} disabled={savingProfile}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={saveProfile} disabled={savingProfile}>
                  <Text style={styles.saveBtnText}>{savingProfile ? "Saving..." : "Save"}</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f7fb" },
  screen: { flex: 1 },

  header: {
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  headerLeft: {
    width: 44,
    height: 36,
    justifyContent: "center",
  },
  headerRight: {
    width: 44,
    height: 36,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  headerLink: {
    fontSize: 17,
    color: "#1976d2",
    fontWeight: "500",
  },
  backArrow: {
    fontSize: 26,
    color: "#111827",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 20,
  },

  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e6ebf2",
    padding: 18,
    marginBottom: 18,
  },
  profileTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#07122b",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0b1220",
  },
  userSub: {
    marginTop: 4,
    color: "#7a889c",
    fontSize: 14,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
  },
  modalTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0b1220",
  },
  modalClose: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
  },
  inputLabel: {
    marginTop: 8,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: "800",
    color: "#0b1220",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#e5e7eb",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 10,
  },
  cancelBtnText: {
    color: "#111827",
    fontWeight: "800",
  },
  saveBtn: {
    flex: 1,
    backgroundColor: "#1e88e5",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 10,
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "800",
  },
  weeklyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0b1220",
    marginBottom: 4,
  },
  weeklyCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e6ebf2",
    padding: 12,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 16,
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#c9d4e8",
  },
  dotActive: {
    backgroundColor: "#1e88e5",
    width: 18,
    borderRadius: 4,
  },
  weeklyCardTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0b1220",
    marginBottom: 8,
  },
  weeklyChartWrap: {
    width: "100%",
  },
  weeklyChart: {
    borderRadius: 12,
  },

  logoutBtn: {
    backgroundColor: "#ef4444",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  logoutText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "900",
  },

  deleteBtn: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ef4444",
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  deleteText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "900",
  },
});
