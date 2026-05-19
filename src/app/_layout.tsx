import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: "Admin Login" }} />
        <Stack.Screen name="dashboard" options={{ title: "Dashboard" }} />
        <Stack.Screen name="groups" options={{ title: "Groups" }} />
        <Stack.Screen name="group-create" options={{ title: "Create Group" }} />
        <Stack.Screen name="group-detail" options={{ title: "Group Detail" }} />
        <Stack.Screen name="round-detail" options={{ title: "Round Detail" }} />
        <Stack.Screen name="members" options={{ title: "Members" }} />
        <Stack.Screen name="member-bid" options={{ title: "Member Self Bid" }} />
      </Stack>
    </AuthProvider>
  );
}