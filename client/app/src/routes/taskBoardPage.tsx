import { createFileRoute } from '@tanstack/react-router'
import style from "./taskBoardPage.module.css";
import DAFKeepAlive from '../state/DAFKeepAlive';
import TopBar from '../components/atomic/TopBar';
import { Badge } from '../components/ui/badge';
import { KanbanBoard, KanbanCard, KanbanCards, KanbanHeader, KanbanProvider, type DragEndEvent } from '../components/ui/shadcn-io/kanban';
import { startOfMonth, subMonths, subDays, endOfMonth, format } from 'date-fns';
import { useState } from 'react';
import { Clock, Pencil, Trash, Calendar, Plus } from 'lucide-react';
import { DialogStack, DialogStackBody, DialogStackContent, DialogStackOverlay } from '../components/ui/shadcn-io/dialog-stack';
import { DialogStackFooter } from '../components/ui/shadcn-io/dialog-stack';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
    ContextMenu,
    ContextMenuCheckboxItem,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuLabel,
    ContextMenuRadioGroup,
    ContextMenuRadioItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
} from "../components/ui/context-menu";
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Calendar as CalendarComponent } from '../components/ui/calendar';
import { Loader2 as Loader2Icon } from 'lucide-react';
import { DialogStackHeader } from '../components/ui/shadcn-io/dialog-stack';
import { DialogStackTitle } from '../components/ui/shadcn-io/dialog-stack';

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

const statusOptions = [
    { id: '1', name: 'Pending', color: '#3B82F6' },
    { id: '2', name: 'In Progress', color: '#F59E0B' },
    { id: '3', name: 'Done', color: '#10B981' },
];

const TaskBoardPage = () => {
    const [features, setFeatures] = useState(initialFeatures);
    const [open, setOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [groups, setGroups] = useState([
        { id: '1', name: 'Core AI Features' },
        { id: '2', name: 'Collaboration Tools' },
        { id: '3', name: 'Cloud Infrastructure' },
    ]);

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

    const handleDeleteFeature = (id: string) => {
        setFeatures(features => features.filter(f => f.id !== id));
    };

    const handleChangePriority = (id: string, newPriority: number) => {
        setFeatures(features => features.map(f => f.id === id ? { ...f, priority: newPriority } : f));
    };

    const handleCreateTask = (task: any) => {
        let groupObj = groups.find(g => g.name === task.group);
        if (!groupObj) {
            groupObj = { id: (groups.length + 1).toString(), name: task.group };
            setGroups([...groups, groupObj]);
        }
        setFeatures(features => [
            ...features,
            {
                ...task,
                id: (features.length + 1).toString(),
                group: groupObj,
                product: { id: '1', name: 'Video Editor Pro' },
                owner: {
                    id: '1',
                    image: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=1',
                    name: 'Alice Johnson',
                },
                initiative: { id: '1', name: 'AI Integration' },
                release: { id: '1', name: 'v1.0' },
                description: task.description || '',
            }
        ]);
    };

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
                    <Button variant="ghost" size="icon" onClick={() => setCreateOpen(true)} aria-label="Create Task">
                        <Plus className="size-5" />
                    </Button>
                </>
            } style={{ height: '10%' }} />

        {open && <TaskDetailDialog
            open={open}
            setOpen={setOpen}
            groups={groups}
            setGroups={setGroups} />}

        {createOpen && <CreateTaskDialog
            open={createOpen}
            setOpen={setCreateOpen}
            onCreate={handleCreateTask}
            groups={groups}
            setGroups={setGroups} />}

        <div className='border-1 p-4 overflow-y-auto' style={{ height: '90%' }}>
            <KanbanProvider onDragEnd={handleDragEnd} className={style.kanban}>
                {exampleStatuses.map((status) => (
                    <KanbanBoard key={status.name} id={status.name}>
                        <KanbanHeader name={status.name} color={status.color} />
                        <KanbanCards>
                            {features
                                .filter((feature) => feature.status.name === status.name)
                                .map((feature, index) => (
                                    <ContextMenu key={feature.id}>
                                        <ContextMenuTrigger asChild>
                                            <div>
                                                <KanbanCard
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
                                            </div>
                                        </ContextMenuTrigger>
                                        <ContextMenuContent>
                                            <ContextMenuItem inset onSelect={() => handleDeleteFeature(feature.id)} variant="destructive">
                                                Delete
                                            </ContextMenuItem>
                                            <ContextMenuSeparator />
                                            <ContextMenuLabel inset>Change Priority</ContextMenuLabel>
                                            <ContextMenuRadioGroup value={String(feature.priority)} onValueChange={(v: string) => handleChangePriority(feature.id, Number(v))}>
                                                {priorities.map(p => (
                                                    <ContextMenuRadioItem key={p.value} value={String(p.value)}>
                                                        {p.label}
                                                    </ContextMenuRadioItem>
                                                ))}
                                            </ContextMenuRadioGroup>
                                        </ContextMenuContent>
                                    </ContextMenu>
                                ))}
                        </KanbanCards>
                    </KanbanBoard>
                ))}
            </KanbanProvider>
        </div>
    </div>;
};


