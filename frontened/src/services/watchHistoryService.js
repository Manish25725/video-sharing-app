import { addToWatchHistory, getWatchHistory } from "../../../backened/src/controllers/user.controller";
import apiClient from "./api.js";


const watchHistoryService={

    getWatchHistory :async()=>{

        try{
            const res=await apiClient.get('users/get-watch-history');
            console.log("watch history service data",res.data);

           return {
                success: res.success || true,
                data : res.data || []
           }
        }

        catch(error){
            console.log("Error while fetching watch history videos");
            throw error;
        }

    },

    addToWatchHistory:async(videoId)=>{

        try {
            const re=await apiClient.post(`users/get-watch-history/${videoId}`);

            console.log("Add to watch history response",re);

            return re;
            
        } catch (error) {

            console.log("Error while adding video to watch history",error);
            throw error;
        }
        
    }
}


export default watchHistoryService;