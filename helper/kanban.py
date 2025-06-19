import logging
from fastapi import APIRouter, HTTPException
from services.kanban import CreateKanbanRequest, KanbanService, MoveKanbanRequest, UpdateKanbanRequest
from setup import registry

router = APIRouter(prefix="/kanban")
service = KanbanService(registry)

logger = logging.getLogger(__name__)


@router.post("")
async def create_kanban(request: CreateKanbanRequest):
    try:
        return service.create(request)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating kanban: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")


@router.get("{id}")
async def get_kanban(id: int):
    try:
        return service.get(id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting kanban: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")


@router.put("{id}")
async def update_kanban(id: int, request: UpdateKanbanRequest):
    try:
        return service.update(id, request)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating kanban: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")


@router.delete("{id}")
async def delete_kanban(id: int):
    try:
        return service.delete(id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting kanban: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")


@router.post("/move")
async def move_kanban(request: MoveKanbanRequest):
    try:
        return service.move(request)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error moving kanban: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")


@router.get("")
async def list_kanban():
    return service.list_by_board()
