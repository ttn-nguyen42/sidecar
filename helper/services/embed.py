from setup import Registry


class EmbedService():
    def __init__(self, registry: Registry):
        self.registry = registry
        self.model = registry.get_embeddings()
        return

    def embed(self, text: str) -> list[float]:
        self.model.embed_documents
        return
