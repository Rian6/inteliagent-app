import { File } from 'expo-file-system';

export async function uriToBase64(uri){
  try {
    return new File(uri).base64();
  } catch (error) {
    console.error("Erro ao ler a imagem:", error);
    throw error; // Lança o erro para tratamento posterior
  }
};