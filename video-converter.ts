import axios from "axios";
import axiosRetry from "axios-retry";
import * as FileSystem from "expo-file-system";
import { ImagePickerAsset } from "expo-image-picker";

axiosRetry(axios, {
  retries: 15,
  retryDelay: axiosRetry.exponentialDelay,
});

const headers = {
  Authorization:
    "Bearer " +
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoX2lkIjo0NDgwMzYyLCJ3c2lkIjoiNTE4MTU2NzI0IiwiZW1haWwiOiJkZW5uaXNAemVyb29uZS5nZyIsImF1ZCI6IjFjZGVkMzkzMDNjNTU3ZTAzMzJhMjNmZTVhNjkyMWUyIiwiZXhwIjoyMDI5NzY0MjI3LCJqdGkiOiJlYjc1YWEyNWY2MmRhM2UwYjUyMzViZmIwYzc4ZDc5MyIsImlhdCI6MTcxNDQwNDIyNywiaXNzIjoibWVkaWEuaW8iLCJuYmYiOjE3MTQ0MDMyMjcsInN1YiI6Ijg4ZmEzNWExYzliYzdhZGE4NTNiMGYzNzZkMGUxZTMxIn0.561Gi6C-toMgUc2YtN78Qc7CWqCx8OFbq3JeOYFjgdI",
};

const url = "https://api.media.io/v2";

async function getBase64FromAsset(asset: ImagePickerAsset) {
  try {
    const base64 = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    throw new Error("Error reading asset as base64: " + error.message);
  }
}

async function downloadFile(url, fileName) {
  try {
    const fileUri = FileSystem.documentDirectory + fileName;
    const { uri } = await FileSystem.downloadAsync(url, fileUri);
    console.log("Downloaded file:", uri);

    return uri;
  } catch (error) {
    console.error("Error downloading file:", error);
    throw error;
  }
}

export class VideoConverter {
  async pollTaskStatus(taskId: string) {
    try {
      while (true) {
        const { data } = await axios.get(url + `/tasks/${taskId}`, { headers });
        const status = data.data.status;

        console.log("Polling status for task:", taskId, status);

        if (status === "success") {
          return data.data;
        }

        if (status === "failed") {
          throw new Error("Task failed: " + data.data.message);
        }
      }
    } catch (error) {
      console.error("Error polling task status:", error);
      throw error;
    }
  }

  async importVideo(asset: ImagePickerAsset) {
    try {
      const base64 = await getBase64FromAsset(asset);

      const { data } = await axios.post(
        url + "/import/base64",
        {
          content: base64,
          file_name: asset.fileName,
        },
        { headers }
      );

      console.log("Import response:", data);

      return data.data.id;
    } catch (error) {
      console.error("Error importing video:", error);
      throw error;
    }
  }

  async convertVideo(taskId: string) {
    try {
      const { data } = await axios.post(
        url + "/convert",
        {
          input: taskId,
          output_format: "mp4",
        },
        { headers }
      );

      console.log("Convert response:", data);

      return data.data.id;
    } catch (error) {
      console.error("Error converting video:", error);
      throw error;
    }
  }

  async exportVideo(taskId: string) {
    try {
      const { data } = await axios.post(
        url + "/export/url",
        {
          input: taskId,
        },
        { headers }
      );

      console.log("Download video URL:", data);

      return data.data.id;
    } catch (error) {
      console.error("Error downloading video URL:", error);
      throw error;
    }
  }

  async uploadAndConvertVideo(asset: ImagePickerAsset) {
    try {
      const importTaskId = await this.importVideo(asset);
      const importedId = await this.pollTaskStatus(importTaskId);

      const convertTaskId = await this.convertVideo(importedId.id);
      const convertedId = await this.pollTaskStatus(convertTaskId);

      const exportTaskId = await this.exportVideo(convertedId.id);
      const convertedFile = await this.pollTaskStatus(exportTaskId);

      const downloadUrl = convertedFile.result.files[0].url;

      downloadFile(downloadUrl, `${asset.fileName}`);

      return downloadUrl;
    } catch (error) {
      throw error;
    }
  }
}
