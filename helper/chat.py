from setup import api_router


@api_router.get("/health")
async def health_check():
    return {"status": "ok", "message": "Service is running"}
