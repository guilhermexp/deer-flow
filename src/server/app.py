# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import asyncio
import base64
import json
import logging
import os
from typing import Annotated, List, Optional, cast
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Form

# Load environment variables
load_dotenv()
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from langchain_core.messages import AIMessageChunk, BaseMessage, ToolMessage
from langgraph.types import Command

from src.config.report_style import ReportStyle
from src.config.tools import SELECTED_RAG_PROVIDER
from src.graph.builder import build_graph_with_memory
from src.llms.llm import get_configured_llm_models
from src.podcast.graph.builder import build_graph as build_podcast_graph
from src.ppt.graph.builder import build_graph as build_ppt_graph
from src.prompt_enhancer.graph.builder import build_graph as build_prompt_enhancer_graph
from src.prose.graph.builder import build_graph as build_prose_graph
from src.rag.builder import build_retriever
from src.rag.retriever import Resource
from src.server.chat_request import (
    ChatRequest,
    EnhancePromptRequest,
    GeneratePodcastRequest,
    GeneratePPTRequest,
    GenerateProseRequest,
    TTSRequest,
)
from src.server.config_request import ConfigResponse
from src.server.mcp_request import MCPServerMetadataRequest, MCPServerMetadataResponse
from src.server.mcp_utils import load_mcp_tools
from src.server.rag_request import (
    RAGConfigResponse,
    RAGResourceRequest,
    RAGResourcesResponse,
    RAGUploadResponse,
)
from src.tools import VolcengineTTS

# Import new routers
from src.server.auth_routes import router as auth_router
from src.server.dashboard_routes import router as dashboard_router
from src.server.calendar_routes import router as calendar_router
from src.server.projects_routes import router as projects_router
from src.server.health_routes import router as health_router
from src.server.notes_routes import router as notes_router
from src.server.conversations_routes import router as conversations_router

# Import database initialization
from src.database.base import create_tables

logger = logging.getLogger(__name__)

INTERNAL_SERVER_ERROR_DETAIL = "Internal Server Error"

app = FastAPI(
    title="DeerFlow API",
    description="API for Deer",
    version="0.1.0",
)

# Add CORS middleware
# Configure allowed origins from environment or use default secure settings
allowed_origins = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:4000,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # Specific allowed origins only
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Specific allowed methods
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],  # Specific allowed headers
    expose_headers=["Content-Length", "X-Total-Count"],  # Headers exposed to the browser
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Add rate limiting middleware
from src.server.rate_limiter import rate_limit_middleware
app.middleware("http")(rate_limit_middleware)

# Setup error handlers
from src.server.error_handler import setup_error_handlers
setup_error_handlers(app)

# Database initialization on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database tables on startup"""
    try:
        logger.info("Creating database tables...")
        create_tables()
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        raise


graph = build_graph_with_memory()

# Include routers
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(calendar_router)
app.include_router(projects_router)
app.include_router(health_router)
app.include_router(notes_router)
app.include_router(conversations_router)


@app.post("/api/chat/stream")
async def chat_stream(request: ChatRequest):
    thread_id = request.thread_id
    if thread_id == "__default__":
        thread_id = str(uuid4())
    return StreamingResponse(
        _astream_workflow_generator(
            request.model_dump()["messages"],
            thread_id,
            request.resources,
            request.max_plan_iterations,
            request.max_step_num,
            request.max_search_results,
            request.auto_accepted_plan,
            request.interrupt_feedback,
            request.mcp_settings,
            request.enable_background_investigation,
            request.report_style,
            request.enable_deep_thinking,
            request.model,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable Nginx buffering
        },
    )


