import React, { ReactNode } from "react";
import { View } from "react-native";

export default function AppCard({ children }: { children: ReactNode }) {
    return (
        <View
            style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 14,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: "#eee",
            }}
        >
            {children}
        </View>
    );
}