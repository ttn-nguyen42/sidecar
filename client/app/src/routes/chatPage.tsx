import { createFileRoute, useRouter } from '@tanstack/react-router';
import style from './chatPage.module.css';
import { ChatDimensions, MenuDimensions } from '../state/dimensions';
import DAFKeepAlive from '../state/DAFKeepAlive';
import { resizeTo } from '../state/view';
import { ChatMessageList } from '../components/ui/chat/chat-message-list';
import { ChatBubble, ChatBubbleAction, ChatBubbleActionWrapper, ChatBubbleAvatar, ChatBubbleMessage } from '../components/ui/chat/chat-bubble';
import { ChatInput } from '../components/ui/chat/chat-input';
import { SidebarHeader, SidebarProvider, SidebarTrigger } from '../components/ui/sidebar';
import { Button } from '../components/ui/button';
import { ArrowLeft, Copy, CornerDownLeft, Mic, Paperclip } from 'lucide-react';
import { Sidebar, SidebarContent } from "../components/ui/sidebar"

const ChatSidebar = () => {
    return <Sidebar>
        <SidebarHeader>
            Hi
            <SidebarTrigger />
        </SidebarHeader>
        <SidebarContent>

        </SidebarContent>
    </Sidebar>
}

const ChatPage = () => {
    const location = useRouter();

    const toMenu = () => {
        resizeTo(MenuDimensions.width, MenuDimensions.height)
        location.history.back();
    }


    return <SidebarProvider>
        <ChatSidebar />
        <div
            className={style.chat + " relative " + style.noDrag + " flex flex-col overflow-hidden"}
            style={{ height: ChatDimensions.height, width: ChatDimensions.width }}>
            <div className={`flex items-center justify-between border-b border-gray-200 p-2 ${style.dragArea}`} style={{ height: '10%' }}>
                <div className='flex justify-start items-center gap-2'>
                    <Button size={'icon'} variant={'ghost'} onClick={toMenu} className='size-8'>
                        <ArrowLeft onClick={toMenu} />
                    </Button>
                    <h1>Chat Title Here</h1>
                </div>
                <div className='flex justify-end items-center gap-2'>
                    <p className='text-sm text-gray-500'>Started 3 days ago</p>
                    <SidebarTrigger className="size-8" />
                </div>
            </div>
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

                <div style={{ height: '20%' }}
                    className="sticky bottom-0  rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring p-1">
                    <ChatInput
                        placeholder="Type your message here..."
                        className="min-h-12 pl-2 pt-2 pr-2 pb-2 resize-none rounded-lg bg-background border-0 shadow-none focus-visible:ring-0"
                    />
                    <div className="flex items-center pt-1 mb-1">
                        <Button variant="ghost" size="icon">
                            <Paperclip className="size-4" />
                            <span className="sr-only">Attach file</span>
                        </Button>

                        <Button variant="ghost" size="icon">
                            <Mic className="size-4" />
                            <span className="sr-only">Use Microphone</span>
                        </Button>

                        <Button
                            size="sm"
                            className="ml-auto gap-1.5 mr-1"
                        >
                            Send Message
                            <CornerDownLeft className="size-3.5" />
                        </Button>
                    </div>
                </div>
            </ChatMessageList>

        </div >
    </SidebarProvider>
};

const WideChatBubble = ({ children, variant, layout }: { children: React.ReactNode, variant: 'received' | 'sent', layout: 'default' | 'ai' }) => {
    return <ChatBubble layout={layout} variant={variant} className='max-w-[85%]'>
        {children}
    </ChatBubble>
}


export const Route = createFileRoute('/chatPage')({
    component: () => <DAFKeepAlive>
        <ChatPage />
    </DAFKeepAlive>
})


export default ChatPage;