async def _astream_workflow_generator(
    messages: List[dict],
    thread_id: str,
    resources: List[Resource],
    max_plan_iterations: int,
    max_step_num: int,
    max_search_results: int,
    auto_accepted_plan: bool,
    interrupt_feedback: str,
    mcp_settings: dict,
    enable_background_investigation: bool,
    report_style: ReportStyle,
    enable_deep_thinking: bool,
    selected_model: Optional[str],
):
    try:
        input_ = {
            "messages": messages,
            "plan_iterations": 0,
            "final_report": "",
            "current_plan": None,
            "observations": [],
            "auto_accepted_plan": auto_accepted_plan,
            "enable_background_investigation": enable_background_investigation,
            "research_topic": messages[-1]["content"] if messages else "",
        }
        if not auto_accepted_plan and interrupt_feedback:
            resume_msg = f"[{interrupt_feedback}]"
            # add the last message to the resume message
            if messages:
                resume_msg += f" {messages[-1]['content']}"
            input_ = Command(resume=resume_msg)

        # Keep track of last event time for keep-alive
        last_event_time = asyncio.get_event_loop().time()

        async for agent, _, event_data in graph.astream(
            input_,
            config={
                "thread_id": thread_id,
                "resources": resources,
                "max_plan_iterations": max_plan_iterations,
                "max_step_num": max_step_num,
                "max_search_results": max_search_results,
                "mcp_settings": mcp_settings,
                "report_style": report_style.value,
                "enable_deep_thinking": enable_deep_thinking,
                "selected_model": selected_model,
            },
            stream_mode=["messages", "updates"],
            subgraphs=True,
        ):
            if isinstance(event_data, dict):
                if "__interrupt__" in event_data:
                    yield _make_event(
                        "interrupt",
                        {
                            "thread_id": thread_id,
                            "id": event_data["__interrupt__"][0].ns[0],
                            "role": "assistant",
                            "content": event_data["__interrupt__"][0].value,
                            "finish_reason": "interrupt",
                            "options": [
                                {"text": "Edit plan", "value": "edit_plan"},
                                {"text": "Start research", "value": "accepted"},
                            ],
                        },
                    )
                continue
            message_chunk, message_metadata = cast(
                tuple[BaseMessage, dict[str, any]], event_data
            )
            event_stream_message: dict[str, any] = {
                "thread_id": thread_id,
                "agent": agent[0].split(":")[0],
                "id": message_chunk.id,
                "role": "assistant",
                "content": message_chunk.content,
            }
            if message_chunk.additional_kwargs.get("reasoning_content"):
                event_stream_message["reasoning_content"] = (
                    message_chunk.additional_kwargs["reasoning_content"]
                )
            if message_chunk.response_metadata.get("finish_reason"):
                event_stream_message["finish_reason"] = (
                    message_chunk.response_metadata.get("finish_reason")
                )
            if isinstance(message_chunk, ToolMessage):
                # Tool Message - Return the result of the tool call
                event_stream_message["tool_call_id"] = message_chunk.tool_call_id
                yield _make_event("tool_call_result", event_stream_message)
            elif isinstance(message_chunk, AIMessageChunk):
                # AI Message - Raw message tokens
                if message_chunk.tool_calls:
                    # AI Message - Tool Call
                    event_stream_message["tool_calls"] = message_chunk.tool_calls
                    event_stream_message["tool_call_chunks"] = (
                        message_chunk.tool_call_chunks
                    )
                    yield _make_event("tool_calls", event_stream_message)
                elif message_chunk.tool_call_chunks:
                    # AI Message - Tool Call Chunks
                    event_stream_message["tool_call_chunks"] = (
                        message_chunk.tool_call_chunks
                    )
                    yield _make_event("tool_call_chunks", event_stream_message)
                else:
                    # AI Message - Raw message tokens
                    yield _make_event("message_chunk", event_stream_message)

            # Update last event time
            last_event_time = asyncio.get_event_loop().time()

    except Exception as e:
        logger.error(f"Error in SSE stream: {str(e)}")
        yield _make_event("error", {"error": str(e), "thread_id": thread_id})


def _make_event(event_type: str, data: dict[str, any]):
    if data.get("content") == "":
        data.pop("content")
    # Ensure proper SSE format with double newline at the end
    return f"event: {event_type}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


