import React from "react";
import { ActivityIndicator, Text, TouchableOpacity } from "react-native";

type Props = {
    title: string;
    onPress: () => void;
    loading?: boolean;
    variant?: "primary" | "secondary" | "danger";
};

export default function AppButton({
    title,
    onPress,
    loading = false,
    variant = "primary",
}: Props) {
    let backgroundColor = "#0d6efd";

    if (variant === "secondary") {
        backgroundColor = "#6c757d";
    }

    if (variant === "danger") {
        backgroundColor = "#dc3545";
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={loading}
            style={{
                backgroundColor,
                paddingVertical: 12,
                borderRadius: 10,
                alignItems: "center",
                marginVertical: 6,
                opacity: loading ? 0.7 : 1,
            }}
        >
            {loading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text style={{ color: "#fff", fontWeight: "700" }}>{title}</Text>
            )}
        </TouchableOpacity>
    );
}