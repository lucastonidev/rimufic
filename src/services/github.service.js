// src/services/github.js
import axios from "axios";

export const uploadToGitHub = async (
  filePath,
  contentBufferOrString,
  commitMessage,
) => {
  const token = process.env.GITHUB_TOKEN;
  const owner = "lucastonidev";
  const repo = "rimufic-storys";
  const branch = "main";

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

  const contentBase64 = Buffer.isBuffer(contentBufferOrString)
    ? contentBufferOrString.toString("base64")
    : Buffer.from(contentBufferOrString, "utf-8").toString("base64");

  // 1. Verifica se o arquivo já existe para obter o SHA atual (se houver)
  let currentSha = null;
  try {
    const getFile = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      params: { ref: branch },
    });
    currentSha = getFile.data.sha;
  } catch (error) {
    // Se retornar 404 (Not Found), significa que o arquivo é novo, então segue sem sha
    if (error.response && error.response.status !== 404) {
      console.error(
        "Erro ao verificar arquivo existente no GitHub:",
        error.response.data,
      );
    }
  }

  // 2. Monta o payload de envio com o sha (caso seja atualização)
  const requestBody = {
    message: commitMessage,
    content: contentBase64,
    branch,
    ...(currentSha && { sha: currentSha }),
  };

  try {
    const response = await axios.put(url, requestBody, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.error(
      `Erro ao subir ${filePath} para o GitHub:`,
      error.response?.data || error.message,
    );
    throw new Error(`Falha ao sincronizar ${filePath} com o GitHub.`);
  }
};
