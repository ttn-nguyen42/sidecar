import { createFileRoute, Link } from '@tanstack/react-router';
import style from './chatPage.module.css';
import { ChatDimensions } from '../state/dimensions';
import DAFKeepAlive from '../state/DAFKeepAlive';
import { ChatMessageList } from '../components/ui/chat/chat-message-list';
import { ChatBubble, ChatBubbleAction, ChatBubbleActionWrapper, ChatBubbleMessage } from '../components/ui/chat/chat-bubble';
import { ChatInput } from '../components/ui/chat/chat-input';
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, Sidebar, SidebarContent, useSidebar } from '../components/ui/sidebar';
import { Button } from '../components/ui/button';
import { Copy, CornerDownLeft, ListTodo, Mic, Notebook, Settings, Info, Pencil, Trash } from 'lucide-react';
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '../components/ui/context-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import TopBar from '../components/atomic/TopBar';

const ChatPage = () => {

    return <SidebarProvider>
        <ChatSidebar />
        <div
            className={style.chat + " relative " + style.noDrag + " flex flex-col overflow-hidden"}
            style={{ height: ChatDimensions.height, width: ChatDimensions.width }}>
            <TopBar left={
                <>
                    <h1>Chat Title Here</h1>
                </>
            } right={
                <>
                    <p className='text-sm text-gray-500'>Started 3 days ago</p>
                    <SidebarTrigger className="size-8" />
                </>
            }>
            </TopBar>
            <ChatMessageList className={style.noDrag + " flex-1"} style={{ width: '100%', height: '90%' }}>
                <WideChatBubble variant='sent' layout='default'>
                    <ChatBubbleMessage>
                        Hello, how has your day been? I hope you are doing well.
                    </ChatBubbleMessage>
                </WideChatBubble>

                <WideChatBubble variant='received' layout='ai'>
                    <ChatBubbleMessage variant='received'>
                        Hi, I am doing well, thank you for asking. How can I help you today?
                    </ChatBubbleMessage>
                    <ChatBubbleActionWrapper>
                        <ChatBubbleAction className='size-8' icon={<Copy />}>

                        </ChatBubbleAction>
                    </ChatBubbleActionWrapper>
                </WideChatBubble>
                <WideChatBubble variant='sent' layout='default'>
                    <ChatBubbleMessage variant='received'>
                        Hi, I am doing well, thank you for asking. How can I help you today?
                    </ChatBubbleMessage>
                </WideChatBubble>
                <WideChatBubble variant='received' layout='ai'>
                    <ChatBubbleMessage variant='received'>
                        Hi, I am doing well, thank you for asking. How can I help you today?
                    </ChatBubbleMessage>
                </WideChatBubble>

                <WideChatBubble variant='received' layout='ai'>
                    <ChatBubbleMessage isLoading />
                </WideChatBubble>

                <ChatInputBar />
            </ChatMessageList>

        </div >
    </SidebarProvider>
};

const WideChatBubble = ({ children, variant, layout }: { children: React.ReactNode, variant: 'received' | 'sent', layout: 'default' | 'ai' }) => {
    return <ChatBubble layout={layout} variant={variant} className='max-w-[85%]'>
        {children}
    </ChatBubble>
}

