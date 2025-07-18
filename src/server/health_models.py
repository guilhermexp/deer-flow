# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

from datetime import datetime
from typing import Dict, List, Literal, Optional, Union
from enum import Enum

from pydantic import BaseModel, Field, field_validator


class HealthMetricType(str, Enum):
    """Tipos de métricas de saúde suportados."""
    CPU_USAGE = "cpu_usage"
    MEMORY_USAGE = "memory_usage"
    DISK_USAGE = "disk_usage"
    RESPONSE_TIME = "response_time"
    REQUEST_COUNT = "request_count"
    ERROR_RATE = "error_rate"
    ACTIVE_CONNECTIONS = "active_connections"
    THREAD_COUNT = "thread_count"
    CACHE_HIT_RATE = "cache_hit_rate"
    DATABASE_CONNECTIONS = "database_connections"
    QUEUE_SIZE = "queue_size"
    LATENCY = "latency"


class HealthStatus(str, Enum):
    """Status de saúde do sistema."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    CRITICAL = "critical"


class HealthMetricRequest(BaseModel):
    """Request model para métricas de saúde."""
    
    metric_types: Optional[List[HealthMetricType]] = Field(
        None,
        description="Lista de tipos de métricas a serem retornadas. Se None, retorna todas."
    )
    start_time: Optional[datetime] = Field(
        None,
        description="Tempo de início para histórico de métricas"
    )
    end_time: Optional[datetime] = Field(
        None,
        description="Tempo de fim para histórico de métricas"
    )
    interval: Optional[Literal["1m", "5m", "15m", "1h", "1d"]] = Field(
        "5m",
        description="Intervalo de agregação para métricas históricas"
    )
    include_details: Optional[bool] = Field(
        False,
        description="Incluir detalhes adicionais sobre cada métrica"
    )
    
    @field_validator('metric_types')
    @classmethod
    def validate_metric_types(cls, v: Optional[List[HealthMetricType]]) -> Optional[List[HealthMetricType]]:
        """Valida que não há tipos de métricas duplicados."""
        if v is not None and len(v) != len(set(v)):
            raise ValueError("Tipos de métricas duplicados não são permitidos")
        return v
    
    @field_validator('end_time')
    @classmethod
    def validate_time_range(cls, v: Optional[datetime], info) -> Optional[datetime]:
        """Valida que end_time é posterior a start_time."""
        if v is not None and 'start_time' in info.data:
            start_time = info.data['start_time']
            if start_time is not None and v <= start_time:
                raise ValueError("end_time deve ser posterior a start_time")
        return v


class MetricValue(BaseModel):
    """Valor de uma métrica individual."""
    
    value: Union[float, int] = Field(
        ...,
        description="Valor atual da métrica"
    )
    unit: str = Field(
        ...,
        description="Unidade de medida (%, ms, count, etc.)"
    )
    threshold_warning: Optional[Union[float, int]] = Field(
        None,
        description="Limite de alerta para esta métrica"
    )
    threshold_critical: Optional[Union[float, int]] = Field(
        None,
        description="Limite crítico para esta métrica"
    )
    status: HealthStatus = Field(
        ...,
        description="Status baseado nos thresholds"
    )
    details: Optional[Dict[str, Union[str, int, float]]] = Field(
        None,
        description="Detalhes adicionais específicos da métrica"
    )


class HealthMetricResponse(BaseModel):
    """Response model para métricas de saúde."""
    
    timestamp: datetime = Field(
        ...,
        description="Timestamp da coleta das métricas"
    )
    metrics: Dict[HealthMetricType, MetricValue] = Field(
        ...,
        description="Dicionário de métricas e seus valores"
    )
    overall_status: HealthStatus = Field(
        ...,
        description="Status geral do sistema baseado em todas as métricas"
    )
    message: Optional[str] = Field(
        None,
        description="Mensagem descritiva sobre o status"
    )


class ServiceHealth(BaseModel):
    """Status de saúde de um serviço específico."""
    
    name: str = Field(
        ...,
        description="Nome do serviço"
    )
    status: HealthStatus = Field(
        ...,
        description="Status do serviço"
    )
    response_time_ms: Optional[float] = Field(
        None,
        description="Tempo de resposta em milissegundos"
    )
    last_check: datetime = Field(
        ...,
        description="Última verificação do serviço"
    )
    error_message: Optional[str] = Field(
        None,
        description="Mensagem de erro se o serviço não estiver saudável"
    )
    dependencies: Optional[List[str]] = Field(
        None,
        description="Lista de dependências do serviço"
    )


class HealthSummaryResponse(BaseModel):
    """Response model para resumo de saúde do sistema."""
    
    status: HealthStatus = Field(
        ...,
        description="Status geral do sistema"
    )
    timestamp: datetime = Field(
        ...,
        description="Timestamp da verificação"
    )
    uptime_seconds: int = Field(
        ...,
        description="Tempo de atividade em segundos"
    )
    version: str = Field(
        ...,
        description="Versão do sistema"
    )
    services: List[ServiceHealth] = Field(
        ...,
        description="Status de saúde dos serviços individuais"
    )
    critical_issues: List[str] = Field(
        default_factory=list,
        description="Lista de problemas críticos detectados"
    )
    warnings: List[str] = Field(
        default_factory=list,
        description="Lista de avisos"
    )
    metrics_summary: Dict[HealthMetricType, Dict[str, Union[float, int, str]]] = Field(
        ...,
        description="Resumo das principais métricas"
    )


class HistoricalMetric(BaseModel):
    """Ponto de dados histórico para uma métrica."""
    
    timestamp: datetime = Field(
        ...,
        description="Timestamp do ponto de dados"
    )
    value: Union[float, int] = Field(
        ...,
        description="Valor da métrica neste momento"
    )
    status: HealthStatus = Field(
        ...,
        description="Status neste momento"
    )


class HealthHistoryResponse(BaseModel):
    """Response model para histórico de métricas de saúde."""
    
    metric_type: HealthMetricType = Field(
        ...,
        description="Tipo de métrica"
    )
    unit: str = Field(
        ...,
        description="Unidade de medida"
    )
    start_time: datetime = Field(
        ...,
        description="Início do período histórico"
    )
    end_time: datetime = Field(
        ...,
        description="Fim do período histórico"
    )
    interval: str = Field(
        ...,
        description="Intervalo de agregação usado"
    )
    data_points: List[HistoricalMetric] = Field(
        ...,
        description="Pontos de dados históricos"
    )
    statistics: Dict[str, Union[float, int]] = Field(
        ...,
        description="Estatísticas do período (min, max, avg, p95, p99)"
    )
    trend: Literal["improving", "stable", "degrading"] = Field(
        ...,
        description="Tendência da métrica no período"
    )