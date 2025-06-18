import logging
from fastapi import APIRouter, HTTPException
from services.chat import ChatRequest, ChatResponse, ChatService, CreateThreadRequest
from sse_starlette import EventSourceResponse
from setup import registry

router = APIRouter(prefix="/chat")
service = ChatService(registry)

logger = logging.getLogger(__name__)


@router.post("/thread")
async def create_thread(body: CreateThreadRequest):
    id = service.create_thread(body)
    return {"id": id}


@router.get("/threads")
async def list_threads():
    threads = service.list_threads()
    return {"threads": [t.to_dict() for t in threads]}


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
        generator = service.send_message(body)
        return EventSourceResponse(safe_generator(gen=generator))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def safe_generator(gen):
    try:
        async for item in gen:
            yield item
    except ValueError as e:
        yield ChatResponse(code=400, content=f"Error: {str(e)}")
    except Exception as e:
        yield ChatResponse(code=500, content=f"Internal error: {str(e)}")


@router.get("/thread/{id}/messages")
async def get_messages(id: str, page: int, limit: int):
    messages = service.get_messages(id, page, limit)
    return {"messages": [m.to_dict() for m in messages]}
