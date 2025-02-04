import axios from "axios";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export const handleLogout = async (router: AppRouterInstance) => {
  try {
    await axios.post(
      "http://localhost:8080/logout",
      {},
      {
        withCredentials: true,
      }
    );
    router.push("/login");
  } catch (error) {
    console.error("Logout failed:", error);
  }
};