const TaskDetailDialog = ({ open, setOpen, groups, setGroups }: { open: boolean, setOpen: (open: boolean) => void, groups: { id: string, name: string }[], setGroups: (groups: { id: string, name: string }[]) => void }) => {
    const [feature, setFeature] = useState(initialFeatures[0]);
    const [editingTitle, setEditingTitle] = useState(false);
    const [editingDesc, setEditingDesc] = useState(false);
    const [editingGroup, setEditingGroup] = useState(false);
    const [addingGroup, setAddingGroup] = useState(false);
    const [newGroup, setNewGroup] = useState("");
    const [title, setTitle] = useState(feature.name);
    const [desc, setDesc] = useState(feature.description);
    const [priority, setPriority] = useState(feature.priority);
    const [group, setGroup] = useState(feature.group.name);
    const [logs, setLogs] = useState<{ text: string, completed: boolean }[]>([{ text: "Initial log entry", completed: false }]);
    const [newLog, setNewLog] = useState("");
    const [editingLogIdx, setEditingLogIdx] = useState<number | null>(null);
    const [editingLogValue, setEditingLogValue] = useState("");

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
                    <div className="flex flex-col h-full w-full">
                        <div className="flex-1 overflow-auto flex flex-row gap-2">
                            <div className="flex flex-col justify-start gap-1 min-w-0 w-full">
                                <DialogStackHeader>
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
                                    <div className="mt-1">
                                        {editingGroup ? (
                                            !addingGroup ? (
                                                <Select
                                                    value={group}
                                                    onValueChange={v => {
                                                        if (v === '__add__') {
                                                            setAddingGroup(true);
                                                            setNewGroup("");
                                                        } else {
                                                            setGroup(v);
                                                            setFeature(f => ({ ...f, group: groups.find(g => g.name === v) || { id: (groups.length + 1).toString(), name: v } }));
                                                            setEditingGroup(false);
                                                        }
                                                    }}
                                                    onOpenChange={open => { if (!open) { setEditingGroup(false); setAddingGroup(false); } }}
                                                    defaultOpen={true}
                                                >
                                                    <SelectTrigger className="w-full h-7 text-xs">
                                                        <SelectValue placeholder="Group">{group}</SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {groups.map(g => <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>)}
                                                        <SelectItem value="__add__">
                                                            <div className="flex items-center gap-2">
                                                                <Plus className="size-4" />
                                                                Add new group
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <input
                                                    className="font-normal w-full border-b px-1 py-0.5 min-h-[28px] text-xs focus:border-primary focus:border-b-2 focus:outline-none shadow-none focus:shadow-none rounded-none"
                                                    value={newGroup}
                                                    onChange={e => setNewGroup(e.target.value)}
                                                    placeholder="New group name"
                                                    autoFocus
                                                    onBlur={() => { setAddingGroup(false); setEditingGroup(false); }}
                                                />
                                            )
                                        ) : (
                                            <span className="text-xs text-muted-foreground cursor-pointer" onClick={() => setEditingGroup(true)}>{feature.group.name}</span>
                                        )}
                                    </div>
                                </DialogStackHeader>
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
                    </div>
                </DialogStackContent>
            </DialogStackBody>
        </DialogStack>
    );
};

