import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { setAdminAuthenticated } from "./userStore";
import { authApi, saveTokens } from "../services/api";

export default function AdminLogin() {
  const navigation = useNavigation<any>();
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async () => {
    const username = adminId.trim();
    const pwd = password.trim();

    if (!username || !pwd) {
      Alert.alert("Validation", "Please enter both Admin ID and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.adminLogin(username, pwd);
      await saveTokens(res.access_token, res.refresh_token);
      setAdminAuthenticated(true);
      navigation.replace("Admin");
    } catch (err: any) {
      Alert.alert("Access denied", err.message || "Invalid admin credentials.");
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
      <View style={styles.top}>
        <Text style={styles.title}>Admin Login</Text>
      </View>

      <View style={styles.card}>
        <TextInput
          placeholder="Admin ID"
          style={styles.input}
          placeholderTextColor="#777"
          value={adminId}
          onChangeText={setAdminId}
          autoCapitalize="none"
          autoComplete="off"
          textContentType="none"
          importantForAutofill="no"
          autoCorrect={false}
        />

        <TextInput
          placeholder="Password"
          style={styles.input}
          secureTextEntry
          placeholderTextColor="#777"
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          autoComplete="off"
          textContentType="none"
          importantForAutofill="no"
          autoCorrect={false}
        />

        <TouchableOpacity style={styles.button} onPress={handleAdminLogin} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.buttonText}>Login</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setAdminAuthenticated(false);
            navigation.navigate("Login");
          }}
        >
          <Text style={styles.link}>Back to User Login</Text>
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
});
