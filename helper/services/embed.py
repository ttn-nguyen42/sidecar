from setup import Registry
from langchain_text_splitters import RecursiveCharacterTextSplitter
from setup import registry


class EmbedService():
    def __init__(self, registry: Registry):
        self.registry = registry
        self.model = registry.get_embeddings()
        return

    def split_text(self, text: str) -> list[str]:
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=100,
            chunk_overlap=10
        )
        return splitter.split_text(text)


embed_service = EmbedService(registry)
