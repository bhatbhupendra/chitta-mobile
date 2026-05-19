import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import AppButton from "../components/AppButton";
import AppInput from "../components/AppInput";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();

  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("password");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      await login(email, password);
      router.replace("/dashboard");
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 18, justifyContent: "center" }}>
      <Text style={{ fontSize: 26, fontWeight: "800", marginBottom: 6 }}>
        Chitta Admin
      </Text>

      <Text style={{ color: "#666", marginBottom: 24 }}>
        Login to manage groups, members, rounds, payments and bids.
      </Text>

      <AppInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="Enter email"
        keyboardType="email-address"
      />

      <AppInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Enter password"
        secureTextEntry
      />

      <AppButton title="Login" onPress={handleLogin} loading={loading} />

      <TouchableOpacity
        onPress={() => router.push("/member-bid")}
        style={{ marginTop: 18, alignItems: "center" }}
      >
        <Text style={{ color: "#0d6efd", fontWeight: "700" }}>
          Member Self Bid
        </Text>
      </TouchableOpacity>
    </View>
  );
}