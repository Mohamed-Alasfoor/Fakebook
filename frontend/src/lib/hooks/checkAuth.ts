import axios from "axios";

export const checkAuth = async (setLoading: (loading: boolean) => void, router: any) => {
      try {
        const response = await axios.get("http://localhost:8080/posts/all", { // TODO : this is just a demo , when they craete api for auth replace it
          withCredentials: true,
        });

        if (response.status === 200 ) {
          setLoading(false); // User is authenticated
        } else {
          router.push("/login"); // Redirect to login page
        }
      } catch (error) {
        router.push("/login"); // Redirect to login on error
      }
    };