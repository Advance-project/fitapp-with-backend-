import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList, WorkoutData } from "../App";

type Nav = NativeStackNavigationProp<RootStackParamList, "WorkoutHome">;
type Route = RouteProp<RootStackParamList, "WorkoutHome">;

type Folder = {
  name: string;
  workouts: WorkoutData[];
};

export default function WorkoutHome() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

  const [folders, setFolders] = useState<Folder[]>([
    {
      name: "Beginner",
      workouts: [
        {
          createdAt: 1741651200000,
          title: "Workout 2026-03-11",
          exercises: [
            {
              id: "air-bike-1",
              name: "Air Bike",
              muscle: "Cardio",
              sets: [
                { kg: 20, reps: 4 },
                { kg: 30, reps: 8 },
                { kg: 50, reps: 10 },
              ],
            },
            {
              id: "arnold-press-1",
              name: "Arnold Press (Dumbbell)",
              muscle: "Shoulders",
              sets: [
                { kg: 40, reps: 10 },
                { kg: 50, reps: 10 },
                { kg: 60, reps: 12 },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "Strength",
      workouts: [
        {
          createdAt: 1741651200001,
          title: "Workout 2026-03-11",
          exercises: [
            {
              id: "air-bike-2",
              name: "Air Bike",
              muscle: "Cardio",
              sets: [
                { kg: 20, reps: 4 },
                { kg: 30, reps: 8 },
                { kg: 50, reps: 10 },
              ],
            },
            {
              id: "arnold-press-2",
              name: "Arnold Press (Dumbbell)",
              muscle: "Shoulders",
              sets: [
                { kg: 40, reps: 10 },
                { kg: 50, reps: 10 },
                { kg: 60, reps: 12 },
              ],
            },
          ],
        },
      ],
    },
  ]);

  const lastSavedAtRef = useRef<number | null>(null);

  useEffect(() => {
    const savedFolderName = route.params?.savedFolderName;
    const savedWorkout = route.params?.savedWorkout;

    if (!savedFolderName || !savedWorkout) return;
    if (lastSavedAtRef.current === savedWorkout.createdAt) return;

    lastSavedAtRef.current = savedWorkout.createdAt;

    setFolders((prev) => {
      const idx = prev.findIndex((f) => f.name === savedFolderName);
      if (idx === -1) {
        return [{ name: savedFolderName, workouts: [savedWorkout] }, ...prev];
      }
      const next = [...prev];
      next[idx] = { ...next[idx], workouts: [savedWorkout, ...next[idx].workouts] };
      return next;
    });
  }, [route.params?.savedFolderName, route.params?.savedWorkout]);

  const [openFolder, setOpenFolder] = useState<Folder | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const removeFolder = (name: string) => {
    setFolders((prev) => prev.filter((f) => f.name !== name));
  };

  const folderNames = useMemo(() => folders.map((f) => f.name), [folders]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>Workout</Text>

          <View style={styles.twoColRow}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.cardSmall}
              onPress={() => navigation.navigate("LogWorkout")}
            >
              <Text style={styles.cardText}>Create{"\n"}new routine</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.cardSmall}
              onPress={() => navigation.navigate("ExploreRoutines")}
            >
              <Text style={styles.cardText}>Explore{"\n"}routines</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.twoColRow}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.cardSmall}
              onPress={() => navigation.navigate("ChatRoutine")}
            >
              <Text style={styles.cardText}>Create routine{"\n"}using ChatGPT</Text>
            </TouchableOpacity>

            <View style={styles.cardSmallGhost} />
          </View>

          <View style={styles.sectionDivider} />

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Created routines</Text>

            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => setEditOpen(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.listBox}>
            {folders.map((folder: Folder, idx: number) => (
              <View key={`${folder.name}-${idx}`}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.listRow}
                  onPress={() => setOpenFolder(folder)}
                >
                  <Text style={styles.listRowText}>{folder.name}</Text>
                  <Text style={styles.smallCount}>
                    {folder.workouts.length ? `${folder.workouts.length}` : ""}
                  </Text>
                </TouchableOpacity>

                {idx !== folders.length - 1 && <View style={styles.rowDivider} />}
              </View>
            ))}
          </View>

          <View style={{ height: 90 }} />
        </ScrollView>

        <View style={styles.bottomTabs}>
          <TouchableOpacity activeOpacity={0.8} style={styles.tab}>
            <Text style={styles.tabIcon}>🏋️</Text>
            <Text style={styles.tabTextActive}>Workout</Text>
          </TouchableOpacity>

          <View style={styles.tabDivider} />

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.tab}
            onPress={() => navigation.navigate("Profile")}
          >
            <Text style={styles.tabIcon}>👤</Text>
            <Text style={styles.tabText}>Profile</Text>
          </TouchableOpacity>
        </View>

        <Modal transparent visible={!!openFolder} animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setOpenFolder(null)}>
            <Pressable style={styles.folderModalCard} onPress={() => {}}>
              <View style={styles.folderModalTop}>
                <Text style={styles.folderModalTitle}>{openFolder?.name}</Text>
                <TouchableOpacity onPress={() => setOpenFolder(null)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              {openFolder?.workouts?.length ? (
                openFolder.workouts.map((w: WorkoutData) => (
                  <View key={w.createdAt} style={styles.workoutCard}>
                    <Text style={styles.workoutTitle}>{w.title}</Text>

                    {w.exercises.map((ex) => (
                      <View key={ex.id} style={{ marginTop: 8 }}>
                        <Text style={styles.exerciseLine}>• {ex.name}</Text>

                        {ex.sets.map((s, idx) => (
                          <Text key={`${ex.id}-${idx}`} style={styles.setLine}>
                            Set {idx + 1}: {s.kg} kg × {s.reps}
                          </Text>
                        ))}
                      </View>
                    ))}
                  </View>
                ))
              ) : (
                <Text style={{ color: "#6b7280", fontWeight: "700" }}>
                  No workouts saved in this folder yet.
                </Text>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        <Modal transparent visible={editOpen} animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setEditOpen(false)}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <View style={styles.folderModalTop}>
                <Text style={styles.folderModalTitle}>Edit folders</Text>
                <TouchableOpacity onPress={() => setEditOpen(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              {folderNames.map((name: string) => (
                <View key={name} style={styles.editRow}>
                  <Text style={styles.editRowText}>{name}</Text>
                  <TouchableOpacity onPress={() => removeFolder(name)}>
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </Pressable>
          </Pressable>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f6f7fb",
    paddingTop: 12,
  },

  screen: { flex: 1 },

  content: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  sectionTitle: {
    marginTop: 18,
    marginBottom: 10,
    fontSize: 22,
    fontWeight: "800",
    color: "#0b1220",
  },

  twoColRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 14,
  },

  cardSmall: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e6ebf2",
  },

  cardSmallGhost: {
    flex: 1,
    backgroundColor: "transparent",
  },

  cardText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0b1220",
    lineHeight: 24,
  },

  sectionDivider: {
    height: 1,
    backgroundColor: "#dfe6f1",
    marginTop: 8,
    marginBottom: 12,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#0b1220",
  },
  editText: { color: "#fff", fontSize: 16, fontWeight: "900" },

  listBox: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e6ebf2",
    overflow: "hidden",
  },

  listRow: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listRowText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0b1220",
  },
  smallCount: { color: "#9aa6b2", fontWeight: "900" },

  rowDivider: {
    height: 1,
    backgroundColor: "#e6ebf2",
    marginLeft: 16,
  },

  bottomTabs: {
    height: 64,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e6ebf2",
    flexDirection: "row",
    alignItems: "center",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  tabIcon: { fontSize: 18 },
  tabTextActive: { fontWeight: "900", color: "#0b1220" },
  tabText: { fontWeight: "700", color: "#6b7280" },

  tabDivider: {
    width: 1,
    height: "70%",
    backgroundColor: "#dfe6f1",
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

  folderModalCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
  },
  folderModalTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  folderModalTitle: { fontSize: 18, fontWeight: "900", color: "#0b1220" },
  modalClose: { fontSize: 18, fontWeight: "900", color: "#111827" },

  workoutCard: {
    backgroundColor: "#f6f7fb",
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
  },
  workoutTitle: { fontSize: 16, fontWeight: "900", color: "#0b1220" },
  exerciseLine: { marginTop: 6, fontWeight: "800", color: "#111827" },
  setLine: { marginTop: 2, color: "#6b7280", fontWeight: "700" },

  editRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#eef2f7",
  },
  editRowText: { fontWeight: "900", color: "#0b1220" },
  removeText: { color: "#ef4444", fontWeight: "900" },
});