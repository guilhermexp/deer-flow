# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from src.database.base import get_db
from src.database.models import Project, Task, User, TaskStatus, TaskPriority
from src.server.auth import get_current_active_user

router = APIRouter(prefix="/api/projects", tags=["projects"])


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#3B82F6"
    icon: Optional[str] = "folder"
    status: str = "active"


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[TaskStatus] = TaskStatus.TODO
    priority: Optional[TaskPriority] = TaskPriority.MEDIUM
    category: Optional[str] = None
    due_date: Optional[datetime] = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    color: str
    icon: str
    status: str
    created_at: datetime
    updated_at: datetime
    task_count: Optional[int] = 0
    completed_task_count: Optional[int] = 0

    class Config:
        from_attributes = True


class KanbanColumn(BaseModel):
    id: str
    title: str
    color: str
    tasks: List["KanbanTask"]


class KanbanTask(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    priority: TaskPriority
    order: int
    created_at: datetime

    class Config:
        from_attributes = True


class KanbanBoard(BaseModel):
    project_id: int
    project_name: str
    columns: List[KanbanColumn]


class TaskMoveRequest(BaseModel):
    column_id: str
    order: int


# Forward reference resolution
KanbanColumn.model_rebuild()


@router.get("/", response_model=List[ProjectResponse])
async def get_projects(
    status: Optional[str] = None,
    limit: int = Query(100, le=500),
    offset: int = 0,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get user's projects with task counts."""
    # Get projects first
    query = db.query(Project).filter(Project.user_id == current_user.id)

    if status:
        query = query.filter(Project.status == status)

    projects_result = query.offset(offset).limit(limit).all()

    projects = []
    for project in projects_result:
        # Get task counts for each project
        task_count = db.query(Task).filter(Task.project_id == project.id).count()
        completed_count = (
            db.query(Task)
            .filter(Task.project_id == project.id, Task.status == TaskStatus.DONE)
            .count()
        )

        projects.append(
            ProjectResponse(
                id=project.id,
                name=project.name,
                description=project.description,
                color=project.color,
                icon=project.icon,
                status=project.status,
                created_at=project.created_at,
                updated_at=project.updated_at,
                task_count=task_count,
                completed_task_count=completed_count,
            )
        )

    return projects


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get a specific project."""
    result = (
        db.query(
            Project,
            func.count(Task.id).label("task_count"),
            func.sum(case((Task.status == TaskStatus.DONE, 1), else_=0)).label(
                "completed_task_count"
            ),
        )
        .outerjoin(Task, Task.project_id == Project.id)
        .filter(Project.id == project_id, Project.user_id == current_user.id)
        .group_by(Project.id)
        .first()
    )

    if not result:
        raise HTTPException(status_code=404, detail="Project not found")

    project, task_count, completed_count = result

    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        color=project.color,
        icon=project.icon,
        status=project.status,
        created_at=project.created_at,
        updated_at=project.updated_at,
        task_count=task_count or 0,
        completed_task_count=completed_count or 0,
    )


@router.post("/", response_model=ProjectResponse)
async def create_project(
    project: ProjectCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create a new project."""
    db_project = Project(user_id=current_user.id, **project.dict())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)

    # Return with empty task counts
    return ProjectResponse(
        id=db_project.id,
        name=db_project.name,
        description=db_project.description,
        color=db_project.color,
        icon=db_project.icon,
        status=db_project.status,
        created_at=db_project.created_at,
        updated_at=db_project.updated_at,
        task_count=0,
        completed_task_count=0,
    )


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    project_update: ProjectUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update a project."""
    db_project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.user_id == current_user.id)
        .first()
    )

    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Update fields
    update_data = project_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_project, field, value)

    db.commit()
    db.refresh(db_project)

    # Get task counts
    task_count = db.query(Task).filter(Task.project_id == project_id).count()
    completed_count = (
        db.query(Task)
        .filter(Task.project_id == project_id, Task.status == TaskStatus.DONE)
        .count()
    )

    return ProjectResponse(
        id=db_project.id,
        name=db_project.name,
        description=db_project.description,
        color=db_project.color,
        icon=db_project.icon,
        status=db_project.status,
        created_at=db_project.created_at,
        updated_at=db_project.updated_at,
        task_count=task_count,
        completed_task_count=completed_count,
    )


@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Delete a project and all its tasks."""
    db_project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.user_id == current_user.id)
        .first()
    )

    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Tasks will be deleted automatically due to cascade
    db.delete(db_project)
    db.commit()
    return {"message": "Project deleted successfully"}


