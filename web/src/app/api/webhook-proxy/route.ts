import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Obter o webhook URL do ambiente ou usar o padrão
    const webhookUrl =
      process.env.WEBHOOK_URL ??
      "https://primary-production-f504.up.railway.app/webhook-test/AssistenteNeuroDesk";

    // Obter o FormData da requisição
    const formData = await request.formData();

    // Fazer a requisição para o webhook real
    const response = await fetch(webhookUrl, {
      method: "POST",
      body: formData,
      // Não definir Content-Type - deixar o fetch definir automaticamente para multipart/form-data
    });

    // Obter o conteúdo da resposta
    const contentType = response.headers.get("content-type");
    let responseData;

    if (contentType?.includes("application/json")) {
      try {
        responseData = await response.json();
      } catch {
        // Se falhar ao fazer parse, retornar resposta padrão
        responseData = {
          success: true,
          summary: "Webhook executado com sucesso",
          transcript: "",
          title: "Resposta do webhook",
        };
      }
    } else {
      // Se não for JSON, retornar resposta padrão
      responseData = {
        success: response.ok,
        summary: response.ok
          ? "Webhook executado com sucesso"
          : "Erro no webhook",
        transcript: "",
        title: "Resposta do webhook",
      };
    }

    // Retornar com headers CORS apropriados
    return NextResponse.json(responseData, {
      status: response.status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Erro no proxy do webhook:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  }
}

// Handler para OPTIONS (preflight CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
