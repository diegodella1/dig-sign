import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { LoopEditor } from './loop-editor';

import type { LoopEditorCard } from '@/components/prepare/loop-editor-utils';
import type { SlideAsset } from '@/lib/types';

const slides: SlideAsset[] = [slide('slide-1', 'Markets'), slide('slide-2', 'Weather')];

describe('LoopEditor', () => {
    it('allows adding the same slide multiple times to one loop', () => {
        function Harness() {
            const [cards, setCards] = useState<LoopEditorCard[]>([]);

            return (
                <LoopEditor
                    mode="gap-fill"
                    slides={slides}
                    assets={[]}
                    cards={cards}
                    onCardsChange={setCards}
                />
            );
        }

        const { container } = render(<Harness />);

        const addMarkets = screen.getByRole('button', { name: 'Add Markets to loop' });
        fireEvent.click(addMarkets);
        fireEvent.click(addMarkets);

        const slideInputs = container.querySelectorAll('input[name="item_ids"][value="slide-1"]');

        expect(slideInputs).toHaveLength(2);
        expect(screen.getByText(/2x in loop/i)).toBeInTheDocument();
    });

    it('removes only the selected duplicate instance from loop order', () => {
        function Harness() {
            const [cards, setCards] = useState<LoopEditorCard[]>([
                {
                    key: 'a',
                    kind: 'slide',
                    id: 'slide-1',
                    slideId: 'slide-1',
                    durationSeconds: 30,
                },
                {
                    key: 'b',
                    kind: 'slide',
                    id: 'slide-1',
                    slideId: 'slide-1',
                    durationSeconds: 30,
                },
            ]);

            return (
                <LoopEditor
                    mode="gap-fill"
                    slides={slides}
                    assets={[]}
                    cards={cards}
                    onCardsChange={setCards}
                />
            );
        }

        const { container } = render(<Harness />);

        const removeButtons = screen.getAllByRole('button', {
            name: 'Remove item from loop',
        });
        fireEvent.click(removeButtons[1]!);

        const slideInputs = container.querySelectorAll('input[name="item_ids"][value="slide-1"]');

        expect(slideInputs).toHaveLength(1);
    });
});

function slide(id: string, title: string): SlideAsset {
    return {
        id,
        title,
        slideType: 'template',
        templateId: title.toLowerCase(),
        defaultDurationSeconds: 30,
        status: 'ready',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
    };
}
