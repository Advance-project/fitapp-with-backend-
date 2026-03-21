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
import type { RootStackParamList, ExerciseItem } from "../App";
import { clearToken, logWorkoutApi, workoutApi } from "../services/api";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = {
  key: string;
  name: string;
  params?: {
    selectedExercises?: ExerciseItem[];
    startFresh?: boolean;
  };
};

type ExerciseBlock = ExerciseItem;

export default function CreateRoutine() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

  const [workoutExercises, setWorkoutExercises] = useState<ExerciseBlock[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [screenMessage, setScreenMessage] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [pendingRemoveExerciseId, setPendingRemoveExerciseId] = useState<string | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [savingRoutine, setSavingRoutine] = useState(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;

    if (route.params?.startFresh) {
      logWorkoutApi.clearDraft().catch(() => {});
      setWorkoutExercises([]);
      setDraftReady(true);
      return () => {
        active = false;
      };
    }

    (async () => {
      try {
        const draft = await logWorkoutApi.getDraft();
        if (!active || !draft.exercises.length) return;

        const draftExercises: ExerciseBlock[] = draft.exercises.map((ex) => ({
          id: ex.id,
          name: ex.name,
          muscle: ex.muscle,
        }));

        setWorkoutExercises((prev) => {
          const merged = new Map<string, ExerciseBlock>();
          for (const ex of draftExercises) merged.set(ex.id, ex);
          for (const ex of prev) {
            if (!merged.has(ex.id)) merged.set(ex.id, ex);
          }
          return Array.from(merged.values());
        });
      } catch {
        // Keep local state only when draft API is unavailable.
      } finally {
        if (active) setDraftReady(true);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const incoming = route.params?.selectedExercises ?? [];
    if (!incoming.length) return;

    if (route.params?.startFresh) {
      setWorkoutExercises(incoming.map((ex) => ({ ...ex })));
      return;
    }

    setWorkoutExercises((prev) => {
      const prevIds = new Set(prev.map((e) => e.id));
      const merged: ExerciseBlock[] = [...prev];

      for (const ex of incoming) {
        if (prevIds.has(ex.id)) continue;
        merged.push({ ...ex });
      }
      return merged;
    });
  }, [route.params?.selectedExercises, route.params?.startFresh]);

  const saveDraftNow = async () => {
    if (!draftReady) return;
    try {
      await logWorkoutApi.saveDraft({
        exercises: workoutExercises.map((ex) => ({
          id: ex.id,
          name: ex.name,
          muscle: ex.muscle,
          sets: [],
        })),
        elapsed_seconds: 0,
      });
    } catch {
      // Ignore transient network errors for autosave.
    }
  };

  useEffect(() => {
    if (!draftReady) return;

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      saveDraftNow();
    }, 350);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [workoutExercises, draftReady]);

  const returnToWorkoutHome = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate("WorkoutHome", { refreshAt: Date.now() });
  };

  const goBackToHome = () => returnToWorkoutHome();
  const hasExercises = workoutExercises.length > 0;
  const totalExercises = workoutExercises.length;

  const isTokenError = (error: unknown): boolean => {
    if (!(error instanceof Error)) return false;
    const msg = error.message.toLowerCase();
    return msg.includes("invalid or expired token") || msg.includes("401");
  };

  const redirectToLogin = async () => {
    try {
      await clearToken();
    } catch {
      // Ignore token clear failures and still redirect.
    }
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  const removeExercise = (exerciseId: string) => {
    setWorkoutExercises((prev) => prev.filter((ex) => ex.id !== exerciseId));
  };

  const confirmRemoveExercise = (exerciseId: string) => {
    setPendingRemoveExerciseId(exerciseId);
  };

  const cancelRemoveExercise = () => {
    setPendingRemoveExerciseId(null);
  };

  const proceedRemoveExercise = () => {
    if (!pendingRemoveExerciseId) return;
    removeExercise(pendingRemoveExerciseId);
    setPendingRemoveExerciseId(null);
  };

  const saveRoutineTemplate = async () => {
    if (!workoutExercises.length) {
      setScreenMessage("At least one exercise should be added.");
      return;
    }

    const name = folderName.trim();
    if (!name) {
      setModalMessage("Please enter a routine name.");
      return;
    }

    const exercises = workoutExercises.map((ex) => ({
      id: ex.id,
      name: ex.name,
      muscle: ex.muscle,
    }));

    setSavingRoutine(true);
    try {
      await workoutApi.saveTemplate({ name, exercises });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save routine.";
      setScreenMessage(message);
      setModalMessage(message);
      if (isTokenError(error)) {
        setModalMessage("Session expired. Please log in again.");
        setScreenMessage("Session expired. Please log in again.");
        await redirectToLogin();
      }
      return;
    } finally {
      setSavingRoutine(false);
    }

    setCreateOpen(false);
    setFolderName("");
    setModalMessage("");

    try {
      await logWorkoutApi.clearDraft();
    } catch (error) {
      if (isTokenError(error)) {
        await redirectToLogin();
        return;
      }
      // Ignore clear failures; user already navigated away.
    }

    returnToWorkoutHome();
  };

  const openAddExercise = async () => {
    await saveDraftNow();

    const existing: ExerciseItem[] = workoutExercises.map((e) => ({
      id: e.id,
      name: e.name,
      muscle: e.muscle,
    }));

    navigation.navigate("AddExercise", {
      existingExercises: existing,
      returnTo: "CreateRoutine",
    } as never);
  };

  const openCreateModal = () => {
    if (!workoutExercises.length) {
      setScreenMessage("At least one exercise should be added.");
      return;
    }
    setScreenMessage("");
    setModalMessage("");
    setCreateOpen(true);
  };

  const confirmSaveRoutineTemplate = () => {
    if (savingRoutine) return;
    const name = folderName.trim();
    if (!name) {
      setModalMessage("Please enter a routine name.");
      return;
    }
    saveRoutineTemplate();
  };

  const discardRoutine = async () => {
    setWorkoutExercises([]);
    setScreenMessage("");
    try {
      await logWorkoutApi.clearDraft();
    } catch (error) {
      if (isTokenError(error)) {
        await redirectToLogin();
        return;
      }
      // Keep navigation behavior even if clear fails.
    }
    returnToWorkoutHome();
  };

  const confirmDiscardRoutine = () => {
    discardRoutine();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBackToHome} style={styles.headerLeft}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Create New Routine</Text>

          <View style={styles.headerRight} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statWide}>
            <Text style={styles.statLabel}>Exercises</Text>
            <Text style={styles.statValue}>{totalExercises}</Text>
          </View>

          <View style={styles.statWide}>
            <Text style={styles.statLabel}>Mode</Text>
            <Text style={styles.statValueSmall}>Create routine</Text>
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

              <TouchableOpacity style={styles.grayBtn} onPress={confirmDiscardRoutine}>
                <Text style={styles.redBtnText}>Discard Routine</Text>
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
                      <Text style={styles.exerciseSubtext}>{ex.muscle}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeExerciseBtn}
                      onPress={() => confirmRemoveExercise(ex.id)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.removeExerciseBtnText}>Remove</Text>
                    </TouchableOpacity>
                  </View>

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

                <TouchableOpacity style={styles.grayBtn} onPress={confirmDiscardRoutine}>
                  <Text style={styles.redBtnText}>Discard Routine</Text>
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
              <Text style={styles.modalTitle}>Save routine template</Text>

              <TextInput
                value={folderName}
                onChangeText={(text) => {
                  setFolderName(text);
                  if (modalMessage) setModalMessage("");
                }}
                placeholder="Enter folder name"
                style={styles.modalInput}
              />

              {!!modalMessage && <Text style={styles.modalErrorText}>{modalMessage}</Text>}

              <View style={styles.modalBtnsRow}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnGhost]}
                  onPress={() => {
                    if (savingRoutine) return;
                    setCreateOpen(false);
                  }}
                >
                  <Text style={styles.modalBtnGhostText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, savingRoutine && styles.modalBtnDisabled]}
                  onPress={confirmSaveRoutineTemplate}
                  disabled={savingRoutine}
                >
                  <Text style={styles.modalBtnText}>{savingRoutine ? "Saving..." : "Save"}</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal visible={!!pendingRemoveExerciseId} transparent animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={cancelRemoveExercise}>
            <Pressable style={styles.compactConfirmCard} onPress={() => {}}>
              <Text style={styles.compactConfirmText}>Remove this exercise?</Text>

              <View style={styles.compactConfirmBtnsRow}>
                <TouchableOpacity
                  style={[styles.compactConfirmBtn, styles.compactConfirmBtnGhost]}
                  onPress={cancelRemoveExercise}
                >
                  <Text style={styles.compactConfirmBtnGhostText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.compactConfirmBtn, styles.compactConfirmBtnDanger]}
                  onPress={proceedRemoveExercise}
                >
                  <Text style={styles.compactConfirmBtnDangerText}>Remove</Text>
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
  statValueSmall: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
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
  exerciseSubtext: {
    marginTop: 4,
    fontSize: 15,
    color: "#6b7280",
    fontWeight: "600",
  },
  removeExerciseBtn: {
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  removeExerciseBtnText: {
    color: "#b91c1c",
    fontWeight: "700",
    fontSize: 12,
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
  modalBtnDisabled: { opacity: 0.6 },
  modalBtnGhost: { backgroundColor: "#f3f4f6" },
  modalBtnGhostText: { color: "#0b1220", fontWeight: "900" },
  modalErrorText: {
    marginTop: 10,
    color: "#dc2626",
    fontWeight: "700",
    textAlign: "center",
  },

  compactConfirmCard: {
    alignSelf: "center",
    width: "72%",
    maxWidth: 280,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  compactConfirmText: {
    color: "#111827",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 14,
  },
  compactConfirmBtnsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  compactConfirmBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  compactConfirmBtnGhost: {
    backgroundColor: "#f3f4f6",
  },
  compactConfirmBtnDanger: {
    backgroundColor: "#fee2e2",
  },
  compactConfirmBtnGhostText: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 13,
  },
  compactConfirmBtnDangerText: {
    color: "#b91c1c",
    fontWeight: "800",
    fontSize: 13,
  },
});
