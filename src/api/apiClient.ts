import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "https://chitta.growbridges.com/public/api";

const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

apiClient.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem("auth_token");

    console.log("API URL:", config.url);
    console.log("TOKEN FROM STORAGE:", token);

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.log("SERVER ERROR:", error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default apiClient;