import logging
from fastapi import FastAPI
import uvicorn
from setup import api_router, registry
import chat
import helper
from log import get_uvicorn_log_config


logger = logging.getLogger(__name__)


if __name__ == "__main__":
    configs = registry.get_configs()
    port = configs['http'].getint('port', 8768)
    logger.info(f"Starting Sidecar API on port {port}")
    app = FastAPI(title="Sidecar API",
                  description="API for Sidecar services",
                  version="1.0.0")
    app.include_router(api_router)
    uvicorn.run(app,
                port=port,
                log_config=get_uvicorn_log_config(configs))
