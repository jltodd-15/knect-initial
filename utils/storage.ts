import { createAsyncStorage } from "@react-native-async-storage/async-storage";

export const userStore = createAsyncStorage("user_data");
