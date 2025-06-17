import logging
from fastapi import FastAPI
import uvicorn
from config import set_cors
from services import models
import voice
from setup import registry
import chat
import helper
from log import get_uvicorn_log_config


logger = logging.getLogger(__name__)


if __name__ == "__main__":
    configs = registry.get_configs()
    port = configs['http'].getint('port', 8768)
    alchemy = registry.get_alchemy()
    models.init_models(alchemy.engine)
    logger.info(f"Starting Sidecar API on port {port}")
    app = FastAPI(title="Sidecar API",
                  description="API for Sidecar services",
                  version="1.0.0")
    set_cors(app=app)
    app.include_router(chat.router)
    app.include_router(helper.router)
    app.include_router(voice.router)
    uvicorn.run(app,
                port=port,
                log_config=get_uvicorn_log_config(configs))
