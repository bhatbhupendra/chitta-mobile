import React from "react";
import { Text, TextInput, View } from "react-native";

type Props = {
    label?: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    keyboardType?: "default" | "numeric" | "email-address";
    secureTextEntry?: boolean;
};

export default function AppInput({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = "default",
    secureTextEntry = false,
}: Props) {
    return (
        <View style={{ marginBottom: 14 }}>
            {label ? (
                <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 6 }}>
                    {label}
                </Text>
            ) : null}

            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                keyboardType={keyboardType}
                secureTextEntry={secureTextEntry}
                style={{
                    borderWidth: 1,
                    borderColor: "#ddd",
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    backgroundColor: "#fff",
                }}
            />
        </View>
    );
}