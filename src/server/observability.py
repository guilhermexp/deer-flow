# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import os
import logging
from typing import Optional

from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import Resource
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from opentelemetry.instrumentation.logging import LoggingInstrumentor
from opentelemetry.exporter.prometheus import PrometheusMetricReader
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.semconv.resource import ResourceAttributes
from prometheus_client import start_http_server

logger = logging.getLogger(__name__)


class ObservabilityManager:
    """Manage OpenTelemetry instrumentation for the application"""
    
    def __init__(self):
        self.tracer: Optional[trace.Tracer] = None
        self.meter: Optional[metrics.Meter] = None
        self.enabled = os.getenv("OTEL_ENABLED", "true").lower() == "true"
        self.service_name = os.getenv("OTEL_SERVICE_NAME", "deerflow-api")
        self.jaeger_endpoint = os.getenv("JAEGER_ENDPOINT", "http://localhost:14268/api/traces")
        self.prometheus_port = int(os.getenv("PROMETHEUS_PORT", "9090"))
        
    def setup(self, app=None):
        """Setup OpenTelemetry instrumentation"""
        if not self.enabled:
            logger.info("OpenTelemetry is disabled")
            return
            
        try:
            # Create resource
            resource = Resource.create({
                ResourceAttributes.SERVICE_NAME: self.service_name,
                ResourceAttributes.SERVICE_VERSION: "0.1.0",
                ResourceAttributes.DEPLOYMENT_ENVIRONMENT: os.getenv("ENVIRONMENT", "development"),
            })
            
            # Setup tracing
            self._setup_tracing(resource)
            
            # Setup metrics
            self._setup_metrics(resource)
            
            # Instrument libraries
            self._instrument_libraries(app)
            
            # Setup custom metrics
            self._setup_custom_metrics()
            
            logger.info("OpenTelemetry instrumentation setup complete")
            
        except Exception as e:
            logger.error(f"Failed to setup OpenTelemetry: {e}")
            self.enabled = False
    
    def _setup_tracing(self, resource: Resource):
        """Setup tracing with Jaeger exporter"""
        # Create tracer provider
        provider = TracerProvider(resource=resource)
        
        # Add Jaeger exporter
        jaeger_exporter = JaegerExporter(
            collector_endpoint=self.jaeger_endpoint,
        )
        
        span_processor = BatchSpanProcessor(jaeger_exporter)
        provider.add_span_processor(span_processor)
        
        # Set global tracer provider
        trace.set_tracer_provider(provider)
        
        # Get tracer
        self.tracer = trace.get_tracer(__name__)
        
        logger.info(f"Tracing enabled with Jaeger endpoint: {self.jaeger_endpoint}")
    
    def _setup_metrics(self, resource: Resource):
        """Setup metrics with Prometheus exporter"""
        # Create Prometheus metric reader
        prometheus_reader = PrometheusMetricReader()
        
        # Create meter provider
        provider = MeterProvider(
            resource=resource,
            metric_readers=[prometheus_reader]
        )
        
        # Set global meter provider
        metrics.set_meter_provider(provider)
        
        # Get meter
        self.meter = metrics.get_meter(__name__)
        
        # Start Prometheus HTTP server
        start_http_server(self.prometheus_port)
        
        logger.info(f"Metrics enabled with Prometheus on port: {self.prometheus_port}")
    
    def _instrument_libraries(self, app):
        """Instrument various libraries"""
        # Instrument FastAPI
        if app:
            FastAPIInstrumentor.instrument_app(app)
            logger.info("FastAPI instrumented")
        
        # Instrument SQLAlchemy
        try:
            from src.database.base import engine
            SQLAlchemyInstrumentor().instrument(
                engine=engine,
                service=f"{self.service_name}-db"
            )
            logger.info("SQLAlchemy instrumented")
        except Exception as e:
            logger.warning(f"Failed to instrument SQLAlchemy: {e}")
        
        # Instrument Redis
        try:
            RedisInstrumentor().instrument()
            logger.info("Redis instrumented")
        except Exception as e:
            logger.warning(f"Failed to instrument Redis: {e}")
        
        # Instrument HTTP client
        HTTPXClientInstrumentor().instrument()
        logger.info("HTTPX client instrumented")
        
        # Instrument logging
        LoggingInstrumentor().instrument(set_logging_format=True)
        logger.info("Logging instrumented")
    
    def _setup_custom_metrics(self):
        """Setup custom application metrics"""
        if not self.meter:
            return
            
        # Request counter
        self.request_counter = self.meter.create_counter(
            name="deerflow_requests_total",
            description="Total number of requests",
            unit="1"
        )
        
        # Request duration histogram
        self.request_duration = self.meter.create_histogram(
            name="deerflow_request_duration_seconds",
            description="Request duration in seconds",
            unit="s"
        )
        
        # Active users gauge
        self.active_users = self.meter.create_up_down_counter(
            name="deerflow_active_users",
            description="Number of active users",
            unit="1"
        )
        
        # Cache hit ratio
        self.cache_hits = self.meter.create_counter(
            name="deerflow_cache_hits_total",
            description="Total number of cache hits",
            unit="1"
        )
        
        self.cache_misses = self.meter.create_counter(
            name="deerflow_cache_misses_total",
            description="Total number of cache misses",
            unit="1"
        )
        
        # Database connection pool metrics
        self.db_connections_active = self.meter.create_observable_gauge(
            name="deerflow_db_connections_active",
            description="Number of active database connections",
            callbacks=[self._get_db_connections_active]
        )
        
        # Research workflow metrics
        self.research_workflows_started = self.meter.create_counter(
            name="deerflow_research_workflows_started_total",
            description="Total number of research workflows started",
            unit="1"
        )
        
        self.research_workflows_completed = self.meter.create_counter(
            name="deerflow_research_workflows_completed_total",
            description="Total number of research workflows completed",
            unit="1"
        )
        
        self.research_workflows_failed = self.meter.create_counter(
            name="deerflow_research_workflows_failed_total",
            description="Total number of research workflows failed",
            unit="1"
        )
    
    def _get_db_connections_active(self, options):
        """Callback to get active database connections"""
        try:
            from src.database.base import engine
            pool = engine.pool
            return [(pool.checked_in_connections(), {"state": "idle"}),
                    (pool.checked_out_connections(), {"state": "active"})]
        except:
            return [(0, {"state": "unknown"})]
    
    def record_request(self, method: str, endpoint: str, status_code: int, duration: float):
        """Record request metrics"""
        if not self.enabled or not self.meter:
            return
            
        attributes = {
            "method": method,
            "endpoint": endpoint,
            "status_code": str(status_code),
            "status_class": f"{status_code // 100}xx"
        }
        
        self.request_counter.add(1, attributes)
        self.request_duration.record(duration, attributes)
    
    def record_cache_hit(self, cache_key: str):
        """Record cache hit"""
        if not self.enabled or not self.meter:
            return
            
        self.cache_hits.add(1, {"cache_key": cache_key})
    
    def record_cache_miss(self, cache_key: str):
        """Record cache miss"""
        if not self.enabled or not self.meter:
            return
            
        self.cache_misses.add(1, {"cache_key": cache_key})
    
    def record_workflow_start(self, workflow_type: str):
        """Record workflow start"""
        if not self.enabled or not self.meter:
            return
            
        self.research_workflows_started.add(1, {"workflow_type": workflow_type})
    
    def record_workflow_complete(self, workflow_type: str):
        """Record workflow completion"""
        if not self.enabled or not self.meter:
            return
            
        self.research_workflows_completed.add(1, {"workflow_type": workflow_type})
    
    def record_workflow_failure(self, workflow_type: str, error_type: str):
        """Record workflow failure"""
        if not self.enabled or not self.meter:
            return
            
        self.research_workflows_failed.add(1, {
            "workflow_type": workflow_type,
            "error_type": error_type
        })
    
    def create_span(self, name: str, attributes: Optional[dict] = None):
        """Create a new span for tracing"""
        if not self.enabled or not self.tracer:
            return None
            
        return self.tracer.start_as_current_span(name, attributes=attributes)


# Global observability manager
observability = ObservabilityManager()