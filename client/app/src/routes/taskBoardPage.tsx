import { createFileRoute } from '@tanstack/react-router'
import style from "./taskBoardPage.module.css";
import DAFKeepAlive from '../state/DAFKeepAlive';
import TopBar from '../components/atomic/TopBar';
import { Badge } from '../components/ui/badge';
import { KanbanBoard, KanbanCard, KanbanCards, KanbanHeader, KanbanProvider, type DragEndEvent } from '../components/ui/shadcn-io/kanban';
import { startOfMonth, subMonths, subDays, endOfMonth, format } from 'date-fns';
import { useState } from 'react';
import { Clock, X, Pencil, Trash, Calendar } from 'lucide-react';
import { DialogStack, DialogStackBody, DialogStackContent, DialogStackDescription, DialogStackFooter, DialogStackHeader, DialogStackNext, DialogStackOverlay, DialogStackPrevious, DialogStackTitle } from '../components/ui/shadcn-io/dialog-stack';
import { Button } from '../components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../components/ui/hover-card';
import { Description } from '@radix-ui/react-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '../components/ui/context-menu';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Calendar as CalendarComponent } from '../components/ui/calendar';
import { Progress } from '../components/ui/progress';

const today = new Date();

const exampleStatuses = [
    { id: '1', name: 'Pending', color: '#3B82F6' }, // blue-500
    { id: '2', name: 'In Progress', color: '#F59E0B' }, // yellow-500
    { id: '3', name: 'Done', color: '#10B981' }, // green-500
];

const priorityToText = (priority: number) => {
    switch (priority) {
        case 1: return 'Low';
        case 2: return 'Medium';
        case 3: return 'High';
        case 4: return 'Urgent';
    }
}

const priorityToColor = (priority: number) => {
    switch (priority) {
        case 1: return 'bg-blue-500';
        case 2: return 'bg-green-500';
        case 3: return 'bg-orange-500';
        case 4: return 'bg-red-600';
    }
}
const initialFeatures = [
    {
        id: '1',
        name: 'AI Scene Analysis',
        startAt: startOfMonth(subMonths(today, 6)),
        endAt: subDays(endOfMonth(today), 5),
        status: exampleStatuses[0],
        group: { id: '1', name: 'Core AI Features' },
        product: { id: '1', name: 'Video Editor Pro' },
        owner: {
            id: '1',
            image: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=1',
            name: 'Alice Johnson',
        },
        initiative: { id: '1', name: 'AI Integration' },
        release: { id: '1', name: 'v1.0' },
        priority: 1,
        description: 'This is a description of the feature',
    },
    {
        id: '2',
        name: 'Collaborative Editing',
        startAt: startOfMonth(subMonths(today, 5)),
        endAt: subDays(endOfMonth(today), 5),
        status: exampleStatuses[1],
        group: { id: '2', name: 'Collaboration Tools' },
        product: { id: '1', name: 'Video Editor Pro' },
        owner: {
            id: '2',
            image: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=2',
            name: 'Bob Smith',
        },
        initiative: { id: '2', name: 'Real-time Collaboration' },
        release: { id: '1', name: 'v1.0' },
        priority: 2,
        description: 'This is a description of the feature',
    },
    {
        id: '3',
        name: 'AI-Powered Color Grading',
        startAt: startOfMonth(subMonths(today, 4)),
        endAt: subDays(endOfMonth(today), 5),
        status: exampleStatuses[2],
        group: { id: '1', name: 'Core AI Features' },
        product: { id: '1', name: 'Video Editor Pro' },
        owner: {
            id: '3',
            image: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=3',
            name: 'Charlie Brown',
        },
        initiative: { id: '1', name: 'AI Integration' },
        release: { id: '2', name: 'v1.1' },
        priority: 3,
        description: 'This is a description of the feature',
    },
    {
        id: '4',
        name: 'Real-time Video Chat',
        startAt: startOfMonth(subMonths(today, 3)),
        endAt: subDays(endOfMonth(today), 12),
        status: exampleStatuses[0],
        group: { id: '2', name: 'Collaboration Tools' },
        product: { id: '1', name: 'Video Editor Pro' },
        owner: {
            id: '4',
            image: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=4',
            name: 'Diana Prince',
        },
        initiative: { id: '2', name: 'Real-time Collaboration' },
        release: { id: '2', name: 'v1.1' },
        priority: 4,
        description: 'This is a description of the feature',
    },
    {
        id: '5',
        name: 'AI Voice-to-Text Subtitles',
        startAt: startOfMonth(subMonths(today, 2)),
        endAt: subDays(endOfMonth(today), 5),
        status: exampleStatuses[1],
        group: { id: '1', name: 'Core AI Features' },
        product: { id: '1', name: 'Video Editor Pro' },
        owner: {
            id: '5',
            image: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=5',
            name: 'Ethan Hunt',
        },
        initiative: { id: '1', name: 'AI Integration' },
        release: { id: '2', name: 'v1.1' },
        priority: 1,
        description: 'This is a description of the feature',
    },
    {
        id: '6',
        name: 'Cloud Asset Management',
        startAt: startOfMonth(subMonths(today, 1)),
        endAt: endOfMonth(today),
        status: exampleStatuses[2],
        group: { id: '3', name: 'Cloud Infrastructure' },
        product: { id: '1', name: 'Video Editor Pro' },
        owner: {
            id: '6',
            image: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=6',
            name: 'Fiona Gallagher',
        },
        initiative: { id: '3', name: 'Cloud Migration' },
        release: { id: '3', name: 'v1.2' },
        priority: 2,
        description: 'This is a description of the feature',
    },
];

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
});

