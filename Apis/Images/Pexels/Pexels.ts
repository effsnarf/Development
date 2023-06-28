// Pexels API key:
// HC5qTVrLOfmCi2eiRhhcNzbId3mSqk5HdZoimQaoXPZPiqQp7OYhwoZv

import axios from "axios";

const API_KEY = "HC5qTVrLOfmCi2eiRhhcNzbId3mSqk5HdZoimQaoXPZPiqQp7OYhwoZv";
const API_URL = "https://api.pexels.com/v1";

class Pexels
{
    static async searchImages(query: string, results: number): Promise<string[]> {
      try {
        const response = await axios.get(`${API_URL}/search`, {
          headers: { Authorization: API_KEY },
          params: { query, per_page: results },
        });
    
        // Extract the photo URLs from the API response
        const photos = response.data.photos;
        const urls = photos.map((photo: any) => photo.src.medium);
    
        return urls;
      } catch (error) {
        console.error(error);
        return [];
      }
    }
  }

export { Pexels };