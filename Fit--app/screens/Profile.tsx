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

  const [editOpen, setEditOpen] = useState(false);
  const [weeklyIndex, setWeeklyIndex] = useState(1);
  const [weeklyChartWidth, setWeeklyChartWidth] = useState(0);
  const weeklyScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!cardWidth) return;
    weeklyScrollRef.current?.scrollTo({ x: cardWidth, animated: false });
  }, [cardWidth]);

  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [email, setEmail] = useState("");

  const [draftAge, setDraftAge] = useState("");
  const [draftWeight, setDraftWeight] = useState("");
  const [draftHeight, setDraftHeight] = useState("");
  const [draftEmail, setDraftEmail] = useState("");

  const openEdit = () => {
    setDraftAge(age);
    setDraftWeight(weight);
    setDraftHeight(height);
    setDraftEmail(email);
    setEditOpen(true);
  };

  const saveProfile = () => {
    setAge(draftAge);
    setWeight(draftWeight);
    setHeight(draftHeight);
    setEmail(draftEmail);
    setEditOpen(false);
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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Profile</Text>

          <TouchableOpacity style={styles.headerBtn} onPress={openEdit}>
            <Text style={styles.editIcon}>✎</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          
          <View style={styles.profileCard}>
            <View style={styles.profileTop}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>U</Text>
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.userName}>User</Text>
                <Text style={styles.userSub}>Created 0 days ago</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statIcon}>🎂</Text>
                <Text style={styles.statLabel}>Age</Text>
                <Text style={styles.statValue}>{age ? `${age}` : "--"}</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statIcon}>⚖️</Text>
                <Text style={styles.statLabel}>Weight</Text>
                <Text style={styles.statValue}>{weight ? `${weight} kg` : "--"}</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statIcon}>📏</Text>
                <Text style={styles.statLabel}>Height</Text>
                <Text style={styles.statValue}>{height ? `${height} cm` : "--"}</Text>
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
          <Pressable style={styles.modalOverlay} onPress={() => setEditOpen(false)}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <View style={styles.modalTop}>
                <Text style={styles.modalTitle}>Edit profile</Text>
                <TouchableOpacity onPress={() => setEditOpen(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={styles.input}
                value={draftAge}
                onChangeText={setDraftAge}
                placeholder="Enter age"
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Weight</Text>
              <TextInput
                style={styles.input}
                value={draftWeight}
                onChangeText={setDraftWeight}
                placeholder="Enter weight"
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Height</Text>
              <TextInput
                style={styles.input}
                value={draftHeight}
                onChangeText={setDraftHeight}
                placeholder="Enter height"
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={draftEmail}
                onChangeText={setDraftEmail}
                placeholder="Enter email"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TouchableOpacity style={styles.saveBtn} onPress={saveProfile} activeOpacity={0.85}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
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
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: {
    fontSize: 24,
    color: "#111827",
    fontWeight: "700",
  },
  editIcon: {
    fontSize: 20,
    color: "#111827",
    fontWeight: "700",
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
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 14,
  },
  statBox: {
    width: "48%",
    backgroundColor: "#f6f7fb",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
  },
  statIcon: {
    fontSize: 15,
    marginBottom: 4,
  },
  statLabel: {
    color: "#7a889c",
    fontSize: 12,
    fontWeight: "800",
  },
  statValue: {
    marginTop: 5,
    fontSize: 16,
    fontWeight: "900",
    color: "#0b1220",
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

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
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
    fontSize: 18,
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
    backgroundColor: "#f6f7fb",
    borderWidth: 1,
    borderColor: "#e6ebf2",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
  },

  saveBtn: {
    marginTop: 18,
    backgroundColor: "#0b1220",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
});