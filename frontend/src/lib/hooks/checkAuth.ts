import axios from "axios";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export const checkAuth = async (setLoading: (loading: boolean) => void, router: AppRouterInstance) => {
      try {
        const response = await axios.get("http://localhost:8080/posts/all", { 
          withCredentials: true,
        });

        if (response.status === 200 ) {
          setLoading(false); // User is authenticated
        } else {
          router.push("/login"); // Redirect to login page
        }
      } catch (error) {
        console.log(error);
        router.push("/login"); // Redirect to login on error
      }
    };