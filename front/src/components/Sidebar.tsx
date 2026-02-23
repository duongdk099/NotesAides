'use client';

import {
    FolderIcon,
    Trash2Icon,
    TagIcon,
    PlusIcon,
    SearchIcon,
    LogOutIcon
} from 'lucide-react';

interface SidebarProps {
    onNewNote: () => void;
    onLogout: () => void;
}

export function Sidebar({ onNewNote, onLogout }: SidebarProps) {
    return (
        <aside className="w-[260px] h-screen bg-sidebar-bg flex flex-col border-r border-apple-border">
            <div className="p-4 space-y-6 flex-1 overflow-y-auto pt-12">
                {/* Search Bar Refined */}
                <div className="relative group px-1">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                        type="text"
                        placeholder="Search"
                        className="w-full bg-black/5 dark:bg-white/5 border-none rounded-lg py-1.5 pl-9 pr-4 text-[13px] outline-none transition-all placeholder:text-gray-400"
                    />
                </div>

                {/* Navigation Sections */}
                <nav className="space-y-6">
                    <div>
                        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-4 mb-2 opacity-60">Library</h3>
                        <ul className="space-y-0.5">
                            <SidebarItem icon={<FolderIcon size={18} />} label="All Notes" active />
                            <SidebarItem icon={<TagIcon size={18} />} label="Smart Folders" />
                            <SidebarItem icon={<Trash2Icon size={18} />} label="Recently Deleted" />
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-4 mb-2 opacity-60">iCloud</h3>
                        <ul className="space-y-0.5">
                            <SidebarItem icon={<FolderIcon size={18} />} label="Notes" />
                        </ul>
                    </div>
                </nav>
            </div>

            {/* Bottom Toolbar - Apple Style */}
            <div className="p-2 border-t border-apple-border bg-sidebar-bg/50 backdrop-blur-md flex items-center justify-between">
                <button
                    onClick={onLogout}
                    className="p-2 text-gray-500 hover:text-accent transition-colors"
                >
                    <LogOutIcon size={18} />
                </button>
                <button
                    onClick={onNewNote}
                    className="p-2 text-accent hover:opacity-80 transition-all active:scale-95"
                >
                    <PlusIcon size={24} strokeWidth={2.5} />
                </button>
            </div>
        </aside>
    );
}

function SidebarItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
    return (
        <li>
            <button className={`w-full flex items-center justify-between px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all ${active
                ? 'bg-accent text-white shadow-sm'
                : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'
                }`}>
                <div className="flex items-center space-x-3">
                    <span className={active ? 'text-white' : 'text-accent'}>{icon}</span>
                    <span>{label}</span>
                </div>
                {/* Optional count could go here */}
            </button>
        </li>
    );
}
