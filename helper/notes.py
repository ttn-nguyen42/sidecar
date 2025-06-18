import logging
from fastapi import APIRouter, HTTPException
from services.models import Note
from services.notes import CreateNoteRequest, UpdateNoteRequest, NotesService
from setup import registry

router = APIRouter(prefix="/notes")
service = NotesService(registry)

logger = logging.getLogger(__name__)

@router.post("")
async def create_note(request: CreateNoteRequest):
    return service.create(request)


@router.get("{id}")
async def get_note(id: int):
    try:
        return service.get(id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("{id}")
async def update_note(id: int, request: UpdateNoteRequest):
    try:
        service.update(id, request)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("{id}")
async def delete_note(id: int):
    try:
        service.delete(id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
async def list_notes():
    return service.list()
