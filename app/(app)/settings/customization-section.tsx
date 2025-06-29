
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, PlusCircle, Loader2 } from 'lucide-react';
import type { CustomSetting } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CustomizationSectionProps {
  title: string;
  items: CustomSetting[];
  onAddItem: (name: string) => Promise<void>;
  onDeleteItem: (id: string, name: string) => Promise<void>;
}

export function CustomizationSection({ title, items, onAddItem, onDeleteItem }: CustomizationSectionProps) {
  const [newItemName, setNewItemName] = useState('');
  const [isAdding, startAddTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    startAddTransition(async () => {
      await onAddItem(newItemName);
      setNewItemName('');
    });
  };

  const handleDeleteItem = (item: CustomSetting) => {
    startDeleteTransition(async () => {
      await onDeleteItem(item.id, item.name);
    });
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <div className="flex gap-2 mb-3">
        <Input
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder={`New ${title.slice(0, -1).toLowerCase()} name`}
          onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
          disabled={isAdding}
        />
        <Button onClick={handleAddItem} size="icon" variant="outline" disabled={isAdding}>
          {isAdding ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlusCircle className="h-5 w-5" />}
        </Button>
      </div>
      <ScrollArea className="h-40 rounded-md border p-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground p-2">No items defined.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-1.5 hover:bg-muted/50 rounded-sm">
              <span className="text-sm">{item.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleDeleteItem(item)}
                disabled={isDeleting}
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          ))
        )}
      </ScrollArea>
    </div>
  );
}