@router.get("/{project_id}/kanban", response_model=KanbanBoard)
async def get_kanban_board(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get kanban board for a project."""
    # Verify project ownership
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.user_id == current_user.id)
        .first()
    )

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Define kanban columns
    columns_config = [
        {
            "id": "backlog",
            "title": "Backlog",
            "color": "#6B7280",
            "status": TaskStatus.TODO,
        },
        {"id": "todo", "title": "To Do", "color": "#3B82F6", "status": TaskStatus.TODO},
        {
            "id": "in_progress",
            "title": "In Progress",
            "color": "#F59E0B",
            "status": TaskStatus.IN_PROGRESS,
        },
        {"id": "done", "title": "Done", "color": "#10B981", "status": TaskStatus.DONE},
    ]

    # Get all tasks for the project
    tasks = (
        db.query(Task)
        .filter(Task.project_id == project_id, Task.user_id == current_user.id)
        .order_by(Task.order, Task.created_at)
        .all()
    )

    # Organize tasks into columns
    columns = []
    for col_config in columns_config:
        column_tasks = []
        for task in tasks:
            # Match by column_id or by status
            if task.column_id == col_config["id"] or (
                not task.column_id and task.status == col_config["status"]
            ):
                column_tasks.append(
                    KanbanTask(
                        id=task.id,
                        title=task.title,
                        description=task.description,
                        priority=task.priority,
                        order=task.order,
                        created_at=task.created_at,
                    )
                )

        columns.append(
            KanbanColumn(
                id=col_config["id"],
                title=col_config["title"],
                color=col_config["color"],
                tasks=column_tasks,
            )
        )

    return KanbanBoard(
        project_id=project.id, project_name=project.name, columns=columns
    )


@router.post("/{project_id}/tasks", response_model=KanbanTask)
async def create_kanban_task(
    project_id: int,
    task: TaskCreate,
    column_id: str = "backlog",
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create a task in the kanban board."""
    # Verify project ownership
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.user_id == current_user.id)
        .first()
    )

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Map column_id to status
    column_status_map = {
        "backlog": TaskStatus.TODO,
        "todo": TaskStatus.TODO,
        "in_progress": TaskStatus.IN_PROGRESS,
        "done": TaskStatus.DONE,
    }

    status = column_status_map.get(column_id, TaskStatus.TODO)

    # Get max order in column
    max_order = (
        db.query(func.max(Task.order))
        .filter(Task.project_id == project_id, Task.column_id == column_id)
        .scalar()
        or 0
    )

    # Create task
    task_data = task.dict()
    task_data["status"] = status  # Override with column-based status

    db_task = Task(
        user_id=current_user.id,
        project_id=project_id,
        column_id=column_id,
        order=max_order + 1,
        **task_data,
    )

    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    return KanbanTask(
        id=db_task.id,
        title=db_task.title,
        description=db_task.description,
        priority=db_task.priority,
        order=db_task.order,
        created_at=db_task.created_at,
    )


@router.put("/{project_id}/tasks/{task_id}/move", response_model=KanbanTask)
async def move_kanban_task(
    project_id: int,
    task_id: int,
    move_request: TaskMoveRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Move a task to a different column or position."""
    # Verify task ownership
    db_task = (
        db.query(Task)
        .filter(
            Task.id == task_id,
            Task.project_id == project_id,
            Task.user_id == current_user.id,
        )
        .first()
    )

    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Update column and status
    column_status_map = {
        "backlog": TaskStatus.TODO,
        "todo": TaskStatus.TODO,
        "in_progress": TaskStatus.IN_PROGRESS,
        "done": TaskStatus.DONE,
    }

    db_task.column_id = move_request.column_id
    db_task.status = column_status_map.get(move_request.column_id, TaskStatus.TODO)
    db_task.order = move_request.order

    # If marking as done, set completed_at
    if db_task.status == TaskStatus.DONE and not db_task.completed_at:
        db_task.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(db_task)

    return KanbanTask(
        id=db_task.id,
        title=db_task.title,
        description=db_task.description,
        priority=db_task.priority,
        order=db_task.order,
        created_at=db_task.created_at,
    )
