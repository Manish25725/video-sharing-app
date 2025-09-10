import apiClient from "./api.js";

const watchHistoryService = {

    // Get user's watch history
    getWatchHistory: async () => {
        try {
            const response = await apiClient.get('/users/history');
            console.log("Watch history service data:", response.data);

            return {
                success: response.data?.success || true,
                data: response.data?.data || []
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
            console.log("Add to watch history response:", response.data);

            return {
                success: response.data?.success || true,
                data: response.data?.data || {},
                message: response.data?.message || "Video added to watch history"
            };
        } catch (error) {
            console.error("Error while adding video to watch history:", error);
            throw error;
        }
    }
}


export default watchHistoryService;