@app.post("/api/tts")
async def text_to_speech(request: TTSRequest):
    """Convert text to speech using volcengine TTS API."""
    app_id = os.getenv("VOLCENGINE_TTS_APPID", "")
    if not app_id:
        raise HTTPException(status_code=400, detail="VOLCENGINE_TTS_APPID is not set")
    access_token = os.getenv("VOLCENGINE_TTS_ACCESS_TOKEN", "")
    if not access_token:
        raise HTTPException(
            status_code=400, detail="VOLCENGINE_TTS_ACCESS_TOKEN is not set"
        )

    try:
        cluster = os.getenv("VOLCENGINE_TTS_CLUSTER", "volcano_tts")
        voice_type = os.getenv("VOLCENGINE_TTS_VOICE_TYPE", "BV700_V2_streaming")

        tts_client = VolcengineTTS(
            appid=app_id,
            access_token=access_token,
            cluster=cluster,
            voice_type=voice_type,
        )
        # Call the TTS API
        result = tts_client.text_to_speech(
            text=request.text[:1024],
            encoding=request.encoding,
            speed_ratio=request.speed_ratio,
            volume_ratio=request.volume_ratio,
            pitch_ratio=request.pitch_ratio,
            text_type=request.text_type,
            with_frontend=request.with_frontend,
            frontend_type=request.frontend_type,
        )

        if not result["success"]:
            raise HTTPException(status_code=500, detail=str(result["error"]))

        # Decode the base64 audio data
        audio_data = base64.b64decode(result["audio_data"])

        # Return the audio file
        return Response(
            content=audio_data,
            media_type=f"audio/{request.encoding}",
            headers={
                "Content-Disposition": (
                    f"attachment; filename=tts_output.{request.encoding}"
                )
            },
        )

    except Exception as e:
        logger.exception(f"Error in TTS endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=INTERNAL_SERVER_ERROR_DETAIL)


@app.post("/api/podcast/generate")
async def generate_podcast(request: GeneratePodcastRequest):
    try:
        report_content = request.content
        logger.info(
            f"Received podcast generation request, content length: {len(report_content)}"
        )
        logger.info(f"First 100 chars: {report_content[:100]}...")

        # Check environment variables
        logger.info(f"GOOGLE_API_KEY present: {bool(os.getenv('GOOGLE_API_KEY'))}")
        logger.info(f"GOOGLE_TTS_MODEL: {os.getenv('GOOGLE_TTS_MODEL')}")

        workflow = build_podcast_graph()
        logger.info("Podcast workflow built successfully")

        final_state = workflow.invoke({"input": report_content})
        logger.info("Podcast workflow invoked successfully")

        audio_bytes = final_state.get("output")
        if not audio_bytes:
            logger.error("No audio output from workflow")
            raise ValueError("No audio output generated")

        logger.info(f"Generated audio bytes: {len(audio_bytes)} bytes")
        return Response(content=audio_bytes, media_type="audio/mp3")
    except Exception as e:
        logger.exception(f"Error occurred during podcast generation: {str(e)}")
        raise HTTPException(
            status_code=500, detail=str(e)
        )  # Return actual error for debugging


@app.post("/api/podcast/generate-stream")
async def generate_podcast_stream(request: GeneratePodcastRequest):
    """Generate podcast with streaming progress updates"""

    async def podcast_stream_generator():
        try:
            report_content = request.content
            workflow = build_podcast_graph()

            # Track progress
            progress_data = {
                "total_steps": 0,
                "current_step": 0,
                "status": "initializing",
            }

            # Stream progress updates
            yield _make_event(
                "progress",
                {
                    "stage": "Initializing",
                    "progress": 0,
                    "message": "Starting podcast generation...",
                },
            )

            # Run workflow and collect state
            state = {"input": report_content}
            nodes_executed = []

            async for chunk in workflow.astream(state, stream_mode="updates"):
                node_name = list(chunk.keys())[0]
                nodes_executed.append(node_name)

                # Map node names to user-friendly messages
                if node_name == "script_writer_node":
                    yield _make_event(
                        "progress",
                        {
                            "stage": "Script Generation",
                            "progress": 20,
                            "message": "Creating podcast script...",
                        },
                    )
                elif node_name == "tts_node":
                    yield _make_event(
                        "progress",
                        {
                            "stage": "Audio Generation",
                            "progress": 50,
                            "message": "Generating audio from script...",
                        },
                    )
                elif node_name == "audio_mixer_node":
                    yield _make_event(
                        "progress",
                        {
                            "stage": "Audio Mixing",
                            "progress": 90,
                            "message": "Mixing audio tracks...",
                        },
                    )

            # Get final audio
            final_state = workflow.invoke(state)
            audio_bytes = final_state.get("output")

            if not audio_bytes:
                yield _make_event("error", {"error": "No audio output generated"})
                return

            # Convert audio to base64 for streaming
            import base64

            audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")

            yield _make_event(
                "complete",
                {
                    "audio_data": audio_base64,
                    "mime_type": "audio/mp3",
                    "size": len(audio_bytes),
                },
            )

        except Exception as e:
            logger.exception(f"Error in podcast stream: {str(e)}")
            yield _make_event("error", {"error": str(e)})

    return StreamingResponse(
        podcast_stream_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/api/ppt/generate")
async def generate_ppt(request: GeneratePPTRequest):
    try:
        report_content = request.content
        print(report_content)
        workflow = build_ppt_graph()
        final_state = workflow.invoke({"input": report_content})
        generated_file_path = final_state["generated_file_path"]
        with open(generated_file_path, "rb") as f:
            ppt_bytes = f.read()
        return Response(
            content=ppt_bytes,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        )
    except Exception as e:
        logger.exception(f"Error occurred during ppt generation: {str(e)}")
        raise HTTPException(status_code=500, detail=INTERNAL_SERVER_ERROR_DETAIL)


@app.post("/api/prose/generate")
async def generate_prose(request: GenerateProseRequest):
    try:
        sanitized_prompt = request.prompt.replace("\r\n", "").replace("\n", "")
        logger.info(f"Generating prose for prompt: {sanitized_prompt}")
        workflow = build_prose_graph()
        events = workflow.astream(
            {
                "content": request.prompt,
                "option": request.option,
                "command": request.command,
            },
            stream_mode="messages",
            subgraphs=True,
        )
        return StreamingResponse(
            (f"data: {event[0].content}\n\n" async for _, event in events),
            media_type="text/event-stream",
        )
    except Exception as e:
        logger.exception(f"Error occurred during prose generation: {str(e)}")
        raise HTTPException(status_code=500, detail=INTERNAL_SERVER_ERROR_DETAIL)


@app.post("/api/prompt/enhance")
async def enhance_prompt(request: EnhancePromptRequest):
    try:
        sanitized_prompt = request.prompt.replace("\r\n", "").replace("\n", "")
        logger.info(f"Enhancing prompt: {sanitized_prompt}")

        # Convert string report_style to ReportStyle enum
        report_style = None
        if request.report_style:
            try:
                # Handle both uppercase and lowercase input
                style_mapping = {
                    "ACADEMIC": ReportStyle.ACADEMIC,
                    "POPULAR_SCIENCE": ReportStyle.POPULAR_SCIENCE,
                    "NEWS": ReportStyle.NEWS,
                    "SOCIAL_MEDIA": ReportStyle.SOCIAL_MEDIA,
                }
                report_style = style_mapping.get(
                    request.report_style.upper(), ReportStyle.ACADEMIC
                )
            except Exception:
                # If invalid style, default to ACADEMIC
                report_style = ReportStyle.ACADEMIC
        else:
            report_style = ReportStyle.ACADEMIC

        workflow = build_prompt_enhancer_graph()
        final_state = workflow.invoke(
            {
                "prompt": request.prompt,
                "context": request.context,
                "report_style": report_style,
            }
        )
        return {"result": final_state["output"]}
    except Exception as e:
        logger.exception(f"Error occurred during prompt enhancement: {str(e)}")
        raise HTTPException(status_code=500, detail=INTERNAL_SERVER_ERROR_DETAIL)


@app.post("/api/mcp/server/metadata", response_model=MCPServerMetadataResponse)
async def mcp_server_metadata(request: MCPServerMetadataRequest):
    """Get information about an MCP server."""
    try:
        # Set default timeout with a longer value for this endpoint
        timeout = 300  # Default to 300 seconds for this endpoint

        # Use custom timeout from request if provided
        if request.timeout_seconds is not None:
            timeout = request.timeout_seconds

        # Load tools from the MCP server using the utility function
        tools = await load_mcp_tools(
            server_type=request.transport,
            command=request.command,
            args=request.args,
            url=request.url,
            env=request.env,
            timeout_seconds=timeout,
        )

        # Create the response with tools
        response = MCPServerMetadataResponse(
            transport=request.transport,
            command=request.command,
            args=request.args,
            url=request.url,
            env=request.env,
            tools=tools,
        )

        return response
    except Exception as e:
        logger.exception(f"Error in MCP server metadata endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=INTERNAL_SERVER_ERROR_DETAIL)


@app.get("/api/rag/config", response_model=RAGConfigResponse)
async def rag_config():
    """Get the config of the RAG."""
    return RAGConfigResponse(provider=SELECTED_RAG_PROVIDER)


@app.get("/api/rag/resources", response_model=RAGResourcesResponse)
async def rag_resources(request: Annotated[RAGResourceRequest, Query()]):
    """Get the resources of the RAG."""
    retriever = build_retriever()
    if retriever:
        return RAGResourcesResponse(resources=retriever.list_resources(request.query))
    return RAGResourcesResponse(resources=[])


@app.post("/api/rag/upload", response_model=RAGUploadResponse)
async def rag_upload(
    file: UploadFile = File(...),
    dataset_name: str = Form(default="My Documents"),
    dataset_description: str = Form(default="Uploaded documents"),
):
    """Upload a document to RAG."""
    try:
        # Import file validator
        from src.server.file_validator import FileValidator
        
        # Validate the uploaded file
        file_content, sanitized_filename, mime_type = await FileValidator.validate_upload(file)
        
        # Check if RAG is configured
        if SELECTED_RAG_PROVIDER != "ragflow":
            return RAGUploadResponse(
                success=False,
                dataset_id="",
                error="RAG provider is not configured or not RAGFlow",
            )

        # Build retriever (RAGFlow provider)
        retriever = build_retriever()
        if not retriever:
            return RAGUploadResponse(
                success=False, dataset_id="", error="Failed to initialize RAG provider"
            )

        # Use sanitized filename
        filename = sanitized_filename

        # Determine file type from filename
        file_extension = filename.split(".")[-1].lower() if "." in filename else "txt"

        # Check if we need to create a dataset first
        # For simplicity, we'll use existing datasets or create a new one
        resources = retriever.list_resources(dataset_name)

        if resources:
            # Use the first matching dataset
            dataset_id = resources[0].uri.split("/")[-1]
        else:
            # Create a new dataset
            try:
                dataset_result = retriever.create_dataset(
                    dataset_name, dataset_description
                )
                dataset_id = dataset_result.get("data", {}).get("id")
                if not dataset_id:
                    raise Exception("Failed to get dataset ID from creation response")
            except Exception as e:
                return RAGUploadResponse(
                    success=False,
                    dataset_id="",
                    error=f"Failed to create dataset: {str(e)}",
                )

        # Upload the document
        try:
            upload_result = retriever.upload_document(
                dataset_id=dataset_id,
                file_data=file_content,
                filename=filename,
                file_type=file_extension,
            )

            document_id = upload_result.get("data", {}).get("id")

            # Create resource reference
            resource = Resource(
                uri=(
                    f"rag://dataset/{dataset_id}#{document_id}"
                    if document_id
                    else f"rag://dataset/{dataset_id}"
                ),
                title=filename,
                description=f"Uploaded document: {filename}",
            )

            # Optionally trigger document processing
            if document_id:
                try:
                    retriever.process_document(dataset_id, document_id)
                except Exception as e:
                    logger.warning(f"Document processing failed: {e}")

            return RAGUploadResponse(
                success=True,
                dataset_id=dataset_id,
                document_id=document_id,
                resource=resource,
            )

        except Exception as e:
            return RAGUploadResponse(
                success=False,
                dataset_id=dataset_id,
                error=f"Failed to upload document: {str(e)}",
            )

    except Exception as e:
        logger.exception(f"Error in RAG upload: {str(e)}")
        return RAGUploadResponse(
            success=False, dataset_id="", error=f"Internal error: {str(e)}"
        )


@app.get("/api/config", response_model=ConfigResponse)
async def config():
    """Get the config of the server."""
    return ConfigResponse(
        rag=RAGConfigResponse(provider=SELECTED_RAG_PROVIDER),
        models=get_configured_llm_models(),
    )
