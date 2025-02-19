import PocketBase from "pocketbase";

const pb = new PocketBase("http://127.0.0.1:8090"); // PocketBase URL

export const login = async (email: string, password: string) => {
  try {
    const authData = await pb.collection("users").authWithPassword(email, password);
    return authData;
  } catch (error) {
    console.error("Login error:", error);
    return null;
  }
};

export const logout = () => {
  pb.authStore.clear();
};

export const getUser = () => {
  return pb.authStore.model; // Returns the logged-in user
};
