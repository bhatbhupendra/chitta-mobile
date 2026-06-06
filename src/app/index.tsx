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
    <View style={{ flex: 1, backgroundColor: "#f4f6fb" }}>
      <View
        style={{
          backgroundColor: "#111827",
          paddingTop: 70,
          paddingBottom: 34,
          paddingHorizontal: 22,
          borderBottomLeftRadius: 34,
          borderBottomRightRadius: 34,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 32, fontWeight: "900" }}>
          Chitta Admin
        </Text>

        <Text
          style={{
            color: "#cbd5e1",
            marginTop: 8,
            fontSize: 15,
            lineHeight: 22,
          }}
        >
          Login to manage groups, members, rounds, payments and bids.
        </Text>
      </View>

      <View style={{ padding: 18, marginTop: -18 }}>
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 26,
            padding: 18,
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 14,
            elevation: 4,
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "900", marginBottom: 4 }}>
            Welcome Back
          </Text>

          <Text style={{ color: "#64748b", marginBottom: 18 }}>
            Enter your admin credentials to continue.
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
            activeOpacity={0.85}
            style={{
              marginTop: 16,
              backgroundColor: "#eff6ff",
              paddingVertical: 14,
              borderRadius: 16,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#bfdbfe",
            }}
          >
            <Text style={{ color: "#2563eb", fontWeight: "900" }}>
              Continue as Member Self Bid
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ marginTop: "auto", padding: 18, alignItems: "center" }}>
        <Text style={{ color: "#94a3b8", fontWeight: "700" }}>
          Chitta Fund Management
        </Text>
      </View>
    </View>
  );
}