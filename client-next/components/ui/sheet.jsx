'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

function SheetOverlay({ className = '', ...props }) {
    return (
        <DialogPrimitive.Overlay
            className={`fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 ${className}`}
            {...props}
        />
    );
}

/**
 * useIsMobile — returns true when window width < 768px (md breakpoint).
 * Falls back to false on SSR to avoid hydration mismatch.
 */
function useIsMobile() {
    const [isMobile, setIsMobile] = React.useState(false);
    React.useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        setIsMobile(mq.matches);
        const handler = (e) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);
    return isMobile;
}

/**
 * SheetContent
 * - Mobile  (<768px): slides UP   from the bottom — feels like a native action sheet
 * - Desktop (≥768px): slides IN   from the right  — feels like a sidebar panel
 */
function SheetContent({ className = '', children, title, description, showCloseButton = true, ...props }) {
    const isMobile = useIsMobile();

    const mobileClasses = [
        'inset-x-0 bottom-0 max-h-[92dvh] w-full rounded-t-3xl border-t border-border/30',
        'data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
    ].join(' ');

    const desktopClasses = [
        'inset-y-0 right-0 left-auto bottom-auto h-full max-w-[500px] w-full',
        'rounded-none rounded-l-2xl border-t-0 border-l border-border/30',
        'data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right',
    ].join(' ');

    return (
        <SheetPortal>
            <SheetOverlay />
            <DialogPrimitive.Content
                className={[
                    'fixed z-[201] flex flex-col bg-background shadow-2xl outline-none',
                    'data-[state=open]:animate-in data-[state=closed]:animate-out',
                    'data-[state=closed]:duration-200 data-[state=open]:duration-300',
                    isMobile ? mobileClasses : desktopClasses,
                    className,
                ].join(' ')}
                {...props}
            >
                {/* Drag handle — only on mobile */}
                {isMobile && (
                    <div className="flex justify-center pt-3 pb-1 shrink-0">
                        <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
                    </div>
                )}

                {showCloseButton && (
                    <DialogPrimitive.Close className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </DialogPrimitive.Close>
                )}

                {/* Accessibility */}
                <DialogPrimitive.Title className="sr-only">{title || 'Panel'}</DialogPrimitive.Title>
                {description && (
                    <DialogPrimitive.Description className="sr-only">{description}</DialogPrimitive.Description>
                )}

                {children}
            </DialogPrimitive.Content>
        </SheetPortal>
    );
}

function SheetHeader({ className = '', ...props }) {
    return (
        <div
            className={`flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/30 shrink-0 ${className}`}
            {...props}
        />
    );
}

function SheetTitle({ className = '', ...props }) {
    return (
        <DialogPrimitive.Title
            className={`text-lg font-bold leading-none tracking-tight ${className}`}
            {...props}
        />
    );
}

function SheetDescription({ className = '', ...props }) {
    return (
        <DialogPrimitive.Description
            className={`text-sm text-muted-foreground ${className}`}
            {...props}
        />
    );
}

function SheetFooter({ className = '', ...props }) {
    return (
        <div
            className={`flex gap-2 px-6 py-4 border-t border-border/20 bg-muted/20 shrink-0 ${className}`}
            {...props}
        />
    );
}

function SheetBody({ className = '', ...props }) {
    return (
        <div
            className={`flex-1 overflow-y-auto px-6 py-5 space-y-5 ${className}`}
            {...props}
        />
    );
}

export {
    Sheet,
    SheetTrigger,
    SheetClose,
    SheetPortal,
    SheetOverlay,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
    SheetBody,
};
