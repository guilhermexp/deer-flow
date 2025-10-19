"use client";

import { useState } from "react";

export default function TestChatSimple() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const testChat = async () => {
    setLoading(true);
    setError("");
    setResponse("");

    try {
      const res = await fetch("http://localhost:8005/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: message }],
          thread_id: "test-" + Date.now(),
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      setResponse("Stream iniciado com sucesso! Verifique o console.");

      // Ler o stream
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        console.log("Chunk recebido:", chunk);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl">Teste Simples do Chat</h1>

      <div className="space-y-4">
        <div>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite uma mensagem..."
            className="w-full rounded border bg-gray-800 p-2 text-white"
          />
        </div>

        <button
          onClick={testChat}
          disabled={loading || !message}
          className="rounded bg-blue-500 px-4 py-2 text-white disabled:bg-gray-500"
        >
          {loading ? "Enviando..." : "Enviar"}
        </button>

        {error && (
          <div className="rounded bg-red-500/20 p-4 text-red-400">
            Erro: {error}
          </div>
        )}

        {response && (
          <div className="rounded bg-green-500/20 p-4 text-green-400">
            {response}
          </div>
        )}
      </div>
    </div>
  );
}
