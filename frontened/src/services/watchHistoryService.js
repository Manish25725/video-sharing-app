import apiClient from "./api.js";

const watchHistoryService = {

    // Get user's watch history
    getWatchHistory: async () => {
        try {
            const response = await apiClient.get('/users/history');
            console.log("Watch history API raw response:", response);
            console.log("Watch history response.success:", response.success);
            console.log("Watch history response.data (actual data):", response.data);
            console.log("Watch history data length:", response.data?.length);

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

            console.log("Adding video to watch history:", videoId);
            const response = await apiClient.post(`/users/add-to-watch-history/${videoId}`);
            console.log("Add to watch history raw response:", response);
            console.log("Add to watch history response.success:", response.success);
            console.log("Add to watch history response.data:", response.data);

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