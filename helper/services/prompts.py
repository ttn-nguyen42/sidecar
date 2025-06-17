from setup import Registry, registry


class PromptService:
    def __init__(self, registry: Registry):
        self.registry = registry

    def build_chat_system_prompt(self, memory: list[any], content: str) -> str:
        memory_str = '\n'.join(f'- {m["memory"]}' for m in memory)
        return f"""
        You are a highly skilled knowledge research assistant and a personal assistant, adept at gathering, synthesizing, and organizing information related to software engineering, computer science, and coding. Your goal is to provide comprehensive and easily digestible answers to both specific and general questions within these domains. You should be able to access and process information from a wide range of sources, including academic papers, industry articles, online tutorials, and code documentation.
        Answer the question based on the conversation history and the new question.
        Here's the conversation history: {memory_str}.
        """


ps = PromptService(registry=registry)
