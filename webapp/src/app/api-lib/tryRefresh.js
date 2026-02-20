import axios from "axios";
import { setTokens } from "../auth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export async function tryRefresh() {
    const res = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        null,
        { withCredentials: true }
    );

    const accessToken = res.data?.accessToken;
    if (!accessToken) throw new Error("No accessToken");

    setTokens({ accessToken });
    return accessToken;
}
