import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type {
  RootStackParamList,
  ExerciseItem,
  WorkoutData,
  WorkoutExercise,
  WorkoutSet,
} from "../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = {
  key: string;
  name: string;
  params?: { selectedExercises?: ExerciseItem[] };
};

type SetRow = {
  id: string;
  kg: string;
  reps: string;
  done: boolean;
};

type ExerciseBlock = ExerciseItem & {
  sets: SetRow[];
};

export default function LogWorkout() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

  const [seconds, setSeconds] = useState(0);
  const [workoutExercises, setWorkoutExercises] = useState<ExerciseBlock[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  
  const [createOpen, setCreateOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [screenMessage, setScreenMessage] = useState("");

  useEffect(() => {
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  
  useEffect(() => {
    const incoming = route.params?.selectedExercises ?? [];
    if (!incoming.length) return;

    setWorkoutExercises((prev) => {
      const prevIds = new Set(prev.map((e) => e.id));
      const merged: ExerciseBlock[] = [...prev];

      for (const ex of incoming) {
        if (prevIds.has(ex.id)) continue;
        merged.push({
          ...ex,
          sets: [{ id: "1", kg: "", reps: "", done: false }],
        });
      }
      return merged;
    });
  }, [route.params?.selectedExercises]);

  const goBackToHome = () => navigation.navigate("WorkoutHome");
  const hasExercises = workoutExercises.length > 0;

  
  const totalSets = workoutExercises.reduce((acc, ex) => acc + ex.sets.length, 0);

  const totalVolume = workoutExercises.reduce((acc, ex) => {
    return (
      acc +
      ex.sets.reduce((inner, s) => {
        const kg = Number(s.kg || 0);
        const reps = Number(s.reps || 0);
        return inner + kg * reps;
      }, 0)
    );
  }, 0);

  const addSet = (exerciseId: string) => {
    setWorkoutExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const nextIndex = ex.sets.length + 1;
        return {
          ...ex,
          sets: [
            ...ex.sets,
            { id: String(nextIndex), kg: "", reps: "", done: false },
          ],
        };
      })
    );
  };

  const updateSetField = (
    exerciseId: string,
    setId: string,
    field: "kg" | "reps",
    value: string
  ) => {
    const cleaned = value.replace(/[^0-9]/g, "");
    setWorkoutExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) =>
            s.id === setId ? { ...s, [field]: cleaned } : s
          ),
        };
      })
    );
  };

  
  const saveToFolder = () => {
    if (!workoutExercises.length) {
      setScreenMessage("At least one exercise should be added.");
      return;
    }

    const name = folderName.trim();
    if (!name) return;

    const exercises: WorkoutExercise[] = workoutExercises.map((ex) => {
      const sets: WorkoutSet[] = ex.sets.map((s) => ({
        kg: Number(s.kg || 0),
        reps: Number(s.reps || 0),
      }));
      return {
        id: ex.id,
        name: ex.name,
        muscle: ex.muscle,
        sets,
      };
    });

    const savedWorkout: WorkoutData = {
      createdAt: Date.now(),
      title: `Workout ${new Date().toLocaleDateString()}`,
      exercises,
    };

    setCreateOpen(false);
    setFolderName("");

    navigation.navigate("WorkoutHome", {
      savedFolderName: name,
      savedWorkout,
    });
  };

 
  const openAddExercise = () => {
    const existing: ExerciseItem[] = workoutExercises.map((e) => ({
      id: e.id,
      name: e.name,
      muscle: e.muscle,
    }));

    navigation.navigate("AddExercise", { existingExercises: existing } as never);
  };

  const openCreateModal = () => {
    if (!workoutExercises.length) {
      setScreenMessage("At least one exercise should be added.");
      return;
    }

    setScreenMessage("");
    setCreateOpen(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goBackToHome} style={styles.headerLeft}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Log Workout</Text>

          
          <View style={styles.headerRight} />
        </View>

        
        <View style={styles.statsRow}>
          <View style={styles.statWide}>
            <Text style={styles.statLabel}>Volume</Text>
            <Text style={styles.statValue}>{totalVolume} kg</Text>
          </View>

          <View style={styles.statWide}>
            <Text style={styles.statLabel}>Sets</Text>
            <Text style={styles.statValue}>{totalSets}</Text>
          </View>

          <View style={styles.muscleIcons} />
        </View>

        {!hasExercises ? (
          <View style={styles.centerBlock}>
            <Text style={styles.bigIcon}>🏋️</Text>
            <Text style={styles.getStartedTitle}>Get started</Text>
            <Text style={styles.getStartedSub}>
              Add an exercise to start your workout
            </Text>

            <TouchableOpacity style={styles.primaryBtn} onPress={openAddExercise}>
              <Text style={styles.primaryBtnText}>＋ Add Exercise</Text>
            </TouchableOpacity>

            <View style={styles.twoBtnsRow}>
              <TouchableOpacity
                style={styles.grayBtn}
                onPress={openCreateModal}
              >
                <Text style={styles.grayBtnText}>Create</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.grayBtn} onPress={goBackToHome}>
                <Text style={styles.redBtnText}>Discard Workout</Text>
              </TouchableOpacity>
            </View>

            {!!screenMessage && (
              <Text style={styles.screenWarningText}>{screenMessage}</Text>
            )}
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
            <View style={styles.workoutArea}>
              {workoutExercises.map((ex) => (
                <View key={ex.id} style={styles.exerciseBlock}>
                  <View style={styles.exerciseHeader}>
                    <Text style={{ fontSize: 24 }}>🏋️</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.exerciseName}>{ex.name}</Text>
                    </View>
                  </View>

                  <View style={styles.tableHeader}>
                    <Text style={[styles.th, styles.colSet]}>SET</Text>
                    <Text style={[styles.th, styles.colPrevious]}>PREV KG</Text>
                    <Text style={[styles.th, styles.colNumber]}>
                      KG
                    </Text>
                    <Text style={[styles.th, styles.colNumber]}>
                      REPS
                    </Text>
                  </View>

                  {ex.sets.map((set) => (
                    <View key={set.id} style={styles.tableRow}>
                      <Text style={[styles.td, styles.colSet]}>{set.id}</Text>
                      <Text style={[styles.td, styles.colPrevious, styles.previousValue]}>- kg</Text>

                      <TextInput
                        style={[styles.inputCell, styles.colNumber]}
                        placeholder="0"
                        keyboardType="numeric"
                        value={set.kg}
                        onChangeText={(v) =>
                          updateSetField(ex.id, set.id, "kg", v)
                        }
                      />

                      <TextInput
                        style={[styles.inputCell, styles.colNumber]}
                        placeholder="0"
                        keyboardType="numeric"
                        value={set.reps}
                        onChangeText={(v) =>
                          updateSetField(ex.id, set.id, "reps", v)
                        }
                      />
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.addSetBtn}
                    onPress={() => addSet(ex.id)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.addSetText}>＋ Add Set</Text>
                  </TouchableOpacity>

                  {ex.sets.length > 5 ? (
                    <Text style={styles.restWarningText}>
                      Warning: More than 5 sets logged. Consider resting this muscle.
                    </Text>
                  ) : null}

                  <View style={styles.blockDivider} />
                </View>
              ))}

              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: 8 }]}
                onPress={openAddExercise}
              >
                <Text style={styles.primaryBtnText}>＋ Add Exercise</Text>
              </TouchableOpacity>

              <View style={styles.twoBtnsRow}>
                <TouchableOpacity
                  style={styles.grayBtn}
                  onPress={openCreateModal}
                >
                  <Text style={styles.grayBtnText}>Create</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.grayBtn} onPress={goBackToHome}>
                  <Text style={styles.redBtnText}>Discard Workout</Text>
                </TouchableOpacity>
              </View>

              {!!screenMessage && (
                <Text style={styles.screenWarningText}>{screenMessage}</Text>
              )}
            </View>
          </ScrollView>
        )}

        
        <Modal visible={createOpen} transparent animationType="fade">
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setCreateOpen(false)}
          >
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <Text style={styles.modalTitle}>Save to Folder</Text>

              <TextInput
                value={folderName}
                onChangeText={setFolderName}
                placeholder="Enter folder name"
                style={styles.modalInput}
              />

              <View style={styles.modalBtnsRow}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnGhost]}
                  onPress={() => setCreateOpen(false)}
                >
                  <Text style={styles.modalBtnGhostText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalBtn} onPress={saveToFolder}>
                  <Text style={styles.modalBtnText}>Save</Text>
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
  safe: { flex: 1, backgroundColor: "#fff", paddingTop: 10 },
  screen: { flex: 1, backgroundColor: "#fff" },

  header: {
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerLeft: { width: 44, height: 36, justifyContent: "center" },
  backArrow: { fontSize: 26, color: "#111827", fontWeight: "600" },
  headerTitle: {
    flex: 1,
    textAlign: "left",
    fontSize: 20,
    fontWeight: "500",
    color: "#111827",
    marginLeft: 4,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  clockIcon: { fontSize: 20, color: "#111827" },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f7",
  },
  statWide: { flex: 1 },
  statLabel: { color: "#9ca3af", fontWeight: "700" },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginTop: 6,
  },
  muscleIcons: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },

  centerBlock: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 22,
  },
  bigIcon: { fontSize: 54, marginBottom: 10, opacity: 0.55 },
  getStartedTitle: { fontSize: 28, fontWeight: "800", color: "#111827" },
  getStartedSub: {
    marginTop: 10,
    fontSize: 18,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 26,
  },

  primaryBtn: {
    marginTop: 24,
    width: "100%",
    backgroundColor: "#1e88e5",
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 18 },

  twoBtnsRow: { flexDirection: "row", gap: 14, marginTop: 16, width: "100%" },
  grayBtn: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  grayBtnText: { fontSize: 18, fontWeight: "700", color: "#111827" },
  redBtnText: { fontSize: 18, fontWeight: "700", color: "#ef4444" },
  screenWarningText: {
    marginTop: 12,
    width: "100%",
    color: "#b45309",
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontWeight: "700",
  },

  workoutArea: { paddingHorizontal: 14, paddingTop: 14 },
  exerciseBlock: { marginBottom: 8 },

  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  exerciseName: { fontSize: 26, fontWeight: "800", color: "#1e88e5" },
  notesPlaceholder: { marginTop: 8, color: "#c0c7d1", fontSize: 20 },
  menuDots: { fontSize: 28, color: "#111827", paddingHorizontal: 6 },

  restRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  restIcon: { fontSize: 18, color: "#1e88e5" },
  restText: { fontSize: 20, color: "#1e88e5", fontWeight: "700" },

  tableHeader: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  th: { color: "#9ca3af", fontWeight: "800", letterSpacing: 0.5, fontSize: 12 },

  colSet: { width: 56 },
  colPrevious: { width: 92, textAlign: "center" },
  colNumber: { width: 86, textAlign: "center" },
  previousValue: { color: "#9ca3af" },

  tableRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  td: { fontSize: 20, fontWeight: "700", color: "#111827" },
  inputCell: {
    backgroundColor: "#fff",
    borderWidth: 0,
    paddingVertical: 10,
    fontSize: 22,
    textAlign: "center",
    color: "#111827",
  },

  addSetBtn: {
    marginTop: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  addSetText: { fontSize: 20, fontWeight: "700", color: "#111827" },
  restWarningText: {
    marginTop: 10,
    color: "#b45309",
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontWeight: "700",
  },

  blockDivider: { marginTop: 18, height: 1, backgroundColor: "#eef2f7" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: { backgroundColor: "#fff", borderRadius: 18, padding: 18 },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0b1220",
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#e6ebf2",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  modalBtnsRow: { flexDirection: "row", gap: 12, marginTop: 14 },
  modalBtn: {
    flex: 1,
    backgroundColor: "#0b1220",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  modalBtnText: { color: "#fff", fontWeight: "900" },
  modalBtnGhost: { backgroundColor: "#f3f4f6" },
  modalBtnGhostText: { color: "#0b1220", fontWeight: "900" },
});