function ChatInputBar() {
    const [focused, setFocused] = useState(false);
    const inputRef = useRef(null);

    return (
        <div className="sticky bottom-0 bg-background z-20 p-2 border border-gray-200 rounded-lg">
            <div className="relative flex items-center">
                <ChatInput
                    ref={inputRef}
                    placeholder="What's on your mind?"
                    className="w-full min-h-12 pt-2 pb-2 pr-24 pl-2 resize-none rounded-lg bg-background border-0 shadow-none focus-visible:ring-0 scrollbar-none"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <AnimatePresence>
                        {focused && (
                            <>
                                <motion.div
                                    key="mic"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.05 }}
                                >
                                    <Button variant="ghost" size="icon">
                                        <Mic className="size-4" />
                                    </Button>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                    <Button
                        size="sm"
                        className="gap-1.5"
                    >
                        <CornerDownLeft className="size-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

export const Route = createFileRoute('/chatPage')({
    component: () => <DAFKeepAlive>
        <ChatPage />
    </DAFKeepAlive>
})


const ChatSidebar = () => {
    const { setOpen, setOpenMobile, isMobile } = useSidebar();
    const handleCloseSidebar = () => {
        if (isMobile) {
            setOpenMobile(false);
        } else {
            setOpen(false);
        }
    };
    return <Sidebar>
        <SidebarHeader>
        </SidebarHeader>
        <SidebarContent>
            <SidebarGroup>
                <SidebarGroupLabel>Quick Access</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        <SidebarMenuItem key={'/notePage'}>
                            <SidebarMenuButton asChild onClick={handleCloseSidebar}>
                                <Link to='/notePage'>
                                    <Notebook />
                                    <span>Notes</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem key={'/taskBoard'}>
                            <SidebarMenuButton asChild onClick={handleCloseSidebar}>
                                <Link to='/taskBoardPage'>
                                    <ListTodo />
                                    <span>Task Board</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem key={'/settingsPage'}>
                            <SidebarMenuButton asChild onClick={handleCloseSidebar}>
                                <Link to='/settingsPage'>
                                    <Settings />
                                    <span>Settings</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
                <SidebarGroupLabel>Threads</SidebarGroupLabel>
                <SidebarGroupContent>
                    <ThreadsList />
                </SidebarGroupContent>
            </SidebarGroup>

        </SidebarContent>
    </Sidebar>
}

function formatThreadTime(updatedAt: string) {
    const now = new Date();
    const updated = new Date(updatedAt);
    if (isNaN(updated.getTime())) return "";
    const diffMs = now.getTime() - updated.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const days = Math.floor(diffMins / 1440);
    const mins = diffMins % 60;
    return `${days}d${mins}m`;
}

const mockThreads = [
    { id: 1, name: "Project Alpha", createdAt: "2024-06-01T10:00:00Z", updatedAt: "2024-06-10T12:34:00Z" },
    { id: 2, name: "Vacation Ideas", createdAt: "2024-06-05T09:00:00Z", updatedAt: "2024-06-11T08:20:00Z" },
    { id: 3, name: "Shopping List", createdAt: "2024-06-07T14:00:00Z", updatedAt: "2024-06-11T09:10:00Z" },
];

function ThreadsList() {
    const [selectedId, setSelectedId] = useState(mockThreads[0].id);
    const [dialog, setDialog] = useState<null | { type: 'rename' | 'delete' | 'details', thread: typeof mockThreads[0] }>(null);
    const [renameValue, setRenameValue] = useState("");
    const { setOpen, setOpenMobile, isMobile } = useSidebar();
    const handleCloseSidebar = () => {
        if (isMobile) {
            setOpenMobile(false);
        } else {
            setOpen(false);
        }
    };

    // Helper to open dialog
    const openDialog = (type: 'rename' | 'delete' | 'details', thread: typeof mockThreads[0]) => {
        setDialog({ type, thread });
        if (type === 'rename') setRenameValue(thread.name);
    };

    // Dialog close handler
    const closeDialog = () => setDialog(null);

    return (
        <>
            <div className="flex flex-col gap-1">
                {mockThreads.map(thread => (
                    <ContextMenu key={thread.id}>
                        <ContextMenuTrigger asChild>
                            <button
                                onClick={() => {
                                    setSelectedId(thread.id);
                                    handleCloseSidebar();
                                }}
                                className={`flex items-center justify-between px-3 py-2 rounded transition-colors
                                ${selectedId === thread.id
                                        ? "bg-primary/10 text-primary font-semibold"
                                        : "hover:bg-muted/50 text-foreground"}`}
                            >
                                <span className="truncate">{thread.name}</span>
                                <span className="text-xs text-gray-400 ml-2">{formatThreadTime(thread.updatedAt)}</span>
                            </button>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-44">
                            <ContextMenuItem onSelect={() => openDialog('details', thread)}><Info className="size-4 mr-2" />Show details</ContextMenuItem>
                            <ContextMenuItem onSelect={() => openDialog('rename', thread)}><Pencil className="size-4 mr-2" />Rename</ContextMenuItem>
                            <ContextMenuItem variant="destructive" onSelect={() => openDialog('delete', thread)}><Trash className="size-4 mr-2" />Delete</ContextMenuItem>
                        </ContextMenuContent>
                    </ContextMenu>
                ))}
            </div>

            {/* Rename Dialog */}
            <Dialog open={!!dialog && dialog.type === 'rename'} onOpenChange={closeDialog}>
                <DialogContent className="max-w-xs">
                    <DialogHeader>
                        <DialogTitle>Rename to...</DialogTitle>
                    </DialogHeader>
                    <Input
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        className="mb-4"
                        autoFocus
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                        <Button onClick={closeDialog}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={!!dialog && dialog.type === 'delete'} onOpenChange={closeDialog}>
                <DialogContent className="py-4 max-w-sm">
                    <DialogHeader className="mb-2">
                        <DialogTitle>Delete this chat?</DialogTitle>
                    </DialogHeader>
                    <DialogFooter className="flex justify-between gap-2 mt-2">
                        <Button variant="destructive" className="bg-red-500 text-white hover:bg-red-600" onClick={closeDialog}>Delete</Button>
                        <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Details Dialog */}
            <Dialog open={!!dialog && dialog.type === 'details'} onOpenChange={closeDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Thread details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Created at:</span> {dialog?.thread.createdAt}</div>
                        <div><span className="font-medium">Updated at:</span> {dialog?.thread.updatedAt}</div>
                        <div><span className="font-medium">Storage size:</span> 12 KB</div>
                        <div><span className="font-medium">Number of messages:</span> 42</div>
                        <div><span className="font-medium">Model:</span> GPT-4</div>
                    </div>
                    <DialogFooter className="flex justify-end mt-6">
                        <Button variant="outline" onClick={closeDialog}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default ChatPage;