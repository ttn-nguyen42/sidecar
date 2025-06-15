from fastapi import APIRouter, HTTPException
from services.chat import ChatRequest, ChatService, CreateThreadRequest
from setup import registry

router = APIRouter(prefix="/chat")
service = ChatService(registry)


@router.post("/thread")
async def create_thread(body: CreateThreadRequest):
    id = service.create_thread(body)
    return {"id": id}


@router.get("/threads")
async def list_threads():
    return {"message": "List of threads"}


@router.get("/thread/{id}")
async def get_thread(id: str):
    thread = service.get_thread(id)
    if thread:
        return thread
    raise HTTPException(status_code=404, detail=f"Thread {id} not found")


@router.delete("/thread/{id}")
async def delete_thread(id: str):
    return {"message": f"Thread {id} deleted"}


@router.post("/thread/send")
async def send(body: ChatRequest):
    try:
        response = service.send_message(body)
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/thread/{id}/poll")
async def poll(id: str):
    return {"message": f"Polling thread {id}"}


@router.get("/thread/{id}/messages")
async def get_messages(id: str):
    return {"message": f"Messages for thread {id}"}
