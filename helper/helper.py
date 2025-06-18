from fastapi import APIRouter, HTTPException
from setup import registry
from services.config import ConfigService


router = APIRouter(prefix="/api")
config_service = ConfigService(registry)


@router.get("/config")
async def get_config():
    return [c.to_dict() for c in config_service.list()]


@router.get("/config/{key}")
async def get_config(key: str):
    config = config_service.get(key)
    if config is None:
        raise HTTPException(status_code=404, detail=f"Config {key} not found")
    return config.to_dict()


@router.post("/config/{key}")
async def set_config(key: str, value: str):
    config_service.set(key, value)
    return {"message": f"Config {key} set"}


@router.delete("/config/{key}")
async def delete_config(key: str):
    config_service.unset(key)
    return {"message": f"Config {key} deleted"}
