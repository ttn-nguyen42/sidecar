import logging
from services.kanban import TaskMetadata
from services.notes import DocumentMetadata
from setup import Registry, registry
from langchain_core.documents import Document

logger = logging.getLogger(__name__)


class PromptService:
    def __init__(self, registry: Registry):
        self.registry = registry

    def _build_note_str(self, content: str, note: DocumentMetadata) -> str:
        return f"""
        - id {note.id} title "{note.title}": "{content}"
        """

    def _build_task_str(self, content: str, task: TaskMetadata) -> str:
        return f"""
        - id {task.id} status '{task.board.value}' priority {task.priority.name} {f'due date {task.due_date.isoformat()}' if task.due_date else ''} created at {task.created_at.isoformat()}: "{content}"
        """

    def _build_history_str(self, content: str) -> str:
        return f"""
        - "{content}"
        """

    def build_chat_system_prompt(self, memory: list[Document], content: str) -> str:
        memory_str = ""

        history = []
        notes = []
        tasks = []

        for m in memory:
            if DocumentMetadata.is_note(m.metadata):
                logger.debug(f"Note: {m.metadata}")
                note_meta = DocumentMetadata.from_dict(m.metadata)
                note_str = self._build_note_str(m.page_content, note_meta)
                notes.append(note_str)
            elif TaskMetadata.is_task(m.metadata):
                logger.debug(f"Task: {m.metadata}")
                task_meta = TaskMetadata.from_dict(m.metadata)
                task_str = self._build_task_str(m.page_content, task_meta)
                tasks.append(task_str)
            else:
                history_str = self._build_history_str(m.page_content)
                history.append(history_str)

        history_str = "\n".join(history)
        notes_str = "\n".join(notes)
        tasks_str = "\n".join(tasks)

        memory_str = f"""
        1. Tasks:
        {tasks_str}
        2. Notes:
        {notes_str}
        3. History:
        {history_str}
        """

        return f"""
        You are an expert knowledge research and personal assistant integrated into a system that includes chat, notes, and task management (Kanban board).
        You specialize in software engineering, computer science, and coding. 
        Your job is to provide clear, summarized, and actionable responses using all available context: chat history, notes, and tasks. 
        Always prioritize clarity and relevance.
        Here's the conversation history, notes, and tasks: \n\n{memory_str}.
        """


ps = PromptService(registry=registry)
