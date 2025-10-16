# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

"""
Pytest configuration for server tests.
Mocks observability imports to avoid dependency issues.
"""

import sys
from unittest.mock import MagicMock

# Create comprehensive mock for opentelemetry
opentel_mock = MagicMock()

# Mock all opentelemetry submodules
sys.modules['opentelemetry'] = opentel_mock
sys.modules['opentelemetry.instrumentation'] = opentel_mock.instrumentation
sys.modules['opentelemetry.instrumentation.logging'] = opentel_mock.instrumentation.logging
sys.modules['opentelemetry.instrumentation.sqlalchemy'] = opentel_mock.instrumentation.sqlalchemy
sys.modules['opentelemetry.instrumentation.redis'] = opentel_mock.instrumentation.redis
sys.modules['opentelemetry.instrumentation.fastapi'] = opentel_mock.instrumentation.fastapi
sys.modules['opentelemetry.instrumentation.httpx'] = opentel_mock.instrumentation.httpx

# SDK modules
sys.modules['opentelemetry.sdk'] = opentel_mock.sdk
sys.modules['opentelemetry.sdk.trace'] = opentel_mock.sdk.trace
sys.modules['opentelemetry.sdk.trace.export'] = opentel_mock.sdk.trace.export
sys.modules['opentelemetry.sdk.resources'] = opentel_mock.sdk.resources
sys.modules['opentelemetry.sdk.metrics'] = opentel_mock.sdk.metrics
sys.modules['opentelemetry.sdk.metrics.export'] = opentel_mock.sdk.metrics.export

# Exporter modules
sys.modules['opentelemetry.exporter'] = opentel_mock.exporter
sys.modules['opentelemetry.exporter.otlp'] = opentel_mock.exporter.otlp
sys.modules['opentelemetry.exporter.otlp.proto'] = opentel_mock.exporter.otlp.proto
sys.modules['opentelemetry.exporter.otlp.proto.grpc'] = opentel_mock.exporter.otlp.proto.grpc
sys.modules['opentelemetry.exporter.otlp.proto.grpc.trace_exporter'] = opentel_mock.exporter.otlp.proto.grpc.trace_exporter

# Trace and other modules
sys.modules['opentelemetry.trace'] = opentel_mock.trace
sys.modules['opentelemetry.propagate'] = opentel_mock.propagate
