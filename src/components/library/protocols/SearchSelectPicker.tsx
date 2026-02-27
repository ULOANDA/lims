import { useState, useRef, useEffect } from "react";
import { Search, X, Plus, Check, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export type PickerItem = {
    id: string;
    label: string;
    sublabel?: string;
};

type Props = {
    /** Label shown above */
    label: string;
    /** Currently selected items */
    selected: PickerItem[];
    onChange: (items: PickerItem[]) => void;
    /** Async search fn - returns matching items for a given search string */
    onSearch: (q: string) => Promise<PickerItem[]>;
    /** If provided, user can click "Create" to create a new item inline */
    onCreate?: (name: string) => Promise<PickerItem>;
    placeholder?: string;
    /** Max number of items to select */
    maxItems?: number;
};

export function SearchSelectPicker({ label, selected, onChange, onSearch, onCreate, placeholder, maxItems }: Props) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [inputVal, setInputVal] = useState("");
    const [results, setResults] = useState<PickerItem[]>([]);
    const [searching, setSearching] = useState(false);
    const [creating, setCreating] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounced search
    useEffect(() => {
        if (!open) return;
        if (searchTimer.current) clearTimeout(searchTimer.current);
        setSearching(true);
        searchTimer.current = setTimeout(async () => {
            try {
                const res = await onSearch(inputVal.trim());
                setResults(res);
            } finally {
                setSearching(false);
            }
        }, 300);
        return () => {
            if (searchTimer.current) clearTimeout(searchTimer.current);
        };
    }, [inputVal, open, onSearch]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const isSelected = (id: string) => selected.some((s) => s.id === id);

    const toggle = (item: PickerItem) => {
        if (isSelected(item.id)) {
            onChange(selected.filter((s) => s.id !== item.id));
        } else {
            if (maxItems && selected.length >= maxItems) return;
            onChange([...selected, item]);
        }
    };

    const remove = (id: string) => onChange(selected.filter((s) => s.id !== id));

    const handleCreate = async () => {
        if (!onCreate || !inputVal.trim()) return;
        setCreating(true);
        try {
            const item = await onCreate(inputVal.trim());
            onChange([...selected, item]);
            setInputVal("");
            // Refresh results
            const res = await onSearch("");
            setResults(res);
        } finally {
            setCreating(false);
        }
    };

    // Filter out already-selected from dropdown (optional UX)
    const unselectedResults = results.filter((r) => !isSelected(r.id));
    const selectedInResults = results.filter((r) => isSelected(r.id));
    const ordered = [...selectedInResults, ...unselectedResults];

    const canCreate = onCreate && inputVal.trim().length > 0 && !results.some((r) => r.label.toLowerCase() === inputVal.trim().toLowerCase());

    return (
        <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">{label}</div>

            {/* Selected badges */}
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {selected.map((item) => (
                        <Badge key={item.id} variant="secondary" className="flex items-center gap-1 pr-1 text-xs font-normal">
                            <span className="max-w-[180px] truncate" title={item.label}>
                                {item.label}
                            </span>
                            <button type="button" className="ml-0.5 rounded-sm hover:bg-muted transition-colors p-0.5" onClick={() => remove(item.id)}>
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}

            {/* Combobox trigger */}
            <div className="relative" ref={containerRef}>
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                        value={inputVal}
                        onChange={(e) => {
                            setInputVal(e.target.value);
                            setOpen(true);
                        }}
                        onFocus={() => setOpen(true)}
                        placeholder={placeholder ?? t("common.search")}
                        className="pl-8 text-sm h-9"
                    />
                    {searching && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />}
                </div>

                {open && (
                    <div className="absolute z-50 mt-1 w-full bg-background border border-border rounded-md shadow-lg overflow-hidden">
                        <div className="max-h-52 overflow-y-auto">
                            {ordered.length === 0 && !searching ? <div className="px-3 py-2 text-sm text-muted-foreground text-center">{t("common.noData")}</div> : null}
                            {ordered.map((item) => {
                                const sel = isSelected(item.id);
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-muted/50 transition-colors ${sel ? "bg-primary/5" : ""}`}
                                        onClick={() => toggle(item)}
                                    >
                                        <span
                                            className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${sel ? "bg-primary border-primary text-primary-foreground" : "border-border"}`}
                                        >
                                            {sel && <Check className="h-3 w-3" />}
                                        </span>
                                        <span className="flex-1 min-w-0">
                                            <span className="block truncate font-medium">{item.label}</span>
                                            {item.sublabel && <span className="block text-xs text-muted-foreground truncate">{item.sublabel}</span>}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {canCreate && (
                            <div className="border-t border-border p-2">
                                <Button type="button" variant="ghost" size="sm" className="w-full justify-start text-sm gap-2 text-primary" disabled={creating} onClick={() => void handleCreate()}>
                                    {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                                    {creating ? t("common.saving") : `${t("common.create")}: "${inputVal.trim()}"`}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
