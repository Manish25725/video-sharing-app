import apiClient from "./api.js";

const watchHistoryService = {

    // Get user's watch history
    getWatchHistory: async () => {
        try {
            const response = await apiClient.get('/users/history');

            // The apiClient.get() already returns response.data, so:
            // response = { success: true, data: [...], message: "..." }
            // response.data = the actual watch history array
            return {
                success: response.success || true,
                data: response.data || []
            };
        } catch (error) {
            console.error("Error while fetching watch history videos:", error);
            throw error;
        }
    },

    // Add video to watch history
    addToWatchHistory: async (videoId) => {
        try {
            if (!videoId) {
                throw new Error("Video ID is required");
            }

            const response = await apiClient.post(`/users/add-to-watch-history/${videoId}`);

            // The apiClient.post() already returns response.data, so:
            // response = { success: true, data: {...}, message: "..." }
            return {
                success: response.success || true,
                data: response.data || {},
                message: response.message || "Video added to watch history"
            };
        } catch (error) {
            console.error("Error while adding video to watch history:", error);
            console.error("Error details:", error.response?.data);
            throw error;
        }
    }
}


export default watchHistoryService;