import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { setAdminAuthenticated, setAccount } from "./userStore";
import { authApi, saveToken } from "../services/api";

export default function Login() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    try {
      setError("");
      setLoading(true);
      const res = await authApi.login(email.trim(), password);
      await saveToken(res.access_token);
      setAccount({
        username: res.user.username,
        createdAt: Date.now(),
        metrics: {},
      });
      setAdminAuthenticated(false);
      navigation.replace("WorkoutHome");
    } catch (err: any) {
      setError(err.message ?? "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("../assets/images/background5.jpg")}
      style={styles.bg}
      resizeMode="cover"
    >
      {/* Title */}
      <View style={styles.top}>
        <Text style={styles.title}>Login</Text>
      </View>

      {/* Bottom Card */}
      <View style={styles.card}>
        <TextInput
          placeholder="Email"
          style={styles.input}
          placeholderTextColor="#777"
          autoComplete="off"
          textContentType="none"
          importantForAutofill="no"
          autoCorrect={false}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          placeholder="Password"
          style={styles.input}
          secureTextEntry
          placeholderTextColor="#777"
          autoComplete="off"
          textContentType="none"
          importantForAutofill="no"
          autoCorrect={false}
          value={password}
          onChangeText={setPassword}
        />

        {error !== "" && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
          <Text style={styles.link}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("AdminLogin")}>
          <Text style={styles.link}>Login as Admin</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  top: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 260,
  },

  title: {
    fontSize: 35,
    fontWeight: "bold",
    color: "#000", 
  },

  card: {
    backgroundColor: "#0F1F2D",
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },

  input: {
    backgroundColor: "#f8fafc",
    color: "#111827",
    borderWidth: 1,
    borderColor: "#d5dee9",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 14,
    fontSize: 16,
  },

  button: {
    backgroundColor: "#2196F3",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 6,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  link: {
    marginTop: 14,
    textAlign: "center",
    color: "#0b63ce",
    textDecorationLine: "underline",
  },

  error: {
    color: "#ff4d4f",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 10,
  },

  buttonDisabled: {
    opacity: 0.6,
  },
});