const priorities = [
    { value: 1, label: 'Low' },
    { value: 2, label: 'Medium' },
    { value: 3, label: 'High' },
    { value: 4, label: 'Urgent' },
];

const TaskBoardPage = () => {
    const [features, setFeatures] = useState(initialFeatures);
    const [open, setOpen] = useState(false);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            return;
        }

        const status = exampleStatuses.find((status) => status.name === over.id);

        if (!status) {
            return;
        }

        setFeatures(
            features.map((feature) => {
                if (feature.id === active.id) {
                    return { ...feature, status };
                }

                return feature;
            })
        );
    };

    const getPriorityBadge = (priority: number) => {
        const baseClass = `${style.compactBadge} text-white`;
        const text = priorityToText(priority);
        const color = priorityToColor(priority);
        return <Badge variant="default" className={baseClass + " " + color}>{text}</Badge>
    }

    return <div className={style.taskBoardPage}>
        <TopBar left={
            <>
                <span className='text-sm text-gray-500'>{format(new Date(), 'MMM d, yyyy')}</span>
            </>} right={
                <>
                    <div className='flex items-center gap-2'>
                        <Badge variant="default" className=' text-white' style={{ backgroundColor: '#3B82F6' }} />
                        <span className='text-sm text-gray-500'>10</span>
                    </div>
                    <div className='flex items-center gap-2'>
                        <Badge variant="default" className='text-white' style={{ backgroundColor: '#F59E0B' }}></Badge>
                        <span className='text-sm text-gray-500'>10</span>
                    </div>
                    <div className='flex items-center gap-2'>
                        <Badge variant="default" className='text-white' style={{ backgroundColor: '#10B981' }}></Badge>
                        <span className='text-sm text-gray-500'>10</span>
                    </div>
                </>
            } style={{ height: '10%' }} />
        {open && <TaskDetailDialog open={open} setOpen={setOpen} />}
        <div className='border-1 p-4 overflow-y-auto' style={{ height: '90%' }}>
            <KanbanProvider onDragEnd={handleDragEnd} className={style.kanban}>
                {exampleStatuses.map((status) => (
                    <KanbanBoard key={status.name} id={status.name}>
                        <KanbanHeader name={status.name} color={status.color} />
                        <KanbanCards>
                            {features
                                .filter((feature) => feature.status.name === status.name)
                                .map((feature, index) => (
                                    <KanbanCard
                                        key={feature.id}
                                        id={feature.id}
                                        name={feature.name}
                                        parent={status.name}
                                        index={index}
                                    >
                                        <div className="flex flex-col items-start justify-center gap-2">
                                            <div className="flex flex-col gap-1">
                                                <p className="flex-1 text-left text-sm hover:underline cursor-pointer underline-offset-4" data-no-dnd={true} onClick={() => setOpen(true)}>
                                                    {feature.name}
                                                </p>
                                                <p className="flex-1 text-muted-foreground text-xs">
                                                    {feature.initiative.name}
                                                </p>
                                            </div>
                                            <div className='flex items-center justify-between gap-2 w-full'>
                                                <div className='flex items-center gap-2'>
                                                    {getPriorityBadge(feature.priority)}

                                                </div>
                                                <div className='flex items-center gap-1.5'>
                                                    <Clock className='size-4' color='#6b7280' />
                                                    <span className='text-muted-foreground text-xs'>
                                                        {dateFormatter.format(feature.endAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </KanbanCard>
                                ))}
                        </KanbanCards>
                    </KanbanBoard>
                ))}
            </KanbanProvider>
        </div>
    </div>;
};

const TaskBriefCard = ({ feature, onPriorityChange, setOpen }: { feature: typeof initialFeatures[0], onPriorityChange?: (priority: number) => void, setOpen: (open: boolean) => void }) => {
    const [log, setLog] = useState("");
    const [priority, setPriority] = useState(feature.priority);
    const handlePriorityChange = (value: string) => {
        const newPriority = Number(value);
        setPriority(newPriority);
        onPriorityChange?.(newPriority);
    };

    return (
        <div className="flex flex-col w-full">
            <div className="flex flex-row items-center justify-between">
                <Button variant="link" size="sm" className="p-0 h-auto min-w-0" onClick={() => setOpen(true)}>View Details</Button>
                <Select onValueChange={handlePriorityChange}>
                    <SelectTrigger className="">
                        <SelectValue placeholder="Priority">{priorityToText(priority)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">Low</SelectItem>
                        <SelectItem value="2">Medium</SelectItem>
                        <SelectItem value="3">High</SelectItem>
                        <SelectItem value="4">Urgent</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="text-sm text-foreground mb-1">{feature.description}</div>
            <input type="text" placeholder="Add a task log..." value={log} onChange={(e) => setLog(e.target.value)} />
            <div className="text-xs text-muted-foreground mt-2">Created {feature.startAt ? dateFormatter.format(feature.startAt) : "-"}</div>
        </div>
    );
}

const TaskDetailDialog = ({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) => {
    const [feature, setFeature] = useState(initialFeatures[0]);
    const [editingTitle, setEditingTitle] = useState(false);
    const [editingDesc, setEditingDesc] = useState(false);
    const [title, setTitle] = useState(feature.name);
    const [desc, setDesc] = useState(feature.description);
    const [priority, setPriority] = useState(feature.priority);
    const [deadline, setDeadline] = useState(feature.endAt);
    const [logs, setLogs] = useState<{ text: string, completed: boolean }[]>([{ text: "Initial log entry", completed: false }]);
    const [newLog, setNewLog] = useState("");
    const [editingLogIdx, setEditingLogIdx] = useState<number | null>(null);
    const [editingLogValue, setEditingLogValue] = useState("");
    const [datePickerOpen, setDatePickerOpen] = useState(false);

    const handleAddLog = () => {
        if (newLog.trim()) {
            setLogs([...logs, { text: newLog, completed: false }]);
            setNewLog("");
        }
    };

    const handleEditLog = (idx: number) => {
        setEditingLogIdx(idx);
        setEditingLogValue(logs[idx].text);
    };

    const handleSaveLog = (idx: number) => {
        setLogs(logs.map((log, i) => (i === idx ? { ...log, text: editingLogValue } : log)));
        setEditingLogIdx(null);
        setEditingLogValue("");
    };

    const handleDeleteLog = (idx: number) => {
        setLogs(logs.filter((_, i) => i !== idx));
    };

    const handleToggleCompleted = (idx: number) => {
        setLogs(logs.map((log, i) => (i === idx ? { ...log, completed: !log.completed } : log)));
    };

    return (
        <DialogStack open={open} onOpenChange={setOpen}>
            <DialogStackOverlay />
            <DialogStackBody>
                <DialogStackContent className='p-8 w-full h-100'>
                    <div className="flex flex-row gap-2 h-full overflow-auto">
                        <div className="flex flex-col justify-start gap-1 min-w-0 w-full">
                            {editingTitle ? (
                                <input
                                    className="text-lg font-semibold focus:outline-none"
                                    value={title}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                                    onBlur={() => { setEditingTitle(false); setFeature(f => ({ ...f, name: title })); }}
                                    autoFocus
                                />
                            ) : (
                                <div className="flex items-center gap-2 w-full">
                                    <h2 className="text-lg font-semibold cursor-pointer truncate flex-1" onClick={() => setEditingTitle(true)}>{title}</h2>
                                    <span
                                        className="px-2 py-0.5 rounded text-white text-xs font-semibold"
                                        style={{ backgroundColor: feature.status.color }}
                                    >
                                        {feature.status.name}
                                    </span>
                                </div>
                            )}
                            <div className="flex flex-col sm:flex-row gap-4 mt-2 mb-2">
                                <div className="flex flex-col gap-1 w-full sm:flex-1/3">
                                    <span className="font-bold text-sm">Priority</span>
                                    <Select value={String(priority)} onValueChange={(v: string) => setPriority(Number(v))}>
                                        <SelectTrigger className="w-full min-w-0">
                                            <SelectValue placeholder="Priority">{priorityToText(priority)}</SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {priorities.map(p => <SelectItem key={p.value} value={String(p.value)}>{p.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-1 w-full sm:flex-2/3">
                                    <span className="font-bold text-sm">Deadline</span>
                                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full min-w-0 justify-start text-left font-normal px-1 py-0.5"
                                                onClick={() => setDatePickerOpen(true)}
                                            >
                                                <Calendar className="mr-1 size-4" />
                                                {deadline ? format(deadline, 'PPP') : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <CalendarComponent
                                                mode="single"
                                                selected={deadline}
                                                onSelect={(date: Date | undefined) => { if (date) setDeadline(date); setDatePickerOpen(false); }}
                                                captionLayout="dropdown"
                                                required={false}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                            <span className="font-bold text-sm">Description</span>
                            {editingDesc ? (
                                <input
                                    className="font-normal w-full border-b px-1 py-0.5 min-h-[40px] resize-y focus:border-primary focus:border-b-2 focus:outline-none shadow-none focus:shadow-none rounded-none"
                                    value={desc}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDesc(e.target.value)}
                                    onBlur={() => { setEditingDesc(false); setFeature(f => ({ ...f, description: desc })); }}
                                    autoFocus
                                />
                            ) : (
                                <div className="font-normal mb-1 cursor-pointer truncate" onClick={() => setEditingDesc(true)}>{desc}</div>
                            )}
                            <div className="mt-2 flex flex-col min-h-0">
                                <span className="font-bold text-sm mb-1">Task Log</span>
                                <div className="flex flex-col gap-1">
                                    <div className='flex flex-col'>
                                        {logs.map((log, idx) => (
                                            <ContextMenu key={idx}>
                                                <ContextMenuTrigger asChild>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={log.completed}
                                                            onChange={() => handleToggleCompleted(idx)}
                                                            className="form-checkbox h-4 w-4 cursor-pointer"
                                                            style={{ accentColor: '#10B981' }}
                                                        />
                                                        {editingLogIdx === idx ? (
                                                            <input
                                                                className="flex-1 bg-transparent px-1 py-0.5 text-base font-normal border-0 border-b border-gray-300 focus:border-b-2 focus:border-primary focus:outline-none shadow-none focus:shadow-none rounded-none"
                                                                value={editingLogValue}
                                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingLogValue(e.target.value)}
                                                                onBlur={() => handleSaveLog(idx)}
                                                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') handleSaveLog(idx); }}
                                                                autoFocus
                                                            />
                                                        ) : (
                                                            <span className={"flex-1 truncate " + (log.completed ? "line-through text-muted-foreground" : "")}>{log.text}</span>
                                                        )}
                                                        <Button variant="ghost" size="icon" onClick={() => handleEditLog(idx)}>
                                                            <Pencil className="size-4" />
                                                        </Button>
                                                    </div>
                                                </ContextMenuTrigger>
                                                <ContextMenuContent>
                                                    <ContextMenuItem onSelect={() => handleDeleteLog(idx)} className="text-red-600">
                                                        <Trash className="size-4 mr-2 text-red-600 font-bold" />
                                                        Delete
                                                    </ContextMenuItem>
                                                </ContextMenuContent>
                                            </ContextMenu>
                                        ))}
                                    </div>
                                    <input
                                        className="bg-transparent text-base font-normal border-0 border-b border-gray-300 focus:border-b-2 focus:border-primary focus:outline-none shadow-none focus:shadow-none rounded-none pb-2"
                                        placeholder="Add a log..."
                                        value={newLog}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewLog(e.target.value)}
                                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') handleAddLog(); }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogStackContent>
            </DialogStackBody>
        </DialogStack>
    );
};

export const Route = createFileRoute('/taskBoardPage')({
    component: () => <DAFKeepAlive>
        <TaskBoardPage />
    </DAFKeepAlive>,
})

export default TaskBoardPage;