const CreateTaskDialog = ({ open, setOpen, onCreate, groups, setGroups }: { open: boolean, setOpen: (open: boolean) => void, onCreate: (task: any) => void, groups: { id: string, name: string }[], setGroups: (groups: { id: string, name: string }[]) => void }) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState(1);
    const [status, setStatus] = useState(statusOptions[0].name);
    const [group, setGroup] = useState(groups[0]?.name || "");
    const [addingGroup, setAddingGroup] = useState(false);
    const [newGroup, setNewGroup] = useState("");
    const [deadline, setDeadline] = useState<Date | undefined>(undefined);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        let groupName = group;
        if (addingGroup && newGroup.trim()) {
            groupName = newGroup.trim();
            if (!groups.find(g => g.name === groupName)) {
                setGroups([...groups, { id: (groups.length + 1).toString(), name: groupName }]);
            }
        }
        onCreate({
            name: title,
            description,
            priority,
            endAt: deadline,
            status: statusOptions.find(s => s.name === status)!,
            group: groupName,
        });
        setTimeout(() => {
            setSubmitting(false);
            setOpen(false);
            setTitle("");
            setDescription("");
            setPriority(1);
            setStatus(statusOptions[0].name);
            setGroup(groups[0]?.name || "");
            setAddingGroup(false);
            setNewGroup("");
            setDeadline(undefined);
        }, 500);
    };

    return (
        <DialogStack open={open} onOpenChange={setOpen}>
            <DialogStackOverlay />
            <DialogStackBody>
                <DialogStackContent className="p-6 w-[400px]">
                    <DialogStackTitle className="text-base mb-2">Create Task</DialogStackTitle>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="flex flex-col gap-2 col-span-2 min-w-0">
                                <div>
                                    <label className="font-bold text-xs">Title<span className="text-red-500">*</span></label>
                                    <input
                                        className="font-normal w-full border-b px-1 py-0.5 min-h-[32px] text-sm focus:border-primary focus:border-b-2 focus:outline-none shadow-none focus:shadow-none rounded-none"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        required
                                        placeholder="Task title"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-xs">Description<span className="text-red-500">*</span></label>
                                    <input
                                        className="font-normal w-full border-b px-1 py-0.5 min-h-[32px] text-sm focus:border-primary focus:border-b-2 focus:outline-none shadow-none focus:shadow-none rounded-none"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        required
                                        placeholder="Task description"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-xs mb-1">Group</label>
                                    {!addingGroup ? (
                                        <Select value={group} onValueChange={v => {
                                            if (v === '__add__') {
                                                setAddingGroup(true);
                                                setNewGroup("");
                                            } else {
                                                setGroup(v);
                                            }
                                        }}>
                                            <SelectTrigger className="w-full h-8 text-xs">
                                                <SelectValue placeholder="Group">{group}</SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {groups.map(g => <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>)}
                                                <SelectItem value="__add__">
                                                    <div className="flex items-center gap-2">
                                                        <Plus className="size-4" />
                                                        Add new group
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="flex gap-2 items-center">
                                            <input
                                                className="font-normal w-full border-b px-1 py-0.5 min-h-[32px] text-xs focus:border-primary focus:border-b-2 focus:outline-none shadow-none focus:shadow-none rounded-none"
                                                value={newGroup}
                                                onChange={e => setNewGroup(e.target.value)}
                                                placeholder="New group name"
                                                autoFocus
                                            />
                                            <Button type="button" size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={() => setAddingGroup(false)}>Cancel</Button>
                                            <Button type="button" size="sm" variant="default" className="h-8 px-2 text-xs" onClick={() => {
                                                if (newGroup.trim()) {
                                                    setGroup(newGroup.trim());
                                                    setAddingGroup(false);
                                                }
                                            }}>Add</Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 col-span-1 min-w-0">
                                <div>
                                    <label className="font-bold text-xs mb-1">Priority</label>
                                    <Select value={String(priority)} onValueChange={v => setPriority(Number(v))}>
                                        <SelectTrigger className="w-full h-8 text-xs">
                                            <SelectValue placeholder="Priority">{priorityToText(priority)}</SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {priorities.map(p => <SelectItem key={p.value} value={String(p.value)}>{p.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="font-bold text-xs mb-1">Status</label>
                                    <Select value={status} onValueChange={v => setStatus(v)}>
                                        <SelectTrigger className="w-full h-8 text-xs">
                                            <SelectValue placeholder="Status">{status}</SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statusOptions.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="font-bold text-xs mb-1">Deadline</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full min-w-0 justify-start text-left font-normal px-1 py-0.5 h-8 text-xs"
                                                type="button"
                                            >
                                                <Calendar className="mr-1 size-4" />
                                                {deadline ? format(deadline, 'PPP') : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <CalendarComponent
                                                mode="single"
                                                selected={deadline}
                                                onSelect={(date: Date | undefined) => setDeadline(date)}
                                                captionLayout="dropdown"
                                                required={false}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>
                        <DialogStackFooter>
                            <Button variant="outline" type="button" onClick={() => setOpen(false)} disabled={submitting} className="h-8 px-3 text-xs">Cancel</Button>
                            <Button variant="default" type="submit" disabled={!title || !description || submitting} className="h-8 px-3 text-xs">Create</Button>
                        </DialogStackFooter>
                    </form>
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