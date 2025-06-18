from setup import Registry
from langchain_text_splitters import RecursiveCharacterTextSplitter
from setup import registry
from langchain.retrievers.merger_retriever import MergerRetriever
from langchain_core.retrievers import BaseRetriever
from langchain_community.document_transformers import EmbeddingsRedundantFilter
from langchain.retrievers.document_compressors.base import DocumentCompressorPipeline
from langchain.retrievers.contextual_compression import ContextualCompressionRetriever
from langchain_community.document_transformers import LongContextReorder


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

    def combine_retriever(self, retrievers: list[BaseRetriever], filter: bool = False, reorder: bool = False) -> BaseRetriever:
        lotr = MergerRetriever(retrievers=retrievers)

        if filter:
            transformers = []
            transformers.append(EmbeddingsRedundantFilter(embeddings=self.model))
            if reorder:
                transformers.append(LongContextReorder())
            pipeline = DocumentCompressorPipeline(transformers=transformers)
            compresed_retriever = ContextualCompressionRetriever(
                base_compressor=pipeline,
                base_retriever=lotr
            )
            return compresed_retriever

        return lotr


embed_service = EmbedService(registry)
